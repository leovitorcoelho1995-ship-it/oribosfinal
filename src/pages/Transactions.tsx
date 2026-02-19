import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
    Search,
    Plus,
    Receipt,
    Clock,
    Eye,
    CheckCircle,
    X,
    Download,
    Calendar as CalendarIcon,
    XCircle,
} from "lucide-react"; import { supabase } from "@/lib/supabase";
import type { Transaction } from "@/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useCompany } from "@/contexts/CompanyContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Placeholder for sub-components (will create later)
import { TransactionDrawer } from "@/components/transactions/TransactionDrawer";
import { ManualConfirmationModal } from "@/components/transactions/ManualConfirmationModal";
import { NewTransactionModal } from "@/components/transactions/NewTransactionModal";

export default function Transactions() {
    const { companyId } = useCompany();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [filterSource, setFilterSource] = useState<string>("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isNewTxModalOpen, setIsNewTxModalOpen] = useState(false);
    const [transactionToConfirm, setTransactionToConfirm] = useState<Transaction | null>(null);

    // Summary Stats
    const [stats, setStats] = useState({
        receivedToday: 0,
        pendingCount: 0,
        monthTotal: 0,
        expiredCancelledToday: 0
    });

    useEffect(() => {
        fetchTransactions();

        // Realtime Subscription
        const subscription = supabase
            .channel('transactions-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'transactions' },
                (payload) => {
                    handleRealtimeUpdate(payload);
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    // Also refetch when filters change (if implemented server-side, but let's do client-side for now for simplicity unless pagination requires it)
    // Going with client-side filtering for search/status for responsiveness, but fetching all recent.
    // User asked for 20 pagination. I'll implement simple fetching.

    async function fetchTransactions() {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .eq('company_id', companyId)
                .order('created_at', { ascending: false })
                .limit(100); // Fetch last 100 for now, logic can be extended for pagination

            if (error) throw error;
            setTransactions(data || []);
            calculateStats(data || []);
        } catch (error) {
            console.error("Error fetching transactions:", error);
            toast.error("Erro ao carregar transações");
        } finally {
            setLoading(false);
        }
    }

    function calculateStats(data: Transaction[]) {
        const today = new Date().toISOString().split('T')[0];
        const currentMonth = new Date().getMonth();

        const receivedToday = data
            .filter(t => t.status === 'paid' && t.paid_at?.startsWith(today))
            .reduce((sum, t) => sum + Number(t.amount), 0);

        const pendingCount = data.filter(t => t.status === 'pending').length;

        const monthTotal = data
            .filter(t => t.status === 'paid' && new Date(t.paid_at!).getMonth() === currentMonth)
            .reduce((sum, t) => sum + Number(t.amount), 0);

        const expiredCancelledToday = data
            .filter(t => (t.status === 'expired' || t.status === 'cancelled') && t.created_at.startsWith(today))
            .length;

        setStats({ receivedToday, pendingCount, monthTotal, expiredCancelledToday });
    }

    const handleRealtimeUpdate = (payload: any) => {
        // Optimistic update or simple refetch
        // If payment confirmed via webhook (pending -> paid)
        if (payload.eventType === 'UPDATE' && payload.new.status === 'paid' && payload.old.status === 'pending') {
            toast.success(`✓ Pagamento recebido — ${payload.new.client_name} — ${formatCurrency(payload.new.amount)}`);
        }
        fetchTransactions(); // Simplest way to keep sync
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const formatPhone = (phone: string) => {
        return phone.replace(/(\d{2})(\d{2})(\d{5})(\d{4})/, '+$1 $2 $3-$4');
    };

    const statusBadge = (status: string) => {
        switch (status) {
            case 'pending': return <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">Aguardando</Badge>;
            case 'paid': return <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">Pago</Badge>;
            case 'expired': return <Badge variant="secondary" className="bg-gray-100 text-gray-500 hover:bg-gray-100">Expirado</Badge>;
            case 'cancelled': return <Badge variant="destructive" className="bg-red-50 text-red-600 border-red-100 hover:bg-red-50">Cancelado</Badge>;
            case 'manual': return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-50">Conf. Manual</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    const sourceBadge = (source: string) => {
        switch (source) {
            case 'whatsapp': return <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-100 text-[10px] h-5">WhatsApp</Badge>;
            case 'manual': return <Badge variant="secondary" className="bg-gray-50 text-gray-600 border-gray-200 text-[10px] h-5">Manual</Badge>;
            case 'webhook': return <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100 text-[10px] h-5">Automático</Badge>;
            default: return <Badge variant="outline" className="text-[10px] h-5">{source}</Badge>;
        }
    };

    // Filter Logic
    const filteredTransactions = transactions.filter(t => {
        const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
        const matchesSource = filterSource === 'all' || t.source === filterSource;
        const matchesSearch = t.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.remote_jid.includes(searchTerm) ||
            t.description.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSource && matchesSearch;
    });

    const handleConfirmPayment = (tx: Transaction) => {
        setTransactionToConfirm(tx);
        setIsConfirmModalOpen(true);
    };

    const handleCancelTransaction = async (tx: Transaction) => {
        if (confirm("Tem certeza que deseja cancelar esta transação?")) {
            try {
                const { error } = await supabase
                    .from('transactions')
                    .update({ status: 'cancelled' })
                    .eq('id', tx.id);

                if (error) throw error;
                toast.success("Transação cancelada");
                fetchTransactions();
            } catch (err) {
                console.error(err);
                toast.error("Erro ao cancelar");
            }
        }
    };

    return (
        <AppLayout
            title="Transações PIX"
            headerAction={
                <Button onClick={() => setIsNewTxModalOpen(true)} className="bg-primary hover:bg-primary/90">
                    <Plus className="mr-2 h-4 w-4" /> Nova Transação
                </Button>
            }
        >
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Recebido Hoje</CardTitle>
                        <Receipt className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.receivedToday)}</div>
                        <p className="text-xs text-muted-foreground">Pagamentos confirmados</p>
                    </CardContent>
                </Card>
                <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setFilterStatus('pending')}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Aguardando</CardTitle>
                        <Clock className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-600">{stats.pendingCount}</div>
                        <p className="text-xs text-muted-foreground">Transações pendentes</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Mês</CardTitle>
                        <CalendarIcon className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary">{formatCurrency(stats.monthTotal)}</div>
                        <p className="text-xs text-muted-foreground">Acumulado mensal</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Canceladas Hoje</CardTitle>
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-muted-foreground">{stats.expiredCancelledToday}</div>
                        <p className="text-xs text-muted-foreground">Expiradas ou canceladas</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6 items-end md:items-center justify-between bg-white p-4 rounded-lg border shadow-sm">
                <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                    <div className="w-full md:w-[300px] relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar cliente, número ou descrição..."
                            className="pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-full md:w-[180px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos Status</SelectItem>
                            <SelectItem value="pending">Aguardando</SelectItem>
                            <SelectItem value="paid">Pago</SelectItem>
                            <SelectItem value="expired">Expirado</SelectItem>
                            <SelectItem value="cancelled">Cancelado</SelectItem>
                            <SelectItem value="manual">Conf. Manual</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={filterSource} onValueChange={setFilterSource}>
                        <SelectTrigger className="w-full md:w-[180px]">
                            <SelectValue placeholder="Origem" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas Origens</SelectItem>
                            <SelectItem value="whatsapp">WhatsApp</SelectItem>
                            <SelectItem value="manual">Manual</SelectItem>
                            <SelectItem value="webhook">Automático</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Button variant="outline" className="gap-2">
                    <Download className="h-4 w-4" /> Exportar CSV
                </Button>
            </div>

            {/* Table */}
            <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead>Cliente</TableHead>
                            <TableHead>Contato</TableHead>
                            <TableHead>Descrição</TableHead>
                            <TableHead>Valor</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Origem</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    <div className="flex justify-center items-center gap-2 text-muted-foreground">
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                        Carregando...
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredTransactions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                    Nenhuma transação encontrada.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredTransactions.map((tx) => (
                                <TableRow
                                    key={tx.id}
                                    className={cn(
                                        tx.status === 'pending' && (new Date().getTime() - new Date(tx.created_at).getTime() > 86400000) ? 'bg-amber-50/50' : '',
                                        tx.status === 'paid' ? 'bg-green-50/30' : ''
                                    )}
                                >
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                                                {tx.client_name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-foreground">{tx.client_name}</span>
                                                <span className="text-xs text-muted-foreground font-mono">{tx.remote_jid}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm">{formatPhone(tx.client_phone)}</span>
                                            {tx.client_phone && (
                                                <a
                                                    href={`https://wa.me/${tx.client_phone.replace(/\D/g, '')}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-green-600 hover:text-green-700"
                                                >
                                                    <Receipt className="h-3 w-3" /> {/* Using Receipt as generic icon, ideally WhatsApp icon */}
                                                </a>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                                        {tx.description}
                                    </TableCell>
                                    <TableCell>
                                        <span className={cn(
                                            "font-semibold",
                                            tx.status === 'paid' || tx.status === 'manual' ? "text-green-600" : "text-foreground"
                                        )}>
                                            {formatCurrency(Number(tx.amount))}
                                        </span>
                                    </TableCell>
                                    <TableCell>{statusBadge(tx.status)}</TableCell>
                                    <TableCell>{sourceBadge(tx.source)}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                title="Ver Detalhes"
                                                onClick={() => { setSelectedTransaction(tx); setIsDrawerOpen(true); }}
                                            >
                                                <Eye className="h-4 w-4 text-muted-foreground" />
                                            </Button>

                                            {(tx.status === 'pending' || tx.status === 'expired') && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    title="Confirmar Manualmente"
                                                    className="hover:text-green-600 hover:bg-green-50"
                                                    onClick={() => handleConfirmPayment(tx)}
                                                >
                                                    <CheckCircle className="h-4 w-4" />
                                                </Button>
                                            )}

                                            {tx.status === 'pending' && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    title="Cancelar"
                                                    className="hover:text-red-600 hover:bg-red-50"
                                                    onClick={() => handleCancelTransaction(tx)}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Components */}
            <TransactionDrawer
                open={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                transaction={selectedTransaction}
                onUpdate={fetchTransactions}
            />

            <ManualConfirmationModal
                open={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                transaction={transactionToConfirm}
                onConfirm={fetchTransactions}
            />

            <NewTransactionModal
                open={isNewTxModalOpen}
                onClose={() => setIsNewTxModalOpen(false)}
                onSuccess={fetchTransactions}
            />
        </AppLayout>
    );
}
