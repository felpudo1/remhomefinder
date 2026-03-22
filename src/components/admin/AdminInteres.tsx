import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays, isSameDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Loader2, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface Agent {
  user_id: string;
  display_name: string;
}

interface InteresData {
  dateLabel: string;
  _idDate: Date;
  vistas: number;
  guardadas: number;
}

export function AdminInteres() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>("all");
  const [chartData, setChartData] = useState<InteresData[]>([]);
  const [loading, setLoading] = useState(true);

  const [showVistas, setShowVistas] = useState(true);
  const [showGuardadas, setShowGuardadas] = useState(true);

  useEffect(() => {
    fetchAgents();
  }, []);

  useEffect(() => {
    fetchChartData();
  }, [selectedAgent]);

  const fetchAgents = async () => {
    // 1. Obtener todos los IDs de usuarios que tienen publicaciones en el marketplace
    const { data: pubs } = await supabase.from('agent_publications').select('published_by');
    const pubAgentIds = pubs ? pubs.map((p: any) => p.published_by).filter(Boolean) : [];
    
    // 2. Obtener creadores de organizaciones tipo agencia
    const { data: orgs } = await supabase.from('organizations').select('id, created_by').eq('type', 'agency_team');
    const orgCreators = orgs ? orgs.map((o: any) => o.created_by).filter(Boolean) : [];
    const orgIds = orgs ? orgs.map((o: any) => o.id).filter(Boolean) : [];
    
    // 3. Obtener miembros de las organizaciones tipo agencia
    let memberIds: string[] = [];
    if (orgIds.length > 0) {
      const { data: members } = await supabase.from('organization_members').select('user_id').in('org_id', orgIds);
      memberIds = members ? members.map((m: any) => m.user_id).filter(Boolean) : [];
    }

    // 4. Unificar IDs únicos
    const agentIds = Array.from(new Set([...pubAgentIds, ...orgCreators, ...memberIds]));

    if (agentIds.length === 0) {
      setAgents([]);
      return;
    }

    // 5. Obtener los perfiles correspondientes solo a esos agentes
    const { data } = await supabase
      .from("profiles")
      .select("user_id, display_name")
      .in('user_id', agentIds as string[])
      .order("display_name", { ascending: true });
      
    if (data) {
      setAgents(data as Agent[]);
    }
  };

  const fetchChartData = async () => {
    setLoading(true);
    try {
      let propertyIds: string[] | null = null;
      
      // Si se selecciona un agente específico, buscar sus propiedades primero
      if (selectedAgent !== "all") {
        const { data: pubs } = await supabase
          .from("agent_publications")
          .select("property_id")
          .eq("published_by", selectedAgent);
        propertyIds = pubs?.map((p) => p.property_id).filter(Boolean) || [];
      }

      // Preparar consultas
      let viewsQuery = supabase
        .from("property_views_log")
        .select("created_at")
        .gte("created_at", subDays(new Date(), 14).toISOString());
        
      let savesQuery = supabase
        .from("user_listings")
        .select("created_at")
        .gte("created_at", subDays(new Date(), 14).toISOString());

      if (propertyIds !== null) {
        if (propertyIds.length === 0) {
          // No tiene propiedades, cargamos en 0
          buildAndSetData([], []);
          setLoading(false);
          return;
        } else {
          viewsQuery = viewsQuery.in("property_id", propertyIds);
          savesQuery = savesQuery.in("property_id", propertyIds);
        }
      }

      const [{ data: viewsData }, { data: savesData }] = await Promise.all([
        viewsQuery,
        savesQuery,
      ]);

      buildAndSetData(viewsData || [], savesData || []);

    } catch (e) {
      console.error(e);
      buildAndSetData([], []);
    } finally {
      setLoading(false);
    }
  };

  const buildAndSetData = (viewsData: any[], savesData: any[]) => {
    const last14Days = Array.from({ length: 14 }, (_, i) => {
      const date = subDays(new Date(), 13 - i);
      return { 
        dateLabel: format(date, 'dd MMM', { locale: es }), 
        _idDate: date, 
        vistas: 0, 
        guardadas: 0 
      };
    });

    viewsData.forEach((v: any) => {
      const day = last14Days.find((d) => isSameDay(d._idDate, parseISO(v.created_at)));
      if (day) day.vistas++;
    });

    savesData.forEach((s: any) => {
      const day = last14Days.find((d) => isSameDay(d._idDate, parseISO(s.created_at)));
      if (day) day.guardadas++;
    });

    setChartData(last14Days.map(({ _idDate, ...rest }) => rest as unknown as InteresData));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Evolución de Interés
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Visualiza y compara las vistas y las guardadas en los últimos 14 días.
          </p>
        </div>
        
        <div className="w-full sm:w-64">
          <Select value={selectedAgent} onValueChange={setSelectedAgent}>
            <SelectTrigger className="w-full bg-background">
              <SelectValue placeholder="Seleccionar agente..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los agentes</SelectItem>
              {agents.map((ag) => (
                <SelectItem key={ag.user_id} value={ag.user_id}>
                  {ag.display_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="border-border shadow-md overflow-hidden bg-white/50 backdrop-blur-sm">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-border/50 mb-4 gap-4">
          <CardTitle className="text-sm font-medium">Métricas Diarias</CardTitle>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Checkbox 
                id="showVistas" 
                checked={showVistas} 
                onCheckedChange={(c) => setShowVistas(!!c)} 
              />
              <label 
                htmlFor="showVistas" 
                className="text-sm font-medium leading-none cursor-pointer flex items-center gap-2"
              >
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                Vistas
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox 
                id="showGuardadas" 
                checked={showGuardadas} 
                onCheckedChange={(c) => setShowGuardadas(!!c)} 
              />
              <label 
                htmlFor="showGuardadas" 
                className="text-sm font-medium leading-none cursor-pointer flex items-center gap-2"
              >
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                Guardadas
              </label>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {loading ? (
            <div className="h-[350px] flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVistas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorGuardadas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="dateLabel" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      borderRadius: '12px', 
                      border: '1px solid hsl(var(--border))', 
                      fontSize: '12px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
                    }} 
                  />
                  {showVistas && (
                    <Area 
                      type="monotone" 
                      dataKey="vistas" 
                      name="Vistas" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#colorVistas)" 
                    />
                  )}
                  {showGuardadas && (
                    <Area 
                      type="monotone" 
                      dataKey="guardadas" 
                      name="Guardadas" 
                      stroke="#10b981" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#colorGuardadas)" 
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
