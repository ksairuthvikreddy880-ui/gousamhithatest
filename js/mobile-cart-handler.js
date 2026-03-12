// Mobile Cart Handler - Modern Ecommerce Layout
class MobileCartHandler {
    constructor() {
        this.init();
    }
    
    init() {
        console.log('🛒 Mobile Cart Handler initializing...');
        // Initialize mobile cart functionality
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupMobileCart();
            });
        } else {
            this.setupMobileCart();
        }
    }
    
    setupMobileCart() {
        console.log('📱 Setting up mobile cart for screen width:', window.innerWidth);
        // Only run on mobile devices
        if (window.innerWidth <= 768) {
            // Wait for cart to load, then update layout
            setTimeout(() => {
                this.updateCartLayout();
                this.setupStickyTotalBar();
            }, 500);
        }
        
        // Listen for window resize
        window.addEventListener('resize', () => {
            if (window.innerWidth <= 768) {
                setTimeout(() => {
                    this.updateCartLayout();
                    this.setupStickyTotalBar();
                }, 100);
            }
        });
        
        // Listen for cart updates
        if (window.loadCart) {
            const originalLoadCart = window.loadCart;
            window.loadCart = async () => {
                await originalLoadCart();
                if (window.innerWidth <= 768) {
                    setTimeout(() => {
                        this.updateCartLayout();
                        this.setupStickyTotalBar();
                    }, 100);
                }
            };
        }
    }
    
    updateCartLayout() {
        const cartItems = document.querySelectorAll('.cart-item');
        
        cartItems.forEach(item => {
            this.restructureCartItem(item);
        });
    }
    
    restructureCartItem(cartItem) {
        // Skip if already restructured
        if (cartItem.classList.contains('mobile-restructured')) {
            return;
        }
        
        console.log('🔄 Restructuring cart item for mobile');
        console.log('📋 Original cart item:', cartItem);
        console.log('📋 Cart item dataset:', cartItem.dataset);
        
        // Get existing elements
        const image = cartItem.querySelector('img');
        const details = cartItem.querySelector('.cart-item-details');
        const quantitySection = cartItem.querySelector('.cart-item-quantity');
        const totalSection = cartItem.querySelector('.cart-item-total');
        
        if (!image || !details) return;
        
        // Extract data
        const productName = details.querySelector('h3')?.textContent || 'Product';
        const productPrice = details.querySelector('.cart-item-price')?.textContent || '₹0';
        const quantitySpan = quantitySection?.querySelector('span');
        const currentQuantity = quantitySpan ? parseInt(quantitySpan.textContent) || 1 : 1;
        
        // Get cart item ID and stock info from the cart item
        const cartItemId = cartItem.dataset.cartId || '';
        const maxStock = cartItem.dataset.maxStock || '10';
        
        // If we don't have a cart ID, try to extract it from onclick handlers
        if (!cartItemId) {
            const quantityButtons = cartItem.querySelectorAll('button[onclick*="updateQuantity"]');
            if (quantityButtons.length > 0) {
                const onclickAttr = quantityButtons[0].getAttribute('onclick');
                const match = onclickAttr.match(/updateQuantity\('([^']+)'/);
                if (match) {
                    cartItem.dataset.cartId = match[1];
                    console.log('📝 Extracted cart ID from onclick:', match[1]);
                }
            }
        } else {
            cartItem.dataset.cartId = cartItemId;
        }
        
        cartItem.dataset.maxStock = maxStock;
        
        // Create new mobile structure
        cartItem.innerHTML = '';
        cartItem.style.cssText = 'display: flex; align-items: flex-start; padding: 1rem; border-bottom: 1px solid #f0f0f0; background: white; gap: 0.8rem;';
        
        // Left side - Image
        const imageContainer = document.createElement('div');
        imageContainer.style.cssText = 'flex-shrink: 0;';
        
        const mobileImage = image.cloneNode(true);
        mobileImage.style.cssText = 'width: 60px; height: 60px; border-radius: 8px; object-fit: cover;';
        imageContainer.appendChild(mobileImage);
        
        // Right side - Product Information
        const infoContainer = document.createElement('div');
        infoContainer.className = 'cart-item-details';
        infoContainer.style.cssText = 'flex: 1; display: flex; flex-direction: column; gap: 0.4rem; min-width: 0;';
        
        // Product name
        const nameElement = document.createElement('h3');
        nameElement.textContent = productName;
        nameElement.style.cssText = 'font-size: 14px; font-weight: 600; color: #333; margin: 0; line-height: 1.3; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;';
        
        // Product weight (example)
        const weightElement = document.createElement('div');
        weightElement.className = 'cart-item-weight';
        weightElement.textContent = '1kg'; // Default weight
        weightElement.style.cssText = 'font-size: 12px; color: #666; margin: 0;';
        
        // Product price
        const priceElement = document.createElement('div');
        priceElement.className = 'cart-item-price';
        priceElement.textContent = productPrice;
        priceElement.style.cssText = 'font-size: 16px; font-weight: 700; color: #4a7c59; margin: 0;';
        
        // Controls container (quantity + remove)
        const controlsContainer = document.createElement('div');
        controlsContainer.className = 'cart-item-controls';
        controlsContainer.style.cssText = 'display: flex; align-items: center; justify-content: space-between; margin-top: 0.3rem; gap: 0.5rem;';
        
        // Left side - Quantity controls
        const quantityContainer = document.createElement('div');
        quantityContainer.className = 'mobile-quantity-controls';
        quantityContainer.style.cssText = 'display: flex; align-items: center; background: #f8f9fa; border-radius: 20px; padding: 0.2rem; gap: 0.3rem; border: 1px solid #e0e0e0;';
        
        // Right side - Item total and remove
        const rightControls = document.createElement('div');
        rightControls.style.cssText = 'display: flex; flex-direction: column; align-items: flex-end; gap: 0.2rem;';
        
        // Item total price (shows quantity × unit price)
        const itemTotalElement = document.createElement('div');
        itemTotalElement.className = 'mobile-item-total';
        const itemTotal = parseFloat(productPrice.replace('₹', '')) * currentQuantity;
        itemTotalElement.textContent = `₹${itemTotal.toFixed(2)}`;
        itemTotalElement.style.cssText = 'font-size: 14px; font-weight: 700; color: #333; margin-bottom: 0.1rem;';
        
        // Decrease button
        const decreaseBtn = document.createElement('button');
        decreaseBtn.className = 'mobile-quantity-btn';
        decreaseBtn.textContent = '−';
        decreaseBtn.style.cssText = 'width: 28px; height: 28px; border: none; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; color: #4a7c59; cursor: pointer; box-shadow: 0 1px 2px rgba(0,0,0,0.1);';
        
        // Quantity input
        const quantityInput = document.createElement('input');
        quantityInput.type = 'number';
        quantityInput.className = 'mobile-quantity-input';
        quantityInput.value = currentQuantity;
        quantityInput.min = '1';
        quantityInput.style.cssText = 'width: 35px; text-align: center; border: none; background: transparent; font-size: 13px; font-weight: 600; color: #333; padding: 0;';
        
        // Increase button
        const increaseBtn = document.createElement('button');
        increaseBtn.className = 'mobile-quantity-btn';
        increaseBtn.textContent = '+';
        increaseBtn.style.cssText = 'width: 28px; height: 28px; border: none; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; color: #4a7c59; cursor: pointer; box-shadow: 0 1px 2px rgba(0,0,0,0.1);';
        
        // Remove button
        const removeBtn = document.createElement('button');
        removeBtn.className = 'mobile-remove-btn';
        removeBtn.textContent = 'REMOVE';
        removeBtn.style.cssText = 'background: none; border: none; color: #dc3545; font-size: 11px; padding: 0.3rem 0.5rem; border-radius: 4px; cursor: pointer; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;';
        
        // Add event listeners
        decreaseBtn.addEventListener('click', async () => {
            if (quantityInput.value > 1) {
                const newQuantity = parseInt(quantityInput.value) - 1;
                quantityInput.value = newQuantity;
                this.updateItemTotalDisplay(quantityInput, priceElement, itemTotalElement);
                this.updateStickyTotalBar();
                
                // Update database using cart ID from the cart item
                const currentCartId = cartItem.dataset.cartId;
                if (currentCartId) {
                    await this.updateCartQuantityInDatabase(currentCartId, newQuantity);
                }
            }
        });
        
        increaseBtn.addEventListener('click', async () => {
            const newQuantity = parseInt(quantityInput.value) + 1;
            quantityInput.value = newQuantity;
            this.updateItemTotalDisplay(quantityInput, priceElement, itemTotalElement);
            this.updateStickyTotalBar();
            
            // Update database using cart ID from the cart item
            const currentCartId = cartItem.dataset.cartId;
            if (currentCartId) {
                await this.updateCartQuantityInDatabase(currentCartId, newQuantity);
            }
        });
        
        quantityInput.addEventListener('change', async () => {
            if (quantityInput.value < 1) quantityInput.value = 1;
            const newQuantity = parseInt(quantityInput.value);
            this.updateItemTotalDisplay(quantityInput, priceElement, itemTotalElement);
            this.updateStickyTotalBar();
            
            // Update database using cart ID from the cart item
            const currentCartId = cartItem.dataset.cartId;
            if (currentCartId) {
                await this.updateCartQuantityInDatabase(currentCartId, newQuantity);
            }
        });
        
        removeBtn.addEventListener('click', async () => {
            const currentCartId = cartItem.dataset.cartId;
            if (currentCartId && window.removeFromCart) {
                window.removeFromCart(currentCartId);
            } else if (currentCartId) {
                // Fallback: remove directly from database
                await this.removeCartItemFromDatabase(currentCartId);
                cartItem.remove();
                this.updateStickyTotalBar();
            }
        });
        
        // Assemble the structure
        quantityContainer.appendChild(decreaseBtn);
        quantityContainer.appendChild(quantityInput);
        quantityContainer.appendChild(increaseBtn);
        
        rightControls.appendChild(itemTotalElement);
        rightControls.appendChild(removeBtn);
        
        controlsContainer.appendChild(quantityContainer);
        controlsContainer.appendChild(rightControls);
        
        infoContainer.appendChild(nameElement);
        infoContainer.appendChild(weightElement);
        infoContainer.appendChild(priceElement);
        infoContainer.appendChild(controlsContainer);
        
        cartItem.appendChild(imageContainer);
        cartItem.appendChild(infoContainer);
        
        cartItem.classList.add('mobile-restructured');
    }
    
    createMobileCartStructure(originalItem) {
        // Extract data from original item
        const image = originalItem.querySelector('img');
        const title = originalItem.querySelector('.cart-item-details h3');
        const price = originalItem.querySelector('.cart-item-price');
        const quantity = originalItem.querySelector('.quantity-input');
        
        // Create ultra-compact mobile structure
        const container = document.createElement('div');
        container.style.cssText = 'display: flex; align-items: center; gap: 0.7rem; width: 100%;';
        
        // Left side - Compact Image
        const imageContainer = document.createElement('div');
        imageContainer.style.cssText = 'flex-shrink: 0;';
        
        const mobileImage = image ? image.cloneNode(true) : document.createElement('img');
        mobileImage.style.cssText = 'width: 50px; height: 50px; border-radius: 6px; object-fit: cover;';
        if (!image) {
            mobileImage.src = 'images/placeholder.jpg';
            mobileImage.alt = 'Product';
        }
        imageContainer.appendChild(mobileImage);
        
        // Center - Product Details (Compact)
        const detailsContainer = document.createElement('div');
        detailsContainer.style.cssText = 'flex: 1; min-width: 0;';
        
        // Product name - single line with ellipsis
        const productName = document.createElement('h3');
        productName.textContent = title ? title.textContent : 'Product Name';
        productName.style.cssText = 'font-size: 13px; font-weight: 600; color: #333; margin: 0 0 0.1rem 0; line-height: 1.2; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;';
        
        // Product weight/size - inline
        const productWeight = document.createElement('div');
        productWeight.textContent = '1kg';
        productWeight.className = 'cart-item-weight';
        productWeight.style.cssText = 'font-size: 11px; color: #666; margin: 0 0 0.2rem 0;';
        
        // Product price - compact
        const productPrice = document.createElement('div');
        productPrice.textContent = price ? price.textContent : '₹0';
        productPrice.className = 'cart-item-price';
        productPrice.style.cssText = 'font-size: 14px; font-weight: 700; color: #4a7c59; margin: 0;';
        
        // Right side - Compact Actions
        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'cart-item-actions';
        actionsContainer.style.cssText = 'display: flex; flex-direction: column; align-items: flex-end; gap: 0.3rem; flex-shrink: 0;';
        
        // Ultra-compact quantity controls
        const quantityContainer = this.createQuantityControls(quantity ? quantity.value : 1);
        
        // Item total - small
        const itemTotal = document.createElement('div');
        itemTotal.className = 'cart-item-total';
        itemTotal.textContent = price ? price.textContent : '₹0';
        itemTotal.style.cssText = 'font-size: 12px; font-weight: 600; color: #333;';
        
        // Minimal remove button
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.textContent = 'REMOVE';
        removeBtn.style.cssText = 'background: none; border: none; color: #dc3545; font-size: 10px; padding: 0.2rem 0.4rem; border-radius: 3px; cursor: pointer; text-transform: uppercase; letter-spacing: 0.5px;';
        
        // Assemble compact structure
        detailsContainer.appendChild(productName);
        detailsContainer.appendChild(productWeight);
        detailsContainer.appendChild(productPrice);
        
        actionsContainer.appendChild(quantityContainer);
        actionsContainer.appendChild(itemTotal);
        actionsContainer.appendChild(removeBtn);
        
        container.appendChild(imageContainer);
        container.appendChild(detailsContainer);
        container.appendChild(actionsContainer);
        
        return container;
    }
    
    createQuantityControls(currentQuantity = 1) {
        const quantityContainer = document.createElement('div');
        quantityContainer.className = 'quantity-selector';
        quantityContainer.style.cssText = 'display: flex; align-items: center; background: #f8f9fa; border-radius: 20px; padding: 0.2rem; gap: 0.5rem;';
        
        // Decrease button
        const decreaseBtn = document.createElement('button');
        decreaseBtn.className = 'quantity-btn decrease-btn';
        decreaseBtn.textContent = '−';
        decreaseBtn.style.cssText = 'width: 32px; height: 32px; border: none; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: bold; color: #4a7c59; cursor: pointer; box-shadow: 0 1px 3px rgba(0,0,0,0.1);';
        
        // Quantity input
        const quantityInput = document.createElement('input');
        quantityInput.type = 'number';
        quantityInput.className = 'quantity-input';
        quantityInput.value = currentQuantity;
        quantityInput.min = '1';
        quantityInput.style.cssText = 'width: 40px; text-align: center; border: none; background: transparent; font-size: 14px; font-weight: 600; color: #333;';
        
        // Increase button
        const increaseBtn = document.createElement('button');
        increaseBtn.className = 'quantity-btn increase-btn';
        increaseBtn.textContent = '+';
        increaseBtn.style.cssText = 'width: 32px; height: 32px; border: none; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: bold; color: #4a7c59; cursor: pointer; box-shadow: 0 1px 3px rgba(0,0,0,0.1);';
        
        // Add event listeners
        decreaseBtn.addEventListener('click', () => {
            if (quantityInput.value > 1) {
                quantityInput.value = parseInt(quantityInput.value) - 1;
                this.updateItemTotal(quantityInput);
            }
        });
        
        increaseBtn.addEventListener('click', () => {
            quantityInput.value = parseInt(quantityInput.value) + 1;
            this.updateItemTotal(quantityInput);
        });
        
        quantityInput.addEventListener('change', () => {
            if (quantityInput.value < 1) quantityInput.value = 1;
            this.updateItemTotal(quantityInput);
        });
        
        quantityContainer.appendChild(decreaseBtn);
        quantityContainer.appendChild(quantityInput);
        quantityContainer.appendChild(increaseBtn);
        
        return quantityContainer;
    }
    createCompactQuantityControls(currentQuantity = 1) {
        const quantityContainer = document.createElement('div');
        quantityContainer.className = 'quantity-selector';
        quantityContainer.style.cssText = 'display: flex; align-items: center; background: #f8f9fa; border-radius: 15px; padding: 0.1rem; gap: 0.2rem; border: 1px solid #e0e0e0;';

        // Ultra-compact decrease button
        const decreaseBtn = document.createElement('button');
        decreaseBtn.className = 'quantity-btn decrease-btn';
        decreaseBtn.textContent = '−';
        decreaseBtn.style.cssText = 'width: 24px; height: 24px; border: none; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; color: #4a7c59; cursor: pointer; box-shadow: 0 1px 2px rgba(0,0,0,0.1);';

        // Ultra-compact quantity input
        const quantityInput = document.createElement('input');
        quantityInput.type = 'number';
        quantityInput.className = 'quantity-input';
        quantityInput.value = currentQuantity;
        quantityInput.min = '1';
        quantityInput.style.cssText = 'width: 30px; text-align: center; border: none; background: transparent; font-size: 12px; font-weight: 600; color: #333; padding: 0;';

        // Ultra-compact increase button
        const increaseBtn = document.createElement('button');
        increaseBtn.className = 'quantity-btn increase-btn';
        increaseBtn.textContent = '+';
        increaseBtn.style.cssText = 'width: 24px; height: 24px; border: none; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; color: #4a7c59; cursor: pointer; box-shadow: 0 1px 2px rgba(0,0,0,0.1);';

        // Add hover effects
        decreaseBtn.addEventListener('mouseenter', () => {
            decreaseBtn.style.background = '#4a7c59';
            decreaseBtn.style.color = 'white';
        });
        decreaseBtn.addEventListener('mouseleave', () => {
            decreaseBtn.style.background = 'white';
            decreaseBtn.style.color = '#4a7c59';
        });

        increaseBtn.addEventListener('mouseenter', () => {
            increaseBtn.style.background = '#4a7c59';
            increaseBtn.style.color = 'white';
        });
        increaseBtn.addEventListener('mouseleave', () => {
            increaseBtn.style.background = 'white';
            increaseBtn.style.color = '#4a7c59';
        });

        // Add event listeners for quantity changes
        decreaseBtn.addEventListener('click', () => {
            if (quantityInput.value > 1) {
                quantityInput.value = parseInt(quantityInput.value) - 1;
                this.updateItemTotal(quantityInput);
            }
        });

        increaseBtn.addEventListener('click', () => {
            quantityInput.value = parseInt(quantityInput.value) + 1;
            this.updateItemTotal(quantityInput);
        });

        quantityInput.addEventListener('change', () => {
            if (quantityInput.value < 1) quantityInput.value = 1;
            this.updateItemTotal(quantityInput);
        });

        quantityContainer.appendChild(decreaseBtn);
        quantityContainer.appendChild(quantityInput);
        quantityContainer.appendChild(increaseBtn);

        return quantityContainer;
    }

    
    async removeCartItemFromDatabase(cartItemId) {
        if (!window.supabase || !cartItemId) {
            console.log('⚠️ Cannot remove from database: missing supabase or cartItemId');
            return;
        }
        
        try {
            console.log(`🗑️ Removing cart item ${cartItemId}`);
            
            const { error } = await window.supabase
                .from('cart')
                .delete()
                .eq('id', cartItemId);
            
            if (error) {
                console.error('❌ Error removing cart item:', error);
                if (typeof showToast === 'function') {
                    showToast('Error removing item', 'error');
                }
            } else {
                console.log('✅ Cart item removed successfully');
                if (typeof showToast === 'function') {
                    showToast('Item removed from cart', 'success');
                }
            }
        } catch (error) {
            console.error('❌ Exception removing cart item:', error);
        }
    }
    
    async updateCartQuantityInDatabase(cartItemId, newQuantity) {
        if (!window.supabase || !cartItemId) {
            console.log('⚠️ Cannot update database: missing supabase or cartItemId');
            return;
        }
        
        try {
            console.log(`🔄 Updating cart item ${cartItemId} quantity to ${newQuantity}`);
            
            const { error } = await window.supabase
                .from('cart')
                .update({ quantity: newQuantity })
                .eq('id', cartItemId);
            
            if (error) {
                console.error('❌ Error updating cart quantity:', error);
                if (typeof showToast === 'function') {
                    showToast('Error updating quantity', 'error');
                }
            } else {
                console.log('✅ Cart quantity updated successfully');
            }
        } catch (error) {
            console.error('❌ Exception updating cart quantity:', error);
        }
    }
    
    updateItemTotalDisplay(quantityInput, priceElement, itemTotalElement) {
        if (priceElement && itemTotalElement) {
            const priceText = priceElement.textContent.replace('₹', '').trim();
            const unitPrice = parseFloat(priceText);
            const quantity = parseInt(quantityInput.value) || 1;
            const totalPrice = unitPrice * quantity;
            
            console.log(`💰 Item total update: ${unitPrice} × ${quantity} = ${totalPrice}`);
            
            itemTotalElement.textContent = `₹${totalPrice.toFixed(2)}`;
        }
    }
    
    updateItemTotal(quantityInput, priceElement = null) {
        const cartItem = quantityInput.closest('.cart-item');
        
        // Find price element if not provided
        if (!priceElement) {
            priceElement = cartItem.querySelector('.cart-item-price');
        }
        
        if (priceElement) {
            const priceText = priceElement.textContent.replace('₹', '').trim();
            const unitPrice = parseFloat(priceText);
            const quantity = parseInt(quantityInput.value) || 1;
            const totalPrice = unitPrice * quantity;
            
            console.log(`💰 Updating item total: ${unitPrice} × ${quantity} = ${totalPrice}`);
            
            // Update the sticky total bar immediately
            this.updateStickyTotalBar();
            
            // Also update any item total displays (though we hide them on mobile)
            const totalElement = cartItem.querySelector('.cart-item-total p');
            if (totalElement) {
                totalElement.textContent = `₹${totalPrice.toFixed(2)}`;
            }
        }
        
        // If we have access to the global update function, use it
        const cartItemId = cartItem.dataset.cartId;
        if (cartItemId && window.updateQuantity) {
            const maxStock = cartItem.dataset.maxStock || 999;
            // Don't call updateQuantity here as it's already called in the event listeners
            // window.updateQuantity(cartItemId, parseInt(quantityInput.value), parseInt(maxStock));
        }
    }
    
    setupStickyTotalBar() {
        const stickyBar = document.getElementById('mobile-cart-total');
        const cartItems = document.querySelectorAll('.cart-item');
        
        if (cartItems.length > 0 && stickyBar) {
            stickyBar.style.display = 'block';
            this.updateStickyTotalBar();
        } else if (stickyBar) {
            stickyBar.style.display = 'none';
        }
    }
    
    updateStickyTotalBar() {
        const cartItems = document.querySelectorAll('.cart-item');
        const totalItemsElement = document.getElementById('mobile-total-items');
        const totalPriceElement = document.getElementById('mobile-total-price');
        const totalSavingsElement = document.getElementById('mobile-total-savings');
        
        let totalItems = 0;
        let totalPrice = 0;
        
        console.log('🔄 Updating sticky total bar...');
        
        cartItems.forEach(item => {
            // Try to find quantity from mobile quantity input first
            let quantity = 1;
            const mobileQuantityInput = item.querySelector('.mobile-quantity-input');
            const quantityInput = item.querySelector('.quantity-input');
            const quantitySpan = item.querySelector('.cart-item-quantity span');
            
            if (mobileQuantityInput) {
                quantity = parseInt(mobileQuantityInput.value) || 1;
            } else if (quantityInput) {
                quantity = parseInt(quantityInput.value) || 1;
            } else if (quantitySpan) {
                quantity = parseInt(quantitySpan.textContent) || 1;
            }
            
            // Try to find unit price
            let unitPrice = 0;
            const priceElement = item.querySelector('.cart-item-price');
            if (priceElement) {
                const priceText = priceElement.textContent.replace('₹', '').trim();
                unitPrice = parseFloat(priceText) || 0;
            }
            
            console.log(`📦 Item: quantity=${quantity}, unitPrice=${unitPrice}, total=${unitPrice * quantity}`);
            
            totalItems += quantity;
            totalPrice += unitPrice * quantity;
        });
        
        console.log(`💰 Cart totals: ${totalItems} items, ₹${totalPrice}`);
        
        if (totalItemsElement) {
            totalItemsElement.textContent = `${totalItems} item${totalItems !== 1 ? 's' : ''}`;
        }
        
        if (totalPriceElement) {
            totalPriceElement.textContent = `₹${totalPrice.toFixed(2)}`;
        }
        
        if (totalSavingsElement) {
            const savings = Math.floor(totalPrice * 0.05); // 5% savings example
            totalSavingsElement.textContent = savings > 0 ? `You saved ₹${savings}` : '';
        }
    }
    
    // Method to add new cart item with mobile layout
    addCartItem(itemData) {
        const cartItemsContainer = document.getElementById('cart-items');
        if (!cartItemsContainer) return;
        
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.dataset.productId = itemData.id;
        
        const mobileStructure = this.createMobileCartItemFromData(itemData);
        cartItem.appendChild(mobileStructure);
        
        cartItemsContainer.appendChild(cartItem);
        
        // Update sticky total bar
        this.setupStickyTotalBar();
    }
    
    createMobileCartItemFromData(itemData) {
        const container = document.createElement('div');
        container.style.cssText = 'display: flex; gap: 1rem; width: 100%;';
        
        // Create structure with actual data
        const imageContainer = document.createElement('div');
        imageContainer.style.cssText = 'flex-shrink: 0;';
        
        const image = document.createElement('img');
        image.src = itemData.image || 'images/placeholder.jpg';
        image.alt = itemData.name;
        image.style.cssText = 'width: 80px; height: 80px; border-radius: 8px; object-fit: cover;';
        imageContainer.appendChild(image);
        
        const detailsContainer = document.createElement('div');
        detailsContainer.style.cssText = 'flex: 1; display: flex; flex-direction: column;';
        
        const productName = document.createElement('h3');
        productName.textContent = itemData.name;
        productName.style.cssText = 'font-size: 14px; font-weight: 600; color: #333; margin: 0 0 0.3rem 0; line-height: 1.3;';
        
        const productWeight = document.createElement('div');
        productWeight.textContent = itemData.weight || '1kg';
        productWeight.className = 'cart-item-weight';
        productWeight.style.cssText = 'font-size: 12px; color: #666; margin-bottom: 0.3rem;';
        
        const productPrice = document.createElement('div');
        productPrice.textContent = `₹${itemData.price}`;
        productPrice.className = 'cart-item-price';
        productPrice.style.cssText = 'font-size: 16px; font-weight: 700; color: #4a7c59; margin-bottom: 0.8rem;';
        
        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'cart-item-actions';
        actionsContainer.style.cssText = 'display: flex; justify-content: space-between; align-items: center; width: 100%; margin-top: 0.5rem; gap: 1rem;';
        
        const quantityContainer = this.createQuantityControls(itemData.quantity || 1);
        
        const itemTotal = document.createElement('div');
        itemTotal.className = 'cart-item-total';
        itemTotal.textContent = `₹${itemData.price * (itemData.quantity || 1)}`;
        itemTotal.style.cssText = 'font-size: 14px; font-weight: 600; color: #333;';
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.textContent = 'Remove';
        removeBtn.style.cssText = 'background: none; border: none; color: #dc3545; font-size: 12px; padding: 0.3rem 0.6rem; border-radius: 4px; cursor: pointer;';
        removeBtn.addEventListener('click', () => {
            this.removeCartItem(container.closest('.cart-item'));
        });
        
        detailsContainer.appendChild(productName);
        detailsContainer.appendChild(productWeight);
        detailsContainer.appendChild(productPrice);
        
        actionsContainer.appendChild(quantityContainer);
        actionsContainer.appendChild(itemTotal);
        actionsContainer.appendChild(removeBtn);
        
        detailsContainer.appendChild(actionsContainer);
        
        container.appendChild(imageContainer);
        container.appendChild(detailsContainer);
        
        return container;
    }
    
    removeCartItem(cartItem) {
        cartItem.classList.add('removing');
        setTimeout(() => {
            cartItem.remove();
            this.updateStickyTotalBar();
        }, 300);
    }
}

// Global function for checkout
function proceedToCheckout() {
    // Check if cart has items
    const cartItems = document.querySelectorAll('.cart-item');
    if (cartItems.length === 0) {
        alert('Your cart is empty. Please add items before checkout.');
        return;
    }
    
    // Redirect to checkout page
    window.location.href = 'checkout.html';
}

// Initialize mobile cart handler
window.mobileCartHandler = new MobileCartHandler();

// Test function to add sample cart items for mobile testing
function addSampleCartItems() {
    const cartItemsContainer = document.getElementById('cart-items');
    if (!cartItemsContainer) return;
    
    const sampleItems = [
        {
            id: 'test1',
            name: 'Organic Paneer',
            price: 120,
            image: 'images/paneer.png',
            weight: '250g',
            quantity: 1
        },
        {
            id: 'test2', 
            name: 'Fresh Milk',
            price: 60,
            image: 'images/milk.png',
            weight: '1L',
            quantity: 1
        },
        {
            id: 'test3',
            name: 'Pure Ghee',
            price: 500,
            image: 'images/ghee.png',
            weight: '500g',
            quantity: 1
        }
    ];
    
    const cartHTML = sampleItems.map(item => {
        const itemTotal = item.price * item.quantity;
        return `
            <div class="cart-item" data-cart-id="${item.id}" data-max-stock="10">
                <img src="${item.image}" alt="${item.name}">
                <div class="cart-item-details">
                    <h3>${item.name}</h3>
                    <p style="color: #666; margin: 0 0 8px 0; font-size: 14px;">${item.weight}</p>
                    <p class="cart-item-price">₹${item.price}</p>
                </div>
                <div class="cart-item-quantity">
                    <button onclick="updateQuantity('${item.id}', ${item.quantity - 1}, 10)">-</button>
                    <span>${item.quantity}</span>
                    <button onclick="updateQuantity('${item.id}', ${item.quantity + 1}, 10)">+</button>
                </div>
                <div class="cart-item-total">
                    <p>₹${itemTotal.toFixed(2)}</p>
                    <button onclick="removeFromCart('${item.id}')" class="btn-remove">Remove</button>
                </div>
            </div>
        `;
    }).join('');
    
    const total = sampleItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const summaryHTML = `
        <div class="cart-summary" style="padding: 30px; background: #f9f9f9; margin-top: 20px; border-radius: 8px;">
            <h3 style="margin: 0 0 20px 0; font-size: 24px;">Cart Total: ₹${total.toFixed(2)}</h3>
            <a href="checkout.html" class="btn btn-primary" style="display: inline-block; padding: 14px 28px; background: #4a7c59; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Proceed to Checkout</a>
        </div>
    `;
    
    cartItemsContainer.innerHTML = cartHTML + summaryHTML;
    
    // Trigger mobile layout update
    if (window.mobileCartHandler && window.innerWidth <= 768) {
        setTimeout(() => {
            window.mobileCartHandler.updateCartLayout();
            window.mobileCartHandler.setupStickyTotalBar();
        }, 100);
    }
}

// Add sample items for testing (remove this in production)
if (window.location.search.includes('test=true')) {
    console.log('🧪 Test mode enabled - adding sample cart items');
    setTimeout(addSampleCartItems, 1000);
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileCartHandler;
}