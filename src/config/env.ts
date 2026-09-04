import 'dotenv/config';
import type { SignOptions } from 'jsonwebtoken';

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta la variable de entorno ${name}. Revisa tu .env (ver .env.example).`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 3001),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: (process.env.JWT_EXPIRES_IN ?? '7d') as SignOptions['expiresIn'],
  geminiApiKey: required('GEMINI_API_KEY'),
  geminiModel: process.env.GEMINI_MODEL ?? 'gemini-3.6-flash',
  resendApiKey: required('RESEND_API_KEY'),
  reminderDaysThreshold: Number(process.env.REMINDER_DAYS_THRESHOLD ?? 7),
  cronSecret: required('CRON_SECRET'),
  adzunaAppId: required('ADZUNA_APP_ID'),
  adzunaAppKey: required('ADZUNA_APP_KEY'),
};