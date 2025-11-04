// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    initMobileMenu();
    initSearch();
    initScrollAnimations();
    initCertificates();
    initProjects();
    createMeteors();
    animateOnScroll();
    initLazyLoading();
    initThemeSystem();
    showWelcomeMessage();
    initSobreAnimations();
    initContactForm();
});

// Menu mobile
function initMobileMenu() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');

    hamburger.addEventListener('click', function() {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // Fechar menu ao clicar em link
    navMenu.addEventListener('click', function(e) {
        if (e.target.tagName === 'A') {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        }
    });
}

// Sistema de busca
function initSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchableElements = document.querySelectorAll('.searchable');
    const noResults = document.getElementById('noResults');

    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase().trim();
        
        if (searchTerm === '') {
            showAllSections();
            hideNoResults();
            removeHighlights();
            return;
        }

        let hasResults = false;
        
        searchableElements.forEach(element => {
            const text = element.textContent.toLowerCase();
            const isMatch = text.includes(searchTerm);
            
            if (isMatch) {
                element.style.display = 'block';
                hasResults = true;
                highlightText(element, searchTerm);
            } else {
                element.style.display = 'none';
                removeHighlights(element);
            }
        });

        if (hasResults) {
            hideNoResults();
        } else {
            showNoResults();
        }
    });
}

function showAllSections() {
    document.querySelectorAll('.searchable').forEach(el => {
        el.style.display = 'block';
    });
}

function showNoResults() {
    document.getElementById('noResults').style.display = 'block';
}

function hideNoResults() {
    document.getElementById('noResults').style.display = 'none';
}

function highlightText(element, searchTerm) {
    removeHighlights(element);
    
    const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        null,
        false
    );

    const textNodes = [];
    let node;
    
    while (node = walker.nextNode()) {
        if (node.nodeValue.toLowerCase().includes(searchTerm)) {
            textNodes.push(node);
        }
    }

    textNodes.forEach(textNode => {
        const text = textNode.nodeValue;
        const regex = new RegExp(`(${searchTerm})`, 'gi');
        
        if (regex.test(text)) {
            const highlightedHTML = text.replace(regex, '<span class="highlight">$1</span>');
            const wrapper = document.createElement('div');
            wrapper.innerHTML = highlightedHTML;
            
            while (wrapper.firstChild) {
                textNode.parentNode.insertBefore(wrapper.firstChild, textNode);
            }
            textNode.remove();
        }
    });
}

function removeHighlights(element = document) {
    const highlights = element.querySelectorAll('.highlight');
    highlights.forEach(highlight => {
        const parent = highlight.parentNode;
        parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
        parent.normalize();
    });
}

// Animações de scroll
function initScrollAnimations() {
    const sections = document.querySelectorAll('section');
    
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    sections.forEach(section => {
        observer.observe(section);
    });
}

// Animações laterais para "Sobre Mim"
function initSobreAnimations() {
    const sobreTexto = document.querySelector('.sobre-texto');
    const fotoContainer = document.querySelector('.foto-container');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                if (entry.target === sobreTexto) {
                    sobreTexto.classList.add('animate-in');
                }
                if (entry.target === fotoContainer) {
                    fotoContainer.classList.add('animate-in');
                }
            }
        });
    }, { threshold: 0.3 });

    observer.observe(sobreTexto);
    observer.observe(fotoContainer);
}

// Criar meteoros - AJUSTADO
function createMeteors() {
    function createMeteor() {
        const meteor = document.createElement('div');
        meteor.className = 'meteor';
        meteor.style.left = Math.random() * 100 + 'vw';
        meteor.style.animationDelay = Math.random() * 2 + 's';
        meteor.style.animationDuration = (Math.random() * 3 + 2) + 's';
        
        document.querySelector('.space-background').appendChild(meteor);
        
        setTimeout(() => {
            if (meteor.parentNode) {
                meteor.remove();
            }
        }, 5000);
    }

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    // AJUSTE: Intervalo reduzido para gerar mais meteoros com maior frequência
    const meteorInterval = isMobile ? 800 : 400; 
    const meteorChance = isMobile ? 0.7 : 1;

    setInterval(() => {
        if (Math.random() <= meteorChance) {
            createMeteor();
        }
    }, meteorInterval);
}

// Animação suave ao rolar
function animateOnScroll() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const headerHeight = document.querySelector('header').offsetHeight;
                const targetPosition = targetSection.offsetTop - headerHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Lazy loading para imagens
function initLazyLoading() {
    const images = document.querySelectorAll('img');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.style.transition = 'opacity 0.3s';
                img.style.opacity = '0';
                
                img.onload = () => {
                    img.style.opacity = '1';
                };
                
                if (img.complete) {
                    img.style.opacity = '1';
                }
                
                observer.unobserve(img);
            }
        });
    });

    images.forEach(img => imageObserver.observe(img));
}

// Sistema de temas
function initThemeSystem() {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    
    if (prefersDark.matches) {
        document.body.classList.add('dark-theme');
    }

    prefersDark.addEventListener('change', (e) => {
        if (e.matches) {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
    });
}

// Formulário de contato
function initContactForm() {
    const form = document.getElementById('contatoForm');
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(form);
        const nome = formData.get('nome');
        const empresa = formData.get('empresa');
        const email = formData.get('email');
        const mensagem = formData.get('mensagem');
        
        // Obter botão e mensagem de erro (se existir)
        const btn = form.querySelector('.btn-enviar');
        const originalText = btn.innerHTML;
        const originalStyle = btn.style.background;
        
        // Remover mensagem de erro anterior, se existir
        const errorMsg = form.querySelector('.error-message');
        if (errorMsg) {
            errorMsg.remove();
        }
        
        // Desabilitar botão e mostrar loading
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
        
        try {
            // Determinar URL da API
            // Se estiver rodando localmente (file:// ou localhost), usa porta 8000
            // Caso contrário, assume que está em produção no mesmo domínio
            let apiUrl = '';
            const hostname = window.location.hostname;
            const protocol = window.location.protocol;
            
            if (hostname === 'localhost' || hostname === '127.0.0.1' || protocol === 'file:') {
                apiUrl = 'http://localhost:8000';
            } else {
                // Em produção, aponta para a API na Vercel
                // IMPORTANTE: Substitua pela URL do seu deploy na Vercel
                apiUrl = 'https://SEU-PROJETO.vercel.app';
            }
            
            // Enviar dados para o backend
            const response = await fetch(`${apiUrl}/api/contact`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    nome: nome,
                    empresa: empresa || null,
                    email: email,
                    mensagem: mensagem
                })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.detail || 'Erro ao enviar mensagem');
            }
            
            // Sucesso
            btn.innerHTML = '<i class="fas fa-check"></i> Enviado!';
            btn.style.background = 'linear-gradient(45deg, #4CAF50, #45a049)';
            form.reset();
            
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.style.background = originalStyle;
                btn.disabled = false;
            }, 3000);
            
        } catch (error) {
            // Erro
            console.error('Erro ao enviar formulário:', error);
            btn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Erro ao Enviar';
            btn.style.background = 'linear-gradient(45deg, #f44336, #d32f2f)';
            
            // Mostrar mensagem de erro
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.style.cssText = 'color: #f44336; margin-top: 1rem; padding: 1rem; background: rgba(244, 67, 54, 0.1); border: 1px solid rgba(244, 67, 54, 0.3); border-radius: 10px; font-size: 1.3rem;';
            errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${error.message || 'Erro ao enviar mensagem. Tente novamente mais tarde.'}`;
            form.appendChild(errorDiv);
            
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.style.background = originalStyle;
                btn.disabled = false;
                if (errorDiv.parentNode) {
                    errorDiv.remove();
                }
            }, 8000);
        }
    });
}

// Inicializar certificados com slider
function initCertificates() {
    // Lista de certificados
    const certificates = [
        { img: 'imagens/certsenac.jpg', alt: 'Certificado SENAC' },
        { img: 'imagens/certredes.jpg', alt: 'Certificado Redes' },
        { img: 'imagens/certetec.jpg', alt: 'Certificado ETEC' },
        { img: 'imagens/certgit.png', alt: 'Certificado Git' },
        { img: 'imagens/certSOC.jpeg', alt: 'Certificado SOC' },
        { img: 'imagens/certdocker.png', alt: 'Certificado Docker' },
        { img: 'imagens/cergithub.png', alt: 'Certificado GitHub' },
        { img: 'imagens/certSQL.png', alt: 'Certificado SQL' },
        { img: 'imagens/certtestes.jpg', alt: 'Certificado Testes' },
    ];

    const certPages = document.getElementById('certPages');
    const certPagination = document.getElementById('certPagination');
    const certPrev = document.getElementById('certPrev');
    const certNext = document.getElementById('certNext');

    // Modal elements
    const modal = document.getElementById('certModal');
    const modalImg = document.getElementById('certModalImg');
    const modalClose = document.getElementById('certModalClose');
    const modalPrev = document.getElementById('certModalPrev');
    const modalNext = document.getElementById('certModalNext');
    let currentModalIndex = 0;

    const CERTS_PER_PAGE = 4; // 2 linhas x 2 colunas
    let currentPage = 0;
    const totalPages = Math.ceil(certificates.length / CERTS_PER_PAGE);

    // Criar páginas de certificados
    function createPages() {
        certPages.innerHTML = '';

        for (let i = 0; i < totalPages; i++) {
            const page = document.createElement('div');
            page.className = 'cert-page';

            const startIdx = i * CERTS_PER_PAGE;
            const endIdx = Math.min(startIdx + CERTS_PER_PAGE, certificates.length);

            for (let j = startIdx; j < endIdx; j++) {
                const cert = certificates[j];
                const certCard = document.createElement('div');
                certCard.className = 'cert-card';
                certCard.innerHTML = `<img src="${cert.img}" alt="${cert.alt}" loading="lazy" data-index="${j}">`;
                certCard.addEventListener('click', () => openModal(j));
                page.appendChild(certCard);
            }

            certPages.appendChild(page);
        }
    }

    // Abrir modal com certificado
    function openModal(index) {
        currentModalIndex = index;
        modalImg.src = certificates[index].img;
        modalImg.alt = certificates[index].alt;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    // Fechar modal
    function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Navegar no modal
    function navigateModal(direction) {
        currentModalIndex += direction;

        // Loop circular
        if (currentModalIndex < 0) {
            currentModalIndex = certificates.length - 1;
        } else if (currentModalIndex >= certificates.length) {
            currentModalIndex = 0;
        }

        modalImg.src = certificates[currentModalIndex].img;
        modalImg.alt = certificates[currentModalIndex].alt;
    }

    // Event listeners do modal
    modalClose.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    modalPrev.addEventListener('click', () => navigateModal(-1));
    modalNext.addEventListener('click', () => navigateModal(1));

    // Teclas do teclado
    document.addEventListener('keydown', (e) => {
        if (modal.classList.contains('active')) {
            if (e.key === 'Escape') {
                closeModal();
            } else if (e.key === 'ArrowLeft') {
                navigateModal(-1);
            } else if (e.key === 'ArrowRight') {
                navigateModal(1);
            }
        }
    });

    // Criar indicadores de paginação
    function createPagination() {
        certPagination.innerHTML = '';

        for (let i = 0; i < totalPages; i++) {
            const dot = document.createElement('div');
            dot.className = 'cert-dot';
            if (i === 0) dot.classList.add('active');
            dot.addEventListener('click', () => goToPage(i));
            certPagination.appendChild(dot);
        }
    }

    // Navegar para página específica
    function goToPage(pageNum) {
        currentPage = pageNum;
        const offset = -pageNum * 100;
        certPages.style.transform = `translateX(${offset}%)`;

        // Atualizar dots
        document.querySelectorAll('.cert-dot').forEach((dot, idx) => {
            dot.classList.toggle('active', idx === pageNum);
        });

        // Atualizar visibilidade das setas
        certPrev.style.opacity = currentPage === 0 ? '0.3' : '1';
        certPrev.style.cursor = currentPage === 0 ? 'not-allowed' : 'pointer';
        certNext.style.opacity = currentPage === totalPages - 1 ? '0.3' : '1';
        certNext.style.cursor = currentPage === totalPages - 1 ? 'not-allowed' : 'pointer';
    }

    // Event listeners para setas
    certPrev.addEventListener('click', () => {
        if (currentPage > 0) {
            goToPage(currentPage - 1);
        }
    });

    certNext.addEventListener('click', () => {
        if (currentPage < totalPages - 1) {
            goToPage(currentPage + 1);
        }
    });

    // Inicializar
    createPages();
    createPagination();
    goToPage(0);
}

// Inicializar projetos com slider
function initProjects() {
    // Lista de projetos com dados completos
    const projects = [
        {
            title: 'To-do App',
            icon: 'fas fa-tasks',
            description: 'Aplicação moderna de gerenciamento de tarefas com interface intuitiva. Sistema completo de CRUD com persistência de dados e filtros avançados.',
            tech: ['JavaScript', 'React', 'CSS3', 'Vercel'],
            github: 'https://github.com/patrickcsouzadev/todo-app',
            site: 'https://app-list-ptk.vercel.app/'
        },
        {
            title: 'GestFreelas',
            icon: 'fas fa-briefcase',
            description: 'Plataforma completa para gestão de freelancers e projetos. Sistema de autenticação, dashboard administrativo e controle financeiro integrado.',
            tech: ['Python', 'Django', 'PostgreSQL', 'Bootstrap'],
            github: 'https://github.com/patrickcsouzadev/gestfreelas',
            site: 'https://gestfreelas.com.br/login'
        },
        {
            title: 'Portfólio Pessoal',
            icon: 'fas fa-user',
            description: 'Site pessoal responsivo com design futurista e animações espaciais. Sistema de busca em tempo real e otimização para performance mobile-first.',
            tech: ['HTML5', 'CSS3', 'JavaScript', 'FastAPI'],
            github: 'https://github.com/patrickcsouzadev/PORTIFOLIO',
            site: 'https://www.patrickcsouzadev.com.br/'
        },
        {
            title: 'TopFilmesBrasil',
            icon: 'fas fa-film',
            description: 'Portal de recomendações cinematográficas com sistema de ranking personalizado. Interface moderna com filtros avançados e integração com APIs de cinema.',
            tech: ['JavaScript', 'API REST', 'Azure', 'Bootstrap'],
            github: 'https://github.com/patrickcsouzadev/topfilmesc',
            site: 'https://topfilmesbrasil-prod-fkgdaneudgdcebfk.brazilsouth-01.azurewebsites.net/movies'
        },
        {
            title: 'GenSen - Gerenciador de Senhas',
            icon: 'fas fa-shield-alt',
            description: 'Sistema completo para gerenciamento seguro de senhas com criptografia avançada. Interface intuitiva com autenticação robusta e armazenamento local seguro.',
            tech: ['Python', 'Tkinter', 'Criptografia', 'SQLite'],
            github: 'https://github.com/patrickcsouzadev/GenSen---O-seu-gerenciador-de-senhas',
            site: null
        },
        {
            title: 'CineTracker',
            icon: 'fas fa-star',
            description: 'Aplicação para rastreamento de filmes e séries assistidas. Sistema de avaliação pessoal com integração a APIs de cinema e interface responsiva.',
            tech: ['JavaScript', 'HTML5', 'CSS3', 'API'],
            github: 'https://github.com/patrickcsouzadev/CineTracker',
            site: null
        }
    ];

    const projetoPages = document.getElementById('projetoPages');
    const projetoPagination = document.getElementById('projetoPagination');
    const projetoPrev = document.getElementById('projetoPrev');
    const projetoNext = document.getElementById('projetoNext');

    const PROJECTS_PER_PAGE = 4; // 2 linhas x 2 colunas
    let currentPage = 0;
    const totalPages = Math.ceil(projects.length / PROJECTS_PER_PAGE);

    // Criar páginas de projetos
    function createPages() {
        projetoPages.innerHTML = '';

        for (let i = 0; i < totalPages; i++) {
            const page = document.createElement('div');
            page.className = 'projeto-page';

            const startIdx = i * PROJECTS_PER_PAGE;
            const endIdx = Math.min(startIdx + PROJECTS_PER_PAGE, projects.length);

            for (let j = startIdx; j < endIdx; j++) {
                const project = projects[j];
                const projectCard = document.createElement('div');
                projectCard.className = 'projeto-card';

                // Criar tech tags
                const techTags = project.tech.map(tech =>
                    `<span class="tech-tag">${tech}</span>`
                ).join('');

                // Criar botões de link
                let linkButtons = '';
                if (project.github) {
                    linkButtons += `
                        <a href="${project.github}" target="_blank" class="projeto-link">
                            <i class="fab fa-github"></i> GitHub
                        </a>
                    `;
                }
                if (project.site) {
                    linkButtons += `
                        <a href="${project.site}" target="_blank" class="projeto-link projeto-link-site">
                            <i class="fas fa-external-link-alt"></i> Site
                        </a>
                    `;
                }

                projectCard.innerHTML = `
                    <div class="projeto-header">
                        <div class="projeto-titulo">
                            <i class="${project.icon}"></i> ${project.title}
                        </div>
                        <p class="projeto-descricao">${project.description}</p>
                    </div>
                    <div class="projeto-footer">
                        <div class="projeto-tech">
                            ${techTags}
                        </div>
                        <div class="projeto-links">
                            ${linkButtons}
                        </div>
                    </div>
                `;

                page.appendChild(projectCard);
            }

            projetoPages.appendChild(page);
        }
    }

    // Criar indicadores de paginação
    function createPagination() {
        projetoPagination.innerHTML = '';

        for (let i = 0; i < totalPages; i++) {
            const dot = document.createElement('div');
            dot.className = 'projeto-dot';
            if (i === 0) dot.classList.add('active');
            dot.addEventListener('click', () => goToPage(i));
            projetoPagination.appendChild(dot);
        }
    }

    // Navegar para página específica
    function goToPage(pageNum) {
        currentPage = pageNum;
        const offset = -pageNum * 100;
        projetoPages.style.transform = `translateX(${offset}%)`;

        // Atualizar dots
        document.querySelectorAll('.projeto-dot').forEach((dot, idx) => {
            dot.classList.toggle('active', idx === pageNum);
        });

        // Atualizar visibilidade das setas
        projetoPrev.style.opacity = currentPage === 0 ? '0.3' : '1';
        projetoPrev.style.cursor = currentPage === 0 ? 'not-allowed' : 'pointer';
        projetoNext.style.opacity = currentPage === totalPages - 1 ? '0.3' : '1';
        projetoNext.style.cursor = currentPage === totalPages - 1 ? 'not-allowed' : 'pointer';
    }

    // Event listeners para setas
    projetoPrev.addEventListener('click', () => {
        if (currentPage > 0) {
            goToPage(currentPage - 1);
        }
    });

    projetoNext.addEventListener('click', () => {
        if (currentPage < totalPages - 1) {
            goToPage(currentPage + 1);
        }
    });

    // Inicializar
    createPages();
    createPagination();
    goToPage(0);
}

// Mensagem de boas-vindas
function showWelcomeMessage() {
    console.log(`
████████████████████████████████████████████████████████████████████████████████
█─▄▄─█─▄▄▄─█─▄▄▄▄█▄─▄▄▀█▄─▄█─▄▄▄─█▄─▄████▄─▄▄─█  █▄─▄▄─█─▄▄─█─▄▄▄▄███▄─▄▄▀█─▄▄▄─█
█─██─█─███▀█─██▄─██─▄─▄██─██─███▀██─██▀██─▄█▀█  ██─▄█▀█─██─█─██▄─████─▄─▄█─███▀█
█▄▄▄▄█▄▄▄▄▄█▄▄▄▄▄█▄▄█▄▄█▄▄▄█▄▄▄▄▄█▄▄▄▄▄█▄▄▄▄▄█  █▄▄▄▄▄█▄▄▄▄█▄▄▄▄▄███▄▄█▄▄█▄▄▄▄▄█

        🚀 Bem-vindo ao meu portfólio!
        💻 Desenvolvedor Full Stack em constante evolução
        🌟 Construído com paixão e muito café ☕
        📚 Explore minhas experiências, projetos e certificações
        🔍 Dica: Use o campo de busca para encontrar informações!
        ⭐ Gostou do código? Entre em contato!
    `);
}