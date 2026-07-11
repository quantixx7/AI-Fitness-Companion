// api.js
// Shared API fetch wrapper with token injection and 401 interception

window.apiCall = async function(endpoint, options = {}) {
    const baseUrl = (window.CONFIG && window.CONFIG.API_BASE_URL) ? window.CONFIG.API_BASE_URL : 'http://localhost:8000';
    const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;

    // Set up default headers
    options.headers = options.headers || {};

    // Attach JWT Bearer token if it exists in local storage
    const token = localStorage.getItem('token');
    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
    }

    // Automatically serialize body if it is a plain object
    if (options.body && typeof options.body === 'object') {
        const isFormData = options.body instanceof FormData;
        const isUrlSearchParams = options.body instanceof URLSearchParams;
        
        if (!isFormData && !isUrlSearchParams) {
            if (!options.headers['Content-Type']) {
                options.headers['Content-Type'] = 'application/json';
            }
            options.body = JSON.stringify(options.body);
        }
    }

    try {
        const response = await fetch(url, options);

        // If unauthorized (401), clean up the invalid session and redirect to login
        if (response.status === 401 && !endpoint.includes('/login')) {
            localStorage.removeItem('token');
            localStorage.removeItem('user_email');
            localStorage.removeItem('user_id');
            
            const currentPath = window.location.pathname;
            const isOnAuthPage = currentPath.endsWith('login.html') || 
                                 currentPath.endsWith('register.html') || 
                                 currentPath.endsWith('index.html') || 
                                 currentPath === '/' ||
                                 currentPath === '';
            
            if (!isOnAuthPage) {
                window.location.href = 'login.html?expired=true';
            }
            throw new Error('Your session has expired. Please log in again.');
        }

        const contentType = response.headers.get('content-type');
        let data;
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            data = await response.text();
        }

        if (!response.ok) {
            // Extract detailed error messages from FastAPI validation or router errors
            let errorMsg = 'An unexpected error occurred';
            if (data && typeof data === 'object') {
                if (typeof data.detail === 'string') {
                    errorMsg = data.detail;
                } else if (Array.isArray(data.detail)) {
                    errorMsg = data.detail.map(err => {
                        const locName = err.loc ? err.loc[err.loc.length - 1] : 'field';
                        return `${locName}: ${err.msg}`;
                    }).join(', ');
                } else if (data.message) {
                    errorMsg = data.message;
                }
            } else if (typeof data === 'string' && data.trim()) {
                errorMsg = data;
            }
            
            const error = new Error(errorMsg);
            error.status = response.status;
            error.data = data;
            throw error;
        }

        return data;
    } catch (err) {
        console.error(`API Call failed to: ${url}`, err);
        throw err;
    }
};
