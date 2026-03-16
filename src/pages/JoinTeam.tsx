import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ROUTES } from "@/lib/constants";

type JoinState = "loading" | "confirm" | "joining" | "success" | "error" | "already_member";

const JoinTeam = () => {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const navigate = useNavigate();
  const [state, setState] = useState<JoinState>("loading");
  const [orgName, setOrgName] = useState("");
  const [orgId, setOrgId] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const init = async () => {
      // Check if logged in
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate(`${ROUTES.AUTH}?returnTo=/join/${inviteCode}`);
        return;
      }

      // Find org by invite code
      const { data: orgs, error } = await supabase.rpc("find_org_by_invite_code", { _code: inviteCode! });
      if (error || !orgs || orgs.length === 0) {
        setErrorMsg("Código de invitación inválido o expirado.");
        setState("error");
        return;
      }

      const org = orgs[0];
      setOrgName(org.name);
      setOrgId(org.id);

      // Check if already a member
      const { data: existing } = await supabase
        .from("organization_members")
        .select("id")
        .eq("org_id", org.id)
        .eq("user_id", user.id)
        .limit(1);

      if (existing && existing.length > 0) {
        setState("already_member");
        return;
      }

      setState("confirm");
    };
    init();
  }, [inviteCode, navigate]);

  const handleJoin = async () => {
    setState("joining");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const { error } = await supabase.from("organization_members").insert({
        org_id: orgId,
        user_id: user.id,
        role: "member" as any,
      });

      if (error) throw error;
      setState("success");
      setTimeout(() => navigate(ROUTES.AGENCY), 2000);
    } catch (e: any) {
      setErrorMsg(e.message);
      setState("error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-primary/20">
        <CardContent className="pt-8 pb-6 px-6 text-center space-y-6">
          {state === "loading" && (
            <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
          )}

          {state === "confirm" && (
            <>
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <Building2 className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h1 className="text-xl font-bold text-foreground">
                  ¡Bienvenido al equipo de trabajo!
                </h1>
                <p className="text-muted-foreground text-sm">
                  Estás a punto de unirte a <span className="font-semibold text-foreground">{orgName}</span> para compartir propiedades y colaborar con tus colegas.
                </p>
              </div>
              <div className="flex flex-col gap-3 pt-2">
                <Button onClick={handleJoin} className="w-full rounded-xl" size="lg">
                  Unirme al equipo
                </Button>
                <Button variant="ghost" onClick={() => navigate(ROUTES.HOME)} className="w-full rounded-xl text-muted-foreground">
                  Cancelar
                </Button>
              </div>
            </>
          )}

          {state === "joining" && (
            <div className="space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
              <p className="text-sm text-muted-foreground">Uniéndote al equipo...</p>
            </div>
          )}

          {state === "success" && (
            <>
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
              <div className="space-y-2">
                <h2 className="text-lg font-bold text-foreground">¡Te uniste exitosamente!</h2>
                <p className="text-sm text-muted-foreground">
                  Ahora sos parte de <span className="font-semibold">{orgName}</span>. Redirigiendo...
                </p>
              </div>
            </>
          )}

          {state === "already_member" && (
            <>
              <CheckCircle2 className="w-12 h-12 text-primary mx-auto" />
              <div className="space-y-2">
                <h2 className="text-lg font-bold text-foreground">Ya sos miembro</h2>
                <p className="text-sm text-muted-foreground">
                  Ya pertenecés a <span className="font-semibold">{orgName}</span>.
                </p>
              </div>
              <Button onClick={() => navigate(ROUTES.AGENCY)} className="w-full rounded-xl">
                Ir al dashboard
              </Button>
            </>
          )}

          {state === "error" && (
            <>
              <XCircle className="w-12 h-12 text-destructive mx-auto" />
              <div className="space-y-2">
                <h2 className="text-lg font-bold text-foreground">Error</h2>
                <p className="text-sm text-muted-foreground">{errorMsg}</p>
              </div>
              <Button variant="outline" onClick={() => navigate(ROUTES.HOME)} className="w-full rounded-xl">
                Volver al inicio
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default JoinTeam;
