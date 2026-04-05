import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Table2, Loader2, AlertCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Detail {
  id: string;
  title: string;
  content: string;
  category: string;
  created_at: string;
}

/**
 * Componente dinámico que muestra información manual desde la BD.
 * Copia la estética de DbSchemaTab pero consume datos reales de la tabla 'details_description'.
 */
export function AdminDetailsDescription() {
  const [details, setDetails] = useState<Detail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from("details_description")
          .select("*")
          .order("created_at", { ascending: false });

        if (fetchError) throw fetchError;
        setDetails(data || []);
      } catch (err: any) {
        console.error("Error fetching details_description:", err);
        setError(err.message || "Error al cargar la tabla de detalles.");
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
        <p className="text-sm">Consultando registros manuales...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="bg-red-500/10 border-red-500/30">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <BookOpen className="w-4 h-4 text-emerald-400" />
        <span>{details.length} registros manuales encontrados</span>
      </div>

      <div className="rounded-xl border border-slate-700 overflow-hidden bg-slate-900 shadow-xl">
        <Table>
          <TableHeader className="bg-slate-800">
            <TableRow className="border-slate-700 hover:bg-transparent">
              <TableHead className="text-white font-extrabold w-[220px] uppercase text-[10px] tracking-wider">Título (Manual)</TableHead>
              <TableHead className="text-white font-extrabold w-[150px] uppercase text-[10px] tracking-wider">Categoría</TableHead>
              <TableHead className="text-white font-extrabold uppercase text-[10px] tracking-wider">Contenido / Nota</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {details.length === 0 ? (
              <TableRow className="border-slate-800/60">
                <TableCell colSpan={3} className="text-center py-10 text-slate-500 italic">
                  No hay datos manuales cargados en la tabla 'details_description'.
                </TableCell>
              </TableRow>
            ) : (
              details.map((item) => (
                <TableRow key={item.id} className="border-slate-800/80 hover:bg-slate-800/60 transition-colors">
                  <TableCell className="font-bold text-emerald-400 py-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Table2 className="w-4 h-4 shrink-0 text-emerald-500/60" />
                      {item.title}
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <span className="text-[10px] px-2.5 py-1 rounded-full border border-emerald-500/40 bg-emerald-500/20 text-emerald-100 font-extrabold uppercase tracking-tight">
                      {item.category || "General"}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-white leading-relaxed py-4 font-medium">
                    {item.content || "-"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      <p className="text-[10px] text-slate-500 italic">
        * Estos datos son manuales. Editá directamente la tabla 'details_description' desde Supabase para agregar contenido.
      </p>
    </div>
  );
}
