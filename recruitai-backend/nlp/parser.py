import os
import PyPDF2
import docx

def extract_text(file_path: str) -> str:
    ext = os.path.splitext(file_path)[1].lower()

    if ext == '.pdf':
        return _extract_pdf(file_path)
    elif ext == '.docx':
        return _extract_docx(file_path)
    elif ext == '.txt':
        return _extract_txt(file_path)
    else:
        raise ValueError(f'Unsupported file type: {ext}')


def _extract_pdf(file_path: str) -> str:
    text = []
    try:
        with open(file_path, 'rb') as f:
            reader = PyPDF2.PdfReader(f)
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text.append(page_text)
    except Exception as e:
        raise RuntimeError(f'PDF extraction failed: {str(e)}')

    result = '\n'.join(text).strip()
    if not result:
        raise RuntimeError('Could not extract text from PDF. Make sure it is not a scanned image.')
    return result


def _extract_docx(file_path: str) -> str:
    try:
        doc  = docx.Document(file_path)
        text = [para.text for para in doc.paragraphs if para.text.strip()]
        return '\n'.join(text).strip()
    except Exception as e:
        raise RuntimeError(f'DOCX extraction failed: {str(e)}')


def _extract_txt(file_path: str) -> str:
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read().strip()
    except Exception as e:
        raise RuntimeError(f'TXT read failed: {str(e)}')