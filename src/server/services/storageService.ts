import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { config } from '../config/index.js';

export interface StoredFileMetadata {
  storageKey: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  fileHash: string;
  absolutePath: string;
}

export class StorageService {
  private baseDir: string;

  constructor(baseDir: string = config.storageDir) {
    this.baseDir = path.resolve(baseDir);
    this.ensureDirectoryExists(this.baseDir);
  }

  private ensureDirectoryExists(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Validates MIME type and extension. Allowed: image/jpeg, image/png, image/webp, application/pdf
   */
  public isValidReceiptMime(mimeType: string): boolean {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'image/jpg'];
    return allowed.includes(mimeType.toLowerCase());
  }

  /**
   * Computes SHA-256 hash of a buffer.
   */
  public computeHash(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Generates a safe, non-guessable storage key that avoids path traversal.
   */
  public generateStorageKey(originalFilename: string): string {
    const safeExt = path.extname(originalFilename).toLowerCase().replace(/[^a-z0-9.]/g, '') || '.bin';
    const uniqueId = crypto.randomUUID();
    const datePrefix = new Date().toISOString().slice(0, 7); // YYYY-MM
    return `${datePrefix}/${uniqueId}${safeExt}`;
  }

  /**
   * Saves a file buffer to persistent storage and computes its SHA-256 hash.
   */
  public async saveFile(buffer: Buffer, originalFilename: string, mimeType: string): Promise<StoredFileMetadata> {
    const fileHash = this.computeHash(buffer);
    const storageKey = this.generateStorageKey(originalFilename);
    const targetPath = path.resolve(this.baseDir, storageKey);

    // Ensure parent subfolder exists
    this.ensureDirectoryExists(path.dirname(targetPath));

    // Write file securely
    await fs.promises.writeFile(targetPath, buffer);

    return {
      storageKey,
      originalFilename: path.basename(originalFilename),
      mimeType,
      fileSize: buffer.length,
      fileHash,
      absolutePath: targetPath,
    };
  }

  /**
   * Resolves a storage key to an absolute path, preventing path traversal outside baseDir.
   */
  public getAbsolutePath(storageKey: string): string {
    const resolvedPath = path.resolve(this.baseDir, storageKey);
    if (!resolvedPath.startsWith(this.baseDir)) {
      throw new Error('Access denied: Path traversal attempt detected');
    }
    return resolvedPath;
  }

  /**
   * Reads file as buffer.
   */
  public async getFileBuffer(storageKey: string): Promise<Buffer> {
    const filePath = this.getAbsolutePath(storageKey);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Receipt file not found: ${storageKey}`);
    }
    return fs.promises.readFile(filePath);
  }

  /**
   * Checks if file exists on disk.
   */
  public fileExists(storageKey: string): boolean {
    try {
      const filePath = this.getAbsolutePath(storageKey);
      return fs.existsSync(filePath);
    } catch {
      return false;
    }
  }

  /**
   * Deletes a file if it exists.
   */
  public async deleteFile(storageKey: string): Promise<boolean> {
    try {
      const filePath = this.getAbsolutePath(storageKey);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}

export const storageService = new StorageService();
