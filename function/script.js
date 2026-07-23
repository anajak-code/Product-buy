let currentDiscount = 0;

// Load Products
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
                    <div class="product-price">$${p.price.toFixed(2)}</div>
                    <button class="btn btn-primary" onclick="addToCart(${p.id})">
                        <i class="fas fa-cart-plus"></i> Add to Cart
                    </button>
                </div>
            </div>
        `).join('');
    } catch(e) {
        grid.innerHTML = '<p class="loading-spinner">Failed to load plugins. Check connection.</p>';
    }
}

// Add to Cart
function addToCart(id) {
    API.getProduct(id).then(p => {
        API.addToCart(p);
        showToast('Added to cart!', 'success');
    }).catch(() => showToast('Failed to add to cart', 'error'));
}

// Load Cart Page
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
                <a href="../products/" class="btn btn-primary" style="margin-top:20px;width:auto;">
                    <i class="fas fa-shopping-bag"></i> Browse Plugins
                </a>
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
                        <button onclick="removeFromCart(${item.id})" 
                                style="background:none;border:none;color:var(--danger);cursor:pointer;font-size:18px;">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
        <div class="cart-summary">
            <h3 style="margin-bottom:20px;">Order Summary</h3>
            <div style="display:flex;justify-content:space-between;margin-bottom:15px;">
                <span>Subtotal</span>
                <strong>$${subtotal.toFixed(2)}</strong>
            </div>
            ${currentDiscount > 0 ? `
            <div style="display:flex;justify-content:space-between;margin-bottom:15px;color:var(--success);">
                <span>Discount (${currentDiscount}%)</span>
                <strong>-$${discountAmount.toFixed(2)}</strong>
            </div>
            ` : ''}
            <div style="display:flex;justify-content:space-between;margin-bottom:20px;padding-top:15px;border-top:2px solid var(--border);">
                <span style="font-size:18px;">Total</span>
                <strong style="font-size:24px;color:var(--primary);">$${total.toFixed(2)}</strong>
            </div>
            
            <div style="margin-bottom:15px;">
                <label style="display:block;margin-bottom:8px;font-weight:600;">Discount Code</label>
                <div style="display:flex;gap:8px;">
                    <input type="text" id="discount-code" placeholder="Enter code" class="form-control" style="flex:1;">
                    <button type="button" onclick="applyDiscount()" class="btn btn-outline">Apply</button>
                </div>
                <p id="discount-msg" style="font-size:12px;margin-top:5px;"></p>
            </div>
            
            <form id="checkout-form" onsubmit="handleCheckout(event)">
                <div style="margin-bottom:15px;">
                    <label style="display:block;margin-bottom:8px;font-weight:600;">Email Address *</label>
                    <input type="email" id="customer-email" placeholder="your@email.com" required 
                           class="form-control" style="width:100%;padding:12px;background:var(--bg-dark);border:1px solid var(--border);color:white;border-radius:8px;">
                </div>
                <div style="margin-bottom:15px;">
                    <label style="display:block;margin-bottom:8px;font-weight:600;">Full Name *</label>
                    <input type="text" id="customer-name" placeholder="John Doe" required 
                           class="form-control" style="width:100%;padding:12px;background:var(--bg-dark);border:1px solid var(--border);color:white;border-radius:8px;">
                </div>
                <button type="submit" class="btn btn-success" style="width:100%;padding:16px;font-size:16px;">
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

// Apply Discount
async function applyDiscount() {
    const code = document.getElementById('discount-code').value;
    const msg = document.getElementById('discount-msg');
    
    try {
        const res = await API.validateDiscount(code);
        
        if(res.valid) {
            currentDiscount = res.percent;
            msg.style.color = 'var(--success)';
            msg.textContent = `✅ ${res.percent}% discount applied!`;
            loadCartPage(); // Recalculate total
        } else {
            currentDiscount = 0;
            msg.style.color = 'var(--danger)';
            msg.textContent = `❌ ${res.error}`;
        }
    } catch(e) { 
        msg.textContent = 'Failed to validate code'; 
    }
}

// Handle Checkout
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
            
            setTimeout(() => {
                window.location.href = '../purchase/';
            }, 1500);
        } else {
            throw new Error('Order failed');
        }
    } catch(err) {
        console.error('Checkout error:', err);
        showToast('Checkout failed. Please try again.', 'error');
    }
}

// Load Purchases
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
                    <a href="../products/" class="btn btn-primary" style="margin-top:20px;width:auto;">
                        <i class="fas fa-shopping-bag"></i> Browse Plugins
                    </a>
                </div>
            `;
            return;
        }

        list.innerHTML = purchases.map(p => `
            <div class="purchase-card">
                <div class="purchase-date">
                    <i class="far fa-calendar"></i> ${new Date(p.date).toLocaleDateString()}
                </div>
                <h3 style="margin-bottom:15px;">Order #${p.id}</h3>
                ${p.items.map(item => `
                    <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid var(--border);">
                        <div>
                            <strong>${item.name}</strong><br>
                            <small style="color:var(--text-muted)">v1.0 • .jar file</small>
                        </div>
                        <button onclick="downloadFile('${item.file_url || '/downloads/sample.jar'}', '${item.name}.jar')" 
                                class="btn btn-primary" style="width:auto;padding:8px 16px;font-size:13px;">
                            <i class="fas fa-download"></i> Download
                        </button>
                    </div>
                `).join('')}
                <div style="text-align:right;margin-top:15px;font-weight:700;color:var(--primary);">
                    Total: $${p.total.toFixed(2)}
                </div>
            </div>
        `).join('');
    } catch(e) {
        list.innerHTML = '<p class="loading-spinner">Failed to load purchases.</p>';
    }
}

// Download File
async function downloadFile(url, filename) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Network response was not ok');
        
        const blob = await response.blob();
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = filename;
        
        document.body.appendChild(link);
        link.click();
        
        document.body.removeChild(link);
        window.URL.revokeObjectURL(link.href);
        
        showToast('Download started!', 'success');
    } catch (error) {
        console.error('Download failed:', error);
        showToast('Download failed. Please try again.', 'error');
    }
}

// Submit Ticket
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
        
        setTimeout(() => {
            window.location.href = '../tickets/';
        }, 1500);
        
    } catch (error) {
        console.error('Error submitting ticket:', error);
        showToast('Failed to submit ticket', 'error');
    }
}

// Load My Tickets
async function loadMyTickets() {
    const list = document.getElementById('tickets-list');
    if(!list) return;
    
    const userEmail = localStorage.getItem('user_email');
    
    if (!userEmail) {
        list.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-envelope"></i>
                <h3>No Email Found</h3>
                <p>Please submit a ticket first to see your tickets here.</p>
                <a href="../support/" class="btn btn-primary" style="margin-top: 20px;width:auto;">
                    <i class="fas fa-plus"></i> Create Ticket
                </a>
            </div>
        `;
        return;
    }
    
    try {
        const tickets = await API.getUserTickets(userEmail);
        
        if (tickets.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-ticket-alt"></i>
                    <h3>No Tickets Yet</h3>
                    <p>You haven't submitted any support tickets.</p>
                    <a href="../support/" class="btn btn-primary" style="margin-top: 20px;width:auto;">
                        <i class="fas fa-plus"></i> Create Your First Ticket
                    </a>
                </div>
            `;
            return;
        }
        
        const filterStatus = document.getElementById('filter-status');
        const currentFilter = filterStatus ? filterStatus.value : 'all';
        
        const filteredTickets = currentFilter === 'all' 
            ? tickets 
            : tickets.filter(t => t.status === currentFilter);
        
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
                <div class="ticket-preview">
                    ${ticket.message.substring(0, 150)}${ticket.message.length > 150 ? '...' : ''}
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading tickets:', error);
        list.innerHTML = '<p class="loading-spinner">Failed to load tickets.</p>';
    }
}

// Filter Tickets
function filterTickets() {
    loadMyTickets();
}

// View Ticket Detail
async function viewTicketDetail(ticketId) {
    const userEmail = localStorage.getItem('user_email');
    const tickets = await API.getUserTickets(userEmail);
    const ticket = tickets.find(t => t.id === ticketId);
    
    if (!ticket) return;
    
    const modal = document.getElementById('ticket-modal');
    const content = document.getElementById('ticket-detail-content');
    
    content.innerHTML = `
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
            
            ${ticket.status === 'open' ? `
                <div class="ticket-response">
                    <h4><i class="fas fa-info-circle"></i> Status Update</h4>
                    <p>Your ticket is currently <strong>open</strong>. Our support team will respond within 24 hours.</p>
                </div>
            ` : ticket.status === 'pending' ? `
                <div class="ticket-response">
                    <h4><i class="fas fa-clock"></i> Pending Response</h4>
                    <p>We're working on your issue. Please check back soon.</p>
                </div>
            ` : `
                <div class="ticket-response">
                    <h4><i class="fas fa-check-circle"></i> Resolved</h4>
                    <p>This ticket has been marked as <strong>closed</strong>. If you need further assistance, please create a new ticket.</p>
                </div>
            `}
        </div>
    `;
    
    modal.classList.add('show');
}

// Close Modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if(modal) {
        modal.classList.remove('show');
    }
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('show');
    }
});

// Toast Notification
function showToast(msg, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${msg}</span>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}
