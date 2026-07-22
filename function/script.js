// Load Products
async function loadProducts() {
    const grid = document.getElementById('products-grid');
    try {
        const products = await API.getProducts();
        grid.innerHTML = products.map(p => `
            <div class="product-card">
                <img src="${p.image_url ? API_BASE + p.image_url : 'https://via.placeholder.com/400x200/1e293b/6366f1?text=' + encodeURIComponent(p.name)}" class="product-img" alt="${p.name}">
                <div class="product-info">
                    <div class="product-title">${p.name}</div>
                    <div class="product-price">$${p.price.toFixed(2)}</div>
                    <button class="btn btn-primary" onclick="addToCart(${p.id})"><i class="fas fa-cart-plus"></i> Add to Cart</button>
                    <a href="../products/?id=${p.id}" class="btn btn-outline">View Details</a>
                </div>
            </div>
        `).join('');
    } catch(e) { grid.innerHTML = '<p class="loading-spinner">Failed to load plugins. Check connection.</p>'; }
}

// Add to Cart
function addToCart(id) {
    API.getProduct(id).then(p => {
        Cart.add(p);
        showToast('Added to cart!', 'success');
    });
}

// Load Cart Page
async function loadCartPage() {
    const container = document.getElementById('cart-content');
    const cart = Cart.get();
    
    if(cart.length === 0) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-shopping-cart"></i><h3>Your cart is empty</h3><a href="../products/" class="btn btn-primary" style="margin-top:20px;width:auto;">Browse Plugins</a></div>`;
        return;
    }

    const total = Cart.getTotal();
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
                        <button onclick="removeFromCart(${item.id})" style="background:none;border:none;color:var(--danger);cursor:pointer;"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `).join('')}
        </div>
        <div class="cart-summary">
            <h3 style="margin-bottom:20px;">Order Summary</h3>
            <div style="display:flex;justify-content:space-between;margin-bottom:20px;">
                <span>Total</span>
                <strong style="font-size:20px;color:var(--primary);">$${total.toFixed(2)}</strong>
            </div>
            <form id="checkout-form" onsubmit="handleCheckout(event)">
                <div style="margin-bottom:15px;">
                    <input type="email" id="customer-email" placeholder="Your Email" required class="form-control" style="width:100%;padding:12px;background:var(--bg-dark);border:1px solid var(--border);color:white;border-radius:8px;">
                </div>
                <button type="submit" class="btn btn-success"><i class="fas fa-lock"></i> Checkout & Pay</button>
            </form>
        </div>
    `;
}

function removeFromCart(id) {
    Cart.remove(id);
    loadCartPage();
}

// Handle Checkout
async function handleCheckout(e) {
    e.preventDefault();
    const email = document.getElementById('customer-email').value;
    const cart = Cart.get();
    
    try {
        const orderData = {
            customer_name: 'Customer',
            customer_email: email,
            items: cart.map(i => ({product_id: i.id, quantity: i.qty}))
        };
        
        const res = await API.createOrder(orderData);
        if(res.order_id) {
            // Save to local purchases for download access
            API.savePurchase({
                id: res.order_id,
                date: new Date().toISOString(),
                items: cart,
                total: res.total
            });
            
            Cart.clear();
            window.location.href = '../purchase/';
        }
    } catch(err) {
        showToast('Checkout failed. Please try again.', 'error');
    }
}

// Load Purchases
async function loadPurchases() {
    const list = document.getElementById('purchases-list');
    try {
        const purchases = await API.getPurchases();
        
        if(purchases.length === 0) {
            list.innerHTML = '<div class="empty-state"><i class="fas fa-box-open"></i><h3>No purchases yet</h3><p>Buy a plugin to see it here.</p></div>';
            return;
        }

        list.innerHTML = purchases.map(p => `
            <div class="purchase-card">
                <div class="purchase-date"><i class="far fa-calendar"></i> ${new Date(p.date).toLocaleDateString()}</div>
                <h3 style="margin-bottom:15px;">Order #${p.id}</h3>
                ${p.items.map(item => `
                    <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid var(--border);">
                        <div>
                            <strong>${item.name}</strong><br>
                            <small style="color:var(--text-muted)">v1.0 • .jar file</small>
                        </div>
                        <a href="${API_BASE}${item.file_url || '/uploads/sample.jar'}" download class="btn btn-primary" style="width:auto;padding:8px 16px;font-size:13px;">
                            <i class="fas fa-download"></i> Download
                        </a>
                    </div>
                `).join('')}
                <div style="text-align:right;margin-top:15px;font-weight:700;color:var(--primary);">Total: $${p.total.toFixed(2)}</div>
            </div>
        `).join('');
    } catch(e) { list.innerHTML = '<p class="loading-spinner">Failed to load purchases.</p>'; }
}

// Toast Notification
function showToast(msg, type) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}
