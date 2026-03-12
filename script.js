

let cart = [];

async function loadCart() {
    cart = await DataManager.getCart();
    return cart;
}

async function updateCartCount() {
    const cartCountElements = document.querySelectorAll('.cart-count');
    if (cartCountElements.length > 0) {
        const totalItems = await DataManager.getCartCount();
        cartCountElements.forEach(element => {
            element.textContent = totalItems;
        });
    }
}

async function addToCart(id, name, price) {
    try {
        const product = { id, name, price };
        await DataManager.addToCart(product, 1);
        await updateCartCount();
        showToast(`${name} added to cart!`);
    } catch (error) {
        showToast(error.message || 'Failed to add to cart', 'error');
    }
}

async function removeFromCart(id) {
    try {
        await DataManager.removeFromCart(id);
        await updateCartCount();
        await displayCart();
    } catch (error) {
        showToast('Failed to remove item', 'error');
    }
}

async function updateQuantity(id, change) {
    try {
        const cartItem = cart.find(item => item.id === id);
        if (!cartItem) return;
        
        const newQuantity = cartItem.quantity + change;
        
        if (newQuantity <= 0) {
            await removeFromCart(id);
            return;
        }
        
        if (change > 0) {
            const { data: product, error } = await window.supabase
                .from('products')
                .select('stock, name')
                .eq('id', id)
                .maybeSingle(); // Use maybeSingle to handle 0 rows gracefully
            
            if (error) {
                showToast('Error checking product availability', 'error');
                return;
            }
            
            if (newQuantity > product.stock) {
                showToast(`Only ${product.stock} ${product.name} available in stock!`, 'error');
                return;
            }
        }
        
        await DataManager.updateCartItem(id, newQuantity);
        await displayCart();
    } catch (error) {
        showToast('Failed to update quantity', 'error');
    }
}

async function displayCart() {
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalElement = document.getElementById('cart-total');
    if (!cartItemsContainer) return;
    
    cart = await loadCart();
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="empty-cart">
                <h2>Your cart is empty</h2>
                <p>Add some products to get started!</p>
                <a href="shop.html" class="btn btn-primary">Continue Shopping</a>
            </div>
        `;
        if (cartTotalElement) cartTotalElement.textContent = '₹0';
        return;
    }
    let total = 0;
    cartItemsContainer.innerHTML = cart.map(item => {
        total += item.price * item.quantity;
        const itemImage = item.image_url || item.image || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Crect fill=%22%23ddd%22 width=%22100%22 height=%22100%22/%3E%3Ctext fill=%22%23999%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22%3ENo Image%3C/text%3E%3C/svg%3E';
        return `
            <div class="cart-item">
                <img src="${itemImage}" alt="${item.name}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 10px;" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Crect fill=%22%23ddd%22 width=%22100%22 height=%22100%22/%3E%3Ctext fill=%22%23999%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22%3ENo Image%3C/text%3E%3C/svg%3E'">
                <div class="cart-item-details">
                    <h3>${item.name}</h3>
                    <p class="cart-item-price">₹${item.price}</p>
                </div>
                <div class="quantity-controls">
                    <button class="quantity-btn" onclick="updateQuantity('${item.id}', -1)">-</button>
                    <span>${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateQuantity('${item.id}', 1)">+</button>
                </div>
                <button class="remove-btn" onclick="removeFromCart('${item.id}')">Remove</button>
            </div>
        `;
    }).join('');
    if (cartTotalElement) {
        cartTotalElement.textContent = `₹${total}`;
    }
}

async function displayCheckoutSummary() {
    const summaryContainer = document.getElementById('checkout-summary');
    if (!summaryContainer) return;
    
    cart = await loadCart();
    
    let total = 0;
    const itemsHTML = cart.map(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        return `
            <div class="summary-item">
                <span>${item.name} x ${item.quantity}</span>
                <span>₹${itemTotal}</span>
            </div>
        `;
    }).join('');
    summaryContainer.innerHTML = `
        ${itemsHTML}
        <div class="summary-total">
            <span>Total</span>
            <span>₹${total}</span>
        </div>
    `;
}

function placeOrder(event) {
    event.preventDefault();
    const name = document.getElementById('name').value;
    const phone = document.getElementById('phone').value;
    const address = document.getElementById('address').value;
    if (!name || !phone || !address) {
        showToast('Please fill in all fields', 'error');
        return;
    }
    showToast(`Order placed successfully!\n\nThank you ${name}!\nWe will contact you at ${phone} for delivery confirmation.`);
    DataManager.clearCart();
    window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', async function() {
    await updateCartCount();
    if (document.getElementById('cart-items')) {
        await displayCart();
    }
    if (document.getElementById('checkout-summary')) {
        await displayCheckoutSummary();
    }
    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', placeOrder);
    }
});

// Auth modal functions removed - now handled by nhost-auth-handler.js
// switchTab function removed - now handled by profile-handler.js

function toggleProfileDropdown(event) {
    event.preventDefault();
    const dropdown = document.getElementById('profile-dropdown');
    dropdown.classList.toggle('active');
}
function showOrders() {
    window.location.href = 'orders.html';
}
function showProfile() {
    showToast('Profile page - Coming soon!', 'info');
    document.getElementById('profile-dropdown').classList.remove('active');
}

function logout() {
    if (typeof handleSignOut === 'function') {
        handleSignOut();
    } else {
        console.error('handleSignOut not found - check supabase-auth.js is loaded');
    }
}

window.onclick = function(event) {
    const modal = document.getElementById('auth-modal');
    const dropdown = document.getElementById('profile-dropdown');
    const hamburgerDropdown = document.getElementById('hamburger-dropdown');
    const hamburgerBtn = document.getElementById('hamburger-btn');
    if (event.target === modal) {
        closeAuthModal();
    }
    if (dropdown && !event.target.closest('#profile-btn') && !event.target.closest('.profile-dropdown')) {
        dropdown.classList.remove('active');
    }
    if (hamburgerDropdown && hamburgerBtn && !event.target.closest('#hamburger-btn') && !event.target.closest('.hamburger-dropdown')) {
        hamburgerDropdown.classList.remove('active');
        hamburgerBtn.classList.remove('active');
    }
}

document.addEventListener('DOMContentLoaded', function() {

});

async function displayOrders() {
    const ordersListContainer = document.getElementById('orders-list');
    if (!ordersListContainer) return;
    ordersListContainer.innerHTML = `
        <div style="text-align: center; padding: 3rem;">
            <p>Loading your orders...</p>
        </div>
    `;
    try {
        const { data: { user } } = await window.supabase.auth.getUser();
        if (!user) {
            ordersListContainer.innerHTML = `
                <div class="empty-orders">
                    <h2>Please Login</h2>
                    <p>You need to login to view your orders.</p>
                    <a href="index.html" class="btn btn-primary">Go to Home</a>
                </div>
            `;
            return;
        }
        const { data: orders, error } = await window.supabase
            .from('orders')
            .select('*, order_items(*)')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
        if (error) {
            console.error('Error fetching orders:', error);
            ordersListContainer.innerHTML = `
                <div class="empty-orders">
                    <h2>Error Loading Orders</h2>
                    <p>Unable to load your orders. Please try again later.</p>
                </div>
            `;
            return;
        }
        if (!orders || orders.length === 0) {
            ordersListContainer.innerHTML = `
                <div class="empty-orders">
                    <h2>No Orders Yet</h2>
                    <p>You haven't placed any orders. Start shopping to see your orders here!</p>
                    <a href="shop.html" class="btn btn-primary">Start Shopping</a>
                </div>
            `;
            return;
        }
        ordersListContainer.innerHTML = orders.map(order => {
            const orderDate = new Date(order.created_at).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
            const orderItems = order.order_items || [];
            const orderItemsHTML = orderItems.map(item => {
                const itemTotal = item.price * item.quantity;
                return `
                    <div class="order-item">
                        <img src="images/ghee.png" alt="${item.product_name}">
                        <div class="order-item-details">
                            <h4>${item.product_name}</h4>
                            <p class="order-item-quantity">Quantity: ${item.quantity}</p>
                        </div>
                        <div class="order-item-price">₹${itemTotal.toFixed(2)}</div>
                    </div>
                `;
            }).join('');
            const statusClass = order.order_status.toLowerCase();
            return `
                <div class="order-card">
                    <div class="order-header">
                        <div>
                            <div class="order-id">Order ${order.id}</div>
                            <div class="order-date">${orderDate}</div>
                        </div>
                        <div class="order-status ${statusClass}">${order.order_status}</div>
                    </div>
                    <div class="order-items">
                        ${orderItemsHTML}
                    </div>
                    <div class="order-total">
                        <span class="order-total-label">Total:</span>
                        <span class="order-total-amount">₹${parseFloat(order.total).toFixed(2)}</span>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error displaying orders:', error);
        ordersListContainer.innerHTML = `
            <div class="empty-orders">
                <h2>Error Loading Orders</h2>
                <p>Unable to load your orders. Please try again later.</p>
            </div>
        `;
    }
}

if (window.location.pathname.includes('orders.html')) {
    document.addEventListener('DOMContentLoaded', function() {
        displayOrders();
    });
}


function getShopProducts() {
    console.warn('getShopProducts is deprecated - use product-display.js loadProductsWithVendors instead');
    return [];
}

const shopProducts = [];

let currentFilter = { category: null, subcategory: null };

function filterProductsBySubcategory(category, subcategory) {
    currentFilter = { category, subcategory };
    const filteredProducts = shopProducts.filter(product => {
        return product.category === category && product.subcategory === subcategory;
    });
    renderShopProducts(filteredProducts);
    const pageHeader = document.querySelector('.page-header h1');
    if (pageHeader) {
        pageHeader.textContent = subcategory;
    }
    const pageSubtext = document.querySelector('.page-header p');
    if (pageSubtext) {
        pageSubtext.textContent = `Showing ${filteredProducts.length} products in ${subcategory}`;
    }
}

function showAllProducts() {
    currentFilter = { category: null, subcategory: null };
    renderShopProducts(shopProducts);
    const pageHeader = document.querySelector('.page-header h1');
    if (pageHeader) {
        pageHeader.textContent = 'Our Products';
    }
    const pageSubtext = document.querySelector('.page-header p');
    if (pageSubtext) {
        pageSubtext.textContent = 'Explore our range of pure organic products';
    }
}



function openAdminLogin(event) {
    if (event) event.preventDefault();
    document.getElementById('admin-modal').classList.add('active');
}
function closeAdminModal() {
    document.getElementById('admin-modal').classList.remove('active');
}
function handleAdminLoginModal(event) {
    event.preventDefault();
    const email = document.getElementById('admin-modal-email').value;
    const password = document.getElementById('admin-modal-password').value;
    const messageEl = document.getElementById('admin-modal-message');
    if (email === 'admin@gousamhitha.com' && password === 'admin123') {
        localStorage.setItem('adminLoggedIn', 'true');
        messageEl.textContent = 'Login successful! Redirecting to admin dashboard...';
        messageEl.className = 'auth-message success';
        setTimeout(() => {
            window.location.href = 'admin-dashboard.html';
        }, 1000);
    } else {
        messageEl.textContent = 'Invalid admin credentials';
        messageEl.className = 'auth-message error';
    }
}

window.addEventListener('click', function(event) {
    const adminModal = document.getElementById('admin-modal');
    if (event.target === adminModal) {
        closeAdminModal();
    }
});

function handleSearch() {
    const searchInput = document.querySelector('.main-search-bar');
    const searchBtn = document.querySelector('.search-btn');
    if (!searchInput || !searchBtn) return;

    const autocompleteContainer = document.createElement('div');
    autocompleteContainer.className = 'autocomplete-container';
    autocompleteContainer.style.cssText = `
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: white;
        border: 1px solid #ddd;
        border-top: none;
        border-radius: 0 0 8px 8px;
        max-height: 200px;
        overflow-y: auto;
        z-index: 1000;
        display: none;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    `;

    const searchSection = searchInput.closest('.search-section');
    if (searchSection) {
        searchSection.style.position = 'relative';
        searchSection.appendChild(autocompleteContainer);
    }
    
    let debounceTimer;
    
    searchInput.addEventListener('input', function(e) {
        const query = e.target.value.trim();
        
        clearTimeout(debounceTimer);
        
        if (query.length < 2) {
            autocompleteContainer.style.display = 'none';
            return;
        }
        
        debounceTimer = setTimeout(() => {
            showAutocomplete(query, autocompleteContainer, searchInput);
        }, 300);
    });
    
    searchInput.addEventListener('blur', function() {
        setTimeout(() => {
            autocompleteContainer.style.display = 'none';
        }, 200);
    });
    
    searchBtn.addEventListener('click', function(e) {
        e.preventDefault();
        performSearch();
    });
    
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            autocompleteContainer.style.display = 'none';
            performSearch();
        }
    });
}

async function showAutocomplete(query, container, searchInput) {
    try {
        const { data: products, error } = await window.supabase
            .from('products')
            .select('name, category')
            .or(`name.ilike.%${query}%,category.ilike.%${query}%`)
            .eq('in_stock', true)
            .limit(8);
        
        if (error) {
            console.error('Autocomplete error:', error);
            return;
        }
        
        if (!products || products.length === 0) {
            container.style.display = 'none';
            return;
        }

        const suggestions = [...new Set(products.map(p => p.name))];
        
        container.innerHTML = suggestions.map(suggestion => `
            <div class="autocomplete-item" style="
                padding: 12px 16px;
                cursor: pointer;
                border-bottom: 1px solid #f0f0f0;
                transition: background-color 0.2s;
                font-size: 14px;
                color: #333;
            " onmouseover="this.style.backgroundColor='#f5f5f5'" 
               onmouseout="this.style.backgroundColor='white'"
               onclick="selectSuggestion('${suggestion.replace(/'/g, "\\'")}')">
                <div style="font-weight: 500;">${suggestion}</div>
            </div>
        `).join('');
        
        container.style.display = 'block';
        
    } catch (error) {
        console.error('Autocomplete error:', error);
    }
}

function selectSuggestion(suggestion) {
    const searchInput = document.querySelector('.main-search-bar');
    if (searchInput) {
        searchInput.value = suggestion;
        const autocompleteContainer = document.querySelector('.autocomplete-container');
        if (autocompleteContainer) {
            autocompleteContainer.style.display = 'none';
        }
        performSearch();
    }
}
async function performSearch() {
    const searchInput = document.querySelector('.main-search-bar');
    const searchTerm = searchInput.value.trim().toLowerCase();
    if (!searchTerm) {
        showToast('Please enter a search term', 'error');
        return;
    }
    
    try {
        const { data: products, error } = await window.supabase
            .from('products')
            .select('*')
            .or(`name.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%,subcategory.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
            .eq('in_stock', true);
        
        if (error) {
            console.error('Search error:', error);
            showToast('Error searching products. Please try again.', 'error');
            return;
        }
        
        sessionStorage.setItem('searchResults', JSON.stringify(products || []));
        sessionStorage.setItem('searchTerm', searchTerm);
        window.location.href = 'shop.html';
    } catch (error) {
        console.error('Search error:', error);
        showToast('Error searching products. Please try again.', 'error');
    }
}

function displaySearchResults() {
    const searchResults = sessionStorage.getItem('searchResults');
    const searchTerm = sessionStorage.getItem('searchTerm');
    if (searchResults && searchTerm) {
        const products = JSON.parse(searchResults);
        
        const pageHeader = document.querySelector('.page-header h1');
        if (pageHeader) {
            pageHeader.textContent = `Search Results for "${searchTerm}"`;
        }
        
        if (products.length === 0) {
            const pageSubtext = document.querySelector('.page-header p');
            if (pageSubtext) {
                pageSubtext.textContent = `No products found matching your search`;
            }
            
            if (typeof window.displayProducts === 'function') {
                window.displayProducts([]);
            }
        } else {
            const pageSubtext = document.querySelector('.page-header p');
            if (pageSubtext) {
                pageSubtext.textContent = `Found ${products.length} product(s) matching your search`;
            }
            
            if (typeof window.displayProducts === 'function') {
                window.displayProducts(products);
            }
        }
        
        sessionStorage.removeItem('searchResults');
        sessionStorage.removeItem('searchTerm');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    handleSearch();
    if (window.location.pathname.includes('shop.html')) {
        displaySearchResults();
    }
});


const ADMIN_EMAIL = 'ruthvik@blockfortrust.com';
const ADMIN_PASSWORD = 'Saireddy880227';



function checkUserRole() {
    const email = document.getElementById('signin-email')?.value.trim();
    const password = document.getElementById('signin-password')?.value.trim();
    if (!email || !password) {
        hideRoleButtons();
        return;
    }
    if (email === ADMIN_EMAIL) {
        hideRoleButtons();
    } else {
        hideRoleButtons();
    }
}

function showRoleButtons(role) {
    const roleButtonsDiv = document.getElementById('role-buttons');
    const adminBtn = document.getElementById('admin-enter-btn');
    const defaultBtn = document.getElementById('default-signin-btn');
    if (!roleButtonsDiv || !adminBtn || !defaultBtn) return;
    defaultBtn.style.display = 'none';
    roleButtonsDiv.style.display = 'block';
    if (role === 'admin') {
        adminBtn.style.display = 'block';
    } else {
        hideRoleButtons();
    }
}

function hideRoleButtons() {
    const roleButtonsDiv = document.getElementById('role-buttons');
    const adminBtn = document.getElementById('admin-enter-btn');
    const defaultBtn = document.getElementById('default-signin-btn');
    if (!roleButtonsDiv || !adminBtn || !defaultBtn) return;
    roleButtonsDiv.style.display = 'none';
    adminBtn.style.display = 'none';
    defaultBtn.style.display = 'block';
}

function enterAsAdmin() {
    const email = document.getElementById('signin-email').value.trim();
    const password = document.getElementById('signin-password').value.trim();
    const messageEl = document.getElementById('signin-message');
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        localStorage.setItem('currentUser', email);
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userRole', 'admin');
        messageEl.textContent = 'Logging in as Admin...';
        messageEl.className = 'auth-message success';
        messageEl.style.display = 'block';
        setTimeout(() => {
            window.location.href = 'admin-dashboard.html';
        }, 1000);
        return;
    }
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.email === email && u.password === password && u.role === 'admin');
    if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userRole', 'admin');
        messageEl.textContent = 'Logging in as Admin...';
        messageEl.className = 'auth-message success';
        messageEl.style.display = 'block';
        setTimeout(() => {
            window.location.href = 'admin-dashboard.html';
        }, 1000);
    } else {
        messageEl.textContent = 'Invalid admin credentials';
        messageEl.className = 'auth-message error';
        messageEl.style.display = 'block';
    }
}






