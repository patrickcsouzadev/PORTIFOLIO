from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from openai import OpenAI
import os
from datetime import datetime
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
import uuid

# Initialize FastAPI app
app = FastAPI()

# IMPORTANTE: NÃO use load_dotenv() - Vercel fornece variáveis de ambiente diretamente

# Configurar CORS para permitir requisições do frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://www.patrickcsouzadev.com.br",
        "https://patrickcsouzadev.com.br",
        "https://*.vercel.app",  # Para deploys de preview da Vercel
        "http://localhost:8000",  # Para testes locais
        "http://127.0.0.1:8000",
        "http://localhost:5500",
    ],
    allow_credentials=True,
    allow_methods=["POST", "GET", "OPTIONS"],
    allow_headers=["*"],
)

# Inicializar cliente OpenAI
openai_client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

# AVISO: Sessões em memória NÃO persistem em funções serverless da Vercel
# Considere usar Redis (Upstash tem tier gratuito) ou tornar stateless com JWT
sessions = {}

# Prompt do sistema - baseado no workflow
SYSTEM_PROMPT = """Você é o assistente pessoal e representante oficial de Patrick Carlos Souza, também conhecido como Patrick Souza, Patrick Carlos, Patrick C Souza ou simplesmente Patrick.

Seu papel é responder qualquer pergunta sobre Patrick, seja ela técnica, profissional ou pessoal.

Isso inclui:
- Nome completo, idade, formação, cidade, trajetória e informações pessoais
- Tecnologias, linguagens e ferramentas que ele domina
- Projetos, experiências profissionais, portfólio e estudos
- Informações de contato e links públicos (como site e GitHub)

INFORMAÇÕES SOBRE PATRICK:

👨‍💻 Sobre Patrick:
Patrick reside em Santos, no litoral de São Paulo. Atualmente, está cursando o quinto semestre de Análise e Desenvolvimento de Sistemas na FATEC Rubens Lara. É um profissional apaixonado por tecnologia, em transição de carreira para a área de desenvolvimento.

🚀 Foco Atual & Experiência Profissional:
Atua como Desenvolvedor Full Stack, com foco principal em Back-end. Experiência anterior inclui vendas, atendimento ao cliente e suporte Nível 1.

Stacks principais: Java e Python
Áreas de atuação:
- Automação de Processos
- Inteligência Artificial
- Desenvolvimento Web
- Desenvolvimento Mobile

🛠️ Habilidades Técnicas:
Java: Spring Boot
Python: Pandas, NumPy, Django, FastAPI, Flask

📧 Contato:
E-mail: patrickcsouza.dev@outlook.com
LinkedIn: patrickcsouzadev
GitHub: patrickcsouzadev

INSTRUÇÕES DE COMPORTAMENTO:
1. Todas as respostas devem ser curtas, claras e diretas
2. Use apenas as informações fornecidas acima
3. Se a pergunta não for sobre Patrick Souza, responda APENAS uma destas frases:
   - "Posso responder apenas perguntas relacionadas a Patrick Souza e seu portfólio."
   - "Desculpe, só posso falar sobre Patrick Souza e seus projetos."
   - "Meu foco é apenas o portfólio e o trabalho de Patrick Souza."
4. Use sempre um tom profissional e educado
5. Entenda que "você", "ele", "Patrick" referem-se a Patrick Carlos Souza

NÃO RESPONDA PERGUNTAS QUE NÃO SEJAM SOBRE PATRICK E SUAS HABILIDADES!"""

class SessionRequest(BaseModel):
    device_id: str = "default_device"

class ChatRequest(BaseModel):
    message: str
    history: list = []

class ContactRequest(BaseModel):
    nome: str
    empresa: str = None
    email: EmailStr
    mensagem: str

# Health check endpoint - útil para monitoramento
@app.get("/")
@app.get("/api")
def read_root():
    return {
        "status": "online",
        "message": "Patrick Souza Portfolio API",
        "version": "1.0.0",
        "endpoints": ["/api/chat", "/api/contact", "/api/chatkit/session", "/api/chatkit/refresh"]
    }

@app.post("/api/chatkit/session")
async def create_chatkit_session(request: SessionRequest):
    """Cria uma nova sessão e retorna o client_secret"""
    try:
        client_secret = str(uuid.uuid4())
        sessions[request.device_id] = {
            'client_secret': client_secret,
            'messages': [],
            'created_at': datetime.now().isoformat()
        }
        return {"client_secret": client_secret}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chatkit/refresh")
async def refresh_chatkit_session(request: SessionRequest):
    """Atualiza uma sessão existente"""
    try:
        session = sessions.get(request.device_id)
        if not session:
            return await create_chatkit_session(request)
        return {"client_secret": session['client_secret']}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat")
async def chat(request: ChatRequest):
    """Endpoint para enviar mensagens ao chat"""
    try:
        # Preparar mensagens para o modelo
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]

        # Adicionar histórico (últimas 10 mensagens para contexto)
        for msg in request.history[-10:]:
            messages.append({
                "role": msg.get('role', 'user'),
                "content": msg.get('content', '')
            })

        # Adicionar mensagem atual do usuário
        messages.append({"role": "user", "content": request.message})

        # Chamar OpenAI Chat Completions API
        response = openai_client.chat.completions.create(
            model=os.getenv('OPENAI_MODEL', 'gpt-4o-mini'),
            messages=messages,
            temperature=0.15,  # Mesma temperatura do workflow
            max_tokens=2048,
            top_p=1
        )

        assistant_message = response.choices[0].message.content

        return {
            'response': assistant_message,
            'timestamp': datetime.now().isoformat()
        }

    except Exception as e:
        print(f"Error in chat endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

def send_email_via_sendgrid(nome: str, empresa: str, email: str, mensagem: str) -> bool:
    """Envia email via SendGrid API"""
    # Configurações SendGrid
    sendgrid_api_key = os.getenv('SENDGRID_API_KEY')
    from_email = os.getenv('SENDGRID_FROM_EMAIL', 'patrickcsouza.dev@outlook.com')
    recipient = os.getenv('CONTACT_RECIPIENT', 'patrickcsouza.dev@outlook.com')

    # Validar se a API key está configurada
    if not sendgrid_api_key:
        raise ValueError("SendGrid API Key não configurada")

    # Criar mensagem
    subject = f"Contato do Portfólio - {nome}" + (f" ({empresa})" if empresa else "")

    body_html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #0c9ffa;">Nova mensagem recebida através do formulário de contato</h2>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Nome:</strong> {nome}</p>
            <p><strong>E-mail:</strong> <a href="mailto:{email}">{email}</a></p>
            <p><strong>Empresa:</strong> {empresa if empresa else 'Não informado'}</p>
        </div>
        <div style="margin: 20px 0;">
            <h3 style="color: #0c9ffa;">Mensagem:</h3>
            <p style="white-space: pre-wrap; background-color: #fff; padding: 15px; border-left: 4px solid #0c9ffa;">{mensagem}</p>
        </div>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">
            Enviado em: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}
        </p>
    </body>
    </html>
    """

    body_text = f"""
Nova mensagem recebida através do formulário de contato:

Nome: {nome}
E-mail: {email}
Empresa: {empresa if empresa else 'Não informado'}

Mensagem:
{mensagem}

---
Enviado em: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}
"""

    # Criar email usando SendGrid
    message = Mail(
        from_email=from_email,
        to_emails=recipient,
        subject=subject,
        html_content=body_html,
        plain_text_content=body_text
    )

    # Adicionar Reply-To com o email do remetente do formulário
    if email and nome:
        message.reply_to = email

    # Enviar via SendGrid API
    try:
        sg = SendGridAPIClient(sendgrid_api_key)
        response = sg.send(message)

        # Verificar resposta (status_code 202 significa sucesso)
        if response.status_code in [200, 202]:
            message_id = response.headers.get('X-Message-Id', 'N/A')
            print(f"✅ Email enviado com sucesso! Message ID: {message_id}")
            return True
        else:
            error_body = response.body.decode('utf-8') if hasattr(response, 'body') else 'N/A'
            raise ValueError(f"Erro ao enviar email: Status {response.status_code}, Body: {error_body}")

    except Exception as e:
        error_msg = str(e)
        print(f"❌ Erro detalhado SendGrid: {error_msg}")
        raise ValueError(f"Erro ao enviar email via SendGrid: {error_msg}")

@app.post("/api/contact")
async def send_contact_email(request: ContactRequest):
    """Endpoint para receber e enviar emails do formulário de contato"""
    try:
        # Validação básica (Pydantic já valida EmailStr, mas verificamos campos vazios)
        if not request.nome.strip() or not request.mensagem.strip():
            raise HTTPException(status_code=400, detail="Nome e mensagem são obrigatórios")

        # Enviar email
        empresa_value = request.empresa.strip() if request.empresa and request.empresa.strip() else None
        send_email_via_sendgrid(
            nome=request.nome.strip(),
            empresa=empresa_value,
            email=request.email,
            mensagem=request.mensagem.strip()
        )

        return {
            "success": True,
            "message": "Email enviado com sucesso!",
            "timestamp": datetime.now().isoformat()
        }

    except ValueError as e:
        # Erros de configuração ou SendGrid
        print(f"Erro de validação/SendGrid: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        # Erros genéricos
        print(f"Erro inesperado no endpoint de contato: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno ao processar solicitação. Tente novamente mais tarde.")

# NÃO inclua o bloco if __name__ == "__main__"
# A Vercel gerencia o servidor ASGI automaticamente
