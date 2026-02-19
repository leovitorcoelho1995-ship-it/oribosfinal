import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import type { Transaction } from "@/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Copy, Download, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface TransactionDrawerProps {
    open: boolean;
    onClose: () => void;
    transaction: Transaction | null;
    onUpdate: () => void;
}

export function TransactionDrawer({ open, onClose, transaction, onUpdate }: TransactionDrawerProps) {
    const [notes, setNotes] = useState(transaction?.notes || "");
    const [saving, setSaving] = useState(false);

    if (!transaction) return null;

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copiado!`);
    };

    const handleSaveNotes = async () => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('transactions')
                .update({ notes })
                .eq('id', transaction.id);

            if (error) throw error;
            toast.success("Notas atualizadas");
            onUpdate();
        } catch (error) {
            toast.error("Erro ao salvar notas");
        } finally {
            setSaving(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    return (
        <Sheet open={open} onOpenChange={onClose}>
            <SheetContent className="sm:max-w-md w-full overflow-y-auto">
                <SheetHeader className="mb-6">
                    <SheetTitle>Detalhes da Transação</SheetTitle>
                    <SheetDescription>ID: {transaction.id.slice(0, 8)}...</SheetDescription>
                </SheetHeader>

                <div className="space-y-6">
                    {/* Client Section */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Cliente</h4>
                        <div className="bg-muted/40 p-4 rounded-lg space-y-3">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Nome Completo</p>
                                <p className="font-semibold text-lg">{transaction.client_name}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">WhatsApp</p>
                                <div className="flex items-center justify-between">
                                    <p className="font-mono">{transaction.client_phone}</p>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(transaction.client_phone, "Telefone")}>
                                        <Copy className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Remote JID</p>
                                <div className="flex items-center justify-between bg-white p-2 rounded border">
                                    <p className="font-mono text-xs truncate max-w-[250px]">{transaction.remote_jid}</p>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(transaction.remote_jid, "JID")}>
                                        <Copy className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Billing Section */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Cobrança</h4>
                        <div className="bg-muted/40 p-4 rounded-lg space-y-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Valor</p>
                                    <p className="text-2xl font-bold text-primary">{formatCurrency(Number(transaction.amount))}</p>
                                </div>
                                <Badge variant={transaction.status === 'paid' ? 'default' : 'outline'}>
                                    {transaction.status === 'pending' ? 'Aguardando' :
                                        transaction.status === 'paid' ? 'Pago' :
                                            transaction.status === 'expired' ? 'Expirado' :
                                                transaction.status === 'cancelled' ? 'Cancelado' : 'Manual'}
                                </Badge>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Descrição</p>
                                <p className="text-sm">{transaction.description}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                    <p className="text-muted-foreground">Criado em</p>
                                    <p>{format(new Date(transaction.created_at), 'dd/MM/yyyy HH:mm')}</p>
                                </div>
                                {transaction.paid_at && (
                                    <div>
                                        <p className="text-muted-foreground">Pago em</p>
                                        <p>{format(new Date(transaction.paid_at), 'dd/MM/yyyy HH:mm')}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* PIX Section */}
                    {(transaction.pix_key || transaction.qr_code) && (
                        <div className="space-y-4">
                            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Dados PIX</h4>
                            <div className="bg-muted/40 p-4 rounded-lg space-y-4 flex flex-col items-center">
                                {transaction.qr_code_url ? (
                                    <img src={transaction.qr_code_url} alt="QR Code PIX" className="w-48 h-48 rounded-lg" />
                                ) : transaction.qr_code ? (
                                    <div className="bg-white p-4 rounded-lg border text-center break-all text-xs font-mono max-w-full">
                                        <p className="mb-2 text-muted-foreground">Código PIX:</p>
                                        {transaction.qr_code}
                                        <Button size="sm" variant="outline" className="mt-2 w-full" onClick={() => copyToClipboard(transaction.qr_code!, "Código QR")}>
                                            <Copy className="mr-2 h-3 w-3" /> Copiar Código
                                        </Button>
                                    </div>
                                ) : null}

                                {transaction.pix_key && (
                                    <div className="w-full">
                                        <p className="text-xs text-muted-foreground mb-1 text-center">Chave PIX (Copia e Cola)</p>
                                        <div className="flex gap-2">
                                            <Input value={transaction.pix_key} readOnly className="font-mono text-xs" />
                                            <Button size="icon" onClick={() => copyToClipboard(transaction.pix_key!, "Chave PIX")}>
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Notes Section */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Notas Internas</h4>
                        <div className="flex gap-2">
                            <Textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Adicione observações..."
                                className="min-h-[80px]"
                            />
                        </div>
                        <Button onClick={handleSaveNotes} disabled={saving} size="sm" variant="outline" className="w-full">
                            {saving ? "Salvando..." : "Salvar Nota"}
                        </Button>
                    </div>
                </div>

                <SheetFooter className="mt-8 flex-col sm:flex-col gap-2">
                    <Button variant="outline" onClick={onClose} className="w-full">Fechar</Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
