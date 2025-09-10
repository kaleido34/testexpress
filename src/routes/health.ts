import { Router,Request,Response } from "express";
import { uptime } from "process";

const router=Router();

router.get("/",(req:Request,res:Response)=>{
    res.status(200).json({
        status:'ok',
        timestamp:new Date().toISOString(),
        uptime:process.uptime(),
        environment:process.env.NODE_ENV || 'development'
        })
});

export default router;
