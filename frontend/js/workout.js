// workout.js
// Workout plan client-side controller, session loading, and workout layout parser

document.addEventListener('DOMContentLoaded', () => {
    let activeSessionId = null;

    // UI Nodes
    const form = document.getElementById('workout-form');
    const messageInput = document.getElementById('workout-message');
    const generateBtn = document.getElementById('generate-btn');
    const loadingView = document.getElementById('plan-loading');
    const resultView = document.getElementById('plan-result');
    const alertContainer = document.getElementById('alert-container');

    // Logout Hook
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            window.logoutUser();
        });
    }

    function showAlert(message, type = 'danger') {
        alertContainer.innerHTML = `
            <div class="alert alert-${type}">
                <span>⚠️</span>
                <div>${message}</div>
            </div>
        `;
    }

    // 1. Initialize session to meet "valid user session ID" requirement
    async function initSession() {
        try {
            const sessions = await window.apiCall('/chat-sessions', { method: 'GET' });
            
            if (sessions && sessions.length > 0) {
                // Use the most recent session
                activeSessionId = sessions[0].id;
            } else {
                // Create a session
                const session = await window.apiCall('/chat-session', { method: 'POST' });
                activeSessionId = session.session_id;
            }
        } catch (error) {
            console.error('Failed to initialize session for workout planning:', error);
            showAlert('Could not establish an active session. Chat features may not run correctly.');
        }
    }

    // 2. Parser for strictly formatted Workout outputs
    function parseWorkout(text) {
        const getField = (name) => {
            // Match "FieldName: [content]" up to next "FieldName:" or double newline
            const regex = new RegExp(`${name}:\\s*(.*?)(?=\\n\\n|\\n[A-Z][a-zA-Z\\s-]+:|$)`, 'is');
            const match = text.match(regex);
            return match ? match[1].trim() : '';
        };

        const exercisesText = getField('Exercises');
        const exercises = [];
        if (exercisesText) {
            exercisesText.split('\n').forEach(line => {
                // Remove number lists e.g. "1. "
                const cleaned = line.replace(/^\d+\.\s*/, '').trim();
                if (cleaned) exercises.push(cleaned);
            });
        }

        return {
            name: getField('Workout Name'),
            goal: getField('Goal'),
            duration: getField('Duration'),
            warmup: getField('Warm-up'),
            exercises: exercises,
            cooldown: getField('Cooldown'),
            tips: getField('Tips')
        };
    }

    // 3. Render HTML output cards
    function renderWorkoutPlan(plan, rawText) {
        resultView.innerHTML = ''; // Reset

        // Verify if parser successfully extracted exercises. Fallback to raw if not.
        if (!plan.exercises || plan.exercises.length === 0) {
            resultView.innerHTML = `
                <div class="glass-card plan-header-card">
                    <h2 class="plan-title">Generated Training Routine</h2>
                    <p style="color: var(--text-secondary);">Here is the training routine compiled for you:</p>
                </div>
                <div class="glass-card plan-card">
                    <div class="raw-reply-box">${rawText}</div>
                </div>
            `;
            return;
        }

        // Render beautiful card components
        resultView.innerHTML = `
            <!-- Plan Title Banner -->
            <div class="glass-card plan-header-card">
                <h2 class="plan-title">${plan.name || 'Custom Training Routine'}</h2>
                <div class="plan-badges">
                    <span class="plan-badge highlight-green">🎯 Goal: ${plan.goal || 'General Fitness'}</span>
                    <span class="plan-badge highlight-cyan">⏱️ Duration: ${plan.duration || '30 - 45 mins'}</span>
                </div>
            </div>

            <!-- Detailed Cards Grid -->
            <div class="plan-grid">
                <!-- Main exercises sequence -->
                <div>
                    <!-- Warm up -->
                    ${plan.warmup ? `
                        <div class="glass-card plan-card">
                            <h3>🏃‍♂️ Warm-Up Setup</h3>
                            <p style="line-height: 1.6; color: var(--text-secondary);">${plan.warmup.replace(/\n/g, '<br>')}</p>
                        </div>
                    ` : ''}

                    <!-- Exercises -->
                    <div class="glass-card plan-card">
                        <h3>💪 Exercises Routine</h3>
                        <div class="exercise-list">
                            ${plan.exercises.map((ex, index) => `
                                <div class="exercise-item">
                                    <div class="exercise-number">${index + 1}</div>
                                    <div class="exercise-name">${ex}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Cooldown -->
                    ${plan.cooldown ? `
                        <div class="glass-card plan-card">
                            <h3>🧘‍♂️ Cooldown & Stretching</h3>
                            <p style="line-height: 1.6; color: var(--text-secondary);">${plan.cooldown.replace(/\n/g, '<br>')}</p>
                        </div>
                    ` : ''}
                </div>

                <!-- Right tips panel -->
                <div>
                    ${plan.tips ? `
                        <div class="glass-card plan-card">
                            <h3>💡 Training Tips</h3>
                            <p style="line-height: 1.6; font-size: 0.9rem; color: var(--text-secondary);">${plan.tips.replace(/\n/g, '<br>')}</p>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    // 4. Form Submit Handler
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        alertContainer.innerHTML = '';
        resultView.style.display = 'none';

        const message = messageInput.value.trim();
        if (!message) return;

        // Ensure session exists
        if (!activeSessionId) {
            await initSession();
            if (!activeSessionId) {
                showAlert('Could not generate workout plan: No active session available.');
                return;
            }
        }

        // Show loading state
        const originalBtnText = generateBtn.innerHTML;
        generateBtn.disabled = true;
        generateBtn.innerHTML = `<span class="loading-spinner"></span> <span>Building Routine...</span>`;
        loadingView.style.display = 'block';

        try {
            const data = await window.apiCall('/workout', {
                method: 'POST',
                body: {
                    session_id: activeSessionId,
                    message: message
                }
            });

            // Hide loading states
            loadingView.style.display = 'none';
            generateBtn.disabled = false;
            generateBtn.innerHTML = originalBtnText;

            // Parse and display
            const parsed = parseWorkout(data.reply);
            renderWorkoutPlan(parsed, data.reply);
            resultView.style.display = 'block';
            resultView.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        } catch (error) {
            loadingView.style.display = 'none';
            generateBtn.disabled = false;
            generateBtn.innerHTML = originalBtnText;
            showAlert(error.message || 'Failed to communicate with AI model. Please try again.');
        }
    });

    // Run session preloader on startup
    initSession();
});
