const API_BASE = 'https://api.anajakcode.site';

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
    
    // Support Tickets
    submitTicket: (data) => fetch(`${API_BASE}/api/support`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    }).then(r => r.json()),
    
    getUserTickets: (email) => fetch(`${API_BASE}/api/support/tickets?email=${encodeURIComponent(email)}`)
        .then(r => r.json())
        .catch(() => {
            const tickets = localStorage.getItem(`tickets_${email}`);
            return Promise.resolve(tickets ? JSON.parse(tickets) : []);
        }),
    
    // Cart Management
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
    
    getCartTotal: () => {
        return API.getCart().reduce((sum, i) => sum + (i.price * i.qty), 0);
    },
    
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
    },
    
    // User Tickets (LocalStorage fallback)
    saveTicket: (email, ticket) => {
        const tickets = JSON.parse(localStorage.getItem(`tickets_${email}`) || '[]');
        const ticketWithId = {
            ...ticket,
            id: Date.now(),
            created_at: new Date().toISOString()
        };
        tickets.unshift(ticketWithId);
        localStorage.setItem(`tickets_${email}`, JSON.stringify(tickets));
        return ticketWithId;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    API.updateCartCount();
});
