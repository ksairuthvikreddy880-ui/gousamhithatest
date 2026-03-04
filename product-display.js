
async function loadProductsWithVendors() {
    const productGrid = document.querySelector('.product-grid');
    const homeProductGrid = document.getElementById('home-product-grid');
    const targetGrid = productGrid || homeProductGrid;
    if (!targetGrid) return;
    targetGrid.innerHTML = '<div style="text-align: center; padding: 2rem; color: #666;">Loading products...</div>';
    
    // Use backend API instead of Supabase
    const API_URL = 'http://localhost:5000/api';
    
    try {
        // Fetch products from backend API
        const response = await fetch(`${API_URL}/products`);
        if (!response.ok) {
            throw new Error('Failed to fetch products');
        }
        
        const result = await response.json();
        const products = result.products || [];
        
        if (!products || products.length === 0) {
            const message = homeProductGrid ? 
                'No products available yet. Check back soon!' : 
                'No products available yet. Admin needs to add products.';
            targetGrid.innerHTML = `
                <div class="empty-state" style="text-align: center; padding: 3rem; grid-column: 1/-1;">
                    <div style="font-size: 4rem; margin-bottom: 1rem;">📦</div>
                    <div style="font-size: 1.2rem; color: #666;">${message}</div>
                </div>
            `;
            return;
        }
        
        let filteredProducts = products;
        if (productGrid && !homeProductGrid) {
            const urlParams = new URLSearchParams(window.location.search);
            const categoryParam = urlParams.get('category');
            if (categoryParam) {
                filteredProducts = products.filter(product => product.category === categoryParam);
                if (filteredProducts.length === 0) {
                    targetGrid.innerHTML = `
                        <div class="empty-state" style="text-align: center; padding: 3rem; grid-column: 1/-1;">
                            <div style="font-size: 4rem; margin-bottom: 1rem;">🔍</div>
                            <div style="font-size: 1.2rem; color: #666;">No products found in "${categoryParam}" category.</div>
                        </div>
                    `;
                    return;
                }
            }
        }
        
        const displayProducts = homeProductGrid ? products.slice(0, 4) : filteredProducts;
        
        // Fetch vendors from backend API
        const vendorsResponse = await fetch(`${API_URL}/vendors`);
        const vendorsResult = await vendorsResponse.json();
        const vendors = vendorsResult.vendors || [];
        
        targetGrid.innerHTML = displayProducts.map(product => {
            let vendorInfo = { vendorName: 'Gousamhitha', businessName: 'Gousamhitha Farm' };
            if (product.vendor_id && vendors) {
                const vendor = vendors.find(v => v.id === product.vendor_id);
                if (vendor) {
                    vendorInfo = {
                        vendorName: vendor.vendor_name || vendor.business_name,
                        businessName: vendor.business_name
                    };
                }
            }
            const stockStatus = product.stock > 0 ? 'In Stock' : 'Out of Stock';
            const stockClass = product.stock > 0 ? 'in-stock' : 'out-of-stock';
            const isAvailable = product.stock > 0;
            const unitDisplay = product.display_unit || (product.unit_quantity ? product.unit_quantity + product.unit : product.unit || '');
            return `
                <div class="product-card">
                    <img src="${product.image_url || 'images/placeholder.png'}" alt="${product.name}">
                    <div class="vendor-info" style="font-size: 0.8rem; color: #888; margin: 0.8rem 0 0.3rem 0; padding: 0.4rem 0.6rem; background: #f5f5f5; border-radius: 4px; border-left: 3px solid #4a7c59;">
                        <div style="font-weight: 600; color: #4a7c59;">Vendor: ${vendorInfo.vendorName}</div>
                        <div style="font-size: 0.75rem; margin-top: 0.2rem;">${vendorInfo.businessName}</div>
                    </div>
                    <h3 style="margin: 0.8rem 0 0.3rem 0; font-size: 1.1rem; color: #333;">${product.name}</h3>
                    ${unitDisplay ? `<p style="color: #666; font-size: 0.85rem; margin: 0.2rem 0; font-weight: 500;">${unitDisplay}</p>` : ''}
                    <p class="price" style="font-size: 1.3rem; font-weight: 700; color: #4a7c59; margin: 0.5rem 0;">₹${product.price}</p>
                    ${!isAvailable ? 
                        `<div style="margin: 0.5rem 0; padding: 0.5rem; background: #ffebee; border-radius: 8px; border: 1px solid #ef5350;">
                            <p style="color: #d32f2f; font-weight: 700; font-size: 0.95rem; margin: 0; text-align: center;">OUT OF STOCK</p>
                        </div>` : 
                        `<div class="stock-status" style="margin: 0.5rem 0;">
                            <span class="status-badge ${stockClass}" style="padding: 0.3rem 0.8rem; border-radius: 15px; font-size: 0.75rem; font-weight: 600; display: inline-block;">
                                ${stockStatus} ${product.stock > 0 ? `(${product.stock} left)` : ''}
                            </span>
                        </div>`
                    }
                    ${isAvailable ? 
                        `<div class="quantity-selector" style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin: 1rem 0;">
                            <button onclick="decreaseQuantity('${product.id}')" class="quantity-btn" style="width: 35px; height: 35px; border: 1px solid #4a7c59; background: white; color: #4a7c59; border-radius: 5px; font-size: 1.2rem; cursor: pointer; font-weight: bold;">-</button>
                            <input type="number" id="qty-${product.id}" value="1" min="1" max="${product.stock}" style="width: 60px; height: 35px; text-align: center; border: 1px solid #ddd; border-radius: 5px; font-size: 1rem;" readonly>
                            <button onclick="increaseQuantity('${product.id}', ${product.stock})" class="quantity-btn" style="width: 35px; height: 35px; border: 1px solid #4a7c59; background: white; color: #4a7c59; border-radius: 5px; font-size: 1.2rem; cursor: pointer; font-weight: bold;">+</button>
                        </div>
                        <button onclick="addToCartWithQuantity('${product.id}')" class="btn btn-primary" style="display: block; width: 100%; text-align: center; margin: 0.5rem 0;">Add to Cart</button>` :
                        `<button class="btn btn-secondary" style="display: block; width: 100%; text-align: center; margin: 1rem 0; opacity: 0.5; cursor: not-allowed;" disabled>Out of Stock</button>`
                    }
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading products:', error);
        targetGrid.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #d32f2f; grid-column: 1/-1;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
                <div style="font-size: 1.2rem; margin-bottom: 0.5rem;">Cannot connect to server</div>
                <div style="font-size: 0.9rem; color: #666;">Please make sure the backend server is running on port 5000</div>
                <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #4a7c59; color: white; border: none; border-radius: 5px; cursor: pointer;">Retry</button>
            </div>
        `;
    }
}


async function increaseQuantity(productId, maxStock) {
    const qtyInput = document.getElementById(`qty-${productId}`);
    if (qtyInput) {
        let currentQty = parseInt(qtyInput.value);
        
        try {

            const currentCart = await DataManager.getCart();
            const existingCartItem = currentCart.find(item => item.id === productId);
            const currentCartQuantity = existingCartItem ? existingCartItem.quantity : 0;
            const maxAllowedToAdd = maxStock - currentCartQuantity;
            
            if (currentQty < maxAllowedToAdd && currentQty < maxStock) {
                qtyInput.value = currentQty + 1;
            } else if (maxAllowedToAdd <= 0) {
                showToast(`Maximum quantity (${maxStock}) already in cart!`, 'error');
            } else {
                showToast(`Only ${maxAllowedToAdd} more can be added to cart!`, 'error');
            }
        } catch (error) {

            if (currentQty < maxStock) {
                qtyInput.value = currentQty + 1;
            }
        }
    }
}

function decreaseQuantity(productId) {
    const qtyInput = document.getElementById(`qty-${productId}`);
    if (qtyInput) {
        let currentQty = parseInt(qtyInput.value);
        if (currentQty > 1) {
            qtyInput.value = currentQty - 1;
        }
    }
}

function addToCartWithQuantity(productId) {
    checkAuthAndExecute(async () => {
        const qtyInput = document.getElementById(`qty-${productId}`);
        const quantity = qtyInput ? parseInt(qtyInput.value) : 1;
        
        try {

            const { data: product, error } = await window.supabase
                .from('products')
                .select('*')
                .eq('id', productId)
                .single();
            
            if (error || !product) {
                showToast('Product not found!', 'error');
                return;
            }

            await DataManager.addToCart(product, quantity);
            if (typeof updateCartCount === 'function') {
                updateCartCount();
            }
            showToast(`${quantity} x ${product.name} added to cart!`);
            if (qtyInput) {
                qtyInput.value = 1;
            }
        } catch (error) {
            console.error('Error adding to cart:', error);
            showToast(error.message || 'Error adding product to cart', 'error');
        }
    });
}

async function checkAuthAndExecute(callback) {
    if (!window.supabase) {
        showToast('Please wait for the page to load completely', 'error');
        return;
    }
    
    try {
        const { data: { user }, error } = await window.supabase.auth.getUser();
        
        if (error || !user) {
            const authModal = document.getElementById('auth-modal');
            if (authModal) {
                authModal.classList.add('active');
                const signinTab = document.querySelector('.auth-tab');
                if (signinTab) {
                    signinTab.click();
                }
                const messageEl = document.getElementById('signin-message');
                if (messageEl) {
                    messageEl.textContent = 'Please sign in to add items to cart';
                    messageEl.className = 'auth-message';
                    messageEl.style.display = 'block';
                    messageEl.style.color = '#4a7c59';
                    messageEl.style.background = '#e8f5e9';
                    messageEl.style.padding = '0.8rem';
                    messageEl.style.borderRadius = '5px';
                    messageEl.style.marginBottom = '1rem';
                }
            }
            return;
        }
        
        callback();
    } catch (error) {
        console.error('Auth check error:', error);
        showToast('Please sign in to continue', 'error');
    }
}


function addToCartFromShop(productId) {
    addToCartWithQuantity(productId);
}


function highlightActiveCategory() {
    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get('category');
    if (!categoryParam) return;
    const pageHeader = document.querySelector('.page-header h1');
    if (pageHeader) {
        pageHeader.textContent = categoryParam;
    }
    const categoryLinks = document.querySelectorAll('.shop-category-nav .category-link');
    categoryLinks.forEach(link => {
        if (link.textContent.trim() === categoryParam) {
            link.style.color = '#4a7c59';
            link.style.fontWeight = 'bold';
        }
    });
}


document.addEventListener('DOMContentLoaded', async function() {
    if (document.querySelector('.product-grid') || document.getElementById('home-product-grid')) {
        let retries = 0;
        while (typeof window.supabase === 'undefined' && retries < 20) {
            await new Promise(resolve => setTimeout(resolve, 100));
            retries++;
        }
        
        if (typeof window.supabase === 'undefined') {
            const targetGrid = document.querySelector('.product-grid') || document.getElementById('home-product-grid');
            if (targetGrid) {
                targetGrid.innerHTML = '<div style="text-align: center; padding: 2rem; color: #d32f2f;">Database connection error. Please refresh the page.</div>';
            }
            return;
        }
        
        await loadProductsWithVendors();
        highlightActiveCategory();
    }
});

window.refreshProducts = function() {
    loadProductsWithVendors();
};

window.displayProducts = async function(searchProducts) {
    const productGrid = document.querySelector('.product-grid');
    if (!productGrid) return;
    
    if (!searchProducts || searchProducts.length === 0) {
        productGrid.innerHTML = `
            <div class="empty-state" style="text-align: center; padding: 3rem; grid-column: 1/-1;">
                <div style="font-size: 4rem; margin-bottom: 1rem;">🔍</div>
                <div style="font-size: 1.2rem; color: #666;">No products found matching your search.</div>
            </div>
        `;
        return;
    }
    
    try {
        const { data: vendors } = await window.supabase
            .from('vendors')
            .select('*');
        
        productGrid.innerHTML = searchProducts.map(product => {
            let vendorInfo = { vendorName: 'Gousamhitha', businessName: 'Gousamhitha Farm' };
            if (product.vendor_id && vendors) {
                const vendor = vendors.find(v => v.id === product.vendor_id);
                if (vendor) {
                    vendorInfo = {
                        vendorName: vendor.vendor_name || vendor.business_name,
                        businessName: vendor.business_name
                    };
                }
            }
            const stockStatus = product.stock > 0 ? 'In Stock' : 'Out of Stock';
            const stockClass = product.stock > 0 ? 'in-stock' : 'out-of-stock';
            const isAvailable = product.stock > 0;
            const unitDisplay = product.display_unit || (product.unit_quantity ? product.unit_quantity + product.unit : product.unit || '');
            return `
                <div class="product-card">
                    <img src="${product.image_url || 'images/placeholder.png'}" alt="${product.name}">
                    <div class="vendor-info" style="font-size: 0.8rem; color: #888; margin: 0.8rem 0 0.3rem 0; padding: 0.4rem 0.6rem; background: #f5f5f5; border-radius: 4px; border-left: 3px solid #4a7c59;">
                        <div style="font-weight: 600; color: #4a7c59;">Vendor: ${vendorInfo.vendorName}</div>
                        <div style="font-size: 0.75rem; margin-top: 0.2rem;">${vendorInfo.businessName}</div>
                    </div>
                    <h3 style="margin: 0.8rem 0 0.3rem 0; font-size: 1.1rem; color: #333;">${product.name}</h3>
                    ${unitDisplay ? `<p style="color: #666; font-size: 0.85rem; margin: 0.2rem 0; font-weight: 500;">${unitDisplay}</p>` : ''}
                    <p class="price" style="font-size: 1.3rem; font-weight: 700; color: #4a7c59; margin: 0.5rem 0;">₹${product.price}</p>
                    ${!isAvailable ? 
                        `<div style="margin: 0.5rem 0; padding: 0.5rem; background: #ffebee; border-radius: 8px; border: 1px solid #ef5350;">
                            <p style="color: #d32f2f; font-weight: 700; font-size: 0.95rem; margin: 0; text-align: center;">OUT OF STOCK</p>
                        </div>` : 
                        `<div class="stock-status" style="margin: 0.5rem 0;">
                            <span class="status-badge ${stockClass}" style="padding: 0.3rem 0.8rem; border-radius: 15px; font-size: 0.75rem; font-weight: 600; display: inline-block;">
                                ${stockStatus} ${product.stock > 0 ? `(${product.stock} left)` : ''}
                            </span>
                        </div>`
                    }
                    ${isAvailable ? 
                        `<div class="quantity-selector" style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin: 1rem 0;">
                            <button onclick="decreaseQuantity('${product.id}')" class="quantity-btn" style="width: 35px; height: 35px; border: 1px solid #4a7c59; background: white; color: #4a7c59; border-radius: 5px; font-size: 1.2rem; cursor: pointer; font-weight: bold;">-</button>
                            <input type="number" id="qty-${product.id}" value="1" min="1" max="${product.stock}" style="width: 60px; height: 35px; text-align: center; border: 1px solid #ddd; border-radius: 5px; font-size: 1rem;" readonly>
                            <button onclick="increaseQuantity('${product.id}', ${product.stock})" class="quantity-btn" style="width: 35px; height: 35px; border: 1px solid #4a7c59; background: white; color: #4a7c59; border-radius: 5px; font-size: 1.2rem; cursor: pointer; font-weight: bold;">+</button>
                        </div>
                        <button onclick="addToCartWithQuantity('${product.id}')" class="btn btn-primary" style="display: block; width: 100%; text-align: center; margin: 0.5rem 0;">Add to Cart</button>` :
                        `<button class="btn btn-secondary" style="display: block; width: 100%; text-align: center; margin: 1rem 0; opacity: 0.5; cursor: not-allowed;" disabled>Out of Stock</button>`
                    }
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error displaying search results:', error);
        productGrid.innerHTML = '<div style="text-align: center; padding: 2rem; color: #d32f2f;">Error displaying search results.</div>';
    }
};