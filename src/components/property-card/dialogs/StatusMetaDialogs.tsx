import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { StatusChangeConfirmDialog } from "@/components/ui/StatusChangeConfirmDialog";
import { Button } from "@/components/ui/button";
import { Trophy, Rocket, Sparkles } from "lucide-react";
import { RatingField } from "./RatingField";

export interface MetaSurveyFeedback {
  agentPunctuality: number;
  agentAttention: number;
  appPerformance: number;
  appSupport: number;
  appPrice: number;
}

interface StatusMetaDialogsProps {
  showTrophy: boolean;
  setShowTrophy: (show: boolean) => void;
  showSurvey: boolean;
  setShowSurvey: (show: boolean) => void;
  onConfirm: (feedback: MetaSurveyFeedback) => void;
  propertyTitle: string;
  appBrandName: string;
}

/**
 * Conjunto de diálogos para la celebración de "Meta Conseguida".
 * Incluye una pantalla de trofeo (celebración) y una encuesta de cierre (feedback final).
 */
export function StatusMetaDialogs({
  showTrophy,
  setShowTrophy,
  showSurvey,
  setShowSurvey,
  onConfirm,
  propertyTitle,
  appBrandName,
}: StatusMetaDialogsProps) {
  const [punctuality, setPunctuality] = useState(0);
  const [attention, setAttention] = useState(0);
  const [performance, setPerformance] = useState(0);
  const [support, setSupport] = useState(0);
  const [price, setPrice] = useState(0);

  const resetState = () => {
    setPunctuality(0);
    setAttention(0);
    setPerformance(0);
    setSupport(0);
    setPrice(0);
  };

  const handleConfirm = () => {
    onConfirm({
      agentPunctuality: punctuality,
      agentAttention: attention,
      appPerformance: performance,
      appSupport: support,
      appPrice: price,
    });
    resetState();
  };

  const isConfirmDisabled =
    punctuality === 0 || attention === 0 || performance === 0 || support === 0 || price === 0;

  return (
    <>
      {/* 1. Diálogo de Trofeo (Celebración) */}
      <Dialog open={showTrophy} onOpenChange={setShowTrophy}>
        <DialogContent className="max-w-md rounded-[2rem] p-0 overflow-hidden border-none shadow-[0_0_50px_rgba(20,184,166,0.35)]">
          <div className="bg-gradient-to-br from-[#072a2a] via-[#0f4c4c] to-[#0a2f3a] p-8 text-white relative overflow-hidden text-center">
            <div className="absolute -top-10 -left-10 w-36 h-36 bg-teal-300/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute -bottom-10 -right-10 w-36 h-36 bg-cyan-300/20 rounded-full blur-3xl animate-pulse" />

            <div className="relative z-10 space-y-5">
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 backdrop-blur-md px-4 py-1.5 rounded-full">
                <Sparkles className="w-4 h-4 text-yellow-300" />
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-teal-100">
                  Objetivo cumplido
                </span>
              </div>

              <div className="mx-auto w-20 h-20 rounded-3xl bg-gradient-to-b from-teal-300 to-cyan-500 flex items-center justify-center shadow-2xl">
                <Trophy className="w-10 h-10 text-teal-950" />
              </div>

              <h3 className="text-3xl font-black tracking-tight leading-tight">
                🎯 Meta conseguida
              </h3>

              <p className="text-sm text-teal-50/90 leading-relaxed px-2">
                Excelente avance con <strong>{propertyTitle}</strong>.
                <br />
                Confirmá este estado para dejar registro de cierre en {appBrandName}.
              </p>

              <div className="grid grid-cols-3 gap-2 text-[10px] uppercase tracking-wider font-bold text-teal-100/90">
                <div className="rounded-xl bg-white/10 border border-white/15 px-2 py-2">Cierre</div>
                <div className="rounded-xl bg-white/10 border border-white/15 px-2 py-2">Logro</div>
                <div className="rounded-xl bg-white/10 border border-white/15 px-2 py-2">Objetivo</div>
              </div>

              <div className="pt-2 flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl border-white/30 bg-white/5 text-white hover:bg-white/10"
                  onClick={() => setShowTrophy(false)}
                >
                  Volver
                </Button>
                <Button
                  className="flex-1 rounded-xl bg-gradient-to-r from-teal-300 via-cyan-300 to-sky-300 text-slate-900 hover:opacity-95 font-bold gap-2"
                  onClick={() => {
                    setShowTrophy(false);
                    setShowSurvey(true);
                  }}
                >
                  <Rocket className="w-4 h-4" />
                  Siguiente
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 2. Diálogo de Encuesta (Feedback) */}
      <StatusChangeConfirmDialog
        open={showSurvey}
        onOpenChange={(open) => {
          setShowSurvey(open);
          if (!open) resetState();
        }}
        title="✨ Último paso: ayudanos con tu feedback"
        description={`Tu experiencia nos ayuda a mejorar el acompañamiento del agente y de ${appBrandName}.`}
        confirmLabel="🎯 Confirmar meta conseguida"
        confirmDisabled={isConfirmDisabled}
        confirmClassName="bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none"
        onConfirm={handleConfirm}
      >
        <div className="space-y-3 py-2">
          <RatingField
            value={punctuality}
            onChange={setPunctuality}
            label="⏱️ Puntualidad del agente"
          />
          <RatingField
            value={attention}
            onChange={setAttention}
            label="🤝 Atención del agente"
          />
          <RatingField
            value={performance}
            onChange={setPerformance}
            label="⚙️ Funcionamiento de la app"
          />
          <RatingField value={support} onChange={setSupport} label="🛟 Soporte de la app" />
          <RatingField
            value={price}
            onChange={setPrice}
            label="💸 Precio de la app respecto al valor"
          />
        </div>
      </StatusChangeConfirmDialog>
    </>
  );
}
