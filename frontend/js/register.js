// register.js
// Logic for multi-step registration wizard and validation

document.addEventListener('DOMContentLoaded', () => {
    // Current active step track (1 to 3)
    let currentStep = 1;

    // Form elements
    const form = document.getElementById('register-form');
    const alertContainer = document.getElementById('alert-container');
    const submitBtn = document.getElementById('btn-submit');
    const toggleBtn = document.getElementById('password-toggle');
    const passwordInput = document.getElementById('password');

    // Step contents & triggers
    const stepContents = {
        1: document.getElementById('step-1-content'),
        2: document.getElementById('step-2-content'),
        3: document.getElementById('step-3-content')
    };

    const progressSteps = document.querySelectorAll('.progress-step');
    const progressFill = document.getElementById('progress-fill');

    // Navigation buttons
    const btnNext1 = document.getElementById('btn-next-1');
    const btnNext2 = document.getElementById('btn-next-2');
    const btnPrev2 = document.getElementById('btn-prev-2');
    const btnPrev3 = document.getElementById('btn-prev-3');

    // Helper: Show custom alert message
    function showAlert(message, type = 'danger') {
        alertContainer.innerHTML = `
            <div class="alert alert-${type}">
                <span>${type === 'danger' ? '⚠️' : '✅'}</span>
                <div>${message}</div>
            </div>
        `;
        // Scroll to top of card to show error
        alertContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Toggle password visibility
    toggleBtn.addEventListener('click', () => {
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleBtn.textContent = 'Hide';
        } else {
            passwordInput.type = 'password';
            toggleBtn.textContent = 'Show';
        }
    });

    // Helper: Update step indicators and progress line fill
    function updateProgressUI() {
        // Active contents display
        Object.keys(stepContents).forEach(step => {
            if (parseInt(step) === currentStep) {
                stepContents[step].classList.add('active');
            } else {
                stepContents[step].classList.remove('active');
            }
        });

        // Progress bar nodes state
        progressSteps.forEach(node => {
            const stepNum = parseInt(node.getAttribute('data-step'));
            if (stepNum === currentStep) {
                node.className = 'progress-step active';
            } else if (stepNum < currentStep) {
                node.className = 'progress-step completed';
                node.innerHTML = '&#10003;'; // Checkmark
            } else {
                node.className = 'progress-step';
                node.textContent = stepNum;
            }
        });

        // Fill line updates
        const fillPercentage = ((currentStep - 1) / (progressSteps.length - 1)) * 100;
        progressFill.style.width = `${fillPercentage}%`;
    }

    // Validation: Step 1 Account Details
    function validateStep1() {
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = passwordInput.value;

        if (!name) {
            showAlert('Please enter your full name.');
            return false;
        }
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showAlert('Please enter a valid email address.');
            return false;
        }
        if (!password || password.length < 6) {
            showAlert('Password must be at least 6 characters long.');
            return false;
        }

        alertContainer.innerHTML = ''; // Clear alerts
        return true;
    }

    // Validation: Step 2 Metrics
    function validateStep2() {
        const age = document.getElementById('age').value;
        const gender = document.getElementById('gender').value;
        const height = document.getElementById('height').value;
        const weight = document.getElementById('weight').value;

        if (!age || parseInt(age) < 10 || parseInt(age) > 100) {
            showAlert('Please enter a valid age between 10 and 100.');
            return false;
        }
        if (!gender) {
            showAlert('Please select your gender.');
            return false;
        }
        if (!height || parseFloat(height) < 80 || parseFloat(height) > 250) {
            showAlert('Please enter a height between 80 and 250 cm.');
            return false;
        }
        if (!weight || parseFloat(weight) < 20 || parseFloat(weight) > 300) {
            showAlert('Please enter a weight between 20 and 300 kg.');
            return false;
        }

        alertContainer.innerHTML = '';
        return true;
    }

    // Validation: Step 3 Goals & Fit Details
    function validateStep3() {
        const goal = document.getElementById('goal').value;
        const activityLevel = document.getElementById('activity_level').value;
        const experience = document.getElementById('experience').value;
        const equipment = document.getElementById('equipment').value;

        if (!goal) {
            showAlert('Please select your fitness goal.');
            return false;
        }
        if (!activityLevel) {
            showAlert('Please select your current activity level.');
            return false;
        }
        if (!experience) {
            showAlert('Please select your workout experience level.');
            return false;
        }
        if (!equipment) {
            showAlert('Please select your available fitness equipment.');
            return false;
        }

        alertContainer.innerHTML = '';
        return true;
    }

    // Navigation Triggers
    btnNext1.addEventListener('click', () => {
        if (validateStep1()) {
            currentStep = 2;
            updateProgressUI();
        }
    });

    btnNext2.addEventListener('click', () => {
        if (validateStep2()) {
            currentStep = 3;
            updateProgressUI();
        }
    });

    btnPrev2.addEventListener('click', () => {
        currentStep = 1;
        updateProgressUI();
    });

    btnPrev3.addEventListener('click', () => {
        currentStep = 2;
        updateProgressUI();
    });

    // Form Submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!validateStep3()) return;

        // Collect and map all input values conforming to Pydantic UserCreate
        const payload = {
            name: document.getElementById('name').value.trim(),
            email: document.getElementById('email').value.trim(),
            password: passwordInput.value,
            age: parseInt(document.getElementById('age').value, 10),
            gender: document.getElementById('gender').value,
            height: parseFloat(document.getElementById('height').value),
            weight: parseFloat(document.getElementById('weight').value),
            goal: document.getElementById('goal').value,
            activity_level: document.getElementById('activity_level').value,
            experience: document.getElementById('experience').value,
            equipment: document.getElementById('equipment').value
        };

        // Loading states trigger
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span class="loading-spinner"></span> <span>Saving Profile...</span>`;

        try {
            await window.apiCall('/users', {
                method: 'POST',
                body: payload
            });

            // Redirect to login page on successful account creation
            window.location.href = 'login.html?registered=true';
        } catch (error) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
            showAlert(error.message || 'Registration failed. The email may already be registered.');
        }
    });
});
