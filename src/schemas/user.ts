import { z } from 'zod';

// Base schemas - reusable building blocks
const nameSchema = z.string().min(2, "Name must be at least 2 characters");
const emailSchema = z.string().email("Invalid email format");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");
const ageSchema = z.number().min(18, "Must be at least 18 years old").optional();


export const getUserSchema = {
    params: z.object({
        id: z.string().regex(/^\d+$/, "ID must be a number")
    })
};

// Auth schemas
export const registerSchema = {
    body: z.object({
        name: nameSchema,
        email: emailSchema,
        password: passwordSchema,
        age: ageSchema
    })
};

export const loginSchema = {
    body: z.object({
        email: emailSchema,
        password: z.string().min(1, "Password is required")
    })
};