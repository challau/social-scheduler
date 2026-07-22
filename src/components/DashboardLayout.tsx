import { useState, useEffect } from "react";
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
  User,
  Sun,
  Moon
} from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    return (localStorage.getItem("app_theme") as "dark" | "light") || "dark";
  });

  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || '{"name":"Creator User","email":"creator@socialflow.ai"}');

  useEffect(() => {
    localStorage.setItem("app_theme", theme);
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === "dark" ? "light" : "dark"));
  };

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

  const isDark = theme === "dark";

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${
      isDark ? "bg-[#090D16] text-slate-100" : "bg-[#F8FAFC] text-slate-900"
    }`}>
      {/* Horizontal Top Navigation Header */}
      <header className={`sticky top-0 z-50 backdrop-blur-xl border-b transition-colors duration-300 ${
        isDark ? "bg-[#111827]/90 border-slate-800/80" : "bg-white/90 border-slate-200"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Logo & Brand matching #pricing branding */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="bg-gradient-to-tr from-red-600 to-red-500 p-2 rounded-xl shadow-lg shadow-red-500/20">
              <Sparkles className="size-4.5 text-white" />
            </div>
            <span className={`font-extrabold text-lg bg-gradient-to-r ${
              isDark ? "from-white via-slate-200 to-red-300" : "from-slate-900 via-slate-800 to-red-600"
            } bg-clip-text text-transparent tracking-tight`}>
              SocialFlow AI
            </span>
          </Link>

          {/* Desktop Horizontal Navigation Links */}
          <nav className={`hidden md:flex items-center gap-1.5 p-1.5 rounded-2xl border transition-colors ${
            isDark ? "bg-slate-950/60 border-slate-800/80" : "bg-slate-100 border-slate-200"
          }`}>
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
                      ? "bg-gradient-to-r from-red-600 to-red-500 text-white shadow-md shadow-red-500/20" 
                      : isDark ? "text-slate-400 hover:text-slate-100 hover:bg-slate-900" : "text-slate-600 hover:text-slate-900 hover:bg-white"}
                  `}
                >
                  <Icon className="size-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Right Side: Theme Switcher, Profile & Logout */}
          <div className="hidden md:flex items-center gap-3">
            {/* Dark / Light Mode Toggle Button */}
            <button
              onClick={toggleTheme}
              className={`p-2.5 rounded-xl border transition-all duration-200 flex items-center justify-center ${
                isDark 
                  ? "bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800" 
                  : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
              }`}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? <Sun className="size-4 text-amber-400" /> : <Moon className="size-4 text-slate-700" />}
            </button>

            {/* Profile pill */}
            <div className={`flex items-center gap-2.5 border px-3 py-1.5 rounded-xl transition-colors ${
              isDark ? "bg-slate-950/60 border-slate-800" : "bg-slate-100 border-slate-200"
            }`}>
              <div className="size-7 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
                <User className="size-3.5" />
              </div>
              <div className="text-left">
                <p className={`text-xs font-semibold leading-tight ${isDark ? "text-slate-200" : "text-slate-800"}`}>{user.name}</p>
                <p className={`text-[10px] leading-tight ${isDark ? "text-slate-500" : "text-slate-500"}`}>{user.email}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className={`p-2.5 rounded-xl border transition-all duration-200 flex items-center justify-center ${
                isDark 
                  ? "bg-slate-900 border-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10" 
                  : "bg-white border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50"
              }`}
              title="Logout"
            >
              <LogOut className="size-4" />
            </button>
          </div>

          {/* Mobile Menu & Theme Toggle */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-xl border ${
                isDark ? "bg-slate-900 border-slate-800 text-amber-400" : "bg-slate-100 border-slate-200 text-slate-700"
              }`}
            >
              {isDark ? <Sun className="size-4 text-amber-400" /> : <Moon className="size-4 text-slate-700" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`p-2 rounded-xl border ${
                isDark ? "bg-slate-900 border-slate-800 text-slate-400" : "bg-slate-100 border-slate-200 text-slate-700"
              }`}
            >
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className={`md:hidden border-b px-4 pt-2 pb-4 space-y-3 transition-colors ${
            isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-lg"
          }`}>
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
                        ? "bg-red-500 text-white" 
                        : isDark ? "text-slate-400 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-100"}
                    `}
                  >
                    <Icon className="size-4" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <div className={`pt-3 border-t flex items-center justify-between ${isDark ? "border-slate-800" : "border-slate-200"}`}>
              <div className="flex items-center gap-2.5">
                <div className="size-7 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
                  <User className="size-3.5" />
                </div>
                <div>
                  <p className={`text-xs font-semibold ${isDark ? "text-slate-200" : "text-slate-800"}`}>{user.name}</p>
                  <p className="text-[10px] text-slate-500">{user.email}</p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-xs font-semibold rounded-lg border border-rose-500/20 flex items-center gap-1.5"
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



