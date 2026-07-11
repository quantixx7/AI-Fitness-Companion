// dashboard.js
// Dashboard control logic, profile fetching, dynamic BMI parsing, and chat history lists

document.addEventListener('DOMContentLoaded', () => {
    // Logout trigger hook
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            window.logoutUser();
        });
    }

    // Email Display
    const emailDisplay = document.getElementById('user-email-display');
    if (emailDisplay) {
        emailDisplay.textContent = localStorage.getItem('user_email') || '';
    }

    const alertContainer = document.getElementById('alert-container');

    function showAlert(message, type = 'danger') {
        alertContainer.innerHTML = `
            <div class="alert alert-${type}">
                <span>⚠️</span>
                <div>${message}</div>
            </div>
        `;
    }

    // 1. Fetch authenticated user profile data
    async function loadUserProfile() {
        try {
            const user = await window.apiCall('/users/me', {
                method: 'GET'
            });

            // Set greeting name
            document.getElementById('user-name-greeting').textContent = user.name;
            
            // Set metric nodes
            document.getElementById('val-age').textContent = user.age;
            document.getElementById('val-gender').textContent = user.gender;
            document.getElementById('val-height').innerHTML = `${user.height} <span style="font-size: 0.95rem; font-weight:400; color:var(--text-secondary);">cm</span>`;
            document.getElementById('val-weight').innerHTML = `${user.weight} <span style="font-size: 0.95rem; font-weight:400; color:var(--text-secondary);">kg</span>`;
            
            // Set goal nodes
            document.getElementById('val-goal').textContent = user.goal;
            document.getElementById('val-activity').textContent = user.activity_level;
            document.getElementById('val-experience').textContent = user.experience;
            document.getElementById('val-equipment').textContent = user.equipment;

            // Trigger BMI calculation
            await loadBMI(user.height, user.weight);

        } catch (error) {
            console.error('Failed to load user profile:', error);
            showAlert('Could not fetch user profile details. Please try logging in again.');
        }
    }

    // 2. Fetch BMI details from backend calculator
    async function loadBMI(height, weight) {
        const bmiCircle = document.getElementById('bmi-score');
        const bmiStatus = document.getElementById('bmi-status');
        const bmiExplanation = document.getElementById('bmi-explanation');

        try {
            const data = await window.apiCall(`/bmi?height=${height}&weight=${weight}`, {
                method: 'GET'
            });

            const bmi = data.bmi;
            bmiCircle.textContent = bmi;

            // Reset classes
            bmiCircle.className = 'bmi-circle';
            bmiStatus.className = 'bmi-status';

            // Determine WHO Category classification
            let categoryClass = 'normal';
            let categoryText = 'Normal weight';
            let advice = 'Excellent! You are in the healthy BMI range. Keep maintaining your training regimen and nutrition!';

            if (bmi < 18.5) {
                categoryClass = 'underweight';
                categoryText = 'Underweight';
                advice = 'Your BMI indicates you are underweight. Consult your companion chat for a caloric surplus diet plan to build muscle.';
            } else if (bmi >= 25 && bmi < 30) {
                categoryClass = 'overweight';
                categoryText = 'Overweight';
                advice = 'Your BMI indicates you are overweight. Consult your companion chat to plan a structured caloric deficit and strength regimen.';
            } else if (bmi >= 30) {
                categoryClass = 'obese';
                categoryText = 'Obesity';
                advice = 'Your BMI falls into the obesity category. Work on a slow cardio and progressive resistance program to regain health balance.';
            }

            // Apply categories styles
            bmiCircle.classList.add(categoryClass);
            bmiStatus.classList.add(categoryClass);
            bmiStatus.textContent = categoryText;
            bmiExplanation.textContent = advice;

        } catch (error) {
            console.error('Failed to calculate BMI:', error);
            bmiExplanation.textContent = 'Could not calculate BMI profile. Check input parameters.';
        }
    }

    // 3. Fetch top recent chat sessions
    async function loadRecentSessions() {
        const container = document.getElementById('dashboard-recent-sessions');

        try {
            const sessions = await window.apiCall('/chat-sessions', {
                method: 'GET'
            });

            container.innerHTML = ''; // Clear loader

            if (!sessions || sessions.length === 0) {
                container.innerHTML = `
                    <div class="no-sessions">No recent chats. Create a session to begin!</div>
                `;
                return;
            }

            // Render top 5 sessions
            const recent = sessions.slice(0, 5);
            recent.forEach(session => {
                const item = document.createElement('a');
                item.href = `chat.html?session_id=${session.id}`;
                item.className = 'session-item-link';
                item.innerHTML = `
                    <span class="session-title">${session.title}</span>
                    <span class="session-icon">&rarr;</span>
                `;
                container.appendChild(item);
            });

        } catch (error) {
            console.error('Failed to fetch chat sessions:', error);
            container.innerHTML = `
                <div class="no-sessions" style="color: #ef4444;">Failed to load chat history.</div>
            `;
        }
    }

    // Initialize triggers
    loadUserProfile();
    loadRecentSessions();
});
