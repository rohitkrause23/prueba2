export type Role = 'Administrador' | 'Vendedor' | 'Encargado Comercial' | 'Producción' | 'Caja' | 'Entregas' | 'Contabilidad';

export interface User {
  id: number;
  username: string;
  role: Role;
  branch_id: number;
  branch_name: string;
  name: string;
}

export interface Client {
  id: number;
  name: string;
  phone: string;
  whatsapp: string;
  address: string;
  city: string;
  type: string;
  source: string;
}

export interface Product {
  id: number;
  family: string;
  name: string;
  base_price: number;
  usa_calidad: boolean;
  usa_color: boolean;
  usa_segundo_color: boolean;
  usa_talle: boolean;
  permite_adicionales: boolean;
}

export interface Order {
  id: number;
  client_id: number;
  client_name: string;
  user_id: number;
  user_name: string;
  branch_id: number;
  status: string;
  priority: string;
  delivery_mode: string;
  total: number;
  paid: number;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  quality?: string;
  color?: string;
  second_color?: string;
  size?: string;
  additional?: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  production_status: string;
}

export interface Expense {
  id: number;
  branch_id: number;
  branch_name: string;
  user_id: number;
  user_name: string;
  category: string;
  description: string;
  amount: number;
  method: string;
  created_at: string;
}

export interface Branch {
  id: number;
  name: string;
}
