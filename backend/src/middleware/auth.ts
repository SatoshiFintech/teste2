import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ error: 'Token de autenticação ausente.' });
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret) as {
      id: string;
      email: string;
      name: string;
      role: string;
    };

    req.user = payload;
    return next();
  } catch {
    return res.status(403).json({ error: 'Token inválido ou expirado.' });
  }
}
