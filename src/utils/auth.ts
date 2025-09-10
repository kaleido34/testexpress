import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

export const hashPassword= async(password:string):Promise<string>=>{
    const saltRounds=10;
    return bcrypt.hash(password,saltRounds)
};

export const comparePassword= async(password:string,hashedPassword:string):Promise<boolean>=>{
    return bcrypt.compare(password,hashedPassword);
};

export const generateToken = (userId: number): string => {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '24h' });
};

// Verify JWT token
export const verifyToken = (token: string): any => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
};



