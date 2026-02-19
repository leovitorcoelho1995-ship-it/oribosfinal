import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCompany } from "@/contexts/CompanyContext";
import { useAdmin } from "@/contexts/AdminContext";
import { Loader2 } from "lucide-react";

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
    const { onboardingCompleted, loading } = useCompany();
    const { isAdmin } = useAdmin();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (!loading) {
            // Admin skips onboarding
            if (isAdmin) return;

            // If incomplete, go to welcome
            if (!onboardingCompleted && location.pathname !== "/welcome") {
                navigate("/welcome");
            }

            // If complete, leave welcome
            if (onboardingCompleted && location.pathname === "/welcome") {
                navigate("/");
            }
        }
    }, [loading, onboardingCompleted, isAdmin, location, navigate]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-[#3D1A6E]">
                <Loader2 className="h-8 w-8 text-white animate-spin" />
            </div>
        );
    }

    return <>{children}</>;
}
