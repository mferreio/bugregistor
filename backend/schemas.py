from datetime import datetime
from pydantic import BaseModel
from typing import Optional, Literal

class BugLogOut(BaseModel):
    id: int
    bug_id: int
    usuario: str
    acao: str
    campo: Optional[str] = None
    valor_anterior: Optional[str] = None
    valor_novo: Optional[str] = None
    data: datetime

    class Config:
        orm_mode = True

class BugUpdate(BaseModel):
    titulo: Optional[str] = None
    descricao: Optional[str] = None
    severidade: Optional[str] = None
    impacto: Optional[str] = None
    ambiente: Optional[str] = None
    frequencia: Optional[str] = None
    area: Optional[str] = None
    evidencias: Optional[str] = None
    status: Optional[str] = None
    prioridade: Optional[float] = None
    data_abertura: Optional[datetime] = None

from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime

class UserUpdatePerfil(BaseModel):
    perfil: Literal["QA", "DEV", "PO", "Admin", "Consulta"]

class UserBase(BaseModel):
    username: str
    perfil: Literal["QA", "DEV", "PO", "Admin", "Consulta"]

class UserCreate(BaseModel):
    username: str
    password: str
    perfil: Literal["QA", "DEV", "PO", "Admin", "Consulta"]

class UserLogin(BaseModel):
    username: str
    password: str

class UserOut(UserBase):
    id: int
    ativo: int
    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class BugBase(BaseModel):
    titulo: str
    descricao: str
    severidade: str
    impacto: str
    ambiente: str
    frequencia: str
    area: str
    evidencias: Optional[str] = None

class BugCreate(BugBase):
    pass

class BugOut(BugBase):
    id: int
    data_abertura: datetime
    status: str
    prioridade: float

    class Config:
        orm_mode = True
