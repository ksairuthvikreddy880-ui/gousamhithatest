// Simple Profile Button Handler
// This script handles the profile button click with Supabase

console.log('🔧 Profile handler loading...');

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProfileButton);
} else {
    initProfileButton();
}

function initProfileButton() {
    console.log('🔧 Initializing profile button...');
    
    const profileBtn = document.getElementById('profile-btn');
    
    if (!profileBtn) {
        console.error('❌ Profile button not found!');
        return;
    }
    
    console.log('✅ Profile button found, attaching click handler...');
    
    // Remove any existing click handlers
    const newProfileBtn = profileBtn.cloneNode(true);
    profileBtn.parentNode.replaceChild(newProfileBtn, profileBtn);
    
    // Add click handler
    newProfileBtn.addEventListener('click', async function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('🖱️ Profile button clicked!');
        
        // Wait for Supabase to be ready
        if (!window.supabase) {
            console.log('⏳ Waiting for Supabase...');
            setTimeout(() => newProfileBtn.click(), 500);
            return;
        }
        
        // Check if user is logged in via Supabase
        const { data: { user } } = await window.supabase.auth.getUser();
        
        if (user) {
            console.log('✅ User is logged in, redirecting to profile page');
            window.location.href = 'profile.html';
        } else {
            console.log('ℹ️ User not logged in, showing auth modal');
            // User not logged in - open the auth modal
            if (typeof openAuthModal === 'function') {
                openAuthModal();
            } else {
                const authModal = document.getElementById('auth-modal');
                if (authModal) {
                    console.log('✅ Opening auth modal...');
                    authModal.classList.add('active');
                } else {
                    console.error('❌ Auth modal not found!');
                }
            }
        }
    });
    
    console.log('✅ Profile button click handler attached successfully!');
    
    // Update profile UI on load
    updateProfileUI();
}

// Update profile UI when user logs in
window.updateProfileUI = async function() {
    const profileBtn = document.getElementById('profile-btn');
    if (!profileBtn) return;
    
    // Wait for Supabase
    if (!window.supabase) {
        setTimeout(updateProfileUI, 500);
        return;
    }
    
    // Check if user is logged in via Supabase
    const { data: { user } } = await window.supabase.auth.getUser();
    
    if (user) {
        // Get user data from users table
        const { data: userData } = await window.supabase
            .from('users')
            .select('first_name, last_name')
            .eq('id', user.id)
            .single();
        
        const fullName = userData ? `${userData.first_name || ''} ${userData.last_name || ''}`.trim() : '';
        const displayName = fullName || user.email;
        const initial = displayName.charAt(0).toUpperCase();
        
        profileBtn.innerHTML = `
            <div style="
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: #4a7c59;
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 18px;
                cursor: pointer;
            ">
                ${initial}
            </div>
        `;
        
        console.log('✅ Profile UI updated - User logged in:', user.email);
    } else {
        // Not logged in - show default icon
        profileBtn.innerHTML = `
            <div class="profile-icon-placeholder">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                    <circle cx="12" cy="10" r="3" stroke="currentColor" stroke-width="2"/>
                    <path d="M6.5 18.5C7.5 16.5 9.5 15 12 15C14.5 15 16.5 16.5 17.5 18.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
            </div>
        `;
        console.log('ℹ️ Profile UI updated - User not logged in');
    }
};

console.log('✅ Profile handler loaded');
