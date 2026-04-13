/*
Esse arquivo cuida das partes dinamicas da interface: fundo animado, navegacao, busca e formulario.
Quando a pagina carrega eu inicializo tudo o que precisa de JavaScript.
*/
document.addEventListener('DOMContentLoaded', () => {
    initStarfield();
    initScrollReveal();
    initUplinkForm();
    initNavigation();
    initSearch();
});
/*
Aqui eu monto as estrelas dinamicas no fundo.
A logica cria particulas aleatorias, ajusta tamanho/opacidade e aplica animacao de brilho
para dar aquele visual de espaco sem precisar de imagem pesada.
*/
function initStarfield() {
    const starfield = document.getElementById('starfield');
    if (!starfield) return;

    const count = window.innerWidth < 768 ? 60 : 120;
    for (let i = 0; i < count; i++) {
        const star = document.createElement('div');
        const size = Math.random() * 1.5 + 0.5;
        star.style.cssText = `
            position: absolute;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            width: ${size}px;
            height: ${size}px;
            background: white;
            border-radius: 50%;
            opacity: ${Math.random() * 0.4 + 0.1};
            animation: twinkle ${(Math.random() * 3 + 2).toFixed(1)}s ease-in-out ${(Math.random() * 5).toFixed(1)}s infinite;
        `;
        starfield.appendChild(star);
    }

    if (!document.getElementById('twinkle-style')) {
        const style = document.createElement('style');
        style.id = 'twinkle-style';
        style.innerHTML = `
            @keyframes twinkle {
                0%, 100% { opacity: 0.15; transform: scale(0.8); }
                50%       { opacity: 0.8;  transform: scale(1.2); }
            }
        `;
        document.head.appendChild(style);
    }
}
/*
Essa funcao cuida da navegacao da pagina inteira.
Ela sincroniza estado ativo do menu com scroll, clique e pointerdown,
entao o item certo fica marcado sem precisar clicar duas vezes.
*/
function initNavigation() {
    const topLinks = Array.from(document.querySelectorAll('#top-nav .top-nav-link'));
    const sideLinks = Array.from(document.querySelectorAll('#sidebar-nav .sidebar-nav-link'));
    const mobileLinks = Array.from(document.querySelectorAll('#mobile-nav .mobile-nav-link'));
    const allTrackedLinks = [...topLinks, ...sideLinks, ...mobileLinks];

    const hashLinks = Array.from(document.querySelectorAll('a[href^="#"]'))
        .filter((link) => {
            const id = link.getAttribute('href');
            return id && id !== '#';
        });

    /*
    Aqui eu aplico visual ativo/inativo nos links do menu.
    Tambem marco aria-current para acessibilidade e leitura por tecnologia assistiva.
    */
    function applyActiveState(activeHash) {
        if (!activeHash) return;

        allTrackedLinks.forEach((link) => {
            const isActive = link.getAttribute('href') === activeHash;
            link.classList.toggle('is-active', isActive);
            if (isActive) {
                link.setAttribute('aria-current', 'page');
            } else {
                link.removeAttribute('aria-current');
            }
        });
    }

    /*
    Essa parte descobre qual secao esta visivel no momento pelo scroll da tela.
    Eu uso um marcador fixo para ter uma referencia estavel e evitar flicker.
    */
    function currentSectionHash() {
        const sections = Array.from(document.querySelectorAll('section[id]'));
        if (!sections.length) return '#home';

        const marker = 140;
        let active = sections[0];

        sections.forEach((section) => {
            const rect = section.getBoundingClientRect();
            if (rect.top <= marker && rect.bottom > marker) {
                active = section;
            }
        });

        return `#${active.id}`;
    }

    let pendingHash = null;
    let pendingUntil = 0;

    hashLinks.forEach((link) => {
        const id = link.getAttribute('href');
        if (!id) return;

        link.addEventListener('pointerdown', () => {
            pendingHash = id;
            pendingUntil = Date.now() + 1200;
            applyActiveState(id);
        });

        link.addEventListener('click', (e) => {
            const target = document.querySelector(id);
            if (!target) return;

            e.preventDefault();
            pendingHash = id;
            pendingUntil = Date.now() + 1200;
            applyActiveState(id);
            window.scrollTo({ top: target.offsetTop - 72, behavior: 'smooth' });
        });
    });

    let navTicking = false;
    /*
    Esse loop leve via requestAnimationFrame atualiza o menu durante o scroll.
    Ele respeita clique recente para nao perder o estado enquanto a rolagem suave acontece.
    */
    function updateFromScroll() {
        if (navTicking) return;
        navTicking = true;
        window.requestAnimationFrame(() => {
            if (pendingHash && Date.now() < pendingUntil) {
                const pendingTarget = document.querySelector(pendingHash);
                if (pendingTarget) {
                    const deltaTop = Math.abs(pendingTarget.getBoundingClientRect().top - 72);
                    applyActiveState(pendingHash);
                    if (deltaTop <= 14) {
                        pendingHash = null;
                    }
                } else {
                    pendingHash = null;
                }
                navTicking = false;
                return;
            }

            pendingHash = null;
            applyActiveState(currentSectionHash());
            navTicking = false;
        });
    }

    window.addEventListener('scroll', updateFromScroll, { passive: true });
    applyActiveState(currentSectionHash());
}
/*
Essa funcao faz o efeito de entrada das secoes quando aparecem na tela.
Uso IntersectionObserver para ficar leve e so animar o que realmente entrou no viewport.
*/
function initScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('opacity-100', 'translate-y-0');
                entry.target.classList.remove('opacity-0', 'translate-y-8');
            }
        });
    }, { threshold: 0.08 });

    document.querySelectorAll('section').forEach(section => {
        section.classList.add('transition-all', 'duration-700', 'opacity-0', 'translate-y-8');
        observer.observe(section);
    });
}
const SEARCH_ALIASES = {
    'module-cinetracker': ['cinetracker', 'cine tracker', 'filmes', 'cinema', 'catalogo de filmes', 'lista de filmes'],
    'module-jobmatchai': ['jobmatchai', 'job match ai', 'job match', 'vagas', 'curriculo', 'match de vagas', 'ia recrutamento'],
    'module-gensen': ['gensen', 'gerenciador de senhas', 'senha', 'password manager', 'cofre de senhas', 'seguranca'],
    'module-gestfreelas': ['gestfreelas', 'freelas', 'freelancer', 'freelancers', 'gestao'],
    'module-todo': ['todo', 'to-do', 'to do', 'tarefas', 'app de tarefas', 'task manager'],
    'module-topfilmes': ['topfilmes', 'cinema', 'filmes', 'tmdb'],
    'module-portfolio': ['portfolio', 'portifolio', 'chatbot', 'chat', 'assistente'],
    'core-systems': ['core principles', 'stack', 'tecnologias', 'desenvolvedor', 'fatec', 'back-end', 'backend'],
    'mission-fgv': ['fgv', 'fundacao getulio vargas', 'getulio vargas', 'engenheiro de software', 'genai', 'openai', 'salesforce', 'oauth', 'n8n', 'power automate'],
    'mission-soc': ['soc', 'credenciamento', 'suporte tecnico', 'homologacao', 'treinamento', 'qa funcional', 'experiencia do usuario'],
    'mission-gmreis': ['gmreis', 'controle de qualidade', 'garantia da qualidade', 'auditoria', 'estoque', 'logistica', 'nota fiscal'],
    'contact-email': ['contato', 'falar', 'email', 'mensagem'],
    'contact-linkedin': ['linkedin'],
    'contact-github': ['github', 'repositorio', 'repo'],
};

const DIRECT_SECTION_MATCHES = {
    inicio: { label: 'SECAO -> HOME', target: '#home', focusSelector: '#home' },
    home: { label: 'SECAO -> HOME', target: '#home', focusSelector: '#home' },
    sobre: { label: 'SECAO -> SOBRE', target: '#sobre', focusSelector: '#sobre' },
    projetos: { label: 'SECAO -> PROJETOS', target: '#projetos', focusSelector: '#projetos' },
    projeto: { label: 'SECAO -> PROJETOS', target: '#projetos', focusSelector: '#projetos' },
    contato: { label: 'SECAO -> CONTATO', target: '#contato', focusSelector: '#contato' },
};

let SEARCH_ENTRIES_CACHE = null;

/*
Essas funcoes de normalizacao deixam a busca mais inteligente.
Eu removo acento, padronizo espacos e simplifico texto para comparar melhor.
*/
function normalizeSearchText(value) {
    return (value || '')
        .toString()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

/*
Essa funcao cria uma versao compacta do texto sem espaco.
Uso isso para comparar palavras coladas e melhorar match parcial.
*/
function flattenSearchText(value) {
    return normalizeSearchText(value).replace(/\s+/g, '');
}

/*
Aqui eu quebro a busca em tokens menores.
Isso ajuda a pontuar resultados por partes quando a frase completa nao bate.
*/
function tokenizeSearchText(value) {
    return normalizeSearchText(value)
        .split(' ')
        .filter(token => token.length >= 2);
}

/*
Essa funcao pega a lista de apelidos de cada bloco.
Serve para cobrir termos alternativos que o usuario costuma digitar.
*/
function getAliasesForKey(key) {
    return SEARCH_ALIASES[key] || [];
}

/*
Aqui eu monto o indice de busca da pagina com blocos e secoes.
Cada item guarda texto normalizado, aliases e alvo de foco para rolar no lugar certo.
*/
function buildSearchEntries() {
    const entries = [];

    document.querySelectorAll('[data-search-key]').forEach((element) => {
        const key = element.getAttribute('data-search-key');
        if (!key) return;

        const section = element.closest('section[id]');
        const titleEl = element.querySelector('h1, h2, h3');
        const label = (titleEl?.textContent || key).trim();
        const text = normalizeSearchText(element.innerText || element.textContent || '');
        const aliases = getAliasesForKey(key).map(alias => normalizeSearchText(alias)).filter(Boolean);
        if (!text) return;

        entries.push({
            kind: 'block',
            key,
            label,
            target: section ? `#${section.id}` : '#home',
            focusSelector: `[data-search-key="${key}"]`,
            text,
            flatText: flattenSearchText(text),
            aliases,
        });
    });

    document.querySelectorAll('section[id]').forEach((section) => {
        const text = normalizeSearchText(section.innerText || section.textContent || '');
        if (!text) return;

        entries.push({
            kind: 'section',
            key: `section-${section.id}`,
            label: `SECAO -> ${section.id.toUpperCase()}`,
            target: `#${section.id}`,
            focusSelector: `#${section.id}`,
            text,
            flatText: flattenSearchText(text),
            aliases: [],
        });
    });

    return entries;
}

/*
Esse cache evita remontar o indice inteiro a cada busca.
Assim a pesquisa fica mais rapida e a pagina nao faz trabalho repetido.
*/
function getSearchEntries() {
    if (!SEARCH_ENTRIES_CACHE) {
        SEARCH_ENTRIES_CACHE = buildSearchEntries();
    }
    return SEARCH_ENTRIES_CACHE;
}

/*
Esse score calcula o quanto uma busca combina com o texto real de cada bloco.
Quanto melhor a combinacao, maior o score e maior a chance do resultado ser escolhido.
*/
function scoreTextMatch(queryNormalized, queryTokens, entry) {
    const queryFlat = flattenSearchText(queryNormalized);
    if (!queryFlat) return 0;

    const text = entry.text;
    const flat = entry.flatText;
    let score = 0;

    if (text.includes(queryNormalized)) {
        score = Math.max(score, 220 + queryNormalized.length);
    }

    if (queryFlat.length >= 3 && flat.includes(queryFlat)) {
        score = Math.max(score, 200 + queryFlat.length);
    }

    const tokenHits = queryTokens.filter(token => text.includes(token)).length;
    if (tokenHits > 0 && tokenHits === queryTokens.length) {
        score = Math.max(score, 160 + tokenHits * 12);
    } else if (tokenHits > 0) {
        score = Math.max(score, tokenHits * 34);
    }

    if (!score && queryNormalized.endsWith('s')) {
        const singular = queryNormalized.slice(0, -1);
        if (singular.length >= 3 && text.includes(singular)) {
            score = 125;
        }
    }

    if (entry.kind === 'section') {
        score -= 25;
    }

    return score;
}

/*
Aqui eu avalio os aliases dos blocos para cobrir variacoes de termos.
Serve para achar resultado mesmo quando a pessoa digita um nome alternativo.
*/
function scoreAliasMatch(queryNormalized, queryTokens, entry) {
    if (!entry.aliases.length) return 0;

    const queryFlat = flattenSearchText(queryNormalized);
    let bestScore = 0;

    entry.aliases.forEach((alias) => {
        const aliasFlat = flattenSearchText(alias);
        if (!aliasFlat) return;

        let score = 0;
        if (queryFlat === aliasFlat) {
            score = 140;
        } else if (queryFlat.length >= 3 && aliasFlat.includes(queryFlat)) {
            score = 115;
        } else {
            const aliasTokens = tokenizeSearchText(alias);
            const overlap = queryTokens.filter(token =>
                aliasTokens.some(aliasToken => aliasToken === token || aliasToken.startsWith(token))
            ).length;
            if (overlap > 0) {
                score = overlap === queryTokens.length ? 108 : overlap * 26;
            }
        }

        bestScore = Math.max(bestScore, score);
    });

    return bestScore;
}

/*
Essa funcao decide qual e o melhor resultado final da busca.
Primeiro testa match direto de secao, depois texto e por fim alias.
*/
function findBestSearchMatch(query) {
    const queryNormalized = normalizeSearchText(query);
    if (!queryNormalized) return null;

    const directMatch = DIRECT_SECTION_MATCHES[queryNormalized];
    if (directMatch) {
        return {
            label: directMatch.label,
            target: directMatch.target,
            focusSelector: directMatch.focusSelector,
            score: 999,
        };
    }

    const queryTokens = tokenizeSearchText(queryNormalized);
    if (!queryTokens.length) return null;
    const entries = getSearchEntries();

    let bestText = null;
    entries.forEach((entry) => {
        const score = scoreTextMatch(queryNormalized, queryTokens, entry);
        if (!bestText || score > bestText.score) {
            bestText = {
                label: entry.label,
                target: entry.target,
                focusSelector: entry.focusSelector,
                score,
            };
        }
    });
    if (bestText && bestText.score >= 70) return bestText;

    let bestAlias = null;
    entries
        .filter(entry => entry.kind === 'block')
        .forEach((entry) => {
            const score = scoreAliasMatch(queryNormalized, queryTokens, entry);
            if (!bestAlias || score > bestAlias.score) {
                bestAlias = {
                    label: entry.label,
                    target: entry.target,
                    focusSelector: entry.focusSelector,
                    score,
                };
            }
        });

    return bestAlias && bestAlias.score >= 110 ? bestAlias : null;
}

/*
Aqui eu mostro os avisos da busca na interface e escondo depois de alguns segundos.
Assim o usuario sempre recebe retorno visual do que aconteceu.
*/
function showSearchHint(message) {
    const hint = document.getElementById('search-hint');
    if (!hint) return;

    hint.textContent = message;
    hint.classList.remove('hidden');
    window.clearTimeout(showSearchHint.timeoutId);
    showSearchHint.timeoutId = window.setTimeout(() => hint.classList.add('hidden'), 3200);
}

/*
Aqui eu dou um destaque visual temporario no bloco encontrado.
Ajuda a pessoa entender rapido onde a busca aterrissou.
*/
function flashSearchTarget(element) {
    if (!element) return;

    element.classList.add('search-hit-active');
    window.setTimeout(() => {
        element.classList.remove('search-hit-active');
    }, 1600);
}

/*
Essa funcao faz a rolagem suave ate o alvo encontrado.
Eu deixo um espacamento no topo para o menu fixo nao esconder o conteudo.
*/
function scrollToSearchTarget(element) {
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const absoluteTop = window.pageYOffset + rect.top;
    window.scrollTo({ top: Math.max(0, absoluteTop - 92), behavior: 'smooth' });
}

/*
Essa e a execucao principal da busca: valida texto, acha resultado e rola para o alvo.
No fim eu ainda marco o bloco encontrado para facilitar a leitura de onde caiu.
*/
function runSearch(query) {
    const rawQuery = (query || '').trim();
    if (!rawQuery) {
        showSearchHint('> DIGITE_UMA_BUSCA: JAVA, AWS, GESTFREELAS, CONTATO...');
        return;
    }

    const match = findBestSearchMatch(rawQuery);

    if (!match) {
        showSearchHint(`> NENHUM_RESULTADO: "${rawQuery}"`);
        return;
    }

    const focusEl = document.querySelector(match.focusSelector);
    const targetEl = focusEl || document.querySelector(match.target);

    if (targetEl) {
        scrollToSearchTarget(targetEl);
        flashSearchTarget(targetEl);
    }

    showSearchHint(`> RESULTADO_ENCONTRADO: ${match.label}`);
}
/*
Aqui eu amarro eventos da barra de busca (Enter, clique e atalho Ctrl/Cmd+K).
Tambem uso captura para garantir que handlers antigos em cache nao atrapalhem.
*/
function initSearch() {
    const input = document.getElementById('hero-search');
    const btn = document.getElementById('search-btn');

    if (!input) return;
    if (window.__terminalSearchCaptureBound) return;
    document.addEventListener('keydown', (event) => {
        if (event.target === input && event.key === 'Enter') {
            event.preventDefault();
            event.stopImmediatePropagation();
            runSearch(input.value);
        }
    }, true);

    document.addEventListener('click', (event) => {
        const searchBtn = event.target.closest('#search-btn');
        if (searchBtn) {
            event.preventDefault();
            event.stopImmediatePropagation();
            runSearch(input.value);
            return;
        }

        const tag = event.target.closest('.search-tag');
        if (tag) {
            event.preventDefault();
            event.stopImmediatePropagation();
            input.value = (tag.textContent || '').trim();
            runSearch(input.value);
        }
    }, true);
    document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            input.focus();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });

    if (btn && !btn.getAttribute('type')) {
        btn.setAttribute('type', 'button');
    }

    window.__terminalSearchCaptureBound = true;
}
/*
Bloco de funcoes do formulario de contato.
A ideia e dar feedback claro de envio, erro e validacao sem deixar o usuario no escuro.
*/
/*
Essa funcao garante que existe um bloco de status dentro do formulario.
Se nao existir, ela cria na hora para mostrar mensagens de sucesso ou erro.
*/
function getContactStatusNode(form) {
    let statusNode = form.querySelector('[data-contact-status]');
    if (statusNode) return statusNode;

    statusNode = document.createElement('div');
    statusNode.setAttribute('data-contact-status', '1');
    statusNode.className = 'hidden font-label text-[10px] tracking-wide border px-3 py-2';
    form.appendChild(statusNode);
    return statusNode;
}

/*
Aqui eu limpo o status visual anterior antes de um novo envio.
Isso evita mensagem velha ficar misturada com resultado novo.
*/
function clearContactStatus(form) {
    const statusNode = form.querySelector('[data-contact-status]');
    if (!statusNode) return;
    statusNode.textContent = '';
    statusNode.classList.add('hidden');
}

/*
Essa funcao pinta e escreve a mensagem do formulario conforme o tipo.
Uso tons diferentes para info, sucesso e erro para ficar bem claro no front.
*/
function renderContactStatus(form, message, tone = 'info') {
    const statusNode = getContactStatusNode(form);
    statusNode.classList.remove(
        'hidden',
        'text-cyan-200', 'border-cyan-500/30', 'bg-cyan-500/10',
        'text-emerald-200', 'border-emerald-500/30', 'bg-emerald-500/10',
        'text-rose-200', 'border-rose-500/30', 'bg-rose-500/10'
    );

    const toneClasses = {
        info: ['text-cyan-200', 'border-cyan-500/30', 'bg-cyan-500/10'],
        success: ['text-emerald-200', 'border-emerald-500/30', 'bg-emerald-500/10'],
        error: ['text-rose-200', 'border-rose-500/30', 'bg-rose-500/10'],
    };

    statusNode.classList.add(...(toneClasses[tone] || toneClasses.info));
    statusNode.textContent = message;
}

/*
Essa funcao gerencia envio do formulario para /api/contact.
Eu bloqueio botao durante envio, trato erros da API e atualizo o estado visual do botao e da mensagem.
*/
function initUplinkForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;
    const btn = form.querySelector('button[type="submit"]');
    if (!btn) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const originalText = btn.innerText;
        clearContactStatus(form);

        btn.disabled = true;
        btn.innerText = 'ENVIANDO...';

        const payload = {
            nome:     form.querySelector('input[name="nome"]').value,
            email:    form.querySelector('input[name="email"]').value,
            mensagem: form.querySelector('textarea[name="mensagem"]').value,
        };

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                btn.innerText = 'ENVIO_OK';
                btn.classList.add('bg-emerald-600');
                btn.classList.remove('bg-primary-container');
                form.reset();
                renderContactStatus(form, 'Mensagem enviada com sucesso.', 'success');
            } else {
                let detail = '';
                try {
                    const errorPayload = await response.json();
                    if (typeof errorPayload?.detail === 'string') {
                        detail = errorPayload.detail;
                    }
                } catch {
                }
                const fallback = `Falha no envio (HTTP ${response.status}).`;
                throw new Error(detail || fallback);
            }
        } catch (error) {
            const rawMessage = error?.message || 'FALHA_NO_ENVIO';
            console.error('CONTACT_FORM_ERROR:', rawMessage);
            btn.innerText = 'ERRO_NO_ENVIO';
            btn.classList.add('bg-rose-700');
            btn.classList.remove('bg-primary-container');

            let userMessage = 'Nao foi possivel enviar agora. Tente novamente ou envie para patrickcsouza.dev@outlook.com.';
            if (rawMessage.includes('HTTP 400')) {
                userMessage = 'Preencha nome, email e mensagem antes de enviar.';
            }
            renderContactStatus(form, userMessage, 'error');
        } finally {
            setTimeout(() => {
                btn.disabled = false;
                btn.innerText = originalText;
                btn.classList.remove('bg-emerald-600', 'bg-rose-700');
                btn.classList.add('bg-primary-container');
            }, 3500);
        }
    });
}

