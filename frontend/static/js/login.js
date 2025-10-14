$(document).ready(function() {
    const loginForm = $('#loginForm');

    loginForm.on('submit', function(e) {
        e.preventDefault();

        const email = $('#email').val();
        const password = $('#password').val();

        // Basic validation
        if (!email || !password) {
            alert('Please enter both email and password.');
            return;
        }

        fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: email, password: password })
        })
        .then(response => {
            if (!response.ok) {
                // Handle non-2xx responses
                return response.json().then(err => {
                    throw new Error(err.message || 'Login failed due to server error.');
                });
            }
            return response.json();
        })
        .then(data => {
            // CORRECTED: The token is in data.data.access_token, not data.access_token
            if (data && data.data && data.data.access_token) {
                console.log("Login successful, storing access token...");
                localStorage.setItem('accessToken', data.data.access_token);
                // Redirect to the admin dashboard upon successful login
                window.location.href = '/frontend/admin_dashboard.html';
            } else {
                // This case handles a 200 OK response with no token, which is unexpected.
                console.error("Login API response is missing the access token:", data);
                alert('Login failed: Invalid response from server.');
            }
        })
        .catch(error => {
            console.error('Login Error:', error);
            alert(error.message || 'An error occurred during login. Please try again.');
        });
    });
    
    // --- Password visibility toggle ---
    const passwordInput = document.getElementById('password');
    const passwordToggle = document.getElementById('show-password-toggle');
    passwordToggle.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);

        // Toggle the icon
        this.querySelector('i').classList.toggle('fa-eye');
        this.querySelector('i').classList.toggle('fa-eye-slash');
    });
});