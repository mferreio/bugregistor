from passlib.context import CryptContext
import sqlite3

# Configurações
usuario = 'mferreio'
senha = 'teste01'
perfil = 'Admin'
ativo = 1

# Gerar hash da senha
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
hash_senha = pwd_context.hash(senha)

# Conectar ao banco SQLite (ajuste o nome do arquivo se necessário)
conn = sqlite3.connect('app.db')
c = conn.cursor()

# Inserir usuário
c.execute("""
INSERT INTO users (username, hashed_password, perfil, ativo)
VALUES (?, ?, ?, ?)
""", (usuario, hash_senha, perfil, ativo))

conn.commit()
conn.close()
print(f"Usuário admin '{usuario}' criado com sucesso!")
