import { useEffect } from "react";
import { Button } from "@/components/ui/button";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import type { Client } from "@/types";
import { useCompany } from "@/contexts/CompanyContext"; // Assuming this hook exists and provides companyId
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const formSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório"),
    whatsapp: z.string().optional(),
    email: z.string().email("Email inválido").optional().or(z.literal("")),
    status: z.enum(["active", "inactive"]),
    notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface ClientModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    clientToEdit?: Client | null;
    onSuccess: () => void;
}

export function ClientModal({
    open,
    onOpenChange,
    clientToEdit,
    onSuccess,
}: ClientModalProps) {
    const { companyId } = useCompany();

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            whatsapp: "",
            email: "",
            status: "active",
            notes: "",
        },
    });

    const { register, handleSubmit, control, reset, formState: { errors, isSubmitting } } = form;

    useEffect(() => {
        if (open) {
            if (clientToEdit) {
                reset({
                    name: clientToEdit.name,
                    whatsapp: clientToEdit.whatsapp || "",
                    email: clientToEdit.email || "",
                    status: clientToEdit.status,
                    notes: clientToEdit.notes || "",
                });
            } else {
                reset({
                    name: "",
                    whatsapp: "",
                    email: "",
                    status: "active",
                    notes: "",
                });
            }
        }
    }, [clientToEdit, open, reset]);

    const onSubmit = async (data: FormData) => {
        try {
            if (clientToEdit) {
                const { error } = await supabase
                    .from("clients")
                    .update({
                        name: data.name,
                        whatsapp: data.whatsapp,
                        email: data.email,
                        status: data.status,
                        notes: data.notes
                    })
                    .eq("id", clientToEdit.id);
                if (error) throw error;
                toast.success("Cliente atualizado com sucesso!");
            } else {
                const { error } = await supabase.from("clients").insert([{
                    name: data.name,
                    whatsapp: data.whatsapp,
                    email: data.email,
                    status: data.status,
                    notes: data.notes,
                    company_id: companyId
                }]);
                if (error) throw error;
                toast.success("Cliente cadastrado com sucesso!");
            }
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao salvar cliente.");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {clientToEdit ? "Editar Cliente" : "Novo Cliente"}
                    </DialogTitle>
                    <DialogDescription>
                        {clientToEdit
                            ? "Atualize os dados do cliente abaixo."
                            : "Preencha os dados para cadastrar um novo cliente."}
                    </DialogDescription>
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
                                placeholder="5511999999999"
                            />
                            {errors.whatsapp && <span className="text-xs text-red-500">{errors.whatsapp.message}</span>}
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">
                            Email
                        </Label>
                        <div className="col-span-3">
                            <Input
                                id="email"
                                type="email"
                                {...register("email")}
                            />
                            {errors.email && <span className="text-xs text-red-500">{errors.email.message}</span>}
                        </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="status" className="text-right">
                            Status
                        </Label>
                        <Controller
                            control={control}
                            name="status"
                            render={({ field }) => (
                                <Select
                                    value={field.value}
                                    onValueChange={field.onChange}
                                >
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Selecione o status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Ativo</SelectItem>
                                        <SelectItem value="inactive">Inativo</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        />
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
