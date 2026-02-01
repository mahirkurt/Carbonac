#!/usr/bin/env python3
"""
Document Converter - Python fallback for document to Markdown conversion
Uses marker-pdf for high-quality PDF to Markdown conversion
"""

import sys
import os
from pathlib import Path

def convert_pdf_to_markdown(input_path: str) -> str:
    """Convert PDF to Markdown using marker-pdf"""
    try:
        from marker.convert import convert_single_pdf
        from marker.models import load_all_models
        
        # Load models
        model_lst = load_all_models()
        
        # Convert
        full_text, images, out_meta = convert_single_pdf(
            input_path, 
            model_lst,
            max_pages=None,
            langs=["tr", "en"],
            batch_multiplier=2,
        )
        
        return full_text
        
    except ImportError:
        # Fallback to basic extraction
        return extract_text_fallback(input_path)

def convert_docx_to_markdown(input_path: str) -> str:
    """Convert DOCX to Markdown"""
    try:
        import mammoth
        
        with open(input_path, "rb") as docx_file:
            result = mammoth.convert_to_markdown(docx_file)
            return result.value
            
    except ImportError:
        # Fallback
        return extract_text_fallback(input_path)

def extract_text_fallback(input_path: str) -> str:
    """Fallback text extraction"""
    ext = Path(input_path).suffix.lower()
    
    if ext == '.pdf':
        try:
            import PyPDF2
            
            with open(input_path, 'rb') as file:
                reader = PyPDF2.PdfReader(file)
                text_parts = []
                
                for page in reader.pages:
                    text_parts.append(page.extract_text())
                
                return '\n\n'.join(text_parts)
                
        except Exception as e:
            return f"PDF extraction error: {str(e)}"
    
    elif ext in ['.txt', '.md']:
        with open(input_path, 'r', encoding='utf-8') as file:
            return file.read()
    
    return "Unsupported file format"

def main():
    if len(sys.argv) < 2:
        print("Usage: python document_converter.py <input_file>", file=sys.stderr)
        sys.exit(1)
    
    input_path = sys.argv[1]
    
    if not os.path.exists(input_path):
        print(f"File not found: {input_path}", file=sys.stderr)
        sys.exit(1)
    
    ext = Path(input_path).suffix.lower()
    
    if ext == '.pdf':
        result = convert_pdf_to_markdown(input_path)
    elif ext in ['.docx', '.doc']:
        result = convert_docx_to_markdown(input_path)
    elif ext in ['.txt', '.md']:
        with open(input_path, 'r', encoding='utf-8') as f:
            result = f.read()
    else:
        result = extract_text_fallback(input_path)
    
    print(result)

if __name__ == "__main__":
    main()
