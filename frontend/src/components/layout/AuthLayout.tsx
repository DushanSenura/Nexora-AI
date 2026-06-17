import { Outlet, Link } from "react-router-dom";
import { BrandLogo } from "../BrandLogo";

export function AuthLayout() {
  return (
    <main className="min-h-screen">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/dashboard" className="text-lg font-semibold">
            <BrandLogo label="Nexora AI" />
          </Link>
          <nav className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link to="/pricing" className="hover:text-foreground">Pricing</Link>
            <Link to="/about" className="hover:text-foreground">About</Link>
            <Link to="/login" className="hover:text-foreground">Sign in</Link>
            <Link
              to="/register"
              className="rounded-md