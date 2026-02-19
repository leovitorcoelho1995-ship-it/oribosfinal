import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Plus, CheckCircle, Search, Trash2, Edit } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Payment } from "@/types";
import { PaymentModal } from "@/components/financial/PaymentModal";
import { toast } from "sonner";
import { useCompany } from "@/contexts/CompanyContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export default function Financial() {
    const { companyId } = useCompany();
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        checkOverduePayments();
        fetchPayments();
    }, []);

    async function checkOverduePayments() {
        const today = new Date().toISOString().split('T')[0];

        const { data: overdue } = await supabase
            .from('payments')
            .select('*')
            .eq('company_id', companyId)
            .eq('status', 'pending')
            .lt('due_date', today);

        if (overdue && overdue.length > 0) {
            await supabase
                .from('payments')
                .update({ status: 'overdue' })
                .in('id', overdue.map(p => p.id));
            toast.info(`${overdue.length} pagamentos atualizados para 'Vencido'`);
        }
    }

    async function fetchPayments() {
        setLoading(true);
        let query = supabase.from("payments").select("*").eq('company_id', companyId).order("due_date", { ascending: true });

        if (searchTerm) {
            query = query.ilike('client_name', `%${searchTerm}%`);
        }

        const { data } = await query;
        setPayments(data || []);
        setLoading(false);
    }

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchPayments();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);


    async function markAsPaid(id: string) {
        if (!confirm("Confirmar pagamento?")) return;

        const today = new Date().toISOString().split('T')[0];
        const { error } = await supabase
            .from('payments')
            .update({ status: 'paid', paid_date: today })
            .eq('id', id);

        if (error) {
            toast.error("Erro ao atualizar pagamento");
        } else {
            toast.success("Pagamento confirmado");
            fetchPayments();
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Excluir pagamento?")) return;
        await supabase.from('payments').delete().eq('id', id);
        toast.success("Pagamento excluído");
        fetchPayments();
    }

    function handleEdit(payment: Payment) {
        setSelectedPayment(payment);
        setIsModalOpen(true);
    }

    function handleNew() {
        setSelectedPayment(null);
        setIsModalOpen(true);
    }

    // Calculations
    const totalReceivable = payments.filter(p => p.status === 'pending').reduce((acc, p) => acc + p.amount, 0);
    const totalOverdue = payments.filter(p => p.status === 'overdue').reduce((acc, p) => acc + p.amount, 0);
    const totalReceived = payments.filter(p => p.status === 'paid').reduce((acc, p) => acc + p.amount, 0); // Simplified, ideally filter by month

    return (
        <AppLayout
            title="Financeiro"
            headerAction={<Button size="sm" onClick={handleNew}><Plus className="mr-2 h-4 w-4" /> Novo Pagamento</Button>}
        >
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">A Receber</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">R$ {totalReceivable.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Vencidos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-500">R$ {totalOverdue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Recebido (Total)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">R$ {totalReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex items-center gap-4 mb-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Buscar por cliente..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Descrição</TableHead>
                            <TableHead>Valor</TableHead>
                            <TableHead>Vencimento</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24">Carregando...</TableCell>
                            </TableRow>
                        ) : payments.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24">Nenhum pagamento encontrado.</TableCell>
                            </TableRow>
                        ) : (
                            payments.map((payment) => (
                                <TableRow key={payment.id} className={payment.status === 'overdue' ? 'bg-red-50 dark:bg-red-900/10' : ''}>
                                    <TableCell className="font-medium">{payment.client_name}</TableCell>
                                    <TableCell>{payment.description}</TableCell>
                                    <TableCell>R$ {payment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                                    <TableCell>{new Date(payment.due_date).toLocaleDateString('pt-BR')}</TableCell>
                                    <TableCell>
                                        <Badge variant={
                                            payment.status === 'paid' ? 'default' :
                                                payment.status === 'overdue' ? 'destructive' : 'outline'
                                        } className="capitalize"
                                        >
                                            {payment.status === 'paid' ? 'Pago' :
                                                payment.status === 'overdue' ? 'Vencido' : 'Pendente'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            {payment.status !== 'paid' && (
                                                <Button variant="ghost" size="icon" className="text-green-600" title="Marcar como Pago" onClick={() => markAsPaid(payment.id)}>
                                                    <CheckCircle className="h-4 w-4" />
                                                </Button>
                                            )}
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(payment)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(payment.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )))}
                    </TableBody>
                </Table>
            </div>

            <PaymentModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                paymentToEdit={selectedPayment}
                onSuccess={fetchPayments}
            />
        </AppLayout>
    );
}
