import { useState, useEffect } from "react";
import { useCompany } from "@/contexts/CompanyContext"; // Assuming context exists
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
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch"; // Assuming we have or use Checkbox
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import type { Professional } from "@/types";

export function ProfessionalsTab() {
    const { companyId } = useCompany();
    const [professionals, setProfessionals] = useState<Professional[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [currentProfessional, setCurrentProfessional] = useState<Partial<Professional>>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (companyId) {
            fetchProfessionals();
        }
    }, [companyId]);

    async function fetchProfessionals() {
        setLoading(true);
        const { data, error } = await supabase
            .from("professionals")
            .select("*")
            .eq("company_id", companyId)
            .order("name");

        if (error) {
            toast.error("Erro ao carregar profissionais");
            console.error(error);
        } else {
            setProfessionals(data || []);
        }
        setLoading(false);
    }

    async function handleSave() {
        if (!currentProfessional.name) {
            toast.error("Nome é obrigatório");
            return;
        }

        setSaving(true);
        const payload = {
            company_id: companyId,
            name: currentProfessional.name,
            role: currentProfessional.role,
            color: currentProfessional.color || "#5B2D8E",
            active: currentProfessional.active ?? true,
        };

        let result;
        if (currentProfessional.id) {
            result = await supabase
                .from("professionals")
                .update(payload)
                .eq("id", currentProfessional.id)
                .select()
                .single();
        } else {
            result = await supabase
                .from("professionals")
                .insert(payload)
                .select()
                .single();
        }

        if (result.error) {
            toast.error("Erro ao salvar profissional");
            console.error(result.error);
        } else {
            toast.success("Profissional salvo com sucesso");
            setIsDialogOpen(false);
            fetchProfessionals();
        }
        setSaving(false);
    }

    async function handleDelete() {
        if (!currentProfessional.id) return;

        setSaving(true);
        const { error } = await supabase
            .from("professionals")
            .delete()
            .eq("id", currentProfessional.id);

        if (error) {
            toast.error("Erro ao excluir profissional (pode haver agendamentos vinculados)");
            console.error(error);
        } else {
            toast.success("Profissional excluído");
            setIsDeleteDialogOpen(false);
            fetchProfessionals();
        }
        setSaving(false);
    }

    function openNew() {
        setCurrentProfessional({ active: true, color: "#5B2D8E" });
        setIsDialogOpen(true);
    }

    function openEdit(prof: Professional) {
        setCurrentProfessional(prof);
        setIsDialogOpen(true);
    }

    function openDelete(prof: Professional) {
        setCurrentProfessional(prof);
        setIsDeleteDialogOpen(true);
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-medium">Profissionais</h3>
                    <p className="text-sm text-muted-foreground">
                        Gerencie os profissionais que atendem na sua empresa.
                    </p>
                </div>
                <Button onClick={openNew}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Profissional
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
                                <TableHead>Cargo</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {professionals.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                        Nenhum profissional cadastrado.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                professionals.map((prof) => (
                                    <TableRow key={prof.id}>
                                        <TableCell>
                                            <div
                                                className="h-6 w-6 rounded-full border"
                                                style={{ backgroundColor: prof.color }}
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium">{prof.name}</TableCell>
                                        <TableCell>{prof.role || "-"}</TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${prof.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                                {prof.active ? "Ativo" : "Inativo"}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => openEdit(prof)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => openDelete(prof)}>
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
                        <DialogTitle>{currentProfessional.id ? "Editar Profissional" : "Novo Profissional"}</DialogTitle>
                        <DialogDescription>
                            Preencha os dados do profissional.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nome *</Label>
                            <Input
                                id="name"
                                value={currentProfessional.name || ""}
                                onChange={(e) => setCurrentProfessional({ ...currentProfessional, name: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="role">Cargo / Especialidade</Label>
                            <Input
                                id="role"
                                value={currentProfessional.role || ""}
                                onChange={(e) => setCurrentProfessional({ ...currentProfessional, role: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="color">Cor na Agenda</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="color"
                                        type="color"
                                        className="w-12 h-10 p-1"
                                        value={currentProfessional.color || "#5B2D8E"}
                                        onChange={(e) => setCurrentProfessional({ ...currentProfessional, color: e.target.value })}
                                    />
                                    <Input
                                        value={currentProfessional.color || "#5B2D8E"}
                                        onChange={(e) => setCurrentProfessional({ ...currentProfessional, color: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2 items-center pt-8">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="active"
                                        checked={currentProfessional.active ?? true}
                                        onCheckedChange={(checked) => setCurrentProfessional({ ...currentProfessional, active: !!checked })}
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
                        <DialogTitle>Excluir Profissional</DialogTitle>
                        <DialogDescription>
                            Tem certeza que deseja excluir <strong>{currentProfessional.name}</strong>? Esta ação não pode ser desfeita e pode afetar agendamentos existentes.
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
