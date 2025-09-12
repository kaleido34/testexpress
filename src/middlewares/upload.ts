import multer from 'multer';
import path from 'path';
import { Request } from 'express';

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/avatars/'); // Where to store files
    },
    filename: (req, file, cb) => {
        // Create fixed filename: user_userId_avatar.extension
        const userId = (req as any).user?.userId || 'unknown';
        const extension = path.extname(file.originalname);
        cb(null, `user_${userId}_avatar${extension}`);
    }
});

// File filter - only allow images
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true); // Accept file
    } else {
        cb(new Error('Only JPEG, JPG and PNG files are allowed')); // Reject file
    }
};

// Create multer instance
export const uploadAvatar = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

