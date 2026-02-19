import { useState, useEffect } from "react";
import { useCompany } from "@/contexts/CompanyContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, CalendarOff } from "lucide-react";
import { Professional, Availability, AvailabilityBlock } from "@/types";
import { ptBR } from "date-fns/locale";
import { format } from "date-fns";

const DAYS_OF_WEEK = [
    { value: 0, label: "Domingo" },
    { value: 1, label: "Segunda-feira" },
    { value: 2, label: "Terça-feira" },
    { value: 3, label: "Quarta-feira" },
    { value: 4, label: "Quinta-feira" },
    { value: 5, label: "Sexta-feira" },
    { value: 6, label: "Sábado" },
];

export function AvailabilityTab() {
    const { companyId } = useCompany();
    const [professionals, setProfessionals] = useState<Professional[]>([]);
    const [selectedProfessional, setSelectedProfessional] = useState<string>("");
    const [availability, setAvailability] = useState<Availability[]>([]);
    const [blocks, setBlocks] = useState<AvailabilityBlock[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Block Dialog
    const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false);
    const [newBlock, setNewBlock] = useState<Partial<AvailabilityBlock>>({});

    useEffect(() => {
        if (companyId) {
            fetchProfessionals();
        }
    }, [companyId]);

    useEffect(() => {
        if (selectedProfessional) {
            fetchAvailability();
            fetchBlocks();
        } else {
            setAvailability([]);
            setBlocks([]);
        }
    }, [selectedProfessional]);

    async function fetchProfessionals() {
        const { data } = await supabase
            .from("professionals")
            .select("*")
            .eq("company_id", companyId)
            .eq("active", true)
            .order("name");

        setProfessionals(data || []);
        if (data && data.length > 0) {
            setSelectedProfessional(data[0].id);
        }
    }

    async function fetchAvailability() {
        setLoading(true);
        const { data } = await supabase
            .from("availability")
            .select("*")
            .eq("company_id", companyId)
            .eq("professional_id", selectedProfessional);

        setAvailability(data || []);
        setLoading(false);
    }

    async function fetchBlocks() {
        const { data } = await supabase
            .from("availability_blocks")
            .select("*")
            .eq("company_id", companyId)
            .eq("professional_id", selectedProfessional)
            .gte("block_date", new Date().toISOString().split("T")[0])
            .order("block_date");

        setBlocks(data || []);
    }

    const handleAvailabilityChange = (day: number, field: keyof Availability, value: any) => {
        setAvailability(prev => {
            const existing = prev.find(a => a.day_of_week === day);
            if (existing) {
                return prev.map(a => a.day_of_week === day ? { ...a, [field]: value } : a);
            } else {
                // If doesn't exist, create a draft entry (won't have ID yet)
                return [...prev, {
                    company_id: companyId!,
                    professional_id: selectedProfessional,
                    day_of_week: day,
                    start_time: "08:00",
                    end_time: "18:00",
                    slot_duration_minutes: 60,
                    active: true,
                    [field]: value
                } as Availability];
            }
        });
    };

    // Initialize missing days with default values in state (not saved yet)
    useEffect(() => {
        if (selectedProfessional && !loading) {
            setAvailability(prev => {
                const newAvail = [...prev];
                DAYS_OF_WEEK.forEach(day => {
                    if (!newAvail.find(a => a.day_of_week === day.value)) {
                        newAvail.push({
                            company_id: companyId!,
                            professional_id: selectedProfessional,
                            day_of_week: day.value,
                            start_time: "09:00",
                            end_time: "18:00",
                            slot_duration_minutes: 60,
                            active: false,
                            id: `temp-${day.value}` // Temp ID
                        } as any);
                    }
                });
                return newAvail.sort((a, b) => a.day_of_week - b.day_of_week);
            });
        }
    }, [selectedProfessional, loading]);

    async function saveAvailability() {
        setSaving(true);

        // Prepare data for upsert
        const upsertData = availability.map(a => {
            const { id, created_at, ...rest } = a as any; // Remove temp ID or created_at
            // If ID is uuid, keep it. If temp, remove it.
            const cleanData = id && !id.startsWith('temp-') ? { id, ...rest } : rest;

            return {
                ...cleanData,
                company_id: companyId,
                professional_id: selectedProfessional,
            };
        });

        const { error } = await supabase
            .from("availability")
            .upsert(upsertData, { onConflict: 'company_id,professional_id,day_of_week' });

        if (error) {
            toast.error("Erro ao salvar disponibilidade");
            console.error(error);
        } else {
            toast.success("Disponibilidade atualizada!");
            fetchAvailability(); // Refresh to get real IDs
        }
        setSaving(false);
    }

    async function handleAddBlock() {
        if (!newBlock.block_date) return;

        setSaving(true);
        const { error } = await supabase
            .from("availability_blocks")
            .insert({
                company_id: companyId,
                professional_id: selectedProfessional,
                block_date: newBlock.block_date,
                start_time: newBlock.start_time || null,
                end_time: newBlock.end_time || null,
                reason: newBlock.reason
            });

        if (error) {
            toast.error("Erro ao adicionar bloqueio");
            console.error(error);
        } else {
            toast.success("Bloqueio adicionado");
            setIsBlockDialogOpen(false);
            setNewBlock({});
            fetchBlocks();
        }
        setSaving(false);
    }

    async function handleDeleteBlock(id: string) {
        const { error } = await supabase
            .from("availability_blocks")
            .delete()
            .eq("id", id);

        if (error) {
            toast.error("Erro ao remover bloqueio");
        } else {
            toast.success("Bloqueio removido");
            fetchBlocks();
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-medium">Disponibilidade</h3>
                    <p className="text-sm text-muted-foreground">
                        Defina os horários de atendimento semanal e bloqueios de data.
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-md border">
                <Label>Profissional:</Label>
                <Select value={selectedProfessional} onValueChange={setSelectedProfessional}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                        {professionals.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {selectedProfessional && (
                <>
                    <div className="border rounded-md p-4 space-y-4">
                        <div className="flex justify-between items-center">
                            <h4 className="font-medium text-sm">Horário Semanal</h4>
                            <Button onClick={saveAvailability} disabled={saving}>
                                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Salvar Alterações
                            </Button>
                        </div>

                        <div className="space-y-2">
                            {availability.map((item) => (
                                <div key={item.day_of_week} className="grid grid-cols-12 gap-2 items-center text-sm p-2 hover:bg-muted/30 rounded border-b last:border-0 border-border/50">
                                    <div className="col-span-3 flex items-center gap-2">
                                        <Checkbox
                                            checked={item.active}
                                            onCheckedChange={(c) => handleAvailabilityChange(item.day_of_week, 'active', !!c)}
                                        />
                                        <span className={!item.active ? "text-muted-foreground line-through" : ""}>
                                            {DAYS_OF_WEEK.find(d => d.value === item.day_of_week)?.label}
                                        </span>
                                    </div>
                                    <div className="col-span-3">
                                        <Input
                                            type="time"
                                            value={item.start_time?.slice(0, 5) || "09:00"}
                                            disabled={!item.active}
                                            onChange={(e) => handleAvailabilityChange(item.day_of_week, 'start_time', e.target.value)}
                                            className="h-8"
                                        />
                                    </div>
                                    <div className="col-span-1 text-center text-muted-foreground">até</div>
                                    <div className="col-span-3">
                                        <Input
                                            type="time"
                                            value={item.end_time?.slice(0, 5) || "18:00"}
                                            disabled={!item.active}
                                            onChange={(e) => handleAvailabilityChange(item.day_of_week, 'end_time', e.target.value)}
                                            className="h-8"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="border rounded-md p-4 space-y-4">
                        <div className="flex justify-between items-center">
                            <h4 className="font-medium text-sm">Bloqueios de Data (Feriados/Folgas)</h4>
                            <Button variant="outline" size="sm" onClick={() => setIsBlockDialogOpen(true)}>
                                <CalendarOff className="mr-2 h-4 w-4" />
                                Adicionar Bloqueio
                            </Button>
                        </div>

                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Data</TableHead>
                                    <TableHead>Horário</TableHead>
                                    <TableHead>Motivo</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {blocks.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-muted-foreground font-light py-8">
                                            Nenhum bloqueio cadastrado.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    blocks.map(block => (
                                        <TableRow key={block.id}>
                                            <TableCell>{format(new Date(block.block_date), 'dd/MM/yyyy')}</TableCell>
                                            <TableCell>
                                                {block.start_time ? `${block.start_time.slice(0, 5)} - ${block.end_time?.slice(0, 5)}` : "Dia inteiro"}
                                            </TableCell>
                                            <TableCell>{block.reason || "-"}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDeleteBlock(block.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </>
            )}

            <Dialog open={isBlockDialogOpen} onOpenChange={setIsBlockDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Novo Bloqueio</DialogTitle>
                        <DialogDescription>
                            Selecione uma data para bloquear. Deixe os horários em branco para bloquear o dia todo.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Data</Label>
                            <Input
                                type="date"
                                value={newBlock.block_date || ""}
                                onChange={(e) => setNewBlock({ ...newBlock, block_date: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Início (Opcional)</Label>
                                <Input
                                    type="time"
                                    value={newBlock.start_time || ""}
                                    onChange={(e) => setNewBlock({ ...newBlock, start_time: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Fim (Opcional)</Label>
                                <Input
                                    type="time"
                                    value={newBlock.end_time || ""}
                                    onChange={(e) => setNewBlock({ ...newBlock, end_time: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>Motivo</Label>
                            <Input
                                value={newBlock.reason || ""}
                                onChange={(e) => setNewBlock({ ...newBlock, reason: e.target.value })}
                                placeholder="Ex: Feriado, Médico..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsBlockDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleAddBlock} disabled={!newBlock.block_date}>Adicionar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
