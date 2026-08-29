import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth';
import paymentRoutes from './routes/payments';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

const app = express();
const allowedOrigins = env.allowedOrigins;

app.disable('x-powered-by');
app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: false,
}));
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('Origem bloqueada pelo CORS.'));
  },
  credentials: false,
}));
app.set('trust proxy', 1);
app.use(express.json({ limit: '1mb' }));
app.use(morgan('combined'));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisições. Tente novamente mais tarde.' },
});
app.use(limiter);

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `${req.ip || 'unknown'}:${req.body?.email || 'anonymous'}`,
  message: { error: 'Muitas tentativas de login. Aguarde 15 minutos.' },
  skipSuccessfulRequests: true,
});

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'private-payment-gateway', timestamp: new Date().toISOString() });
});

app.use('/api/auth/login', loginLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/payments', paymentRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`Servidor rodando em http://localhost:${env.port}`);
});
