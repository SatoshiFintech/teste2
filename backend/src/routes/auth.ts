import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { database } from '../db/database';
import { randomId } from '../utils/crypto';
import { env } from '../config/env';

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

router.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Dados inválidos.', issues: parsed.error.flatten() });
  }

  const { name, email, password } = parsed.data;

  const existing = database.users.getByEmail(email);
  if (existing) {
    return res.status(409).json({ error: 'E-mail já cadastrado.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const userId = randomId('usr');

  database.users.create({
    id: userId,
    name,
    email,
    password_hash: passwordHash,
    role: 'merchant',
    created_at: new Date().toISOString(),
  });

  const token = jwt.sign({ id: userId, email, name, role: 'merchant' }, env.jwtSecret, { expiresIn: '8h' });

  return res.status(201).json({
    message: 'Usuário criado com sucesso.',
    token,
    user: { id: userId, name, email, role: 'merchant' },
  });
});

router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Dados inválidos.' });
  }

  const { email, password } = parsed.data;
  const user = database.users.getByEmail(email);

  if (!user) {
    return res.status(401).json({ error: 'Credenciais inválidas.' });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Credenciais inválidas.' });
  }

  const token = jwt.sign({ id: user.id, email: user.email, name: user.name, role: user.role }, env.jwtSecret, { expiresIn: '8h' });

  return res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

export default router;
