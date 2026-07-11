// chat.js
// Chat interface logic, message streaming, sidebar sessions history, and mobile drawer controls

document.addEventListener('DOMContentLoaded', () => {
    let activeSessionId = null;
    let sessionsList = [];

    // UI Nodes
    const sidebarList = document.getElementById('sidebar-sessions-list');
    const newChatBtn = document.getElementById('new-chat-btn');
    const logoutBtn = document.getElementById('sidebar-logout-btn');
    const chatTitle = document.getElementById('active-chat-title');
    const headerControls = document.getElementById('chat-header-controls');
    
    // Scroller and Streams
    const chatScroller = document.getElementById('chat-scroller');
    const messagesStream = document.getElementById('messages-stream');
    const welcomePlaceholder = document.getElementById('chat-welcome-placeholder');
    
    // Inputs & Send
    const chatForm = document.getElementById('chat-input-form');
    const messageInput = document.getElementById('chat-user-message-input');
    const sendBtn = document.getElementById('chat-send-btn');
    
    // Mobile Drawer
    const hamburgerBtn = document.getElementById('hamburger-menu-btn');
    const sidebarPanel = document.getElementById('sidebar-panel');
    const mobileOverlay = document.getElementById('mobile-overlay');
    const sidebarCloseBtn = document.getElementById('sidebar-close-btn');

    // Modals
    const renameDialog = document.getElementById('rename-dialog');
    const renameForm = document.getElementById('rename-dialog-form');
    const renameInput = document.getElementById('new-session-title-input');
    const renameCancelBtn = document.getElementById('rename-cancel-btn');

    // 1. Textarea Auto-Resize & Send Button State
    messageInput.addEventListener('input', () => {
        // Toggle send button based on text content
        const hasContent = messageInput.value.trim().length > 0;
        sendBtn.disabled = !hasContent || !activeSessionId;

        // Auto height adjust
        messageInput.style.height = 'auto';
        messageInput.style.height = `${messageInput.scrollHeight}px`;
    });

    // Handle Enter to Send, Shift+Enter to newline
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (messageInput.value.trim().length > 0 && activeSessionId && !sendBtn.disabled) {
                chatForm.dispatchEvent(new Event('submit'));
            }
        }
    });

    // 2. Mobile Drawer Controls
    function openSidebar() {
        sidebarPanel.classList.add('drawer-open');
        mobileOverlay.classList.add('active');
        if (sidebarCloseBtn) sidebarCloseBtn.style.display = 'block';
    }

    function closeSidebar() {
        sidebarPanel.classList.remove('drawer-open');
        mobileOverlay.classList.remove('active');
        if (sidebarCloseBtn) sidebarCloseBtn.style.display = 'none';
    }

    if (hamburgerBtn) hamburgerBtn.addEventListener('click', openSidebar);
    if (mobileOverlay) mobileOverlay.addEventListener('click', closeSidebar);
    if (sidebarCloseBtn) sidebarCloseBtn.addEventListener('click', closeSidebar);

    // Logout Hook
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            window.logoutUser();
        });
    }

    // Scroll to bottom helper
    function scrollToBottom() {
        chatScroller.scrollTop = chatScroller.scrollHeight;
    }

    // 3. Load Chat Sessions
    async function loadSessions(selectSessionId = null) {
        try {
            sessionsList = await window.apiCall('/chat-sessions', { method: 'GET' });
            renderSessionsList();

            // Handle session selection rules
            if (selectSessionId) {
                await loadSessionMessages(selectSessionId);
            } else if (sessionsList.length > 0 && !activeSessionId) {
                // If a session_id query param exists in URL, select it
                const urlParams = new URLSearchParams(window.location.search);
                const querySessionId = urlParams.get('session_id');
                
                if (querySessionId && sessionsList.some(s => s.id == querySessionId)) {
                    await loadSessionMessages(parseInt(querySessionId));
                } else {
                    // Auto-select the first session in list (most recent)
                    await loadSessionMessages(sessionsList[0].id);
                }
            } else if (sessionsList.length === 0) {
                // No sessions exist - trigger auto-creation
                await handleCreateSession();
            }
        } catch (error) {
            console.error('Failed to load chat sessions:', error);
            sidebarList.innerHTML = `<div style="padding: 20px; text-align: center; color: #ef4444; font-size: 0.85rem;">Failed to load history</div>`;
        }
    }

    // 4. Render Sessions List in Sidebar
    function renderSessionsList() {
        sidebarList.innerHTML = '';
        
        sessionsList.forEach(session => {
            const item = document.createElement('div');
            const isActive = session.id === activeSessionId;
            item.className = `sidebar-session-item ${isActive ? 'active' : ''}`;
            item.setAttribute('data-id', session.id);
            
            item.innerHTML = `
                <span class="session-name-text" title="${session.title}">${session.title}</span>
                <div class="session-actions">
                    <button class="session-action-btn edit-btn" title="Rename">&#9998;</button>
                    <button class="session-action-btn delete-btn" title="Delete">&#128465;</button>
                </div>
            `;

            // Click session item -> select session
            item.addEventListener('click', (e) => {
                const isEditBtn = e.target.classList.contains('edit-btn');
                const isDeleteBtn = e.target.classList.contains('delete-btn');
                
                if (!isEditBtn && !isDeleteBtn) {
                    loadSessionMessages(session.id);
                    closeSidebar(); // Close mobile drawer if open
                }
            });

            // Click rename
            item.querySelector('.edit-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                triggerRename(session.id, session.title);
            });

            // Click delete
            item.querySelector('.delete-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                triggerDelete(session.id);
            });

            sidebarList.appendChild(item);
        });
    }

    // 5. Load Session Messages
    async function loadSessionMessages(sessionId) {
        activeSessionId = sessionId;
        
        // Update URL parameter without reloading page for bookmark stability
        const newUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}?session_id=${sessionId}`;
        window.history.replaceState({ path: newUrl }, '', newUrl);

        // Highlight active session
        document.querySelectorAll('.sidebar-session-item').forEach(item => {
            const itemId = parseInt(item.getAttribute('data-id'));
            if (itemId === sessionId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // Set UI Header Info
        const activeSession = sessionsList.find(s => s.id === sessionId);
        if (activeSession) {
            chatTitle.textContent = activeSession.title;
            headerControls.style.display = 'flex';
        }

        try {
            welcomePlaceholder.style.display = 'none';
            messagesStream.innerHTML = `
                <div class="animate-pulse" style="text-align: center; color: var(--text-muted); font-size: 0.95rem; padding: 40px;">
                    Retrieving messages...
                </div>
            `;

            const messages = await window.apiCall(`/chat-session/${sessionId}`, { method: 'GET' });
            messagesStream.innerHTML = ''; // Clear loader

            if (!messages || messages.length === 0) {
                welcomePlaceholder.style.display = 'flex';
            } else {
                messages.forEach(msg => {
                    appendMessageBubble(msg.role, msg.message);
                });
                scrollToBottom();
            }

            // Enable inputs
            messageInput.disabled = false;
            const hasContent = messageInput.value.trim().length > 0;
            sendBtn.disabled = !hasContent;

        } catch (error) {
            console.error('Failed to load session messages:', error);
            messagesStream.innerHTML = `
                <div style="text-align: center; color: #ef4444; font-size: 0.95rem; padding: 40px;">
                    Failed to fetch messages for this session.
                </div>
            `;
        }
    }

    // Helper: Create message bubble HTML
    function appendMessageBubble(role, message) {
        const bubble = document.createElement('div');
        const isUser = role === 'user';
        bubble.className = `chat-message ${isUser ? 'user-message' : 'assistant-message'}`;
        
        // Convert newlines in message text to HTML breaks
        const formattedText = message.replace(/\n/g, '<br>');

        bubble.innerHTML = `
            <div class="message-avatar">${isUser ? 'ME' : 'AI'}</div>
            <div class="message-bubble">${formattedText}</div>
        `;
        messagesStream.appendChild(bubble);
    }

    // 6. Handle Create Session
    async function handleCreateSession() {
        try {
            const newSession = await window.apiCall('/chat-session', { method: 'POST' });
            activeSessionId = newSession.session_id;
            
            // Reload list and select it
            await loadSessions(newSession.session_id);
        } catch (error) {
            console.error('Failed to create new chat session:', error);
        }
    }

    if (newChatBtn) {
        newChatBtn.addEventListener('click', async () => {
            // Remove session ID from URL to avoid query parameter overrides
            const cleanUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}`;
            window.history.replaceState({}, '', cleanUrl);
            
            await handleCreateSession();
            closeSidebar();
        });
    }

    // 7. Send Message Flow
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!activeSessionId) return;

        const messageText = messageInput.value.trim();
        if (!messageText) return;

        // Display user message instantly
        appendMessageBubble('user', messageText);
        scrollToBottom();

        // Clear input field and trigger resize
        messageInput.value = '';
        messageInput.style.height = '56px';
        sendBtn.disabled = true;
        
        // Show typing indicator
        const typingBubble = document.createElement('div');
        typingBubble.id = 'chat-indicator-bubble';
        typingBubble.className = 'chat-message assistant-message';
        typingBubble.innerHTML = `
            <div class="message-avatar">AI</div>
            <div class="message-bubble">
                <div class="typing-indicator">
                    <span class="typing-dot"></span>
                    <span class="typing-dot"></span>
                    <span class="typing-dot"></span>
                </div>
            </div>
        `;
        messagesStream.appendChild(typingBubble);
        scrollToBottom();

        // Disable input during network transmission to prevent double submission
        messageInput.disabled = true;

        try {
            const data = await window.apiCall('/ai-chat', {
                method: 'POST',
                body: {
                    session_id: activeSessionId,
                    message: messageText
                }
            });

            // Remove indicator
            const indicator = document.getElementById('chat-indicator-bubble');
            if (indicator) indicator.remove();

            // Append response message
            appendMessageBubble('assistant', data.reply);
            scrollToBottom();

            // Reload sidebar (to pull the updated title, which backend updates to query start)
            await loadSessions(activeSessionId);

        } catch (error) {
            // Remove indicator
            const indicator = document.getElementById('chat-indicator-bubble');
            if (indicator) indicator.remove();
            
            appendMessageBubble('assistant', `⚠️ Error: ${error.message || 'Unable to fetch reply from AI coach.'}`);
            scrollToBottom();
        } finally {
            messageInput.disabled = false;
            messageInput.focus();
        }
    });

    // 8. Delete Chat Flow
    async function triggerDelete(sessionId) {
        if (confirm('Are you sure you want to delete this chat session?')) {
            try {
                await window.apiCall(`/chat-session/${sessionId}`, { method: 'DELETE' });
                
                if (activeSessionId === sessionId) {
                    activeSessionId = null;
                    messagesStream.innerHTML = '';
                    chatTitle.textContent = 'AI Coach Chat';
                    headerControls.style.display = 'none';
                    welcomePlaceholder.style.display = 'flex';
                }
                
                await loadSessions();
            } catch (error) {
                alert(`Failed to delete chat session: ${error.message}`);
            }
        }
    }

    if (deleteBtnHeader = document.getElementById('delete-session-header-btn')) {
        deleteBtnHeader.addEventListener('click', () => {
            if (activeSessionId) triggerDelete(activeSessionId);
        });
    }

    // 9. Rename Chat Flow
    let renamingSessionId = null;

    function triggerRename(sessionId, currentTitle) {
        renamingSessionId = sessionId;
        renameInput.value = currentTitle;
        renameDialog.showModal();
    }

    if (renameBtnHeader = document.getElementById('rename-session-header-btn')) {
        renameBtnHeader.addEventListener('click', () => {
            if (activeSessionId) {
                const currentSession = sessionsList.find(s => s.id === activeSessionId);
                triggerRename(activeSessionId, currentSession ? currentSession.title : '');
            }
        });
    }

    renameCancelBtn.addEventListener('click', () => {
        renameDialog.close();
    });

    renameForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newTitle = renameInput.value.trim();
        if (!newTitle || !renamingSessionId) return;

        try {
            await window.apiCall(`/chat-session/${renamingSessionId}`, {
                method: 'PATCH',
                body: { title: newTitle }
            });
            
            renameDialog.close();
            
            // Reload lists and select
            await loadSessions(activeSessionId);
        } catch (error) {
            alert(`Failed to rename: ${error.message}`);
        }
    });

    // Init: Load chats on startup
    // Parse URL parameter new=true
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('new') === 'true') {
        // Clean URL first
        const cleanUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}`;
        window.history.replaceState({}, '', cleanUrl);
        handleCreateSession();
    } else {
        loadSessions();
    }
});
