import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Read file content
 * @param {string} filePath - Path to file
 * @returns {Promise<string>} File content
 */
export async function readFile(filePath) {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to read file ${filePath}: ${error.message}`);
  }
}

/**
 * Write file content
 * @param {string} filePath - Path to file
 * @param {string} content - Content to write
 */
export async function writeFile(filePath, content) {
  try {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, content, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to write file ${filePath}: ${error.message}`);
  }
}

/**
 * Check if file exists
 * @param {string} filePath - Path to file
 * @returns {Promise<boolean>} True if file exists
 */
export async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get project root directory
 * @returns {string} Project root path
 */
export function getProjectRoot() {
  return path.resolve(__dirname, '../..');
}

/**
 * Get template path
 * @param {string} engine - Engine name (typst, quarto)
 * @param {string} templateName - Template file name
 * @returns {string} Template path
 */
export function getTemplatePath(engine, templateName) {
  return path.join(getProjectRoot(), 'templates', engine, templateName);
}

/**
 * Get output path
 * @param {string} inputPath - Input file path
 * @param {string} engine - Engine name
 * @returns {string} Output path
 */
export function getOutputPath(inputPath, engine) {
  const projectRoot = getProjectRoot();
  const outputDir = path.join(projectRoot, 'output');
  const baseName = path.basename(inputPath, path.extname(inputPath));
  return path.join(outputDir, `${baseName}-${engine}.pdf`);
}

/**
 * Ensure directory exists
 * @param {string} dirPath - Directory path
 */
export async function ensureDir(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    throw new Error(`Failed to create directory ${dirPath}: ${error.message}`);
  }
}

export default {
  readFile,
  writeFile,
  fileExists,
  getProjectRoot,
  getTemplatePath,
  getOutputPath,
  ensureDir
};
