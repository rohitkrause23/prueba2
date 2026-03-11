import React, { useState, useEffect } from 'react';
import { TrendingDown, Plus, Search, Calendar, DollarSign, Tag } from 'lucide-react';
import { Expense, User } from '../types';
import { EXPENSE_CATEGORIES } from '../constants';

export default function Expenses({ user }: { user: User }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewExpense, setShowNewExpense] = useState(false);

  useEffect(() => {
    fetchExpenses();
  }, [user]);

  const fetchExpenses = async () => {
    try {
      const branchParam = user.role !== 'Administrador' ? `?branch_id=${user.branch_id}` : '';
      const response = await fetch(`/api/expenses${branchParam}`);
      const data = await response.json();
      setExpenses(data);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex space-x-4">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar gastos..." 
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
          <select className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-600 focus:outline-none focus:border-emerald-500">
            <option value="">Todas las categorías</option>
            {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <button 
          onClick={() => setShowNewExpense(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
        >
          <Plus size={20} />
          <span className="font-medium">Registrar Gasto</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Categoría</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Descripción</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Sucursal</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(expense.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-[10px] font-bold uppercase">
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                      {expense.description}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {expense.branch_name}
                    </td>
                    <td className="px-6 py-4 font-bold text-red-500">
                      Gs. {expense.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {expenses.length === 0 && !loading && (
              <div className="p-12 text-center text-gray-400">
                No hay gastos registrados.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">Resumen Mensual</h3>
            <div className="space-y-4">
              {EXPENSE_CATEGORIES.map(cat => (
                <div key={cat} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-red-400"></div>
                    <span className="text-sm text-gray-600">{cat}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">Gs. 0</span>
                </div>
              ))}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                <span className="font-bold text-gray-900">Total</span>
                <span className="font-bold text-red-500 text-lg">Gs. 0</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
