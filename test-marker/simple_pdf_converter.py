#!/usr/bin/env python3
"""
Alternative PDF to Markdown converter using PyPDF2/pdfplumber
Simpler approach without heavy ML models
"""

import sys

try:
    import pdfplumber
    use_plumber = True
except ImportError:
    use_plumber = False

try:
    from pypdf import PdfReader
    use_pypdf = True
except ImportError:
    use_pypdf = False

from pathlib import Path

def convert_with_pdfplumber(pdf_path):
    """Convert PDF to markdown using pdfplumber (better table support)"""
    markdown = []

    with pdfplumber.open(pdf_path) as pdf:
        for page_num, page in enumerate(pdf.pages, 1):
            # Extract text
            text = page.extract_text()
            if text:
                markdown.append(f"# Page {page_num}\n\n")
                markdown.append(text)
                markdown.append("\n\n")

            # Extract tables
            tables = page.extract_tables()
            for table in tables:
                if table:
                    markdown.append("| " + " | ".join(str(cell or "") for cell in table[0]) + " |\n")
                    markdown.append("|" + "|".join(["---" for _ in table[0]]) + "|\n")
                    for row in table[1:]:
                        markdown.append("| " + " | ".join(str(cell or "") for cell in row) + " |\n")
                    markdown.append("\n")

    return "".join(markdown)

def convert_with_pypdf(pdf_path):
    """Convert PDF to markdown using PyPDF (basic text extraction)"""
    markdown = []

    reader = PdfReader(pdf_path)
    for page_num, page in enumerate(reader.pages, 1):
        text = page.extract_text()
        if text:
            markdown.append(f"# Page {page_num}\n\n")
            markdown.append(text)
            markdown.append("\n\n")

    return "".join(markdown)

def main():
    pdf_path = Path("test-marker/input/test-document.pdf")
    output_path = Path("test-marker/output/test-document-simple.md")

    print(f"Converting {pdf_path}...")
    print(f"Available converters:")
    print(f"  - pdfplumber: {use_plumber}")
    print(f"  - pypdf: {use_pypdf}")

    if use_plumber:
        print("\nUsing pdfplumber (best quality)...")
        markdown = convert_with_pdfplumber(pdf_path)
    elif use_pypdf:
        print("\nUsing PyPDF (basic)...")
        markdown = convert_with_pypdf(pdf_path)
    else:
        print("\nERROR: No PDF library available!")
        print("Install with: pip3 install pdfplumber pypdf")
        sys.exit(1)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(markdown, encoding='utf-8')

    print(f"\n✓ Conversion complete!")
    print(f"  Output: {output_path}")
    print(f"  Length: {len(markdown)} characters")
    print(f"\nFirst 500 characters:")
    print("-" * 50)
    print(markdown[:500])
    print("-" * 50)

if __name__ == "__main__":
    main()
