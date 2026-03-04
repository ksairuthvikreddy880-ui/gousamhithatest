// Authentication Manager - Token in sessionStorage (cleared on browser close)
// User data fetched from API (not stored locally)

class AuthManager {
    constructor() {
        // Restore token from sessionStorage if exists
        this.token = sessionStorage.getItem('auth_token') || null;
        this.user = null;
        this.API_URL = 'http://localhost:5000/api';
        
        console.log('Auth Manager initialized. Token:', this.token ? 'Present' : 'None');
    }

    // Signup
    async signup(email, password, firstName, lastName, phone) {
        try {
            const response = await fetch(`${this.API_URL}/auth/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    password,
                    first_name: firstName,
                    last_name: lastName,
                    phone
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Signup failed');
            }

            return data;
        } catch (error) {
            console.error('Signup error:', error);
            throw error;
        }
    }

    // Login
    async login(email, password) {
        try {
            const response = await fetch(`${this.API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }

            // Store token in sessionStorage (cleared on browser close)
            this.token = data.token;
            sessionStorage.setItem('auth_token', data.token);
            this.user = data.user;
            
            console.log('Login successful. Token stored.');

            // Check if admin and redirect
            if (data.user.role === 'admin') {
                window.location.href = '/admin-dashboard.html';
            }

            return data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    // Get current user
    async getCurrentUser() {
        try {
            if (!this.token) {
                throw new Error('No token available');
            }

            const response = await fetch(`${this.API_URL}/auth/me`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch user');
            }

            this.user = data.user;
            return data.user;
        } catch (error) {
            console.error('Get current user error:', error);
            throw error;
        }
    }

    // Logout
    logout() {
        this.token = null;
        this.user = null;
        sessionStorage.removeItem('auth_token');
        window.location.href = '/index.html';
    }

    // Check if user is logged in
    isLoggedIn() {
        return this.token !== null;
    }

    // Check if user is admin
    isAdmin() {
        return this.user && this.user.role === 'admin';
    }

    // Get auth headers for API calls
    getAuthHeaders() {
        if (!this.token) {
            return {};
        }
        return {
            'Authorization': `Bearer ${this.token}`
        };
    }

    // Make authenticated API call
    async authenticatedFetch(url, options = {}) {
        const headers = {
            ...options.headers,
            ...this.getAuthHeaders()
        };

        const response = await fetch(url, {
            ...options,
            headers
        });

        // If unauthorized, clear token and redirect to login
        if (response.status === 401) {
            this.logout();
            throw new Error('Session expired. Please login again.');
        }

        return response;
    }
}

// Create global instance
window.authManager = new AuthManager();

console.log('✅ Auth Manager initialized (sessionStorage for token only)');
