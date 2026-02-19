import { useAdmin } from "@/contexts/AdminContext";
import { X } from "lucide-react";

export function SupportBanner() {
    const { impersonating, impersonatedCompany, stopImpersonation } = useAdmin();

    if (!impersonating || !impersonatedCompany) return null;

    return (
        <div
            className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-between px-4 py-2 text-white text-sm"
            style={{ backgroundColor: "#7B4DB8" }}
        >
            <span className="font-medium truncate">
                Você está visualizando como: <strong>{impersonatedCompany.name}</strong> — Modo Suporte Ativo
            </span>
            <button
                onClick={() => stopImpersonation()}
                className="flex items-center gap-1.5 px-3 py-1 rounded-md text-sm font-medium whitespace-nowrap ml-4"
                style={{
                    backgroundColor: "white",
                    color: "#7B4DB8",
                    borderRadius: "6px",
                }}
            >
                <X className="h-3.5 w-3.5" />
                Sair do modo suporte
            </button>
        </div>
    );
}
