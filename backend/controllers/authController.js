const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');

// Admin credentials
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'Srigouadhar@2026';

// Signup
const signup = async (req, res) => {
    try {
        const { email, password, first_name, last_name, phone } = req.body;

        // Validate required fields
        if (!email || !password || !first_name) {
            return res.status(400).json({ 
                success: false,
                error: 'Email, password, and first name are required' 
            });
        }

        // Check if user already exists
        const existingUser = await db.query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({ 
                success: false,
                error: 'Email already registered' 
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user
        const result = await db.query(
            'INSERT INTO users (email, password, first_name, last_name, phone, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, first_name, last_name, role',
            [email, hashedPassword, first_name, last_name, phone, 'customer']
        );

        const user = result.rows[0];

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: {
                id: user.id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Registration failed' 
        });
    }
};

// Login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({ 
                success: false,
                error: 'Email and password are required' 
            });
        }

        // Check for admin login
        if (email === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
            const token = jwt.sign(
                { 
                    id: 'admin',
                    email: 'admin@gousamhitha.com',
                    role: 'admin'
                },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
            );

            // Set HTTP-only cookie
            res.cookie('auth_token', token, {
                httpOnly: true,
                secure: false,
                sameSite: 'lax',
                path: '/',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });

            return res.json({
                success: true,
                token,
                user: {
                    id: 'admin',
                    email: 'admin@gousamhitha.com',
                    first_name: 'Admin',
                    role: 'admin'
                }
            });
        }

        // Regular user login
        const result = await db.query(
            'SELECT id, email, password, first_name, last_name, role FROM users WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ 
                success: false,
                error: 'Invalid email or password' 
            });
        }

        const user = result.rows[0];

        // Compare password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ 
                success: false,
                error: 'Invalid email or password' 
            });
        }

        // Create JWT token
        const token = jwt.sign(
            { 
                id: user.id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        // Set HTTP-only cookie
        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Login failed' 
        });
    }
};

// Get current user
const getCurrentUser = async (req, res) => {
    try {
        // req.user is set by verifyToken middleware
        const userId = req.user.id;

        // Handle admin user
        if (userId === 'admin') {
            return res.json({
                success: true,
                user: {
                    id: 'admin',
                    email: 'admin@gousamhitha.com',
                    first_name: 'Admin',
                    role: 'admin'
                }
            });
        }

        // Fetch user from database
        const result = await db.query(
            'SELECT id, email, first_name, last_name, phone, role, address, city, state, pincode, created_at FROM users WHERE id = $1',
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false,
                error: 'User not found' 
            });
        }

        const user = result.rows[0];

        res.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                phone: user.phone,
                role: user.role,
                address: user.address,
                city: user.city,
                state: user.state,
                pincode: user.pincode,
                created_at: user.created_at
            }
        });
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch user data' 
        });
    }
};

// Update profile
const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { first_name, last_name, phone, address } = req.body;

        // Handle admin user
        if (userId === 'admin') {
            return res.status(400).json({ 
                success: false,
                error: 'Cannot update admin profile' 
            });
        }

        // Update user
        const result = await db.query(
            'UPDATE users SET first_name = $1, last_name = $2, phone = $3, address = $4, updated_at = NOW() WHERE id = $5 RETURNING id, email, first_name, last_name, phone, address, created_at',
            [first_name, last_name, phone, address, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false,
                error: 'User not found' 
            });
        }

        const user = result.rows[0];

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                id: user.id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                phone: user.phone,
                address: user.address,
                created_at: user.created_at
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to update profile' 
        });
    }
};

// Logout
const logout = async (req, res) => {
    try {
        // Clear the auth cookie
        res.clearCookie('auth_token');

        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Logout failed' 
        });
    }
};

module.exports = {
    signup,
    login,
    logout,
    getCurrentUser,
    updateProfile
};
