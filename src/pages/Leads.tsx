import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Plus, GripVertical, MessageCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Lead } from "@/types";
import { LeadModal } from "@/components/leads/LeadModal";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { useCompany } from "@/contexts/CompanyContext";
import { Card, CardContent } from "@/components/ui/card";

const STAGES = [
    { id: 'novo', label: 'Novo', color: 'bg-blue-100 dark:bg-blue-900/20' },
    { id: 'contato', label: 'Em Contato', color: 'bg-yellow-100 dark:bg-yellow-900/20' },
    { id: 'proposta', label: 'Proposta Enviada', color: 'bg-purple-100 dark:bg-purple-900/20' },
    { id: 'fechado', label: 'Fechado', color: 'bg-green-100 dark:bg-green-900/20' },
    { id: 'perdido', label: 'Perdido', color: 'bg-red-100 dark:bg-red-900/20' },
];

export default function Leads() {
    const { companyId } = useCompany();
    const [leads, setLeads] = useState<Lead[]>([]);
    // const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [updatingLeadId, setUpdatingLeadId] = useState<string | null>(null);

    useEffect(() => {
        fetchLeads();
    }, []);

    async function fetchLeads() {
        // setLoading(true);
        const { data, error } = await supabase.from("leads").select("*").eq('company_id', companyId).order("created_at", { ascending: false });
        if (error) {
            toast.error("Erro ao carregar leads");
        } else {
            setLeads(data || []);
        }
        // setLoading(false);
    }

    function handleDragStart(e: React.DragEvent, leadId: string) {
        e.dataTransfer.setData("leadId", leadId);
    }

    function handleDragOver(e: React.DragEvent) {
        e.preventDefault();
    }

    async function handleDrop(e: React.DragEvent, newStage: string) {
        e.preventDefault();
        const leadId = e.dataTransfer.getData("leadId");
        if (!leadId) return;

        const lead = leads.find(l => l.id === leadId);
        if (lead && lead.stage !== newStage) {
            // Optimistic update
            const updatedLeads = leads.map(l => l.id === leadId ? { ...l, stage: newStage as any } : l);
            setLeads(updatedLeads);
            setUpdatingLeadId(leadId);

            const { error } = await supabase.from("leads").update({ stage: newStage }).eq("id", leadId).eq('company_id', companyId);
            setUpdatingLeadId(null);

            if (error) {
                toast.error("Erro ao mover lead");
                fetchLeads(); // Revert
            } else {
                toast.success(`Lead movido para ${STAGES.find(s => s.id === newStage)?.label}`);
            }
        }
    }

    function handleEdit(lead: Lead) {
        setSelectedLead(lead);
        setIsModalOpen(true);
    }

    function handleNew() {
        setSelectedLead(null);
        setIsModalOpen(true);
    }

    function getLeadsByStage(stage: string) {
        return leads.filter(l => l.stage === stage);
    }

    return (
        <AppLayout
            title="Leads"
            headerAction={<Button size="sm" onClick={handleNew}><Plus className="mr-2 h-4 w-4" /> Novo Lead</Button>}
        >
            <div className="flex gap-4 overflow-x-auto h-[calc(100vh-140px)] pb-4 min-w-[1000px]">
                {STAGES.map((stage) => {
                    const stageLeads = getLeadsByStage(stage.id);
                    return (
                        <div
                            key={stage.id}
                            className={`min-w-[280px] w-[280px] rounded-lg p-2 flex flex-col ${stage.color} border border-transparent`}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, stage.id)}
                        >
                            <div className="font-semibold mb-3 flex items-center justify-between px-2 pt-2">
                                {stage.label}
                                <Badge variant="secondary" className="text-xs">{stageLeads.length}</Badge>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-3 px-1 pb-2">
                                {stageLeads.map(lead => (
                                    <Card
                                        key={lead.id}
                                        className={`cursor-move hover:shadow-md transition-shadow relative group ${updatingLeadId === lead.id ? 'opacity-50 cursor-wait' : ''}`}
                                        draggable={updatingLeadId !== lead.id}
                                        onDragStart={(e) => handleDragStart(e, lead.id)}
                                        onClick={() => handleEdit(lead)}
                                    >
                                        <CardContent className="p-3">
                                            <div className="flex justify-between items-start mb-2">
                                                <p className="font-semibold text-sm truncate">{lead.name}</p>
                                                <div className="cursor-grab opacity-50"><GripVertical className="h-4 w-4" /></div>
                                            </div>

                                            {lead.value && <p className="text-xs font-semibold text-green-600 mb-2">R$ {lead.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>}

                                            <div className="flex items-center justify-between mt-2">
                                                <Badge variant="outline" className="text-[10px] h-5">{lead.source}</Badge>
                                                {lead.whatsapp && (
                                                    <Button size="icon" variant="ghost" className="h-6 w-6 text-green-600 -mr-1" onClick={(e) => {
                                                        e.stopPropagation();
                                                        window.open(`https://wa.me/${lead.whatsapp?.replace(/\D/g, '')}`, '_blank');
                                                    }}>
                                                        <MessageCircle className="h-3 w-3" />
                                                    </Button>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-muted-foreground mt-2 text-right">
                                                {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                                            </p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>

            <LeadModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                leadToEdit={selectedLead}
                onSuccess={fetchLeads}
            />
        </AppLayout>
    );
}
