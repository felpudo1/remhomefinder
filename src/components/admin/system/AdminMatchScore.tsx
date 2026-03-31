import { Calculator, Save } from "lucide-react";
import { useSystemConfig } from "@/hooks/useSystemConfig";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { MATCH_SCORE_WEIGHTS_KEY, MATCH_SCORE_WEIGHTS_DEFAULT } from "@/lib/config-keys";

export const AdminMatchScore = () => {
    const { toast } = useToast();
    const { value, isLoading, setValue, isSaving } = useSystemConfig(MATCH_SCORE_WEIGHTS_KEY, MATCH_SCORE_WEIGHTS_DEFAULT);

    const [weights, setWeights] = useState({
        operation_weight: 30,
        budget_weight: 40,
        neighborhood_weight: 20,
        rooms_weight: 10
    });

    // Parse incoming value
    useEffect(() => {
        if (!isLoading && value) {
            try {
                const parsed = JSON.parse(value);
                setWeights({
                    operation_weight: Number(parsed.operation_weight) || 0,
                    budget_weight: Number(parsed.budget_weight) || 0,
                    neighborhood_weight: Number(parsed.neighborhood_weight) || 0,
                    rooms_weight: Number(parsed.rooms_weight) || 0,
                });
            } catch (e) {
                console.error("Failed to parse match_score_weights", e);
            }
        }
    }, [isLoading, value]);

    const total = weights.operation_weight + weights.budget_weight + weights.neighborhood_weight + weights.rooms_weight;
    const isValid = total === 100;

    const handleSave = async () => {
        if (!isValid) return;
        try {
            await setValue(JSON.stringify(weights));
            toast({ title: "Pesos guardados", description: "El algoritmo de Match ahora funciona con estos parámetros." });
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const handleChange = (key: keyof typeof weights, newVal: string) => {
        setWeights(prev => ({ ...prev, [key]: Number(newVal) || 0 }));
    };

    return (
        <Card className="border-border">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-md">
                    <Calculator className="w-4 h-4 text-purple-400" />
                    Ponderación del Algoritmo de Match Score
                </CardTitle>
                <CardDescription>
                    Ajusta cuánto pesa cada métrica (% del total) a la hora de indicar la compatibilidad de una propiedad con lo que busca un usuario.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="text-sm text-muted-foreground animate-pulse">Cargando métricas...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <Label>Operación (Alquiler/Venta)</Label>
                            <Input
                                type="number"
                                min="0" max="100"
                                value={weights.operation_weight}
                                onChange={(e) => handleChange("operation_weight", e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Presupuesto (Monto)</Label>
                            <Input
                                type="number"
                                min="0" max="100"
                                value={weights.budget_weight}
                                onChange={(e) => handleChange("budget_weight", e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Barrio / Ubicación</Label>
                            <Input
                                type="number"
                                min="0" max="100"
                                value={weights.neighborhood_weight}
                                onChange={(e) => handleChange("neighborhood_weight", e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Cant. Dormitorios</Label>
                            <Input
                                type="number"
                                min="0" max="100"
                                value={weights.rooms_weight}
                                onChange={(e) => handleChange("rooms_weight", e.target.value)}
                            />
                        </div>
                    </div>
                )}
            </CardContent>
            <CardFooter className="pt-2 flex justify-between items-center">
                <p className={`text-sm font-semibold flex items-center gap-2 ${isValid ? 'text-emerald-400' : 'text-red-400'}`}>
                    Suma total: {total}% {isValid ? "✅" : "❌ (Debe sumar 100%)"}
                </p>
                <Button 
                    onClick={handleSave} 
                    disabled={isSaving || !isValid || isLoading}
                    size="sm"
                    className="gap-2"
                >
                    <Save className="w-4 h-4" /> 
                    {isSaving ? "Guardando..." : "Guardar algoritmo"}
                </Button>
            </CardFooter>
        </Card>
    );
};
