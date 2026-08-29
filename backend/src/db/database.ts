import fs from 'fs';
import path from 'path';

type UserRow = {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: string;
  created_at: string;
};

type PaymentRow = {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  provider: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
};

type DatabaseState = {
  users: UserRow[];
  payments: PaymentRow[];
};

const dataDir = path.resolve(__dirname, '../../data');
const dbPath = path.join(dataDir, 'gateway.json');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

if (!fs.existsSync(dbPath)) {
  const initial: DatabaseState = { users: [], payments: [] };
  fs.writeFileSync(dbPath, JSON.stringify(initial, null, 2), 'utf-8');
}

function readDb(): DatabaseState {
  const raw = fs.readFileSync(dbPath, 'utf-8');
  const parsed = JSON.parse(raw) as DatabaseState;
  return {
    users: Array.isArray(parsed.users) ? parsed.users : [],
    payments: Array.isArray(parsed.payments) ? parsed.payments : [],
  };
}

function writeDb(state: DatabaseState) {
  fs.writeFileSync(dbPath, JSON.stringify(state, null, 2), 'utf-8');
}

export const database = {
  users: {
    getByEmail(email: string) {
      const state = readDb();
      return state.users.find((user) => user.email === email) || null;
    },
    create(user: UserRow) {
      const state = readDb();
      state.users.push(user);
      writeDb(state);
      return user;
    },
    findById(id: string) {
      const state = readDb();
      return state.users.find((user) => user.id === id) || null;
    },
  },
  payments: {
    listByUser(userId: string) {
      const state = readDb();
      return state.payments.filter((payment) => payment.user_id === userId).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },
    create(payment: PaymentRow) {
      const state = readDb();
      state.payments.push(payment);
      writeDb(state);
      return payment;
    },
    getById(id: string) {
      const state = readDb();
      return state.payments.find((payment) => payment.id === id) || null;
    },
    updateStatus(id: string, status: string) {
      const state = readDb();
      const index = state.payments.findIndex((payment) => payment.id === id);
      if (index === -1) return null;
      state.payments[index].status = status;
      state.payments[index].updated_at = new Date().toISOString();
      writeDb(state);
      return state.payments[index];
    },
  },
};
