
from pydantic import BaseModel
from typing import Optional

# --- Uživatelská autentizace ---
class UserBase(BaseModel):
    username: str
    email: str
    role: Optional[str] = "user"

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserOut(UserBase):
    id: int
    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class DocumentBase(BaseModel):
    filename: str
    category: str | None = None

class Document(DocumentBase):
    id: int
    project_id: int

    class Config:
        orm_mode = True

class ProjectBase(BaseModel):
    name: str
    description: str | None = None

class ProjectCreate(ProjectBase):
    pass

class Project(ProjectBase):
    id: int
    owner_id: int
    documents: list[Document] = []
    progress_logs: list[ProgressLog] = []

    class Config:
        orm_mode = True

class ProgressLogBase(BaseModel):
    date: str
    percentage_completed: int
    notes: str | None = None

class ProgressLogCreate(ProgressLogBase):
    pass

class ProgressLog(ProgressLogBase):
    id: int
    project_id: int

    class Config:
        orm_mode = True
