import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Calendar,
    Clock,
    User,
    Phone,
    MessageSquare,
    CheckCircle2,
    XCircle,
    ExternalLink
} from "lucide-react";
import type { Appointment } from "@/types";
import { useCompany } from "@/contexts/CompanyContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface AppointmentDrawerProps {
    appointmentId: string | null;
    open: boolean;
    onClose: () => void;
    onUpdate: () => void;
}

export function AppointmentDrawer({ appointmentId, open, onClose, onUpdate }: AppointmentDrawerProps) {
    const { companyId } = useCompany();
    const [appointment, setAppointment] = useState<Appointment | null>(null);
    const [professionalName, setProfessionalName] = useState("");
    const [serviceName, setServiceName] = useState("");

    useEffect(() => {
        if (open && appointmentId && companyId) {
            fetchAppointmentDetails();
        } else {
            setAppointment(null);
        }
    }, [open, appointmentId, companyId]);

    async function fetchAppointmentDetails() {
        const { data, error } = await supabase
            .from("appointments")
            .select("*")
            .eq("id", appointmentId)
            .single();

        if (error) {
            toast.error("Erro ao carregar detalhes do agendamento");
            onClose();
        } else {
            setAppointment(data);
            if (data.professional_id) {
                fetchProfessional(data.professional_id);
            }
            if (data.service_id) {
                fetchService(data.service_id);
            }
        }
    }

    async function fetchProfessional(id: string) {
        const { data } = await supabase.from("professionals").select("name").eq("id", id).single();
        if (data) setProfessionalName(data.name);
    }

    async function fetchService(id: string) {
        const { data } = await supabase.from("services").select("name").eq("id", id).single();
        if (data) setServiceName(data.name);
    }

    async function updateStatus(status: Appointment['status']) {
        if (!appointment) return;

        const { error } = await supabase
            .from("appointments")
            .update({ status })
            .eq("id", appointment.id);

        if (error) {
            toast.error("Erro ao atualizar status");
        } else {
            toast.success(`Status atualizado para ${status}`);
            setAppointment({ ...appointment, status });
            onUpdate();
        }
    }

    const statusColors = {
        scheduled: "bg-blue-100 text-blue-800",
        confirmed: "bg-green-100 text-green-800",
        cancelled: "bg-red-100 text-red-800",
        completed: "bg-gray-100 text-gray-800",
    };

    const statusLabels = {
        scheduled: "Agendado",
        confirmed: "Confirmado",
        cancelled: "Cancelado",
        completed: "Concluído",
    };

    if (!appointment) return null;

    return (
        <Sheet open={open} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                <SheetHeader className="mb-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <SheetTitle className="text-xl">{appointment.title}</SheetTitle>
                            <SheetDescription>
                                Detalhes do agendamento
                            </SheetDescription>
                        </div>
                        <Badge variant="outline" className={statusColors[appointment.status] || ""}>
                            {statusLabels[appointment.status]}
                        </Badge>
                    </div>
                </SheetHeader>

                <div className="space-y-6">
                    {/* Time & Date */}
                    <div className="flex gap-4 p-4 bg-muted/30 rounded-lg border">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-muted-foreground" />
                            <span className="font-medium">
                                {format(new Date(appointment.date), "dd 'de' MMMM", { locale: ptBR })}
                            </span>
                        </div>
                        <Separator orientation="vertical" className="h-auto" />
                        <div className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-muted-foreground" />
                            <span className="font-medium">
                                {appointment.time.slice(0, 5)} - {
                                    // Calculate end time roughly or just show start
                                    appointment.duration_minutes ?
                                        (() => {
                                            const [h, m] = appointment.time.split(':').map(Number);
                                            const date = new Date();
                                            date.setHours(h, m + appointment.duration_minutes);
                                            return format(date, "HH:mm");
                                        })() : "..."
                                }
                            </span>
                        </div>
                    </div>

                    {/* Client Info */}
                    <div className="space-y-4">
                        <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Cliente</h4>
                        <div className="flex items-start gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                {appointment.client_name?.charAt(0) || <User className="h-5 w-5" />}
                            </div>
                            <div className="space-y-1">
                                <p className="font-medium">{appointment.client_name}</p>
                                {appointment.phone && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Phone className="h-3 w-3" />
                                        {appointment.phone}
                                        {appointment.remote_jid && (
                                            <a
                                                href={`https://wa.me/${appointment.phone.replace(/\D/g, '')}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-primary hover:underline flex items-center gap-1 text-xs"
                                            >
                                                <ExternalLink className="h-3 w-3" /> WhatsApp
                                            </a>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Service Info */}
                    <div className="space-y-4">
                        <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Serviço & Profissional</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">Serviço</p>
                                <p className="font-medium">{serviceName || "-"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">Profissional</p>
                                <p className="font-medium">{professionalName || "-"}</p>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Notes */}
                    {appointment.notes && (
                        <div className="space-y-2">
                            <h4 className="flex items-center gap-2 font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                                <MessageSquare className="h-4 w-4" /> Notas Internas
                            </h4>
                            <div className="p-3 bg-yellow-50 text-yellow-900 rounded-md text-sm border border-yellow-200">
                                {appointment.notes}
                            </div>
                        </div>
                    )}
                </div>

                <SheetFooter className="mt-8 flex-col sm:flex-row gap-2">
                    {appointment.status !== 'cancelled' && (
                        <Button
                            variant="destructive"
                            className="w-full sm:w-auto mr-auto"
                            onClick={() => updateStatus('cancelled')}
                        >
                            <XCircle className="mr-2 h-4 w-4" />
                            Cancelar
                        </Button>
                    )}

                    {appointment.status === 'scheduled' && (
                        <Button
                            className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
                            onClick={() => updateStatus('confirmed')}
                        >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Confirmar
                        </Button>
                    )}

                    {appointment.status === 'confirmed' && (
                        <Button
                            className="w-full sm:w-auto"
                            onClick={() => updateStatus('completed')}
                        >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Concluir
                        </Button>
                    )}
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
