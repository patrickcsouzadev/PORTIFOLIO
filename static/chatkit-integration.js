(function () {
    'use strict';

    var STORAGE_KEY = 'chatkit_terminal_history_v2';
    var LEGACY_STORAGE_KEY = 'chatkit_history';
    var MAX_HISTORY_ITEMS = 60;
    var GREETING_MESSAGE =
        '\uD83D\uDC4B Ol\u00E1! Sou o assistente virtual do Patrick.\n' +
        '\uD83D\uDCBB Posso ajudar com projetos, stack e contatos.\n' +
        '\uD83D\uDE80 Como posso ajudar voc\u00EA hoje?';

    var state = {
        isOpen: false,
        isLoading: false,
        messages: [],
        refs: null,
    };

    document.addEventListener('DOMContentLoaded', initChat);

    function normalizeUtf8Text(value) {
        if (typeof value !== 'string') {
            return '';
        }

        return value
            .replace(/\u0000/g, '')
            .replace(/\uFFFD/g, '')
            .normalize('NFC');
    }

    function initChat() {
        var refs = getOrCreateElements();
        if (!refs) {
            return;
        }

        state.refs = refs;
        createInputArea();

        state.messages = migrateHistory(loadHistory());

        if (state.messages.length === 0) {
            addMessage('assistant', GREETING_MESSAGE);
        } else {
            state.messages.forEach(function (msg) {
                renderMessage(msg.role, msg.content, false);
            });
            scrollChatToBottom();
        }

        refs.toggleBtn.addEventListener('click', openChat);
        refs.closeBtn.addEventListener('click', closeChat);

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && state.isOpen) {
                closeChat();
            }
        });
    }

    function getOrCreateElements() {
        var container = document.getElementById('chatkit-container');

        if (!container) {
            container = document.createElement('div');
            container.id = 'chatkit-container';
            container.innerHTML = '' +
                '<button id="chatkit-toggle-btn" class="chatkit-float-btn" aria-label="Abrir assistente em terminal" aria-controls="chatkit-widget" aria-expanded="false" type="button">' +
                '  <span class="material-symbols-outlined" aria-hidden="true">terminal</span>' +
                '</button>' +
                '<section id="chatkit-widget" class="chatkit-widget-container" aria-label="Terminal de conversa com assistente">' +
                '  <header class="chatkit-header">' +
                '    <div class="chatkit-title-wrap">' +
                '      <span class="chatkit-title-dot" aria-hidden="true"></span>' +
                '      <h3>patrick-assistant@linux</h3>' +
                '    </div>' +
                '    <button id="chatkit-close-btn" aria-label="Fechar terminal de chat" type="button">' +
                '      <span class="material-symbols-outlined" aria-hidden="true">close</span>' +
                '    </button>' +
                '  </header>' +
                '  <div id="chatkit-chat-area" class="chatkit-chat-area" role="log" aria-live="polite"></div>' +
                '</section>';
            document.body.appendChild(container);
        }

        var toggleBtn = document.getElementById('chatkit-toggle-btn');
        var closeBtn = document.getElementById('chatkit-close-btn');
        var widgetContainer = document.getElementById('chatkit-widget');
        var chatArea = document.getElementById('chatkit-chat-area');

        if (!toggleBtn || !closeBtn || !widgetContainer || !chatArea) {
            return null;
        }

        return {
            container: container,
            toggleBtn: toggleBtn,
            closeBtn: closeBtn,
            widgetContainer: widgetContainer,
            chatArea: chatArea,
        };
    }

    function createInputArea() {
        if (document.getElementById('chatkit-form')) {
            return;
        }

        var inputArea = document.createElement('div');
        inputArea.className = 'chatkit-input-area';
        inputArea.innerHTML = '' +
            '<form id="chatkit-form" class="chatkit-form">' +
            '  <span class="chatkit-input-prefix">visitante@linux:~$</span>' +
            '  <input type="text" id="chatkit-input" class="chatkit-input" placeholder="digite sua mensagem..." autocomplete="off" />' +
            '  <button type="submit" id="chatkit-send-btn" class="chatkit-send-btn" aria-label="Enviar mensagem">enviar</button>' +
            '</form>';

        state.refs.widgetContainer.appendChild(inputArea);

        var form = document.getElementById('chatkit-form');
        var input = document.getElementById('chatkit-input');

        if (form) {
            form.addEventListener('submit', function (event) {
                event.preventDefault();
                handleSubmit();
            });
        }

        if (input) {
            input.addEventListener('keydown', function (event) {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    handleSubmit();
                }
            });
        }
    }

    function openChat() {
        if (!state.refs) {
            return;
        }

        state.isOpen = true;
        state.refs.widgetContainer.classList.add('active');
        state.refs.toggleBtn.classList.add('hidden');
        state.refs.toggleBtn.setAttribute('aria-expanded', 'true');

        window.setTimeout(function () {
            var input = document.getElementById('chatkit-input');
            if (input) {
                input.focus();
            }
        }, 120);
    }

    function closeChat() {
        if (!state.refs) {
            return;
        }

        state.isOpen = false;
        state.refs.widgetContainer.classList.remove('active');
        state.refs.toggleBtn.classList.remove('hidden');
        state.refs.toggleBtn.setAttribute('aria-expanded', 'false');
    }

    function handleSubmit() {
        var input = document.getElementById('chatkit-input');

        if (!input || state.isLoading) {
            return;
        }

        var message = normalizeUtf8Text(input.value.trim());

        if (!message) {
            return;
        }

        addMessage('user', message);
        input.value = '';

        state.isLoading = true;
        updateSendButtonState(true);
        showTypingIndicator();

        requestAssistantReply(message)
            .then(function (reply) {
                hideTypingIndicator();
                addMessage('assistant', reply);
            })
            .catch(function (error) {
                console.error('Erro no chat:', error);
                hideTypingIndicator();
                addMessage('assistant', '\u004E\u00E3o consegui completar esse comando agora. Verifique se a API est\u00E1 online e tente novamente.');
            })
            .finally(function () {
                state.isLoading = false;
                updateSendButtonState(false);
            });
    }

    function updateSendButtonState(isDisabled) {
        var sendBtn = document.getElementById('chatkit-send-btn');
        if (!sendBtn) {
            return;
        }

        sendBtn.disabled = isDisabled;
        sendBtn.textContent = isDisabled ? '...' : 'enviar';
    }

    async function requestAssistantReply(userMessage) {
        var apiUrl = resolveApiUrl();
        var shortHistory = state.messages.slice(-10).map(function (msg) {
            return {
                role: msg.role,
                content: msg.content,
            };
        });

        var response = await fetch(apiUrl + '/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=UTF-8' },
            body: JSON.stringify({
                message: userMessage,
                history: shortHistory,
            }),
        });

        if (!response.ok) {
            throw new Error('Falha HTTP ' + response.status);
        }

        var data = await response.json();
        if (!data || !data.response) {
            throw new Error('Resposta inv\u00E1lida da API');
        }

        return normalizeUtf8Text(data.response);
    }

    function resolveApiUrl() {
        var hostname = window.location.hostname;
        var protocol = window.location.protocol;

        if (hostname === 'localhost' || hostname === '127.0.0.1' || protocol === 'file:') {
            return 'http://localhost:8000';
        }

        return window.location.origin;
    }

    function addMessage(role, content) {
        var safeContent = normalizeUtf8Text(content);
        if (!safeContent) {
            return;
        }

        var message = {
            role: role,
            content: safeContent,
            timestamp: new Date().toISOString(),
        };

        state.messages.push(message);

        if (state.messages.length > MAX_HISTORY_ITEMS) {
            state.messages = state.messages.slice(-MAX_HISTORY_ITEMS);
        }

        renderMessage(role, safeContent, true);
        saveHistory();
    }

    function renderMessage(role, content, shouldScroll) {
        var chatArea = state.refs.chatArea;
        var messageEl = document.createElement('article');
        var prefixEl = document.createElement('span');
        var lineEl = document.createElement('pre');

        messageEl.className = 'chatkit-message chatkit-message-' + role;
        prefixEl.className = 'chatkit-prefix';
        prefixEl.textContent = role === 'user' ? 'visitante@linux:~$' : 'patrick-assistant@linux:~$';

        lineEl.className = 'chatkit-line';
        lineEl.textContent = content;

        messageEl.appendChild(prefixEl);
        messageEl.appendChild(lineEl);
        chatArea.appendChild(messageEl);

        if (shouldScroll !== false) {
            scrollChatToBottom();
        }
    }

    function showTypingIndicator() {
        if (document.getElementById('chatkit-typing')) {
            return;
        }

        var indicator = document.createElement('div');
        indicator.id = 'chatkit-typing';
        indicator.className = 'chatkit-typing-indicator';
        indicator.innerHTML = '' +
            '<span class="chatkit-prefix">patrick-assistant@linux:~$</span>' +
            '<div class="chatkit-typing-line"><span class="chatkit-cursor">processando comando</span></div>';

        state.refs.chatArea.appendChild(indicator);
        scrollChatToBottom();
    }

    function hideTypingIndicator() {
        var indicator = document.getElementById('chatkit-typing');
        if (indicator) {
            indicator.remove();
        }
    }

    function scrollChatToBottom() {
        state.refs.chatArea.scrollTop = state.refs.chatArea.scrollHeight;
    }

    function saveHistory() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state.messages));
        } catch (error) {
            console.warn('N\u00E3o foi poss\u00EDvel salvar hist\u00F3rico:', error);
        }
    }

    function loadHistory() {
        try {
            var stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                return sanitizeHistory(JSON.parse(stored));
            }

            var legacyStored = localStorage.getItem(LEGACY_STORAGE_KEY);
            if (legacyStored) {
                return sanitizeHistory(JSON.parse(legacyStored));
            }
        } catch (error) {
            console.warn('N\u00E3o foi poss\u00EDvel carregar hist\u00F3rico:', error);
        }

        return [];
    }

    function sanitizeHistory(items) {
        if (!Array.isArray(items)) {
            return [];
        }

        return items
            .filter(function (item) {
                return item && (item.role === 'assistant' || item.role === 'user') && typeof item.content === 'string';
            })
            .slice(-MAX_HISTORY_ITEMS)
            .map(function (item) {
                return {
                    role: item.role,
                    content: normalizeUtf8Text(item.content),
                    timestamp: item.timestamp || new Date().toISOString(),
                };
            });
    }

    function isLegacyGreeting(text) {
        var normalized = normalizeUtf8Text(text).toLowerCase();
        return normalized.indexOf('assistente virtual de patrick') >= 0 &&
            normalized.indexOf('como posso ajudar') >= 0;
    }

    function migrateHistory(items) {
        if (!Array.isArray(items) || items.length === 0) {
            return [];
        }

        var changed = false;
        var migrated = items.map(function (item) {
            if (item.role === 'assistant' && isLegacyGreeting(item.content)) {
                changed = true;
                return {
                    role: item.role,
                    content: GREETING_MESSAGE,
                    timestamp: item.timestamp,
                };
            }
            return item;
        });

        if (changed) {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
            } catch (error) {
                console.warn('N\u00E3o foi poss\u00EDvel migrar hist\u00F3rico do chat:', error);
            }
        }

        return migrated;
    }

    window.chatkit = {
        open: openChat,
        close: closeChat,
        clearHistory: function () {
            if (!state.refs) {
                return;
            }

            state.messages = [];
            state.refs.chatArea.innerHTML = '';
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(LEGACY_STORAGE_KEY);
            addMessage('assistant', GREETING_MESSAGE);
        },
    };
})();


