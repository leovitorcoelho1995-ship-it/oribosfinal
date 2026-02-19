import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { BottomMenu } from "./BottomMenu";
import { SupportModal } from "@/components/support/SupportModal";
import { Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AppLayoutProps {
    children: React.ReactNode;
    title?: string;
    headerAction?: React.ReactNode;
}

export function AppLayout({ children, title = "", headerAction }: AppLayoutProps) {
    const [isSupportOpen, setIsSupportOpen] = useState(false);

    return (
        <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans">
            {/* Desktop Sidebar (Fixed 360px) */}
            <Sidebar onSupportClick={() => setIsSupportOpen(true)} />

            <SupportModal open={isSupportOpen} onOpenChange={setIsSupportOpen} />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative w-full">
                {/* Header (Top) */}
                <Header
                    title={title}
                    onMenuClick={() => { }} // No-op for now as sidebar is fixed/hidden
                    headerAction={headerAction}
                >
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden text-[#7B4DB8]"
                        onClick={() => setIsSupportOpen(true)}
                    >
                        <Headphones className="h-5 w-5" />
                    </Button>
                </Header>

                {/* Content */}
                <main className="flex-1 overflow-y-auto bg-background md:bg-[#F0F2F5] pb-[60px] md:pb-0">
                    <div className="h-full w-full">
                        {/* Removed max-w-7xl mx-auto to allow full width like WhatsApp Web */}
                        <div className="p-4 md:p-5 h-full">
                            {children}
                        </div>
                    </div>
                </main>

                {/* Mobile Bottom Menu */}
                <BottomMenu />
            </div>
        </div>
    );
}
