import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertTriangle, Info, XCircle, Bug } from "lucide-react";

interface SystemLog {
    id: string;
    level: 'info' | 'warn' | 'error' | 'critical';
    message: string;
    details: any;
    created_at: string;
}

interface LogDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    logs: SystemLog[];
    companyName?: string;
}

export function LogDrawer({ open, onOpenChange, logs, companyName }: LogDrawerProps) {
    const getIcon = (level: string) => {
        switch (level) {
            case 'info': return <Info className="h-4 w-4 text-blue-500" />;
            case 'warn': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
            case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
            case 'critical': return <Bug className="h-4 w-4 text-destructive" />;
            default: return <Info className="h-4 w-4" />;
        }
    };

    const getColor = (level: string) => {
        switch (level) {
            case 'info': return "bg-blue-100 text-blue-800 border-blue-200";
            case 'warn': return "bg-yellow-100 text-yellow-800 border-yellow-200";
            case 'error': return "bg-red-100 text-red-800 border-red-200";
            case 'critical': return "bg-red-200 text-red-900 border-red-300";
            default: return "bg-gray-100 text-gray-800 border-gray-200";
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-[400px] sm:w-[540px]">
                <SheetHeader>
                    <SheetTitle>Logs do Sistema</SheetTitle>
                    <SheetDescription>
                        {companyName ? `Histórico de erros para ${companyName}` : "Histórico recente de erros"}
                    </SheetDescription>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-100px)] mt-4 pr-4">
                    <div className="space-y-4">
                        {logs.length === 0 ? (
                            <div className="text-center text-muted-foreground py-8">
                                Nenhum log registrado.
                            </div>
                        ) : (
                            logs.map((log) => (
                                <div key={log.id} className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            {getIcon(log.level)}
                                            <Badge variant="outline" className={getColor(log.level)}>
                                                {log.level.toUpperCase()}
                                            </Badge>
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                            {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                                        </span>
                                    </div>
                                    <p className="text-sm font-medium mb-2">{log.message}</p>
                                    {log.details && (
                                        <div className="bg-muted p-2 rounded text-xs font-mono overflow-x-auto">
                                            <pre>{JSON.stringify(log.details, null, 2)}</pre>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}
