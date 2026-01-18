"""Main FastAPI application."""
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.templating import Jinja2Templates
import os

from app.database import init_db
from app.api import router as api_router

# Initialize database
init_db()

# Create FastAPI app
app = FastAPI(title="Work Life Time Tracker", version="0.1.0")

# Setup static files
static_path = os.path.join(os.path.dirname(__file__), "static")
app.mount("/static", StaticFiles(directory=static_path), name="static")

# Setup templates
templates_path = os.path.join(os.path.dirname(__file__), "templates")
templates = Jinja2Templates(directory=templates_path)

# Include API router
app.include_router(api_router)


# Static routes
@app.get("/")
async def index():
    """Serve the index page."""
    return FileResponse("app/templates/index.html")


@app.get("/records")
async def records_page():
    """Serve the records page."""
    return FileResponse("app/templates/records.html")


@app.get("/analysis")
async def analysis_page():
    """Serve the analysis page."""
    return FileResponse("app/templates/analysis.html")


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
