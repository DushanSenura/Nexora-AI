import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import {
  Bot,
  X,
  FileText,
  History,
  LayoutDashboard,
  Menu,
  MessageSquare,
  LogOut,
  Settings,
} from "lucide-react";
import { BrandLogo } from "../BrandLogo";
import { ThemeToggle } from "../ThemeToggle";
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

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="space-y-1 p-3">
      {links.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          onClick={onNavigate}
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
  );
}

export function WorkspaceLayout() {
  const { logout, user } = useAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r bg-card md:block">
        <Link to="/dashboard" className="flex h-16 items-center border-b px-5 text-lg font-semibold">
          <BrandLogo label="Nexora AI" />
        </Link>
        <SidebarNav />
      </aside>

      {isMobileSidebarOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-foreground/20"
            aria-label="Close navigation"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <aside className="relative h-full w-72 max-w-[85vw] border-r bg-card shadow-lg">
            <div className="flex h-16 items-center justify-between border-b px-4">
              <Link
                to="/dashboard"
                className="text-lg font-semibold"
                onClick={() => setIsMobileSidebarOpen(false)}
              >
                <BrandLogo label="Nexora AI" />
              </Link>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Close navigation"
                onClick={() => setIsMobileSidebarOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <SidebarNav onNavigate={() => setIsMobileSidebarOpen(false)} />
          </aside>
        </div>
      ) : null}

      <div className="md:pl-64">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-card px-4 md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Open navigation"
              onClick={() => setIsMobileSidebarOpen(true)}
            >
              <Menu className="h-4 w-4" />
            </Button>
            <div className="min-w-0">
              <div className="text-sm font-medium text-muted-foreground">Workspace</div>
              {user ? <div className="truncate text-xs text-muted-foreground">{user.email}</div> : null}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user?.role === "admin" ? (
              <Link to="/admin" className="text-sm font-medium text-primary hover:underline">Admin</Link>
            ) : null}
            <ThemeToggle />
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
