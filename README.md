# 💻 Patrick Carlos Souza - Portfólio

Portfólio profissional com front-end estático e back-end FastAPI integrado.

---

## 🌐 URLs de Produção

- **Vercel:** https://portifolio-eta-five-94.vercel.app
- **Domínio Principal:** https://patrickcsouzadev.com.br (em configuração)
- **Domínio Alternativo:** https://www.patrickcsouzadev.com.br

---

## 🚀 Tecnologias

### Front-end
- HTML5, CSS3, JavaScript (ES6+)
- Animações CSS customizadas
- Design responsivo (Mobile-first)
- Sistema de busca em tempo real
- Sliders de certificados e projetos

### Back-end
- **FastAPI** (Python)
- **OpenAI API** (ChatKit - Assistente IA)
- **SendGrid** (Envio de emails)
- Arquitetura serverless

### Deploy
- **Vercel** (Front + Back integrados)
- Deploy automático via GitHub
- SSL/HTTPS automático
- CDN global

---

## 📂 Estrutura do Projeto

```
/
├── index.html              # Página principal
├── static/
│   ├── styles.css         # Estilos
│   ├── script.js          # JavaScript principal
│   └── chatkit-integration.js  # Integração ChatKit
├── imagens/               # Certificados e fotos
├── api/
│   └── index.py          # FastAPI (Back-end)
├── vercel.json           # Configuração Vercel
├── requirements.txt      # Dependências Python
└── runtime.txt          # Versão Python
```

---

## 🔧 Configuração Local

### 1. Clonar repositório
```bash
git clone https://github.com/patrickcsouzadev/PORTIFOLIO.git
cd PORTIFOLIO
```

### 2. Instalar dependências Python
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate  # Windows

pip install -r requirements.txt
```

### 3. Configurar variáveis de ambiente
Crie um arquivo `.env` na raiz:
```env
OPENAI_API_KEY=sua_chave_aqui
SENDGRID_API_KEY=sua_chave_aqui
SENDGRID_FROM_EMAIL=seu@email.com
CONTACT_RECIPIENT=seu@email.com
OPENAI_MODEL=gpt-4o-mini
```

### 4. Rodar localmente
```bash
# Servidor Python (Back-end)
python server.py

# Abrir index.html no navegador
# ou usar Live Server do VS Code
```

---

## 🌐 Deploy na Vercel

### Deploy Automático
Toda vez que você faz push para `main`, a Vercel faz deploy automaticamente:

```bash
git add .
git commit -m "Sua mensagem"
git push origin main
```

### Configurar Variáveis de Ambiente
Na Vercel:
1. Settings → Environment Variables
2. Adicione:
   - `OPENAI_API_KEY`
   - `SENDGRID_API_KEY`
   - `SENDGRID_FROM_EMAIL`
   - `CONTACT_RECIPIENT`

---

## 🎯 Funcionalidades

- ✅ **Portfólio Responsivo:** Design mobile-first
- ✅ **Busca em Tempo Real:** Pesquisa dinâmica no conteúdo
- ✅ **ChatKit IA:** Assistente pessoal com OpenAI
- ✅ **Formulário de Contato:** Envio via SendGrid
- ✅ **Sliders Interativos:** Certificados e projetos
- ✅ **Animações Espaciais:** Background dinâmico
- ✅ **Lazy Loading:** Carregamento otimizado de imagens
- ✅ **Cache Busting:** Versionamento automático de assets

---

## 📊 Endpoints da API

### Health Check
```bash
GET https://portifolio-eta-five-94.vercel.app/api
```

### Chat (ChatKit)
```bash
POST https://portifolio-eta-five-94.vercel.app/api/chat
Content-Type: application/json

{
  "message": "Olá",
  "history": []
}
```

### Contato
```bash
POST https://portifolio-eta-five-94.vercel.app/api/contact
Content-Type: application/json

{
  "nome": "Seu Nome",
  "email": "seu@email.com",
  "empresa": "Sua Empresa",
  "mensagem": "Sua mensagem"
}
```

---

## 📝 Notas Importantes

### URLs Relativas
O projeto usa URLs relativas (`window.location.origin`) para chamadas de API, então funciona automaticamente em:
- Desenvolvimento local: `http://localhost:8000`
- Vercel: `https://portifolio-eta-five-94.vercel.app`
- Domínio personalizado: `https://patrickcsouzadev.com.br`

### Cache Busting
Arquivos estáticos usam versionamento:
```html
<link rel="stylesheet" href="static/styles.css?v=202511041453">
<script src="static/script.js?v=202511041453"></script>
```

Para atualizar a versão:
```bash
./update_version.sh
```

---

## 🔒 Segurança

- ✅ HTTPS obrigatório (Vercel)
- ✅ CORS configurado
- ✅ Variáveis de ambiente protegidas
- ✅ `.env` no `.gitignore`
- ✅ Rate limiting (Vercel automático)

---

## 📚 Documentação

- [DEPLOY_VERCEL_COMPLETO.md](DEPLOY_VERCEL_COMPLETO.md) - Guia de deploy
- [CONFIGURACAO_DOMINIO_VERCEL.md](CONFIGURACAO_DOMINIO_VERCEL.md) - Configurar domínio personalizado
- [GUIA_DEBUG_CACHE.md](GUIA_DEBUG_CACHE.md) - Troubleshooting de cache

---

## 📞 Contato

- **Email:** patrickcsouza.dev@outlook.com
- **LinkedIn:** [patrickcsouzadev](https://www.linkedin.com/in/patrickcsouzadev)
- **GitHub:** [patrickcsouzadev](https://github.com/patrickcsouzadev)
- **Site:** https://patrickcsouzadev.com.br

---

## 📄 Licença

Este projeto é de propriedade de Patrick Carlos Souza. Todos os direitos reservados.

---

**Desenvolvido com 💙 por Patrick Carlos Souza**
