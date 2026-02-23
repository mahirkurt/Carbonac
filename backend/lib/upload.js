/**
 * File upload configuration (multer) + magic byte validation
 */

import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import dns from 'dns/promises';
import { randomUUID } from 'crypto';
import { isPrivateIp } from './helpers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../temp/uploads');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
      'text/markdown',
      'application/rtf',
      'application/vnd.oasis.opendocument.text',
    ];

    if (
      allowedTypes.includes(file.mimetype) ||
      file.originalname.endsWith('.md') ||
      file.originalname.endsWith('.txt')
    ) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type'), false);
    }
  },
});

// Magic byte signatures for server-side file type validation
const MAGIC_BYTES = {
  pdf: { bytes: [0x25, 0x50, 0x44, 0x46], offset: 0 },       // %PDF
  docx: { bytes: [0x50, 0x4B, 0x03, 0x04], offset: 0 },      // PK (ZIP)
  doc: { bytes: [0xD0, 0xCF, 0x11, 0xE0], offset: 0 },       // OLE2
  rtf: { bytes: [0x7B, 0x5C, 0x72, 0x74, 0x66], offset: 0 }, // {\rtf
  odt: { bytes: [0x50, 0x4B, 0x03, 0x04], offset: 0 },       // PK (ZIP)
};

export async function validateFileMagicBytes(filePath, ext) {
  const normalizedExt = ext.replace(/^\./, '').toLowerCase();
  // Text files don't need magic byte validation
  if (['md', 'txt'].includes(normalizedExt)) return true;
  const sig = MAGIC_BYTES[normalizedExt];
  if (!sig) return true; // unknown extensions pass through
  const fd = await fs.open(filePath, 'r');
  try {
    const buf = Buffer.alloc(sig.bytes.length);
    await fd.read(buf, 0, sig.bytes.length, sig.offset);
    return sig.bytes.every((b, i) => buf[i] === b);
  } finally {
    await fd.close();
  }
}

export async function downloadRemoteFile(fileUrl, fileType) {
  const parsed = new URL(fileUrl);
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Only HTTP(S) URLs are allowed.');
  }
  // DNS resolution check to prevent SSRF via DNS rebinding
  const { address } = await dns.lookup(parsed.hostname);
  if (isPrivateIp(address)) {
    throw new Error('URLs resolving to private/internal addresses are not allowed.');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  let response;
  try {
    response = await fetch(fileUrl, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
  if (!response.ok) {
    throw new Error('Failed to download remote file.');
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const urlPath = new URL(fileUrl).pathname;
  const urlName = path.basename(urlPath);
  const ext = fileType ? `.${fileType}` : path.extname(urlName);
  const safeExt = ext || '.bin';

  const uploadDir = path.join(__dirname, '../../temp/uploads');
  await fs.mkdir(uploadDir, { recursive: true });

  const filename = `${randomUUID()}${safeExt}`;
  const filePath = path.join(uploadDir, filename);
  await fs.writeFile(filePath, buffer);

  return {
    path: filePath,
    originalName: urlName || filename,
  };
}
