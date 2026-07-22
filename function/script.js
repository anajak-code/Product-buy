// ============================================
// USER FRONTEND - MAIN FUNCTIONS
// ============================================

// ---- HOME PAGE ----
async function loadProducts(searchQuery = '') {
    const grid = document.getElementById('products-grid');
    if (!grid) return;

    try {
        let products = await API.getProducts();
        
        if (searchQuery) {
            products = products.filter(p => 
                p.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (products.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-box-open"></i>
                    <p>No products found</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = products.map(product => `
            <div class="product-card">
                <img src="${product.image_url ? API_BASE + product.image_url : 'https://via.placeholder.com/300'}" 
                     alt="${product.name}" 
                     class="product-image"
                     onerror="this.src='https://via.placeholder.com/300'">
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <div class="product-price">$${product.price.toFixed(2)}</div>
                    <div class="product-stock ${product.stock > 0 ? '' : 'out-of-stock'}">
                        ${product.stock > 0 ? `✓ In Stock (${product.stock})` : '✗ Out of Stock'}
                    </div>
                    <button class="btn btn-primary btn-block" 
                            onclick="addToCart(${product.id})"
                            ${product.stock === 0 ? 'disabled' : ''}>
                        <i class="fas fa-cart-plus"></i> Add to Cart
                    </button>
                    <a href="product?id=${product.id}" class="btn btn-sm" style="margin-top:10px;width:100%;text-align:center;">
                        View Details
                    </a>
                </div>
            </div>
        `).join('');
    } catch (err) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Failed to load products. Please try again later.</p>
            </div>
        `;
    }
}

function searchProducts() {
    const query = document.getElementById('search-input').value;
    loadProducts(query);
}

// ---- PRODUCT DETAILS ----
async function loadProductDetails(productId) {
    const content = document.getElementById('product-content');
    if (!content) return;

    try {
        const product = await API.getProduct(productId);
        
        content.innerHTML = `
            <img src="${product.image_url ? API_BASE + product.image_url : 'https://via.placeholder.com/500'}" 
                 alt="${product.name}" 
                 class="product-image-large"
                 onerror="this.src='https://via.placeholder.com/500'">
            <div class="product-info-large">
                <h1>${product.name}</h1>
                <div class="product-price-large">$${product.price.toFixed(2)}</div>
                <div class="product-stock ${product.stock > 0 ? 'text-success' : 'text-danger'}" style="margin-bottom:20px;">
                    ${product.stock > 0 ? `✓ In Stock (${product.stock} available)` : '✗ Out of Stock'}
                </div>
                <div class="product-description">
                    <h3>Description</h3>
                    <p>${product.description || 'No description available.'}</p>
                </div>
                <div class="quantity-selector">
                    <label>Quantity:</label>
                    <input type="number" id="product-quantity" value="1" min="1" max="${product.stock}">
                </div>
                <button class="btn btn-primary btn-lg" 
                        onclick="addProductToCart(${product.id})"
                        ${product.stock === 0 ? 'disabled' : ''}>
                    <i class="fas fa-shopping-cart"></i> Add to Cart
                </button>
            </div>
        `;

        // Load related products (random 4 products)
        loadRelatedProducts(productId);
    } catch (err) {
        content.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Product not found</p>
                <a href="./" class="btn btn-primary" style="margin-top:20px;">Back to Home</a>
            </div>
        `;
    }
}

async function loadRelatedProducts(currentId) {
    try {
        const allProducts = await API.getProducts();
        const related = allProducts.filter(p => p.id != currentId).slice(0, 4);
        
        const grid = document.getElementById('related-products-grid');
        if (grid && related.length > 0) {
            grid.innerHTML = related.map(product => `
                <div class="product-card">
                    <img src="${product.image_url ? API_BASE + product.image_url : 'https://via.placeholder.com/300'}" 
                         alt="${product.name}" 
                         class="product-image">
                    <div class="product-info">
                        <h3 class="product-name">${product.name}</h3>
                        <div class="product-price">$${product.price.toFixed(2)}</div>
                        <a href="product?id=${product.id}" class="btn btn-primary btn-sm btn-block">View</a>
                    </div>
                </div>
            `).join('');
        }
    } catch (err) {
        console.error('Failed to load related products');
    }
}

// ---- CART FUNCTIONS ----
function addToCart(productId) {
    API.getProduct(productId).then(product => {
        Cart.add(product, 1);
        showToast('Product added to cart!', 'success');
    });
}

function addProductToCart(productId) {
    const quantity = parseInt(document.getElementById('product-quantity').value) || 1;
    API.getProduct(productId).then(product => {
        Cart.add(product, quantity);
        showToast(`${quantity} item(s) added to cart!`, 'success');
    });
}

function loadCartPage() {
    const content = document.getElementById('cart-content');
    if (!content) return;

    const cart = Cart.get();
    
    if (cart.length === 0) {
        content.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-shopping-cart"></i>
                <h2>Your cart is empty</h2>
                <p>Start shopping to add items to your cart</p>
                <a href="./" class="btn btn-primary" style="margin-top:20px;">Continue Shopping</a>
            </div>
        `;
        return;
    }

    const total = Cart.getTotal();
    
    content.innerHTML = `
        <div class="cart-items">
            ${cart.map(item => `
                <div class="cart-item">
                    <img src="${item.image_url ? API_BASE + item.image_url : 'https://via.placeholder.com/100'}" 
                         alt="${item.name}" 
                         class="cart-item-image">
                    <div class="cart-item-info">
                        <h3>${item.name}</h3>
                        <div class="cart-item-price">$${item.price.toFixed(2)}</div>
                        <div class="cart-item-quantity">
                            <button onclick="updateCartItem(${item.id}, ${item.quantity - 1})">-</button>
                            <span>${item.quantity}</span>
                            <button onclick="updateCartItem(${item.id}, ${item.quantity + 1})">+</button>
                            <button onclick="removeCartItem(${item.id})" style="margin-left:15px;color:var(--danger);">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-weight:700;font-size:18px;">$${(item.price * item.quantity).toFixed(2)}</div>
                    </div>
                </div>
            `).join('')}
        </div>
        <div class="cart-summary">
            <h2>Order Summary</h2>
            <div class="cart-summary-row">
                <span>Subtotal</span>
                <span>$${total.toFixed(2)}</span>
            </div>
            <div class="cart-summary-row">
                <span>Shipping</span>
                <span>Free</span>
            </div>
            <div class="cart-summary-total">
                <span>Total</span>
                <span>$${total.toFixed(2)}</span>
            </div>
            <a href="checkout" class="btn btn-primary btn-block btn-lg" style="margin-top:20px;">
                Proceed to Checkout
            </a>
        </div>
    `;
}

function updateCartItem(productId, quantity) {
    if (quantity <= 0) {
        removeCartItem(productId);
    } else {
        Cart.updateQuantity(productId, quantity);
        loadCartPage();
    }
}

function removeCartItem(productId) {
    if (confirm('Remove this item from cart?')) {
        Cart.remove(productId);
        loadCartPage();
        updateCartCount();
    }
}

function loadCheckoutItems() {
    const cart = Cart.get();
    const container = document.getElementById('checkout-items');
    const totalEl = document.getElementById('checkout-total');
    
    if (cart.length === 0) {
        window.location.href = './cart';
        return;
    }

    const total = Cart.getTotal();
    
    container.innerHTML = cart.map(item => `
        <div class="checkout-item">
            <span>${item.name} x ${item.quantity}</span>
            <span>$${(item.price * item.quantity).toFixed(2)}</span>
        </div>
    `).join('');
    
    totalEl.textContent = `$${total.toFixed(2)}`;
}

async function placeOrder(e) {
    e.preventDefault();
    
    const cart = Cart.get();
    if (cart.length === 0) {
        showToast('Your cart is empty!', 'error');
        return;
    }

    const orderData = {
        customer_name: document.getElementById('customer-name').value,
        customer_email: document.getElementById('customer-email').value,
        customer_phone: document.getElementById('customer-phone').value,
        items: cart.map(item => ({
            product_id: item.id,
            quantity: item.quantity
        }))
    };

    try {
        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

        const result = await API.createOrder(orderData);
        
        if (result.order_id) {
            Cart.clear();
            showToast('Order placed successfully!', 'success');
            setTimeout(() => {
                window.location.href = './';
            }, 2000);
        } else {
            throw new Error(result.error || 'Failed to create order');
        }
    } catch (err) {
        showToast(err.message || 'Failed to place order', 'error');
        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-check"></i> Place Order';
    }
}

// ---- UTILITIES ----
function updateCartCount() {
    Cart.updateCount();
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === 'success' ? 'var(--success)' : type === 'error' ? 'var(--danger)' : 'var(--info)'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 9999;
        animation: slideIn 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function toggleCartSidebar() {
    const sidebar = document.getElementById('cart-sidebar');
    if (sidebar) {
        sidebar.classList.toggle('open');
    }
}

// Add CSS animation for toast
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);
