import React, { useState, useEffect } from 'react';
import { Search, Plus, UserPlus, Phone, MapPin, History, CreditCard } from 'lucide-react';
import { Client, User } from '../types';

export default function Clients({ user }: { user: User }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewClient, setShowNewClient] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients');
      const data = await response.json();
      setClients(data);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nombre o teléfono..." 
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>
        <button 
          onClick={() => setShowNewClient(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20"
        >
          <UserPlus size={20} />
          <span className="font-medium">Nuevo Cliente</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clients.map((client) => (
          <div key={client.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600 font-bold text-lg">
                {client.name.charAt(0)}
              </div>
              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-[10px] font-bold uppercase">
                {client.type}
              </span>
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-1">{client.name}</h3>
            <div className="space-y-2 mb-6">
              <div className="flex items-center text-sm text-gray-500">
                <Phone size={14} className="mr-2" />
                {client.phone}
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <MapPin size={14} className="mr-2" />
                {client.city}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button className="flex items-center justify-center space-x-2 py-2 bg-gray-50 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-100 transition-colors">
                <History size={14} />
                <span>Historial</span>
              </button>
              <button className="flex items-center justify-center space-x-2 py-2 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors">
                <Plus size={14} />
                <span>Nuevo Pedido</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {clients.length === 0 && !loading && (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-gray-200">
          <p className="text-gray-400">No hay clientes registrados aún.</p>
        </div>
      )}
    </div>
  );
}
