from sqlalchemy.orm import Session
from models import Bug, StatusEnum, User, PerfilEnum, BugLog
from schemas import BugCreate, UserCreate
from passlib.context import CryptContext
from datetime import datetime, timedelta
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

import json
def registrar_bug_log(db: Session, bug_id: int, usuario: str, acao: str, campo: str = None, valor_anterior: str = None, valor_novo: str = None):
    # Para CREATE, salva todos os campos em valor_novo (como JSON)
    if acao == "CREATE" and valor_novo and isinstance(valor_novo, dict):
        log = BugLog(
            bug_id=bug_id,
            usuario=usuario,
            acao=acao,
            campo=None,
            valor_anterior=None,
            valor_novo=json.dumps(valor_novo, ensure_ascii=False)
        )
    else:
        log = BugLog(
            bug_id=bug_id,
            usuario=usuario,
            acao=acao,
            campo=campo,
            valor_anterior=valor_anterior,
            valor_novo=valor_novo
        )
    db.add(log)
    db.commit()

def atualizar_bug(db: Session, bug_id: int, bug_update, usuario: str = ""):  # usuario será passado pelo router
    bug = db.query(Bug).filter(Bug.id == bug_id).first()
    if not bug:
        return None
    for attr, value in bug_update.dict(exclude_unset=True).items():
        valor_antigo = getattr(bug, attr)
        setattr(bug, attr, value)
        registrar_bug_log(db, bug_id, usuario, "UPDATE", campo=attr, valor_anterior=str(valor_antigo), valor_novo=str(value))
    db.commit()
    db.refresh(bug)
    return bug

def excluir_usuario(db: Session, user_id: int):
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        db.delete(user)
        db.commit()
        return True
    return False

def bloquear_usuario(db: Session, user_id: int, bloquear: bool):
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        user.ativo = 0 if bloquear else 1
        db.commit()
        db.refresh(user)
        return user
    return None
def listar_usuarios(db: Session):
    return db.query(User).all()

def atualizar_perfil_usuario(db: Session, user_id: int, novo_perfil: str):
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        user.perfil = novo_perfil
        db.commit()
        db.refresh(user)
    return user


def get_user_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()

def create_user(db: Session, user: UserCreate):
    hashed_password = pwd_context.hash(user.password)
    db_user = User(username=user.username, hashed_password=hashed_password, perfil=user.perfil)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def authenticate_user(db: Session, username: str, password: str):
    user = get_user_by_username(db, username)
    if not user:
        return None
    if not pwd_context.verify(password, user.hashed_password):
        return None
    return user

def calcular_prioridade(bug: Bug) -> float:
    # Exemplo simples: severidade e impacto (pode ser expandido)
    pesos = {
        'Crítico': 5,
        'Alto': 4,
        'Médio': 3,
        'Baixo': 2,
        'Nenhum': 1
    }
    peso_severidade = pesos.get(bug.severidade, 1)
    peso_impacto = pesos.get(bug.impacto, 1)
    prioridade = peso_severidade * 2 + peso_impacto * 3
    # Penalidade para bugs reabertos
    if bug.status == StatusEnum.reaberto:
        prioridade += 2
    # Peso extra para bugs em produção
    if bug.ambiente.lower() == 'produção':
        prioridade += 3
    # Penalidade por tempo em aberto (SLA: 7 dias)
    if bug.status in [StatusEnum.aberto]:
        dias_aberto = (datetime.utcnow() - bug.data_abertura).days
        if dias_aberto > 7:
            prioridade += 2
    return prioridade

def criar_bug(db: Session, bug: BugCreate, usuario: str = "") -> Bug:
    novo_bug = Bug(**bug.dict())
    db.add(novo_bug)
    db.commit()
    db.refresh(novo_bug)
    novo_bug.prioridade = calcular_prioridade(novo_bug)
    db.commit()
    db.refresh(novo_bug)
    # Salva todos os campos do bug no valor_novo do log de CREATE
    registrar_bug_log(db, novo_bug.id, usuario, "CREATE", valor_novo=bug.dict())
    return novo_bug

def deletar_bug(db: Session, bug_id: int, usuario: str = ""):
    bug = db.query(Bug).filter(Bug.id == bug_id).first()
    if bug:
        db.delete(bug)
        db.commit()
        registrar_bug_log(db, bug_id, usuario, "DELETE")
        return True
    return False

def listar_bugs(db: Session):
    bugs = db.query(Bug).all()
    for bug in bugs:
        bug.prioridade = calcular_prioridade(bug)
    db.commit()
    return sorted(bugs, key=lambda b: b.prioridade, reverse=True)
