from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models, schemas, crud
from auth import create_access_token, get_current_active_user, get_db
from schemas import BugUpdate

router = APIRouter()


# Editar bug
@router.patch("/bugs/{bug_id}", response_model=schemas.BugOut)
def editar_bug(bug_id: int, bug: BugUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_active_user)):
    if current_user.perfil == "Consulta":
        raise HTTPException(status_code=403, detail="Usuário do tipo Consulta não pode editar bugs.")
    bug_atualizado = crud.atualizar_bug(db, bug_id, bug, usuario=current_user.username)
    if not bug_atualizado:
        raise HTTPException(status_code=404, detail="Bug não encontrado")
    return bug_atualizado

def admin_required(current_user=Depends(get_current_active_user)):
    if current_user.perfil != "Admin":
        raise HTTPException(status_code=403, detail="Acesso restrito ao administrador")
    return current_user

models.Base.metadata.create_all(bind=engine)

# Excluir usuário (apenas Admin)
@router.delete("/usuarios/{user_id}")
def excluir_usuario(user_id: int, db: Session = Depends(get_db), current_user=Depends(admin_required)):
    if not crud.excluir_usuario(db, user_id):
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return {"detail": "Usuário excluído"}

# Bloquear/desbloquear usuário (apenas Admin)
@router.patch("/usuarios/{user_id}/ativo")
def bloquear_usuario(user_id: int, bloquear: bool, db: Session = Depends(get_db), current_user=Depends(admin_required)):
    user = crud.bloquear_usuario(db, user_id, bloquear)
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return {"id": user.id, "ativo": user.ativo}

# Listar todos os usuários (apenas Admin)
@router.get("/usuarios", response_model=list[schemas.UserOut])
def listar_usuarios(db: Session = Depends(get_db), current_user=Depends(admin_required)):
    return crud.listar_usuarios(db)

# Atualizar perfil de usuário (apenas Admin)
@router.patch("/usuarios/{user_id}/perfil", response_model=schemas.UserOut)
def atualizar_perfil(user_id: int, dados: schemas.UserUpdatePerfil, db: Session = Depends(get_db), current_user=Depends(admin_required)):
    user = crud.atualizar_perfil_usuario(db, user_id, dados.perfil)
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return user

# Endpoint para obter dados do usuário autenticado
@router.get("/me", response_model=schemas.UserOut)
def get_me(current_user=Depends(get_current_active_user)):
    return current_user

@router.post("/register", response_model=schemas.UserOut)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_username(db, user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Usuário já existe")
    return crud.create_user(db, user)

@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = crud.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuário ou senha inválidos")
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/bugs/", response_model=schemas.BugOut)
def criar_bug(bug: schemas.BugCreate, db: Session = Depends(get_db), current_user=Depends(get_current_active_user)):
    if current_user.perfil == "Consulta":
        raise HTTPException(status_code=403, detail="Usuário do tipo Consulta não pode cadastrar bugs.")
    return crud.criar_bug(db, bug, usuario=current_user.username)

# Deletar bug (adicionar endpoint)
@router.delete("/bugs/{bug_id}")
def deletar_bug(bug_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_active_user)):
    if current_user.perfil == "Consulta":
        raise HTTPException(status_code=403, detail="Usuário do tipo Consulta não pode excluir bugs.")
    ok = crud.deletar_bug(db, bug_id, usuario=current_user.username)
    if not ok:
        raise HTTPException(status_code=404, detail="Bug não encontrado")
    return {"detail": "Bug excluído"}


# Endpoint para listar logs de um bug
@router.get("/bugs/{bug_id}/logs", response_model=list[schemas.BugLogOut])
def listar_logs_bug(bug_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_active_user)):
    logs = db.query(models.BugLog).filter(models.BugLog.bug_id == bug_id).order_by(models.BugLog.data.asc()).all()
    return logs

@router.get("/bugs/", response_model=list[schemas.BugOut])
def listar_bugs(db: Session = Depends(get_db), current_user=Depends(get_current_active_user)):
    bugs = crud.listar_bugs(db)
    # Perfil Consulta agora pode ver todos os bugs
    return bugs
