from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import router

app = FastAPI(title="Gestão de Bugs", description="API para gestão e priorização inteligente de bugs.", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "https://bugregistor.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(router)


# Criação/atualização forçada de admin real no banco ao iniciar o backend
from database import SessionLocal
from models import User, PerfilEnum
from passlib.context import CryptContext
def criar_admin_real():
    session = SessionLocal()
    username = "admin"
    senha = "admin123"
    perfil = PerfilEnum.admin
    ativo = 1
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    hashed_password = pwd_context.hash(senha)
    user = session.query(User).filter_by(username=username).first()
    if user:
        user.hashed_password = hashed_password
        user.perfil = perfil
        user.ativo = ativo
    else:
        user = User(username=username, hashed_password=hashed_password, perfil=perfil, ativo=ativo)
        session.add(user)
    session.commit()
    session.close()
criar_admin_real()

@app.get("/")
def read_root():
    return {"mensagem": "API de Gestão de Bugs está ativa!"}
