import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Transaction } from "@/types";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface ManualConfirmationModalProps {
    open: boolean;
    onClose: () => void;
    transaction: Transaction | null;
    onConfirm: () => void;
}

export function ManualConfirmationModal({ open, onClose, transaction, onConfirm }: ManualConfirmationModalProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [date, setDate] = useState(new Date().toISOString().slice(0, 16)); // datetime-local format
    const [notes, setNotes] = useState("");

    if (!transaction) return null;

    const handleConfirm = async () => {
        setLoading(true);
        try {
            const { error } = await supabase
                .from('transactions')
                .update({
                    status: 'manual',
                    paid_at: new Date(date).toISOString(),
                    confirmed_by: user?.email,
                    notes: notes ? `${transaction.notes || ''}\n[Confirmação Manual]: ${notes}` : transaction.notes
                })
                .eq('id', transaction.id);

            if (error) throw error;
            toast.success("Pagamento confirmado manualmente");
            onConfirm();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error("Erro ao confirmar pagamento");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Confirmar Pagamento Manualmente</DialogTitle>
                    <DialogDescription>
                        Registre um pagamento recebido fora do sistema automático.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="bg-muted p-3 rounded-md text-sm">
                        <p><strong>Cliente:</strong> {transaction.client_name}</p>
                        <p><strong>Valor:</strong> {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(transaction.amount)}</p>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="date">Data do Pagamento</Label>
                        <Input
                            id="date"
                            type="datetime-local"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="notes">Observações (Opcional)</Label>
                        <Textarea
                            id="notes"
                            placeholder="Ex: Cliente enviou comprovante via WhatsApp..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
                    <Button onClick={handleConfirm} disabled={loading} className="bg-green-600 hover:bg-green-700">
                        {loading ? "Confirmando..." : "Confirmar Recebimento"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
