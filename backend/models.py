from sqlalchemy import Column, Integer, String, DateTime, Text, Enum, Float
from sqlalchemy.sql import func
from database import Base
import enum

class StatusEnum(str, enum.Enum):
    aberto = "Aberto"
    fechado = "Fechado"
    reaberto = "Reaberto"
    em_andamento = "Em andamento"
    pendente = "Pendente"
    cancelado = "Cancelado"

class PerfilEnum(str, enum.Enum):
    qa = "QA"
    dev = "DEV"
    po = "PO"
    admin = "Admin"
    consulta = "Consulta"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    perfil = Column(Enum(PerfilEnum), default=PerfilEnum.qa)
    ativo = Column(Integer, default=1)  # 1 = ativo, 0 = bloqueado


class Bug(Base):
    __tablename__ = "bugs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, unique=True)
    titulo = Column(String, nullable=False)
    descricao = Column(Text, nullable=False)
    severidade = Column(String, nullable=False)
    impacto = Column(String, nullable=False)
    ambiente = Column(String, nullable=False)
    frequencia = Column(String, nullable=False)
    area = Column(String, nullable=False)
    evidencias = Column(Text, nullable=True)
    data_abertura = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(Enum(StatusEnum), default=StatusEnum.aberto)
    prioridade = Column(Float, default=0)

# Log de operações CRUD de bugs
class BugLog(Base):
    __tablename__ = "bug_logs"
    id = Column(Integer, primary_key=True, index=True)
    bug_id = Column(Integer, nullable=False)
    usuario = Column(String, nullable=False)
    acao = Column(String, nullable=False)  # CREATE, UPDATE, DELETE
    campo = Column(String, nullable=True)  # campo alterado (para UPDATE)
    valor_anterior = Column(Text, nullable=True)
    valor_novo = Column(Text, nullable=True)
    data = Column(DateTime(timezone=True), server_default=func.now())
