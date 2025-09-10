import { Router, Request, Response } from 'express';
import prisma from '../services/database';
import { validate } from '../middlewares/validate';
import { authenticateToken } from '../middlewares/auth';
import { createPostSchema, getPostSchema } from '../schemas/post';

const router = Router();

// POST /posts - Create a post (protected)
router.post('/', authenticateToken, validate(createPostSchema), async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { title, content } = req.body;

        const post = await prisma.post.create({
            data: { 
                title, 
                content, 
                authorId: userId 
            },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        res.status(201).json({
            message: 'Post created successfully',
            post
        });
    } catch (error: any) {
        console.error('Create post error:', error);
        res.status(500).json({ 
            error: 'Failed to create post' 
        });
    }
});

// GET /posts - Get all posts (public)
router.get('/', async (req: Request, res: Response) => {
    try {
        const posts = await prisma.post.findMany({
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
            posts,
            count: posts.length
        });
    } catch (error: any) {
        console.error('List posts error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch posts' 
        });
    }
});

// GET /posts/:id - Get single post (public)
router.get('/:id', validate(getPostSchema), async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const post = await prisma.post.findUnique({
            where: { id },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        if (!post) {
            return res.status(404).json({ 
                error: 'Post not found' 
            });
        }

        res.json({ post });
    } catch (error: any) {
        console.error('Get post error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch post' 
        });
    }
});

// PUT /posts/:id - Update a post (protected, only author can update)
router.put('/:id', authenticateToken, validate(getPostSchema), validate(createPostSchema), async (req: Request, res: Response) => {
    try {
        const postId = parseInt(req.params.id);
        const userId = (req as any).user.userId;
        const { title, content } = req.body;

        // Check if post exists and user owns it
        const existingPost = await prisma.post.findUnique({
            where: { id: postId },
            select: { authorId: true }
        });

        if (!existingPost) {
            return res.status(404).json({
                error: 'Post not found'
            });
        }

        if (existingPost.authorId !== userId) {
            return res.status(403).json({
                error: 'You can only update your own posts'
            });
        }

        // Update the post
        const updatedPost = await prisma.post.update({
            where: { id: postId },
            data: { title, content },
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
            message: 'Post updated successfully',
            post: updatedPost
        });
    } catch (error: any) {
        console.error('Update post error:', error);
        res.status(500).json({
            error: 'Failed to update post'
        });
    }
});

// DELETE /posts/:id - Delete a post (protected, only author can delete)
router.delete('/:id', authenticateToken, validate(getPostSchema), async (req: Request, res: Response) => {
    try {
        const postId = parseInt(req.params.id);
        const userId = (req as any).user.userId;

        // Check if post exists and user owns it
        const existingPost = await prisma.post.findUnique({
            where: { id: postId },
            select: { authorId: true, title: true }
        });

        if (!existingPost) {
            return res.status(404).json({
                error: 'Post not found'
            });
        }

        if (existingPost.authorId !== userId) {
            return res.status(403).json({
                error: 'You can only delete your own posts'
            });
        }

        // Delete the post
        await prisma.post.delete({
            where: { id: postId }
        });

        res.json({
            message: 'Post deleted successfully'
        });
    } catch (error: any) {
        console.error('Delete post error:', error);
        res.status(500).json({
            error: 'Failed to delete post'
        });
    }
});

export default router;