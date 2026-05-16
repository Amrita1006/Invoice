import { Outlet, NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Upload, 
  History, 
  FileText,
  Brain,
  Settings
} from 'lucide-react';

const SidebarItem = ({ to, icon: Icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `sidebar-link ${isActive ? 'active' : 'text-gray-300 hover:text-white'}`
    }
  >
    <Icon size={20} />
    <span>{label}</span>
  </NavLink>
);

function MainLayout() {
  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Brain className="text-white" size={24} />
            </div>
            <div>
              <h1 className="font-bold text-lg">InvoiceIQ AI</h1>
              <p className="text-xs text-gray-400">Smart Invoice Management</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <SidebarItem to="/" icon={LayoutDashboard} label="Dashboard" />
          <SidebarItem to="/upload" icon={Upload} label="Upload Invoice" />
          <SidebarItem to="/history" icon={History} label="Invoice History" />
        </nav>
        
        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center gap-3 px-4 py-3 text-gray-400">
            <Settings size={20} />
            <span className="text-sm">Settings</span>
          </div>
        </div>
      </aside>
      
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default MainLayout;