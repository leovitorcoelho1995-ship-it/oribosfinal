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
import { Loader2, ArrowRight, ArrowLeft, Check, Clock, Plus, Settings } from "lucide-react";
import type { Professional, Service } from "@/types";
import { useCompany } from "@/contexts/CompanyContext";
import { supabase } from "@/lib/supabase";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";

interface NewAppointmentModalProps {
    open: boolean;
    onClose: () => void;
    onCreated: () => void;
}

// ─── Quick-add Service Sub-modal ─────────────────────────────────────────────
interface QuickAddServiceProps {
    open: boolean;
    onClose: () => void;
    companyId: string;
    onSaved: (service: Service) => void;
}

function QuickAddServiceModal({ open, onClose, companyId, onSaved }: QuickAddServiceProps) {
    const [name, setName] = useState("");
    const [duration, setDuration] = useState("60");
    const [loading, setLoading] = useState(false);

    async function handleSave() {
        if (!name.trim()) { toast.error("Informe o nome do serviço"); return; }
        setLoading(true);
        const { data, error } = await supabase.from("services").insert({
            company_id: companyId,
            name: name.trim(),
            duration_minutes: parseInt(duration),
            active: true,
        }).select().single();
        if (error) { toast.error("Erro ao salvar serviço"); console.error(error); }
        else { toast.success("Serviço adicionado!"); onSaved(data as Service); setName(""); setDuration("60"); onClose(); }
        setLoading(false);
    }

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>Adicionar Serviço</DialogTitle>
                    <DialogDescription>Cadastro rápido — você pode editar depois em Configurações.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="grid gap-2">
                        <Label>Nome do Serviço *</Label>
                        <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Corte de cabelo" />
                    </div>
                    <div className="grid gap-2">
                        <Label>Duração</Label>
                        <Select value={duration} onValueChange={setDuration}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="30">30 minutos</SelectItem>
                                <SelectItem value="60">60 minutos</SelectItem>
                                <SelectItem value="90">90 minutos</SelectItem>
                                <SelectItem value="120">120 minutos</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Salvar e selecionar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ─── Quick-add Professional Sub-modal ────────────────────────────────────────
interface QuickAddProfessionalProps {
    open: boolean;
    onClose: () => void;
    companyId: string;
    onSaved: (professional: Professional) => void;
}

function QuickAddProfessionalModal({ open, onClose, companyId, onSaved }: QuickAddProfessionalProps) {
    const [name, setName] = useState("");
    const [role, setRole] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSave() {
        if (!name.trim()) { toast.error("Informe o nome do profissional"); return; }
        setLoading(true);
        const { data, error } = await supabase.from("professionals").insert({
            company_id: companyId,
            name: name.trim(),
            role: role.trim() || null,
            active: true,
        }).select().single();
        if (error) { toast.error("Erro ao salvar profissional"); console.error(error); }
        else { toast.success("Profissional adicionado!"); onSaved(data as Professional); setName(""); setRole(""); onClose(); }
        setLoading(false);
    }

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>Adicionar Profissional</DialogTitle>
                    <DialogDescription>Cadastro rápido — você pode editar depois em Configurações.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="grid gap-2">
                        <Label>Nome *</Label>
                        <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Ana Paula" />
                    </div>
                    <div className="grid gap-2">
                        <Label>Função / Cargo (opcional)</Label>
                        <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Ex: Cabeleireira" />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Salvar e selecionar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ─── Generate generic hourly slots when no RPC available ─────────────────────
function generateGenericSlots(): string[] {
    const slots: string[] = [];
    for (let h = 8; h <= 18; h++) {
        slots.push(`${String(h).padStart(2, "0")}:00`);
        if (h < 18) slots.push(`${String(h).padStart(2, "0")}:30`);
    }
    return slots;
}

// ─── Main Modal ───────────────────────────────────────────────────────────────
export function NewAppointmentModal({ open, onClose, onCreated }: NewAppointmentModalProps) {
    const { companyId } = useCompany();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Data
    const [professionals, setProfessionals] = useState<Professional[]>([]);
    const [services, setServices] = useState<Service[]>([]);

    // Form — empty string means "none selected" (optional)
    const [selectedService, setSelectedService] = useState<string>("");
    const [selectedProfessional, setSelectedProfessional] = useState<string>("");
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [selectedTime, setSelectedTime] = useState<string>("");
    const [clientName, setClientName] = useState("");
    const [clientPhone, setClientPhone] = useState("");
    const [notes, setNotes] = useState("");

    // Availability
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);

    // Quick-add modals
    const [showAddService, setShowAddService] = useState(false);
    const [showAddProfessional, setShowAddProfessional] = useState(false);

    useEffect(() => {
        if (open && companyId) {
            fetchInitialData();
            setStep(1);
            resetForm();
        }
    }, [open, companyId]);

    // Re-check availability whenever relevant fields change on step 2
    useEffect(() => {
        if (step === 2 && selectedDate) {
            checkAvailability();
        }
    }, [selectedProfessional, selectedService, selectedDate, step]);

    function resetForm() {
        setSelectedService("");
        setSelectedProfessional("");
        setSelectedDate(new Date());
        setSelectedTime("");
        setClientName("");
        setClientPhone("");
        setNotes("");
        setAvailableSlots([]);
    }

    async function fetchInitialData() {
        setLoading(true);
        const [{ data: servicesData }, { data: proData }] = await Promise.all([
            supabase.from("services").select("*").eq("company_id", companyId).eq("active", true),
            supabase.from("professionals").select("*").eq("company_id", companyId).eq("active", true),
        ]);
        setServices(servicesData || []);
        setProfessionals(proData || []);
        setLoading(false);
    }

    async function checkAvailability() {
        if (!selectedDate) return;

        // If both professional AND service are selected, use the RPC for precise availability
        if (selectedProfessional && selectedService) {
            setLoadingSlots(true);
            const { data, error } = await supabase.rpc("get_available_slots", {
                p_company_id: companyId,
                p_professional_id: selectedProfessional,
                p_service_id: selectedService,
                p_date: format(selectedDate, "yyyy-MM-dd"),
            });
            if (error) {
                console.error(error);
                // Fall back to generic slots rather than showing an error
                setAvailableSlots(generateGenericSlots());
            } else {
                const slots = data?.filter((s: any) => s.available).map((s: any) => s.slot_time.slice(0, 5)) || [];
                setAvailableSlots(slots.length > 0 ? slots : generateGenericSlots());
            }
            setLoadingSlots(false);
        } else {
            // No professional/service — show generic business-hours slots
            setAvailableSlots(generateGenericSlots());
        }
    }

    async function handleSubmit() {
        if (!clientName.trim()) {
            toast.error("Informe o nome do cliente");
            return;
        }
        if (!selectedDate || !selectedTime) {
            toast.error("Selecione data e horário");
            return;
        }

        setLoading(true);

        // Create client record
        const { data: newClient, error: clientError } = await supabase
            .from("clients")
            .insert({
                company_id: companyId,
                name: clientName.trim(),
                whatsapp: clientPhone || null,
                status: "active",
            })
            .select()
            .single();

        if (clientError) {
            console.error(clientError);
            toast.error("Erro ao cadastrar cliente");
            setLoading(false);
            return;
        }

        const service = services.find((s) => s.id === selectedService);
        const professional = professionals.find((p) => p.id === selectedProfessional);
        const duration = service?.duration_minutes || 60;

        // Build title: prefer "Serviço - Cliente", fall back to just cliente name
        const title = service
            ? `${service.name} - ${clientName.trim()}`
            : clientName.trim();

        const { error } = await supabase.from("appointments").insert({
            company_id: companyId,
            client_id: newClient.id,
            client_name: clientName.trim(),
            phone: clientPhone || null,
            title,
            professional_id: selectedProfessional || null,
            professional: professional?.name || null,
            service_id: selectedService || null,
            date: format(selectedDate, "yyyy-MM-dd"),
            time: selectedTime,
            duration_minutes: duration,
            status: "scheduled",
            notes: notes || null,
            source: "manual",
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

    // ── Step 1: Service + Professional (both optional) ──────────────────────
    const renderStep1 = () => (
        <div className="space-y-5 py-4">
            {/* Service */}
            <div className="grid gap-2">
                <Label>
                    Serviço <span className="text-muted-foreground text-xs font-normal">(opcional)</span>
                </Label>
                {services.length === 0 ? (
                    <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground flex items-center justify-between">
                        <span>Nenhum serviço cadastrado.</span>
                        <Button
                            size="sm"
                            variant="ghost"
                            className="text-primary h-auto py-1 px-2 gap-1"
                            onClick={() => setShowAddService(true)}
                        >
                            <Plus className="h-3 w-3" />
                            Adicionar serviço agora →
                        </Button>
                    </div>
                ) : (
                    <>
                        <Select value={selectedService} onValueChange={setSelectedService}>
                            <SelectTrigger>
                                <SelectValue placeholder="Sem serviço definido (opcional)" />
                            </SelectTrigger>
                            <SelectContent>
                                {services.map((s) => (
                                    <SelectItem key={s.id} value={s.id}>
                                        {s.name} ({s.duration_minutes} min)
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <button
                            type="button"
                            onClick={() => setShowAddService(true)}
                            className="flex items-center gap-1 text-xs text-primary hover:underline self-start mt-0.5"
                        >
                            <Plus className="h-3 w-3" /> Adicionar novo serviço
                        </button>
                    </>
                )}
            </div>

            {/* Professional */}
            <div className="grid gap-2">
                <Label>
                    Profissional <span className="text-muted-foreground text-xs font-normal">(opcional)</span>
                </Label>
                {professionals.length === 0 ? (
                    <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground flex items-center justify-between">
                        <span>Nenhum profissional cadastrado.</span>
                        <Button
                            size="sm"
                            variant="ghost"
                            className="text-primary h-auto py-1 px-2 gap-1"
                            onClick={() => setShowAddProfessional(true)}
                        >
                            <Plus className="h-3 w-3" />
                            Adicionar profissional agora →
                        </Button>
                    </div>
                ) : (
                    <>
                        <Select value={selectedProfessional} onValueChange={setSelectedProfessional}>
                            <SelectTrigger>
                                <SelectValue placeholder="Sem profissional (opcional)" />
                            </SelectTrigger>
                            <SelectContent>
                                {professionals.map((p) => (
                                    <SelectItem key={p.id} value={p.id}>
                                        {p.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <button
                            type="button"
                            onClick={() => setShowAddProfessional(true)}
                            className="flex items-center gap-1 text-xs text-primary hover:underline self-start mt-0.5"
                        >
                            <Plus className="h-3 w-3" /> Adicionar novo profissional
                        </button>
                    </>
                )}
            </div>

            {/* Hint to Settings */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
                <Settings className="h-3.5 w-3.5 shrink-0" />
                <span>
                    Gerencie serviços e profissionais em{" "}
                    <button
                        type="button"
                        onClick={() => { onClose(); navigate("/settings?tab=agenda"); }}
                        className="text-primary underline hover:no-underline"
                    >
                        Configurações → Agenda
                    </button>
                </span>
            </div>
        </div>
    );

    // ── Step 2: Date + Time ──────────────────────────────────────────────────
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
                            {availableSlots.map((time) => (
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

    // ── Step 3: Client info + summary ────────────────────────────────────────
    const renderStep3 = () => {
        const service = services.find((s) => s.id === selectedService);
        const professional = professionals.find((p) => p.id === selectedProfessional);

        return (
            <div className="space-y-4 py-4">
                <div className="grid gap-2">
                    <Label>Nome do Cliente *</Label>
                    <Input
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="Nome completo"
                        autoFocus
                    />
                </div>
                <div className="grid gap-2">
                    <Label>WhatsApp / Telefone (opcional)</Label>
                    <Input
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        placeholder="(00) 00000-0000"
                    />
                </div>
                <div className="grid gap-2">
                    <Label>Observações (opcional)</Label>
                    <Input
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Ex: Primeira vez..."
                    />
                </div>

                <div className="mt-4 p-4 bg-muted rounded-md space-y-2 text-sm">
                    <h4 className="font-semibold flex items-center gap-2 mb-2">
                        <Check className="h-4 w-4 text-green-600" /> Resumo
                    </h4>
                    <div className="grid grid-cols-2 gap-y-1">
                        <span className="text-muted-foreground">Serviço:</span>
                        <span className="font-medium">{service?.name ?? <span className="italic text-muted-foreground">Não definido</span>}</span>

                        <span className="text-muted-foreground">Profissional:</span>
                        <span className="font-medium">{professional?.name ?? <span className="italic text-muted-foreground">Não definido</span>}</span>

                        <span className="text-muted-foreground">Data:</span>
                        <span className="font-medium">
                            {selectedDate && format(selectedDate, "dd/MM/yyyy", { locale: ptBR })} às {selectedTime}
                        </span>

                        <span className="text-muted-foreground">Duração:</span>
                        <span className="font-medium">{service?.duration_minutes ?? 60} min</span>
                    </div>
                </div>
            </div>
        );
    };

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <>
            <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Novo Agendamento</DialogTitle>
                        <DialogDescription>Passo {step} de 3</DialogDescription>
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
                                <Button
                                    onClick={() => setStep(step + 1)}
                                    disabled={step === 2 && (!selectedDate || !selectedTime)}
                                >
                                    Próximo <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            ) : (
                                <Button onClick={handleSubmit} disabled={loading || !clientName.trim()}>
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Confirmar Agendamento
                                </Button>
                            )}
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Quick-add sub-modals (rendered outside main dialog to avoid nesting issues) */}
            {companyId && (
                <>
                    <QuickAddServiceModal
                        open={showAddService}
                        onClose={() => setShowAddService(false)}
                        companyId={companyId}
                        onSaved={(svc) => {
                            setServices((prev) => [...prev, svc]);
                            setSelectedService(svc.id);
                        }}
                    />
                    <QuickAddProfessionalModal
                        open={showAddProfessional}
                        onClose={() => setShowAddProfessional(false)}
                        companyId={companyId}
                        onSaved={(pro) => {
                            setProfessionals((prev) => [...prev, pro]);
                            setSelectedProfessional(pro.id);
                        }}
                    />
                </>
            )}
        </>
    );
}
