"""API endpoints for records."""
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Tag
from app.schemas import RecordCreate, RecordResponse, SummaryResponse, SummaryByTag, TagResponse
from app.services import RecordService, TagService

router = APIRouter(prefix="/api", tags=["records"])


@router.post("/records", response_model=RecordResponse)
def create_record(record: RecordCreate, db: Session = Depends(get_db)):
    """Create a new work record."""
    created_record = RecordService.create_record(db, record)
    return created_record


@router.get("/records", response_model=List[RecordResponse])
def get_records(
    skip: int = 0,
    limit: int = 100,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Get all records with optional date filtering."""
    start_dt = None
    end_dt = None

    if start_date:
        try:
            start_dt = datetime.fromisoformat(start_date)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid start_date format")

    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid end_date format")

    records = RecordService.get_all_records(db, skip=skip, limit=limit, start_date=start_dt, end_date=end_dt)
    return records


@router.get("/records/{record_id}", response_model=RecordResponse)
def get_record(record_id: int, db: Session = Depends(get_db)):
    """Get a specific record by ID."""
    record = RecordService.get_record(db, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    return record


@router.delete("/records/{record_id}")
def delete_record(record_id: int, db: Session = Depends(get_db)):
    """Delete a record by ID."""
    if not RecordService.delete_record(db, record_id):
        raise HTTPException(status_code=404, detail="Record not found")
    return {"message": "Record deleted"}


@router.get("/records/summary", response_model=SummaryResponse)
def get_summary(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Get summary of records grouped by tag and date."""
    start_dt = None
    end_dt = None

    if start_date:
        try:
            start_dt = datetime.fromisoformat(start_date)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid start_date format")

    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid end_date format")

    by_tag, by_date = RecordService.get_summary(db, start_date=start_dt, end_date=end_dt)
    return SummaryResponse(by_tag=by_tag, by_date=by_date)


@router.get("/tags", response_model=List[TagResponse])
def get_tags(db: Session = Depends(get_db)):
    """Get all tags."""
    tags = TagService.get_all_tags(db)
    return tags
