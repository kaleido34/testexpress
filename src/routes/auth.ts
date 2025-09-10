import { Router, Request, Response } from 'express';
import { validate } from '../middlewares/validate';
import { hashPassword, comparePassword, generateToken } from '../utils/auth';
import prisma from '../services/database';
import { registerSchema, loginSchema } from '../schemas/user';

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

        // Create user
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                age: age || null
            } 
        });

        // Generate token
        const token = generateToken(user.id);

        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                age: user.age
            },
            token
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
            select: { id: true, name: true, email: true, age: true, password: true }
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
                age: user.age
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

export default router;