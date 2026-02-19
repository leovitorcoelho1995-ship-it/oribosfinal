import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { useCompany } from "@/contexts/CompanyContext";
import { supabase } from "@/lib/supabase";
import type { SupportMessage } from "@/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface SupportModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SupportModal({ open, onOpenChange }: SupportModalProps) {
    const { companyId, companyName } = useCompany();
    const [messages, setMessages] = useState<SupportMessage[]>([]);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);

    // Form
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [priority, setPriority] = useState<"normal" | "high">("normal");

    useEffect(() => {
        if (open && companyId) {
            fetchMessages();
            // Subscribe to changes
            const subscription = supabase
                .channel('support_messages_client')
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'support_messages',
                    filter: `company_id=eq.${companyId}`
                }, () => {
                    fetchMessages();
                })
                .subscribe();

            return () => {
                subscription.unsubscribe();
            }
        }
    }, [open, companyId]);

    async function fetchMessages() {
        setLoading(true);
        const { data } = await supabase
            .from("support_messages")
            .select("*")
            .eq("company_id", companyId)
            .order("created_at", { ascending: false })
            .limit(5);

        if (data) setMessages(data);
        setLoading(false);
    }

    async function handleSubmit() {
        if (!subject || message.length < 10) {
            toast.error("Preencha o assunto e descreva o problema (mínimo 10 caracteres).");
            return;
        }

        setSending(true);
        const { error } = await supabase.from("support_messages").insert({
            company_id: companyId,
            company_name: companyName,
            subject,
            message,
            priority
        });

        if (error) {
            console.error(error);
            toast.error("Erro ao enviar mensagem.");
        } else {
            toast.success("Mensagem enviada! Retornaremos em breve.");
            setSubject("");
            setMessage("");
            setPriority("normal");
            fetchMessages();
            onOpenChange(false);
        }
        setSending(false);
    }

    const ORIBOS_WHATSAPP = import.meta.env.VITE_ORIBOS_WHATSAPP || "5511999999999";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Falar com a Oribos</DialogTitle>
                    <DialogDescription>
                        Nossa equipe responde em até 2 horas em dias úteis.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Assunto</Label>
                        <Select value={subject} onValueChange={setSubject}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione o assunto" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Meu WhatsApp não está funcionando">Meu WhatsApp não está funcionando</SelectItem>
                                <SelectItem value="Não estou recebendo leads">Não estou recebendo leads</SelectItem>
                                <SelectItem value="Problema na agenda">Problema na agenda</SelectItem>
                                <SelectItem value="Dúvida sobre pagamentos">Dúvida sobre pagamentos</SelectItem>
                                <SelectItem value="Outro">Outro</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Descrição</Label>
                        <Textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Descreva o que está acontecendo..."
                            className="min-h-[100px]"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Prioridade</Label>
                        <RadioGroup value={priority} onValueChange={(v: "normal" | "high") => setPriority(v)} className="flex gap-4">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="normal" id="p-normal" />
                                <Label htmlFor="p-normal">Normal</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="high" id="p-high" />
                                <Label htmlFor="p-high" className="text-red-500 font-medium">Urgente</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    <Button onClick={handleSubmit} disabled={sending} className="w-full bg-[#5B2D8E] hover:bg-[#4A2475]">
                        {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                        Enviar mensagem
                    </Button>

                    <div className="text-center pt-2">
                        <p className="text-sm text-muted-foreground mb-2">Precisa de ajuda imediata?</p>
                        <Button variant="link" className="h-auto p-0 text-green-600" onClick={() => window.open(`https://wa.me/${ORIBOS_WHATSAPP}`, '_blank')}>
                            Fale pelo WhatsApp <MessageCircle className="ml-1 h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* History */}
                <div className="border-t pt-4">
                    <h3 className="text-sm font-semibold mb-3">Meus chamados recentes</h3>
                    <ScrollArea className="h-[200px] pr-4">
                        {loading ? (
                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                        ) : messages.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center">Nenhum chamado anterior.</p>
                        ) : (
                            <div className="space-y-3">
                                {messages.map((msg) => (
                                    <div key={msg.id} className="border rounded-lg p-3 text-sm space-y-2">
                                        <div className="flex justify-between items-start">
                                            <span className="font-medium text-[#5B2D8E]">{msg.subject}</span>
                                            <Badge variant={
                                                msg.status === 'resolved' ? 'secondary' : // green? secondary is usually gray. Let's customize via className.
                                                    msg.status === 'in_progress' ? 'default' : 'outline'
                                            } className={cn(
                                                msg.status === 'resolved' && "bg-green-100 text-green-700 hover:bg-green-100",
                                                msg.status === 'in_progress' && "bg-blue-100 text-blue-700 hover:bg-blue-100",
                                                msg.status === 'open' && "bg-yellow-100 text-yellow-700 hover:bg-yellow-100"
                                            )}>
                                                {msg.status === 'open' && 'Aberto'}
                                                {msg.status === 'in_progress' && 'Em andamento'}
                                                {msg.status === 'resolved' && 'Resolvido'}
                                            </Badge>
                                        </div>
                                        <p className="text-muted-foreground text-xs">
                                            {format(new Date(msg.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                                        </p>

                                        {msg.admin_reply && (
                                            <div className="bg-muted p-2 rounded mt-2 text-xs">
                                                <span className="font-semibold block mb-1">Oribos respondeu:</span>
                                                {msg.admin_reply}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    );
}
