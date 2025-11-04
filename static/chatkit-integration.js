// Integração do Chat com backend personalizado
(function() {
    'use strict';

    // Elementos do DOM
    const toggleBtn = document.getElementById('chatkit-toggle-btn');
    const closeBtn = document.getElementById('chatkit-close-btn');
    const widgetContainer = document.getElementById('chatkit-widget');
    const chatArea = document.getElementById('chatkit-chat-area');

    // Estado do chat
    let isOpen = false;
    let messages = [];
    let isLoading = false;

    // Inicializar ao carregar a página
    document.addEventListener('DOMContentLoaded', initChat);

    function initChat() {
        // Criar área de input
        createInputArea();
        
        // Carregar histórico
        loadHistory();
        
        // Mensagem de boas-vindas se não houver histórico
        if (messages.length === 0) {
            addMessage('assistant', '�� Olá! Sou o assistente virtual de Patrick. Como posso ajudar você hoje?');
        } else {
            // Renderizar mensagens salvas
            messages.forEach(msg => {
                renderMessage(msg.role, msg.content);
            });
        }

        // Event listeners
        toggleBtn.addEventListener('click', openChat);
        closeBtn.addEventListener('click', closeChat);
        
        // Fechar com ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && isOpen) closeChat();
        });
    }

    function createInputArea() {
        const inputArea = document.createElement('div');
        inputArea.className = 'chatkit-input-area';
        inputArea.innerHTML = `
            <form id="chatkit-form" class="chatkit-form">
                <input
                    type="text"
                    id="chatkit-input"
                    class="chatkit-input"
                    placeholder="Digite sua mensagem..."
                    autocomplete="off"
                />
                <button type="submit" id="chatkit-send-btn" class="chatkit-send-btn" aria-label="Enviar mensagem">
                    <i class="fas fa-paper-plane"></i>
                </button>
            </form>
        `;
        widgetContainer.appendChild(inputArea);

        // Aguardar o DOM estar pronto
        setTimeout(() => {
            const form = document.getElementById('chatkit-form');
            const sendBtn = document.getElementById('chatkit-send-btn');
            const input = document.getElementById('chatkit-input');

            // Prevenir submit do formulário
            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    handleSubmit();
                });
            }

            if (sendBtn) {
                sendBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    handleSubmit();
                });
            }

            if (input) {
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSubmit();
                    }
                });
            }
        }, 100);
    }

    function openChat() {
        isOpen = true;
        widgetContainer.classList.add('active');
        toggleBtn.style.display = 'none';
        setTimeout(() => {
            document.getElementById('chatkit-input')?.focus();
        }, 300);
    }

    function closeChat() {
        isOpen = false;
        widgetContainer.classList.remove('active');
        toggleBtn.style.display = 'flex';
    }

    async function handleSubmit(e) {
        // Prevenir comportamento padrão se evento foi passado
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        const input = document.getElementById('chatkit-input');
        if (!input) return;

        const message = input.value.trim();

        if (!message || isLoading) return;
        
        // Adicionar mensagem do usuário
        addMessage('user', message);
        input.value = '';
        
        // Mostrar indicador de digitando
        isLoading = true;
        showTyping();
        
        try {
            // Determinar URL da API baseado no ambiente
            const hostname = window.location.hostname;
            const protocol = window.location.protocol;
            let apiUrl = '';

            if (hostname === 'localhost' || hostname === '127.0.0.1' || protocol === 'file:') {
                apiUrl = 'http://localhost:8000';
            } else {
                // Em produção, usa URL relativa (funciona em qualquer domínio)
                apiUrl = window.location.origin;
            }

            const response = await fetch(`${apiUrl}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: message,
                    history: messages.slice(-10)
                })
            });
            
            if (!response.ok) throw new Error('Erro na resposta do servidor');
            
            const data = await response.json();
            hideTyping();
            addMessage('assistant', data.response);
            
        } catch (error) {
            console.error('Erro:', error);
            hideTyping();
            addMessage('assistant', '❌ Desculpe, ocorreu um erro. O servidor pode estar offline. Tente novamente em alguns instantes ou entre em contato por e-mail.');
        } finally {
            isLoading = false;
        }
    }

    function addMessage(role, content) {
        messages.push({ role, content, timestamp: new Date() });
        renderMessage(role, content);
        saveHistory();
    }

    function renderMessage(role, content) {
        const messageEl = document.createElement('div');
        messageEl.className = `chatkit-message chatkit-message-${role}`;
        
        const avatar = document.createElement('div');
        avatar.className = 'chatkit-avatar';
        avatar.innerHTML = role === 'user' 
            ? '<i class="fas fa-user"></i>' 
            : '<i class="fas fa-robot"></i>';
        
        const bubble = document.createElement('div');
        bubble.className = 'chatkit-bubble';
        bubble.textContent = content;
        
        messageEl.appendChild(avatar);
        messageEl.appendChild(bubble);
        chatArea.appendChild(messageEl);
        
        chatArea.scrollTop = chatArea.scrollHeight;
    }

    function showTyping() {
        const indicator = document.createElement('div');
        indicator.className = 'chatkit-typing-indicator';
        indicator.id = 'chatkit-typing';
        indicator.innerHTML = `
            <div class="chatkit-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="chatkit-typing-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;
        chatArea.appendChild(indicator);
        chatArea.scrollTop = chatArea.scrollHeight;
    }

    function hideTyping() {
        document.getElementById('chatkit-typing')?.remove();
    }

    function saveHistory() {
        try {
            localStorage.setItem('chatkit_history', JSON.stringify(messages));
        } catch (e) {
            console.warn('Erro ao salvar histórico:', e);
        }
    }

    function loadHistory() {
        try {
            const saved = localStorage.getItem('chatkit_history');
            if (saved) {
                messages = JSON.parse(saved);
            }
        } catch (e) {
            console.warn('Erro ao carregar histórico:', e);
        }
    }

    // Expor função para limpar histórico
    window.chatkit = {
        clearHistory: function() {
            messages = [];
            chatArea.innerHTML = '';
            localStorage.removeItem('chatkit_history');
            addMessage('assistant', '🔄 Histórico limpo! Como posso ajudar?');
        }
    };

})();
