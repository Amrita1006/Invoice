from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database.database import Base


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String(100), nullable=True)
    vendor_name = Column(String(255), nullable=True)
    invoice_date = Column(String(50), nullable=True)
    gst_number = Column(String(50), nullable=True)
    phone_number = Column(String(50), nullable=True)
    email = Column(String(100), nullable=True)
    total_amount = Column(Float, default=0)
    excel_file = Column(String(500), nullable=True)
    original_file = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    products = relationship("Product", back_populates="invoice", cascade="all, delete-orphan")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False)
    item_name = Column(String(255), nullable=True)
    quantity = Column(String(50), nullable=True)
    amount = Column(Float, default=0)
    
    invoice = relationship("Invoice", back_populates="products")