document.addEventListener('DOMContentLoaded', () => {
    // Check if user is already logged in
    if (localStorage.getItem('user_token')) {
        window.location.href = '/'; // Redirect to homepage
    }
    
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const toLoginLink = document.getElementById('to-login');
    const toRegisterLink = document.getElementById('to-register');

    // Toggle between forms
    toLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
    });

    toRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    });

    // Handle Login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const errorEl = document.getElementById('login-error');
        errorEl.textContent = '';
        
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();
            if (res.ok) {
                localStorage.setItem('user_token', data.token);
                window.location.href = '/'; // Redirect to homepage
            } else {
                errorEl.textContent = data.error || 'Login failed.';
            }
        } catch (err) {
            errorEl.textContent = 'An error occurred. Please try again.';
        }
    });

    // Handle Register
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const errorEl = document.getElementById('register-error');
        errorEl.textContent = '';

        const username = document.getElementById('register-username').value;
        const password = document.getElementById('register-password').value;
        const passwordConfirm = document.getElementById('register-password-confirm').value;

        if (password !== passwordConfirm) {
            errorEl.textContent = 'Passwords do not match.';
            return;
        }

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();
            if (res.ok) {
                localStorage.setItem('user_token', data.token);
                window.location.href = '/'; // Redirect to homepage
            } else {
                errorEl.textContent = data.error || 'Registration failed.';
            }
        } catch (err) {
            errorEl.textContent = 'An error occurred. Please try again.';
        }
    });
});