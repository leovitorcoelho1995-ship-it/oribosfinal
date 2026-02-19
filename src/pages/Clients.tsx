
import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Plus, Search, Edit, Trash2, MessageCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Client } from "@/types";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ClientModal } from "@/components/clients/ClientModal";
import { toast } from "sonner";
import { useCompany } from "@/contexts/CompanyContext";

export default function Clients() {
    const { companyId } = useCompany();
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);

    useEffect(() => {
        fetchClients();
    }, []);

    async function fetchClients() {
        setLoading(true);
        let query = supabase.from("clients").select("*").eq('company_id', companyId).order("name");

        if (searchTerm) {
            query = query.ilike("name", `% ${searchTerm}% `);
        }

        const { data, error } = await query;
        if (error) {
            toast.error("Erro ao carregar clientes");
        } else {
            setClients(data || []);
        }
        setLoading(false);
    }

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchClients();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    function handleEdit(client: Client) {
        setSelectedClient(client);
        setIsModalOpen(true);
    }

    function handleNew() {
        setSelectedClient(null);
        setIsModalOpen(true);
    }

    async function handleDelete(id: string) {
        if (!confirm("Tem certeza que deseja excluir este cliente?")) return;

        const { error } = await supabase.from("clients").delete().eq("id", id);
        if (error) {
            toast.error("Erro ao excluir cliente");
        } else {
            toast.success("Cliente excluído");
            fetchClients();
        }
    }

    function openWhatsApp(number: string | undefined) {
        if (!number) return;
        window.open(`https://wa.me/${number.replace(/\D/g, '')}`, '_blank');
    }

    return (
        <AppLayout
            title="Clientes"
            headerAction={
                <Button size="sm" onClick={handleNew}>
                    <Plus className="mr-2 h-4 w-4" /> Novo Cliente
                </Button>
            }
        >
            <div className="flex items-center gap-4 mb-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Buscar por nome..."
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
                            <TableHead>Nome</TableHead>
                            <TableHead>WhatsApp</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Criado em</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24">Carregando...</TableCell>
                            </TableRow>
                        ) : clients.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24">Nenhum cliente encontrado.</TableCell>
                            </TableRow>
                        ) : (
                            clients.map((client) => (
                                <TableRow key={client.id}>
                                    <TableCell className="font-medium">{client.name}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {client.whatsapp}
                                            {client.whatsapp && (
                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-green-600" onClick={() => openWhatsApp(client.whatsapp)}>
                                                    <MessageCircle className="h-3 w-3" />
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>{client.email}</TableCell>
                                    <TableCell>
                                        <Badge variant={client.status === "active" ? "default" : "secondary"}>
                                            {client.status === "active" ? "Ativo" : "Inativo"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{new Date(client.created_at).toLocaleDateString('pt-BR')}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(client)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(client.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )))}
                    </TableBody>
                </Table>
            </div>

            <ClientModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                clientToEdit={selectedClient}
                onSuccess={fetchClients}
            />
        </AppLayout>
    );
}
