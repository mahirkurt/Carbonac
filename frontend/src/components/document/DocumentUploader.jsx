/**
 * DocumentUploader - File upload component
 * Supports PDF, Word, Google Docs, and plain text files
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  Tile,
  Button,
  InlineLoading,
  ProgressBar,
  Tag,
  InlineNotification,
  FileUploader,
  FileUploaderDropContainer,
  FileUploaderItem,
  StructuredListWrapper,
  StructuredListHead,
  StructuredListRow,
  StructuredListCell,
  StructuredListBody,
} from '@carbon/react';

import {
  Upload,
  DocumentPdf,
  Document,
  Code,
  CloudUpload,
  Checkmark,
  WarningAlt,
  TrashCan,
  ArrowRight,
  Link as LinkIcon,
} from '@carbon/icons-react';

import { useDocument, SUPPORTED_FILE_TYPES, WORKFLOW_STEPS } from '../../contexts/DocumentContext';
import './DocumentUploader.scss';

// File size formatter
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Get icon for file type
const getFileIcon = (type) => {
  if (type.includes('pdf')) return <DocumentPdf size={24} />;
  if (type.includes('markdown') || type.includes('md')) return <Code size={24} />;
  return <Document size={24} />;
};

// Accepted file types for input
const ACCEPTED_TYPES = Object.keys(SUPPORTED_FILE_TYPES).join(',') + ',.md,.txt,.pdf,.docx,.doc,.odt,.rtf';

function DocumentUploader() {
  const {
    isConverting,
    conversionProgress,
    conversionError,
    fileName,
    fileType,
    fileSize,
    setFile,
    convertDocument,
    clearConversionError,
    setStep,
    markdownContent,
  } = useDocument();

  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [urlLoading, setUrlLoading] = useState(false);
  const fileInputRef = useRef(null);

  // Handle file selection
  const handleFileSelect = useCallback((files) => {
    const file = files[0];
    if (!file) return;

    // Validate file type
    const isSupported = Object.keys(SUPPORTED_FILE_TYPES).includes(file.type) ||
      file.name.endsWith('.md') ||
      file.name.endsWith('.txt') ||
      file.name.endsWith('.pdf') ||
      file.name.endsWith('.docx') ||
      file.name.endsWith('.doc');

    if (!isSupported) {
      setUploadedFiles([{
        file,
        status: 'error',
        error: 'Desteklenmeyen dosya formatı',
      }]);
      return;
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setUploadedFiles([{
        file,
        status: 'error',
        error: 'Dosya boyutu 50MB\'dan büyük olamaz',
      }]);
      return;
    }

    setUploadedFiles([{
      file,
      status: 'uploading',
      progress: 0,
    }]);

    // Set file in context
    setFile(file);

    // Simulate upload progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      if (progress >= 100) {
        clearInterval(interval);
        setUploadedFiles([{
          file,
          status: 'complete',
          progress: 100,
        }]);
      } else {
        setUploadedFiles([{
          file,
          status: 'uploading',
          progress,
        }]);
      }
    }, 200);
  }, [setFile]);

  // Handle drag events
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  // Handle drop
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files);
    }
  }, [handleFileSelect]);

  // Handle file input change
  const handleInputChange = useCallback((e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files);
    }
  }, [handleFileSelect]);

  // Handle URL import (Google Docs)
  const handleUrlImport = useCallback(async () => {
    if (!urlInput.trim()) return;

    // Check if it's a Google Docs URL
    const isGoogleDocs = urlInput.includes('docs.google.com');
    
    if (!isGoogleDocs) {
      setUploadedFiles([{
        file: { name: 'URL Import', type: 'url' },
        status: 'error',
        error: 'Sadece Google Docs URL\'leri desteklenmektedir',
      }]);
      return;
    }

    setUrlLoading(true);

    try {
      const response = await fetch('/api/import/google-docs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: urlInput }),
      });

      if (!response.ok) {
        throw new Error('Google Docs import failed');
      }

      const data = await response.json();
      
      // Create a virtual file
      const virtualFile = new File([data.content], data.title + '.md', {
        type: 'text/markdown',
      });

      handleFileSelect([virtualFile]);
    } catch (error) {
      setUploadedFiles([{
        file: { name: 'Google Docs Import', type: 'url' },
        status: 'error',
        error: error.message,
      }]);
    } finally {
      setUrlLoading(false);
      setUrlInput('');
    }
  }, [urlInput, handleFileSelect]);

  // Remove uploaded file
  const handleRemoveFile = useCallback(() => {
    setUploadedFiles([]);
  }, []);

  // Start conversion
  const handleStartConversion = useCallback(() => {
    const uploadedFile = uploadedFiles[0];
    if (uploadedFile && uploadedFile.status === 'complete') {
      convertDocument(uploadedFile.file);
    }
  }, [uploadedFiles, convertDocument]);

  // Continue to wizard
  const handleContinue = useCallback(() => {
    setStep(WORKFLOW_STEPS.WIZARD);
  }, [setStep]);

  return (
    <div className="document-uploader">
      {/* Header */}
      <div className="document-uploader__header">
        <h2>Doküman Yükle</h2>
        <p>PDF, Word, Google Docs veya düz metin dosyanızı yükleyin</p>
      </div>

      {/* Upload Area */}
      {!isConverting && uploadedFiles.length === 0 && (
        <div
          className={`document-uploader__drop-zone ${dragActive ? 'document-uploader__drop-zone--active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <CloudUpload size={64} className="document-uploader__drop-icon" />
          <h3>Dosyanızı buraya sürükleyin</h3>
          <p>veya</p>
          <Button
            kind="primary"
            renderIcon={Upload}
            onClick={() => fileInputRef.current?.click()}
          >
            Dosya Seç
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES}
            onChange={handleInputChange}
            style={{ display: 'none' }}
          />

          <div className="document-uploader__supported-types">
            <span>Desteklenen formatlar:</span>
            <div className="document-uploader__type-tags">
              <Tag type="blue" size="sm">PDF</Tag>
              <Tag type="purple" size="sm">Word (.docx)</Tag>
              <Tag type="cyan" size="sm">Google Docs</Tag>
              <Tag type="teal" size="sm">Markdown</Tag>
              <Tag type="gray" size="sm">Text</Tag>
              <Tag type="green" size="sm">RTF</Tag>
            </div>
          </div>
        </div>
      )}

      {/* Google Docs URL Import */}
      {!isConverting && uploadedFiles.length === 0 && (
        <div className="document-uploader__url-import">
          <div className="document-uploader__url-divider">
            <span>veya URL ile içe aktar</span>
          </div>
          <div className="document-uploader__url-input-wrapper">
            <LinkIcon size={20} />
            <input
              type="url"
              placeholder="Google Docs URL yapıştırın..."
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="document-uploader__url-input"
            />
            <Button
              kind="tertiary"
              size="sm"
              onClick={handleUrlImport}
              disabled={!urlInput.trim() || urlLoading}
            >
              {urlLoading ? 'Yükleniyor...' : 'İçe Aktar'}
            </Button>
          </div>
        </div>
      )}

      {/* Uploaded File Card */}
      {uploadedFiles.length > 0 && !isConverting && (
        <Tile className="document-uploader__file-card">
          <div className="document-uploader__file-info">
            <div className="document-uploader__file-icon">
              {getFileIcon(uploadedFiles[0].file.type)}
            </div>
            <div className="document-uploader__file-details">
              <h4>{uploadedFiles[0].file.name}</h4>
              <span>{formatFileSize(uploadedFiles[0].file.size)}</span>
            </div>
            <div className="document-uploader__file-status">
              {uploadedFiles[0].status === 'uploading' && (
                <InlineLoading description="Yükleniyor..." />
              )}
              {uploadedFiles[0].status === 'complete' && (
                <Tag type="green" renderIcon={Checkmark}>Hazır</Tag>
              )}
              {uploadedFiles[0].status === 'error' && (
                <Tag type="red" renderIcon={WarningAlt}>Hata</Tag>
              )}
            </div>
            <Button
              kind="ghost"
              size="sm"
              hasIconOnly
              renderIcon={TrashCan}
              iconDescription="Kaldır"
              onClick={handleRemoveFile}
            />
          </div>

          {uploadedFiles[0].status === 'uploading' && (
            <ProgressBar
              value={uploadedFiles[0].progress}
              max={100}
              label="Yükleme ilerlemesi"
              hideLabel
            />
          )}

          {uploadedFiles[0].status === 'error' && (
            <InlineNotification
              kind="error"
              title="Hata"
              subtitle={uploadedFiles[0].error}
              hideCloseButton
              lowContrast
            />
          )}

          {uploadedFiles[0].status === 'complete' && (
            <div className="document-uploader__actions">
              <Button
                kind="primary"
                renderIcon={ArrowRight}
                onClick={handleStartConversion}
              >
                Markdown'a Dönüştür
              </Button>
            </div>
          )}
        </Tile>
      )}

      {/* Conversion Progress */}
      {isConverting && (
        <Tile className="document-uploader__conversion">
          <InlineLoading
            description="Doküman Markdown'a dönüştürülüyor..."
            status="active"
          />
          <ProgressBar
            value={conversionProgress}
            max={100}
            label="Dönüştürme ilerlemesi"
            helperText={`%${conversionProgress} tamamlandı`}
          />
          <div className="document-uploader__conversion-steps">
            <div className={`conversion-step ${conversionProgress >= 20 ? 'conversion-step--complete' : ''}`}>
              <Checkmark size={16} />
              <span>Dosya okunuyor</span>
            </div>
            <div className={`conversion-step ${conversionProgress >= 50 ? 'conversion-step--complete' : ''}`}>
              <Checkmark size={16} />
              <span>İçerik analiz ediliyor</span>
            </div>
            <div className={`conversion-step ${conversionProgress >= 80 ? 'conversion-step--complete' : ''}`}>
              <Checkmark size={16} />
              <span>Markdown oluşturuluyor</span>
            </div>
            <div className={`conversion-step ${conversionProgress >= 100 ? 'conversion-step--complete' : ''}`}>
              <Checkmark size={16} />
              <span>Tamamlandı</span>
            </div>
          </div>
        </Tile>
      )}

      {/* Conversion Error */}
      {conversionError && (
        <InlineNotification
          kind="error"
          title="Dönüştürme Hatası"
          subtitle={conversionError}
          onCloseButtonClick={clearConversionError}
        />
      )}

      {/* Conversion Success */}
      {markdownContent && !isConverting && (
        <Tile className="document-uploader__success">
          <div className="document-uploader__success-icon">
            <Checkmark size={32} />
          </div>
          <h3>Dönüştürme Başarılı!</h3>
          <p>Dokümanınız Markdown formatına dönüştürüldü. Şimdi rapor özelliklerini belirleyebilirsiniz.</p>
          <div className="document-uploader__success-stats">
            <div className="stat-item">
              <span className="stat-label">Karakter</span>
              <span className="stat-value">{markdownContent.length.toLocaleString()}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Kelime</span>
              <span className="stat-value">{markdownContent.split(/\s+/).length.toLocaleString()}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Satır</span>
              <span className="stat-value">{markdownContent.split('\n').length.toLocaleString()}</span>
            </div>
          </div>
          <Button
            kind="primary"
            size="lg"
            renderIcon={ArrowRight}
            onClick={handleContinue}
          >
            Rapor Sihirbazına Devam Et
          </Button>
        </Tile>
      )}
    </div>
  );
}

export default DocumentUploader;
