// Cart Handler for Supabase
console.log('🛒 Loading cart handler...');

// Load cart items from Supabase
async function loadCart() {
    const cartItemsDiv = document.getElementById('cart-items');
    
    if (!window.supabase) {
        cartItemsDiv.innerHTML = '<p>Loading cart...</p>';
        return;
    }
    
    try {
        // Check if user is logged in
        const { data: { user } } = await window.supabase.auth.getUser();
        
        if (!user) {
            cartItemsDiv.innerHTML = `
                <div class="empty-cart" style="text-align: center; padding: 40px;">
                    <p style="font-size: 18px; margin-bottom: 20px;">Please login to view your cart</p>
                    <button onclick="openAuthModal()" class="btn btn-primary" style="padding: 12px 24px; background: #4a7c59; color: white; border: none; border-radius: 8px; cursor: pointer;">Login</button>
                </div>
            `;
            return;
        }
        
        console.log('Fetching cart for user:', user.id);
        
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
            console.error('Error loading cart:', error);
            cartItemsDiv.innerHTML = '<p>Error loading cart. Please try again.</p>';
            return;
        }
        
        console.log('Cart items loaded:', cartItems);
        
        if (!cartItems || cartItems.length === 0) {
            cartItemsDiv.innerHTML = `
                <div class="empty-cart" style="text-align: center; padding: 40px;">
                    <p style="font-size: 18px; margin-bottom: 20px;">Your cart is empty</p>
                    <a href="shop.html" class="btn btn-primary" style="display: inline-block; padding: 12px 24px; background: #4a7c59; color: white; text-decoration: none; border-radius: 8px;">Start Shopping</a>
                </div>
            `;
            return;
        }
        
        // Calculate total
        let total = 0;
        
        // Display cart items
        const cartHTML = cartItems.map(item => {
            const product = item.products;
            const itemTotal = product.price * item.quantity;
            total += itemTotal;
            
            return `
                <div class="cart-item" style="display: flex; align-items: center; padding: 20px; border-bottom: 1px solid #eee; gap: 20px;">
                    <img src="${product.image_url || 'images/placeholder.png'}" alt="${product.name}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px;">
                    <div class="cart-item-details" style="flex: 1;">
                        <h3 style="margin: 0 0 5px 0; font-size: 18px;">${product.name}</h3>
                        ${product.display_unit ? `<p style="color: #666; margin: 0 0 8px 0; font-size: 14px;">${product.display_unit}</p>` : ''}
                        <p class="cart-item-price" style="color: #4a7c59; margin: 0; font-size: 16px; font-weight: 600;">₹${product.price}</p>
                    </div>
                    <div class="cart-item-quantity" style="display: flex; align-items: center; gap: 10px;">
                        <button onclick="updateQuantity('${item.id}', ${item.quantity - 1}, ${product.stock})" style="width: 30px; height: 30px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer;">-</button>
                        <span style="min-width: 30px; text-align: center; font-weight: 600;">${item.quantity}</span>
                        <button onclick="updateQuantity('${item.id}', ${item.quantity + 1}, ${product.stock})" style="width: 30px; height: 30px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer;">+</button>
                    </div>
                    <div class="cart-item-total" style="text-align: right; min-width: 120px;">
                        <p style="font-size: 18px; font-weight: 600; margin: 0 0 10px 0;">₹${itemTotal.toFixed(2)}</p>
                        <button onclick="removeFromCart('${item.id}')" class="btn-remove" style="padding: 6px 12px; background: #d32f2f; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">Remove</button>
                    </div>
                </div>
            `;
        }).join('');
        
        const summaryHTML = `
            <div class="cart-summary" style="padding: 30px; background: #f9f9f9; margin-top: 20px; border-radius: 8px;">
                <h3 style="margin: 0 0 20px 0; font-size: 24px;">Cart Total: ₹${total.toFixed(2)}</h3>
                <a href="checkout.html" class="btn btn-primary" style="display: inline-block; padding: 14px 28px; background: #4a7c59; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Proceed to Checkout</a>
            </div>
        `;
        
        cartItemsDiv.innerHTML = cartHTML + summaryHTML;
        
    } catch (error) {
        console.error('Error loading cart:', error);
        cartItemsDiv.innerHTML = '<p>Error loading cart. Please try again.</p>';
    }
}

async function updateQuantity(cartItemId, newQuantity, maxStock) {
    if (newQuantity < 1) {
        removeFromCart(cartItemId);
        return;
    }
    
    if (newQuantity > maxStock) {
        if (typeof showToast === 'function') {
            showToast(`Maximum stock is ${maxStock}`, 'error');
        }
        return;
    }
    
    try {
        const { error } = await window.supabase
            .from('cart')
            .update({ quantity: newQuantity })
            .eq('id', cartItemId);
        
        if (error) throw error;
        
        await loadCart();
    } catch (error) {
        console.error('Error updating quantity:', error);
        if (typeof showToast === 'function') {
            showToast('Error updating quantity', 'error');
        }
    }
}

async function removeFromCart(cartItemId) {
    if (!confirm('Remove this item from cart?')) return;
    
    try {
        const { error } = await window.supabase
            .from('cart')
            .delete()
            .eq('id', cartItemId);
        
        if (error) throw error;
        
        if (typeof showToast === 'function') {
            showToast('Item removed from cart', 'success');
        }
        await loadCart();
    } catch (error) {
        console.error('Error removing item:', error);
        if (typeof showToast === 'function') {
            showToast('Error removing item', 'error');
        }
    }
}

// Wait for Supabase to be ready
window.addEventListener('supabaseReady', async () => {
    console.log('✅ Supabase ready, loading cart...');
    await loadCart();
});

setTimeout(async () => {
    if (window.supabase) {
        console.log('⏰ Timeout: Loading cart...');
        await loadCart();
    }
}, 1000);

// Make functions global
window.loadCart = loadCart;
window.updateQuantity = updateQuantity;
window.removeFromCart = removeFromCart;

console.log('✅ Cart handler loaded');
