"""Database models."""
from datetime import datetime
from typing import List

from sqlalchemy import Column, Integer, String, DateTime, Float, Table, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()

# Association table for Record and Tag (many-to-many)
record_tag_association = Table(
    "record_tag",
    Base.metadata,
    Column("record_id", Integer, ForeignKey("record.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", Integer, ForeignKey("tag.id", ondelete="CASCADE"), primary_key=True),
)


class Record(Base):
    """Work record model."""

    __tablename__ = "record"

    id = Column(Integer, primary_key=True, index=True)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    duration = Column(Integer, nullable=False)  # in seconds
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    tags: List["Tag"] = relationship(
        "Tag",
        secondary=record_tag_association,
        back_populates="records",
        cascade="save-update, merge",
    )

    def __repr__(self):
        return f"<Record(id={self.id}, start_time={self.start_time}, duration={self.duration})>"


class Tag(Base):
    """Tag model."""

    __tablename__ = "tag"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)

    # Relationships
    records: List[Record] = relationship(
        "Record",
        secondary=record_tag_association,
        back_populates="tags",
    )

    def __repr__(self):
        return f"<Tag(id={self.id}, name={self.name})>"
