import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  FileBarChart,
  QrCode,
  History,
  LogOut,
  Menu,
  X,
  Sparkles,
} from "lucide-react";
import { useState } from "react";

const navItems = {
  admin: [
    { to: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/admin/meetings", icon: CalendarDays, label: "Meetings" },
    { to: "/admin/members", icon: Users, label: "Members" },
    { to: "/admin/reports", icon: FileBarChart, label: "Reports" },
  ],
  pr: [{ to: "/pr", icon: QrCode, label: "QR Display" }],
  member: [{ to: "/member", icon: History, label: "My Attendance" }],
};

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const items = navItems[user?.role] || [];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const roleBadge = {
    admin: "bg-red-500/20 text-red-300 border border-red-500/20",
    pr: "bg-blue-500/20 text-blue-300 border border-blue-500/20",
    member: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/20",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-indigo-50/30 flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full relative overflow-hidden">
          {/* Decorative gradient orb */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Logo */}
          <div className="p-5 border-b border-white/[0.06] relative">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25 animate-glow">
                <QrCode className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-white font-bold text-lg leading-tight tracking-tight">
                  QR Attend
                </h1>
                <p className="text-slate-500 text-[11px] font-medium tracking-wide uppercase">
                  Attendance Portal
                </p>
              </div>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="flex-1 p-3 space-y-0.5 mt-2">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={
                  item.to === "/admin" ||
                  item.to === "/pr" ||
                  item.to === "/member"
                }
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `group flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-indigo-500/90 to-indigo-600/90 text-white shadow-lg shadow-indigo-500/20"
                      : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
                  }`
                }
              >
                <item.icon className="w-[18px] h-[18px] transition-transform duration-200 group-hover:scale-110" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* User Info + Logout */}
          <div className="p-4 border-t border-white/[0.06] relative">
            <div className="flex items-center gap-3 mb-3 p-2 rounded-xl bg-white/[0.04]">
              <div className="w-9 h-9 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-purple-500/20">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">
                  {user?.name}
                </p>
                <span
                  className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold capitalize tracking-wide ${
                    roleBadge[user?.role] ||
                    "bg-slate-500/20 text-slate-400 border border-slate-500/20"
                  }`}
                >
                  {user?.role}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-200"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Backdrop for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden animate-backdrop"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-4 lg:px-8 h-16 flex items-center justify-between sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-xl hover:bg-slate-100 active:scale-95 transition-all"
          >
            <Menu className="w-5 h-5 text-slate-600" />
          </button>

          <div className="lg:hidden" />

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-full border border-indigo-100/60">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span className="text-xs font-medium text-indigo-600">
                Welcome, {user?.name}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8 animate-fade-in">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
