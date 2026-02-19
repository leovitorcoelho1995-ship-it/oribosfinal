import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import type { Lead } from "@/types";
import { useCompany } from "@/contexts/CompanyContext";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const formSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório"),
    whatsapp: z.string().optional(),
    email: z.string().email("Email inválido").optional().or(z.literal("")),
    source: z.string().optional(),
    value: z.number().min(0, "Valor deve ser positivo").optional(),
    notes: z.string().optional(),
    stage: z.enum(["novo", "contato", "proposta", "fechado", "perdido"]),
});

type FormData = z.infer<typeof formSchema>;

interface LeadModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    leadToEdit?: Lead | null;
    onSuccess: () => void;
}

export function LeadModal({
    open,
    onOpenChange,
    leadToEdit,
    onSuccess,
}: LeadModalProps) {
    const { companyId } = useCompany();

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            whatsapp: "",
            email: "",
            source: "",
            value: 0,
            notes: "",
            stage: "novo"
        },
    });

    const { register, handleSubmit, control, reset, formState: { errors, isSubmitting } } = form;

    useEffect(() => {
        if (open) {
            if (leadToEdit) {
                reset({
                    name: leadToEdit.name,
                    whatsapp: leadToEdit.whatsapp || "",
                    email: leadToEdit.email || "",
                    source: leadToEdit.source || "",
                    value: leadToEdit.value || 0,
                    notes: leadToEdit.notes || "",
                    stage: leadToEdit.stage
                });
            } else {
                reset({
                    name: "",
                    whatsapp: "",
                    email: "",
                    source: "",
                    value: 0,
                    notes: "",
                    stage: "novo"
                });
            }
        }
    }, [leadToEdit, open, reset]);

    const onSubmit = async (data: FormData) => {
        try {
            if (leadToEdit) {
                const { error } = await supabase
                    .from("leads")
                    .update({
                        name: data.name,
                        whatsapp: data.whatsapp,
                        email: data.email,
                        source: data.source,
                        value: data.value,
                        notes: data.notes,
                        stage: data.stage
                    })
                    .eq("id", leadToEdit.id);
                if (error) throw error;
                toast.success("Lead atualizado!");
            } else {
                const { error } = await supabase.from("leads").insert([{
                    name: data.name,
                    whatsapp: data.whatsapp,
                    email: data.email,
                    source: data.source,
                    value: data.value,
                    notes: data.notes,
                    stage: data.stage,
                    company_id: companyId
                }]);
                if (error) throw error;
                toast.success("Lead criado!");
            }
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao salvar lead.");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {leadToEdit ? "Editar Lead" : "Novo Lead"}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            Nome
                        </Label>
                        <div className="col-span-3">
                            <Input
                                id="name"
                                {...register("name")}
                            />
                            {errors.name && <span className="text-xs text-red-500">{errors.name.message}</span>}
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="whatsapp" className="text-right">
                            WhatsApp
                        </Label>
                        <div className="col-span-3">
                            <Input
                                id="whatsapp"
                                {...register("whatsapp")}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="source" className="text-right">
                            Origem
                        </Label>
                        <Controller
                            control={control}
                            name="source"
                            render={({ field }) => (
                                <Select
                                    value={field.value}
                                    onValueChange={field.onChange}
                                >
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                                        <SelectItem value="instagram">Instagram</SelectItem>
                                        <SelectItem value="site">Site</SelectItem>
                                        <SelectItem value="indicacao">Indicação</SelectItem>
                                        <SelectItem value="outro">Outro</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="value" className="text-right">
                            Valor
                        </Label>
                        <div className="col-span-3">
                            <Input
                                id="value"
                                type="number"
                                {...register("value", { valueAsNumber: true })}
                            />
                            {errors.value && <span className="text-xs text-red-500">{errors.value.message}</span>}
                        </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="notes" className="text-right">
                            Obs.
                        </Label>
                        <div className="col-span-3">
                            <Input
                                id="notes"
                                {...register("notes")}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Salvando..." : "Salvar"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
