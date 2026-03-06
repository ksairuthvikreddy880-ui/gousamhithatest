// Nhost Data Manager
// Handles cart, orders, and user data with Nhost GraphQL

import { nhost } from './nhost-client.js';

// ============================================
// CART MANAGEMENT
// ============================================

// Get user's cart items
export async function getCart() {
    const user = nhost.auth.getUser();
    if (!user) {
        console.log('No user logged in, returning empty cart');
        return [];
    }
    
    try {
        const { data, error } = await nhost.graphql.request(`
            query GetCart($userId: uuid!) {
                cart(where: {customer_id: {_eq: $userId}}) {
                    id
                    product_id
                    quantity
                    product {
                        id
                        name
                        price
                        image_url
                        stock
                        in_stock
                    }
                }
            }
        `, {
            userId: user.id
        });
        
        if (error) {
            console.error('Error fetching cart:', error);
            return [];
        }
        
        // Transform to match expected format
        return data.cart.map(item => ({
            id: item.product_id,
            name: item.product.name,
            price: parseFloat(item.product.price),
            quantity: item.quantity,
            image_url: item.product.image_url,
            stock: item.product.stock,
            cartItemId: item.id
        }));
        
    } catch (error) {
        console.error('Cart fetch error:', error);
        return [];
    }
}

// Add item to cart
export async function addToCart(productId, quantity = 1) {
    const user = nhost.auth.getUser();
    if (!user) {
        throw new Error('Please login to add items to cart');
    }
    
    try {
        // Check if item already in cart
        const { data: existingData } = await nhost.graphql.request(`
            query CheckCart($userId: uuid!, $productId: uuid!) {
                cart(where: {customer_id: {_eq: $userId}, product_id: {_eq: $productId}}) {
                    id
                    quantity
                }
            }
        `, {
            userId: user.id,
            productId: productId
        });
        
        if (existingData.cart.length > 0) {
            // Update quantity
            const cartItem = existingData.cart[0];
            const { error } = await nhost.graphql.request(`
                mutation UpdateCart($id: uuid!, $quantity: Int!) {
                    update_cart_by_pk(pk_columns: {id: $id}, _set: {quantity: $quantity}) {
                        id
                        quantity
                    }
                }
            `, {
                id: cartItem.id,
                quantity: cartItem.quantity + quantity
            });
            
            if (error) throw error;
        } else {
            // Insert new item
            const { error } = await nhost.graphql.request(`
                mutation InsertCart($userId: uuid!, $productId: uuid!, $quantity: Int!) {
                    insert_cart_one(object: {
                        customer_id: $userId,
                        product_id: $productId,
                        quantity: $quantity
                    }) {
                        id
                    }
                }
            `, {
                userId: user.id,
                productId: productId,
                quantity: quantity
            });
            
            if (error) throw error;
        }
        
        return true;
    } catch (error) {
        console.error('Add to cart error:', error);
        throw new Error('Failed to add item to cart');
    }
}

// Update cart item quantity
export async function updateCartQuantity(productId, quantity) {
    const user = nhost.auth.getUser();
    if (!user) {
        throw new Error('Please login to update cart');
    }
    
    try {
        const { error } = await nhost.graphql.request(`
            mutation UpdateCartQuantity($userId: uuid!, $productId: uuid!, $quantity: Int!) {
                update_cart(
                    where: {customer_id: {_eq: $userId}, product_id: {_eq: $productId}},
                    _set: {quantity: $quantity}
                ) {
                    affected_rows
                }
            }
        `, {
            userId: user.id,
            productId: productId,
            quantity: quantity
        });
        
        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Update cart error:', error);
        throw new Error('Failed to update cart');
    }
}

// Remove item from cart
export async function removeFromCart(productId) {
    const user = nhost.auth.getUser();
    if (!user) {
        throw new Error('Please login to remove items');
    }
    
    try {
        const { error } = await nhost.graphql.request(`
            mutation RemoveFromCart($userId: uuid!, $productId: uuid!) {
                delete_cart(where: {customer_id: {_eq: $userId}, product_id: {_eq: $productId}}) {
                    affected_rows
                }
            }
        `, {
            userId: user.id,
            productId: productId
        });
        
        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Remove from cart error:', error);
        throw new Error('Failed to remove item');
    }
}

// Clear entire cart
export async function clearCart() {
    const user = nhost.auth.getUser();
    if (!user) return;
    
    try {
        const { error } = await nhost.graphql.request(`
            mutation ClearCart($userId: uuid!) {
                delete_cart(where: {customer_id: {_eq: $userId}}) {
                    affected_rows
                }
            }
        `, {
            userId: user.id
        });
        
        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Clear cart error:', error);
        throw new Error('Failed to clear cart');
    }
}

// Get cart count
export async function getCartCount() {
    const user = nhost.auth.getUser();
    if (!user) return 0;
    
    try {
        const { data, error } = await nhost.graphql.request(`
            query GetCartCount($userId: uuid!) {
                cart_aggregate(where: {customer_id: {_eq: $userId}}) {
                    aggregate {
                        sum {
                            quantity
                        }
                    }
                }
            }
        `, {
            userId: user.id
        });
        
        if (error) {
            console.error('Error getting cart count:', error);
            return 0;
        }
        
        return data.cart_aggregate.aggregate.sum.quantity || 0;
    } catch (error) {
        console.error('Cart count error:', error);
        return 0;
    }
}

// ============================================
// ORDER MANAGEMENT
// ============================================

// Create new order
export async function createOrder(orderData) {
    const user = nhost.auth.getUser();
    if (!user) {
        throw new Error('Please login to place order');
    }
    
    try {
        // Get user details
        const { data: userData } = await nhost.graphql.request(`
            query GetUser($id: uuid!) {
                users_by_pk(id: $id) {
                    email
                    first_name
                    last_name
                    phone
                }
            }
        `, {
            id: user.id
        });
        
        const userInfo = userData?.users_by_pk || {};
        
        // Generate order ID
        const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        
        // Create order
        const { data, error } = await nhost.graphql.request(`
            mutation CreateOrder(
                $id: String!,
                $customerId: uuid!,
                $customerEmail: String!,
                $customerName: String,
                $customerPhone: String,
                $total: numeric!,
                $deliveryAddress: String!,
                $deliveryCity: String,
                $deliveryState: String,
                $deliveryPincode: String,
                $deliveryCharges: numeric,
                $paymentMethod: String
            ) {
                insert_orders_one(object: {
                    id: $id,
                    customer_id: $customerId,
                    customer_email: $customerEmail,
                    customer_name: $customerName,
                    customer_phone: $customerPhone,
                    total: $total,
                    delivery_address: $deliveryAddress,
                    delivery_city: $deliveryCity,
                    delivery_state: $deliveryState,
                    delivery_pincode: $deliveryPincode,
                    delivery_charges: $deliveryCharges,
                    payment_method: $paymentMethod,
                    status: "Pending"
                }) {
                    id
                }
            }
        `, {
            id: orderId,
            customerId: user.id,
            customerEmail: userInfo.email || user.email,
            customerName: `${userInfo.first_name || ''} ${userInfo.last_name || ''}`.trim() || user.displayName,
            customerPhone: orderData.phone || userInfo.phone,
            total: orderData.total,
            deliveryAddress: orderData.address,
            deliveryCity: orderData.city,
            deliveryState: orderData.state,
            deliveryPincode: orderData.pincode,
            deliveryCharges: orderData.deliveryCharges || 0,
            paymentMethod: orderData.paymentMethod || 'cod'
        });
        
        if (error) throw error;
        
        // Add order items
        const cart = await getCart();
        for (const item of cart) {
            await nhost.graphql.request(`
                mutation InsertOrderItem(
                    $orderId: String!,
                    $productId: uuid!,
                    $productName: String!,
                    $quantity: Int!,
                    $price: numeric!
                ) {
                    insert_order_items_one(object: {
                        order_id: $orderId,
                        product_id: $productId,
                        product_name: $productName,
                        quantity: $quantity,
                        price: $price
                    }) {
                        id
                    }
                }
            `, {
                orderId: orderId,
                productId: item.id,
                productName: item.name,
                quantity: item.quantity,
                price: item.price
            });
        }
        
        // Clear cart after order
        await clearCart();
        
        return { orderId: orderId, success: true };
    } catch (error) {
        console.error('Create order error:', error);
        throw new Error('Failed to create order');
    }
}

// Get user's orders
export async function getUserOrders() {
    const user = nhost.auth.getUser();
    if (!user) {
        return [];
    }
    
    try {
        const { data, error } = await nhost.graphql.request(`
            query GetOrders($userId: uuid!) {
                orders(
                    where: {customer_id: {_eq: $userId}},
                    order_by: {created_at: desc}
                ) {
                    id
                    total
                    status
                    payment_status
                    payment_method
                    delivery_address
                    delivery_city
                    delivery_state
                    delivery_pincode
                    delivery_charges
                    created_at
                    confirmed_at
                    shipped_at
                    delivered_at
                    order_items {
                        id
                        product_name
                        quantity
                        price
                        product {
                            image_url
                        }
                    }
                }
            }
        `, {
            userId: user.id
        });
        
        if (error) {
            console.error('Error fetching orders:', error);
            return [];
        }
        
        return data.orders;
    } catch (error) {
        console.error('Get orders error:', error);
        return [];
    }
}

// ============================================
// USER PROFILE MANAGEMENT
// ============================================

// Update user profile
export async function updateUserProfile(profileData) {
    const user = nhost.auth.getUser();
    if (!user) {
        throw new Error('Please login to update profile');
    }
    
    try {
        const { error } = await nhost.graphql.request(`
            mutation UpdateUser(
                $id: uuid!,
                $firstName: String,
                $lastName: String,
                $phone: String,
                $address: String,
                $city: String,
                $state: String,
                $pincode: String
            ) {
                update_users_by_pk(
                    pk_columns: {id: $id},
                    _set: {
                        first_name: $firstName,
                        last_name: $lastName,
                        phone: $phone,
                        address: $address,
                        city: $city,
                        state: $state,
                        pincode: $pincode
                    }
                ) {
                    id
                }
            }
        `, {
            id: user.id,
            firstName: profileData.firstName,
            lastName: profileData.lastName,
            phone: profileData.phone,
            address: profileData.address,
            city: profileData.city,
            state: profileData.state,
            pincode: profileData.pincode
        });
        
        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Update profile error:', error);
        throw new Error('Failed to update profile');
    }
}

console.log('✅ Nhost data manager loaded');
