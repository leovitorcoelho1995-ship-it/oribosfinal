import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/contexts/CompanyContext";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const formSchema = z.object({
    clientName: z.string().min(1, "Nome do cliente é obrigatório"),
    clientPhone: z.string().min(10, "Telefone inválido (mínimo 10 dígitos)"),
    description: z.string().min(1, "Descrição é obrigatória"),
    amount: z.number().min(0.01, "Valor deve ser maior que zero"),
    status: z.enum(["pending", "paid", "manual"]),
    notes: z.string().optional(),
    paidAt: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface NewTransactionModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function NewTransactionModal({ open, onClose, onSuccess }: NewTransactionModalProps) {
    const { user } = useAuth();
    const { companyId } = useCompany();

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            clientName: "",
            clientPhone: "",
            description: "",
            amount: 0,
            status: "pending",
            notes: "",
            paidAt: new Date().toISOString().slice(0, 16),
        },
    });

    const { register, handleSubmit, control, watch, reset, formState: { errors, isSubmitting } } = form;
    const status = watch("status");
    const clientPhone = watch("clientPhone");

    useEffect(() => {
        if (open) {
            reset({
                clientName: "",
                clientPhone: "",
                description: "",
                amount: 0,
                status: "pending",
                notes: "",
                paidAt: new Date().toISOString().slice(0, 16),
            });
        }
    }, [open, reset]);

    const generateRemoteJid = (phone: string) => {
        const clean = phone?.replace(/\D/g, '') || '';
        return clean ? `${clean}@s.whatsapp.net` : '';
    };

    const onSubmit = async (data: FormData) => {
        if (!companyId) {
            toast.error("Erro: Empresa não identificada");
            return;
        }

        try {
            const cleanPhone = data.clientPhone.replace(/\D/g, '');
            const finalRemoteJid = cleanPhone + '@s.whatsapp.net';

            const payload: any = {
                company_id: companyId,
                client_name: data.clientName,
                client_phone: cleanPhone,
                remote_jid: finalRemoteJid,
                description: data.description,
                amount: data.amount,
                status: data.status,
                source: 'manual',
                notes: data.notes,
                created_at: new Date().toISOString()
            };

            if (data.status === 'paid' || data.status === 'manual') {
                payload.paid_at = data.paidAt ? new Date(data.paidAt).toISOString() : new Date().toISOString();
                payload.confirmed_by = user?.email;
            }

            const { error } = await supabase
                .from('transactions')
                .insert(payload);

            if (error) throw error;

            toast.success("Transação criada com sucesso!");
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error("Erro ao criar transação");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Nova Transação Manual</DialogTitle>
                    <DialogDescription>
                        Crie uma nova cobrança ou registre um pagamento.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="clientName">Nome do Cliente *</Label>
                            <Input
                                id="clientName"
                                {...register("clientName")}
                                placeholder="Ex: João Silva"
                            />
                            {errors.clientName && <span className="text-xs text-red-500">{errors.clientName.message}</span>}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="clientPhone">WhatsApp (DD+Num) *</Label>
                            <Input
                                id="clientPhone"
                                {...register("clientPhone")}
                                placeholder="Ex: 5511999999999"
                            />
                            <span className="text-[10px] text-muted-foreground font-mono">
                                JID: {generateRemoteJid(clientPhone)}
                            </span>
                            {errors.clientPhone && <span className="text-xs text-red-500">{errors.clientPhone.message}</span>}
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="description">Descrição da Cobrança *</Label>
                        <Input
                            id="description"
                            {...register("description")}
                            placeholder="Ex: Mensalidade Fevereiro"
                        />
                        {errors.description && <span className="text-xs text-red-500">{errors.description.message}</span>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="amount">Valor (R$) *</Label>
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                {...register("amount", { valueAsNumber: true })}
                                placeholder="0.00"
                            />
                            {errors.amount && <span className="text-xs text-red-500">{errors.amount.message}</span>}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="status">Status Inicial</Label>
                            <Controller
                                control={control}
                                name="status"
                                render={({ field }) => (
                                    <Select
                                        value={field.value}
                                        onValueChange={field.onChange}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pending">Aguardando</SelectItem>
                                            <SelectItem value="paid">Pago</SelectItem>
                                            <SelectItem value="manual">Conf. Manual</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>
                    </div>

                    {(status === 'paid' || status === 'manual') && (
                        <div className="grid gap-2 animate-in fade-in slide-in-from-top-2">
                            <Label htmlFor="paidAt">Data do Pagamento</Label>
                            <Input
                                id="paidAt"
                                type="datetime-local"
                                {...register("paidAt")}
                            />
                        </div>
                    )}

                    <div className="grid gap-2">
                        <Label htmlFor="notes">Notas Internas</Label>
                        <Textarea
                            id="notes"
                            {...register("notes")}
                            placeholder="Observações..."
                        />
                    </div>

                    <DialogFooter>
                        <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
                        <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90">
                            {isSubmitting ? "Salvando..." : "Salvar Transação"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
