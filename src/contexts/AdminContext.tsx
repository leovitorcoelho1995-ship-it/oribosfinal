import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./AuthContext";

interface ImpersonatedCompany {
    id: string;
    name: string;
}

interface AdminContextType {
    isAdmin: boolean;
    impersonating: boolean;
    impersonatedCompany: ImpersonatedCompany | null;
    startImpersonation: (companyId: string, companyName: string) => Promise<void>;
    stopImpersonation: () => Promise<void>;
    loading: boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

const STORAGE_KEY = "autogestao_impersonation";

export function AdminProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [isAdmin, setIsAdmin] = useState(false);
    const [impersonatedCompany, setImpersonatedCompany] = useState<ImpersonatedCompany | null>(null);
    const [loading, setLoading] = useState(true);

    // Check admin status
    useEffect(() => {
        if (user) {
            checkAdmin();
            restoreImpersonation();
        } else {
            setIsAdmin(false);
            setImpersonatedCompany(null);
            setLoading(false);
        }
    }, [user]);

    async function checkAdmin() {
        setLoading(true);
        const { data, error } = await supabase
            .from("companies")
            .select("is_admin")
            .eq("owner_id", user!.id)
            .single();

        if (error) {
            console.error("Error checking admin:", error);
            setIsAdmin(false);
        } else {
            setIsAdmin(data?.is_admin === true);
        }
        setLoading(false);
    }

    function restoreImpersonation() {
        try {
            const stored = sessionStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored) as ImpersonatedCompany;
                setImpersonatedCompany(parsed);
            }
        } catch {
            sessionStorage.removeItem(STORAGE_KEY);
        }
    }

    const startImpersonation = useCallback(async (companyId: string, companyName: string) => {
        const company: ImpersonatedCompany = { id: companyId, name: companyName };
        setImpersonatedCompany(company);
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(company));

        // Audit log
        await supabase.from("admin_audit_log").insert([{
            admin_id: user!.id,
            action: "impersonation_start",
            target_company_id: companyId,
            target_company_name: companyName,
        }]);
    }, [user]);

    const stopImpersonation = useCallback(async () => {
        const current = impersonatedCompany;
        setImpersonatedCompany(null);
        sessionStorage.removeItem(STORAGE_KEY);

        // Audit log
        if (current) {
            await supabase.from("admin_audit_log").insert([{
                admin_id: user!.id,
                action: "impersonation_end",
                target_company_id: current.id,
                target_company_name: current.name,
            }]);
        }
    }, [user, impersonatedCompany]);

    return (
        <AdminContext.Provider value={{
            isAdmin,
            impersonating: impersonatedCompany !== null,
            impersonatedCompany,
            startImpersonation,
            stopImpersonation,
            loading,
        }}>
            {children}
        </AdminContext.Provider>
    );
}

export function useAdmin() {
    const context = useContext(AdminContext);
    if (!context) {
        throw new Error("useAdmin must be used within an AdminProvider");
    }
    return context;
}
