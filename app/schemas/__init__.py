"""Pydantic schemas for request/response validation."""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class TagCreate(BaseModel):
    """Schema for creating a tag."""

    name: str = Field(..., min_length=1, max_length=100)


class TagResponse(BaseModel):
    """Schema for tag response."""

    id: int
    name: str

    class Config:
        from_attributes = True


class RecordCreate(BaseModel):
    """Schema for creating a record."""

    start_time: datetime
    end_time: datetime
    duration: int = Field(..., ge=0)  # duration in seconds
    description: Optional[str] = None
    tag_ids: Optional[List[int]] = []
    tag_names: Optional[List[str]] = []  # for creating new tags


class RecordUpdate(BaseModel):
    """Schema for updating a record."""

    description: Optional[str] = None
    tag_ids: Optional[List[int]] = []


class RecordResponse(BaseModel):
    """Schema for record response."""

    id: int
    start_time: datetime
    end_time: datetime
    duration: int
    description: Optional[str]
    tags: List[TagResponse]
    created_at: datetime

    class Config:
        from_attributes = True


class SummaryByTag(BaseModel):
    """Schema for summary by tag."""

    tag_name: str
    total_duration: int  # in seconds


class SummaryByDate(BaseModel):
    """Schema for summary by date."""

    date: str  # YYYY-MM-DD format
    total_duration: int  # in seconds
    record_count: int


class SummaryResponse(BaseModel):
    """Schema for summary response."""

    by_tag: List[SummaryByTag]
    by_date: List[SummaryByDate]
