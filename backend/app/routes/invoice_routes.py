from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
import os
import uuid
import shutil
from concurrent.futures import ThreadPoolExecutor
import asyncio

from ..services.pdf_service import split_pdf_to_images
from ..services.ocr_service import extract_invoice_data
from ..services.excel_service import generate_invoice_excel
from ..database.database import get_db
from ..models.models import Invoice, Product

router = APIRouter()

UPLOAD_DIR = "uploads"

os.makedirs(UPLOAD_DIR, exist_ok=True)

MAX_WORKERS = 4

def process_page(page, file_path):
    """Process a single page - runs in thread pool"""
    try:
        invoice_data = extract_invoice_data(page)
        return {
            "success": True,
            "page": page,
            "file_path": file_path,
            "data": invoice_data
        }
    except Exception as page_error:
        return {
            "success": False,
            "page": page,
            "error": str(page_error)
        }


@router.post('/upload')
async def upload_and_extract(file: UploadFile = File(...)):

    try:

        # Get file extension
        file_ext = os.path.splitext(file.filename)[1].lower()

        # Allowed file types
        allowed_extensions = ['.jpg', '.jpeg', '.png', '.pdf']

        if file_ext not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail='Only JPG, JPEG, PNG, PDF files are allowed'
            )

        # Generate unique filename
        unique_filename = f"{uuid.uuid4()}{file_ext}"

        # Full file path
        file_path = os.path.join(
            UPLOAD_DIR,
            unique_filename
        )

        # Save uploaded file
        with open(file_path, 'wb') as buffer:
            shutil.copyfileobj(file.file, buffer)

        invoices = []

        # =========================
        # PDF PROCESSING
        # =========================
        if file_ext == '.pdf':

            # Split PDF into images
            pages = split_pdf_to_images(file_path)

            # Process pages in parallel using ThreadPoolExecutor
            with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
                results = list(executor.map(
                    lambda page: process_page(page, file_path),
                    pages
                ))
            invoices = results

        # =========================
        # IMAGE PROCESSING
        # =========================
        else:

            try:

                invoice_data = extract_invoice_data(file_path)

                invoices.append({
                    "success": True,
                    "page": file.filename,
                    "file_path": file_path,
                    "data": invoice_data
                })

            except Exception as image_error:

                invoices.append({
                    "success": False,
                    "page": file.filename,
                    "error": str(image_error)
                })

        # =========================
        # FINAL RESPONSE
        # =========================
        return {
            "success": True,
            "total_invoices": len(invoices),
            "invoices": invoices
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@router.post('/save')
async def save_invoice(data: dict, db: Session = Depends(get_db)):
    """Save invoice to database"""
    try:
        invoice = Invoice(
            invoice_number=data.get('invoice_number', ''),
            vendor_name=data.get('vendor_name', ''),
            invoice_date=data.get('invoice_date', ''),
            gst_number=data.get('gst_number', ''),
            phone_number=data.get('phone_number', ''),
            email=data.get('email', ''),
            total_amount=float(data.get('total_amount', 0) or 0),
            original_file=data.get('file_path', '')
        )
        
        db.add(invoice)
        db.flush()
        
        products = data.get('products', [])
        for p in products:
            if p.get('item_name'):
                product = Product(
                    invoice_id=invoice.id,
                    item_name=p.get('item_name', ''),
                    quantity=str(p.get('quantity', '')),
                    amount=float(p.get('amount', 0) or 0)
                )
                db.add(product)
        
        excel_path = generate_invoice_excel({
            'invoice_number': invoice.invoice_number,
            'vendor_name': invoice.vendor_name,
            'invoice_date': invoice.invoice_date,
            'gst_number': invoice.gst_number,
            'phone_number': invoice.phone_number,
            'email': invoice.email,
            'total_amount': invoice.total_amount,
            'products': [{'item_name': p.get('item_name', ''), 'quantity': str(p.get('quantity', '')), 'amount': float(p.get('amount', 0) or 0)} for p in products]
        })
        
        invoice.excel_file = excel_path
        
        db.commit()
        db.refresh(invoice)
        
        return {
            "success": True,
            "message": "Invoice saved successfully",
            "invoice_id": invoice.id
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/history')
async def get_invoice_history(
    search: str = '',
    page: int = 1,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """Get invoice history"""
    try:
        query = db.query(Invoice)
        
        if search:
            search_filter = f"%{search}%"
            query = query.filter(
                (Invoice.invoice_number.ilike(search_filter)) |
                (Invoice.vendor_name.ilike(search_filter)) |
                (Invoice.gst_number.ilike(search_filter))
            )
        
        total = query.count()
        
        invoices = query.order_by(Invoice.created_at.desc()) \
            .offset((page - 1) * limit) \
            .limit(limit) \
            .all()
        
        return {
            "success": True,
            "invoices": [
                {
                    "id": inv.id,
                    "invoice_number": inv.invoice_number,
                    "vendor_name": inv.vendor_name,
                    "invoice_date": inv.invoice_date,
                    "gst_number": inv.gst_number,
                    "phone_number": inv.phone_number,
                    "email": inv.email,
                    "total_amount": inv.total_amount,
                    "excel_file": inv.excel_file,
                    "original_file": inv.original_file,
                    "created_at": inv.created_at.isoformat() if inv.created_at else None
                }
                for inv in invoices
            ],
            "total": total,
            "page": page,
            "limit": limit
        }
        
    except Exception as e:
        return {
            "success": False,
            "invoices": [],
            "total": 0,
            "page": page,
            "limit": limit
        }


@router.get('/{invoice_id}')
async def get_invoice(invoice_id: int, db: Session = Depends(get_db)):
    """Get single invoice"""
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    products = db.query(Product).filter(Product.invoice_id == invoice_id).all()
    
    return {
        "success": True,
        "invoice": {
            "id": invoice.id,
            "invoice_number": invoice.invoice_number,
            "vendor_name": invoice.vendor_name,
            "invoice_date": invoice.invoice_date,
            "gst_number": invoice.gst_number,
            "phone_number": invoice.phone_number,
            "email": invoice.email,
            "total_amount": invoice.total_amount,
            "excel_file": invoice.excel_file,
            "original_file": invoice.original_file,
            "created_at": invoice.created_at.isoformat() if invoice.created_at else None,
            "products": [
                {
                    "id": p.id,
                    "item_name": p.item_name,
                    "quantity": p.quantity,
                    "amount": p.amount
                }
                for p in products
            ]
        }
    }


@router.delete('/{invoice_id}')
async def delete_invoice(invoice_id: int, db: Session = Depends(get_db)):
    """Delete invoice"""
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    db.query(Product).filter(Product.invoice_id == invoice_id).delete()
    db.delete(invoice)
    db.commit()
    
    return {"success": True, "message": "Invoice deleted"}


@router.get('/download/{invoice_id}')
async def download_excel(invoice_id: int, db: Session = Depends(get_db)):
    """Download Excel file"""
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    if not invoice.excel_file or not os.path.exists(invoice.excel_file):
        raise HTTPException(status_code=404, detail="Excel file not found")
    
    from fastapi.responses import FileResponse
    return FileResponse(
        invoice.excel_file,
        media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        filename=f"invoice_{invoice.invoice_number}.xlsx"
    )


@router.get('/preview/{invoice_id}')
async def preview_excel(invoice_id: int, db: Session = Depends(get_db)):
    """Preview Excel file"""
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    if not invoice.excel_file or not os.path.exists(invoice.excel_file):
        raise HTTPException(status_code=404, detail="Excel file not found")
    
    from fastapi.responses import FileResponse
    return FileResponse(
        invoice.excel_file,
        media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        headers={"Content-Disposition": f"inline; filename=invoice_{invoice.invoice_number}.xlsx"}
    )