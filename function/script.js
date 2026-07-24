let currentDiscount = 0;

// ==========================================
// SPA VIEW ROUTER
// ==========================================
function showView(viewName) {
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
    document.getElementById(`view-${viewName}`).classList.add('active');
    
    document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
    document.querySelectorAll(`.nav-link[data-view="${viewName}"]`).forEach(el => el.classList.add('active'));

    if (viewName === 'products') loadProducts();
    if (viewName === 'cart') loadCartPage();
    if (viewName === 'purchases') loadPurchases();
    if (viewName === 'support') {
        loadMyTickets();
        // Auto-fill email if saved
        const savedEmail = localStorage.getItem('user_email');
        if(savedEmail && !document.getElementById('ticket-email').value) {
            document.getElementById('ticket-email').value = savedEmail;
        }
    }
    window.scrollTo(0, 0);
}

function toggleMobileMenu() {
    document.getElementById('mobileNav').classList.toggle('active');
    document.getElementById('mobileNavOverlay').classList.toggle('active');
}

// ==========================================
// PRODUCTS & CART
// ==========================================
async function loadProducts() {
    const grid = document.getElementById('products-grid');
    if(!grid) return;
    
    try {
        const products = await API.getProducts();
        grid.innerHTML = products.map(p => `
            <div class="product-card">
                <img src="${p.image_url ? API_BASE + p.image_url : 'https://via.placeholder.com/400x200/1e293b/6366f1?text=' + encodeURIComponent(p.name)}" 
                     class="product-img" alt="${p.name}"
                     onerror="this.src='https://via.placeholder.com/400x200/1e293b/6366f1?text=No+Image'">
                <div class="product-info">
                    <div class="product-title">${p.name}</div>
                    <div class="product-price">${p.price === 0 ? '<span class="badge-free">FREE</span>' : '$' + p.price.toFixed(2)}</div>
                    <button class="btn btn-primary btn-block" onclick="addToCart(${p.id})">
                        <i class="fas fa-cart-plus"></i> Add to Cart
                    </button>
                </div>
            </div>
        `).join('');
    } catch(e) {
        grid.innerHTML = '<p class="empty-state">Failed to load plugins. Check connection.</p>';
    }
}

function addToCart(id) {
    API.getProduct(id).then(p => {
        API.addToCart(p);
        showToast('Added to cart!', 'success');
    }).catch(() => showToast('Failed to add to cart', 'error'));
}

async function loadCartPage() {
    const container = document.getElementById('cart-content');
    if(!container) return;
    
    const cart = API.getCart();
    if(cart.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-shopping-cart"></i>
                <h3>Your cart is empty</h3>
                <p>Start shopping to add items to your cart</p>
                <button class="btn btn-primary" style="margin-top:20px;width:auto;" onclick="showView('products')">
                    <i class="fas fa-shopping-bag"></i> Browse Plugins
                </button>
            </div>
        `;
        return;
    }

    const subtotal = API.getCartTotal();
    const discountAmount = subtotal * (currentDiscount / 100);
    const total = subtotal - discountAmount;
    
    container.innerHTML = `
        <div class="cart-items">
            ${cart.map(item => `
                <div class="cart-item">
                    <div>
                        <strong>${item.name}</strong><br>
                        <small style="color:var(--text-muted)">$${item.price.toFixed(2)} x ${item.qty}</small>
                    </div>
                    <div style="display:flex;align-items:center;gap:15px;">
                        <strong>$${(item.price * item.qty).toFixed(2)}</strong>
                        <button onclick="removeFromCart(${item.id})" class="btn-icon-danger">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
        <div class="cart-summary">
            <h3>Order Summary</h3>
            <div class="summary-row"><span>Subtotal</span><strong>$${subtotal.toFixed(2)}</strong></div>
            ${currentDiscount > 0 ? `
            <div class="summary-row text-success"><span>Discount (${currentDiscount}%)</span><strong>-$${discountAmount.toFixed(2)}</strong></div>
            ` : ''}
            <div class="summary-row total-row"><span>Total</span><strong>$${total.toFixed(2)}</strong></div>
            
            <div class="form-group" style="margin-top:20px;">
                <label>Discount Code</label>
                <div style="display:flex;gap:8px;">
                    <input type="text" id="discount-code" placeholder="Enter code" class="form-control">
                    <button type="button" onclick="applyDiscount()" class="btn btn-outline">Apply</button>
                </div>
                <p id="discount-msg" style="font-size:12px;margin-top:5px;"></p>
            </div>
            
            <form id="checkout-form" onsubmit="handleCheckout(event)">
                <div class="form-group">
                    <label>Email Address *</label>
                    <input type="email" id="customer-email" placeholder="your@email.com" required class="form-control">
                </div>
                <div class="form-group">
                    <label>Full Name *</label>
                    <input type="text" id="customer-name" placeholder="John Doe" required class="form-control">
                </div>
                <button type="submit" class="btn btn-success btn-block" style="padding:16px;font-size:16px;">
                    <i class="fas fa-lock"></i> Complete Purchase
                </button>
            </form>
        </div>
    `;
}

function removeFromCart(id) {
    API.removeFromCart(id);
    loadCartPage();
}

async function applyDiscount() {
    const code = document.getElementById('discount-code').value;
    const msg = document.getElementById('discount-msg');
    try {
        const res = await API.validateDiscount(code);
        if(res.valid) {
            currentDiscount = res.percent;
            msg.style.color = 'var(--success)';
            msg.textContent = `✅ ${res.percent}% discount applied!`;
            loadCartPage();
        } else {
            currentDiscount = 0;
            msg.style.color = 'var(--danger)';
            msg.textContent = `❌ ${res.error}`;
        }
    } catch(e) { 
        msg.textContent = 'Failed to validate code'; 
    }
}

async function handleCheckout(e) {
    e.preventDefault();
    const email = document.getElementById('customer-email').value;
    const name = document.getElementById('customer-name').value;
    const cart = API.getCart();
    
    if(cart.length === 0) {
        showToast('Your cart is empty', 'error');
        return;
    }
    
    try {
        const orderData = {
            customer_name: name,
            customer_email: email,
            discount_code: document.getElementById('discount-code').value,
            items: cart.map(i => ({product_id: i.id, quantity: i.qty}))
        };
        
        const res = await API.createOrder(orderData);
        if(res.order_id) {
            API.savePurchase({
                id: res.order_id,
                date: new Date().toISOString(),
                items: cart,
                total: res.total,
                discount: currentDiscount
            });
            localStorage.setItem('user_email', email);
            API.clearCart();
            showToast('Purchase successful! Redirecting...', 'success');
            setTimeout(() => showView('purchases'), 1500);
        } else {
            throw new Error('Order failed');
        }
    } catch(err) {
        console.error('Checkout error:', err);
        showToast('Checkout failed. Please try again.', 'error');
    }
}

// ==========================================
// PURCHASES & DOWNLOADS
// ==========================================
async function loadPurchases() {
    const list = document.getElementById('purchases-list');
    if(!list) return;
    
    try {
        const purchases = await API.getPurchases();
        if(purchases.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-box-open"></i>
                    <h3>No purchases yet</h3>
                    <p>Buy a plugin to see it here</p>
                    <button class="btn btn-primary" style="margin-top:20px;width:auto;" onclick="showView('products')">
                        <i class="fas fa-shopping-bag"></i> Browse Plugins
                    </button>
                </div>
            `;
            return;
        }

        list.innerHTML = purchases.map(p => `
            <div class="purchase-card">
                <div class="purchase-date"><i class="far fa-calendar"></i> ${new Date(p.date).toLocaleDateString()}</div>
                <h3>Order #${p.id}</h3>
                ${p.items.map(item => `
                    <div class="purchase-item">
                        <div>
                            <strong>${item.name}</strong><br>
                            <small style="color:var(--text-muted)">v1.0 • .jar file</small>
                        </div>
                        <button onclick="downloadFile('${item.file_url || '/downloads/sample.jar'}', '${item.name}.jar')" class="btn btn-primary btn-sm">
                            <i class="fas fa-download"></i> Download
                        </button>
                    </div>
                `).join('')}
                <div class="purchase-total">Total: $${p.total.toFixed(2)}</div>
            </div>
        `).join('');
    } catch(e) {
        list.innerHTML = '<p class="empty-state">Failed to load purchases.</p>';
    }
}

async function downloadFile(fileUrl, filename) {
    if (!fileUrl) {
        showToast('Error: File link is missing.', 'error');
        return;
    }

    let fullUrl = fileUrl;
    if (fileUrl.startsWith('/')) {
        const base = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;
        fullUrl = base + fileUrl;
    }

    try {
        showToast('Preparing download...', 'info');
        const response = await fetch(fullUrl);
        if (!response.ok) throw new Error(`Server responded with ${response.status}`);

        const blob = await response.blob();
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = filename || 'plugin.jar';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(link.href);
        showToast('Download started!', 'success');
    } catch (error) {
        console.error('Download error:', error);
        showToast(`Download failed: ${error.message}`, 'error');
    }
}

// ==========================================
// SUPPORT TICKETS
// ==========================================
async function submitTicket(e) {
    e.preventDefault();
    const ticketData = {
        name: document.getElementById('ticket-name').value,
        email: document.getElementById('ticket-email').value,
        subject: document.getElementById('ticket-subject').value,
        category: document.getElementById('ticket-category').value,
        priority: document.getElementById('ticket-priority').value,
        message: document.getElementById('ticket-message').value
    };
    
    try {
        await API.submitTicket(ticketData);
        localStorage.setItem('user_email', ticketData.email);
        showToast('Ticket submitted successfully!', 'success');
        document.getElementById('support-form').reset();
        loadMyTickets();
    } catch (error) {
        showToast('Failed to submit ticket', 'error');
    }
}

async function loadMyTickets() {
    const list = document.getElementById('tickets-list');
    if(!list) return;
    
    const userEmail = localStorage.getItem('user_email') || document.getElementById('ticket-email')?.value;
    if (!userEmail) {
        list.innerHTML = '<p class="empty-state">Please enter your email in the form above to view tickets.</p>';
        return;
    }
    
    try {
        const tickets = await API.getUserTickets(userEmail);
        const filterStatus = document.getElementById('filter-status')?.value || 'all';
        const filteredTickets = filterStatus === 'all' ? tickets : tickets.filter(t => t.status === filterStatus);
        
        if (filteredTickets.length === 0) {
            list.innerHTML = '<p class="empty-state">No tickets found.</p>';
            return;
        }
        
        list.innerHTML = filteredTickets.map(ticket => `
            <div class="ticket-card" onclick="viewTicketDetail(${ticket.id})">
                <div class="ticket-header">
                    <div style="flex:1;">
                        <div class="ticket-title">${ticket.subject}</div>
                        <div class="ticket-meta">
                            <span><i class="far fa-calendar"></i> ${new Date(ticket.created_at).toLocaleDateString()}</span>
                            <span><i class="fas fa-folder"></i> ${ticket.category || 'General'}</span>
                        </div>
                    </div>
                    <span class="ticket-status status-${ticket.status}">${ticket.status}</span>
                </div>
                <div class="ticket-preview">${ticket.message.substring(0, 100)}${ticket.message.length > 100 ? '...' : ''}</div>
            </div>
        `).join('');
    } catch (error) {
        list.innerHTML = '<p class="empty-state">Failed to load tickets.</p>';
    }
}

function filterTickets() { loadMyTickets(); }

async function viewTicketDetail(ticketId) {
    const userEmail = localStorage.getItem('user_email');
    const tickets = await API.getUserTickets(userEmail);
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return;
    
    document.getElementById('ticket-detail-content').innerHTML = `
        <div class="ticket-detail-header">
            <h2>${ticket.subject}</h2>
            <div class="ticket-detail-meta">
                <span><i class="far fa-calendar"></i> ${new Date(ticket.created_at).toLocaleString()}</span>
                <span><i class="fas fa-folder"></i> ${ticket.category || 'General'}</span>
                <span class="ticket-status status-${ticket.status}">${ticket.status}</span>
            </div>
        </div>
        <div class="ticket-detail-body">
            <div class="ticket-message-box">
                <h4><i class="fas fa-user"></i> Your Message</h4>
                <p>${ticket.message}</p>
            </div>
            <div class="ticket-response">
                <h4><i class="fas fa-info-circle"></i> Status</h4>
                <p>Your ticket is currently <strong>${ticket.status}</strong>. ${ticket.status === 'closed' ? 'If you need further assistance, please create a new ticket.' : 'Our support team will respond soon.'}</p>
            </div>
        </div>
    `;
    document.getElementById('ticket-modal').classList.add('show');
}

// ==========================================
// UTILITIES
// ==========================================
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) e.target.classList.remove('show');
});

function showToast(msg, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i> <span>${msg}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

function toggleTheme() {
    const html = document.documentElement;
    const current = html.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    document.querySelector('.theme-toggle i').className = next === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
}

// Initialize Theme
const savedTheme = localStorage.getItem('theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);
document.querySelector('.theme-toggle i').className = savedTheme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';

// Load initial view
document.addEventListener('DOMContentLoaded', () => {
    showView('products');
});
