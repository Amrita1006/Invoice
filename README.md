# InvoiceIQ AI - Smart Invoice Management Platform

A full-stack AI-powered invoice management system with OCR extraction, structured data processing, and Excel export capabilities.

## Tech Stack

**Frontend:**
- React 18
- Vite
- Tailwind CSS
- React Router
- Axios
- Lucide React (icons)

**Backend:**
- FastAPI
- Python 3.11
- SQLAlchemy
- SQLite (can upgrade to PostgreSQL)
- OpenPyXL for Excel generation

**AI/OCR:**
- ZhipuAI GLM-4V for OCR and structured data extraction

## Features

- Upload image/PDF invoices with drag-and-drop support
- AI-powered OCR extraction using GLM-4V
- Automatic structured data extraction (invoice number, GST, vendor, products, etc.)
- Human review screen for corrections
- Professional Excel report generation
- Invoice history with search and pagination
- Dashboard with statistics and charts

## Project Structure

```
invoiceiq-ai/
├── backend/
│   └── app/
│       ├── routes/          # API endpoints
│       ├── services/        # Business logic (OCR, Excel)
│       ├── models/          # Database models
│       ├── database/        # Database configuration
│       └── main.py          # FastAPI application
├── frontend/
│   └── src/
│       ├── pages/           # React pages
│       ├── components/      # Reusable components
│       ├── services/        # API client
│       └── layouts/         # Layout components
├── requirements.txt
└── README.md
```

## Setup

### Backend

```bash
cd backend
pip install -r ../requirements.txt
```

Create a `.env` file in the `backend` directory:
```
ZHIPUAI_API_KEY=your_api_key_here
```

Run the backend:
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## API Endpoints

- `POST /api/invoices/upload` - Upload invoice file
- `POST /api/invoices/extract` - Extract data using OCR
- `POST /api/invoices/save` - Save invoice to database
- `GET /api/invoices/history` - Get invoice history
- `GET /api/invoices/{id}` - Get single invoice
- `GET /api/invoices/preview/{id}` - Preview Excel
- `GET /api/invoices/download/{id}` - Download Excel
- `DELETE /api/invoices/{id}` - Delete invoice
- `GET /api/dashboard/stats` - Dashboard statistics

## Usage

1. Start the backend server on port 8000
2. Start the frontend on port 5173
3. Navigate to http://localhost:5173
4. Upload an invoice image or PDF
5. Review and edit the extracted data
6. Save the invoice and download the Excel report

## Database Schema

### Invoice
- id, invoice_number, vendor_name, invoice_date, gst_number, phone_number, email, total_amount, excel_file, created_at

### Product
- id, invoice_id, item_name, quantity, amount