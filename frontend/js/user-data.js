class UserData {
    constructor() {
        this.apiBase = window.FITTRACK_API_BASE || '/backend/api';
        this.userData = null;
    }

    async checkLoginAndLoadData() {
        try {
            const response = await fetch(`${this.apiBase}/check-session.php`);
            const result = await response.json();

            if (result.success && result.data.logged_in) {
                this.userData = result.data;
                this.updateUI();
                return true;
            } else {
                window.location.href = 'index.html';
                return false;
            }
        } catch (error) {
            console.error('Error checking session:', error);
            window.location.href = 'index.html';
            return false;
        }
    }

    updateUI() {
        if (!this.userData) return;

        const username = this.userData.username || 'Uporabnik';
        const email = this.userData.email || '';
        const fullName = this.userData.full_name || username;
        
        const firstName = fullName.split(' ')[0] || username;

        const dashboardHeading = document.querySelector('.main-header h1');
        if (dashboardHeading) {
            dashboardHeading.textContent = `Dobrodošli nazaj, ${firstName}!`;
        }

        const sidebarUserName = document.querySelector('.sidebar-user h4');
        if (sidebarUserName) {
            sidebarUserName.textContent = fullName;
        }

        const userNameById = document.getElementById('userName');
        if (userNameById) {
            userNameById.textContent = fullName;
        }

        const profileFullName = document.getElementById('fullName');
        if (profileFullName) {
            profileFullName.value = fullName;
        }

        const profileEmail = document.getElementById('email');
        if (profileEmail) {
            profileEmail.value = email;
        }

        const profileUsername = document.getElementById('username');
        if (profileUsername) {
            profileUsername.value = username;
        }

        this.updateCurrentDate();
    }

    updateCurrentDate() {
        const dateElement = document.getElementById('currentDate');
        if (dateElement) {
            const options = { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            };
            const today = new Date();
            dateElement.textContent = today.toLocaleDateString('sl-SI', options);
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
            window.location.href = 'index.html';
        }
    }
}

const userDataManager = new UserData();

document.addEventListener('DOMContentLoaded', async () => {
    await userDataManager.checkLoginAndLoadData();
    
    const logoutButton = document.querySelector('.logout');
    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault();
            userDataManager.logout();
        });
    }
});
