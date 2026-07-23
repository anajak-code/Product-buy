const API_BASE = 'https://api.anajakcode.site'; // Update with your tunnel URL

const API = {
    // Products
    getProducts: () => fetch(`${API_BASE}/api/products`).then(r => r.json()),
    getProduct: (id) => fetch(`${API_BASE}/api/products/${id}`).then(r => r.json()),
    
    // Orders
    createOrder: (data) => fetch(`${API_BASE}/api/orders`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    }).then(r => r.json()),
    
    // Discount
    validateDiscount: (code) => fetch(`${API_BASE}/api/discount/validate`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({code})
    }).then(r => r.json()),
    
    // Auth
    register: (data) => fetch(`${API_BASE}/api/register`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    }).then(r => r.json()),
    
    login: (data) => fetch(`${API_BASE}/api/login`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    }).then(r => r.json()),
    
    // Support
    submitTicket: (data) => fetch(`${API_BASE}/api/support`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    }).then(r => r.json()),
    
    getUserTickets: (email) => fetch(`${API_BASE}/api/support/tickets?email=${encodeURIComponent(email)}`).then(r => r.json()),
    
    // Cart (LocalStorage)
    getCart: () => JSON.parse(localStorage.getItem('cart') || '[]'),
    addToCart: (product) => {
        const cart = API.getCart();
        const existing = cart.find(i => i.id === product.id);
        if(existing) existing.qty++; else cart.push({...product, qty: 1});
        localStorage.setItem('cart', JSON.stringify(cart));
        API.updateCartCount();
    },
    removeFromCart: (id) => {
        const cart = API.getCart().filter(i => i.id !== id);
        localStorage.setItem('cart', JSON.stringify(cart));
        API.updateCartCount();
    },
    clearCart: () => { localStorage.removeItem('cart'); API.updateCartCount(); },
    getCartTotal: () => API.getCart().reduce((sum, i) => sum + (i.price * i.qty), 0),
    updateCartCount: () => {
        const count = API.getCart().reduce((s, i) => s + i.qty, 0);
        document.querySelectorAll('#cart-count').forEach(el => el.textContent = count);
    },
    
    // Purchase History
    getPurchases: () => {
        const purchases = localStorage.getItem('user_purchases');
        return Promise.resolve(purchases ? JSON.parse(purchases) : []);
    },
    savePurchase: (order) => {
        const purchases = JSON.parse(localStorage.getItem('user_purchases') || '[]');
        purchases.unshift(order);
        localStorage.setItem('user_purchases', JSON.stringify(purchases));
    }
};

document.addEventListener('DOMContentLoaded', () => API.updateCartCount());
