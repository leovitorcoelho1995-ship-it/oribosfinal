import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, LogIn, TrendingUp, Wallet, Calendar, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAdmin } from "@/contexts/AdminContext";
import { useNavigate } from "react-router-dom";
import type { Company } from "@/types";

export default function AdminMetrics() {
    const { startImpersonation } = useAdmin();
    const navigate = useNavigate();
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);

    const PLAN_VALUES = {
        basic: 197,
        pro: 397
    };

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        setLoading(true);
        const { data, error } = await supabase
            .from("companies")
            .select("*")
            .filter("is_admin", "neq", true)
            .order("created_at", { ascending: false });

        if (!error) setCompanies(data || []);
        setLoading(false);
    }

    const activeCount = companies.length;
    const basicCount = companies.filter(c => c.plan === "basic" || !c.plan).length;
    const proCount = companies.filter(c => c.plan === "pro").length;
    const mrr = (basicCount * PLAN_VALUES.basic) + (proCount * PLAN_VALUES.pro);

    const newThisMonth = companies.filter(c => {
        const date = new Date(c.created_at);
        const now = new Date();
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length;

    async function handleImpersonate(company: Company) {
        await startImpersonation(company.id, company.company_name);
        navigate("/");
    }

    return (
        <AppLayout title="Métricas do Negócio">
            <div className="space-y-6 pb-10">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Total Empresas</CardTitle>
                            <Building className="h-4 w-4 text-[#7B4DB8]" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{activeCount}</div>
                            <p className="text-xs text-muted-foreground mt-1">Empresas ativas na base</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">MRR Estimado</CardTitle>
                            <Wallet className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(mrr)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Churn rate estimado: 0%</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Planos</CardTitle>
                            <TrendingUp className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-4">
                                <div>
                                    <div className="text-lg font-bold">{basicCount}</div>
                                    <p className="text-[10px] text-muted-foreground">Basic</p>
                                </div>
                                <div className="border-r h-8" />
                                <div>
                                    <div className="text-lg font-bold">{proCount}</div>
                                    <p className="text-[10px] text-muted-foreground">Pro</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Mês Atual</CardTitle>
                            <Calendar className="h-4 w-4 text-orange-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">+{newThisMonth}</div>
                            <p className="text-xs text-muted-foreground mt-1">Novas empresas em {new Date().toLocaleDateString('pt-BR', { month: 'long' })}</p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-[#7B4DB8]" />
                            Detalhamento por Empresa
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nome</TableHead>
                                        <TableHead>Plano</TableHead>
                                        <TableHead>WhatsApp</TableHead>
                                        <TableHead>Cadastro</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center h-24">Carregando métricas...</TableCell>
                                        </TableRow>
                                    ) : companies.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center h-24">Nenhuma empresa encontrada.</TableCell>
                                        </TableRow>
                                    ) : (
                                        companies.map((company) => (
                                            <TableRow key={company.id}>
                                                <TableCell className="font-medium">{company.company_name}</TableCell>
                                                <TableCell>
                                                    <Badge variant={company.plan === "pro" ? "default" : "secondary"}>
                                                        {company.plan || "basic"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm font-mono">{company.whatsapp_number || "-"}</TableCell>
                                                <TableCell className="text-xs">
                                                    {new Date(company.created_at).toLocaleDateString('pt-BR')}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-[#7B4DB8]"
                                                            onClick={() => navigate(`/admin/clients?id=${company.id}`)}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-[#7B4DB8]"
                                                            onClick={() => handleImpersonate(company)}
                                                        >
                                                            <LogIn className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

function Building({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
            <path d="M9 22v-4h6v4" />
            <path d="M8 6h.01" />
            <path d="M16 6h.01" />
            <path d="M8 10h.01" />
            <path d="M16 10h.01" />
            <path d="M8 14h.01" />
            <path d="M16 14h.01" />
            <path d="M8 18h.01" />
            <path d="M16 18h.01" />
        </svg>
    )
}
