import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Baby,
  BookOpen,
  Layers,
  ShieldAlert,
  Database,
  LogOut,
  Sparkles,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Badge } from "../common/Badge";
import { GlobalSearch } from "./GlobalSearch";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close mobile drawer automatically when route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname, location.search]);

  const navItems = [
    { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { label: "Families (Users)", href: "/users", icon: Users },
    { label: "Children & Boards", href: "/children", icon: Baby },
    { label: "Categories & Words", href: "/templates", icon: Layers },
    { label: "Verbs (5 forms)", href: "/verbs", icon: BookOpen },
    { label: "App Content", href: "/content", icon: Database },
    { label: "Security & Audit Logs", href: "/audit-logs", icon: ShieldAlert },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden relative">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Responsive Sidebar (Slide-over drawer on mobile/tablet, fixed on desktop) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 transform transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        <div className="overflow-y-auto flex-1">
          {/* Logo & Header */}
          <div className="h-16 flex items-center justify-between px-5 gap-3 border-b border-slate-800 bg-slate-950/40">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="text-white font-extrabold text-base tracking-wide flex items-center gap-1.5">
                  <span>ANGEL TALK</span>
                </div>
                <div className="text-[10px] uppercase tracking-wider text-indigo-400 font-semibold">
                  Admin Panel
                </div>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              aria-label="Close navigation menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/30 shrink-0">
          <div className="flex items-center justify-between">
            <div className="truncate pr-2">
              <div className="text-xs font-semibold text-slate-200 truncate">
                {user?.fullName || "Admin"}
              </div>
              <div className="text-[11px] text-slate-500 truncate">{user?.email}</div>
              <div className="mt-1">
                <Badge variant={user?.role === "superadmin" ? "purple" : "primary"}>
                  {user?.role}
                </Badge>
              </div>
            </div>
            <button
              onClick={() => logout()}
              title="Sign Out"
              className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center gap-3 sm:gap-6 px-4 sm:px-8 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200 shrink-0"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <GlobalSearch />
          </div>
          <div className="hidden md:block ml-auto text-xs text-slate-500 whitespace-nowrap">
            Signed in as <span className="font-semibold text-slate-700">{user?.fullName || "Admin"}</span>
          </div>
        </header>

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
};


