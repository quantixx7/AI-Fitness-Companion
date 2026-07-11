// diet.js
// Diet plan client-side controller, session loading, and diet layout parser

document.addEventListener('DOMContentLoaded', () => {
    let activeSessionId = null;

    // UI Nodes
    const form = document.getElementById('diet-form');
    const messageInput = document.getElementById('diet-message');
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
                activeSessionId = sessions[0].id;
            } else {
                const session = await window.apiCall('/chat-session', { method: 'POST' });
                activeSessionId = session.session_id;
            }
        } catch (error) {
            console.error('Failed to initialize session for diet planning:', error);
            showAlert('Could not establish an active session. Chat features may not run correctly.');
        }
    }

    // 2. Parser for strictly formatted Diet Plan outputs
    function parseDiet(text) {
        const getField = (name) => {
            const regex = new RegExp(`${name}:\\s*(.*?)(?=\\n\\n|\\n[A-Z][a-zA-Z\\s-]+:|$)`, 'is');
            const match = text.match(regex);
            return match ? match[1].trim() : '';
        };

        return {
            calories: getField('Daily Calories'),
            protein: getField('Protein'),
            carbs: getField('Carbohydrates'),
            fats: getField('Fats'),
            breakfast: getField('Breakfast'),
            morningSnack: getField('Morning Snack'),
            lunch: getField('Lunch'),
            eveningSnack: getField('Evening Snack'),
            dinner: getField('Dinner'),
            hydration: getField('Hydration'),
            notes: getField('Notes')
        };
    }

    // 3. Render HTML output cards
    function renderDietPlan(plan, rawText) {
        resultView.innerHTML = ''; // Reset

        // Check if parser found core meal schedules. Fallback to raw if not.
        if (!plan.breakfast && !plan.lunch && !plan.dinner) {
            resultView.innerHTML = `
                <div class="glass-card plan-header-card">
                    <h2 class="plan-title">Generated Diet Plan</h2>
                    <p style="color: var(--text-secondary);">Here is the diet program compiled for you:</p>
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
                <h2 class="plan-title">Personalized Diet Plan</h2>
                <p style="color: var(--text-secondary); font-size: 0.95rem; line-height: 1.5;">
                    Custom nutrient breakdown designed matching your profile goals.
                </p>
            </div>

            <!-- Macronutrient Breakdown Grid -->
            <div class="macro-grid">
                <div class="glass-card macro-card cal-card">
                    <div class="macro-title">Calories</div>
                    <div class="macro-val" style="color: var(--accent-cyan);">${plan.calories || '-'}</div>
                </div>
                <div class="glass-card macro-card pro-card">
                    <div class="macro-title">Protein</div>
                    <div class="macro-val" style="color: #f59e0b;">${plan.protein || '-'}</div>
                </div>
                <div class="glass-card macro-card carb-card">
                    <div class="macro-title">Carbs</div>
                    <div class="macro-val" style="color: #3b82f6;">${plan.carbs || '-'}</div>
                </div>
                <div class="glass-card macro-card fat-card">
                    <div class="macro-title">Fats</div>
                    <div class="macro-val" style="color: #ef4444;">${plan.fats || '-'}</div>
                </div>
            </div>

            <!-- Main timeline and side notes -->
            <div class="plan-grid">
                <!-- Timeline of meals -->
                <div class="glass-card plan-card">
                    <h3>🍳 Daily Meal Schedule</h3>
                    <div class="meal-timeline">
                        ${plan.breakfast ? `
                            <div class="meal-card" style="border-left-color: #f59e0b;">
                                <div class="meal-label" style="color: #f59e0b;">Breakfast</div>
                                <div class="meal-content">${plan.breakfast.replace(/\n/g, '<br>')}</div>
                            </div>
                        ` : ''}
                        
                        ${plan.morningSnack ? `
                            <div class="meal-card" style="border-left-color: #34d399;">
                                <div class="meal-label" style="color: #34d399;">Morning Snack</div>
                                <div class="meal-content">${plan.morningSnack.replace(/\n/g, '<br>')}</div>
                            </div>
                        ` : ''}

                        ${plan.lunch ? `
                            <div class="meal-card" style="border-left-color: #3b82f6;">
                                <div class="meal-label" style="color: #3b82f6;">Lunch</div>
                                <div class="meal-content">${plan.lunch.replace(/\n/g, '<br>')}</div>
                            </div>
                        ` : ''}

                        ${plan.eveningSnack ? `
                            <div class="meal-card" style="border-left-color: #a78bfa;">
                                <div class="meal-label" style="color: #a78bfa;">Evening Snack</div>
                                <div class="meal-content">${plan.eveningSnack.replace(/\n/g, '<br>')}</div>
                            </div>
                        ` : ''}

                        ${plan.dinner ? `
                            <div class="meal-card" style="border-left-color: #ef4444;">
                                <div class="meal-label" style="color: #ef4444;">Dinner</div>
                                <div class="meal-content">${plan.dinner.replace(/\n/g, '<br>')}</div>
                            </div>
                        ` : ''}
                    </div>
                </div>

                <!-- Right tips panel -->
                <div>
                    <!-- Hydration -->
                    ${plan.hydration ? `
                        <div class="glass-card plan-card" style="margin-bottom: 24px;">
                            <h3>💧 Hydration Guide</h3>
                            <p style="line-height: 1.6; font-size: 0.9rem; color: var(--text-secondary);">${plan.hydration.replace(/\n/g, '<br>')}</p>
                        </div>
                    ` : ''}

                    <!-- Notes -->
                    ${plan.notes ? `
                        <div class="glass-card plan-card">
                            <h3>📝 Nutrition Notes</h3>
                            <p style="line-height: 1.6; font-size: 0.9rem; color: var(--text-secondary);">${plan.notes.replace(/\n/g, '<br>')}</p>
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
                showAlert('Could not generate diet plan: No active session available.');
                return;
            }
        }

        // Show loading state
        const originalBtnText = generateBtn.innerHTML;
        generateBtn.disabled = true;
        generateBtn.innerHTML = `<span class="loading-spinner"></span> <span>Building Diet Plan...</span>`;
        loadingView.style.display = 'block';

        try {
            const data = await window.apiCall('/diet', {
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
            const parsed = parseDiet(data.reply);
            renderDietPlan(parsed, data.reply);
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
