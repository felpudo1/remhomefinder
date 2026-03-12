import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export function UserReferralSection() {
    const { toast } = useToast();
    const [copied, setCopied] = useState(false);

    const { data: profile } = useQuery({
        queryKey: ["profile"],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;
            const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
            return data;
        }
    });

    const { data: referralCount = 0 } = useQuery({
        queryKey: ["referral-count", profile?.user_id],
        queryFn: async () => {
            if (!profile?.user_id) return 0;
            const { count, error } = await supabase
                .from("profiles")
                .select("*", { count: "exact", head: true })
                .eq("referred_by_agent_id", profile.user_id);

            if (error) throw error;
            return count || 0;
        },
        enabled: !!profile?.user_id,
    });

    const referralLink = profile?.user_id
        ? `${window.location.origin}/auth?ref=${profile.user_id}`
        : "";

    const copyToClipboard = () => {
        if (!referralLink) return;
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        toast({
            title: "¡Link copiado!",
            description: "Compartilo con tus amigos para que se registren.",
        });
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-3 pt-4 border-t border-border/50">
            <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-3 h-3 text-primary" />
                    Tus Referidos
                </p>
                <Badge variant="secondary" className="h-5 px-1.5 text-[10px] bg-primary/10 text-primary border-none animate-in fade-in zoom-in">
                    {referralCount}
                </Badge>
            </div>

            <div className="space-y-2">
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                    Invitá a tus amigos y ayudalos a encontrar su próximo hogar.
                </p>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={copyToClipboard}
                    className="w-full h-8 rounded-xl text-[10px] font-bold uppercase tracking-wider gap-2 bg-muted/50 border-none hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                >
                    {copied ? (
                        <>
                            <Check className="w-3 h-3" />
                            Copiado
                        </>
                    ) : (
                        <>
                            <Copy className="w-3 h-3" />
                            Copiar Link
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
