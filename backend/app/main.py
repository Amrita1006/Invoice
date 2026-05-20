from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

from .database.database import engine, Base
from .routes import invoice_routes, dashboard_routes
import logging

logging.basicConfig(level=logging.INFO)

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="InvoiceIQ AI API",
    description="AI-powered Invoice Management Platform",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://invoice-virid-six.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(invoice_routes.router, prefix="/api", tags=["invoices"])
app.include_router(dashboard_routes.router, prefix="/api/dashboard", tags=["dashboard"])

@app.get("/")
async def root():
    return {"message": "InvoiceIQ AI API", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "InvoiceIQ AI"}

@app.options("/{full_path:path}")
async def options_handler(full_path: str):
    return {"message": "OK"}