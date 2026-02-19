import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./AuthContext";
import { useCompany } from "./CompanyContext";
import { toast } from "sonner";
import type { Notification } from "@/types";

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    loading: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const { companyId } = useCompany();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    // Audio for notification
    // If strict on assets, we might need a fallback.
    // For now, I'll use a simple Audio object if the URL is valid, or just skip sound if not.

    useEffect(() => {
        if (companyId && user) {
            fetchNotifications();

            const subscription = supabase
                .channel('notifications-changes')
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'notifications',
                        filter: `company_id=eq.${companyId}`
                    },
                    (payload) => {
                        const newNotification = payload.new as Notification;
                        setNotifications(prev => [newNotification, ...prev]);
                        const toastStyles = {
                            new_lead: { color: '#8B5CF6', label: 'Novo Lead' }, // Purple
                            payment_confirmed: { color: '#10B981', label: 'Pagamento' }, // Green
                            new_appointment: { color: '#3B82F6', label: 'Agendamento' }, // Blue
                            appointment_cancelled: { color: '#EF4444', label: 'Cancelamento' }, // Red
                            payment_overdue: { color: '#F59E0B', label: 'Vencimento' }, // Amber
                        };

                        const style = toastStyles[newNotification.type as keyof typeof toastStyles] || { color: '#333', label: 'Notificação' };

                        toast(newNotification.title, {
                            description: newNotification.body,
                            style: { borderLeft: `4px solid ${style.color}` },
                            action: {
                                label: "Ver",
                                onClick: () => console.log("Navigate to", newNotification.reference_table, newNotification.reference_id)
                            }
                        });
                        playNotificationSound();
                    }
                )
                .subscribe();

            return () => {
                subscription.unsubscribe();
            };
        } else {
            setNotifications([]);
            setLoading(false);
        }
    }, [companyId, user]);

    const fetchNotifications = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('company_id', companyId!)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) {
            console.error("Error fetching notifications:", error);
        } else {
            setNotifications(data || []);
        }
        setLoading(false);
    };

    const markAsRead = async (id: string) => {
        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', id);

        if (!error) {
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, read: true } : n)
            );
        }
    };

    const markAllAsRead = async () => {
        const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
        if (unreadIds.length === 0) return;

        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .in('id', unreadIds);

        if (!error) {
            setNotifications(prev =>
                prev.map(n => ({ ...n, read: true }))
            );
        }
    };

    const playNotificationSound = () => {
        try {
            // Using a simple beep or encoded generic sound if file doesn't exist?
            // Or just try to play.
            const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/951/951-preview.mp3"); // Generic subtle notification sound URL for demo
            audio.volume = 0.5;
            audio.play().catch(e => console.error("Audio play failed", e));
        } catch (e) {
            console.error("Error playing sound", e);
        }
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, loading }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error("useNotifications must be used within a NotificationProvider");
    }
    return context;
}
