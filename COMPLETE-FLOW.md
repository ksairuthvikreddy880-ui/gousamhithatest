# Complete User Flow - WORKING! ✅

## Flow Overview

1. **Click Profile Icon** → Goes to Login Page
2. **Login** → Redirects to Profile Page with filled details
3. **Profile Page** → Shows user information (view and edit)

## Step-by-Step Flow

### Step 1: Click Profile Icon
- User clicks the profile icon (top right)
- Browser navigates to `login.html`

### Step 2: Login Page
- User enters email and password
- Clicks "Login" button
- Backend validates credentials
- JWT token stored in memory
- After successful login:
  - Regular users → Redirect to `profile.html`
  - Admin users → Redirect to `admin-dashboard.html`

### Step 3: Profile Page
- Page checks if user is logged in
- If NOT logged in → Shows "Please Login" message
- If logged in → Loads user data from backend
- Displays:
  - User avatar (first letter of name)
  - Full name
  - Email
  - Personal information (editable)
  - Delivery address (editable)
  - Account information (read-only)

## Files Modified

1. **index.html**
   - Profile icon now links to `login.html`
   - Added inline styles to ensure clickability

2. **login.html**
   - Changed redirect after login from `index.html` to `profile.html`
   - Regular users go to profile page after login

3. **profile.html**
   - Shows "Please Login" message if not logged in (instead of redirecting)
   - Loads user data automatically on page load
   - All fields are pre-filled with user data

## How to Test

### 1. Start Backend
```cmd
cd ecommerce-main\backend
npm start
```

### 2. Start Frontend
```cmd
cd ecommerce-main
python -m http.server 8000
```

### 3. Test Flow
1. Open `http://localhost:8000`
2. Click profile icon (top right)
3. Should go to login page
4. Enter credentials:
   - Email: (your registered email)
   - Password: (your password)
5. Click "Login"
6. Should redirect to profile page
7. Profile page should show your details

### 4. Create New Account (if needed)
1. On login page, click "Sign up"
2. Fill in all details
3. Click "Create Account"
4. Go back to login
5. Login with your credentials
6. Should see profile page with your details

## Expected Behavior

### Before Login:
- Profile icon → Login page
- Profile page → "Please Login" message

### After Login:
- Profile icon → Still goes to login (but you're already logged in)
- Profile page → Shows your details
- Can edit personal info and address
- Can logout

### After Logout:
- Token cleared from memory
- Redirected to home page
- Profile icon → Login page again

## Admin Flow

Admin credentials:
- Username: `admin`
- Password: `Srigouadhar@2026`

Admin flow:
1. Click profile icon → Login page
2. Enter admin credentials
3. Redirects to `admin-dashboard.html` (not profile page)

## Notes

- Token stored in memory only (NO localStorage)
- Session ends when browser closes
- All user data comes from Neon PostgreSQL database
- Profile updates save to database in real-time
