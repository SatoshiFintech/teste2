import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Payment, User } from './types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

type AuthMode = 'login' | 'register';

function App() {
  const [mode, setMode] = useState<AuthMode>('register');
  const [token, setToken] = useState<string | null>(localStorage.getItem('privatepay_token'));
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [paymentForm, setPaymentForm] = useState({
    amount: '150.00',
    currency: 'BRL',
    provider: 'stripe',
    description: 'Pedido de exemplo',
  });

  const visibleTotal = useMemo(
    () => payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
    [payments],
  );

  useEffect(() => {
    const storedUser = localStorage.getItem('privatepay_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    if (token && user) {
      fetchPayments();
    }
  }, [token, user]);

  async function fetchPayments() {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/payments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setPayments(Array.isArray(data) ? data : []);
    } catch {
      setMessage('Não foi possível carregar os pagamentos.');
    }
  }

  async function handleAuthSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login';
    const payload = mode === 'register'
      ? { name: form.name, email: form.email, password: form.password }
      : { email: form.email, password: form.password };

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha na autenticação.');
      }

      const nextUser = data.user as User;
      setToken(data.token);
      setUser(nextUser);
      localStorage.setItem('privatepay_token', data.token);
      localStorage.setItem('privatepay_user', JSON.stringify(nextUser));
      setMessage(mode === 'register' ? 'Conta criada com sucesso.' : 'Login realizado com sucesso.');
      setForm({ name: '', email: '', password: '' });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erro inesperado.');
    } finally {
      setLoading(false);
    }
  }

  async function handlePaymentSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;

    setLoading(true);
    setMessage('');

    try {
      const res = await fetch(`${API_URL}/api/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: Number(paymentForm.amount),
          currency: paymentForm.currency,
          provider: paymentForm.provider,
          description: paymentForm.description,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao registrar pagamento.');
      }

      setMessage('Pagamento registrado com sucesso.');
      setPaymentForm({ amount: '150.00', currency: 'BRL', provider: 'stripe', description: 'Pedido de exemplo' });
      await fetchPayments();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erro inesperado.');
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    setToken(null);
    setUser(null);
    setPayments([]);
    localStorage.removeItem('privatepay_token');
    localStorage.removeItem('privatepay_user');
  }

  if (!user || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900/80 p-6 shadow-2xl">
          <div className="mb-6 text-center">
            <div className="text-3xl font-bold text-white">PrivatePay</div>
            <p className="text-sm text-slate-300">Gateway de pagamentos privada</p>
          </div>

          <div className="mb-6 flex rounded-xl bg-slate-800 p-1">
            <button
              type="button"
              className={`flex-1 rounded-lg px-4 py-2 font-medium ${mode === 'register' ? 'bg-emerald-500 text-slate-950' : 'text-slate-300'}`}
              onClick={() => setMode('register')}
            >
              Cadastrar
            </button>
            <button
              type="button"
              className={`flex-1 rounded-lg px-4 py-2 font-medium ${mode === 'login' ? 'bg-emerald-500 text-slate-950' : 'text-slate-300'}`}
              onClick={() => setMode('login')}
            >
              Entrar
            </button>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="mb-1 block text-sm text-slate-300">Nome</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-white outline-none focus:border-emerald-500"
                  placeholder="Seu nome"
                  required
                />
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm text-slate-300">E-mail</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-white outline-none focus:border-emerald-500"
                placeholder="mercante@empresa.com"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-300">Senha</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-white outline-none focus:border-emerald-500"
                placeholder="Mínimo 8 caracteres"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-slate-950 disabled:opacity-60"
            >
              {loading ? 'Carregando...' : mode === 'register' ? 'Criar conta' : 'Entrar'}
            </button>
          </form>

          {message && <p className="mt-4 text-sm text-amber-300">{message}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 text-slate-100">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 rounded-2xl border border-slate-700 bg-slate-900/80 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-emerald-400">Dashboard</p>
            <h1 className="text-2xl font-bold">Bem-vindo, {user.name}</h1>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-xl border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
          >
            Sair
          </button>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-5">
            <p className="text-sm text-slate-400">Transações</p>
            <p className="mt-2 text-3xl font-bold">{payments.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-5">
            <p className="text-sm text-slate-400">Volume bruto</p>
            <p className="mt-2 text-3xl font-bold">R$ {visibleTotal.toFixed(2)}</p>
          </div>
          <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-5">
            <p className="text-sm text-slate-400">Status</p>
            <p className="mt-2 text-3xl font-bold text-emerald-400">Ativa</p>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
          <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-5">
            <h2 className="mb-4 text-xl font-semibold">Registrar pagamento</h2>
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm text-slate-300">Valor</label>
                  <input
                    type="number"
                    step="0.01"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-white outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-slate-300">Moeda</label>
                  <select
                    value={paymentForm.currency}
                    onChange={(e) => setPaymentForm({ ...paymentForm, currency: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-white outline-none focus:border-emerald-500"
                  >
                    <option value="BRL">BRL</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm text-slate-300">Provedor</label>
                  <select
                    value={paymentForm.provider}
                    onChange={(e) => setPaymentForm({ ...paymentForm, provider: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-white outline-none focus:border-emerald-500"
                  >
                    <option value="stripe">Stripe</option>
                    <option value="mercado-pago">Mercado Pago</option>
                    <option value="bank-transfer">Transferência bancária</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm text-slate-300">Descrição</label>
                  <input
                    value={paymentForm.description}
                    onChange={(e) => setPaymentForm({ ...paymentForm, description: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-white outline-none focus:border-emerald-500"
                    placeholder="Pedido #2045"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-slate-950 disabled:opacity-60"
              >
                {loading ? 'Processando...' : 'Enviar pagamento'}
              </button>
            </form>

            {message && <p className="mt-4 text-sm text-amber-300">{message}</p>}
          </div>

          <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-5">
            <h2 className="mb-4 text-xl font-semibold">Resumo de segurança</h2>
            <ul className="space-y-3 text-sm text-slate-300">
              <li>• Token JWT com expiração curta</li>
              <li>• Rate limiting por rota e IP</li>
              <li>• CORS e Helmet habilitados</li>
              <li>• Senhas com hash via bcrypt</li>
              <li>• Banco SQLite local para ambiente privado</li>
            </ul>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-700 bg-slate-900/80 p-5">
          <h2 className="mb-4 text-xl font-semibold">Pagamentos recentes</h2>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-slate-400">
                <tr>
                  <th className="pb-3">ID</th>
                  <th className="pb-3">Valor</th>
                  <th className="pb-3">Moeda</th>
                  <th className="pb-3">Provedor</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-4 text-slate-400">Nenhum pagamento cadastrado ainda.</td>
                  </tr>
                ) : (
                  payments.map((payment) => (
                    <tr key={payment.id} className="border-t border-slate-800">
                      <td className="py-3">{payment.id}</td>
                      <td className="py-3">{Number(payment.amount).toFixed(2)}</td>
                      <td className="py-3">{payment.currency}</td>
                      <td className="py-3">{payment.provider}</td>
                      <td className="py-3">
                        <span className="rounded-full bg-emerald-500/20 px-2 py-1 text-xs text-emerald-300">
                          {payment.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

export default App;
