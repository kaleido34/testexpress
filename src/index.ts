import express from 'express';
import healthRoutes from './routes/health';
import userRoutes from './routes/user';
import authRoutes from './routes/auth';
import prisma from './services/database';

const port=3000;
const app=express();

app.use(express.json());

// Public routes
app.use('/health', healthRoutes);
app.use('/auth', authRoutes);

// Protected routes
app.use('/users', userRoutes);



const server= app.listen(port,()=>{
    console.log(`server running at:${port}`)
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down gracefully...');
    await prisma.$disconnect();
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

export default app;