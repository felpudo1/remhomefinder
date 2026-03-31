import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PaymentSuccess } from "../PaymentMP/components/PaymentSuccess";
import { PaymentFailure } from "../PaymentMP/components/PaymentFailure";
import { PaymentPending } from "../PaymentMP/components/PaymentPending";
import { useQueryClient } from "@tanstack/react-query";

/**
 * PaymentStatus - Recibe las redirecciones de MercadoPago.
 * 
 * MercadoPago nos enviará aquí según haya sido el pago:
 * /payments/success
 * /payments/failure
 * /payments/pending
 */
export default function PaymentStatus() {
  const { status } = useParams<{ status: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Si el usuario vuelve del pago existoso, forzamos un invalidate 
  // del perfil para que actualice la insignia a "Premium"
  useEffect(() => {
    if (status === "success" || status === "approved") {
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      queryClient.invalidateQueries({ queryKey: ["user-subscription"] });
    }
  }, [status, queryClient]);

  const handleReturn = () => {
    navigate("/dashboard");
  };

  const handleRetry = () => {
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0f111a] border border-white/5 shadow-[0_0_40px_rgba(30,64,175,0.2)] rounded-3xl overflow-hidden p-6 md:p-10 text-center animate-in zoom-in-95 duration-300">
        <h1 className="text-xl font-black uppercase tracking-[0.2em] mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">
          Estado del Pago
        </h1>

        {status === "success" || status === "approved" ? (
          <PaymentSuccess
            onNavigateBack={handleReturn}
            className="w-full"
            autoRedirectDelay={4000}
          />
        ) : status === "failure" || status === "rejected" ? (
          <PaymentFailure onRetry={handleRetry} className="w-full" />
        ) : (
          <PaymentPending onNavigateBack={handleReturn} className="w-full" />
        )}
      </div>
    </div>
  );
}
