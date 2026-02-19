import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, UserPlus, Info, Settings as SettingsIcon, History, ArrowLeft, Building } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAdmin } from "@/contexts/AdminContext";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { Company, Settings as SettingsType } from "@/types";

export default function AdminClients() {
    const { startImpersonation } = useAdmin();
    const navigate = useNavigate();
    const [companies, setCompanies] = useState<Company[]>([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
    const [companySettings, setCompanySettings] = useState<SettingsType | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [mobilePanel, setMobilePanel] = useState<"list" | "detail">("list");

    useEffect(() => {
        fetchCompanies();
    }, []);

    useEffect(() => {
        if (selectedCompanyId) {
            const company = companies.find(c => c.id === selectedCompanyId);
            setSelectedCompany(company || null);
            fetchCompanyDetails(selectedCompanyId);
        }
    }, [selectedCompanyId, companies]);

    async function fetchCompanies() {
        const { data, error } = await supabase
            .from("companies")
            .select("*")
            .filter("is_admin", "neq", true)
            .order("company_name");

        if (!error) setCompanies(data || []);
    }

    async function fetchCompanyDetails(companyId: string) {
        // Fetch settings
        const { data: settings } = await supabase
            .from("settings")
            .select("*")
            .eq("company_id", companyId)
            .single();

        setCompanySettings(settings);
    }

    const filteredCompanies = companies.filter(c =>
        c.company_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    async function handleImpersonate(company: Company) {
        await startImpersonation(company.id, company.company_name);
        navigate("/");
    }

    return (
        <AppLayout title="Administração de Clientes">
            <div className="flex h-[calc(100vh-180px)] overflow-hidden rounded-xl border bg-background shadow-sm">
                {/* Left Panel - Company List */}
                <div className={cn(
                    "flex flex-col border-r bg-muted/5 w-full md:w-[360px]",
                    mobilePanel === "detail" ? "hidden md:flex" : "flex"
                )}>
                    <div className="p-4 border-b bg-[#7B4DB8] text-white">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="font-bold">Clientes Oribos</h2>
                            <Badge variant="secondary" className="bg-white/20 text-white border-none">
                                {companies.length}
                            </Badge>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-white/70" />
                            <Input
                                placeholder="Buscar empresa..."
                                className="pl-8 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus-visible:ring-white/30"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {filteredCompanies.map((company) => (
                            <button
                                key={company.id}
                                onClick={() => {
                                    setSelectedCompanyId(company.id);
                                    setMobilePanel("detail");
                                }}
                                className={cn(
                                    "w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left",
                                    selectedCompanyId === company.id
                                        ? "bg-[#7B4DB8]/10 border border-[#7B4DB8]/20"
                                        : "hover:bg-muted"
                                )}
                            >
                                <div className="h-10 w-10 rounded-full bg-[#7B4DB8] flex items-center justify-center text-white font-bold shrink-0">
                                    {company.company_name.substring(0, 1).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="font-semibold truncate text-sm">{company.company_name}</p>
                                        <Badge variant="outline" className="text-[10px] h-4 py-0 shrink-0 capitalize">
                                            {company.plan || 'basic'}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground truncate">{company.whatsapp_number || "Sem WhatsApp"}</p>
                                    <p className="text-[10px] text-muted-foreground mt-1">
                                        Cadastrado em {new Date(company.created_at).toLocaleDateString('pt-BR')}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right Panel - Company Details */}
                <div className={cn(
                    "flex-1 flex flex-col bg-background",
                    mobilePanel === "list" ? "hidden md:flex" : "flex"
                )}>
                    {selectedCompany ? (
                        <>
                            <div className="p-4 border-b flex items-center justify-between bg-muted/10">
                                <div className="flex items-center gap-3">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="md:hidden"
                                        onClick={() => setMobilePanel("list")}
                                    >
                                        <ArrowLeft className="h-5 w-5" />
                                    </Button>
                                    <div>
                                        <h3 className="font-bold text-lg">{selectedCompany.company_name}</h3>
                                        <p className="text-xs text-muted-foreground">ID: {selectedCompany.id}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" className="hidden sm:flex">
                                        <Info className="h-4 w-4 mr-2" /> Ver Dados
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="bg-[#7B4DB8] hover:bg-[#6a42a0]"
                                        onClick={() => handleImpersonate(selectedCompany)}
                                    >
                                        <UserPlus className="h-4 w-4 mr-2" /> Entrar como cliente
                                    </Button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-auto p-6">
                                <Tabs defaultValue="resumo" className="w-full">
                                    <TabsList className="mb-6">
                                        <TabsTrigger value="resumo">Resumo</TabsTrigger>
                                        <TabsTrigger value="config">Configurações</TabsTrigger>
                                        <TabsTrigger value="historico">Histórico</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="resumo" className="space-y-6">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                            <Card>
                                                <CardContent className="pt-6">
                                                    <p className="text-xs text-muted-foreground">Clientes</p>
                                                    <p className="text-2xl font-bold">-</p>
                                                </CardContent>
                                            </Card>
                                            <Card>
                                                <CardContent className="pt-6">
                                                    <p className="text-xs text-muted-foreground">Agendamentos (mês)</p>
                                                    <p className="text-2xl font-bold">-</p>
                                                </CardContent>
                                            </Card>
                                            <Card>
                                                <CardContent className="pt-6">
                                                    <p className="text-xs text-muted-foreground">Leads Ativos</p>
                                                    <p className="text-2xl font-bold">-</p>
                                                </CardContent>
                                            </Card>
                                            <Card>
                                                <CardContent className="pt-6">
                                                    <p className="text-xs text-muted-foreground">Vencidos (mês)</p>
                                                    <p className="text-2xl font-bold text-red-500">-</p>
                                                </CardContent>
                                            </Card>
                                        </div>

                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="text-sm">Informações de Contato</CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">WhatsApp</p>
                                                        <p className="text-sm font-medium">{selectedCompany.whatsapp_number || "Não informado"}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">Plano Atual</p>
                                                        <Badge className="capitalize">{selectedCompany.plan || "basic"}</Badge>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </TabsContent>

                                    <TabsContent value="config">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="text-sm">Parâmetros do Sistema</CardTitle>
                                                <CardDescription>Visualização das configurações da empresa.</CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                {companySettings ? (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div className="space-y-1">
                                                            <p className="text-xs font-semibold uppercase text-muted-foreground">Horário de Atendimento</p>
                                                            <p className="text-sm">{companySettings.business_hours_start} às {companySettings.business_hours_end}</p>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-xs font-semibold uppercase text-muted-foreground">WhatsApp de Agendamento</p>
                                                            <p className="text-sm">{companySettings.whatsapp_number || "Mesmo da empresa"}</p>
                                                        </div>
                                                        <div className="col-span-full border-t pt-4">
                                                            <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Mensagem de Boas-vindas</p>
                                                            <div className="p-3 bg-muted rounded text-sm italic">
                                                                "{companySettings.welcome_message || "Mensagem padrão"}"
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
                                                        <SettingsIcon className="h-8 w-8 mb-2 opacity-20" />
                                                        <p>Empresa ainda não configurou o sistema.</p>
                                                    </div>
                                                )}
                                                <div className="pt-4 border-t flex justify-end">
                                                    <Button variant="outline" size="sm" onClick={() => handleImpersonate(selectedCompany)}>
                                                        Editar via Modo Suporte
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </TabsContent>

                                    <TabsContent value="historico">
                                        <div className="flex flex-col items-center justify-center p-20 text-muted-foreground">
                                            <History className="h-10 w-10 mb-2 opacity-20" />
                                            <p>Histórico de logs indisponível no momento.</p>
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-6 text-center">
                            <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
                                <Building className="h-10 w-10 opacity-20" />
                            </div>
                            <h3 className="font-bold text-lg text-foreground mb-1">Selecione uma empresa</h3>
                            <p className="max-w-xs">Clique em uma empresa na lista à esquerda para gerenciar seus dados ou entrar em modo suporte.</p>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
