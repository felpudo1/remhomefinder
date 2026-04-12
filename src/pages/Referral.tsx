import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Gift, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ROUTES } from "@/lib/constants";

const Referral = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (userId) {
      localStorage.setItem("hf_referral_id", userId);
    }
  }, [userId]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-green-500/20 bg-gradient-to-b from-green-500/5 to-background">
        <CardContent className="pt-8 pb-6 px-6 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto relative">
            <Gift className="w-8 h-8 text-green-500" />
            <Sparkles className="w-4 h-4 text-green-400 absolute -top-1 -right-1" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-bold text-foreground">
              ¡Te han recomendado a RemHomeFinder!
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Al registrarte con este link, accedés a beneficios exclusivos como créditos adicionales y funciones premium para tu búsqueda. ¡Empezá ahora!
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <Button
              onClick={() => navigate(`${ROUTES.AUTH}?ref=${userId}`)}
              className="w-full rounded-xl bg-green-600 hover:bg-green-700 text-white"
              size="lg"
            >
              <Gift className="w-4 h-4 mr-2" />
              Registrarme con beneficios
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate(ROUTES.HOME)}
              className="w-full rounded-xl text-muted-foreground"
            >
              Ver más info primero
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Referral;
