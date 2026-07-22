// ============================================
// ANAJAKCODE - USER FRONTEND MAIN SCRIPT
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    Cart.updateCount();
});

// ============================================
// NAVIGATION & SEARCH
// ============================================

function searchProducts() {
    const query = document.getElementById('search-input').value;
    loadProducts(query);
}

// Allow Enter key to search
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchProducts();
            }
        });
    }
});

// ============================================
// HOME PAGE - LOAD PRODUCTS
// ============================================

async function loadProducts(searchQuery = '') {
    const grid = document.getElementById('products-grid');
    if (!grid) return;

    grid.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>Loading amazing products...</p>
        </div>
    `;

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
                    <h3>No products found</h3>
                    <p>Try adjusting your search terms</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = products.map(product => `
            <div class="product-card">
                <div class="product-image-wrapper">
                    <img src="${product.image_url ? API_BASE + product.image_url : 'https://via.placeholder.com/400x400/f1f5f9/64748b?text=No+Image'}" 
                         alt="${product.name}" 
                         class="product-image"
                         onerror="this.src='https://via.placeholder.com/400x400/f1f5f9/64748b?text=No+Image'">
                </div>
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <div class="product-price">$${product.price.toFixed(2)}</div>
                    <div class="product-stock ${product.stock > 0 ? '' : 'out-of-stock'}">
                        <i class="fas ${product.stock > 0 ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                        ${product.stock > 0 ? `In Stock (${product.stock})` : 'Out of Stock'}
                    </div>
                    <button class="btn btn-primary btn-block" 
                            onclick="addToCart(${product.id})"
                            ${product.stock === 0 ? 'disabled' : ''}>
                        <i class="fas fa-cart-plus"></i> Add to Cart
                    </button>
                    <a href="product?id=${product.id}" class="btn btn-outline btn-block" style="margin-top:10px;">
                        <i class="fas fa-eye"></i> View Details
                    </a>
                </div>
            </div>
        `).join('');
    } catch (err) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Connection Error</h3>
                <p>Failed to load products. Please check your internet connection.</p>
            </div>
        `;
    }
}

// ============================================
// PRODUCT DETAILS PAGE
// ============================================

async function loadProductDetails(productId) {
    const content = document.getElementById('product-content');
    if (!content) return;

    content.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>Loading product details...</p>
        </div>
    `;

    try {
        const product = await API.getProduct(productId);
        
        content.innerHTML = `
            <div class="product-image-section">
                <img src="${product.image_url ? API_BASE + product.image_url : 'https://via.placeholder.com/600x600/f1f5f9/64748b?text=No+Image'}" 
                     alt="${product.name}" 
                     class="product-image-large"
                     onerror="this.src='https://via.placeholder.com/600x600/f1f5f9/64748b?text=No+Image'">
            </div>
            <div class="product-info-large">
                <h1>${product.name}</h1>
                <div class="product-price-large">$${product.price.toFixed(2)}</div>
                <div class="product-stock ${product.stock > 0 ? '' : 'out-of-stock'}" style="margin-bottom:24px; font-size:15px;">
                    <i class="fas ${product.stock > 0 ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                    ${product.stock > 0 ? `In Stock (${product.stock} available)` : 'Out of Stock'}
                </div>
                <div class="product-description">
                    <h3 style="margin-bottom:12px; font-size:18px;">Description</h3>
                    <p>${product.description || 'No description available for this product.'}</p>
                </div>
                <div class="quantity-selector">
                    <label>Quantity:</label>
                    <input type="number" id="product-quantity" value="1" min="1" max="${product.stock > 0 ? product.stock : 1}">
                </div>
                <button class="btn btn-primary btn-lg btn-block" 
                        onclick="addProductToCart(${product.id})"
                        ${product.stock === 0 ? 'disabled' : ''}
                        style="margin-top:10px;">
                    <i class="fas fa-shopping-cart"></i> Add to Cart
                </button>
            </div>
        `;

        // Load related products
        loadRelatedProducts(productId);
    } catch (err) {
        content.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Product Not Found</h3>
                <p>The product you're looking for doesn't exist.</p>
                <a href="/" class="btn btn-primary" style="margin-top:20px;">
                    <i class="fas fa-home"></i> Back to Home
                </a>
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
                    <div class="product-image-wrapper">
                        <img src="${product.image_url ? API_BASE + product.image_url : 'https://via.placeholder.com/400x400/f1f5f9/64748b?text=No+Image'}" 
                             alt="${product.name}" 
                             class="product-image"
                             onerror="this.src='https://via.placeholder.com/400x400/f1f5f9/64748b?text=No+Image'">
                    </div>
                    <div class="product-info">
                        <h3 class="product-name">${product.name}</h3>
                        <div class="product-price">$${product.price.toFixed(2)}</div>
                        <a href="product?id=${product.id}" class="btn btn-primary btn-sm btn-block">
                            <i class="fas fa-eye"></i> View Details
                        </a>
                    </div>
                </div>
            `).join('');
        } else if (grid) {
            grid.innerHTML = `
                <div class="empty-state">
                    <p>No related products available</p>
                </div>
            `;
        }
    } catch (err) {
        console.error('Failed to load related products');
    }
}

// ============================================
// CART FUNCTIONS
// ============================================

function addToCart(productId) {
    API.getProduct(productId).then(product => {
        Cart.add(product, 1);
        showToast('Product added to cart!', 'success');
    }).catch(err => {
        showToast('Failed to add product', 'error');
    });
}

function addProductToCart(productId) {
    const quantityInput = document.getElementById('product-quantity');
    const quantity = parseInt(quantityInput.value) || 1;
    
    API.getProduct(productId).then(product => {
        Cart.add(product, quantity);
        showToast(`${quantity} item(s) added to cart!`, 'success');
    }).catch(err => {
        showToast('Failed to add product', 'error');
    });
}

function loadCartPage() {
    const content = document.getElementById('cart-content');
    if (!content) return;

    const cart = Cart.get();
    
    if (cart.length === 0) {
        content.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <i class="fas fa-shopping-bag"></i>
                <h3>Your cart is empty</h3>
                <p>Start shopping to add items to your cart</p>
                <a href="/" class="btn btn-primary" style="margin-top:20px;">
                    <i class="fas fa-shopping-bag"></i> Continue Shopping
                </a>
            </div>
        `;
        return;
    }

    const total = Cart.getTotal();
    const itemCount = Cart.getCount();
    
    content.innerHTML = `
        <div class="cart-items">
            ${cart.map(item => `
                <div class="cart-item">
                    <img src="${item.image_url ? API_BASE + item.image_url : 'https://via.placeholder.com/100'}" 
                         alt="${item.name}" 
                         class="cart-item-image"
                         onerror="this.src='https://via.placeholder.com/100'">
                    <div class="cart-item-info">
                        <h3>${item.name}</h3>
                        <div class="cart-item-price">$${item.price.toFixed(2)}</div>
                        <div class="cart-item-quantity">
                            <button onclick="updateCartItem(${item.id}, ${item.quantity - 1})">-</button>
                            <span>${item.quantity}</span>
                            <button onclick="updateCartItem(${item.id}, ${item.quantity + 1})">+</button>
                            <button onclick="removeCartItem(${item.id})" style="margin-left:15px; color:var(--danger); border-color:var(--danger);" title="Remove">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-weight:700; font-size:20px; color:var(--primary);">$${(item.price * item.quantity).toFixed(2)}</div>
                    </div>
                </div>
            `).join('')}
        </div>
        <div class="cart-summary">
            <h2>Order Summary</h2>
            <div class="cart-summary-row">
                <span>Items (${itemCount})</span>
                <span>$${total.toFixed(2)}</span>
            </div>
            <div class="cart-summary-row">
                <span>Shipping</span>
                <span style="color:var(--success); font-weight:600;">Free</span>
            </div>
            <div class="cart-summary-total">
                <span>Total</span>
                <span>$${total.toFixed(2)}</span>
            </div>
            <a href="checkout" class="btn btn-primary btn-block btn-lg" style="margin-top:24px;">
                <i class="fas fa-lock"></i> Proceed to Checkout
            </a>
            <a href="/" class="btn btn-outline btn-block" style="margin-top:12px;">
                <i class="fas fa-arrow-left"></i> Continue Shopping
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
        showToast('Item removed from cart', 'info');
    }
}

// ============================================
// CHECKOUT PAGE
// ============================================

function loadCheckoutItems() {
    const cart = Cart.get();
    const container = document.getElementById('checkout-items');
    const totalEl = document.getElementById('checkout-total');
    
    if (cart.length === 0) {
        window.location.href = 'cart';
        return;
    }

    const total = Cart.getTotal();
    
    container.innerHTML = cart.map(item => `
        <div class="checkout-item">
            <span>${item.name} x ${item.quantity}</span>
            <span style="font-weight:600;">$${(item.price * item.quantity).toFixed(2)}</span>
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

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

        const result = await API.createOrder(orderData);
        
        if (result.order_id) {
            Cart.clear();
            showToast('Order placed successfully! Thank you.', 'success');
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);
        } else {
            throw new Error(result.error || 'Failed to create order');
        }
    } catch (err) {
        showToast(err.message || 'Failed to place order', 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

// ============================================
// CART SIDEBAR (Home Page)
// ============================================

function toggleCartSidebar() {
    const sidebar = document.getElementById('cart-sidebar');
    if (sidebar) {
        sidebar.classList.toggle('open');
    }
}

// Close sidebar when clicking outside
document.addEventListener('click', (e) => {
    const sidebar = document.getElementById('cart-sidebar');
    if (sidebar && sidebar.classList.contains('open')) {
        if (!sidebar.contains(e.target) && !e.target.closest('.cart-icon')) {
            sidebar.classList.remove('open');
        }
    }
});

// ============================================
// UTILITIES
// ============================================

function updateCartCount() {
    Cart.updateCount();
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icon = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
    toast.innerHTML = `<i class="fas ${icon}"></i> <span>${message}</span>`;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.4s ease';
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

// ============================================
// SMOOTH SCROLL FOR ANCHOR LINKS
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId !== '#' && targetId.length > 1) {
                const target = document.querySelector(targetId);
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });
});
