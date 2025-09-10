import { z } from 'zod';

// Base schemas
const titleSchema = z.string().min(2, "Title must be at least 2 characters").max(100, "Title too long");
const contentSchema = z.string().min(1, "Content is required").max(5000, "Content too long");

export const createPostSchema = {
    body: z.object({
        title: titleSchema,
        content: contentSchema
    })
};

export const getPostSchema = {
    params: z.object({
        id: z.string().regex(/^\d+$/, "ID must be a number")
    })
};