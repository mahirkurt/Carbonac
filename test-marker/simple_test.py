#!/usr/bin/env python3
"""
Simple Marker test script - convert a single PDF to Markdown
"""

import os
from pathlib import Path

# Import marker
from marker.converters.pdf import PdfConverter
from marker.models import create_model_dict
from marker.config.parser import ConfigParser

def main():
    # Setup paths
    pdf_path = Path("test-marker/input/test-document.pdf")
    output_dir = Path("test-marker/output")
    output_dir.mkdir(parents=True, exist_ok=True)

    print(f"Converting: {pdf_path}")
    print("Loading models...")

    # Create converter with default config
    config = {
        "output_format": "markdown",
        "disable_image_extraction": True,  # Disable images for faster test
        "disable_multiprocessing": True,  # Simpler mode for testing
    }

    converter = PdfConverter(
        config=config,
        artifact_dict=create_model_dict(),
        processor_list=None,
        renderer=None
    )

    print("Converting PDF...")

    # Convert the PDF
    with open(pdf_path, 'rb') as f:
        pdf_bytes = f.read()

    rendered = converter(pdf_bytes)

    # Save markdown output
    output_file = output_dir / "test-document.md"
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(rendered.markdown)

    print(f"✓ Conversion complete!")
    print(f"  Output saved to: {output_file}")
    print(f"  Markdown length: {len(rendered.markdown)} characters")
    print(f"\nFirst 500 characters of output:")
    print("-" * 50)
    print(rendered.markdown[:500])
    print("-" * 50)

if __name__ == "__main__":
    main()
