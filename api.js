const API_BASE = 'https://api.anajakcode.site';

const API = {
    getProducts: () => fetch(`${API_BASE}/api/products`).then(r => r.json()),
    getProduct: (id) => fetch(`${API_BASE}/api/products/${id}`).then(r => r.json()),
    createOrder: (data) => fetch(`${API_BASE}/api/orders`, {
        method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)
    }).then(r => r.json()),
    
    // Simulated Purchase History (Replace with real API later)
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

// Cart Management
const Cart = {
    get: () => JSON.parse(localStorage.getItem('cart') || '[]'),
    add: (product) => {
        const cart = Cart.get();
        const existing = cart.find(i => i.id === product.id);
        if(existing) existing.qty++; else cart.push({...product, qty: 1});
        localStorage.setItem('cart', JSON.stringify(cart));
        Cart.updateCount();
    },
    remove: (id) => {
        const cart = Cart.get().filter(i => i.id !== id);
        localStorage.setItem('cart', JSON.stringify(cart));
        Cart.updateCount();
    },
    clear: () => { localStorage.removeItem('cart'); Cart.updateCount(); },
    getTotal: () => Cart.get().reduce((sum, i) => sum + (i.price * i.qty), 0),
    updateCount: () => {
        const count = Cart.get().reduce((s, i) => s + i.qty, 0);
        document.querySelectorAll('#cart-count').forEach(el => el.textContent = count);
    }
};

document.addEventListener('DOMContentLoaded', Cart.updateCount);
