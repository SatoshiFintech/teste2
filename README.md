# PrivatePay Gateway

Gateway de pagamentos privada para uso interno com painel administrativo e API segura.

## Stack

- Backend: Node.js + Express + TypeScript
- Frontend: React + Vite + Tailwind
- Autenticação: JWT + bcrypt
- Armazenamento: JSON local em ambiente privado

## Requisitos

- Node.js 20+
- npm

## Instalação

```bash
cd backend && npm install
cd ../frontend && npm install
```

## Execução

```bash
cd backend && npm run dev
cd frontend && npm run dev
```

## Variáveis de ambiente

Copie os exemplos e configure valores reais:

- backend/.env.example
- frontend/.env.example

## Observações

Projeto preparado para deploy em VPS sem Docker e sem integração com PayPal.
