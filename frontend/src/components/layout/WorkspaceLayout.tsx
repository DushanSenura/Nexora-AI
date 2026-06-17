import { Link, NavLink, Outlet } from "react-router-dom";
import {
  Bot,
  FileText,
  History,
  LayoutDashboard,
  MessageSquare,
  LogOut,
  Settings,
} from "lucide-react";
import { BrandLogo } from "../BrandLogo";
import { Button } from "../ui/button";
import { useAuth } from "../../features/auth/AuthProvider";
import { cn } from "../../utils/cn";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/chat", label: "Chat", icon: MessageSquare },
  { to: "/documents", label: "Documents", icon: FileText },
  { to: "/agents", label: "Agents", icon: Bot },
  { to: "/history", label: "History", icon: History },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function WorkspaceLayout() {
  const { logout, user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r bg-card md:block">
        <Link to="/dashboard" className="flex h-16 items-center border-b px-5 text-lg font-semibold">
          <BrandLogo label="Nexora AI" />
        </Link>
        <nav className="space-y-1 p-3">
          {links.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
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
      </aside>
      <div className="md:pl-64">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-card px-4 md:px-8">
          <div className="min-w-0">
            <div className="text-sm font-medium text-muted-foreground">Workspace</div>
            {user ? <div className="truncate text-xs text-muted-foreground">{user.email}</div> : null}
          </div>
          <div className="flex items-center gap-2">
            {user?.role === "admin" ? (
              <Link to="/admin" className="text-sm font-medium text-primary hover:underline">Admin</Link>
            ) : null}
            <Button variant="ghost" size="icon" aria-label="Sign out" onClick={logout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>
        <div className="p-4 md:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
