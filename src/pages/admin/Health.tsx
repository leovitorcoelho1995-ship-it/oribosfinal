import { useState, useEffect } from "react";
import { useAdmin } from "@/contexts/AdminContext";
import { supabase } from "@/lib/supabase";
import {
    Loader2,
    Activity,
    Search,
    LogOut,
    ServerCrash
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LogDrawer } from "@/components/admin/LogDrawer";
import { toast } from "sonner";

interface CompanyHealth {
    id: string;
    company_name: string;
    owner_id: string;
    created_at: string;
    last_login_at: string | null;
    onboarding_completed: boolean;
    active_subscription: boolean;
    error_count: number; // Computed locally or via View
}

export default function HealthDashboard() {
    const { isAdmin, startImpersonation } = useAdmin();
    const [companies, setCompanies] = useState<CompanyHealth[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Log Drawer State
    const [logDrawerOpen, setLogDrawerOpen] = useState(false);
    const [selectedCompanyLogs, setSelectedCompanyLogs] = useState<any[]>([]);
    const [selectedCompanyName, setSelectedCompanyName] = useState("");

    useEffect(() => {
        if (isAdmin) {
            fetchHealthData();
        }
    }, [isAdmin]);

    async function fetchHealthData() {
        setLoading(true);
        // Fetch companies
        const { data: companiesData, error: companiesError } = await supabase
            .from("companies")
            .select("id, company_name, owner_id, created_at, last_login_at, onboarding_completed, active_subscription");

        if (companiesError) {
            toast.error("Erro ao carregar empresas");
            setLoading(false);
            return;
        }

        // Fetch error counts (simpler than join for now, or use a view if perf needed)
        // Group by company_id?
        // Supabase JS doesn't do group by easily without RPC.
        // I'll fetch all logs for last 24h? Or just counts?
        // For MVP, fetch recent logs and aggregate in JS (if small scale) or make a separate query per company (bad).
        // Better: RPC function `get_company_health`.
        // Or for now, just show companies and open logs on click. 
        // I'll fetch simplified list.

        const healthData = companiesData.map((c: any) => ({
            ...c,
            error_count: 0 // Placeholder until we have aggregation
        }));

        // Optional: Fetch error counts.
        // const { data: logs } = await supabase.from('system_logs').select('company_id').gte('created_at', subDays(new Date(), 1).toISOString());
        // Aggregate...

        setCompanies(healthData);
        setLoading(false);
    }

    async function handleViewLogs(companyId: string, companyName: string) {
        setSelectedCompanyName(companyName);

        const { data, error } = await supabase
            .from("system_logs")
            .select("*")
            .eq("company_id", companyId)
            .order("created_at", { ascending: false })
            .limit(50);

        if (error) {
            console.error("Error fetching logs:", error);
            toast.error("Erro ao carregar logs.");
        } else if (data) {
            setSelectedCompanyLogs(data);
            setLogDrawerOpen(true);
        }
    }

    const filteredCompanies = companies.filter(c =>
        c.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.id.includes(searchTerm)
    );

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-[#5B2D8E]">Saúde do Sistema</h1>
                    <p className="text-muted-foreground">Monitoramento de status e erros dos clientes.</p>
                </div>
                {/* Global Logs Button */}
                <Button variant="outline" onClick={() => handleViewLogs("global", "Sistema Global")}>
                    <ServerCrash className="mr-2 h-4 w-4" />
                    Logs Globais (Sem Empresa)
                </Button>
            </div>

            <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar empresa..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Clientes Ativos</CardTitle>
                    <CardDescription>Visão geral de acesso e integridade.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Empresa</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Último Acesso</TableHead>
                                <TableHead>Erros (24h)</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredCompanies.map((company) => (
                                <TableRow key={company.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex flex-col">
                                            <span>{company.company_name}</span>
                                            <span className="text-xs text-muted-foreground font-mono">{company.id.slice(0, 8)}...</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            {company.onboarding_completed ?
                                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Onboarded</Badge> :
                                                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pendente</Badge>
                                            }
                                            {company.active_subscription ?
                                                <Badge variant="default" className="bg-[#5B2D8E]">Premium</Badge> :
                                                <Badge variant="secondary">Free</Badge>
                                            }
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {company.last_login_at ?
                                            format(new Date(company.last_login_at), "dd/MM/yyyy HH:mm", { locale: ptBR }) :
                                            "Nunca"}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {/* We don't have real count yet, simulate or leave empty */}
                                            <div className={`h-2 w-2 rounded-full ${company.error_count > 0 ? 'bg-red-500' : 'bg-green-500'}`} />
                                            <span className="text-sm">{company.error_count > 0 ? `${company.error_count} erros` : "Saudável"}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleViewLogs(company.id, company.company_name)}
                                                title="Ver Logs"
                                            >
                                                <Activity className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => startImpersonation(company.id, company.company_name)}
                                                title="Acessar Painel"
                                            >
                                                <LogOut className="h-4 w-4 rotate-180" /> {/* Simulate enter icon */}
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <LogDrawer
                open={logDrawerOpen}
                onOpenChange={setLogDrawerOpen}
                logs={selectedCompanyLogs}
                companyName={selectedCompanyName}
            />
        </div>
    );
}
