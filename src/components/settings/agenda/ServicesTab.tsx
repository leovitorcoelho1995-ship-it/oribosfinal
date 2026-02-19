import { useState, useEffect } from "react";
import { useCompany } from "@/contexts/CompanyContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { Service } from "@/types";

export function ServicesTab() {
    const { companyId } = useCompany();
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [currentService, setCurrentService] = useState<Partial<Service>>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (companyId) {
            fetchServices();
        }
    }, [companyId]);

    async function fetchServices() {
        setLoading(true);
        const { data, error } = await supabase
            .from("services")
            .select("*")
            .eq("company_id", companyId)
            .order("name");

        if (error) {
            toast.error("Erro ao carregar serviços");
            console.error(error);
        } else {
            setServices(data || []);
        }
        setLoading(false);
    }

    async function handleSave() {
        if (!currentService.name) {
            toast.error("Nome é obrigatório");
            return;
        }
        if (!currentService.duration_minutes || currentService.duration_minutes <= 0) {
            toast.error("Duração inválida");
            return;
        }

        setSaving(true);
        const payload = {
            company_id: companyId,
            name: currentService.name,
            duration_minutes: currentService.duration_minutes,
            price: currentService.price || 0,
            color: currentService.color || "#22c55e",
            active: currentService.active ?? true,
        };

        let result;
        if (currentService.id) {
            result = await supabase
                .from("services")
                .update(payload)
                .eq("id", currentService.id)
                .select()
                .single();
        } else {
            result = await supabase
                .from("services")
                .insert(payload)
                .select()
                .single();
        }

        if (result.error) {
            toast.error("Erro ao salvar serviço");
            console.error(result.error);
        } else {
            toast.success("Serviço salvo com sucesso");
            setIsDialogOpen(false);
            fetchServices();
        }
        setSaving(false);
    }

    async function handleDelete() {
        if (!currentService.id) return;

        setSaving(true);
        const { error } = await supabase
            .from("services")
            .delete()
            .eq("id", currentService.id);

        if (error) {
            toast.error("Erro ao excluir serviço");
            console.error(error);
        } else {
            toast.success("Serviço excluído");
            setIsDeleteDialogOpen(false);
            fetchServices();
        }
        setSaving(false);
    }

    function openNew() {
        setCurrentService({ active: true, color: "#22c55e", duration_minutes: 60, price: 0 });
        setIsDialogOpen(true);
    }

    function openEdit(srv: Service) {
        setCurrentService(srv);
        setIsDialogOpen(true);
    }

    function openDelete(srv: Service) {
        setCurrentService(srv);
        setIsDeleteDialogOpen(true);
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-medium">Serviços</h3>
                    <p className="text-sm text-muted-foreground">
                        Gerencie os tipos de atendimentos que você oferece.
                    </p>
                </div>
                <Button onClick={openNew}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Serviço
                </Button>
            </div>

            {loading ? (
                <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Cor</TableHead>
                                <TableHead>Nome</TableHead>
                                <TableHead>Duração</TableHead>
                                <TableHead>Preço</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {services.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                        Nenhum serviço cadastrado.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                services.map((srv) => (
                                    <TableRow key={srv.id}>
                                        <TableCell>
                                            <div
                                                className="h-6 w-6 rounded-full border"
                                                style={{ backgroundColor: srv.color }}
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium">{srv.name}</TableCell>
                                        <TableCell>{srv.duration_minutes} min</TableCell>
                                        <TableCell>R$ {Number(srv.price).toFixed(2)}</TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${srv.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                                {srv.active ? "Ativo" : "Inativo"}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => openEdit(srv)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => openDelete(srv)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Dialog Edit/Create */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{currentService.id ? "Editar Serviço" : "Novo Serviço"}</DialogTitle>
                        <DialogDescription>
                            Preencha os dados do serviço.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nome *</Label>
                            <Input
                                id="name"
                                value={currentService.name || ""}
                                onChange={(e) => setCurrentService({ ...currentService, name: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="duration">Duração (minutos) *</Label>
                                <Input
                                    id="duration"
                                    type="number"
                                    value={currentService.duration_minutes || ""}
                                    onChange={(e) => setCurrentService({ ...currentService, duration_minutes: Number(e.target.value) })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="price">Preço (R$)</Label>
                                <Input
                                    id="price"
                                    type="number"
                                    step="0.01"
                                    value={currentService.price || ""}
                                    onChange={(e) => setCurrentService({ ...currentService, price: Number(e.target.value) })}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="color">Cor</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="color"
                                        type="color"
                                        className="w-12 h-10 p-1"
                                        value={currentService.color || "#22c55e"}
                                        onChange={(e) => setCurrentService({ ...currentService, color: e.target.value })}
                                    />
                                    <Input
                                        value={currentService.color || "#22c55e"}
                                        onChange={(e) => setCurrentService({ ...currentService, color: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2 items-center pt-8">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="active"
                                        checked={currentService.active ?? true}
                                        onCheckedChange={(checked) => setCurrentService({ ...currentService, active: !!checked })}
                                    />
                                    <Label htmlFor="active">Ativo</Label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={saving}>Cancelar</Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Salvar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog Delete */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Excluir Serviço</DialogTitle>
                        <DialogDescription>
                            Tem certeza que deseja excluir <strong>{currentService.name}</strong>?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={saving}>Cancelar</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={saving}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Excluir
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
