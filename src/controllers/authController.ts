import type { Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { env } from '../config/env';

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'La contrasena debe tener al menos 8 caracteres'),
});

export async function register(req: Request, res: Response) {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: 'Ya existe una cuenta con ese email' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, passwordHash },
  });

  const token = signToken(user.id, user.email);
  return res.status(201).json({ token });
}

export async function login(req: Request, res: Response) {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // Mensaje deliberadamente generico: no revelar si el email existe o no.
    return res.status(401).json({ error: 'Credenciales invalidas' });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: 'Credenciales invalidas' });
  }

  const token = signToken(user.id, user.email);
  return res.json({ token });
}

function signToken(userId: string, email: string): string {
  return jwt.sign({ userId, email }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}
