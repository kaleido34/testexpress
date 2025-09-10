import { Router, Request, Response } from "express";
import { validate } from "../middlewares/validate";
import prisma from "../services/database";
import { authenticateToken } from "../middlewares/auth";
import { getUserSchema } from "../schemas/user";

const router = Router();

// GET /users/me - Get current user (protected, detailed)
router.get("/me", authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                age: true,
                createdAt: true,
                updatedAt: true
                // More detailed info for own profile
            }
        });

        if (!user) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        return res.json({ user });
    } catch (error: any) {
        console.error('Get current user error:', error);
        return res.status(500).json({
            error: 'Failed to fetch current user'
        });
    }
});


// GET /users - Get all users (public, limited info)
router.get("/", async (req: Request, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                createdAt: true
                // Limited public info only
            }
        });

        return res.json({
            users,
            count: users.length
        });
    } catch (error: any) {
        console.error('Get users error:', error);
        return res.status(500).json({
            error: 'Failed to fetch users'
        });
    }
});

// GET /users/:id - Get user by ID (public, limited info)
router.get("/:id", validate(getUserSchema), async (req: Request, res: Response) => {
    try {
        const userId = parseInt(req.params.id);
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                createdAt: true
                // Limited public info only - no email, age, etc.
            }
        });

        if (!user) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        return res.json({ user });
    } catch (error: any) {
        console.error('Get user error:', error);
        return res.status(500).json({
            error: 'Failed to fetch user'
        });
    }
});

// GET /users/:id/posts - Get posts by user (public)
router.get("/:id/posts", validate(getUserSchema), async (req: Request, res: Response) => {
    try {
        const userId = parseInt(req.params.id);

        // First check if user exists
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true }
        });

        if (!user) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        const posts = await prisma.post.findMany({
            where: { authorId: userId },
            orderBy: { createdAt: 'desc' },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        res.json({
            user,
            posts,
            count: posts.length
        });
    } catch (error: any) {
        console.error('Get user posts error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch user posts' 
        });
    }
});

export default router;