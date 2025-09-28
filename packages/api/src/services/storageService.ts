import AWS from 'aws-sdk';
import multer from 'multer';
import { randomUUID } from 'crypto';

interface StorageService {
  uploadFile(file: Express.Multer.File, folder?: string): Promise<string>;
  deleteFile(url: string): Promise<boolean>;
}

class MockStorageService implements StorageService {
  async uploadFile(file: Express.Multer.File, folder = 'uploads'): Promise<string> {
    const filename = `${randomUUID()}-${file.originalname}`;
    const mockUrl = `https://mock-storage.com/${folder}/${filename}`;
    console.log(`📁 Mock file uploaded: ${mockUrl}`);
    return mockUrl;
  }

  async deleteFile(url: string): Promise<boolean> {
    console.log(`🗑️ Mock file deleted: ${url}`);
    return true;
  }
}

class S3StorageService implements StorageService {
  private s3: AWS.S3;
  private bucket: string;

  constructor() {
    this.s3 = new AWS.S3({
      endpoint: process.env.S3_ENDPOINT,
      accessKeyId: process.env.S3_ACCESS_KEY,
      secretAccessKey: process.env.S3_SECRET_KEY,
      region: process.env.S3_REGION || 'us-east-1',
      s3ForcePathStyle: true,
    });
    this.bucket = process.env.S3_BUCKET || 'agri-connect';
  }

  async uploadFile(file: Express.Multer.File, folder = 'uploads'): Promise<string> {
    try {
      const key = `${folder}/${randomUUID()}-${file.originalname}`;
      
      const params = {
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read',
      };

      const result = await this.s3.upload(params).promise();
      return result.Location;
    } catch (error) {
      console.error('Failed to upload file to S3:', error);
      throw new Error('File upload failed');
    }
  }

  async deleteFile(url: string): Promise<boolean> {
    try {
      const key = url.split('/').slice(-2).join('/'); // Extract key from URL
      
      await this.s3.deleteObject({
        Bucket: this.bucket,
        Key: key,
      }).promise();
      
      return true;
    } catch (error) {
      console.error('Failed to delete file from S3:', error);
      return false;
    }
  }
}

// Factory function to create the appropriate storage service
export function createStorageService(): StorageService {
  const hasS3Config = process.env.S3_ENDPOINT && process.env.S3_ACCESS_KEY && process.env.S3_SECRET_KEY;
  
  if (hasS3Config) {
    return new S3StorageService();
  } else {
    return new MockStorageService();
  }
}

export const storageService = createStorageService();

// Multer configuration for file uploads
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});
