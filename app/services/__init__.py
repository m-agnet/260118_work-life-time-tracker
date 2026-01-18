"""Business logic services."""
from datetime import datetime, timedelta
from typing import List, Optional, Dict

from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from app.models import Record, Tag
from app.schemas import RecordCreate, RecordResponse, SummaryByTag, SummaryByDate


class RecordService:
    """Service for managing records."""

    @staticmethod
    def create_record(db: Session, record_data: RecordCreate) -> Record:
        """Create a new record with tags."""
        # Create tag instances (new or existing)
        tags = []

        # Add existing tags by ID
        if record_data.tag_ids:
            existing_tags = db.query(Tag).filter(Tag.id.in_(record_data.tag_ids)).all()
            tags.extend(existing_tags)

        # Create new tags
        if record_data.tag_names:
            for tag_name in record_data.tag_names:
                # Check if tag already exists
                existing_tag = db.query(Tag).filter(Tag.name == tag_name).first()
                if existing_tag:
                    if existing_tag not in tags:
                        tags.append(existing_tag)
                else:
                    new_tag = Tag(name=tag_name)
                    db.add(new_tag)
                    db.flush()  # Get the ID
                    tags.append(new_tag)

        # Create record
        record = Record(
            start_time=record_data.start_time,
            end_time=record_data.end_time,
            duration=record_data.duration,
            description=record_data.description,
            tags=tags,
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        return record

    @staticmethod
    def get_record(db: Session, record_id: int) -> Optional[Record]:
        """Get a record by ID."""
        return db.query(Record).filter(Record.id == record_id).first()

    @staticmethod
    def get_all_records(
        db: Session,
        skip: int = 0,
        limit: int = 100,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> List[Record]:
        """Get all records with optional date filtering."""
        query = db.query(Record)

        if start_date:
            query = query.filter(Record.start_time >= start_date)
        if end_date:
            query = query.filter(Record.end_time <= end_date)

        return query.order_by(Record.created_at.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def delete_record(db: Session, record_id: int) -> bool:
        """Delete a record by ID."""
        record = db.query(Record).filter(Record.id == record_id).first()
        if record:
            db.delete(record)
            db.commit()
            return True
        return False

    @staticmethod
    def get_summary(
        db: Session,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> tuple[List[SummaryByTag], List[SummaryByDate]]:
        """Get summary of records by tag and by date."""
        query = db.query(Record)

        if start_date:
            query = query.filter(Record.start_time >= start_date)
        if end_date:
            query = query.filter(Record.end_time <= end_date)

        records = query.all()

        # Summary by tag
        tag_summary_dict: Dict[str, int] = {}
        for record in records:
            for tag in record.tags:
                if tag.name not in tag_summary_dict:
                    tag_summary_dict[tag.name] = 0
                tag_summary_dict[tag.name] += record.duration

        by_tag = [
            SummaryByTag(tag_name=name, total_duration=duration)
            for name, duration in sorted(tag_summary_dict.items())
        ]

        # Summary by date
        date_summary_dict: Dict[str, tuple[int, int]] = {}  # date -> (total_duration, count)
        for record in records:
            date_key = record.start_time.date().isoformat()
            if date_key not in date_summary_dict:
                date_summary_dict[date_key] = (0, 0)
            duration, count = date_summary_dict[date_key]
            date_summary_dict[date_key] = (duration + record.duration, count + 1)

        by_date = [
            SummaryByDate(date=date, total_duration=duration, record_count=count)
            for date, (duration, count) in sorted(date_summary_dict.items(), reverse=True)
        ]

        return by_tag, by_date


class TagService:
    """Service for managing tags."""

    @staticmethod
    def get_all_tags(db: Session) -> List[Tag]:
        """Get all tags."""
        return db.query(Tag).order_by(Tag.name).all()

    @staticmethod
    def get_or_create_tag(db: Session, name: str) -> Tag:
        """Get existing tag or create a new one."""
        tag = db.query(Tag).filter(Tag.name == name).first()
        if not tag:
            tag = Tag(name=name)
            db.add(tag)
            db.commit()
            db.refresh(tag)
        return tag

    @staticmethod
    def delete_tag(db: Session, tag_id: int) -> bool:
        """Delete a tag by ID."""
        tag = db.query(Tag).filter(Tag.id == tag_id).first()
        if tag:
            db.delete(tag)
            db.commit()
            return True
        return False
