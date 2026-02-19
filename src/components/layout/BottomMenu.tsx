import { Link, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    Users,
    Calendar,
    Kanban,
    DollarSign,
    Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
    { icon: LayoutDashboard, label: "Dash", href: "/" },
    { icon: Users, label: "Clientes", href: "/clients" },
    { icon: Calendar, label: "Agenda", href: "/agenda" },
    { icon: Kanban, label: "Leads", href: "/leads" },
    { icon: Receipt, label: "Pix", href: "/transactions" },
    { icon: DollarSign, label: "Fin.", href: "/financial" },
];

export function BottomMenu() {
    const location = useLocation();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 h-[60px] bg-white border-t border-border flex items-center justify-around shadow-[0_-2px_10px_rgba(0,0,0,0.08)] md:hidden">
            {menuItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                    <Link
                        key={item.href}
                        to={item.href}
                        className={cn(
                            "flex flex-col items-center justify-center w-full h-full gap-1 transition-transform active:scale-95",
                            isActive ? "text-primary" : "text-muted-foreground"
                        )}
                    >
                        <item.icon
                            className={cn(
                                "h-6 w-6 transition-all duration-200",
                                isActive ? "scale-110" : "scale-100"
                            )}
                        />
                        {isActive && (
                            <span className="text-[10px] font-medium leading-none animate-in fade-in slide-in-from-bottom-1">
                                {item.label}
                            </span>
                        )}
                    </Link>
                );
            })}
        </nav>
    );
}
