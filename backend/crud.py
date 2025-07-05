from sqlalchemy.orm import Session
from . import models, schemas
from minio import Minio
import pytesseract
from PIL import Image
from io import BytesIO
import spacy

nlp = spacy.load("en_core_web_sm")

def get_project(db: Session, project_id: int):
    return db.query(models.Project).filter(models.Project.id == project_id).first()

def get_projects(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Project).offset(skip).limit(limit).all()

def create_project(db: Session, project: schemas.ProjectCreate):
    db_project = models.Project(**project.dict(), owner_id=1) # Hardcoded owner_id
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

def update_project(db: Session, project_id: int, project: schemas.ProjectCreate):
    db_project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if db_project:
        db_project.name = project.name
        db_project.description = project.description
        db.commit()
        db.refresh(db_project)
    return db_project

def delete_project(db: Session, project_id: int):
    db_project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if db_project:
        db.delete(db_project)
        db.commit()
    return db_project

def get_documents(db: Session, project_id: int, category: str | None = None, skip: int = 0, limit: int = 100):
    query = db.query(models.Document).filter(models.Document.project_id == project_id)
    if category:
        query = query.filter(models.Document.category == category)
    return query.offset(skip).limit(limit).all()

def create_progress_log(db: Session, progress_log: schemas.ProgressLogCreate, project_id: int):
    db_progress_log = models.ProgressLog(**progress_log.dict(), project_id=project_id)
    db.add(db_progress_log)
    db.commit()
    db.refresh(db_progress_log)
    return db_progress_log

def update_progress_log(db: Session, progress_log_id: int, progress_log: schemas.ProgressLogCreate):
    db_progress_log = db.query(models.ProgressLog).filter(models.ProgressLog.id == progress_log_id).first()
    if db_progress_log:
        db_progress_log.date = progress_log.date
        db_progress_log.percentage_completed = progress_log.percentage_completed
        db_progress_log.notes = progress_log.notes
        db.commit()
        db.refresh(db_progress_log)
    return db_progress_log

def delete_progress_log(db: Session, progress_log_id: int):
    db_progress_log = db.query(models.ProgressLog).filter(models.ProgressLog.id == progress_log_id).first()
    if db_progress_log:
        db.delete(db_progress_log)
        db.commit()
    return db_progress_log

def get_progress_logs(db: Session, project_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.ProgressLog).filter(models.ProgressLog.project_id == project_id).offset(skip).limit(limit).all()

def get_project_overall_progress(db: Session, project_id: int):
    progress_logs = db.query(models.ProgressLog).filter(models.ProgressLog.project_id == project_id).all()
    if not progress_logs:
        return 0
    total_percentage = sum([log.percentage_completed for log in progress_logs])
    return total_percentage / len(progress_logs)

import spacy
import cv2
import numpy as np

nlp = spacy.load("en_core_web_sm")

def perform_ocr_on_document(db: Session, document_id: int, minio_client: Minio):
    db_document = db.query(models.Document).filter(models.Document.id == document_id).first()
    if not db_document:
        return None, None

    bucket_name = "ranger-bucket"
    try:
        response = minio_client.get_object(bucket_name, db_document.filename)
        image_bytes = response.read()
        image = Image.open(BytesIO(image_bytes))
        text = pytesseract.image_to_string(image)
        extracted_data = extract_key_data_from_text(text)
        return text, extracted_data
    except Exception as e:
        print(f"Error performing OCR: {e}")
        return None, None

def detect_anomaly_in_image(document_id: int, minio_client: Minio):
    # This is a placeholder for actual anomaly detection logic.
    # In a real scenario, you would load a trained model or implement
    # specific image processing algorithms here.
    # For demonstration, we'll just simulate a detection.

    # Example: Load image from MinIO (simplified)
    bucket_name = "ranger-bucket"
    try:
        response = minio_client.get_object(bucket_name, f"image_{document_id}.jpg") # Assuming a specific naming convention or fetching by filename
        image_bytes = response.read()
        # Convert bytes to numpy array for OpenCV
        np_array = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(np_array, cv2.IMREAD_COLOR)

        if image is None:
            return {"anomaly_detected": False, "message": "Could not decode image.", "details": ""}

        # Simulate anomaly detection: e.g., check if image is mostly red
        # This is a very basic and arbitrary example.
        red_channel = image[:,:,2]
        if np.mean(red_channel) > 150: # Arbitrary threshold
            return {"anomaly_detected": True, "message": "Detekována anomálie: Obrázek je příliš červený.", "details": "Možná chyba v osvětlení nebo poškození."}
        else:
            return {"anomaly_detected": False, "message": "Anomálie nenalezena.", "details": ""}

    except Exception as e:
        print(f"Error during anomaly detection: {e}")
        return {"anomaly_detected": False, "message": "Chyba při detekci anomálií.", "details": str(e)}

def extract_key_data_from_text(text: str):
    doc = nlp(text)
    extracted_data = []
    for ent in doc.ents:
        if ent.label_ == "QUANTITY" or ent.label_ == "CARDINAL":
            extracted_data.append({"text": ent.text, "label": ent.label_})
    return extracted_data

def get_total_projects_count(db: Session):
    return db.query(models.Project).count()

def get_total_projects_count(db: Session):
    return db.query(models.Project).count()

def get_completed_projects_count(db: Session):
    completed_projects = db.query(models.Project).join(models.ProgressLog).filter(models.ProgressLog.percentage_completed == 100).distinct().count()
    return completed_projects

def get_average_overall_progress(db: Session):
    all_projects = db.query(models.Project).all()
    if not all_projects:
        return 0
    total_overall_progress = 0
    for project in all_projects:
        total_overall_progress += get_project_overall_progress(db, project.id)
    return total_overall_progress / len(all_projects)
