import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./AuthContext";
import { useAdmin } from "./AdminContext";

interface CompanyContextType {
    companyId: string | null;
    companyName: string | null;
    onboardingCompleted: boolean;
    loading: boolean;
    refreshCompany: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const { impersonating, impersonatedCompany } = useAdmin();
    const [ownCompanyId, setOwnCompanyId] = useState<string | null>(null);
    const [ownCompanyName, setOwnCompanyName] = useState<string | null>(null);
    const [onboardingCompleted, setOnboardingCompleted] = useState<boolean>(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchCompany();
        } else {
            setOwnCompanyId(null);
            setOwnCompanyName(null);
            setOnboardingCompleted(false);
            setLoading(false);
        }
    }, [user]);

    async function fetchCompany() {
        setLoading(true);
        const { data, error } = await supabase
            .from("companies")
            .select("id, company_name, onboarding_completed")
            .eq("owner_id", user!.id)
            .single();

        if (error) {
            console.error("Error fetching company:", error);
            setOwnCompanyId(null);
            setOwnCompanyName(null);
            setOnboardingCompleted(false);
        } else {
            setOwnCompanyId(data.id);
            setOwnCompanyName(data.company_name);
            setOnboardingCompleted(data.onboarding_completed || false);
        }
        setLoading(false);
    }

    // During impersonation, override with impersonated company
    // Note: Admin impersonation usually skips onboarding checks or assumes active.
    // Ideally admin sees dashboard. We'll use ownCompany's onboarding status for logic checks if needed,
    // or just bypass in App.tsx if isAdmin.

    // For now, let's return own company's status mostly, unless specific requirement.
    // Logic: "Admin não vê onboarding". So isAdmin check in App.tsx handles redirection.

    const companyId = impersonating && impersonatedCompany
        ? impersonatedCompany.id
        : ownCompanyId;

    const companyName = impersonating && impersonatedCompany
        ? impersonatedCompany.name
        : ownCompanyName;

    return (
        <CompanyContext.Provider value={{
            companyId,
            companyName,
            onboardingCompleted,
            loading,
            refreshCompany: fetchCompany
        }}>
            {children}
        </CompanyContext.Provider>
    );
}

export function useCompany() {
    const context = useContext(CompanyContext);
    if (!context) {
        throw new Error("useCompany must be used within a CompanyProvider");
    }
    return context;
}
