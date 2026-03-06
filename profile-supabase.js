// Profile Page - Supabase Version

// Wait for Supabase to be ready
window.addEventListener('supabaseReady', function() {
    checkAndLoadProfile();
});

// Also try after a short delay
setTimeout(checkAndLoadProfile, 1000);

async function checkAndLoadProfile() {
    if (!window.supabase) {
        console.log('Waiting for Supabase...');
        setTimeout(checkAndLoadProfile, 500);
        return;
    }

    console.log('Checking authentication...');
    
    try {
        const { data: { user }, error } = await window.supabase.auth.getUser();
        
        if (error) {
            console.error('Auth error:', error);
            document.getElementById('loading').innerHTML = '<p>Session expired. <a href="index.html">Please login again</a></p>';
            return;
        }
        
        console.log('User:', user);
        
        if (user) {
            loadProfile(user);
        } else {
            console.log('Not authenticated, redirecting to home...');
            document.getElementById('loading').innerHTML = '<p>Not logged in. <a href="index.html">Go to home</a></p>';
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        }
    } catch (error) {
        console.error('Error checking auth:', error);
        document.getElementById('loading').innerHTML = '<p>Error loading profile. <a href="index.html">Go to home</a></p>';
    }
}

async function loadProfile(user) {
    const loading = document.getElementById('loading');
    const content = document.getElementById('profile-content');

    try {
        // Get user data from users table
        const { data: userData, error: userError } = await window.supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

        if (userError) {
            console.error('Error fetching user data:', userError);
        }

        const fullName = userData ? `${userData.first_name || ''} ${userData.last_name || ''}`.trim() : '';
        const displayName = fullName || user.email;

        // Get initial from name or email
        const initial = displayName.charAt(0).toUpperCase();

        // Update avatar
        document.getElementById('profile-avatar').textContent = initial;

        // Update header
        document.getElementById('profile-name').textContent = displayName;
        document.getElementById('profile-email').textContent = user.email;

        // Update fields
        document.getElementById('field-name').textContent = fullName || '-';
        document.getElementById('field-email').textContent = user.email;
        document.getElementById('field-phone').textContent = userData?.phone || '-';
        document.getElementById('field-address').textContent = userData?.address || '-';

        // Get member since date
        const createdAt = user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }) : '-';
        document.getElementById('field-joined').textContent = createdAt;

        // Try to get orders and cart count
        try {
            // Get orders count - handle if table doesn't exist
            try {
                const { count: ordersCount } = await window.supabase
                    .from('orders')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', user.id);

                document.getElementById('field-orders').textContent = ordersCount || 0;
            } catch (ordersError) {
                console.log('Orders table not available yet:', ordersError);
                document.getElementById('field-orders').textContent = '0';
            }

            // Get cart count - handle if table doesn't exist
            try {
                const { data: cartData } = await window.supabase
                    .from('cart')
                    .select('quantity')
                    .eq('user_id', user.id);

                const cartCount = cartData?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
                document.getElementById('field-cart').textContent = cartCount;
            } catch (cartError) {
                console.log('Cart table not available yet:', cartError);
                document.getElementById('field-cart').textContent = '0';
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
            // Set defaults if stats fail
            document.getElementById('field-orders').textContent = '0';
            document.getElementById('field-cart').textContent = '0';
        }

        // Show content
        loading.style.display = 'none';
        content.style.display = 'block';

    } catch (error) {
        console.error('Error loading profile:', error);
        loading.innerHTML = '<p style="color: red;">Error loading profile. <a href="index.html">Go back to home</a></p>';
    }
}

function editProfile() {
    alert('Edit profile feature coming soon!');
}

async function logoutUser() {
    if (confirm('Are you sure you want to logout?')) {
        try {
            await window.supabase.auth.signOut();
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Logout error:', error);
            window.location.href = 'index.html';
        }
    }
}
