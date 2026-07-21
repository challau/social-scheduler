import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  PlusSquare, 
  Calendar, 
  BarChart3, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Sparkles,
  User
} from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || '{"name":"Creator User","email":"creator@socialflow.ai"}');

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Create Post", href: "/create", icon: PlusSquare },
    { name: "Calendar", href: "/calendar", icon: Calendar },
    { name: "Analytics", href: "/analytics", icon: BarChart3 },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden transition-all duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-900/40 border-r border-slate-800/60 backdrop-blur-xl
        flex flex-col justify-between p-6 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:flex
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="space-y-8">
          {/* Logo */}
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="bg-gradient-to-tr from-violet-600 to-fuchsia-600 p-2 rounded-xl shadow-lg shadow-violet-500/20">
                <Sparkles className="size-5 text-white" />
              </div>
              <span className="font-bold text-lg bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                SocialFlow AI
              </span>
            </Link>
            <button 
              className="lg:hidden text-slate-400 hover:text-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group
                    ${isActive 
                      ? "bg-gradient-to-r from-violet-600/20 to-fuchsia-600/10 text-violet-400 border border-violet-500/20" 
                      : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 border border-transparent"}
                  `}
                >
                  <Icon className={`size-4.5 transition-transform duration-300 group-hover:scale-110 ${isActive ? "text-violet-400" : "text-slate-400 group-hover:text-slate-200"}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User profile & Logout */}
        <div className="space-y-4 pt-6 border-t border-slate-800/60">
          <div className="flex items-center gap-3 px-2">
            <div className="size-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
              <User className="size-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-slate-200">{user.name}</p>
              <p className="text-xs truncate text-slate-500">{user.email}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-rose-400/90 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all duration-200"
          >
            <LogOut className="size-4.5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Mobile Header */}
        <header className="flex items-center justify-between p-4 bg-slate-900/20 border-b border-slate-800/40 lg:hidden">
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-gradient-to-tr from-violet-600 to-fuchsia-600 p-1.5 rounded-lg">
              <Sparkles className="size-4 text-white" />
            </div>
            <span className="font-bold text-base bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              SocialFlow AI
            </span>
          </Link>
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
          >
            <Menu className="size-5" />
          </button>
        </header>

        {/* Dashboard Pages wrapper */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-10 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
