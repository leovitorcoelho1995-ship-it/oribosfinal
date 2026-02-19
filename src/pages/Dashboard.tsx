import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Plus, Users, Wallet, Calendar as CalendarIcon, ArrowRight, Clock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Appointment, Lead } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, isToday, isTomorrow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { useCompany } from "@/contexts/CompanyContext";

export default function Dashboard() {
    const { companyId } = useCompany();
    const navigate = useNavigate();
    const [appointmentsToday, setAppointmentsToday] = useState<Appointment[]>([]);
    const [nextAppointments, setNextAppointments] = useState<Appointment[]>([]);
    const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
    const [stats, setStats] = useState({
        appointmentsToday: 0,
        activeLeads: 0,
        activeClients: 0,
        monthlyRevenue: 0 // Placeholder
    });

    useEffect(() => {
        if (companyId) {
            fetchDashboardData();
        }
    }, [companyId]);

    async function fetchDashboardData() {
        const todayStr = new Date().toISOString().split('T')[0];

        // 1. Appointments Today
        const { data: todayAppts } = await supabase
            .from('appointments')
            .select('*, professionals(name), services(name)')
            .eq('company_id', companyId)
            .eq('date', todayStr)
            .order('time', { ascending: true });

        // 2. Next Appointments (Next 7 days, excluding today)
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        const nextWeekStr = nextWeek.toISOString().split('T')[0];

        const { data: nextAppts } = await supabase
            .from('appointments')
            .select('*, professionals(name), services(name)')
            .eq('company_id', companyId)
            .gt('date', todayStr)
            .lte('date', nextWeekStr)
            .order('date', { ascending: true })
            .order('time', { ascending: true })
            .limit(5);

        // 3. Stats
        const { count: clientsCount } = await supabase
            .from('clients')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', companyId)
            .eq('status', 'active');

        const { count: leadsCount } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', companyId)
            .neq('stage', 'ganho')
            .neq('stage', 'perdido');

        // Recent Leads
        const { data: leads } = await supabase
            .from('leads')
            .select('*')
            .eq('company_id', companyId)
            .order('created_at', { ascending: false })
            .limit(5);

        setAppointmentsToday(todayAppts || []);
        setNextAppointments(nextAppts || []);
        setRecentLeads(leads || []);
        setStats({
            appointmentsToday: todayAppts?.length || 0,
            activeLeads: leadsCount || 0,
            activeClients: clientsCount || 0,
            monthlyRevenue: 0
        });
    }

    return (
        <AppLayout
            title="Dashboard"
            headerAction={
                <Button size="sm" onClick={() => navigate('/agenda')}>
                    <Plus className="mr-2 h-4 w-4" /> Novo Agendamento
                </Button>
            }
        >
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Agendamentos Hoje</CardTitle>
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.appointmentsToday}</div>
                        <p className="text-xs text-muted-foreground">
                            {nextAppointments.length} para os próximos dias
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Leads Ativos</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.activeLeads}</div>
                        <p className="text-xs text-muted-foreground">
                            Em negociação
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.activeClients}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Faturamento Estimado</CardTitle>
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">R$ --</div>
                        <p className="text-xs text-muted-foreground">Este mês (Em breve)</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Agenda Column (Main) */}
                <Card className="col-span-4">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle>Agenda de Hoje</CardTitle>
                            <CardDescription>
                                {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
                            </CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => navigate('/agenda')}>Ver completa <ArrowRight className="ml-2 h-4 w-4" /></Button>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {appointmentsToday.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground text-sm border border-dashed rounded-md">
                                    Nenhum agendamento para hoje.
                                </div>
                            ) : (
                                appointmentsToday.map((appt) => (
                                    <div key={appt.id} className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="flex flex-col items-center min-w-[3rem] bg-primary/10 p-2 rounded text-primary">
                                                <span className="font-bold">{appt.time.slice(0, 5)}</span>
                                            </div>
                                            <div>
                                                <p className="font-medium">{appt.client_name}</p>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <span>{appt.services?.name || appt.title}</span>
                                                    <span>•</span>
                                                    <span>{appt.professionals?.name}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <Badge variant={appt.status === 'confirmed' ? 'default' : 'secondary'}>
                                            {appt.status}
                                        </Badge>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Sidebar Column (Next Appts + Leads) */}
                <div className="col-span-3 space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Próximos Agendamentos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {nextAppointments.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">Sem agendamentos futuros.</p>
                                ) : (
                                    nextAppointments.map((appt) => (
                                        <div key={appt.id} className="flex items-start gap-3 text-sm pb-3 border-b last:border-0">
                                            <CalendarIcon className="h-4 w-4 text-muted-foreground mt-0.5" />
                                            <div className="flex-1">
                                                <p className="font-medium">
                                                    {isTomorrow(new Date(appt.date)) ? 'Amanhã' : format(new Date(appt.date), 'dd/MM')} às {appt.time.slice(0, 5)}
                                                </p>
                                                <p className="text-muted-foreground text-xs">{appt.client_name} - {appt.services?.name}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Novos Leads</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {recentLeads.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">Nenhum lead recente.</p>
                                ) : (
                                    recentLeads.map((lead) => (
                                        <div key={lead.id} className="flex items-center justify-between pb-3 border-b last:border-0">
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium leading-none">{lead.name}</p>
                                                <p className="text-xs text-muted-foreground">{lead.phone}</p>
                                            </div>
                                            <Badge variant="outline" className="text-[10px]">{lead.stage}</Badge>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
