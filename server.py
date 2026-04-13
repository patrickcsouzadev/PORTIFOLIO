from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, EmailStr
from openai import OpenAI
import os
import smtplib
import ssl
import uuid
from dotenv import load_dotenv
from datetime import datetime
from email.message import EmailMessage
from html import escape
load_dotenv()

app = FastAPI()

# Aqui eu inicializo a API inteira que roda no backend do portfolio.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://www.patrickcsouzadev.com.br",
        "https://patrickcsouzadev.com.br",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "http://localhost:5500",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/static", StaticFiles(directory="static"), name="static")
app.mount("/imagens", StaticFiles(directory="imagens"), name="imagens")
openai_client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

# Sessions em memoria: serve bem no local, mas em serverless nao persiste entre execucoes.
sessions = {}

@app.get("/")
async def read_index():
    """No servidor local eu uso essa rota pra servir o index.html direto.

Assim fica facil testar a pagina completa sem depender de build separado."""
    return FileResponse("index.html")
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

@app.post("/api/chatkit/session")
async def create_chatkit_session(request: SessionRequest):
    """Aqui eu gero uma sessao nova do chat e devolvo um client_secret unico.

A ideia e manter uma chave por dispositivo pra conversa ficar organizada.
Se der qualquer erro, eu devolvo 500 pra ficar claro no frontend que o backend falhou."""
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
    """Esse endpoint tenta reaproveitar a sessao que ja existe pro device.

Se nao achar sessao, ele cria uma nova usando o mesmo fluxo do create.
Isso evita erro de sessao expirada e simplifica a vida do frontend."""
    try:
        session = sessions.get(request.device_id)
        if not session:
            return await create_chatkit_session(request)
        return {"client_secret": session['client_secret']}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat")
async def chat(request: ChatRequest):
    """Esse e o endpoint principal do chat com a OpenAI.

Eu monto o contexto com prompt de sistema + historico recente + pergunta atual.
Depois envio pro modelo e retorno texto da resposta junto com timestamp."""
    try:
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        for msg in request.history[-10:]:
            messages.append({
                "role": msg.get('role', 'user'),
                "content": msg.get('content', '')
            })
        messages.append({"role": "user", "content": request.message})
        response = openai_client.chat.completions.create(
            model=os.getenv('OPENAI_MODEL', 'gpt-4o-mini'),
            messages=messages,
            temperature=0.15,
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

def _read_env(*keys: str, default=None):
    """Funcao utilitaria pra ler variavel de ambiente com fallback.

Eu passo varias chaves possiveis e ela pega a primeira que existir.
Tambem ja limpa espacos e aspas pra evitar bug de configuracao."""
    for key in keys:
        value = os.getenv(key)
        if value is None:
            continue
        cleaned = str(value).strip().strip('"').strip("'")
        if cleaned:
            return cleaned
    return default

def _to_bool(value, default: bool) -> bool:
    """Converte texto de variavel de ambiente para booleano sem surpresa.

    Eu aceito varios formatos comuns tipo true/false, yes/no e 1/0.
    Se vier algo estranho, mantenho o valor padrao pra nao quebrar o fluxo.
    """
    if value is None:
        return default
    normalized = str(value).strip().lower()
    if normalized in {'1', 'true', 'yes', 'y', 'on'}:
        return True
    if normalized in {'0', 'false', 'no', 'n', 'off'}:
        return False
    return default

def _resolve_smtp_config() -> dict:
    """Monta e valida toda a configuracao SMTP antes de enviar email.

    Aqui eu junto host, porta, usuario, senha, remetente e destino com fallback.
    Tambem valido tipos e campos obrigatorios pra erro de configuracao aparecer cedo.
    """
    host = _read_env('SMTP_HOST', default='smtp-mail.outlook.com')
    port_raw = _read_env('SMTP_PORT', default='587')
    user = _read_env('SMTP_USER')
    password = _read_env('SMTP_PASS', 'SMTP_PASSWORD')
    from_email = _read_env('SMTP_FROM_EMAIL', 'FROM_EMAIL', default=user or 'patrickcsouza.dev@outlook.com')
    recipients_raw = _read_env('CONTACT_RECIPIENT', 'TO_EMAIL', default=from_email)

    if not user or not password:
        raise ValueError('SMTP_USER e SMTP_PASS precisam estar configurados na Vercel.')

    try:
        port = int(port_raw)
    except (TypeError, ValueError) as exc:
        raise ValueError('SMTP_PORT invalida. Use 587 para Outlook com STARTTLS.') from exc

    timeout_raw = _read_env('SMTP_TIMEOUT', default='20')
    try:
        timeout = int(timeout_raw)
    except (TypeError, ValueError) as exc:
        raise ValueError('SMTP_TIMEOUT invalida.') from exc

    recipients = [item.strip() for item in str(recipients_raw).split(',') if item.strip()]
    if not recipients:
        raise ValueError('CONTACT_RECIPIENT esta vazio.')

    use_ssl = _to_bool(_read_env('SMTP_USE_SSL', 'SMTP_SSL', default='false'), False)
    use_starttls = _to_bool(_read_env('SMTP_USE_STARTTLS', 'SMTP_USE_TLS', default='true'), True)

    return {
        'host': host,
        'port': port,
        'user': user,
        'password': password,
        'from_email': from_email,
        'recipients': recipients,
        'timeout': timeout,
        'use_ssl': use_ssl,
        'use_starttls': use_starttls,
    }

def send_email_via_smtp(nome: str, empresa: str, email: str, mensagem: str) -> bool:
    """Envia o email do formulario em texto e HTML usando SMTP.

    Eu higienizo os campos, monto assunto/corpo e tento o envio com TLS ou SSL.
    Quando algo falha, levanto erro explicando o motivo pra facilitar o ajuste no deploy.
    """
    config = _resolve_smtp_config()

    safe_nome = escape(nome)
    safe_email = escape(email)
    safe_empresa = escape(empresa) if empresa else 'Nao informado'
    safe_mensagem = escape(mensagem)

    subject = f"Contato do Portfolio - {nome}" + (f" ({empresa})" if empresa else "")

    body_text = f"""
Nova mensagem recebida atraves do formulario de contato:

Nome: {nome}
E-mail: {email}
Empresa: {empresa if empresa else 'Nao informado'}

Mensagem:
{mensagem}

---
Enviado em: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}
"""

    body_html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #0c9ffa;">Nova mensagem recebida atraves do formulario de contato</h2>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Nome:</strong> {safe_nome}</p>
            <p><strong>E-mail:</strong> <a href="mailto:{safe_email}">{safe_email}</a></p>
            <p><strong>Empresa:</strong> {safe_empresa}</p>
        </div>
        <div style="margin: 20px 0;">
            <h3 style="color: #0c9ffa;">Mensagem:</h3>
            <p style="white-space: pre-wrap; background-color: #fff; padding: 15px; border-left: 4px solid #0c9ffa;">{safe_mensagem}</p>
        </div>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">
            Enviado em: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}
        </p>
    </body>
    </html>
    """

    msg = EmailMessage()
    msg['Subject'] = subject
    msg['From'] = config['from_email']
    msg['To'] = ', '.join(config['recipients'])
    msg['Reply-To'] = str(email)
    msg.set_content(body_text)
    msg.add_alternative(body_html, subtype='html')

    try:
        if config['use_ssl']:
            with smtplib.SMTP_SSL(config['host'], config['port'], timeout=config['timeout']) as smtp:
                smtp.login(config['user'], config['password'])
                smtp.send_message(msg)
        else:
            with smtplib.SMTP(config['host'], config['port'], timeout=config['timeout']) as smtp:
                smtp.ehlo()
                if config['use_starttls']:
                    context = ssl.create_default_context()
                    smtp.starttls(context=context)
                    smtp.ehlo()
                smtp.login(config['user'], config['password'])
                smtp.send_message(msg)

        print('Email enviado com sucesso via SMTP Outlook.')
        return True

    except smtplib.SMTPAuthenticationError as exc:
        raise ValueError(
            'Falha de autenticacao SMTP. Use senha de aplicativo do Outlook em SMTP_PASS.'
        ) from exc
    except smtplib.SMTPException as exc:
        raise ValueError(f'Erro SMTP ao enviar email: {exc}') from exc
    except Exception as exc:
        raise ValueError(f'Erro inesperado no envio SMTP: {exc}') from exc

@app.post("/api/contact")
async def send_contact_email(request: ContactRequest):
    """Endpoint que recebe os dados do formulario de contato e dispara o envio.

Antes de mandar email eu valido campos obrigatorios e limpo valores vazios.
No final devolvo status de sucesso ou erro em formato padrao pro frontend entender facil."""
    try:
        if not request.nome.strip() or not request.mensagem.strip():
            raise HTTPException(status_code=400, detail="Nome e mensagem são obrigatórios")
        empresa_value = request.empresa.strip() if request.empresa and request.empresa.strip() else None
        send_email_via_smtp(
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
        print(f"Erro de validacao/SMTP: {str(e)}")
        raise HTTPException(status_code=502, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        print(f"Erro inesperado no endpoint de contato: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno ao processar solicitação. Tente novamente mais tarde.")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
