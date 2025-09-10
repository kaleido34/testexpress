import { type Request, type Response, type NextFunction } from "express";
import { type ZodObject, ZodError } from "zod";

export const validate = (schema: {
    body?: ZodObject<any>;
    params?: ZodObject<any>;
    query?: ZodObject<any>;
}) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            if (schema.body) {
                req.body = schema.body.parse(req.body) as any;
            }
            if (schema.params) {
                req.params = schema.params.parse(req.params) as any;
            }
            if (schema.query) {
                req.query = schema.query.parse(req.query) as any;
            }
            next();
        } catch (error: any) {
            if (error instanceof ZodError) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: error.issues.map((i) => ({
                        field: i.path.join('.'),
                        message: i.message
                    }))
                });
            }
            console.error('Validation middleware error:', error);
            return res.status(500).json({ error: 'Validation middleware failed' });
        }
    };
};