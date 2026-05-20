import fitz
import os

def split_pdf_to_images(pdf_path):

    base_dir = os.environ.get("UPLOAD_DIR", "/tmp/invoice-uploads")
    output_dir = os.path.join(base_dir, "split_pages")

    os.makedirs(output_dir, exist_ok=True)

    doc = fitz.open(pdf_path)

    image_paths = []

    for page_num in range(len(doc)):

        page = doc.load_page(page_num)

        pix = page.get_pixmap(matrix=fitz.Matrix(3, 3))

        image_path = os.path.join(
            output_dir,
            f"page_{page_num+1}.png"
        )

        pix.save(image_path)

        image_paths.append(image_path)

    return image_paths