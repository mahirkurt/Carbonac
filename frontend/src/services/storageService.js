/**
 * Storage Service
 * Handles file upload, download, and management operations
 */

import { storage, supabase } from '../lib/supabase';

// Storage bucket configurations
const BUCKETS = {
  documents: {
    name: 'documents',
    maxSize: 50 * 1024 * 1024, // 50MB
    allowedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown',
      'application/rtf',
      'application/vnd.oasis.opendocument.text',
    ],
  },
  pdfs: {
    name: 'pdfs',
    maxSize: 100 * 1024 * 1024, // 100MB
    allowedTypes: ['application/pdf'],
  },
  avatars: {
    name: 'avatars',
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  },
};

/**
 * Storage service class
 */
class StorageService {
  /**
   * Upload a document file
   * @param {File} file - The file to upload
   * @param {string} userId - User ID
   * @param {object} options - Upload options
   */
  async uploadDocument(file, userId, options = {}) {
    return this.uploadFile(file, userId, 'documents', options);
  }

  /**
   * Upload a PDF file
   * @param {File} file - The file to upload
   * @param {string} userId - User ID
   * @param {object} options - Upload options
   */
  async uploadPdf(file, userId, options = {}) {
    return this.uploadFile(file, userId, 'pdfs', options);
  }

  /**
   * Upload an avatar image
   * @param {File} file - The file to upload
   * @param {string} userId - User ID
   */
  async uploadAvatar(file, userId) {
    try {
      const validation = this.validateFile(file, 'avatars');
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Create a consistent path for avatars
      const ext = file.name.split('.').pop();
      const path = `${userId}/avatar.${ext}`;

      // Upload (upsert for avatars)
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(path);

      return {
        success: true,
        path: data.path,
        publicUrl,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Avatar yüklenirken bir hata oluştu.',
      };
    }
  }

  /**
   * Generic file upload
   * @param {File} file - The file to upload
   * @param {string} userId - User ID
   * @param {string} bucket - Bucket name
   * @param {object} options - Upload options
   */
  async uploadFile(file, userId, bucket, options = {}) {
    try {
      // Validate file
      const validation = this.validateFile(file, bucket);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Generate unique path
      const timestamp = Date.now();
      const ext = file.name.split('.').pop();
      const safeName = this.sanitizeFilename(file.name);
      const path = options.path || `${userId}/${timestamp}-${safeName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: options.upsert || false,
        });

      if (error) throw error;

      return {
        success: true,
        path: data.path,
        fullPath: `${bucket}/${data.path}`,
        size: file.size,
        type: file.type,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Dosya yüklenirken bir hata oluştu.',
      };
    }
  }

  /**
   * Get a signed URL for downloading a file
   * @param {string} bucket - Bucket name
   * @param {string} path - File path
   * @param {number} expiresIn - Expiry time in seconds (default: 1 hour)
   */
  async getSignedUrl(bucket, path, expiresIn = 3600) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn);

      if (error) throw error;

      return {
        success: true,
        url: data.signedUrl,
        expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'İndirme linki oluşturulamadı.',
      };
    }
  }

  /**
   * Get public URL (only for public buckets)
   * @param {string} bucket - Bucket name
   * @param {string} path - File path
   */
  getPublicUrl(bucket, path) {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  /**
   * Download a file as blob
   * @param {string} bucket - Bucket name
   * @param {string} path - File path
   */
  async downloadFile(bucket, path) {
    try {
      const { data, error } = await supabase.storage.from(bucket).download(path);

      if (error) throw error;

      return {
        success: true,
        blob: data,
        type: data.type,
        size: data.size,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Dosya indirilirken bir hata oluştu.',
      };
    }
  }

  /**
   * Download and save file to user's device
   * @param {string} bucket - Bucket name
   * @param {string} path - File path
   * @param {string} filename - Downloaded filename
   */
  async downloadAndSave(bucket, path, filename) {
    try {
      const { blob, error } = await this.downloadFile(bucket, path);
      if (error) throw new Error(error);

      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Dosya kaydedilirken bir hata oluştu.',
      };
    }
  }

  /**
   * Delete a file
   * @param {string} bucket - Bucket name
   * @param {string} path - File path
   */
  async deleteFile(bucket, path) {
    try {
      const { error } = await supabase.storage.from(bucket).remove([path]);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Dosya silinirken bir hata oluştu.',
      };
    }
  }

  /**
   * Delete multiple files
   * @param {string} bucket - Bucket name
   * @param {string[]} paths - Array of file paths
   */
  async deleteFiles(bucket, paths) {
    try {
      const { error } = await supabase.storage.from(bucket).remove(paths);

      if (error) throw error;

      return { success: true, deletedCount: paths.length };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Dosyalar silinirken bir hata oluştu.',
      };
    }
  }

  /**
   * List files in a folder
   * @param {string} bucket - Bucket name
   * @param {string} folder - Folder path
   * @param {object} options - List options
   */
  async listFiles(bucket, folder = '', options = {}) {
    try {
      const { data, error } = await supabase.storage.from(bucket).list(folder, {
        limit: options.limit || 100,
        offset: options.offset || 0,
        sortBy: { column: options.sortBy || 'created_at', order: options.order || 'desc' },
      });

      if (error) throw error;

      return {
        success: true,
        files: data,
        count: data.length,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Dosyalar listelenirken bir hata oluştu.',
        files: [],
      };
    }
  }

  /**
   * Move/rename a file
   * @param {string} bucket - Bucket name
   * @param {string} fromPath - Source path
   * @param {string} toPath - Destination path
   */
  async moveFile(bucket, fromPath, toPath) {
    try {
      const { error } = await supabase.storage.from(bucket).move(fromPath, toPath);

      if (error) throw error;

      return { success: true, newPath: toPath };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Dosya taşınırken bir hata oluştu.',
      };
    }
  }

  /**
   * Copy a file
   * @param {string} bucket - Bucket name
   * @param {string} fromPath - Source path
   * @param {string} toPath - Destination path
   */
  async copyFile(bucket, fromPath, toPath) {
    try {
      const { error } = await supabase.storage.from(bucket).copy(fromPath, toPath);

      if (error) throw error;

      return { success: true, newPath: toPath };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Dosya kopyalanırken bir hata oluştu.',
      };
    }
  }

  /**
   * Get file info
   * @param {string} bucket - Bucket name
   * @param {string} path - File path
   */
  async getFileInfo(bucket, path) {
    try {
      // List the specific file to get its metadata
      const folder = path.substring(0, path.lastIndexOf('/'));
      const filename = path.substring(path.lastIndexOf('/') + 1);

      const { data, error } = await supabase.storage.from(bucket).list(folder, {
        search: filename,
      });

      if (error) throw error;

      const file = data.find((f) => f.name === filename);
      if (!file) {
        throw new Error('Dosya bulunamadı.');
      }

      return {
        success: true,
        file: {
          ...file,
          fullPath: `${bucket}/${path}`,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Dosya bilgisi alınamadı.',
      };
    }
  }

  // ========== Helper Methods ==========

  /**
   * Validate file before upload
   * @param {File} file - The file to validate
   * @param {string} bucket - Bucket name
   */
  validateFile(file, bucket) {
    const config = BUCKETS[bucket];
    if (!config) {
      return { valid: false, error: 'Geçersiz depolama alanı.' };
    }

    if (!file) {
      return { valid: false, error: 'Dosya seçilmedi.' };
    }

    if (file.size > config.maxSize) {
      const maxMB = Math.round(config.maxSize / (1024 * 1024));
      return { valid: false, error: `Dosya boyutu ${maxMB}MB'dan büyük olamaz.` };
    }

    if (!config.allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Desteklenmeyen dosya türü.' };
    }

    return { valid: true };
  }

  /**
   * Sanitize filename for safe storage
   * @param {string} filename - Original filename
   */
  sanitizeFilename(filename) {
    return filename
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscore
      .replace(/_+/g, '_') // Collapse multiple underscores
      .toLowerCase();
  }

  /**
   * Get file extension
   * @param {string} filename - Filename
   */
  getExtension(filename) {
    return filename.split('.').pop()?.toLowerCase() || '';
  }

  /**
   * Format file size for display
   * @param {number} bytes - File size in bytes
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get icon for file type
   * @param {string} mimeType - File MIME type
   */
  getFileIcon(mimeType) {
    const iconMap = {
      'application/pdf': 'document--pdf',
      'application/msword': 'document--word',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'document--word',
      'text/plain': 'document--blank',
      'text/markdown': 'document--blank',
      'image/jpeg': 'image',
      'image/png': 'image',
      'image/gif': 'image',
    };
    return iconMap[mimeType] || 'document';
  }
}

export const storageService = new StorageService();
export default storageService;
