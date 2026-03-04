# Quick Start Guide

## Start the Application

### 1. Start Backend Server
Open a terminal and run:
```cmd
cd ecommerce-main\backend
npm start
```

You should see:
```
🚀 Server running on port 5000
✅ Connected to Neon PostgreSQL
```

### 2. Start Frontend Server
Open another terminal and run:
```cmd
cd ecommerce-main
python -m http.server 8000
```

### 3. Open in Browser
Go to: `http://localhost:8000`

## Test the Profile System

### Create Account
1. Click the profile icon (top right)
2. Click "Sign Up" tab
3. Fill in:
   - Full Name: John Doe
   - Email: john@example.com
   - Mobile: 9876543210
   - Password: password123
   - Confirm Password: password123
4. Click "Create Account"
5. Wait for success message

### Login
1. Switch to "Sign In" tab (or it switches automatically)
2. Enter:
   - Email: john@example.com
   - Password: password123
3. Click "Sign In"
4. Profile icon should change to show "J" (your initial)

### View Profile
1. Click the profile icon (now showing "J")
2. You should see dropdown with:
   - Your name: John Doe
   - Your email: john@example.com
   - My Profile link
   - My Orders link
   - Logout button
3. Click "My Profile"
4. Edit your details and save

### Logout
1. Click profile icon
2. Click "Logout"
3. Confirm logout
4. You'll be redirected to homepage

## Troubleshooting

### Backend not connecting
- Make sure backend is running on port 5000
- Check console for error messages
- Restart backend server if needed

### Profile icon not working
- Refresh the page (Ctrl+F5)
- Check browser console for errors
- Make sure you're logged in

### Cannot create account
- Check if backend is running
- Check if database connection is working
- Look at backend terminal for error messages

## Admin Login

Username: `admin`
Password: `Srigouadhar@2026`

Admin redirects to: `/admin-dashboard.html`
