import { Link, NavLink, Outlet } from "react-router-dom";
import { BarChart3, Database, FileText, LogOut, MessageSquare, Users } from "lucide-react";
import { BrandLogo } from "../BrandLogo";
import { ThemeToggle } from "../ThemeToggle";
import { Button } from "../ui/button";
import { useAuth } from "../../features/auth/AuthProvider";
import { cn } from "../../utils/cn";

const adminLinks = [
  { to: "/admin", label: "Overview", icon: BarChart3 },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/chats", label: "Chats", icon: MessageSquare },
  { to: "/admin/documents", label: "Documents", icon: FileText },
  { to: "/admin/usage", label: "Usage", icon: Database },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
];

export function AdminLayout() {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link to="/dashboard" className="text-lg font-semibold">
            <BrandLogo variant="company" label="Nexora Admin" />
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/dashboard" className="text-sm font-medium text-primary hover:underline">Workspace</Link>
            <ThemeToggle />
            <Button variant="ghost" size="icon" aria-label="Sign out" onClick={logout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 md:grid-cols-[220px_1fr]">
        <nav className="space-y-1">
          {adminLinks.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/admin"}
              className={({ isActive }) =>
                cn(
                  "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
                  isActive && "bg-muted text-foreground",
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <Outlet />
      </div>
    </div>
  );
}
