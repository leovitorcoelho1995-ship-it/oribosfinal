import { useState, useEffect, Fragment } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import {
    format,
    addDays,
    subDays,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameDay,
    startOfMonth,
    endOfMonth,
    getDay,
    isToday
} from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Appointment, Professional } from "@/types";
import { useCompany } from "@/contexts/CompanyContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    Plus,
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AppointmentDrawer } from "@/components/agenda/AppointmentDrawer";
import { NewAppointmentModal } from "@/components/agenda/NewAppointmentModal";

type ViewType = 'month' | 'week' | 'day' | 'list';

export default function Agenda() {
    const { companyId } = useCompany();
    const [date, setDate] = useState(new Date());
    const [view, setView] = useState<ViewType>('week');
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(false);

    // Filters
    const [professionals, setProfessionals] = useState<Professional[]>([]);
    const [selectedProfessional, setSelectedProfessional] = useState<string>("all");

    // Modals
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
    const [isNewModalOpen, setIsNewModalOpen] = useState(false);

    useEffect(() => {
        if (companyId) {
            fetchProfessionals();
        }
    }, [companyId]);

    useEffect(() => {
        if (companyId) {
            fetchAppointments();
        }
    }, [companyId, date, view, selectedProfessional]);

    async function fetchProfessionals() {
        const { data } = await supabase
            .from("professionals")
            .select("*")
            .eq("company_id", companyId)
            .eq("active", true);
        setProfessionals(data || []);
    }

    async function fetchAppointments() {
        setLoading(true);

        let startStr, endStr;

        if (view === 'month') {
            const start = startOfMonth(date);
            const end = endOfMonth(date);
            // Needs to cover the grid (start of week of start of month...)
            const gridStart = startOfWeek(start);
            const gridEnd = endOfWeek(end);
            startStr = format(gridStart, "yyyy-MM-dd");
            endStr = format(gridEnd, "yyyy-MM-dd");
        } else if (view === 'week') {
            const start = startOfWeek(date);
            const end = endOfWeek(date);
            startStr = format(start, "yyyy-MM-dd");
            endStr = format(end, "yyyy-MM-dd");
        } else {
            // Day or List
            startStr = format(date, "yyyy-MM-dd");
            endStr = format(date, "yyyy-MM-dd");
        }

        let query = supabase
            .from("appointments")
            .select("*")
            .eq("company_id", companyId)
            .gte("date", startStr)
            .lte("date", endStr);

        if (selectedProfessional && selectedProfessional !== "all") {
            query = query.eq("professional_id", selectedProfessional);
        }

        const { data, error } = await query;

        if (error) {
            toast.error("Erro ao carregar agendamentos");
            console.error(error);
        } else {
            setAppointments(data || []);
        }
        setLoading(false);
    }

    function handleDateChange(direction: 'prev' | 'next') {
        if (view === 'month') {
            setDate(prev => direction === 'prev' ? subDays(startOfMonth(prev), 1) : addDays(endOfMonth(prev), 1));
        } else if (view === 'week') {
            setDate(prev => direction === 'prev' ? subDays(prev, 7) : addDays(prev, 7));
        } else {
            setDate(prev => direction === 'prev' ? subDays(prev, 1) : addDays(prev, 1));
        }
    }

    function handleAppointmentClick(id: string) {
        setSelectedAppointmentId(id);
        setIsDrawerOpen(true);
    }

    // --- RENDERERS ---

    const renderMonthView = () => {
        const start = startOfWeek(startOfMonth(date));
        const end = endOfWeek(endOfMonth(date));
        const days = eachDayOfInterval({ start, end });

        return (
            <div className="grid grid-cols-7 gap-px bg-muted border rounded-md overflow-hidden">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                    <div key={d} className="bg-background p-2 text-center text-xs font-semibold text-muted-foreground">
                        {d}
                    </div>
                ))}
                {days.map(d => {
                    const dayAppointments = appointments.filter(a => isSameDay(new Date(a.date), d));
                    const isCurrMonth = d.getMonth() === date.getMonth();

                    return (
                        <div
                            key={d.toISOString()}
                            className={`bg-background min-h-[100px] p-1 ${!isCurrMonth ? 'bg-muted/30 text-muted-foreground' : ''}`}
                            onClick={() => { setDate(d); setView('day'); }}
                        >
                            <div className={`text-right text-xs p-1 mb-1 ${isToday(d) ? 'bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center ml-auto' : ''}`}>
                                {format(d, "d")}
                            </div>
                            <div className="space-y-1">
                                {dayAppointments.slice(0, 3).map(apt => (
                                    <div
                                        key={apt.id}
                                        className="text-[10px] bg-blue-50 text-blue-700 px-1 py-0.5 rounded truncate cursor-pointer hover:bg-blue-100"
                                        onClick={(e) => { e.stopPropagation(); handleAppointmentClick(apt.id); }}
                                    >
                                        {apt.time.slice(0, 5)} {apt.client_name}
                                    </div>
                                ))}
                                {dayAppointments.length > 3 && (
                                    <div className="text-[10px] text-muted-foreground text-center">
                                        + {dayAppointments.length - 3} mais
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderWeekView = () => {
        const start = startOfWeek(date);
        const days = Array.from({ length: 7 }).map((_, i) => addDays(start, i));
        const hours = Array.from({ length: 13 }).map((_, i) => i + 8); // 08:00 to 20:00

        return (
            <ScrollArea className="h-[600px] border rounded-md">
                <div className="grid grid-cols-8 min-w-[800px]">
                    {/* Header Row */}
                    <div className="sticky top-0 bg-background z-10 border-b p-2"></div>
                    {days.map(d => (
                        <div key={d.toISOString()} className={`sticky top-0 bg-background z-10 border-b p-2 text-center border-l ${isToday(d) ? 'bg-primary/5' : ''}`}>
                            <div className="text-xs text-muted-foreground">{format(d, "EEE", { locale: ptBR })}</div>
                            <div className={`text-sm font-bold ${isToday(d) ? 'text-primary' : ''}`}>{format(d, "d")}</div>
                        </div>
                    ))}

                    {/* Time Rows */}
                    {hours.map(hour => (
                        <Fragment key={hour}>
                            <div className="p-2 text-xs text-muted-foreground text-center border-r -mt-2.5 bg-background">
                                {hour}:00
                            </div>
                            {days.map(d => {
                                const dayAppointments = appointments.filter(a => {
                                    const apptDate = new Date(a.date);
                                    const apptHour = parseInt(a.time.split(':')[0]);
                                    return isSameDay(apptDate, d) && apptHour === hour;
                                });

                                return (
                                    <div key={d.toISOString() + hour} className="border-b border-l min-h-[60px] relative hover:bg-muted/10">
                                        {dayAppointments.map(apt => (
                                            <div
                                                key={apt.id}
                                                className="absolute inset-x-1 top-1 bg-blue-100 text-blue-700 text-[10px] p-1 rounded shadow-sm border border-blue-200 overflow-hidden cursor-pointer hover:bg-blue-200 z-10"
                                                style={{ height: `${(apt.duration_minutes || 60) * 0.8}px` }} // Rough scaling
                                                onClick={() => handleAppointmentClick(apt.id)}
                                            >
                                                <strong>{apt.time.slice(0, 5)}</strong> {apt.client_name}
                                            </div>
                                        ))}
                                    </div>
                                );
                            })}
                        </Fragment>
                    ))}
                </div>
            </ScrollArea>
        );
    };

    const renderDayView = () => {
        // Simple list for day view sorted by time
        const dayAppointments = appointments.sort((a, b) => a.time.localeCompare(b.time));

        return (
            <div className="space-y-2">
                {dayAppointments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-muted-foreground border rounded-md border-dashed">
                        <CalendarIcon className="h-10 w-10 mb-4 opacity-20" />
                        <p>Nenhum agendamento para hoje.</p>
                        <Button variant="link" onClick={() => setIsNewModalOpen(true)}>Agendar Novo</Button>
                    </div>
                ) : (
                    dayAppointments.map(apt => (
                        <div
                            key={apt.id}
                            className="flex items-center gap-4 p-4 border rounded-md hover:bg-muted/50 cursor-pointer transition-colors bg-card shadow-sm"
                            onClick={() => handleAppointmentClick(apt.id)}
                        >
                            <div className="flex flex-col items-center min-w-[60px]">
                                <span className="text-xl font-bold text-primary">{apt.time.slice(0, 5)}</span>
                                <span className="text-xs text-muted-foreground">{apt.duration_minutes} min</span>
                            </div>
                            <div className="h-10 w-1 bg-primary/20 rounded-full" />
                            <div className="flex-1">
                                <h4 className="font-semibold">{apt.client_name}</h4>
                                <p className="text-sm text-muted-foreground">{apt.service_id ? 'Serviço ID: ' + apt.service_id : apt.title}</p>
                            </div>
                            <div className="text-right">
                                <Badge variant="outline" className={
                                    apt.status === 'confirmed' ? 'bg-green-50 text-green-700 border-green-200' :
                                        apt.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-200' :
                                            'bg-blue-50 text-blue-700 border-blue-200'
                                }>
                                    {apt.status === 'confirmed' ? 'Confirmado' : apt.status === 'cancelled' ? 'Cancelado' : 'Agendado'}
                                </Badge>
                                <div className="text-xs text-muted-foreground mt-1">{professionals.find(p => p.id === apt.professional_id)?.name}</div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        );
    };

    return (
        <AppLayout title="Agenda">
            <div className="space-y-4">
                {/* Header Controls */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-4 rounded-lg border shadow-sm">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center bg-muted rounded-md p-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => handleDateChange('prev')}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="px-3 font-semibold min-w-[140px] text-center text-sm">
                                {view === 'month' ? format(date, "MMMM yyyy", { locale: ptBR }) :
                                    view === 'week' ? `Semana de ${format(startOfWeek(date), "dd/MM")}` :
                                        format(date, "dd 'de' MMMM", { locale: ptBR })}
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => handleDateChange('next')}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setDate(new Date())}>Hoje</Button>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <Select
                            value={selectedProfessional}
                            onValueChange={setSelectedProfessional}
                        >
                            <SelectTrigger className="w-[180px] h-9">
                                <SelectValue placeholder="Profissional" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                {professionals.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <div className="flex bg-muted rounded-md p-1">
                            <Button
                                variant={view === 'month' ? 'default' : 'ghost'}
                                size="sm"
                                className="h-7 px-3 text-xs"
                                onClick={() => setView('month')}
                            >
                                Mês
                            </Button>
                            <Button
                                variant={view === 'week' ? 'default' : 'ghost'}
                                size="sm"
                                className="h-7 px-3 text-xs"
                                onClick={() => setView('week')}
                            >
                                Semana
                            </Button>
                            <Button
                                variant={view === 'day' ? 'default' : 'ghost'}
                                size="sm"
                                className="h-7 px-3 text-xs"
                                onClick={() => setView('day')}
                            >
                                Dia
                            </Button>
                        </div>

                        <Button className="h-9" onClick={() => setIsNewModalOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" /> Novo
                        </Button>
                    </div>
                </div>

                {/* Main Calendar View */}
                <div className="bg-card rounded-lg border shadow-sm p-4 min-h-[600px]">
                    {view === 'month' && renderMonthView()}
                    {view === 'week' && renderWeekView()}
                    {view === 'day' && renderDayView()}
                </div>
            </div>

            <AppointmentDrawer
                appointmentId={selectedAppointmentId}
                open={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                onUpdate={fetchAppointments}
            />

            <NewAppointmentModal
                open={isNewModalOpen}
                onClose={() => setIsNewModalOpen(false)}
                onCreated={fetchAppointments}
            />
        </AppLayout>
    );
}
