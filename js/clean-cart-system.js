// Clean Cart System - Simple and reliable cart functionality
(function() {
    'use strict';
    
    console.log('🛒 Clean Cart System loading...');
    
    class CleanCartSystem {
        constructor() {
            this.isUpdating = false;
        }
        
        init() {
            console.log('🛒 Initializing clean cart system');
            
            // Wait for Supabase and DOM
            this.waitForReady();
        }
        
        waitForReady() {
            const checkReady = () => {
                if (window.supabase && document.getElementById('cart-items')) {
                    console.log('🛒 System ready, loading cart');
                    this.loadCart();
                    this.setupEventHandlers();
                } else {
                    setTimeout(checkReady, 500);
                }
            };
            checkReady();
        }
        
        async loadCart() {
            const cartItemsDiv = document.getElementById('cart-items');
            
            if (!window.supabase) {
                console.log('🛒 Supabase not ready, showing fallback cart');
                cartItemsDiv.innerHTML = `
                    <div class="empty-cart" style="text-align: center; padding: 40px;">
                        <p style="font-size: 18px; margin-bottom: 20px;">Cart is loading...</p>
                        <p style="color: #666; font-size: 14px;">If this takes too long, please refresh the page</p>
                    </div>
                `;
                return;
            }
            
            try {
                // Check if user is logged in
                const { data: { user }, error: authError } = await window.supabase.auth.getUser();
                
                if (authError) {
                    console.log('🛒 Auth error, showing login prompt:', authError);
                    cartItemsDiv.innerHTML = `
                        <div class="empty-cart" style="text-align: center; padding: 40px;">
                            <p style="font-size: 18px; margin-bottom: 20px;">Please login to view your cart</p>
                            <button onclick="openAuthModal()" class="btn btn-primary" style="padding: 12px 24px; background: #4a7c59; color: white; border: none; border-radius: 8px; cursor: pointer;">Login</button>
                        </div>
                    `;
                    return;
                }
                
                if (!user) {
                    console.log('🛒 No user logged in, showing login prompt');
                    cartItemsDiv.innerHTML = `
                        <div class="empty-cart" style="text-align: center; padding: 40px;">
                            <p style="font-size: 18px; margin-bottom: 20px;">Please login to view your cart</p>
                            <button onclick="openAuthModal()" class="btn btn-primary" style="padding: 12px 24px; background: #4a7c59; color: white; border: none; border-radius: 8px; cursor: pointer;">Login</button>
                        </div>
                    `;
                    return;
                }
                
                console.log('🛒 Fetching cart for user:', user.id);
                
                // Fetch cart items with product details
                const { data: cartItems, error } = await window.supabase
                    .from('cart')
                    .select(`
                        id,
                        quantity,
                        products (
                            id,
                            name,
                            price,
                            image_url,
                            stock,
                            display_unit
                        )
                    `)
                    .eq('user_id', user.id);
                
                if (error) {
                    console.error('🛒 Error loading cart:', error);
                    cartItemsDiv.innerHTML = `
                        <div class="empty-cart" style="text-align: center; padding: 40px;">
                            <p style="font-size: 18px; margin-bottom: 20px; color: #d32f2f;">Error loading cart</p>
                            <p style="color: #666; font-size: 14px; margin-bottom: 20px;">There was an issue loading your cart items</p>
                            <button onclick="window.location.reload()" class="btn btn-primary" style="padding: 12px 24px; background: #4a7c59; color: white; border: none; border-radius: 8px; cursor: pointer;">Retry</button>
                        </div>
                    `;
                    return;
                }
                
                console.log('🛒 Cart items loaded:', cartItems);
                
                if (!cartItems || cartItems.length === 0) {
                    cartItemsDiv.innerHTML = `
                        <div class="empty-cart" style="text-align: center; padding: 40px;">
                            <p style="font-size: 18px; margin-bottom: 20px;">Your cart is empty</p>
                            <a href="shop.html" class="btn btn-primary" style="display: inline-block; padding: 12px 24px; background: #4a7c59; color: white; text-decoration: none; border-radius: 8px;">Start Shopping</a>
                        </div>
                    `;
                    this.updateCartCount(0);
                    return;
                }
                
                // Calculate total
                let total = 0;
                let totalItems = 0;
                
                // Display cart items
                const cartHTML = cartItems.map(item => {
                    const product = item.products;
                    if (!product) {
                        console.warn('🛒 Product not found for cart item:', item.id);
                        return '';
                    }
                    
                    const itemTotal = product.price * item.quantity;
                    total += itemTotal;
                    totalItems += item.quantity;
                    
                    return `
                        <div class="cart-item" data-cart-id="${item.id}" style="display: flex; align-items: center; padding: 20px; border-bottom: 1px solid #eee; gap: 20px;">
                            <img src="${product.image_url || 'images/placeholder.png'}" alt="${product.name}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px;">
                            <div class="cart-item-details" style="flex: 1;">
                                <h3 style="margin: 0 0 5px 0; font-size: 18px;">${product.name}</h3>
                                ${product.display_unit ? `<p style="color: #666; margin: 0 0 8px 0; font-size: 14px;">${product.display_unit}</p>` : ''}
                                <p class="cart-item-price" style="color: #4a7c59; margin: 0; font-size: 16px; font-weight: 600;">₹${product.price}</p>
                            </div>
                            <div class="cart-item-quantity" style="display: flex; align-items: center; gap: 10px;">
                                <button class="qty-btn minus-btn" data-cart-id="${item.id}" data-current="${item.quantity}" data-max="${product.stock}" style="width: 35px; height: 35px; border: 2px solid #4a7c59; background: white; border-radius: 6px; cursor: pointer; font-size: 18px; font-weight: bold; color: #4a7c59;">-</button>
                                <span class="quantity-display" style="min-width: 40px; text-align: center; font-weight: 600; font-size: 16px;">${item.quantity}</span>
                                <button class="qty-btn plus-btn" data-cart-id="${item.id}" data-current="${item.quantity}" data-max="${product.stock}" style="width: 35px; height: 35px; border: 2px solid #4a7c59; background: white; border-radius: 6px; cursor: pointer; font-size: 18px; font-weight: bold; color: #4a7c59;">+</button>
                            </div>
                            <div class="cart-item-total" style="text-align: right; min-width: 120px;">
                                <p class="item-total" style="font-size: 18px; font-weight: 600; margin: 0 0 10px 0;">₹${itemTotal.toFixed(2)}</p>
                                <button class="remove-btn" data-cart-id="${item.id}" style="padding: 8px 16px; background: #d32f2f; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;">Remove</button>
                            </div>
                        </div>
                    `;
                }).filter(html => html !== '').join('');
                
                const summaryHTML = `
                    <div class="cart-summary" style="padding: 30px; background: #f9f9f9; margin-top: 20px; border-radius: 8px;">
                        <h3 class="cart-total" style="margin: 0 0 20px 0; font-size: 24px;">Cart Total: ₹${total.toFixed(2)}</h3>
                        <button onclick="proceedToCheckout()" class="btn btn-primary checkout-btn" style="width: 100%; padding: 14px 28px; background: #4a7c59; color: white; border: none; border-radius: 8px; font-weight: 600; font-size: 16px; cursor: pointer; transition: all 0.3s ease;" onmouseover="this.style.background='#3d6b4a'; this.style.transform='translateY(-1px)'" onmouseout="this.style.background='#4a7c59'; this.style.transform='translateY(0)'">Proceed to Checkout</button>
                    </div>
                `;
                
                cartItemsDiv.innerHTML = cartHTML + summaryHTML;
                this.updateCartCount(totalItems);
                
                console.log('🛒 Cart loaded successfully');
                
            } catch (error) {
                console.error('🛒 Error loading cart:', error);
                cartItemsDiv.innerHTML = `
                    <div class="empty-cart" style="text-align: center; padding: 40px;">
                        <p style="font-size: 18px; margin-bottom: 20px; color: #d32f2f;">Error loading cart</p>
                        <p style="color: #666; font-size: 14px; margin-bottom: 20px;">Please try refreshing the page</p>
                        <button onclick="window.location.reload()" class="btn btn-primary" style="padding: 12px 24px; background: #4a7c59; color: white; border: none; border-radius: 8px; cursor: pointer;">Refresh Page</button>
                    </div>
                `;
            }
        }
        
        setupEventHandlers() {
            console.log('🛒 Setting up event handlers');
            
            // Use event delegation for all cart buttons
            document.addEventListener('click', async (event) => {
                const target = event.target;
                
                // Handle quantity buttons
                if (target.classList.contains('qty-btn')) {
                    event.preventDefault();
                    await this.handleQuantityClick(target);
                }
                
                // Handle remove buttons
                if (target.classList.contains('remove-btn')) {
                    event.preventDefault();
                    await this.handleRemoveClick(target);
                }
            });
        }
        
        async handleQuantityClick(button) {
            if (this.isUpdating) return;
            
            const cartId = button.dataset.cartId;
            const currentQty = parseInt(button.dataset.current);
            const maxStock = parseInt(button.dataset.max);
            const isPlus = button.classList.contains('plus-btn');
            
            const newQty = isPlus ? currentQty + 1 : currentQty - 1;
            
            console.log(`🛒 Quantity change: ${cartId}, ${currentQty} -> ${newQty}`);
            
            // Validate quantity
            if (newQty < 1) {
                if (confirm('Remove this item from cart?')) {
                    await this.removeItem(cartId);
                }
                return;
            }
            
            if (newQty > maxStock) {
                alert(`Maximum available stock is ${maxStock}`);
                return;
            }
            
            await this.updateQuantity(cartId, newQty);
        }
        
        async handleRemoveClick(button) {
            if (this.isUpdating) return;
            
            const cartId = button.dataset.cartId;
            
            if (confirm('Remove this item from cart?')) {
                await this.removeItem(cartId);
            }
        }
        
        async updateQuantity(cartId, newQuantity) {
            if (this.isUpdating) return;
            
            this.isUpdating = true;
            console.log(`🛒 Updating quantity: ${cartId} -> ${newQuantity}`);
            
            try {
                // Update database
                const { error } = await window.supabase
                    .from('cart')
                    .update({ quantity: newQuantity })
                    .eq('id', cartId);
                
                if (error) {
                    console.error('🛒 Database error:', error);
                    alert('Error updating quantity. Please try again.');
                    return;
                }
                
                // Update UI instantly
                this.updateCartItemUI(cartId, newQuantity);
                
                console.log('🛒 Quantity updated successfully');
                
            } catch (error) {
                console.error('🛒 Update error:', error);
                alert('Error updating quantity. Please try again.');
            } finally {
                this.isUpdating = false;
            }
        }
        
        async removeItem(cartId) {
            if (this.isUpdating) return;
            
            this.isUpdating = true;
            console.log(`🛒 Removing item: ${cartId}`);
            
            try {
                // Remove from database
                const { error } = await window.supabase
                    .from('cart')
                    .delete()
                    .eq('id', cartId);
                
                if (error) {
                    console.error('🛒 Database error:', error);
                    alert('Error removing item. Please try again.');
                    return;
                }
                
                // Remove from UI
                const cartItem = document.querySelector(`[data-cart-id="${cartId}"]`);
                if (cartItem) {
                    cartItem.style.transition = 'opacity 0.3s ease';
                    cartItem.style.opacity = '0';
                    
                    setTimeout(() => {
                        cartItem.remove();
                        console.log(`🛒 Item ${cartId} removed from UI`);
                        this.updateCartTotals();
                        this.checkEmptyCart();
                    }, 300);
                }
                
                console.log('🛒 Item removed successfully');
                
            } catch (error) {
                console.error('🛒 Remove error:', error);
                alert('Error removing item. Please try again.');
            } finally {
                this.isUpdating = false;
            }
        }
        
        updateCartItemUI(cartId, newQuantity) {
            console.log(`🛒 Updating UI for cart item ${cartId} to quantity ${newQuantity}`);
            
            const cartItem = document.querySelector(`[data-cart-id="${cartId}"]`);
            if (!cartItem) {
                console.warn(`🛒 Cart item ${cartId} not found in UI`);
                return;
            }
            
            // Update quantity display
            const quantityDisplay = cartItem.querySelector('.quantity-display');
            if (quantityDisplay) {
                quantityDisplay.textContent = newQuantity;
                console.log(`🛒 Updated quantity display to ${newQuantity}`);
            }
            
            // Update button data attributes
            const buttons = cartItem.querySelectorAll('.qty-btn');
            buttons.forEach(btn => {
                btn.dataset.current = newQuantity;
            });
            
            // Update item total
            const priceElement = cartItem.querySelector('.cart-item-price');
            const totalElement = cartItem.querySelector('.item-total');
            
            if (priceElement && totalElement) {
                const price = parseFloat(priceElement.textContent.replace('₹', ''));
                const newTotal = price * newQuantity;
                totalElement.textContent = `₹${newTotal.toFixed(2)}`;
                console.log(`🛒 Updated item total to ₹${newTotal.toFixed(2)}`);
            }
            
            // Update cart totals - this is crucial!
            setTimeout(() => {
                this.updateCartTotals();
            }, 100);
        }
        
        updateCartTotals() {
            let total = 0;
            let totalItems = 0;
            
            console.log('🛒 Updating cart totals...');
            
            // Calculate totals from UI
            const cartItems = document.querySelectorAll('.cart-item');
            console.log(`🛒 Found ${cartItems.length} cart items`);
            
            cartItems.forEach((item, index) => {
                const quantityDisplay = item.querySelector('.quantity-display');
                const itemTotalElement = item.querySelector('.item-total');
                
                if (quantityDisplay && itemTotalElement) {
                    const quantity = parseInt(quantityDisplay.textContent) || 0;
                    const itemTotal = parseFloat(itemTotalElement.textContent.replace('₹', '')) || 0;
                    
                    console.log(`🛒 Item ${index + 1}: qty=${quantity}, total=₹${itemTotal}`);
                    
                    totalItems += quantity;
                    total += itemTotal;
                }
            });
            
            console.log(`🛒 Calculated totals: ${totalItems} items, ₹${total.toFixed(2)}`);
            
            // Update cart total display
            const cartTotalElement = document.querySelector('.cart-total');
            if (cartTotalElement) {
                const newTotalText = `Cart Total: ₹${total.toFixed(2)}`;
                cartTotalElement.textContent = newTotalText;
                console.log(`🛒 Updated cart total display: ${newTotalText}`);
            } else {
                console.warn('🛒 Cart total element not found!');
            }
            
            // Update cart count
            this.updateCartCount(totalItems);
        }
        
        updateCartCount(count) {
            // Update navigation cart count
            const navCartCount = document.getElementById('nav-cart-count');
            if (navCartCount) {
                navCartCount.textContent = count;
            }
            
            // Update bottom nav cart count
            const bottomNavCount = document.getElementById('bottom-nav-cart-count');
            if (bottomNavCount) {
                bottomNavCount.textContent = count;
                bottomNavCount.classList.toggle('hidden', count === 0);
            }
            
            console.log(`🛒 Cart count updated: ${count}`);
        }
        
        checkEmptyCart() {
            const cartItems = document.querySelectorAll('.cart-item');
            if (cartItems.length === 0) {
                const cartItemsDiv = document.getElementById('cart-items');
                if (cartItemsDiv) {
                    cartItemsDiv.innerHTML = `
                        <div class="empty-cart" style="text-align: center; padding: 40px;">
                            <p style="font-size: 18px; margin-bottom: 20px;">Your cart is empty</p>
                            <a href="shop.html" class="btn btn-primary" style="display: inline-block; padding: 12px 24px; background: #4a7c59; color: white; text-decoration: none; border-radius: 8px;">Start Shopping</a>
                        </div>
                    `;
                }
                this.updateCartCount(0);
            }
        }
    }
    
    // Initialize clean cart system
    const cleanCartSystem = new CleanCartSystem();
    
    // Override global functions to prevent conflicts
    window.loadCart = () => cleanCartSystem.loadCart();
    window.updateQuantity = () => {}; // Disable old function
    window.removeFromCart = () => {}; // Disable old function
    
    // Start initialization
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            cleanCartSystem.init();
        });
    } else {
        cleanCartSystem.init();
    }
    
    // Expose for debugging
    window.CleanCartSystem = cleanCartSystem;
    
    // Global checkout function
    window.proceedToCheckout = async function() {
        console.log('🛒 Proceeding to checkout...');
        
        try {
            // Simple checkout without complex authentication checks
            const cartItems = document.querySelectorAll('.cart-item');
            console.log('🛒 Found cart items:', cartItems.length);
            
            if (cartItems.length === 0) {
                alert('Your cart is empty. Please add items before checkout.');
                return;
            }
            
            console.log('🛒 Navigating to checkout page...');
            
            // Direct navigation to checkout page
            window.location.href = 'checkout.html';
            
        } catch (error) {
            console.error('🛒 Error during checkout:', error);
            // Fallback: direct navigation
            window.location.href = 'checkout.html';
        }
    };
    
    console.log('✅ Clean Cart System loaded');
    
})();