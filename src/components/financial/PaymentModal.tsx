import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import type { Payment, Client } from "@/types";
import { useCompany } from "@/contexts/CompanyContext";

interface PaymentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    paymentToEdit?: Payment | null;
    onSuccess: () => void;
}

export function PaymentModal({
    open,
    onOpenChange,
    paymentToEdit,
    onSuccess,
}: PaymentModalProps) {
    const { companyId } = useCompany();
    const [loading, setLoading] = useState(false);
    const [clients, setClients] = useState<Client[]>([]);
    const [formData, setFormData] = useState({
        client_id: "",
        description: "",
        amount: 0,
        due_date: new Date().toISOString().split('T')[0],
        status: "pending"
    });

    useEffect(() => {
        fetchClients();
    }, []);

    useEffect(() => {
        if (paymentToEdit) {
            setFormData({
                client_id: paymentToEdit.client_id || "",
                description: paymentToEdit.description,
                amount: paymentToEdit.amount,
                due_date: paymentToEdit.due_date,
                status: paymentToEdit.status,
            });
        } else {
            setFormData({
                client_id: "",
                description: "",
                amount: 0,
                due_date: new Date().toISOString().split('T')[0],
                status: "pending"
            });
        }
    }, [paymentToEdit, open]);

    async function fetchClients() {
        const { data } = await supabase.from("clients").select("*").order("name");
        setClients(data || []);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        try {
            const selectedClient = clients.find(c => c.id === formData.client_id);
            const payload = {
                ...formData,
                client_name: selectedClient?.name || "Cliente Desconhecido"
            };

            if (paymentToEdit) {
                const { error } = await supabase
                    .from("payments")
                    .update(payload)
                    .eq("id", paymentToEdit.id);
                if (error) throw error;
                toast.success("Pagamento atualizado!");
            } else {
                const { error } = await supabase.from("payments").insert([{ ...payload, company_id: companyId }]);
                if (error) throw error;
                toast.success("Pagamento criado!");
            }
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao salvar pagamento.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {paymentToEdit ? "Editar Pagamento" : "Novo Pagamento"}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="client" className="text-right">
                            Cliente
                        </Label>
                        <div className="col-span-3">
                            <Select
                                value={formData.client_id}
                                onValueChange={(value) =>
                                    setFormData({ ...formData, client_id: value })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione um cliente" />
                                </SelectTrigger>
                                <SelectContent>
                                    {clients.map(client => (
                                        <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="description" className="text-right">
                            Descrição
                        </Label>
                        <Input
                            id="description"
                            value={formData.description}
                            onChange={(e) =>
                                setFormData({ ...formData, description: e.target.value })
                            }
                            className="col-span-3"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="amount" className="text-right">
                            Valor
                        </Label>
                        <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            value={formData.amount}
                            onChange={(e) =>
                                setFormData({ ...formData, amount: parseFloat(e.target.value) })
                            }
                            className="col-span-3"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="due_date" className="text-right">
                            Vencimento
                        </Label>
                        <Input
                            id="due_date"
                            type="date"
                            value={formData.due_date}
                            onChange={(e) =>
                                setFormData({ ...formData, due_date: e.target.value })
                            }
                            className="col-span-3"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="status" className="text-right">
                            Status
                        </Label>
                        <Select
                            value={formData.status}
                            onValueChange={(value) =>
                                setFormData({ ...formData, status: value })
                            }
                        >
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="pending">Pendente</SelectItem>
                                <SelectItem value="paid">Pago</SelectItem>
                                <SelectItem value="overdue">Vencido</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Salvando..." : "Salvar"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
