from fastapi import FastAPI, Depends, HTTPException, File, UploadFile, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from . import models, schemas, crud
from jose import JWTError, jwt
from datetime import datetime, timedelta
from minio import Minio
import os
from io import StringIO, BytesIO
import csv
from PIL import Image
import pytesseract
import cv2
import numpy as np


# --- JWT nastavení ---
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "supersecret")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

app = FastAPI()

# MinIO Client
minio_client = Minio(
    os.getenv("MINIO_URL"),
    access_key=os.getenv("MINIO_ACCESS_KEY"),
    secret_key=os.getenv("MINIO_SECRET_KEY"),
    secure=False
)

# Dependency
# Dependency

def get_db():
    db = models.SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = schemas.TokenData(username=username)
    except JWTError:
        raise credentials_exception
    user = crud.get_user_by_username(db, username=token_data.username)
    if user is None:
        raise credentials_exception
    return user

def get_current_active_user(current_user: models.User = Depends(get_current_user)):
    return current_user

def get_current_admin_user(current_user: models.User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return current_user
@app.post("/auth/register", response_model=schemas.UserOut)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_username(db, user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    return crud.create_user(db, user)

@app.post("/auth/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = crud.get_user_by_username(db, form_data.username)
    if not user or not crud.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/projects/", response_model=schemas.Project)
def create_project(
    project: schemas.ProjectCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    return crud.create_project(db=db, project=project)

@app.get("/projects/", response_model=list[schemas.Project])
def read_projects(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    projects = crud.get_projects(db, skip=skip, limit=limit)
    return projects

@app.get("/projects/{project_id}", response_model=schemas.Project)
def read_project(project_id: int, db: Session = Depends(get_db)):
    db_project = crud.get_project(db, project_id=project_id)
    if db_project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return db_project

@app.put("/projects/{project_id}", response_model=schemas.Project)
def update_project(
    project_id: int,
    project: schemas.ProjectCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    db_project = crud.update_project(db=db, project_id=project_id, project=project)
    if db_project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return db_project

@app.delete("/projects/{project_id}")
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin_user)
):
    db_project = crud.delete_project(db=db, project_id=project_id)
    if db_project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"message": "Project deleted successfully"}

@app.get("/documents/{document_id}/download")
async def download_document(document_id: int, db: Session = Depends(get_db)):
    db_document = db.query(models.Document).filter(models.Document.id == document_id).first()
    if db_document is None:
        raise HTTPException(status_code=404, detail="Document not found")

    bucket_name = "ranger-bucket"
    try:
        response = minio_client.get_object(bucket_name, db_document.filename)
        return StreamingResponse(response.stream(32*1024), media_type="application/octet-stream", headers={
            "Content-Disposition": f"attachment; filename=\"{db_document.filename}\"
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error downloading file: {e}")
    finally:
        response.close()
        response.release_conn()

@app.post("/projects/{project_id}/uploadfile/")
async def create_upload_file(project_id: int, file: UploadFile = File(...), category: str | None = None, db: Session = Depends(get_db)):
    bucket_name = "ranger-bucket"
    found = minio_client.bucket_exists(bucket_name)
    if not found:
        minio_client.make_bucket(bucket_name)

    minio_client.put_object(
        bucket_name,
        file.filename,
        file.file,
        length=-1, # Unknown length
        part_size=10*1024*1024
    )
    db_document = models.Document(filename=file.filename, project_id=project_id, category=category)
    db.add(db_document)
    db.commit()
    db.refresh(db_document)
    return {"filename": file.filename, "category": category}

@app.get("/projects/{project_id}/documents/", response_model=list[schemas.Document])
def read_documents_for_project(
    project_id: int,
    category: str | None = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    documents = crud.get_documents(db, project_id=project_id, category=category, skip=skip, limit=limit)
    return documents

@app.post("/projects/{project_id}/progress_logs/", response_model=schemas.ProgressLog)
def create_progress_log_for_project(
    project_id: int,
    progress_log: schemas.ProgressLogCreate,
    db: Session = Depends(get_db)
):
    return crud.create_progress_log(db=db, progress_log=progress_log, project_id=project_id)

@app.get("/projects/{project_id}/progress_logs/", response_model=list[schemas.ProgressLog])
def read_progress_logs_for_project(
    project_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    progress_logs = crud.get_progress_logs(db, project_id=project_id, skip=skip, limit=limit)
    return progress_logs

@app.put("/progress_logs/{progress_log_id}", response_model=schemas.ProgressLog)
def update_progress_log(
    progress_log_id: int,
    progress_log: schemas.ProgressLogCreate,
    db: Session = Depends(get_db)
):
    db_progress_log = crud.update_progress_log(db=db, progress_log_id=progress_log_id, progress_log=progress_log)
    if db_progress_log is None:
        raise HTTPException(status_code=404, detail="Progress Log not found")
    return db_progress_log

@app.delete("/progress_logs/{progress_log_id}")
def delete_progress_log(progress_log_id: int, db: Session = Depends(get_db)):
    db_progress_log = crud.delete_progress_log(db=db, progress_log_id=progress_log_id)
    if db_progress_log is None:
        raise HTTPException(status_code=404, detail="Progress Log not found")
    return {"message": "Progress Log deleted successfully"}

@app.post("/documents/{document_id}/ocr")
async def perform_ocr(document_id: int, db: Session = Depends(get_db)):
    ocr_text, extracted_data = crud.perform_ocr_on_document(db, document_id, minio_client)
    if ocr_text is None:
        raise HTTPException(status_code=404, detail="Document not found or OCR failed")
    return {"ocr_text": ocr_text, "extracted_data": extracted_data}

@app.post("/documents/{document_id}/detect_anomaly")
async def detect_anomaly(document_id: int):
    anomaly_result = crud.detect_anomaly_in_image(document_id, minio_client)
    return anomaly_result

@app.get("/export/projects", response_class=StreamingResponse)
def export_projects(db: Session = Depends(get_db)):
    projects = crud.get_projects(db)
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Název", "Popis", "Vlastník ID"])
    for project in projects:
        writer.writerow([project.id, project.name, project.description, project.owner_id])
    output.seek(0)
    return StreamingResponse(output, media_type="text/csv", headers={
        "Content-Disposition": "attachment; filename=projects.csv"
    })

@app.get("/export/documents", response_class=StreamingResponse)
def export_documents(db: Session = Depends(get_db)):
    documents = db.query(models.Document).all()
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Název souboru", "Kategorie", "Projekt ID"])
    for doc in documents:
        writer.writerow([doc.id, doc.filename, doc.category, doc.project_id])
    output.seek(0)
    return StreamingResponse(output, media_type="text/csv", headers={
        "Content-Disposition": "attachment; filename=documents.csv"
    })

@app.get("/export/progress_logs", response_class=StreamingResponse)
def export_progress_logs(db: Session = Depends(get_db)):
    progress_logs = db.query(models.ProgressLog).all()
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Projekt ID", "Datum", "Procento dokončení", "Poznámky"])
    for log in progress_logs:
        writer.writerow([log.id, log.project_id, log.date, log.percentage_completed, log.notes])
    output.seek(0)
    return StreamingResponse(output, media_type="text/csv", headers={
        "Content-Disposition": "attachment; filename=progress_logs.csv"
    })

@app.get("/projects/{project_id}/overall_progress/")
def get_project_overall_progress(project_id: int, db: Session = Depends(get_db)):
    overall_progress = crud.get_project_overall_progress(db, project_id=project_id)
    return {"overall_progress": overall_progress}

@app.get("/dashboard_stats/")
def get_dashboard_stats(db: Session = Depends(get_db)):
    total_projects = crud.get_total_projects_count(db)
    completed_projects = crud.get_completed_projects_count(db)
    average_overall_progress = crud.get_average_overall_progress(db)
    return {
        "total_projects": total_projects,
        "completed_projects": completed_projects,
        "active_projects": total_projects - completed_projects,
        "average_overall_progress": average_overall_progress
    }
