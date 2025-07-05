from pydantic import BaseModel

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
