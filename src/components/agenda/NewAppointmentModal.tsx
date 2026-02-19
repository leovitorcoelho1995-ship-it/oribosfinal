import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { Loader2, ArrowRight, ArrowLeft, Check, Clock } from "lucide-react";
import type { Professional, Service, Client } from "@/types";
import { useCompany } from "@/contexts/CompanyContext";
import { supabase } from "@/lib/supabase";
import { ScrollArea } from "@/components/ui/scroll-area";


interface NewAppointmentModalProps {
    open: boolean;
    onClose: () => void;
    onCreated: () => void;
}

export function NewAppointmentModal({ open, onClose, onCreated }: NewAppointmentModalProps) {
    const { companyId } = useCompany();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Data
    const [professionals, setProfessionals] = useState<Professional[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [clients, setClients] = useState<Client[]>([]);

    // Form
    const [selectedService, setSelectedService] = useState<string>("");
    const [selectedProfessional, setSelectedProfessional] = useState<string>("");
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [selectedTime, setSelectedTime] = useState<string>("");
    const [selectedClient, setSelectedClient] = useState<string>(""); // Client ID
    const [clientName, setClientName] = useState(""); // For new client or search
    const [clientPhone, setClientPhone] = useState("");
    const [notes, setNotes] = useState("");

    // Availability
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);

    useEffect(() => {
        if (open && companyId) {
            fetchInitialData();
            setStep(1);
            resetForm();
        }
    }, [open, companyId]);

    useEffect(() => {
        if (step === 2 && selectedProfessional && selectedService && selectedDate) {
            checkAvailability();
        }
    }, [selectedProfessional, selectedService, selectedDate, step]);

    function resetForm() {
        setSelectedService("");
        setSelectedProfessional("");
        setSelectedDate(new Date());
        setSelectedTime("");
        setSelectedClient("");
        setClientName("");
        setClientPhone("");
        setNotes("");
        setAvailableSlots([]);
    }

    async function fetchInitialData() {
        setLoading(true);
        // Fetch Services
        const { data: servicesData } = await supabase
            .from("services")
            .select("*")
            .eq("company_id", companyId)
            .eq("active", true);
        setServices(servicesData || []);

        // Fetch Professionals
        const { data: proData } = await supabase
            .from("professionals")
            .select("*")
            .eq("company_id", companyId)
            .eq("active", true);
        setProfessionals(proData || []);

        setLoading(false);
    }

    async function checkAvailability() {
        if (!selectedProfessional || !selectedService || !selectedDate) return;

        setLoadingSlots(true);
        const { data, error } = await supabase.rpc("get_available_slots", {
            p_company_id: companyId,
            p_professional_id: selectedProfessional,
            p_service_id: selectedService,
            p_date: format(selectedDate, "yyyy-MM-dd")
        });

        if (error) {
            console.error(error);
            toast.error("Erro ao verificar disponibilidade");
        } else {
            // data is array of { slot_time, available }
            // Filter only available ones
            const slots = data?.filter((s: any) => s.available).map((s: any) => s.slot_time.slice(0, 5)) || [];
            setAvailableSlots(slots);
        }
        setLoadingSlots(false);
    }

    async function handleSubmit() {
        if (!selectedClient && !clientName) {
            toast.error("Informe o nome do cliente");
            return;
        }
        if (!selectedService || !selectedProfessional || !selectedDate || !selectedTime) {
            toast.error("Preencha todos os dados do agendamento");
            return;
        }

        setLoading(true);

        // 1. Create/Update Client if needed (simplified: just use name if no ID)
        // Ideally we search or create. For now, we'll store client_name in appointment if valid ID not present.
        // Or create client. Let's create a client if needed.
        let clientIdToUse = selectedClient;
        if (!clientIdToUse && clientName) {
            // Check if exists by phone? Skip complexity for now.
            // Just Create new client
            const { data: newClient, error: clientError } = await supabase
                .from("clients")
                .insert({
                    company_id: companyId,
                    name: clientName,
                    whatsapp: clientPhone,
                    status: 'active'
                })
                .select()
                .single();

            if (clientError) {
                console.error(clientError);
                toast.error("Erro ao cadastrar cliente");
                setLoading(false);
                return;
            }
            clientIdToUse = newClient.id;
        }

        // 2. Create Appointment
        // Get duration
        const service = services.find(s => s.id === selectedService);
        const duration = service?.duration_minutes || 60;

        const { error } = await supabase.from("appointments").insert({
            company_id: companyId,
            client_id: clientIdToUse,
            client_name: clientName, // Redundant but good for quick access
            phone: clientPhone,
            title: `${service?.name} - ${clientName}`,
            professional_id: selectedProfessional,
            professional: professionals.find(p => p.id === selectedProfessional)?.name,
            service_id: selectedService,
            date: format(selectedDate!, "yyyy-MM-dd"),
            time: selectedTime,
            duration_minutes: duration,
            status: "scheduled",
            notes: notes,
            source: "manual"
        });

        if (error) {
            console.error(error);
            toast.error("Erro ao criar agendamento");
        } else {
            toast.success("Agendamento criado com sucesso!");
            onCreated();
            onClose();
        }
        setLoading(false);
    }

    // Step Renders
    const renderStep1 = () => (
        <div className="space-y-4 py-4">
            <div className="grid gap-2">
                <Label>Serviço</Label>
                <Select value={selectedService} onValueChange={setSelectedService}>
                    <SelectTrigger>
                        <SelectValue placeholder="Selecione o serviço" />
                    </SelectTrigger>
                    <SelectContent>
                        {services.map(s => (
                            <SelectItem key={s.id} value={s.id}>{s.name} ({s.duration_minutes} min)</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="grid gap-2">
                <Label>Profissional</Label>
                <Select value={selectedProfessional} onValueChange={setSelectedProfessional}>
                    <SelectTrigger>
                        <SelectValue placeholder="Selecione o profissional" />
                    </SelectTrigger>
                    <SelectContent>
                        {professionals.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="py-4 flex flex-col md:flex-row gap-6 h-[350px]">
            <div className="flex-1">
                <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border shadow"
                    locale={ptBR}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                />
            </div>
            <div className="flex-1 flex flex-col">
                <Label className="mb-2">Horários Disponíveis</Label>
                <ScrollArea className="flex-1 border rounded-md p-2">
                    {loadingSlots ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : availableSlots.length === 0 ? (
                        <div className="text-center py-8 text-sm text-muted-foreground">
                            Nenhum horário disponível para esta data.
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-2">
                            {availableSlots.map(time => (
                                <Button
                                    key={time}
                                    variant={selectedTime === time ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setSelectedTime(time)}
                                    className="text-xs"
                                >
                                    {time}
                                </Button>
                            ))}
                        </div>
                    )}
                </ScrollArea>
                {selectedTime && (
                    <div className="mt-4 p-2 bg-primary/10 rounded flex items-center justify-center gap-2 text-primary font-medium text-sm">
                        <Clock className="h-4 w-4" />
                        {format(selectedDate!, "dd/MM", { locale: ptBR })} às {selectedTime}
                    </div>
                )}
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="space-y-4 py-4">
            <div className="grid gap-2">
                <Label>Nome do Cliente</Label>
                <Input
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Nome completo"
                />
            </div>
            <div className="grid gap-2">
                <Label>WhatsApp / Telefone</Label>
                <Input
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="(00) 00000-0000"
                />
            </div>
            <div className="grid gap-2">
                <Label>Observações (Opcional)</Label>
                <Input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ex: Primeira vez..."
                />
            </div>

            <div className="mt-6 p-4 bg-muted rounded-md space-y-2 text-sm">
                <h4 className="font-semibold flex items-center gap-2 mb-2">
                    <Check className="h-4 w-4 text-green-600" /> Resumo
                </h4>
                <div className="grid grid-cols-2 gap-2">
                    <span className="text-muted-foreground">Serviço:</span>
                    <span className="font-medium">{services.find(s => s.id === selectedService)?.name}</span>

                    <span className="text-muted-foreground">Profissional:</span>
                    <span className="font-medium">{professionals.find(p => p.id === selectedProfessional)?.name}</span>

                    <span className="text-muted-foreground">Data:</span>
                    <span className="font-medium">
                        {selectedDate && format(selectedDate, "dd/MM/yyyy", { locale: ptBR })} às {selectedTime}
                    </span>

                    <span className="text-muted-foreground">Cliente:</span>
                    <span className="font-medium">{clientName}</span>
                </div>
            </div>
        </div>
    );

    return (
        <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Novo Agendamento</DialogTitle>
                    <DialogDescription>
                        Passo {step} de 3
                    </DialogDescription>
                </DialogHeader>

                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}

                <DialogFooter className="flex justify-between items-center sm:justify-between">
                    <div>
                        {step > 1 && (
                            <Button variant="outline" onClick={() => setStep(step - 1)}>
                                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                            </Button>
                        )}
                    </div>
                    <div>
                        {step < 3 ? (
                            <Button onClick={() => setStep(step + 1)} disabled={
                                (step === 1 && (!selectedService || !selectedProfessional)) ||
                                (step === 2 && (!selectedDate || !selectedTime))
                            }>
                                Próximo <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        ) : (
                            <Button onClick={handleSubmit} disabled={loading || !clientName}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Confirmar Agendamento
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
