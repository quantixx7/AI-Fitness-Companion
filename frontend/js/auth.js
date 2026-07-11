// auth.js
// Authentication management for AI Fitness Companion

// Checks if a token is present in localStorage
window.isAuthenticated = function() {
    return !!localStorage.getItem('token');
};

// Decodes standard base64url-encoded JWT token payloads
window.decodeJwt = function(token) {
    try {
        if (!token) return null;
        const base64Url = token.split('.')[1];
        if (!base64Url) return null;
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error('Failed to decode JWT token:', e);
        return null;
    }
};

// Route Guard: Ensures the page is only accessible to authenticated users
window.requireAuth = function() {
    if (!window.isAuthenticated()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
};

// Route Guard: Prevents logged-in users from viewing login/register/landing pages
window.redirectIfAuthenticated = function() {
    if (window.isAuthenticated()) {
        window.location.href = 'dashboard.html';
    }
};

// Handles user login via URL-encoded form parameters
window.loginUser = async function(email, password) {
    const bodyParams = new URLSearchParams();
    bodyParams.append('username', email);
    bodyParams.append('password', password);

    try {
        const response = await window.apiCall('/login', {
            method: 'POST',
            body: bodyParams
        });

        if (response && response.access_token) {
            localStorage.setItem('token', response.access_token);
            
            // Extract user info from decoded JWT token payload
            const payload = window.decodeJwt(response.access_token);
            if (payload) {
                if (payload.user_id) localStorage.setItem('user_id', payload.user_id);
                if (payload.email) localStorage.setItem('user_email', payload.email);
            }
            return response;
        } else {
            throw new Error('Authentication failed. No access token received.');
        }
    } catch (error) {
        console.error('Login error in auth.js:', error);
        throw error;
    }
};

// Logs out the user and clears authentication state
window.logoutUser = function() {
    localStorage.removeItem('token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_email');
    window.location.href = 'login.html';
};
