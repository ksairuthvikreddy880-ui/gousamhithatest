// Supabase Authentication Handler
// Replaces Nhost authentication

console.log('🔄 Loading Supabase auth handler...');

// Wait for Supabase to be ready
let supabaseReady = false;
window.addEventListener('supabaseReady', () => {
    supabaseReady = true;
    console.log('✅ Supabase auth handler initialized');
});

// Helper to wait for Supabase
async function waitForSupabase() {
    if (window.supabase) return true;
    
    return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
            if (window.supabase) {
                clearInterval(checkInterval);
                resolve(true);
            }
        }, 100);
        
        // Timeout after 5 seconds
        setTimeout(() => {
            clearInterval(checkInterval);
            resolve(false);
        }, 5000);
    });
}

// Sign Up
async function handleSignUp(event) {
    event.preventDefault();
    
    // Wait for Supabase to be ready
    const ready = await waitForSupabase();
    if (!ready) {
        alert('Supabase is not ready. Please refresh the page.');
        return;
    }
    
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const mobile = document.getElementById('signup-mobile').value;
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm').value;
    const messageDiv = document.getElementById('signup-message');
    
    if (password !== confirmPassword) {
        messageDiv.textContent = 'Passwords do not match';
        messageDiv.style.color = '#d32f2f';
        return;
    }
    
    try {
        messageDiv.textContent = 'Creating account...';
        messageDiv.style.color = '#666';
        
        // Sign up with Supabase (disable email confirmation for development)
        const { data, error } = await window.supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                emailRedirectTo: window.location.origin,
                data: {
                    full_name: name,
                    phone: mobile
                }
            }
        });
        
        if (error) {
            // Check if user already exists
            if (error.message && error.message.includes('already registered')) {
                messageDiv.textContent = 'This email is already registered. Please sign in instead.';
                messageDiv.style.color = '#d32f2f';
                return;
            }
            throw error;
        }
        
        console.log('✅ User created in auth:', data.user.id);
        
        // Check if user already exists in users table
        const { data: existingUser, error: checkError } = await window.supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .maybeSingle(); // Use maybeSingle to handle 0 rows gracefully
        
        if (checkError) {
            console.warn('⚠️ Error checking existing user:', checkError.message);
        }
        
        if (existingUser) {
            console.log('ℹ️ User already exists in users table');
            messageDiv.textContent = 'Account created successfully!';
            messageDiv.style.color = '#2e7d32';
        } else {
            // Insert user data into users table
            const [firstName, ...lastNameParts] = name.split(' ');
            const lastName = lastNameParts.join(' ') || '';
            
            console.log('📝 Inserting into users table...');
            
            const { data: insertData, error: insertError } = await window.supabase
                .from('users')
                .insert({
                    id: data.user.id,
                    email: email,
                    first_name: firstName,
                    last_name: lastName,
                    phone: mobile,
                    role: 'customer'
                })
                .select();
            
            if (insertError) {
                console.error('❌ Error inserting user data:', insertError);
                console.error('Error details:', JSON.stringify(insertError, null, 2));
                // Don't throw error - user is created in auth, just not in users table
                messageDiv.textContent = 'Account created! (Profile data pending)';
            } else {
                console.log('✅ User data inserted:', insertData);
                messageDiv.textContent = 'Account created successfully!';
            }
        }
        messageDiv.style.color = '#2e7d32';
        
        // Close modal after 1 second
        setTimeout(() => {
            closeAuthModal();
            // Reload to update UI
            location.reload();
        }, 1000);
        
    } catch (error) {
        console.error('Signup error:', error);
        
        // Handle specific error types
        if (error.message && error.message.includes('rate limit')) {
            messageDiv.textContent = 'Too many signup attempts. Please wait 10-15 minutes and try again, or use a different email address.';
        } else if (error.message && error.message.includes('already registered')) {
            messageDiv.textContent = 'This email is already registered. Please sign in instead.';
        } else {
            messageDiv.textContent = error.message || 'Error creating account';
        }
        
        messageDiv.style.color = '#d32f2f';
    }
}

// Sign In
async function handleSignIn(event) {
    event.preventDefault();
    console.log('🔐 Sign in attempt started');
    
    // Wait for Supabase to be ready
    const ready = await waitForSupabase();
    if (!ready) {
        alert('Supabase is not ready. Please refresh the page.');
        return;
    }
    
    const emailInput = document.getElementById('signin-email');
    const passwordInput = document.getElementById('signin-password');
    const messageDiv = document.getElementById('signin-message');
    
    console.log('Form elements found:', {
        email: !!emailInput,
        password: !!passwordInput,
        message: !!messageDiv
    });
    
    const email = emailInput ? emailInput.value : '';
    const password = passwordInput ? passwordInput.value : '';
    
    if (!email || !password) {
        if (messageDiv) {
            messageDiv.textContent = '⚠️ Please enter email and password';
            messageDiv.style.color = '#d32f2f';
            messageDiv.style.backgroundColor = '#ffebee';
            messageDiv.style.display = 'block';
        }
        return;
    }
    
    try {
        if (messageDiv) {
            messageDiv.textContent = '⏳ Signing in...';
            messageDiv.style.color = '#666';
            messageDiv.style.backgroundColor = '#f5f5f5';
            messageDiv.style.display = 'block';
        }
        
        console.log('Attempting login for:', email);
        
        const { data, error } = await window.supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) {
            console.error('❌ Login error:', error);
            
            if (!messageDiv) {
                alert('Login failed: ' + error.message);
                return;
            }
            
            // Handle specific error cases with clear messages
            if (error.message.includes('Email not confirmed')) {
                messageDiv.textContent = '❌ Email not confirmed. Please check your email or contact support.';
            } else if (error.message.includes('Invalid login credentials') || error.message.includes('Invalid')) {
                messageDiv.textContent = '❌ Wrong email or password. Please try again.';
            } else if (error.message.includes('Email')) {
                messageDiv.textContent = '❌ Invalid email address';
            } else {
                messageDiv.textContent = '❌ ' + error.message;
            }
            
            messageDiv.style.color = '#d32f2f';
            messageDiv.style.backgroundColor = '#ffebee';
            messageDiv.style.fontWeight = '600';
            messageDiv.style.display = 'block';
            return;
        }
        
        console.log('✅ Login successful');
        
        // Check if admin
        if (email === 'admin@123.com') {
            if (messageDiv) {
                messageDiv.textContent = '✓ Login successful! Redirecting to admin...';
                messageDiv.style.color = '#2e7d32';
                messageDiv.style.backgroundColor = '#e8f5e9';
            }
            setTimeout(() => {
                window.location.href = 'admin-dashboard.html';
            }, 500);
            return;
        }
        
        if (messageDiv) {
            messageDiv.textContent = '✓ Login successful!';
            messageDiv.style.color = '#2e7d32';
            messageDiv.style.backgroundColor = '#e8f5e9';
            messageDiv.style.fontWeight = '600';
            messageDiv.style.display = 'block';
        }
        
        setTimeout(() => {
            closeAuthModal();
            location.reload();
        }, 500);
        
    } catch (error) {
        console.error('💥 Exception during login:', error);
        if (messageDiv) {
            messageDiv.textContent = '❌ Login failed. Please check your credentials and try again.';
            messageDiv.style.color = '#d32f2f';
            messageDiv.style.backgroundColor = '#ffebee';
            messageDiv.style.fontWeight = '600';
            messageDiv.style.display = 'block';
        } else {
            alert('Login failed: ' + error.message);
        }
    }
}

// Logout
async function logout() {
    try {
        const { error } = await window.supabase.auth.signOut();
        if (error) throw error;
        
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// Check if user is logged in
async function checkAuth() {
    const { data: { user } } = await window.supabase.auth.getUser();
    return user;
}

// Get current user
async function getCurrentUser() {
    const { data: { user } } = await window.supabase.auth.getUser();
    return user;
}

// Modal functions
function openAuthModal() {
    document.getElementById('auth-modal').classList.add('active');
}

function closeAuthModal() {
    document.getElementById('auth-modal').classList.remove('active');
}

function switchTab(tab) {
    const signinForm = document.getElementById('signin-form');
    const signupForm = document.getElementById('signup-form');
    const tabs = document.querySelectorAll('.auth-tab');
    
    tabs.forEach(t => t.classList.remove('active'));
    
    if (tab === 'signin') {
        signinForm.classList.add('active');
        signupForm.classList.remove('active');
        tabs[0].classList.add('active');
    } else {
        signupForm.classList.add('active');
        signinForm.classList.remove('active');
        tabs[1].classList.add('active');
    }
}

// Make functions globally available IMMEDIATELY
window.handleSignUp = handleSignUp;
window.handleSignIn = handleSignIn;
window.logout = logout;
window.checkAuth = checkAuth;
window.getCurrentUser = getCurrentUser;
window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;
window.switchTab = switchTab;

console.log('✅ Auth functions registered:', {
    handleSignUp: typeof window.handleSignUp,
    handleSignIn: typeof window.handleSignIn,
    logout: typeof window.logout,
    openAuthModal: typeof window.openAuthModal,
    closeAuthModal: typeof window.closeAuthModal,
    switchTab: typeof window.switchTab
});
