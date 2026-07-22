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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
    <div className="min-h-screen bg-[#0B141A] text-slate-100 flex flex-col font-sans">
      {/* Horizontal Top Navigation Header in WhatsApp Deep Teal & Emerald Theme */}
      <header className="sticky top-0 z-50 bg-[#111B21]/90 border-b border-[#202C33] backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="bg-gradient-to-tr from-[#075E54] to-[#25D366] p-2 rounded-xl shadow-lg shadow-[#25D366]/20">
              <Sparkles className="size-4.5 text-white" />
            </div>
            <span className="font-extrabold text-lg bg-gradient-to-r from-white via-emerald-100 to-teal-300 bg-clip-text text-transparent tracking-tight">
              SocialFlow AI
            </span>
          </Link>

          {/* Desktop Horizontal Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 bg-[#0B141A]/80 p-1.5 rounded-2xl border border-[#202C33]">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200
                    ${isActive 
                      ? "bg-gradient-to-r from-[#075E54] to-[#128C7E] text-[#25D366] border border-[#25D366]/30 shadow-md shadow-[#25D366]/10" 
                      : "text-slate-400 hover:text-slate-100 hover:bg-[#111B21]"}
                  `}
                >
                  <Icon className={`size-4 ${isActive ? "text-[#25D366]" : ""}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Right Side: Profile & Logout */}
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-2.5 bg-[#0B141A]/80 border border-[#202C33] px-3 py-1.5 rounded-xl">
              <div className="size-7 rounded-full bg-[#128C7E]/20 border border-[#25D366]/30 flex items-center justify-center text-[#25D366]">
                <User className="size-3.5" />
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-slate-200 leading-tight">{user.name}</p>
                <p className="text-[10px] text-teal-400/80 leading-tight">{user.email}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-2.5 rounded-xl bg-[#111B21] hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 border border-[#202C33] hover:border-rose-500/30 transition-all duration-200 flex items-center justify-center"
              title="Logout"
            >
              <LogOut className="size-4" />
            </button>
          </div>

          {/* Mobile Hamburger Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-[#111B21] border border-[#202C33] text-slate-400 hover:text-white"
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-[#202C33] bg-[#111B21]/95 backdrop-blur-xl px-4 pt-2 pb-4 space-y-3">
            <nav className="space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`
                      flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all
                      ${isActive 
                        ? "bg-[#075E54] text-[#25D366]" 
                        : "text-slate-400 hover:bg-[#0B141A] hover:text-slate-200"}
                    `}
                  >
                    <Icon className="size-4" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <div className="pt-3 border-t border-[#202C33] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="size-7 rounded-full bg-[#128C7E]/20 border border-[#25D366]/30 flex items-center justify-center text-[#25D366]">
                  <User className="size-3.5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-200">{user.name}</p>
                  <p className="text-[10px] text-teal-400/80">{user.email}</p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold rounded-lg border border-rose-500/20 flex items-center gap-1.5"
              >
                <LogOut className="size-3.5" /> Logout
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Page Body Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}


