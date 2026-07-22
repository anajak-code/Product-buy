// ============================================
// API Configuration
// ============================================

const API_BASE = 'https://api.anajakcode.site';

const API = {
    // ---- PRODUCTS ----
    getProducts: () => 
        fetch(`${API_BASE}/api/products`).then(r => r.json()),

    getProduct: (id) => 
        fetch(`${API_BASE}/api/products/${id}`).then(r => r.json()),

    // ---- ORDERS ----
    createOrder: (data) => 
        fetch(`${API_BASE}/api/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }).then(r => r.json()),

    // ---- USER ----
    register: (data) => 
        fetch(`${API_BASE}/api/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }).then(r => r.json()),

    login: (email, password) => 
        fetch(`${API_BASE}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        }).then(r => r.json()),

    // ---- TRACKING ----
    trackView: () => 
        fetch(`${API_BASE}/api/track-view`, {
            method: 'POST'
        }).then(r => r.json())
};

// ============================================
// Cart Management (LocalStorage)
// ============================================

const Cart = {
    get: () => {
        const cart = localStorage.getItem('shopping_cart');
        return cart ? JSON.parse(cart) : [];
    },

    add: (product, quantity = 1) => {
        const cart = Cart.get();
        const existingItem = cart.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image_url: product.image_url,
                quantity: quantity
            });
        }
        
        localStorage.setItem('shopping_cart', JSON.stringify(cart));
        Cart.updateCount();
    },

    remove: (productId) => {
        let cart = Cart.get();
        cart = cart.filter(item => item.id !== productId);
        localStorage.setItem('shopping_cart', JSON.stringify(cart));
        Cart.updateCount();
    },

    updateQuantity: (productId, quantity) => {
        const cart = Cart.get();
        const item = cart.find(item => item.id === productId);
        
        if (item) {
            if (quantity > 0) {
                item.quantity = quantity;
            } else {
                Cart.remove(productId);
            }
        }
        
        localStorage.setItem('shopping_cart', JSON.stringify(cart));
        Cart.updateCount();
    },

    clear: () => {
        localStorage.removeItem('shopping_cart');
        Cart.updateCount();
    },

    getTotal: () => {
        const cart = Cart.get();
        return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    },

    getCount: () => {
        const cart = Cart.get();
        return cart.reduce((count, item) => count + item.quantity, 0);
    },

    updateCount: () => {
        const countElements = document.querySelectorAll('.cart-count');
        const count = Cart.getCount();
        countElements.forEach(el => {
            el.textContent = count;
            if (count > 0) {
                el.style.display = 'inline-block';
            } else {
                el.style.display = 'none';
            }
        });
    }
};

// Initialize cart count on load
document.addEventListener('DOMContentLoaded', () => {
    Cart.updateCount();
});