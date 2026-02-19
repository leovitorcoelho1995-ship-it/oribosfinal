import { Menu, Bell, Check, Trash, DollarSign, Users, Calendar, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/contexts/NotificationContext";
import { useState, useRef, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface HeaderProps {
    title: string;
    onMenuClick: () => void;
    children?: React.ReactNode;
    headerAction?: React.ReactNode;
}

export function Header({ title, onMenuClick, children, headerAction }: HeaderProps) {
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <header className="h-[56px] md:h-[60px] border-b flex items-center justify-between px-4 md:px-6 sticky top-0 z-30 bg-primary text-primary-foreground md:bg-white md:text-foreground shadow-sm relative">
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden -ml-2"
                    onClick={onMenuClick}
                >
                    <Menu className="h-6 w-6" />
                </Button>
                <h1 className="text-lg md:text-xl font-semibold">{title}</h1>
            </div>

            <div className="flex items-center gap-4" ref={dropdownRef}>
                {headerAction}
                {children}
                <div className="relative">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground relative"
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        <Bell className="h-5 w-5" />
                        {unreadCount > 0 && (
                            <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full animate-pulse" />
                        )}
                    </Button>

                    {isOpen && (
                        <div className="absolute right-0 top-full mt-2 w-80 md:w-96 bg-white border rounded-md shadow-lg z-[100] overflow-hidden text-foreground">
                            <div className="p-3 border-b flex justify-between items-center bg-muted/50">
                                <h3 className="font-semibold text-sm">Notificações ({unreadCount})</h3>
                                {unreadCount > 0 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 text-xs text-primary hover:text-primary/80"
                                        onClick={() => markAllAsRead()}
                                    >
                                        Marcar todas como lidas
                                    </Button>
                                )}
                            </div>
                            <div className="max-h-[400px] overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-8 text-center text-muted-foreground text-sm">
                                        Nenhuma notificação recente.
                                    </div>
                                ) : (
                                    <div className="divide-y">
                                        {notifications.map((notification) => (
                                            <div
                                                key={notification.id}
                                                className={`p-3 hover:bg-muted/50 transition-colors ${!notification.read ? 'bg-blue-50/50' : ''}`}
                                            >
                                                <div className="flex justify-between items-start gap-3">
                                                    <div className={`mt-1 p-1.5 rounded-full shrink-0 ${notification.type === 'payment_confirmed' ? 'bg-green-100 text-green-600' :
                                                        notification.type === 'new_lead' ? 'bg-purple-100 text-purple-600' :
                                                            notification.type === 'new_appointment' ? 'bg-blue-100 text-blue-600' :
                                                                notification.type === 'appointment_cancelled' ? 'bg-red-100 text-red-600' :
                                                                    'bg-gray-100 text-gray-600'
                                                        }`}>
                                                        {notification.type === 'payment_confirmed' && <DollarSign className="h-4 w-4" />}
                                                        {notification.type === 'new_lead' && <Users className="h-4 w-4" />}
                                                        {notification.type === 'new_appointment' && <Calendar className="h-4 w-4" />}
                                                        {notification.type === 'appointment_cancelled' && <Calendar className="h-4 w-4" />}
                                                        {notification.type === 'payment_overdue' && <AlertCircle className="h-4 w-4" />}
                                                    </div>
                                                    <div className="flex-1 space-y-1">
                                                        <p className={`text-sm ${!notification.read ? 'font-semibold' : 'font-medium'}`}>
                                                            {notification.title}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                                            {notification.body}
                                                        </p>
                                                        <span className="text-[10px] text-muted-foreground capitalize">
                                                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: ptBR })}
                                                        </span>
                                                    </div>
                                                    {!notification.read && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6 text-primary hover:text-primary/80 shrink-0"
                                                            title="Marcar como lida"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                markAsRead(notification.id);
                                                            }}
                                                        >
                                                            <div className="h-2 w-2 bg-primary rounded-full" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
