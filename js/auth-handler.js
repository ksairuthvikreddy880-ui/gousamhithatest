// Auth Handler for Modal Forms
// Connects to backend API (NO localStorage)

const API_URL = 'http://localhost:5000/api';

// Check backend connection on load
async function checkBackendConnection() {
    try {
        const response = await fetch('http://localhost:5000/', { 
            method: 'GET',
            signal: AbortSignal.timeout(2000)
        });
        if (response.ok) {
            console.log('✅ Backend connected');
            return true;
        }
    } catch (error) {
        console.warn('⚠️ Backend not available. Please start the backend server.');
        return false;
    }
}

// Handle Sign Up
async function handleSignUp(event) {
    event.preventDefault();
    
    const form = event.target;
    const messageEl = document.getElementById('signup-message');
    
    // Get form values using correct IDs
    const fullName = document.getElementById('signup-name')?.value.trim() || '';
    const email = document.getElementById('signup-email')?.value.trim() || '';
    const mobile = document.getElementById('signup-mobile')?.value.trim() || '';
    const password = document.getElementById('signup-password')?.value || '';
    const confirmPassword = document.getElementById('signup-confirm')?.value || '';
    
    // Validate
    if (!fullName || !email || !password) {
        showAuthMessage(messageEl, 'Please fill all required fields', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showAuthMessage(messageEl, 'Passwords do not match', 'error');
        return;
    }
    
    if (password.length < 6) {
        showAuthMessage(messageEl, 'Password must be at least 6 characters', 'error');
        return;
    }
    
    // Split full name
    const nameParts = fullName.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ');
    
    try {
        showAuthMessage(messageEl, 'Creating account...', 'success');
        
        const response = await fetch(`${API_URL}/auth/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email,
                password,
                first_name: firstName,
                last_name: lastName,
                phone: mobile
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Signup failed');
        }
        
        showAuthMessage(messageEl, 'Account created! Please sign in.', 'success');
        
        // Clear form
        form.reset();
        
        // Switch to sign in form after 2 seconds
        setTimeout(() => {
            document.getElementById('signup-form').style.display = 'none';
            document.getElementById('signin-form').style.display = 'block';
        }, 2000);
        
    } catch (error) {
        console.error('Signup error:', error);
        if (error.message.includes('fetch')) {
            showAuthMessage(messageEl, 'Cannot connect to server. Please ensure backend is running on port 5000.', 'error');
        } else {
            showAuthMessage(messageEl, error.message || 'Signup failed', 'error');
        }
    }
}

// Handle Sign In
async function handleSignIn(event) {
    event.preventDefault();
    
    const form = event.target;
    const messageEl = document.getElementById('signin-message');
    
    // Get form values using correct IDs
    const email = document.getElementById('signin-email')?.value.trim() || '';
    const password = document.getElementById('signin-password')?.value || '';
    
    // Validate
    if (!email || !password) {
        showAuthMessage(messageEl, 'Please enter email and password', 'error');
        return;
    }
    
    try {
        showAuthMessage(messageEl, 'Signing in...', 'success');
        
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Login failed');
        }
        
        // Store token in memory (using auth-manager if available)
        if (window.authManager) {
            window.authManager.token = data.token;
            window.authManager.user = data.user;
        }
        
        showAuthMessage(messageEl, 'Login successful!', 'success');
        
        // Close modal and show profile
        setTimeout(() => {
            if (data.user.role === 'admin') {
                window.location.href = 'admin-dashboard.html';
            } else {
                // Close auth modal and show profile modal
                closeAuthModal();
                showProfileModal();
            }
        }, 500);
        
    } catch (error) {
        console.error('Login error:', error);
        if (error.message.includes('fetch')) {
            showAuthMessage(messageEl, 'Cannot connect to server. Please ensure backend is running on port 5000.', 'error');
        } else {
            showAuthMessage(messageEl, error.message || 'Login failed', 'error');
        }
    }
}

// Show auth message
function showAuthMessage(element, message, type) {
    if (!element) return;
    
    element.textContent = message;
    element.className = `auth-message ${type}`;
    element.style.display = 'block';
}

// Switch between sign in and sign up forms
function showSignIn() {
    document.getElementById('signup-form').style.display = 'none';
    document.getElementById('signin-form').style.display = 'block';
}

function showSignUp() {
    document.getElementById('signin-form').style.display = 'none';
    document.getElementById('signup-form').style.display = 'block';
}

// Update profile UI after login
function updateProfileUI() {
    const profileBtn = document.getElementById('profile-btn');
    const profileUserName = document.getElementById('profile-user-name');
    const profileUserEmail = document.getElementById('profile-user-email');
    
    if (!profileBtn) return;
    
    if (window.authManager && window.authManager.isLoggedIn()) {
        const user = window.authManager.user;
        
        // Update dropdown with user info
        if (profileUserName) {
            profileUserName.textContent = user.first_name + (user.last_name ? ' ' + user.last_name : '');
        }
        if (profileUserEmail) {
            profileUserEmail.textContent = user.email;
        }
        
        // Change profile button to show user initial
        profileBtn.innerHTML = `
            <div class="profile-icon-logged-in" style="
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: #4a7c59;
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 16px;
                cursor: pointer;
            ">
                ${user.first_name ? user.first_name.charAt(0).toUpperCase() : 'U'}
            </div>
        `;
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
    }
    
    // Reattach click handler after innerHTML change
    attachProfileClickHandler();
}

// Attach profile button click handler
function attachProfileClickHandler() {
    // Removed - using simple href link instead
    console.log('Profile button uses direct href link to profile.html');
}

// Open auth modal
function openAuthModal(event) {
    if (event) event.preventDefault();
    const modal = document.getElementById('auth-modal');
    if (modal) {
        modal.classList.add('active');
    }
}

// Close auth modal
function closeAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Handle logout
function handleLogout(event) {
    event.preventDefault();
    
    if (confirm('Are you sure you want to logout?')) {
        if (window.authManager) {
            window.authManager.logout();
        } else {
            window.location.href = '/index.html';
        }
    }
}

// Toggle profile dropdown
function toggleProfileDropdown(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const dropdown = document.getElementById('profile-dropdown');
    if (!dropdown) return;
    
    // Toggle display
    if (dropdown.style.display === 'none' || !dropdown.style.display) {
        dropdown.style.display = 'block';
    } else {
        dropdown.style.display = 'none';
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const dropdown = document.getElementById('profile-dropdown');
    const profileBtn = document.getElementById('profile-btn');
    
    if (dropdown && profileBtn) {
        if (!dropdown.contains(event.target) && !profileBtn.contains(event.target)) {
            dropdown.style.display = 'none';
        }
    }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', async function() {
    // Check backend connection
    await checkBackendConnection();
    
    // Update profile UI if user is logged in
    updateProfileUI();
    
    console.log('✅ Profile button initialized');
});

console.log('✅ Auth handler loaded (backend API)');


// Profile Modal Functions
async function showProfileModal() {
    const modal = document.getElementById('profile-modal');
    const content = document.getElementById('profile-content');
    const loading = document.getElementById('profile-loading');
    
    modal.style.display = 'flex';
    content.style.display = 'none';
    loading.style.display = 'block';
    
    // Wait a bit for cookie to be set
    await new Promise(resolve => setTimeout(resolve, 300));
    
    try {
        console.log('Fetching profile...');
        const response = await fetch(`${API_URL}/auth/me`, {
            method: 'GET',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });
        
        console.log('Response status:', response.status);
        
        const data = await response.json();
        console.log('Response data:', data);
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to load profile');
        }
        
        const user = data.user;
        
        // Fill in profile data
        document.getElementById('modal-name').textContent = 
            `${user.first_name} ${user.last_name || ''}`.trim();
        document.getElementById('modal-email').textContent = user.email;
        document.getElementById('modal-phone').textContent = user.phone || '-';
        document.getElementById('modal-address').textContent = user.address || '-';
        
        loading.style.display = 'none';
        content.style.display = 'block';
        
    } catch (error) {
        console.error('Error loading profile:', error);
        loading.innerHTML = '<p style="color: red;">Failed to load profile: ' + error.message + '</p>';
    }
}

function closeProfileModal() {
    document.getElementById('profile-modal').style.display = 'none';
}

function editProfile() {
    alert('Edit profile feature coming soon!');
}

function logoutUser() {
    if (confirm('Are you sure you want to logout?')) {
        fetch(`${API_URL}/auth/logout`, {
            method: 'POST',
            credentials: 'include'
        }).then(() => {
            closeProfileModal();
            window.location.href = 'index.html';
        });
    }
}
