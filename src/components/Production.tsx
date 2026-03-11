import React, { useState, useEffect } from 'react';
import { Package, Clock, CheckCircle2, AlertCircle, Play, Check } from 'lucide-react';
import { User, Order } from '../types';
import { PRODUCTION_STAGES } from '../constants';

export default function Production({ user }: { user: User }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProductionOrders();
  }, []);

  const fetchProductionOrders = async () => {
    try {
      const response = await fetch('/api/orders?status=En producción');
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error('Error fetching production orders:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Production Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {PRODUCTION_STAGES.map((stage, i) => (
          <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{stage}</p>
            <div className="flex items-end justify-between">
              <h3 className="text-2xl font-bold text-gray-900">0</h3>
              <span className="text-xs text-gray-500">pedidos</span>
            </div>
          </div>
        ))}
      </div>

      {/* Production List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Órdenes en Producción</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {orders.map((order) => (
            <div key={order.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
                    <Package size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Pedido #{order.id.toString().padStart(4, '0')}</h4>
                    <p className="text-sm text-gray-500">{order.client_name} • {order.delivery_mode}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${order.priority === 'Alta' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                    Prioridad {order.priority}
                  </span>
                  <p className="text-xs text-gray-400 mt-1">Iniciado: {new Date(order.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <div className="flex justify-between text-xs font-bold text-gray-500 mb-2">
                    <span>Progreso de Etapas</span>
                    <span>40%</span>
                  </div>
                  <div className="flex space-x-1">
                    {PRODUCTION_STAGES.map((_, i) => (
                      <div key={i} className={`h-2 flex-1 rounded-full ${i < 2 ? 'bg-purple-500' : 'bg-gray-100'}`}></div>
                    ))}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button className="flex items-center space-x-2 px-4 py-2 bg-purple-500 text-white rounded-lg text-xs font-bold hover:bg-purple-600 transition-colors">
                    <Play size={14} />
                    <span>Siguiente Etapa</span>
                  </button>
                  <button className="p-2 border border-gray-200 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50">
                    <AlertCircle size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {orders.length === 0 && !loading && (
            <div className="p-12 text-center text-gray-400">
              No hay pedidos en producción actualmente.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
