import { Router } from 'express';
import { z } from 'zod';
import { database } from '../db/database';
import { randomId } from '../utils/crypto';
import { authenticateToken } from '../middleware/auth';

const router = Router();

const paymentSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().min(3).max(3),
  provider: z.enum(['stripe', 'mercado-pago', 'bank-transfer']),
  description: z.string().optional(),
});

router.use(authenticateToken);

router.get('/', (req, res) => {
  const rows = database.payments.listByUser(req.user!.id);
  return res.json(rows);
});

router.post('/', (req, res) => {
  const parsed = paymentSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Dados do pagamento inválidos.', issues: parsed.error.flatten() });
  }

  const paymentId = randomId('pay');
  const payload = parsed.data;

  const created = database.payments.create({
    id: paymentId,
    user_id: req.user!.id,
    amount: payload.amount,
    currency: payload.currency,
    provider: payload.provider,
    description: payload.description || '',
    status: 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  return res.status(201).json({
    message: 'Pagamento registrado com sucesso.',
    payment: created,
  });
});

router.patch('/:id/status', (req, res) => {
  const { status } = req.body as { status?: string };
  const allowed = ['pending', 'paid', 'failed', 'refunded'];

  if (!status || !allowed.includes(status)) {
    return res.status(400).json({ error: 'Status inválido.' });
  }

  const payment = database.payments.getById(req.params.id);
  if (!payment || payment.user_id !== req.user!.id) {
    return res.status(404).json({ error: 'Pagamento não encontrado.' });
  }

  const updated = database.payments.updateStatus(req.params.id, status);

  return res.json({ message: 'Status atualizado.', payment: updated });
});

export default router;
