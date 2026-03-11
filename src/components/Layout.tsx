import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  ShoppingCart, 
  Package, 
  Truck, 
  CreditCard, 
  TrendingDown, 
  Settings, 
  LogOut,
  Menu,
  X,
  Bell
} from 'lucide-react';
import { User } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface LayoutProps {
  user: User;
  onLogout: () => void;
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Layout({ user, onLogout, children, activeTab, setActiveTab }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Administrador', 'Vendedor', 'Encargado Comercial', 'Producción', 'Caja', 'Entregas', 'Contabilidad'] },
    { id: 'clients', label: 'Clientes', icon: Users, roles: ['Administrador', 'Vendedor', 'Encargado Comercial'] },
    { id: 'orders', label: 'Pedidos', icon: ShoppingCart, roles: ['Administrador', 'Vendedor', 'Encargado Comercial', 'Caja', 'Entregas'] },
    { id: 'production', label: 'Producción', icon: Package, roles: ['Administrador', 'Producción'] },
    { id: 'deliveries', label: 'Entregas', icon: Truck, roles: ['Administrador', 'Entregas'] },
    { id: 'payments', label: 'Pagos/Caja', icon: CreditCard, roles: ['Administrador', 'Caja', 'Contabilidad'] },
    { id: 'expenses', label: 'Gastos', icon: TrendingDown, roles: ['Administrador', 'Vendedor', 'Contabilidad'] },
    { id: 'admin', label: 'Configuración', icon: Settings, roles: ['Administrador'] },
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(user.role));

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex">
      {/* Sidebar */}
      <aside 
        className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-[#151619] text-white transition-all duration-300 flex flex-col z-50`}
      >
        <div className="p-6 flex items-center justify-between">
          {isSidebarOpen && (
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-bold text-xl tracking-tight text-emerald-400"
            >
              TODO REMERAS
            </motion.span>
          )}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1 hover:bg-white/10 rounded">
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          {filteredMenu.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center p-3 rounded-xl transition-colors ${
                activeTab === item.id 
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              {isSidebarOpen && <span className="ml-4 font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center p-2">
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-xs font-bold">
              {user.role.charAt(0)}
            </div>
            {isSidebarOpen && (
              <div className="ml-3 overflow-hidden">
                <p className="text-sm font-medium truncate">Sistema</p>
                <p className="text-xs text-gray-500 truncate">{user.role}</p>
              </div>
            )}
          </div>
          <button 
            onClick={onLogout}
            className="w-full mt-4 flex items-center p-3 text-gray-400 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-colors"
          >
            <LogOut size={20} />
            {isSidebarOpen && <span className="ml-4 font-medium">Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-gray-800">
              {menuItems.find(i => i.id === activeTab)?.label}
            </h2>
            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
              {user.branch_name}
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-2 text-gray-400 hover:text-gray-600 relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-8 w-px bg-gray-200 mx-2"></div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{new Date().toLocaleDateString()}</p>
              <p className="text-xs text-gray-500">Sistema Operativo</p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
