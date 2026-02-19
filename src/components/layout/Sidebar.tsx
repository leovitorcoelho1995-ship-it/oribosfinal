import { Link, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    Users,
    Calendar,
    Kanban,
    Receipt,
    DollarSign,
    Settings,
    Building2,
    BarChart3,
    LogOut,
    Headphones,
    Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/contexts/AdminContext";
import { useCompany } from "@/contexts/CompanyContext";
import { Button } from "@/components/ui/button";

const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/", count: null },
    { icon: Users, label: "Clientes", href: "/clients", count: null },
    { icon: Calendar, label: "Agenda", href: "/agenda", count: null },
    { icon: Kanban, label: "Leads", href: "/leads", count: null }, // Example count
    { icon: Receipt, label: "Transações", href: "/transactions", count: null },
    { icon: DollarSign, label: "Financeiro", href: "/financial", count: null },
    { icon: Settings, label: "Configurações", href: "/settings", count: null },
];

interface SidebarProps {
    onSupportClick?: () => void;
}

export function Sidebar({ onSupportClick }: SidebarProps) {
    const location = useLocation();
    const { signOut, user } = useAuth();
    const { isAdmin, impersonating } = useAdmin();
    const { companyName } = useCompany();

    return (
        <aside className="hidden md:flex flex-col w-[360px] h-screen bg-white border-r border-border shrink-0">
            {/* Header */}
            <div className="h-[60px] bg-primary flex items-center justify-between px-4 shrink-0 text-white">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
                        <span className="font-bold text-lg">A</span>
                    </div>
                    <span className="font-semibold text-lg tracking-tight">AutoGestão</span>
                </div>
                {impersonating && (
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded text-white font-medium">
                        {companyName}
                    </span>
                )}
            </div>

            {/* Navigation List */}
            <nav className="flex-1 overflow-y-auto py-2">
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            to={item.href}
                            className={cn(
                                "flex items-center gap-4 px-4 py-3 hover:bg-accent transition-colors border-l-[3px]",
                                isActive
                                    ? "bg-secondary border-primary"
                                    : "bg-transparent border-transparent"
                            )}
                        >
                            <item.icon
                                className={cn(
                                    "h-6 w-6",
                                    isActive ? "text-primary" : "text-muted-foreground"
                                )}
                                style={{ color: isActive ? "var(--primary)" : "#7B4DB8" }}
                            />
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline">
                                    <span className={cn(
                                        "text-[15px] font-medium truncate",
                                        isActive ? "text-foreground" : "text-foreground"
                                    )}>
                                        {item.label}
                                    </span>
                                    {item.count && (
                                        <span className="text-xs font-bold text-destructive">
                                            {item.count}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </Link>
                    );
                })}

                {/* Admin Section */}
                {isAdmin && (
                    <>
                        <div className="px-4 py-3 mt-2">
                            <span className="text-xs font-bold text-primary/70 uppercase tracking-wider">
                                Administração
                            </span>
                        </div>
                        <Link
                            to="/admin/clients"
                            className={cn(
                                "flex items-center gap-4 px-4 py-3 hover:bg-accent transition-colors border-l-[3px]",
                                location.pathname === "/admin/clients"
                                    ? "bg-secondary border-primary"
                                    : "bg-transparent border-transparent"
                            )}
                        >
                            <Building2 className="h-6 w-6 text-[#7B4DB8]" />
                            <span className="text-[15px] font-medium text-foreground">
                                Clientes Oribos
                            </span>
                        </Link>
                        <Link
                            to="/admin/metrics"
                            className={cn(
                                "flex items-center gap-4 px-4 py-3 hover:bg-accent transition-colors border-l-[3px]",
                                location.pathname === "/admin/metrics"
                                    ? "bg-secondary border-primary"
                                    : "bg-transparent border-transparent"
                            )}
                        >
                            <BarChart3 className="h-6 w-6 text-[#7B4DB8]" />
                            <span className="text-[15px] font-medium text-foreground">
                                Métricas
                            </span>
                        </Link>
                        <Link
                            to="/admin/support"
                            className={cn(
                                "flex items-center gap-4 px-4 py-3 hover:bg-accent transition-colors border-l-[3px]",
                                location.pathname === "/admin/support"
                                    ? "bg-secondary border-primary"
                                    : "bg-transparent border-transparent"
                            )}
                        >
                            <Headphones className="h-6 w-6 text-[#7B4DB8]" />
                            <span className="text-[15px] font-medium text-foreground">
                                Suporte
                            </span>
                        </Link>
                        <Link
                            to="/admin/health"
                            className={cn(
                                "flex items-center gap-4 px-4 py-3 hover:bg-accent transition-colors border-l-[3px]",
                                location.pathname === "/admin/health"
                                    ? "bg-secondary border-primary"
                                    : "bg-transparent border-transparent"
                            )}
                        >
                            <Activity className="h-6 w-6 text-[#7B4DB8]" />
                            <span className="text-[15px] font-medium text-foreground">
                                Saúde do Sistema
                            </span>
                        </Link>
                    </>
                )}
            </nav>

            {/* Support Button */}
            {!isAdmin && (
                <div className="px-4 py-2 bg-background border-t border-border">
                    <Button
                        variant="outline"
                        onClick={onSupportClick}
                        className="w-full justify-start gap-4 border-[#7B4DB8]/20 bg-white text-[#7B4DB8] hover:bg-[#7B4DB8]/5"
                    >
                        <Headphones className="h-5 w-5" />
                        Suporte
                    </Button>
                </div>
            )}

            {/* Footer */}
            <div className="h-[68px] bg-muted/30 px-4 flex items-center justify-between border-t border-border shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-primary font-bold text-lg">
                        {user?.email?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground truncate max-w-[180px]">
                            {companyName || "Minha Empresa"}
                        </span>
                        <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                            {user?.email}
                        </span>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => signOut()}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                >
                    <LogOut className="h-5 w-5" />
                </Button>
            </div>
        </aside>
    );
}
