export type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export type Payment = {
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
