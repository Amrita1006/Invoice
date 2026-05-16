from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from collections import defaultdict

from ..database.database import get_db
from ..models.models import Invoice

router = APIRouter()


@router.get("/stats")
async def get_dashboard_stats(db: Session = Depends(get_db)):
    """Get dashboard statistics"""
    try:
        total_invoices = db.query(func.count(Invoice.id)).scalar() or 0
        
        total_amount = db.query(func.sum(Invoice.total_amount)).scalar() or 0
        
        latest_invoices = db.query(Invoice).order_by(Invoice.created_at.desc()).limit(5).all()
        
        thirty_days_ago = datetime.now() - timedelta(days=30)
        recent_invoices = db.query(Invoice).filter(
            Invoice.created_at >= thirty_days_ago
        ).all()
        
        monthly_stats = defaultdict(lambda: {"count": 0, "amount": 0})
        for inv in recent_invoices:
            month_key = inv.created_at.strftime("%Y-%m")
            monthly_stats[month_key]["count"] += 1
            monthly_stats[month_key]["amount"] += inv.total_amount
        
        monthly_data = [
            {
                "month": month,
                "count": stats["count"],
                "amount": stats["amount"]
            }
            for month, stats in sorted(monthly_stats.items())
        ]
        
        return {
            "success": True,
            "stats": {
                "total_invoices": total_invoices,
                "total_amount": total_amount,
                "latest_invoices": [
                    {
                        "id": inv.id,
                        "invoice_number": inv.invoice_number,
                        "vendor_name": inv.vendor_name,
                        "total_amount": inv.total_amount,
                        "created_at": inv.created_at.isoformat()
                    }
                    for inv in latest_invoices
                ],
                "monthly_stats": monthly_data
            }
        }
    except Exception as e:
        return {
            "success": True,
            "stats": {
                "total_invoices": 0,
                "total_amount": 0,
                "latest_invoices": [],
                "monthly_stats": []
            }
        }