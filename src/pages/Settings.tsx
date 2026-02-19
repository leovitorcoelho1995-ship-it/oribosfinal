import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import type { Settings as SettingsType } from "@/types";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy } from "lucide-react";
import { useCompany } from "@/contexts/CompanyContext";
import { ProfessionalsTab } from "@/components/settings/agenda/ProfessionalsTab";
import { ServicesTab } from "@/components/settings/agenda/ServicesTab";
import { AvailabilityTab } from "@/components/settings/agenda/AvailabilityTab";

export default function Settings() {
    const { companyId, companyName } = useCompany();
    const [searchParams] = useSearchParams();
    const activeTab = searchParams.get("tab") || "company";
    const [loading, setLoading] = useState(false);
    const [settings, setSettings] = useState<SettingsType>({
        id: "",
        company_id: "",
        whatsapp_number: "",
        business_hours_start: "08:00",
        business_hours_end: "18:00",
        welcome_message: "",
        reminder_message: "",
        followup_message: "",
        cobr_message_1: "",
        cobr_message_2: "",
        cobr_message_3: "",
    });

    useEffect(() => {
        if (companyId) {
            fetchSettings();
        }
    }, [companyId]);

    async function fetchSettings() {
        const { data } = await supabase
            .from("settings")
            .select("*")
            .eq("company_id", companyId!)
            .maybeSingle();
        if (data) {
            setSettings(data);
        }
    }

    async function handleSave() {
        if (!companyId) return;
        setLoading(true);
        try {
            const payload = {
                ...settings,
                company_id: companyId,
            };
            const { error } = await supabase
                .from("settings")
                .upsert(payload, { onConflict: "company_id" });

            if (error) throw error;
            toast.success("Configurações salvas!");
        } catch (error) {
            console.error(error);
            toast.error("Erro ao salvar configurações.");
        } finally {
            setLoading(false);
        }
    }

    function handleCopy(text: string) {
        navigator.clipboard.writeText(text);
        toast.success("Copiado!");
    }

    const apiUrl = import.meta.env.VITE_SUPABASE_URL || "SUA_URL_SUPABASE";

    return (
        <AppLayout
            title="Configurações"
            headerAction={
                <Button size="sm" onClick={handleSave} disabled={loading}>
                    {loading ? "Salvando..." : "Salvar Alterações"}
                </Button>
            }
        >
            <Tabs value={activeTab} className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="company">Empresa</TabsTrigger>
                    <TabsTrigger value="messages">Mensagens WhatsApp</TabsTrigger>
                    <TabsTrigger value="automation">Automação & API</TabsTrigger>
                    <TabsTrigger value="agenda">📅 Agenda</TabsTrigger>
                </TabsList>

                <TabsContent value="company">
                    <Card>
                        <CardHeader>
                            <CardTitle>Dados da Empresa</CardTitle>
                            <CardDescription>
                                Informações básicas do seu negócio.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="company_name">Nome da Empresa</Label>
                                    <Input
                                        id="company_name"
                                        value={companyName || ""}
                                        disabled
                                        className="bg-muted"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Nome definido pelo administrador.
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="whatsapp_number">WhatsApp Principal</Label>
                                    <Input
                                        id="whatsapp_number"
                                        value={settings.whatsapp_number || ""}
                                        onChange={(e) =>
                                            setSettings({
                                                ...settings,
                                                whatsapp_number: e.target.value,
                                            })
                                        }
                                        placeholder="5511999999999"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="business_hours_start">Início Expediente</Label>
                                    <Input
                                        id="business_hours_start"
                                        type="time"
                                        value={settings.business_hours_start || ""}
                                        onChange={(e) =>
                                            setSettings({
                                                ...settings,
                                                business_hours_start: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="business_hours_end">Fim Expediente</Label>
                                    <Input
                                        id="business_hours_end"
                                        type="time"
                                        value={settings.business_hours_end || ""}
                                        onChange={(e) =>
                                            setSettings({
                                                ...settings,
                                                business_hours_end: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="messages">
                    <Card>
                        <CardHeader>
                            <CardTitle>Modelos de Mensagem</CardTitle>
                            <CardDescription>
                                Personalize as mensagens automáticas. Use as variáveis {"{name}"}, {"{time}"}, {"{value}"}.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Boas-vindas</Label>
                                    <Textarea
                                        rows={3}
                                        value={settings.welcome_message || ""}
                                        onChange={(e) => setSettings({ ...settings, welcome_message: e.target.value })}
                                    />
                                    <p className="text-xs text-muted-foreground">Ex: Olá {`{name}`}, como posso ajudar?</p>
                                </div>
                                <div className="space-y-2">
                                    <Label>Lembrete de Agendamento</Label>
                                    <Textarea
                                        rows={3}
                                        value={settings.reminder_message || ""}
                                        onChange={(e) => setSettings({ ...settings, reminder_message: e.target.value })}
                                    />
                                    <p className="text-xs text-muted-foreground">Ex: Agendamento amanhã às {`{time}`}.</p>
                                </div>
                                <div className="space-y-2">
                                    <Label>Follow-up</Label>
                                    <Textarea
                                        rows={3}
                                        value={settings.followup_message || ""}
                                        onChange={(e) => setSettings({ ...settings, followup_message: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Cobrança (Preventiva)</Label>
                                    <Textarea
                                        rows={3}
                                        value={settings.cobr_message_1 || ""}
                                        onChange={(e) => setSettings({ ...settings, cobr_message_1: e.target.value })}
                                    />
                                    <p className="text-xs text-muted-foreground">Ex: Pagamento de R$ {`{value}`} vence em breve.</p>
                                </div>
                                <div className="space-y-2">
                                    <Label>Cobrança (Vencido)</Label>
                                    <Textarea
                                        rows={3}
                                        value={settings.cobr_message_2 || ""}
                                        onChange={(e) => setSettings({ ...settings, cobr_message_2: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Cobrança (Urgente)</Label>
                                    <Textarea
                                        rows={3}
                                        value={settings.cobr_message_3 || ""}
                                        onChange={(e) => setSettings({ ...settings, cobr_message_3: e.target.value })}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Agenda Settings Tab */}
                <TabsContent value="agenda">
                    <Tabs defaultValue="professionals" className="space-y-6">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="professionals">Profissionais</TabsTrigger>
                            <TabsTrigger value="services">Serviços</TabsTrigger>
                            <TabsTrigger value="availability">Disponibilidade</TabsTrigger>
                        </TabsList>

                        <TabsContent value="professionals" className="mt-4">
                            <Card>
                                <CardContent className="pt-6">
                                    <ProfessionalsTab />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="services" className="mt-4">
                            <Card>
                                <CardContent className="pt-6">
                                    <ServicesTab />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="availability" className="mt-4">
                            <Card>
                                <CardContent className="pt-6">
                                    <AvailabilityTab />
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>

                    {/* Agenda Endpoints Section (for n8n) */}
                    <Card className="mt-6 border-dashed">
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Endpoints da Agenda (para n8n)</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs">Consultar Disponibilidade (RPC)</Label>
                                <div className="flex gap-2">
                                    <Input
                                        readOnly
                                        value="get_available_slots(p_company_id, p_professional_id, p_service_id, p_date)"
                                        className="font-mono text-xs bg-muted"
                                    />
                                    <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => {
                                        navigator.clipboard.writeText("get_available_slots");
                                        toast.success("Nome da função copiado!");
                                    }}>
                                        <Copy className="h-3 w-3" />
                                    </Button>
                                </div>
                                <p className="text-[10px] text-muted-foreground">
                                    Use este nome de função no nó Supabase para verificar horários livres.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="automation">
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Integração n8n / Supabase</CardTitle>
                                <CardDescription>
                                    Use estas informações para configurar seus workflows no n8n.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="p-4 bg-muted rounded-md space-y-4">
                                    <div className="space-y-1">
                                        <Label className="text-xs font-semibold uppercase text-muted-foreground">API URL</Label>
                                        <div className="flex items-center gap-2">
                                            <code className="flex-1 bg-background p-2 rounded border font-mono text-sm">{apiUrl}</code>
                                            <Button size="icon" variant="outline" onClick={() => handleCopy(apiUrl)}><Copy className="h-4 w-4" /></Button>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs font-semibold uppercase text-muted-foreground">Company ID (para n8n)</Label>
                                        <div className="flex items-center gap-2">
                                            <code className="flex-1 bg-background p-2 rounded border font-mono text-sm">{companyId || "Carregando..."}</code>
                                            <Button size="icon" variant="outline" onClick={() => handleCopy(companyId || "")} disabled={!companyId}><Copy className="h-4 w-4" /></Button>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Use este ID no campo <code>company_id</code> dos seus workflows n8n.
                                        </p>
                                    </div>
                                </div>

                                <div className="text-sm text-muted-foreground">
                                    <p className="mb-2"><strong>Dicas para n8n:</strong></p>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li>Use o nó "Supabase" para ler/gravar dados.</li>
                                        <li>Use a Service Role Key (não exposta aqui por segurança) para acesso total.</li>
                                        <li>Configure webhooks no n8n para receber eventos do WhatsApp (via Evolution API, etc).</li>
                                        <li>Sempre inclua o <code>company_id</code> nos inserts para vincular dados à sua empresa.</li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>

                        {/* PIX / n8n Integration */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Integração PIX / n8n</CardTitle>
                                <CardDescription>
                                    Configure o webhook do seu gateway para atualizar transações automaticamente.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Endpoint Supabase (Webhook)</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            readOnly
                                            value={`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/transactions`}
                                            className="font-mono text-sm bg-muted"
                                        />
                                        <Button variant="outline" size="icon" onClick={() => {
                                            navigator.clipboard.writeText(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/transactions`);
                                            toast.success("Endpoint copiado!");
                                        }}>
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>ID da Empresa (company_id)</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            readOnly
                                            value={companyId || "Carregando..."}
                                            className="font-mono text-sm bg-muted"
                                        />
                                        <Button variant="outline" size="icon" onClick={() => {
                                            if (companyId) {
                                                navigator.clipboard.writeText(companyId);
                                                toast.success("ID copiado!");
                                            }
                                        }}>
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Use esses dados no n8n com a Service Role Key para inserir ou atualizar transações via API REST.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </AppLayout>
    );
}
