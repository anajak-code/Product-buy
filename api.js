const API_BASE = 'https://api.anajakcode.site'; // ✅ ប្តូរទៅជា URL Tunnel របស់អ្នក

const API = {
    getProducts: () => fetch(`${API_BASE}/api/products`).then(r => r.json()),
    getProduct: (id) => fetch(`${API_BASE}/api/products/${id}`).then(r => r.json()),
    
    createOrder: (data) => fetch(`${API_BASE}/api/orders`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    }).then(r => r.json()),
    
    validateDiscount: (code) => fetch(`${API_BASE}/api/discount/validate`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({code})
    }).then(r => r.json()),
    
    submitTicket: (data) => fetch(`${API_BASE}/api/support`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    }).then(r => r.json()),
    
    getUserTickets: (email) => fetch(`${API_BASE}/api/support/tickets?email=${encodeURIComponent(email)}`).then(r => r.json()),
    
    // Cart Management (LocalStorage)
    getCart: () => JSON.parse(localStorage.getItem('cart') || '[]'),
    addToCart: (product) => {
        const cart = API.getCart();
        const existing = cart.find(i => i.id === product.id);
        if(existing) {
            existing.qty++;
        } else {
            cart.push({...product, qty: 1});
        }
        localStorage.setItem('cart', JSON.stringify(cart));
        API.updateCartCount();
    },
    removeFromCart: (id) => {
        const cart = API.getCart().filter(i => i.id !== id);
        localStorage.setItem('cart', JSON.stringify(cart));
        API.updateCartCount();
    },
    clearCart: () => { 
        localStorage.removeItem('cart'); 
        API.updateCartCount(); 
    },
    getCartTotal: () => API.getCart().reduce((sum, i) => sum + (i.price * i.qty), 0),
    updateCartCount: () => {
        const count = API.getCart().reduce((s, i) => s + i.qty, 0);
        document.querySelectorAll('#cart-count, #mobile-cart-count').forEach(el => {
            if(el) el.textContent = count;
        });
    },
    
    // Purchase History (LocalStorage)
    getPurchases: () => JSON.parse(localStorage.getItem('user_purchases') || '[]'),
    savePurchase: (order) => {
        const purchases = API.getPurchases();
        purchases.unshift(order);
        localStorage.setItem('user_purchases', JSON.stringify(purchases));
    }
};

// Initialize cart count on load
document.addEventListener('DOMContentLoaded', () => API.updateCartCount());
