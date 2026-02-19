import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    Rocket,
    Calendar,
    Users,
    CreditCard,
    ArrowRight,
    Check,
    Clock,
    Loader2,
    LayoutDashboard,
    Wallet,
    MessageCircle,
    Map
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCompany } from "@/contexts/CompanyContext";
import { useAdmin } from "@/contexts/AdminContext";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export default function Welcome() {
    const navigate = useNavigate();
    const { companyId, onboardingCompleted, refreshCompany, loading } = useCompany();
    const { isAdmin } = useAdmin();
    const [step, setStep] = useState(1);
    const [updating, setUpdating] = useState(false);

    // Redirect logic
    useEffect(() => {
        if (!loading) {
            if (isAdmin) {
                navigate("/");
            } else if (onboardingCompleted) {
                navigate("/");
            }
        }
    }, [isAdmin, onboardingCompleted, loading, navigate]);

    if (loading || onboardingCompleted || isAdmin) {
        return (
            <div className="min-h-screen bg-[#3D1A6E] flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-white animate-spin" />
            </div>
        );
    }

    const handleNext = () => setStep(s => s + 1);

    const handleComplete = async () => {
        if (!companyId) return;
        setUpdating(true);

        const { error } = await supabase
            .from("companies")
            .update({
                onboarding_completed: true,
                first_login_at: new Date().toISOString()
            })
            .eq("id", companyId);

        if (!error) {
            await refreshCompany();
            navigate("/");
        } else {
            console.error(error);
            setUpdating(false);
        }
    };

    const ORIBOS_WHATSAPP = import.meta.env.VITE_ORIBOS_WHATSAPP || "5511999999999";

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center p-4"
            style={{ background: "linear-gradient(135deg, #3D1A6E 0%, #5B2D8E 100%)" }}>

            {/* Logo */}
            <div className="mb-8 text-white font-bold text-3xl tracking-tight">
                Oribos
            </div>

            {/* Main Card */}
            <div className="w-full max-w-[560px] bg-white rounded-2xl p-10 shadow-2xl">

                {/* Stepper */}
                <div className="flex items-center justify-between mb-8 relative">
                    <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gray-200 -z-10" />
                    {[1, 2, 3].map((s) => (
                        <div key={s} className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors bg-white border-2",
                            step >= s ? "border-[#5B2D8E] text-[#5B2D8E]" : "border-gray-200 text-gray-400",
                            step === s && "bg-[#5B2D8E] text-white border-[#5B2D8E]"
                        )}>
                            {s}
                        </div>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div className="text-center space-y-2">
                                <div className="mx-auto w-16 h-16 bg-[#5B2D8E]/10 rounded-full flex items-center justify-center mb-4">
                                    <Rocket className="h-8 w-8 text-[#5B2D8E]" />
                                </div>
                                <h1 className="text-2xl font-bold text-gray-900">Bem-vindo à plataforma Oribos!</h1>
                                <p className="text-gray-500">Vamos te mostrar o que você vai encontrar aqui.</p>
                            </div>

                            <div className="space-y-4">
                                <InfoCard
                                    icon={<Calendar className="h-5 w-5 text-[#5B2D8E]" />}
                                    title="Sua agenda inteligente"
                                    desc="Agendamentos feitos pelo WhatsApp aparecem aqui automaticamente. Você confirma, cancela e acompanha tudo em um só lugar."
                                    iconBg="bg-[#5B2D8E]/10"
                                />
                                <InfoCard
                                    icon={<Users className="h-5 w-5 text-green-600" />}
                                    title="Seus leads organizados"
                                    desc="Cada pessoa que entrar em contato pelo WhatsApp vira um lead aqui. Você acompanha o funil de vendas sem perder nenhuma oportunidade."
                                    iconBg="bg-green-100"
                                />
                                <InfoCard
                                    icon={<CreditCard className="h-5 w-5 text-[#5B2D8E]" />}
                                    title="Pagamentos via PIX"
                                    desc="Cobranças enviadas pelo WhatsApp e confirmações de pagamento aparecem aqui em tempo real."
                                    iconBg="bg-[#5B2D8E]/10"
                                />
                            </div>

                            <Button onClick={handleNext} className="w-full bg-[#5B2D8E] hover:bg-[#4A2475]">
                                Próximo <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div className="text-center space-y-2">
                                <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                                    <Clock className="h-8 w-8 text-amber-600" />
                                </div>
                                <h1 className="text-2xl font-bold text-gray-900">O que acontece agora?</h1>
                                <p className="text-gray-500">Seu sistema está sendo configurado pela equipe Oribos.</p>
                            </div>

                            <div className="space-y-6 relative pl-4 border-l-2 border-gray-100 ml-4 py-2">
                                <TimelineItem
                                    status="completed"
                                    title="Sua conta foi criada"
                                    desc="Acesso ao painel liberado."
                                />
                                <TimelineItem
                                    status="loading"
                                    title="WhatsApp sendo conectado"
                                    desc="A equipe Oribos está configurando seu número. Você receberá uma confirmação em breve."
                                />
                                <TimelineItem
                                    status="pending"
                                    title="Automações sendo ativadas"
                                    desc="Seus fluxos de atendimento serão ativados após a conexão do WhatsApp."
                                />
                                <TimelineItem
                                    status="pending"
                                    title="Primeiros dados aparecem"
                                    desc="Em até 24h após a conexão você começará a ver leads e agendamentos chegando aqui."
                                />
                            </div>

                            <Button onClick={handleNext} className="w-full bg-[#5B2D8E] hover:bg-[#4A2475]">
                                Entendi, próximo <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div className="text-center space-y-2">
                                <div className="mx-auto w-16 h-16 bg-[#5B2D8E]/10 rounded-full flex items-center justify-center mb-4">
                                    <Map className="h-8 w-8 text-[#5B2D8E]" />
                                </div>
                                <h1 className="text-2xl font-bold text-gray-900">Seu painel em 30 segundos</h1>
                                <p className="text-gray-500">Aqui está o que cada seção faz:</p>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                <FeatureItem icon={LayoutDashboard} label="Dashboard" desc="Visão geral do seu negócio hoje" />
                                <FeatureItem icon={Calendar} label="Agenda" desc="Agendamentos e horários disponíveis" />
                                <FeatureItem icon={Users} label="Clientes" desc="Cadastro e histórico de contatos" />
                                <FeatureItem icon={Users} label="Leads" desc="Funil de vendas do WhatsApp" color="text-green-600" />
                                <FeatureItem icon={Wallet} label="Financeiro" desc="Controle de pagamentos" />
                                <FeatureItem icon={CreditCard} label="Transações" desc="PIX recebidos em tempo real" />
                            </div>

                            <div className="bg-[#5B2D8E]/5 border border-[#5B2D8E]/20 rounded-lg p-4 flex flex-col items-center text-center space-y-3">
                                <div className="flex items-center gap-2 text-[#5B2D8E] font-medium">
                                    <MessageCircle className="h-5 w-5 text-green-600" />
                                    Dúvidas? Fale com a Oribos pelo WhatsApp
                                </div>
                                <Button
                                    variant="outline"
                                    className="w-full border-green-600 text-green-700 hover:bg-green-50"
                                    onClick={() => window.open(`https://wa.me/${ORIBOS_WHATSAPP}`, '_blank')}
                                >
                                    Abrir WhatsApp
                                </Button>
                            </div>

                            <Button
                                onClick={handleComplete}
                                disabled={updating}
                                className="w-full bg-[#5B2D8E] hover:bg-[#4A2475]"
                            >
                                {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Acessar meu painel <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

function InfoCard({ icon, title, desc, iconBg }: any) {
    return (
        <div className="flex gap-4 p-4 rounded-xl border border-gray-100 hover:border-[#5B2D8E]/20 transition-colors">
            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", iconBg)}>
                {icon}
            </div>
            <div>
                <h3 className="font-semibold text-gray-900">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed mt-1">{desc}</p>
            </div>
        </div>
    );
}

function TimelineItem({ status, title, desc }: any) {
    return (
        <div className="relative mb-6 last:mb-0">
            <span className={cn(
                "absolute -left-[25px] top-1 w-4 h-4 rounded-full border-2 flex items-center justify-center bg-white",
                status === 'completed' ? "border-green-500 text-green-500" :
                    status === 'loading' ? "border-[#5B2D8E] text-[#5B2D8E]" :
                        "border-gray-300 text-gray-300"
            )}>
                {status === 'completed' && <Check className="h-3 w-3" />}
                {status === 'loading' && <Loader2 className="h-3 w-3 animate-spin" />}
                {status === 'pending' && <div className="w-2 h-2 rounded-full bg-gray-300" />}
            </span>
            <div>
                <h3 className={cn("font-medium",
                    status === 'pending' ? "text-gray-400" : "text-gray-900"
                )}>{title}</h3>
                <p className="text-sm text-gray-500 mt-1">{desc}</p>
            </div>
        </div>
    );
}

function FeatureItem({ icon: Icon, label, desc, color = "text-[#5B2D8E]" }: any) {
    return (
        <div className="flex items-center gap-3 p-2">
            <Icon className={cn("h-5 w-5", color)} />
            <div>
                <span className="font-medium text-gray-900 mr-2">{label}</span>
                <span className="text-sm text-gray-500">— {desc}</span>
            </div>
        </div>
    );
}
