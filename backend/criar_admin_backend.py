from models import User, PerfilEnum
from database import SessionLocal
from passlib.context import CryptContext

# Configurações do usuário
username = "mferreio"
senha = "teste01"
perfil = PerfilEnum.admin
ativo = 1

# Gerar hash da senha
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
hashed_password = pwd_context.hash(senha)

# Inserir no banco
session = SessionLocal()
user = User(username=username, hashed_password=hashed_password, perfil=perfil, ativo=ativo)
session.add(user)
session.commit()
session.refresh(user)
session.close()
print(f"Usuário admin '{username}' criado com sucesso!")
