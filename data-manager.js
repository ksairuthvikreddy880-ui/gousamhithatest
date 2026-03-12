
































async function getCart() {
    try {
        if (!window.supabase) {
            // Using backend API instead
            return [];
        }

        const { data: { user } } = await window.supabase.auth.getUser();
        
        if (!user) {
            return [];
        }

        const { data: cartItems, error } = await window.supabase
            .from('cart_items')
            .select('*')
            .eq('user_id', user.id);

        if (error) {
            console.error('Error fetching cart:', error);
            return [];
        }

        if (!cartItems || cartItems.length === 0) {
            return [];
        }

        const productIds = cartItems.map(item => item.product_id);
        
        const { data: products, error: productsError } = await window.supabase
            .from('products')
            .select('*')
            .in('id', productIds);

        if (productsError) {
            console.error('Error fetching products:', productsError);
            return [];
        }

        return cartItems.map(item => {
            const product = products.find(p => p.id === item.product_id);
            if (!product) return null;
            
            return {
                id: item.product_id,
                name: product.name,
                price: product.price,
                image_url: product.image_url,
                stock: product.stock,
                category: product.category,
                display_unit: product.display_unit,
                quantity: item.quantity,
                cart_item_id: item.id
            };
        }).filter(item => item !== null);
    } catch (error) {
        console.error('Error in getCart:', error);
        return [];
    }
}

async function addToCart(product, quantity = 1) {
    try {
        if (!window.supabase) {
            throw new Error('Database not connected');
        }

        const { data: { user } } = await window.supabase.auth.getUser();
        
        if (!user) {
            throw new Error('Please login to add items to cart');
        }

        const { data: currentProduct, error: productError } = await window.supabase
            .from('products')
            .select('stock, name')
            .eq('id', product.id)
            .maybeSingle(); // Use maybeSingle to handle 0 rows gracefully

        if (productError || !currentProduct) {
            throw new Error('Product not found');
        }

        const { data: existingCartItem, error: cartError } = await window.supabase
            .from('cart_items')
            .select('quantity')
            .eq('user_id', user.id)
            .eq('product_id', product.id)
            .maybeSingle(); // Use maybeSingle to handle 0 rows gracefully

        if (cartError && cartError.code !== 'PGRST116') {
            throw cartError;
        }

        const existingQty = existingCartItem ? existingCartItem.quantity : 0;
        const requestedQty = existingQty + quantity;

        if (requestedQty > currentProduct.stock) {
            if (currentProduct.stock === 0) {
                throw new Error(`${currentProduct.name} is out of stock`);
            } else if (existingQty >= currentProduct.stock) {
                throw new Error(`You already have the maximum available quantity (${currentProduct.stock}) in your cart`);
            } else {
                const availableToAdd = currentProduct.stock - existingQty;
                throw new Error(`Only ${availableToAdd} more ${currentProduct.name} can be added to cart`);
            }
        }

        if (existingCartItem) {
            const { error: updateError } = await window.supabase
                .from('cart_items')
                .update({ 
                    quantity: requestedQty,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', user.id)
                .eq('product_id', product.id);

            if (updateError) throw updateError;
        } else {
            const { error: insertError } = await window.supabase
                .from('cart_items')
                .insert([{
                    user_id: user.id,
                    product_id: product.id,
                    quantity: quantity
                }]);

            if (insertError) throw insertError;
        }

        return await getCart();
    } catch (error) {
        console.error('Error adding to cart:', error);
        throw error;
    }
}

async function updateCartItem(productId, quantity) {
    try {
        if (!window.supabase) {
            throw new Error('Database not connected');
        }

        const { data: { user } } = await window.supabase.auth.getUser();
        
        if (!user) {
            throw new Error('Please login');
        }

        if (quantity <= 0) {
            return await removeFromCart(productId);
        }

        const { data: product, error: productError } = await window.supabase
            .from('products')
            .select('stock, name')
            .eq('id', productId)
            .maybeSingle(); // Use maybeSingle to handle 0 rows gracefully

        if (productError || !product) {
            throw new Error('Product not found');
        }

        if (quantity > product.stock) {
            throw new Error(`Only ${product.stock} ${product.name} available in stock`);
        }

        const { error } = await window.supabase
            .from('cart_items')
            .update({ 
                quantity: quantity,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', user.id)
            .eq('product_id', productId);

        if (error) throw error;

        return await getCart();
    } catch (error) {
        console.error('Error updating cart item:', error);
        throw error;
    }
}

async function removeFromCart(productId) {
    try {
        if (!window.supabase) {
            throw new Error('Database not connected');
        }

        const { data: { user } } = await window.supabase.auth.getUser();
        
        if (!user) {
            throw new Error('Please login');
        }

        const { error } = await window.supabase
            .from('cart_items')
            .delete()
            .eq('user_id', user.id)
            .eq('product_id', productId);

        if (error) throw error;

        return await getCart();
    } catch (error) {
        console.error('Error removing from cart:', error);
        throw error;
    }
}

async function clearCart() {
    try {
        if (!window.supabase) {
            throw new Error('Database not connected');
        }

        const { data: { user } } = await window.supabase.auth.getUser();
        
        if (!user) {
            return [];
        }

        const { error } = await window.supabase
            .from('cart_items')
            .delete()
            .eq('user_id', user.id);

        if (error) throw error;

        return [];
    } catch (error) {
        console.error('Error clearing cart:', error);
        throw error;
    }
}

async function getCartTotal() {
    const cart = await getCart();
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

async function getCartCount() {
    const cart = await getCart();
    return cart.reduce((sum, item) => sum + item.quantity, 0);
}
















































window.DataManager = {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    getCartTotal,
    getCartCount
};
