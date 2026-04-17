
class AuthPopup {
    constructor() {
        this.apiBase = window.FITTRACK_API_BASE || '/backend/api';
        this.init();
    }

    init() {
        this.createPopupHTML();
        
        this.bindEvents();
        
        this.checkSession();
    }

    createPopupHTML() {
        const popupHTML = `
            <div id="auth-overlay" class="auth-overlay">
                <div class="auth-popup">
                    <button class="auth-close" id="auth-close">&times;</button>
                    
                    <!-- Login Form -->
                    <div id="login-form" class="auth-form active">
                        <h2>Prijava</h2>
                        <div class="error-message" id="login-error"></div>
                        
                        <form id="login-form-element">
                            <div class="form-group">
                                <label for="login-input">Email ali uporabniško ime</label>
                                <input type="text" id="login-input" name="login" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="login-password">Geslo</label>
                                <input type="password" id="login-password" name="password" required>
                            </div>
                            
                            <button type="submit" class="btn-primary btn-full" id="login-submit">
                                <span class="btn-text">Prijavi se</span>
                                <span class="btn-loader" style="display: none;">
                                    <i class="fas fa-spinner fa-spin"></i>
                                </span>
                            </button>
                        </form>
                        
                        <p class="auth-switch">
                            Še nimaš računa? 
                            <a href="#" id="show-register">Registriraj se</a>
                        </p>
                    </div>
                    
                    <!-- Register Form -->
                    <div id="register-form" class="auth-form">
                        <h2>Registracija</h2>
                        <div class="error-message" id="register-error"></div>
                        
                        <form id="register-form-element">
                            <div class="form-group">
                                <label for="register-email">Email</label>
                                <input type="email" id="register-email" name="email" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="register-username">Uporabniško ime</label>
                                <input type="text" id="register-username" name="username" required minlength="3">
                            </div>
                            
                            <div class="form-group">
                                <label for="register-fullname">Polno ime (opcijsko)</label>
                                <input type="text" id="register-fullname" name="full_name">
                            </div>
                            
                            <div class="form-group">
                                <label for="register-password">Geslo</label>
                                <input type="password" id="register-password" name="password" required minlength="6">
                            </div>
                            
                            <div class="form-group">
                                <label for="register-password-confirm">Potrdi geslo</label>
                                <input type="password" id="register-password-confirm" name="password_confirm" required>
                            </div>
                            
                            <button type="submit" class="btn-primary btn-full" id="register-submit">
                                <span class="btn-text">Registriraj se</span>
                                <span class="btn-loader" style="display: none;">
                                    <i class="fas fa-spinner fa-spin"></i>
                                </span>
                            </button>
                        </form>
                        
                        <p class="auth-switch">
                            Že imaš račun? 
                            <a href="#" id="show-login">Prijavi se</a>
                        </p>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', popupHTML);
    }

    bindEvents() {
        document.querySelectorAll('.btn-login, a[href*="dashboard"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showPopup('login');
            });
        });

        document.querySelectorAll('.btn-register').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showPopup('register');
            });
        });

        document.getElementById('auth-close').addEventListener('click', () => {
            this.hidePopup();
        });

        document.getElementById('auth-overlay').addEventListener('click', (e) => {
            if (e.target.id === 'auth-overlay') {
                this.hidePopup();
            }
        });

        document.getElementById('show-register').addEventListener('click', (e) => {
            e.preventDefault();
            this.switchForm('register');
        });

        document.getElementById('show-login').addEventListener('click', (e) => {
            e.preventDefault();
            this.switchForm('login');
        });

        document.getElementById('login-form-element').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin(e);
        });

        document.getElementById('register-form-element').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister(e);
        });
    }

    showPopup(formType = 'login') {
        document.getElementById('auth-overlay').classList.add('active');
        this.switchForm(formType);
        document.body.style.overflow = 'hidden';
    }

    hidePopup() {
        document.getElementById('auth-overlay').classList.remove('active');
        document.body.style.overflow = '';
        this.clearErrors();
    }

    switchForm(formType) {
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        
        if (formType === 'login') {
            loginForm.classList.add('active');
            registerForm.classList.remove('active');
        } else {
            registerForm.classList.add('active');
            loginForm.classList.remove('active');
        }
        
        this.clearErrors();
    }

    clearErrors() {
        document.getElementById('login-error').textContent = '';
        document.getElementById('register-error').textContent = '';
    }

    showError(formType, message) {
        const errorEl = document.getElementById(`${formType}-error`);
        errorEl.textContent = message;
        errorEl.style.display = 'block';
    }

    setButtonLoading(buttonId, isLoading) {
        const button = document.getElementById(buttonId);
        const text = button.querySelector('.btn-text');
        const loader = button.querySelector('.btn-loader');
        
        if (isLoading) {
            button.disabled = true;
            text.style.display = 'none';
            loader.style.display = 'inline-block';
        } else {
            button.disabled = false;
            text.style.display = 'inline';
            loader.style.display = 'none';
        }
    }

    async handleLogin(e) {
        this.clearErrors();
        this.setButtonLoading('login-submit', true);

        const formData = new FormData(e.target);
        const data = {
            login: formData.get('login'),
            password: formData.get('password')
        };

        try {
            const response = await fetch(`${this.apiBase}/login.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                window.location.href = 'dashboard.html';
            } else {
                this.showError('login', result.error.message || 'Prijava ni uspela');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError('login', 'Napaka pri povezavi s strežnikom. Poskusite ponovno.');
        } finally {
            this.setButtonLoading('login-submit', false);
        }
    }

    async handleRegister(e) {
        this.clearErrors();

        const formData = new FormData(e.target);
        const password = formData.get('password');
        const passwordConfirm = formData.get('password_confirm');

        if (password !== passwordConfirm) {
            this.showError('register', 'Gesli se ne ujemata');
            return;
        }

        this.setButtonLoading('register-submit', true);

        const data = {
            email: formData.get('email'),
            username: formData.get('username'),
            password: password,
            full_name: formData.get('full_name')
        };

        try {
            const response = await fetch(`${this.apiBase}/register.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                window.location.href = 'dashboard.html';
            } else {
                this.showError('register', result.error.message || 'Registracija ni uspela');
            }
        } catch (error) {
            console.error('Register error:', error);
            this.showError('register', 'Napaka pri povezavi s strežnikom. Poskusite ponovno.');
        } finally {
            this.setButtonLoading('register-submit', false);
        }
    }

    async checkSession() {
        try {
            const response = await fetch(`${this.apiBase}/check-session.php`);
            const result = await response.json();

            if (result.success && result.data.logged_in) {
                console.log('User logged in:', result.data.username);
            }
        } catch (error) {
            console.error('Session check error:', error);
        }
    }

    async logout() {
        try {
            const response = await fetch(`${this.apiBase}/logout.php`, {
                method: 'POST'
            });
            
            const result = await response.json();
            
            if (result.success) {
                window.location.href = 'index.html';
            }
        } catch (error) {
            console.error('Logout error:', error);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.authPopup = new AuthPopup();
});
