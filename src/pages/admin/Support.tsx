import { useState, useEffect } from "react";
import { useAdmin } from "@/contexts/AdminContext";
import { supabase } from "@/lib/supabase";
import type { SupportMessage } from "@/types";
import {
    Loader2,
    MessageSquare,
    Send,
    User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { AppLayout } from "@/components/layout/AppLayout";

export default function AdminSupport() {
    const { isAdmin } = useAdmin();
    const [messages, setMessages] = useState<SupportMessage[]>([]);
    const [selectedMessage, setSelectedMessage] = useState<SupportMessage | null>(null);
    const [loading, setLoading] = useState(true);
    const [reply, setReply] = useState("");
    const [sending, setSending] = useState(false);
    const [filterStatus, setFilterStatus] = useState<string>("all");

    useEffect(() => {
        if (!isAdmin) return;
        fetchMessages();

        const subscription = supabase
            .channel('support_messages_admin')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'support_messages'
            }, () => {
                fetchMessages();
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        }
    }, [isAdmin]);

    async function fetchMessages() {
        setLoading(true);
        const { data } = await supabase
            .from("support_messages")
            .select("*")
            .order("created_at", { ascending: false });

        if (data) {
            setMessages(data);
            if (selectedMessage) {
                const updated = data.find(m => m.id === selectedMessage.id);
                if (updated) setSelectedMessage(updated);
            }
        }
        setLoading(false);
    }

    async function handleReply() {
        if (!selectedMessage || !reply.trim()) return;

        setSending(true);
        const { error } = await supabase
            .from("support_messages")
            .update({
                admin_reply: reply,
                replied_at: new Date().toISOString(),
                status: 'resolved'
            })
            .eq("id", selectedMessage.id);

        if (error) {
            toast.error("Erro ao enviar resposta.");
        } else {
            toast.success("Resposta enviada!");
            setReply("");
        }
        setSending(false);
    }

    async function toggleStatus(msg: SupportMessage) {
        const newStatus = msg.status === 'resolved' ? 'open' : 'resolved';
        const { error } = await supabase
            .from("support_messages")
            .update({ status: newStatus })
            .eq("id", msg.id);

        if (error) toast.error("Erro ao atualizar status.");
        else toast.success(`Status atualizado`);
    }

    const filteredMessages = messages.filter(m => {
        if (filterStatus === "all") return true;
        return m.status === filterStatus;
    });

    if (loading && messages.length === 0) {
        return (
            <AppLayout title="Suporte">
                <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="Suporte">
            <div className="h-[calc(100vh-120px)] flex gap-4 overflow-hidden">
                {/* Left List */}
                <Card className="w-full md:w-1/3 flex flex-col h-full overflow-hidden">
                    <CardHeader className="pb-3 border-b flex-none">
                        <CardTitle>Chamados de Suporte</CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                            {["all", "open", "resolved"].map(status => (
                                <Button
                                    key={status}
                                    variant={filterStatus === status ? "secondary" : "ghost"}
                                    size="sm"
                                    onClick={() => setFilterStatus(status)}
                                    className="capitalize"
                                >
                                    {status === "all" ? "Todos" : status === "open" ? "Abertos" : "Resolvidos"}
                                </Button>
                            ))}
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 p-0 overflow-hidden relative">
                        <ScrollArea className="h-full absolute inset-0">
                            <div className="flex flex-col">
                                {filteredMessages.map((msg) => (
                                    <button
                                        key={msg.id}
                                        onClick={() => setSelectedMessage(msg)}
                                        className={cn(
                                            "flex flex-col items-start gap-2 p-4 border-b text-left hover:bg-muted/50 transition-colors w-full",
                                            selectedMessage?.id === msg.id && "bg-muted"
                                        )}
                                    >
                                        <div className="flex items-center justify-between w-full">
                                            <span className="font-semibold text-sm truncate max-w-[150px]">
                                                {msg.company_name}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {format(new Date(msg.created_at), "dd/MM HH:mm")}
                                            </span>
                                        </div>
                                        <span className="font-medium text-sm text-primary line-clamp-1 break-all">
                                            {msg.subject}
                                        </span>
                                        <p className="text-xs text-muted-foreground line-clamp-2 break-all">
                                            {msg.message}
                                        </p>
                                        <div className="flex gap-2 mt-1">
                                            <Badge variant={msg.status === 'resolved' ? "secondary" : "default"} className="text-[10px] h-5">
                                                {msg.status === 'open' ? 'Aberto' : msg.status === 'in_progress' ? 'Em andamento' : 'Resolvido'}
                                            </Badge>
                                            {msg.priority === 'high' && (
                                                <Badge variant="destructive" className="text-[10px] h-5">Urgente</Badge>
                                            )}
                                        </div>
                                    </button>
                                ))}
                                {filteredMessages.length === 0 && (
                                    <div className="p-8 text-center text-muted-foreground">
                                        Nenhum chamado encontrado.
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* Right Detail */}
                <Card className="flex-1 h-full flex flex-col overflow-hidden">
                    {selectedMessage ? (
                        <>
                            <CardHeader className="border-b pb-4 flex-none gap-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-lg text-[#5B2D8E]">{selectedMessage.subject}</CardTitle>
                                        <CardDescription className="mt-1 flex items-center gap-2">
                                            <User className="h-4 w-4" />
                                            {selectedMessage.company_name}
                                            <span className="text-muted-foreground">•</span>
                                            {format(new Date(selectedMessage.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                                        </CardDescription>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => toggleStatus(selectedMessage)}
                                    >
                                        {selectedMessage.status === 'resolved' ? 'Reabrir' : 'Resolver'}
                                    </Button>
                                </div>
                            </CardHeader>

                            <CardContent className="flex-1 overflow-hidden flex flex-col p-0 relative">
                                <ScrollArea className="flex-1 p-6">
                                    <div className="space-y-6">
                                        <div className="bg-muted/30 p-4 rounded-lg border">
                                            <p className="whitespace-pre-wrap text-sm">{selectedMessage.message}</p>
                                        </div>

                                        {selectedMessage.admin_reply && (
                                            <div className="bg-[#5B2D8E]/5 border border-[#5B2D8E]/20 p-4 rounded-lg ml-8 relative">
                                                <Badge className="absolute -top-3 left-4 bg-[#5B2D8E]">Resposta Oribos</Badge>
                                                <p className="whitespace-pre-wrap text-sm mt-2">{selectedMessage.admin_reply}</p>
                                                <p className="text-xs text-muted-foreground mt-2 text-right">
                                                    Enviado em {selectedMessage.replied_at && format(new Date(selectedMessage.replied_at), "dd/MM HH:mm")}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>

                                <div className="p-4 border-t bg-background mt-auto flex-none">
                                    <div className="space-y-3">
                                        <Label>Minha resposta</Label>
                                        <Textarea
                                            value={reply}
                                            onChange={(e) => setReply(e.target.value)}
                                            placeholder="Escreva sua resposta para o cliente..."
                                            className="min-h-[100px]"
                                        />
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                onClick={handleReply}
                                                disabled={sending || !reply.trim()}
                                                className="bg-[#5B2D8E] hover:bg-[#4A2475]"
                                            >
                                                {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                                Enviar Resposta
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-muted-foreground flex-col gap-2">
                            <MessageSquare className="h-12 w-12 text-muted-foreground/20" />
                            <p>Selecione um chamado para ver detalhes</p>
                        </div>
                    )}
                </Card>
            </div>
        </AppLayout>
    );
}
