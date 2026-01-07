"""
PDF Processor - Extract text from PDFs for AI context
"""

import os
import io
from typing import Optional, Dict
from datetime import datetime
import uuid

from openai import AsyncOpenAI

from utils.logger import setup_logger

logger = setup_logger("pdf_processor")

# Try to import PyPDF2 for basic PDF extraction
try:
    import PyPDF2
    HAS_PYPDF2 = True
except ImportError:
    HAS_PYPDF2 = False
    logger.warning("PyPDF2 not available - PDF text extraction will be limited")


class PDFProcessor:
    """
    Process PDF documents and extract text for AI context.
    """

    def __init__(self):
        """Initialize PDF processor"""
        openai_key = os.getenv("OPENAI_API_KEY")
        if openai_key:
            self.openai_client = AsyncOpenAI(api_key=openai_key)
        else:
            self.openai_client = None

    def extract_text_from_pdf(self, pdf_bytes: bytes) -> str:
        """
        Extract text from PDF bytes.

        Args:
            pdf_bytes: Raw PDF file bytes

        Returns:
            Extracted text from the PDF
        """
        if not HAS_PYPDF2:
            logger.error("PyPDF2 not installed - cannot extract PDF text")
            return ""

        try:
            pdf_file = io.BytesIO(pdf_bytes)
            pdf_reader = PyPDF2.PdfReader(pdf_file)

            text_parts = []
            for page_num, page in enumerate(pdf_reader.pages):
                try:
                    page_text = page.extract_text()
                    if page_text:
                        text_parts.append(f"--- Page {page_num + 1} ---\n{page_text}")
                except Exception as e:
                    logger.warning(f"Failed to extract text from page {page_num + 1}: {e}")

            full_text = "\n\n".join(text_parts)
            logger.info(f"Extracted {len(full_text)} characters from PDF ({len(pdf_reader.pages)} pages)")
            return full_text

        except Exception as e:
            logger.error(f"Failed to extract text from PDF: {e}")
            return ""

    async def summarize_document(self, text: str, document_name: str = None) -> str:
        """
        Generate an AI summary of the document text.

        Args:
            text: Extracted text from document
            document_name: Optional name of the document

        Returns:
            Summary of the document
        """
        if not self.openai_client:
            return ""

        if not text or len(text) < 100:
            return ""

        # Truncate very long documents for summarization
        text_for_summary = text[:15000] if len(text) > 15000 else text

        prompt = f"""Summarize this document in 2-3 paragraphs. Focus on:
1. What the document is about (type: handbook, SOP, policy, etc.)
2. Key topics covered
3. Important procedures or guidelines mentioned

Document{f' ({document_name})' if document_name else ''}:
{text_for_summary}

Provide a clear, structured summary:"""

        try:
            response = await self.openai_client.chat.completions.create(
                model="gpt-5.2",
                messages=[
                    {"role": "system", "content": "You are a document analyst. Provide clear, concise summaries."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=500
            )

            summary = response.choices[0].message.content
            logger.info(f"Generated summary for document: {len(summary)} chars")
            return summary

        except Exception as e:
            logger.error(f"Failed to summarize document: {e}")
            return ""

    async def process_pdf(
        self,
        pdf_bytes: bytes,
        filename: str,
        category: str = None,
        department: str = None
    ) -> Dict:
        """
        Process a PDF: extract text, generate summary.

        Args:
            pdf_bytes: Raw PDF file bytes
            filename: Original filename
            category: Document category (handbook, sop, policy)
            department: Associated department

        Returns:
            {
                "id": "uuid",
                "name": "filename",
                "file_size": 12345,
                "extracted_text": "...",
                "summary": "...",
                "page_count": 10,
                "category": "handbook",
                "department": "HR"
            }
        """
        doc_id = str(uuid.uuid4())

        # Extract text
        extracted_text = self.extract_text_from_pdf(pdf_bytes)

        # Generate summary
        summary = ""
        if extracted_text:
            summary = await self.summarize_document(extracted_text, filename)

        # Count pages
        page_count = 0
        if HAS_PYPDF2:
            try:
                pdf_reader = PyPDF2.PdfReader(io.BytesIO(pdf_bytes))
                page_count = len(pdf_reader.pages)
            except:
                pass

        return {
            "id": doc_id,
            "name": filename,
            "file_size": len(pdf_bytes),
            "file_type": "pdf",
            "extracted_text": extracted_text,
            "summary": summary,
            "page_count": page_count,
            "category": category,
            "department": department,
            "processed_at": datetime.utcnow().isoformat()
        }


# Global instance
pdf_processor = PDFProcessor()
