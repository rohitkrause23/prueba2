import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  Clock, 
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { User } from '../types';

interface Stats {
  salesToday: number;
  paymentsToday: number;
  expensesToday: number;
  pendingOrders: number;
  productionOrders: number;
}

export default function Dashboard({ user }: { user: User }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const branchParam = user.role !== 'Administrador' ? `?branch_id=${user.branch_id}` : '';
        const response = await fetch(`/api/stats${branchParam}`);
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [user]);

  if (loading) return <div className="flex items-center justify-center h-64">Cargando estadísticas...</div>;

  const cards = [
    { label: 'Ventas del Día', value: `Gs. ${stats?.salesToday.toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50', trend: '+12%', trendUp: true },
    { label: 'Cobros del Día', value: `Gs. ${stats?.paymentsToday.toLocaleString()}`, icon: ArrowUpRight, color: 'text-blue-500', bg: 'bg-blue-50', trend: '+5%', trendUp: true },
    { label: 'Gastos del Día', value: `Gs. ${stats?.expensesToday.toLocaleString()}`, icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-50', trend: '-2%', trendUp: false },
    { label: 'Pedidos Pendientes', value: stats?.pendingOrders, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'En Producción', value: stats?.productionOrders, icon: Package, color: 'text-purple-500', bg: 'bg-purple-50' },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bienvenido al sistema, {user.role}</h1>
          <p className="text-gray-500">Aquí tienes un resumen de lo que está pasando hoy en {user.branch_name}.</p>
        </div>
        <div className="flex space-x-2">
          <button className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            Descargar Reporte
          </button>
          <button className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20">
            Nueva Venta
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {cards.map((card, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className={`w-12 h-12 ${card.bg} ${card.color} rounded-xl flex items-center justify-center mb-4`}>
              <card.icon size={24} />
            </div>
            <p className="text-sm font-medium text-gray-500 mb-1">{card.label}</p>
            <h3 className="text-xl font-bold text-gray-900">{card.value}</h3>
            {card.trend && (
              <div className="mt-2 flex items-center space-x-1">
                {card.trendUp ? <ArrowUpRight size={14} className="text-emerald-500" /> : <ArrowDownRight size={14} className="text-red-500" />}
                <span className={`text-xs font-bold ${card.trendUp ? 'text-emerald-500' : 'text-red-500'}`}>{card.trend}</span>
                <span className="text-xs text-gray-400">vs ayer</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Main Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Pending Tasks / Tray */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Bandeja de Pendientes</h3>
              <button className="text-xs font-bold text-emerald-500 hover:underline">Ver todo</button>
            </div>
            <div className="divide-y divide-gray-50">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between cursor-pointer">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center">
                      <Clock size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">Pedido #102{item} - Juan Pérez</p>
                      <p className="text-xs text-gray-500">Pendiente de confirmación • Hace 2 horas</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-[10px] font-bold uppercase">Urgente</span>
                    <button className="p-2 text-gray-400 hover:text-emerald-500">
                      <ArrowUpRight size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Alerts / Notifications */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4">Alertas de Sistema</h3>
            <div className="space-y-4">
              <div className="flex space-x-3 p-3 bg-red-50 border border-red-100 rounded-xl">
                <AlertCircle className="text-red-500 shrink-0" size={20} />
                <div>
                  <p className="text-sm font-bold text-red-900">Stock Bajo</p>
                  <p className="text-xs text-red-700">Remera Básica Blanca XL (Quedan 5)</p>
                </div>
              </div>
              <div className="flex space-x-3 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                <Package className="text-blue-500 shrink-0" size={20} />
                <div>
                  <p className="text-sm font-bold text-blue-900">Producción Atrasada</p>
                  <p className="text-xs text-blue-700">Pedido #1015 (Corte pendiente)</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#151619] rounded-2xl p-6 text-white">
            <h3 className="font-bold mb-2">Meta Mensual</h3>
            <div className="flex justify-between text-xs mb-2">
              <span className="text-gray-400">Progreso</span>
              <span className="text-emerald-400 font-bold">75%</span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 w-[75%]"></div>
            </div>
            <p className="mt-4 text-xs text-gray-400 italic">"Sigue así, faltan Gs. 5.000.000 para el bono de equipo."</p>
          </div>
        </div>
      </div>
    </div>
  );
}
