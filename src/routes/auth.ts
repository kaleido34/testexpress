import { Router, Request, Response } from 'express';
import { validate } from '../middlewares/validate';
import { hashPassword, comparePassword, generateToken } from '../utils/auth';
import prisma from '../services/database';
import { registerSchema, loginSchema } from '../schemas/user';
import { sendVerificationEmail } from '../services/email';
import crypto from 'crypto'; 

const router = Router();


// POST /auth/register
router.post('/register', validate(registerSchema), async (req: Request, res: Response) => {
    try {
        const { name, email, password, age } = req.body;

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return res.status(409).json({
                error: 'User already exists with this email'
            });
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');

        // Create user
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                age: age || null,
                isEmailVerified: false,
                verificationToken
            } 
        });

        // Generate token
        const token = generateToken(user.id);

        const emailSent = await sendVerificationEmail(email, name, verificationToken);

        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                age: user.age,
                isEmailVerified: user.isEmailVerified
            },
            token,  // ✅ JWT token for immediate use
            emailSent
        });
    } catch (error: any) {
        console.error('Registration error:', error);
        res.status(500).json({
            error: 'Failed to register user'
        });
    }
});

// POST /auth/login
router.post('/login', validate(loginSchema), async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
            select: { id: true, name: true, email: true, age: true, password: true,isEmailVerified: true}
        });

        if (!user) {
            return res.status(401).json({
                error: 'Invalid email or password'
            });
        }

        // Check password
        const isValidPassword = await comparePassword(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({
                error: 'Invalid email or password'
            });
        }

        // Generate token
        const token = generateToken(user.id);

        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                age: user.age,
                isEmailVerified: user.isEmailVerified
            },
            token
        });
    } catch (error: any) {
        console.error('Login error:', error);
        res.status(500).json({
            error: 'Failed to login'
        });
    }
});

// GET /auth/verify-email - Server-side email verification
router.get('/verify-email', async (req: Request, res: Response) => {
    try {
        const { token } = req.query;

        if (!token || typeof token !== 'string') {
            return res.status(400).send(`
                <h1>Invalid Verification Link</h1>
                <p>The verification link is invalid or missing.</p>
                <a href="http://localhost:3000">Back to Home</a>
            `);
        }

        // Find user with this verification token
        const user = await prisma.user.findFirst({
            where: {
                verificationToken: token,
                isEmailVerified: false
            }
        });

        if (!user) {
            return res.status(400).send(`
                <h1>Invalid or Expired Token</h1>
                <p>The verification link is invalid, expired, or already used.</p>
                <a href="http://localhost:3000">Back to Home</a>
            `);
        }

        // Update user as verified
        await prisma.user.update({
            where: { id: user.id },
            data: {
                isEmailVerified: true,
                verificationToken: null // Clear the token
            }
        });

        res.send(`
            <h1>Email Verified Successfully!</h1>
            <p>Thank you ${user.name}, your email has been verified.</p>
            <p>You can now login to your account.</p>
            <div style="background-color: #f0f9ff; padding: 15px; border-radius: 5px; margin-top: 20px;">
                <h4>Next Steps:</h4>
                <p>Use your API client (Postman) or frontend application to login:</p>
                <code>POST /auth/login</code>
            </div>
        `);
    } catch (error: any) {
        console.error('Email verification error:', error);
        res.status(500).send(`
            <h1>Verification Failed</h1>
            <p>Something went wrong during verification.</p>
            <a href="http://localhost:3000">Back to Home</a>
        `);
    }
});

export default router;