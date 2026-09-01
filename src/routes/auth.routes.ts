import { Router } from 'express';
import { register, login } from '../controllers/authController';
import { asyncHandler } from '../lib/asynchandler';

export const authRouter = Router();

authRouter.post('/register', asyncHandler(register));
authRouter.post('/login', asyncHandler(login));