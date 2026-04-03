import { LayoutDashboard, Users, CreditCard, GraduationCap, BarChart3, Settings, Menu, X, LogOut, ChevronRight, Bell, Search, Sun, Moon, Plus, ChevronLeft } from "lucide-react";
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/context/ThemeContext";
import { useFirebase } from "@/context/FirebaseContext";
import { Breadcrumbs } from "./Breadcrumbs";
import { GECLogo } from "./GECLogo";
import { LogIn } from "lucide-react";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

const navItems = [
  { name: "Dashboard", path: "/", icon: LayoutDashboard, color: "text-blue-500", activeBg: "bg-white/10" },
  { name: "Membership", path: "/membership", icon: Users, color: "text-emerald-500", activeBg: "bg-white/10" },
  { name: "Financials", path: "/financials", icon: CreditCard, color: "text-amber-500", activeBg: "bg-white/10" },
  { name: "Sunday School", path: "/groups", icon: GraduationCap, color: "text-purple-500", activeBg: "bg-white/10" },
  { name: "Reporting", path: "/reporting", icon: BarChart3, color: "text-rose-500", activeBg: "bg-white/10" },
  { name: "Settings", path: "/settings", icon: Settings, color: "text-slate-400", activeBg: "bg-white/10" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const { user, loading, isAdmin, login, logout } = useFirebase();

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm font-medium text-muted-foreground animate-pulse">Loading GEC CMS...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-muted/30 p-4">
        <div className="w-full max-w-md space-y-8 rounded-2xl bg-card p-8 shadow-2xl border border-border">
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary p-3 shadow-lg shadow-primary/20 mb-4">
              <GECLogo className="h-full w-full object-contain text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">GEC CMS</h1>
            <p className="text-muted-foreground">Church Management System</p>
          </div>
          
          <div className="space-y-4">
            <Button 
              onClick={login} 
              className="w-full h-12 text-lg font-semibold gap-3 shadow-md hover:shadow-lg transition-all"
            >
              <LogIn className="h-5 w-5" />
              Sign in with Google
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Authorized personnel only. Please sign in to continue.
            </p>
          </div>
          
          <div className="pt-8 text-center">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50">
              Global Evangelical Church
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex h-screen overflow-hidden bg-background text-foreground">
        {/* Mobile Sidebar Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex flex-col bg-navy text-white transition-all duration-300 ease-in-out lg:static border-r border-white/5",
            isSidebarOpen ? "w-64" : "w-20",
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          )}
        >
          <div className={cn(
            "flex h-16 items-center px-4 bg-navy-light/30",
            isSidebarOpen ? "justify-between" : "justify-center"
          )}>
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white p-1 shadow-lg shadow-navy/10">
                <GECLogo className="h-full w-full object-contain text-navy" />
              </div>
              {isSidebarOpen && (
                <div className="flex flex-col overflow-hidden whitespace-nowrap">
                  <span className="text-lg font-bold tracking-tight text-white leading-tight">GEC CMS</span>
                  <span className="text-[10px] font-medium uppercase tracking-widest text-white/50">Church Management</span>
                </div>
              )}
            </div>
            {isSidebarOpen && (
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="text-white/60 hover:text-white hover:bg-white/10"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="lg:hidden text-white/60 hover:text-white hover:bg-white/10"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            )}
            {!isSidebarOpen && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarOpen(true)}
                className="absolute -right-4 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-navy border border-white/10 text-white shadow-xl z-50 hover:bg-navy-light lg:flex hidden items-center justify-center"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>

          <Separator className="bg-white/10" />

          <ScrollArea className="flex-1 px-3 py-6">
            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                const content = (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 relative group overflow-hidden",
                      isActive
                        ? "bg-gradient-to-r from-white/15 to-transparent text-white shadow-sm"
                        : "text-white/60 hover:bg-white/5 hover:text-white",
                      !isSidebarOpen && "justify-center px-0"
                    )}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                    )}
                    <item.icon className={cn("h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110", isActive ? "text-white" : item.color)} />
                    {isSidebarOpen && <span>{item.name}</span>}
                  </Link>
                );

                if (!isSidebarOpen) {
                  return (
                    <React.Fragment key={item.name}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          {content}
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          {item.name}
                        </TooltipContent>
                      </Tooltip>
                    </React.Fragment>
                  );
                }
                return content;
              })}
            </nav>
          </ScrollArea>

          <Separator className="bg-white/10" />

          <div className="p-4 bg-navy-light/20">
            <div className={cn("flex items-center gap-3", !isSidebarOpen && "justify-center")}>
              <Avatar className="h-9 w-9 border border-white/20">
                <AvatarImage src={user.photoURL || "https://github.com/shadcn.png"} />
                <AvatarFallback className="bg-navy-light text-white">
                  {user.displayName?.split(' ').map(n => n[0]).join('') || 'U'}
                </AvatarFallback>
              </Avatar>
              {isSidebarOpen && (
                <div className="flex flex-col overflow-hidden">
                  <span className="truncate text-sm font-semibold">{user.displayName}</span>
                  <span className="truncate text-xs text-white/60">{user.email}</span>
                </div>
              )}
            </div>
            {isSidebarOpen && (
              <Button
                variant="ghost"
                onClick={logout}
                className="mt-4 w-full justify-start gap-3 text-white/70 hover:bg-white/10 hover:text-white"
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </Button>
            )}
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Top Navigation Bar */}
          <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background px-4 lg:px-8 shadow-sm">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
              
              {/* Logo for mobile */}
              <div className="flex items-center gap-2 lg:hidden">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white p-1 shadow-sm">
                  <GECLogo className="h-full w-full object-contain text-navy" />
                </div>
                <span className="font-bold text-primary">GEC CMS</span>
              </div>

              {/* Search Bar */}
              <div className="relative hidden md:block w-64 lg:w-96">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  placeholder="Search members, transactions..." 
                  className="pl-10 bg-muted/50 border-none focus-visible:ring-1"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              {/* Dark Mode Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="text-muted-foreground hover:text-foreground"
              >
                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>

              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
                    <Bell className="h-5 w-5" />
                    <Badge className="absolute -right-1 -top-1 h-4 w-4 justify-center p-0 text-[10px] bg-destructive text-destructive-foreground">
                      3
                    </Badge>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="max-h-[300px] overflow-y-auto p-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="mb-2 rounded-lg p-2 hover:bg-muted transition-colors cursor-pointer">
                        <p className="text-sm font-medium">New member registered</p>
                        <p className="text-xs text-muted-foreground">John Doe joined the church today.</p>
                        <p className="mt-1 text-[10px] text-muted-foreground">2 hours ago</p>
                      </div>
                    ))}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="justify-center text-primary font-medium">
                    View all notifications
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Separator orientation="vertical" className="h-8 hidden sm:block" />

              {/* User Profile */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 px-2 hover:bg-muted">
                    <Avatar className="h-8 w-8 border border-border">
                      <AvatarImage src={user.photoURL || "https://raw.githubusercontent.com/paulekuadzi/gec-cms-assets/main/gec-logo.png"} />
                      <AvatarFallback className="bg-primary text-white">
                        {user.displayName?.split(' ').map(n => n[0]).join('') || 'GEC'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden flex-col items-start text-left sm:flex">
                      <span className="text-sm font-semibold leading-none">{user.displayName}</span>
                      <span className="text-[10px] text-muted-foreground">{isAdmin ? "Administrator" : "User"}</span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Main Content Scrollable */}
          <main className="flex-1 overflow-y-auto bg-muted/30">
            <div className="mx-auto max-w-7xl p-4 lg:p-8">
              <Breadcrumbs />
              {children}
            </div>
          </main>
        </div>

        {/* Floating Action Button */}
        {isAdmin && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                className="fixed bottom-8 right-8 h-14 w-14 rounded-full shadow-2xl z-50 hover:scale-110 transition-transform bg-navy text-white hover:bg-navy-light"
                onClick={() => {
                  // This would typically open a dialog
                  window.dispatchEvent(new CustomEvent('open-quick-add-member'));
                }}
              >
                <Plus className="h-6 w-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              Quick Add Member
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
