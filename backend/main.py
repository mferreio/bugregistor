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

## Criação automática do admin ao iniciar o backend (remover após o primeiro deploy em produção)
try:
    from criar_admin_backend import criar_admin
    criar_admin()
except Exception as e:
    print(f"[AVISO] Não foi possível criar admin automaticamente: {e}")

@app.get("/")
def read_root():
    return {"mensagem": "API de Gestão de Bugs está ativa!"}
