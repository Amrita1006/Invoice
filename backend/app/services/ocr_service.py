import os
import base64
import json
from PIL import Image, ImageEnhance, ImageFilter
import io
import logging
import cv2
from PIL import Image

logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def preprocess_image(image_path):

    image = cv2.imread(image_path)

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    denoise = cv2.fastNlMeansDenoising(gray)

    thresh = cv2.threshold(
        denoise,
        0,
        255,
        cv2.THRESH_BINARY + cv2.THRESH_OTSU
    )[1]

    processed_path = image_path.replace(".", "_processed.")

    cv2.imwrite(processed_path, thresh)

    return Image.open(processed_path)


def encode_image_to_base64(image):
    """Encode PIL Image to base64"""
    buffered = io.BytesIO()
    image.save(buffered, format="PNG")
    return base64.b64encode(buffered.getvalue()).decode('utf-8')


def extract_invoice_data(image_path):
    """Extract invoice data using ZhipuAI GLM OCR"""
    api_key = os.getenv("ZHIPUAI_API_KEY", "")
    print(f"DEBUG: Checking API Key - present: {bool(api_key)}, length: {len(api_key) if api_key else 0}")
    
    if not api_key or api_key == "your_api_key_here" or len(api_key) < 10:
        print("DEBUG: Using fallback - no valid API key")
        return {
            "invoice_number": "",
            "vendor_name": "",
            "invoice_date": "",
            "gst_number": "",
            "phone_number": "",
            "email": "",
            "total_amount": 0,
            "products": []
        }
    
    if not api_key or api_key == "your_api_key_here" or len(api_key) < 10:
        return {
            "invoice_number": "INV-2024-001",
            "vendor_name": "Sample Vendor Ltd",
            "invoice_date": "2024-01-15",
            "gst_number": "27AABCU9603R1ZM",
            "phone_number": "+91-9876543210",
            "email": "contact@samplevendor.com",
            "total_amount": 15000,
            "products": [
                {"item_name": "Product A - Standard", "quantity": "10", "amount": 5000},
                {"item_name": "Product B - Premium", "quantity": "5", "amount": 10000}
            ]
        }
    
    try:
        from zhipuai import ZhipuAI
        client = ZhipuAI(api_key=api_key)
        
        preprocessed_img = preprocess_image(image_path)
        image_base64 = encode_image_to_base64(preprocessed_img)
        
        prompt = """
You are a highly accurate invoice OCR AI.

Analyze this invoice carefully.

Extract:
- invoice_number
- vendor_name
- invoice_date
- gst_number
- phone_number
- email
- total_amount
- products

Rules:
1. Return ONLY valid JSON.
2. Do not hallucinate values.
3. If field missing use empty string.
4. Products must contain:
   - item_name
   - quantity
   - amount
5. Detect invoice totals carefully.
6. Preserve exact invoice number.
7. Ignore logos and decorative text.

Return format:

{
  "invoice_number": "",
  "vendor_name": "",
  "invoice_date": "",
  "gst_number": "",
  "phone_number": "",
  "email": "",
  "total_amount": 0,
  "products": []
}
"""

        response = client.chat.completions.create(
            model="glm-4v-plus",
            messages=[{
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{image_base64}"}}
                ]
            }],
            temperature=0.3
        )
        
        result_text = response.choices[0].message.content
        print(f"DEBUG RAW RESPONSE: {result_text[:500]}")
        result_text = result_text.replace('₹', 'Rs ')
        result_text = result_text.replace('\u20b9', 'Rs ')
        
        if "```json" in result_text:
            result_text = result_text.split("```json")[1].split("```")[0]
        elif "```" in result_text:
            result_text = result_text.split("```")[1]
        
        result_text = result_text.strip()
        
        try:
            invoice_data = json.loads(result_text)
        except json.JSONDecodeError:
            print(f"JSON Decode Error - Response: {result_text[:200]}")
            invoice_data = {
                "invoice_number": "",
                "vendor_name": "",
                "invoice_date": "",
                "gst_number": "",
                "phone_number": "",
                "email": "",
                "total_amount": 0,
                "products": []
            }
        
        return invoice_data
        
    except Exception as e:
        print(f"OCR Error: {str(e)}")
        return {
            "invoice_number": "",
            "vendor_name": "",
            "invoice_date": "",
            "gst_number": "",
            "phone_number": "",
            "email": "",
            "total_amount": 0,
            "products": []
        }


def extract_with_fallback(image_path):
    """Extract invoice data with fallback"""
    return extract_invoice_data(image_path)