/**
 * Document Service
 * Handles document operations: upload, convert, manage
 */

import { db, storage, supabase } from '../lib/supabase';
import { buildApiUrl } from '../utils/apiBase';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || '';
}

async function pollJobStatus(jobId, options = {}) {
  const maxAttempts = options.maxAttempts || 60;
  let intervalMs = options.intervalMs || 1000;
  const token = options.token || '';

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const response = await fetch(buildApiUrl(`/api/jobs/${jobId}`), {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });

    if (!response.ok) {
      throw new Error('Job status request failed.');
    }

    const payload = await response.json();
    if (payload.status === 'completed') {
      return payload;
    }
    if (payload.status === 'failed' || payload.status === 'cancelled') {
      throw new Error(payload.error?.message || 'Job failed.');
    }

    await sleep(intervalMs);
    intervalMs = Math.min(Math.floor(intervalMs * 1.5), 5000);
  }

  throw new Error('Job polling timed out.');
}

// Supported file types
const SUPPORTED_TYPES = {
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'text/plain': 'txt',
  'text/markdown': 'md',
  'application/rtf': 'rtf',
  'application/vnd.oasis.opendocument.text': 'odt',
};

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * Document service class
 */
class DocumentService {
  /**
   * Upload and create a new document
   * @param {File} file - The file to upload
   * @param {string} userId - Current user ID
   * @param {object} options - Additional options
   */
  async uploadDocument(file, userId, options = {}) {
    try {
      // Validate file
      const validation = this.validateFile(file);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Upload to storage
      const { path, error: uploadError } = await storage.uploadDocument(userId, file);
      if (uploadError) throw uploadError;

      // Create document record
      const documentData = {
        user_id: userId,
        title: options.title || this.extractTitle(file.name),
        description: options.description || null,
        original_filename: file.name,
        original_file_type: SUPPORTED_TYPES[file.type] || 'unknown',
        original_file_path: path,
        original_file_size: file.size,
        status: 'draft',
      };

      const { document, error: dbError } = await db.createDocument(documentData);
      if (dbError) throw dbError;

      return {
        success: true,
        document,
        message: 'Doküman başarıyla yüklendi.',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Doküman yüklenirken bir hata oluştu.',
      };
    }
  }

  /**
   * Convert document to markdown
   * @param {string} documentId - Document ID
   * @param {string} userId - User ID
   */
  async convertToMarkdown(documentId, userId) {
    try {
      // Update status to processing
      await db.updateDocument(documentId, { status: 'processing' });

      // Get document
      const { document, error: docError } = await db.getDocument(documentId);
      if (docError) throw docError;

      // Get signed URL for the file
      const { url, error: urlError } = await storage.getSignedUrl(
        'documents',
        document.original_file_path
      );
      if (urlError) throw urlError;

      const token = await getAccessToken();

      const response = await fetch(buildApiUrl('/api/convert/to-markdown'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          documentId,
          fileUrl: url,
          fileType: document.original_file_type,
        }),
      });

      if (!response.ok) {
        const errorPayload = await response.json();
        const message = errorPayload?.error?.message || errorPayload?.message;
        throw new Error(message || 'Markdown conversion failed.');
      }
      const result = await response.json();

      // Update document with markdown content
      await db.updateDocument(documentId, {
        markdown_content: result.markdown,
        word_count: result.wordCount || 0,
        character_count: result.characterCount || 0,
        status: 'ready',
      });

      return {
        success: true,
        markdown: result.markdown,
        stats: {
          wordCount: result.wordCount,
          characterCount: result.characterCount,
        },
      };
    } catch (error) {
      // Update status to error
      await db.updateDocument(documentId, {
        status: 'error',
        error_message: error.message,
      });

      return {
        success: false,
        error: error.message || 'Markdown dönüştürme hatası.',
      };
    }
  }

  /**
   * Convert markdown to PDF
   * @param {string} documentId - Document ID
   * @param {object} settings - Conversion settings
   */
  async convertToPdf(documentId, settings = {}) {
    try {
      // Get document
      const { document, error: docError } = await db.getDocument(documentId);
      if (docError) throw docError;

      if (!document.markdown_content) {
        throw new Error('Markdown içerik bulunamadı.');
      }

      const layoutProfile = settings.layoutProfile || 'symmetric';
      const printProfile = settings.printProfile || 'pagedjs-a4';
      const theme = settings.theme || 'white';
      const template = settings.template || 'carbon-advanced';

      // Create conversion record
      const { conversion, error: convError } = await db.createConversion({
        document_id: documentId,
        user_id: document.user_id,
        engine: 'pagedjs',
        template,
        theme,
        layout_profile: layoutProfile,
        print_profile: printProfile,
        settings: {
          ...settings,
          layoutProfile,
          printProfile,
          theme,
          template,
        },
        status: 'processing',
      });
      if (convError) throw convError;

      const token = await getAccessToken();

      const response = await fetch(buildApiUrl('/api/convert/to-pdf'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          documentId,
          markdown: document.markdown_content,
          settings: {
            layoutProfile,
            printProfile,
            theme,
            template,
            title: document.title,
            ...settings,
          },
        }),
      });

      if (!response.ok) {
        const errorPayload = await response.json();
        const message = errorPayload?.error?.message || errorPayload?.message;
        throw new Error(message || 'PDF conversion failed.');
      }
      const jobPayload = await response.json();
      const jobId = jobPayload.jobId;
      if (!jobId) {
        throw new Error('Job id missing in response.');
      }

      const jobStatus = await pollJobStatus(jobId, { token });
      const result = jobStatus.result || {};

      // Update conversion record
      await db.updateConversion(conversion.id, {
        status: 'completed',
        output_file_path: result.outputPath || result.pdfPath || null,
        output_file_size: result.fileSize,
        output_page_count: result.pageCount,
        processing_time_ms: result.processingTime,
        completed_at: new Date().toISOString(),
      });

      // Update document
      await db.updateDocument(documentId, {
        last_converted_at: new Date().toISOString(),
        page_count: result.pageCount,
      });

      return {
        success: true,
        pdfPath: result.outputPath || result.pdfPath,
        downloadUrl: result.signedUrl || result.downloadUrl,
        jobId,
        pageCount: result.pageCount,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'PDF dönüştürme hatası.',
      };
    }
  }

  /**
   * Get user's documents
   */
  async getDocuments(userId, options = {}) {
    try {
      const { documents, error } = await db.getDocuments(userId, options);
      if (error) throw error;
      return { success: true, documents };
    } catch (error) {
      return { success: false, error: error.message, documents: [] };
    }
  }

  /**
   * Get single document
   */
  async getDocument(documentId) {
    try {
      const { document, error } = await db.getDocument(documentId);
      if (error) throw error;
      return { success: true, document };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Update document
   */
  async updateDocument(documentId, updates) {
    try {
      const { document, error } = await db.updateDocument(documentId, updates);
      if (error) throw error;
      return { success: true, document };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete document and associated files
   */
  async deleteDocument(documentId, userId) {
    try {
      // Get document to find file paths
      const { document, error: docError } = await db.getDocument(documentId);
      if (docError) throw docError;

      // Delete files from storage
      if (document.original_file_path) {
        await storage.deleteFile('documents', document.original_file_path);
      }
      if (document.markdown_file_path) {
        await storage.deleteFile('documents', document.markdown_file_path);
      }

      // Delete associated PDFs
      const { conversions } = await db.getConversions(documentId);
      for (const conv of conversions || []) {
        if (conv.output_file_path) {
          await storage.deleteFile('pdfs', conv.output_file_path);
        }
      }

      // Delete document record (cascades to conversions)
      const { error: deleteError } = await db.deleteDocument(documentId);
      if (deleteError) throw deleteError;

      return {
        success: true,
        message: 'Doküman başarıyla silindi.',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Doküman silinirken bir hata oluştu.',
      };
    }
  }

  /**
   * Get download URL for a document
   */
  async getDownloadUrl(bucket, path) {
    try {
      const { url, error } = await storage.getSignedUrl(bucket, path);
      if (error) throw error;
      return { success: true, url };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Update markdown content
   */
  async updateMarkdown(documentId, markdownContent) {
    try {
      const wordCount = this.countWords(markdownContent);
      const characterCount = markdownContent.length;

      const { document, error } = await db.updateDocument(documentId, {
        markdown_content: markdownContent,
        word_count: wordCount,
        character_count: characterCount,
      });

      if (error) throw error;

      return {
        success: true,
        document,
        stats: { wordCount, characterCount },
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Save wizard answers
   */
  async saveWizardAnswers(documentId, answers) {
    try {
      const { document, error } = await db.updateDocument(documentId, {
        wizard_answers: answers,
      });
      if (error) throw error;
      return { success: true, document };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get conversion history
   */
  async getConversionHistory(documentId) {
    try {
      const { conversions, error } = await db.getConversions(documentId);
      if (error) throw error;
      return { success: true, conversions };
    } catch (error) {
      return { success: false, error: error.message, conversions: [] };
    }
  }

  // ========== Helper Methods ==========

  /**
   * Validate file before upload
   */
  validateFile(file) {
    if (!file) {
      return { valid: false, error: 'Dosya seçilmedi.' };
    }

    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, error: 'Dosya boyutu 50MB\'dan büyük olamaz.' };
    }

    if (!SUPPORTED_TYPES[file.type]) {
      return {
        valid: false,
        error: 'Desteklenmeyen dosya türü. PDF, Word, Markdown veya metin dosyası yükleyin.',
      };
    }

    return { valid: true };
  }

  /**
   * Extract title from filename
   */
  extractTitle(filename) {
    return filename
      .replace(/\.[^/.]+$/, '') // Remove extension
      .replace(/[-_]/g, ' ') // Replace dashes/underscores with spaces
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
  }

  /**
   * Count words in text
   */
  countWords(text) {
    if (!text) return 0;
    return text
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(Boolean).length;
  }
}

export const documentService = new DocumentService();
export default documentService;
