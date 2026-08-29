import { NextFunction, Request, Response } from 'express';

export function notFoundHandler(req: Request, res: Response) {
  return res.status(404).json({ error: 'Rota não encontrada.' });
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error(err);
  return res.status(500).json({ error: 'Erro interno do servidor.' });
}
