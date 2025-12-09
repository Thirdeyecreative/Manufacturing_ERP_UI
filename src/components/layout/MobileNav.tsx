import React, { useState } from "react";
import {
  Menu,
  X,
  Package,
  Users,
  Warehouse,
  Factory,
  ClipboardCheck,
  BarChart3,
  Settings,
  ShoppingBag,
  Box,
  LogIn,
  ArrowLeftRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLocation, Link } from "react-router-dom";
import logo from "../../../public/space.jpg";

// --- Sidebar Content ---
const navigation = [
  { name: "Dashboard", icon: BarChart3, href: "/", current: false },
  { name: "Master Data", icon: Settings, href: "/master", current: false },
  { name: "Employees", icon: Users, href: "/employees", current: false },
  { name: "Vendors", icon: Users, href: "/vendors", current: false },
  { name: "Raw Materials", icon: Box, href: "/raw-materials", current: false },
  {
    name: "Finished Goods",
    icon: ShoppingBag,
    href: "/finished-goods",
    current: false,
  },
  { name: "Purchases", icon: Package, href: "/purchases", current: false },
  { name: "Production", icon: Factory, href: "/production", current: false },
  { name: "Dispatch", icon: Warehouse, href: "/dispatch", current: false },
  { name: "Clients", icon: Users, href: "/clients", current: false },
  {
    name: "Quality Control",
    icon: ClipboardCheck,
    href: "/qc",
    current: false,
  },
  {
    name: "Stock Transaction",
    icon: ArrowLeftRight,
    href: "/stock-transection",
    current: false,
  },
  { name: "Reports", icon: BarChart3, href: "/reports", current: false },
  { name: "Settings", icon: Settings, href: "/settings", current: false },
];

export function MobileNav() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const location = useLocation();

  return (
    <>
      {/* Hamburger Menu Button - visible only on mobile/tablet */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden h-8 w-8" // Hides on large screens
        onClick={() => setIsMobileNavOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* --- Full-Screen Mobile Navigation Menu --- */}
      {isMobileNavOpen && (
        <div className="fixed inset-0 z-50 bg-card flex flex-col lg:hidden">
          {/* Mobile Nav Header */}
          <div className="flex h-16 items-center justify-between border-b border-border px-4">
            <Link to="/" onClick={() => setIsMobileNavOpen(false)}>
              <img
                src={logo}
                alt="logo"
                className="h-12 sm:h-14 w-auto"
                onError={(e) =>
                  (e.currentTarget.src =
                    "https/placehold.co/192x56/000000/FFF?text=Space+Logo")
                }
              />
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileNavOpen(false)}
              className="h-8 w-8"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Mobile Navigation Links */}
          <nav className="flex-1 px-2 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMobileNavOpen(false)} // Close on navigate
                >
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full h-11 flex items-center justify-start gap-2 px-3 my-1  rounded-lg transition-all",
                      isActive
                        ? "bg-primary/10 text-primary border-primary/40 hover:bg-primary/20"
                        : "border-gray-200 hover:bg-gray-50"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-sm font-medium">{item.name}</span>
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* Mobile Nav Footer (User/Login) */}
          <div className="p-2 border-t border-border space-y-2">
            {localStorage.getItem("token") ? (
              <Link to="/login" onClick={() => setIsMobileNavOpen(false)}>
                <Button
                  variant="outline"
                  className="w-full flex h-11 items-center justify-start gap-3 px-3"
                  onClick={(e) => {
                    localStorage.clear();
                  }}
                >
                  <LogIn className="h-5 w-5" />
                  <span>Logout</span>
                </Button>
              </Link>
            ) : (
              <Link to="/login" onClick={() => setIsMobileNavOpen(false)}>
                <Button
                  variant="outline"
                  className="w-full h-11 justify-start gap-3 px-3"
                >
                  <LogIn className="h-5 w-5" />
                  <span>Login</span>
                </Button>
              </Link>
            )}
            <div className="flex items-center gap-3 mt-4 px-2">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-sm font-medium text-primary">
                  {localStorage.getItem("username")?.charAt(0)}
                  {localStorage
                    .getItem("username")
                    ?.split(" ")
                    ?.pop()
                    ?.charAt(0)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {localStorage.getItem("username")}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  Super Admin
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
