import { useMemo, useState } from "react";
import { Building2, Clock3, Phone, Star, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type PropertyRow = {
  id: string;
  title: string;
  neighborhood: string;
  usersSaved: number;
  avgImpression: number;
  avgUrgency: number;
  statusBreakdown: string;
};

type UserRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  updatedAt: string;
  ratingsByStatus: Partial<Record<StatusFilter, { itemA: number; itemB: number }>>;
};

type StatusFilter = "todos" | "ingresado" | "contactado" | "visita_coordinada" | "descartado";

const MOCK_PROPERTIES: PropertyRow[] = [
  {
    id: "p-1",
    title: "Apartamento 2 dormitorios con balcón",
    neighborhood: "Pocitos",
    usersSaved: 7,
    avgImpression: 4.3,
    avgUrgency: 3.4,
    statusBreakdown: "3 contactado · 2 visita · 2 ingresado",
  },
  {
    id: "p-2",
    title: "Casa con fondo y parrillero",
    neighborhood: "Carrasco Norte",
    usersSaved: 5,
    avgImpression: 4.8,
    avgUrgency: 4.2,
    statusBreakdown: "4 contactado · 1 visita",
  },
  {
    id: "p-3",
    title: "Monoambiente moderno amoblado",
    neighborhood: "Centro",
    usersSaved: 9,
    avgImpression: 3.9,
    avgUrgency: 4.0,
    statusBreakdown: "5 ingresado · 3 contactado · 1 descartado",
  },
];

const MOCK_USERS_BY_PROPERTY: Record<string, UserRow[]> = {
  "p-1": [
    {
      id: "u-1",
      name: "Ana Pérez",
      email: "ana***@mail.com",
      phone: "+598 99 111 222",
      status: "contactado",
      updatedAt: "Hoy 14:20",
      ratingsByStatus: {
        contactado: { itemA: 5, itemB: 4 },
        visita_coordinada: { itemA: 4, itemB: 5 },
      },
    },
    {
      id: "u-2",
      name: "Joaquín Díaz",
      email: "joa***@mail.com",
      phone: "+598 98 123 456",
      status: "visita_coordinada",
      updatedAt: "Hoy 11:10",
      ratingsByStatus: {
        ingresado: { itemA: 4, itemB: 3 },
        contactado: { itemA: 4, itemB: 3 },
      },
    },
    {
      id: "u-3",
      name: "Sofía Núñez",
      email: "sof***@mail.com",
      phone: "+598 94 777 100",
      status: "ingresado",
      updatedAt: "Ayer 19:45",
      ratingsByStatus: {
        ingresado: { itemA: 3, itemB: 2 },
      },
    },
  ],
  "p-2": [
    {
      id: "u-4",
      name: "Martín Costa",
      email: "mar***@mail.com",
      phone: "+598 91 444 908",
      status: "contactado",
      updatedAt: "Hoy 09:35",
      ratingsByStatus: {
        contactado: { itemA: 5, itemB: 5 },
      },
    },
    {
      id: "u-5",
      name: "Lucía Vera",
      email: "luc***@mail.com",
      phone: "+598 92 333 654",
      status: "contactado",
      updatedAt: "Ayer 22:18",
      ratingsByStatus: {
        ingresado: { itemA: 4, itemB: 4 },
        contactado: { itemA: 4, itemB: 4 },
      },
    },
  ],
  "p-3": [
    {
      id: "u-6",
      name: "Pablo Rivas",
      email: "pab***@mail.com",
      phone: "+598 95 111 989",
      status: "ingresado",
      updatedAt: "Hoy 13:02",
      ratingsByStatus: {
        ingresado: { itemA: 4, itemB: 4 },
      },
    },
    {
      id: "u-7",
      name: "Camila Rocha",
      email: "cam***@mail.com",
      phone: "+598 93 700 100",
      status: "contactado",
      updatedAt: "Ayer 18:50",
      ratingsByStatus: {
        ingresado: { itemA: 3, itemB: 4 },
        contactado: { itemA: 3, itemB: 5 },
      },
    },
  ],
};

function stars(value: number) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-3.5 h-3.5 ${s <= value ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`}
        />
      ))}
    </div>
  );
}

export function AgentPropertyListing() {
  const [query, setQuery] = useState("");
  const [selectedPropertyId, setSelectedPropertyId] = useState(MOCK_PROPERTIES[0].id);
  const [activeStatusTab, setActiveStatusTab] = useState<StatusFilter>("todos");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const filteredProperties = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return MOCK_PROPERTIES;
    return MOCK_PROPERTIES.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.neighborhood.toLowerCase().includes(q)
    );
  }, [query]);

  const selectedUsers = MOCK_USERS_BY_PROPERTY[selectedPropertyId] || [];
  const usersByStatus = selectedUsers.filter((user) =>
    activeStatusTab === "todos" ? true : user.status === activeStatusTab
  );

  const selectedUser = useMemo(() => {
    if (!selectedUserId) return usersByStatus[0] || null;
    return usersByStatus.find((u) => u.id === selectedUserId) || usersByStatus[0] || null;
  }, [selectedUserId, usersByStatus]);

  const statusCounts = useMemo(() => {
    const base: Record<StatusFilter, number> = {
      todos: selectedUsers.length,
      ingresado: 0,
      contactado: 0,
      visita_coordinada: 0,
      descartado: 0,
    };
    selectedUsers.forEach((u) => {
      if (u.status in base) {
        base[u.status as StatusFilter] += 1;
      }
    });
    return base;
  }, [selectedUsers]);

  const ratingLabels: Record<Exclude<StatusFilter, "todos">, { itemA: string; itemB: string }> = {
    ingresado: {
      itemA: "Calidad inicial del aviso",
      itemB: "Claridad de la publicación",
    },
    contactado: {
      itemA: "Primera impresión",
      itemB: "Urgencia de mudanza",
    },
    visita_coordinada: {
      itemA: "Interés post-visita",
      itemB: "Probabilidad de avanzar",
    },
    descartado: {
      itemA: "Nivel de descarte",
      itemB: "Distancia a lo buscado",
    },
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Building2 className="w-5 h-5" /> Listado de propiedades
          </h3>
          <p className="text-sm text-muted-foreground">
            Vista gráfica para comparar una propiedad y sus usuarios asociados.
          </p>
        </div>
        <div className="w-full md:w-80">
          <Input
            placeholder="Buscar por título o barrio..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filteredProperties.map((property) => {
          const isActive = property.id === selectedPropertyId;
          return (
            <button
              key={property.id}
              type="button"
              onClick={() => setSelectedPropertyId(property.id)}
              className={`text-left rounded-2xl border p-4 transition-all ${
                isActive
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border bg-card hover:border-primary/40"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-semibold text-sm text-foreground line-clamp-2">{property.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{property.neighborhood}</p>
                </div>
                <Badge variant="secondary" className="shrink-0">
                  <Users className="w-3 h-3 mr-1" /> {property.usersSaved}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <div>
                  <p className="text-[11px] text-muted-foreground">Primera impresión</p>
                  <p className="text-sm font-semibold">{property.avgImpression.toFixed(1)}/5</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">Urgencia mudanza</p>
                  <p className="text-sm font-semibold">{property.avgUrgency.toFixed(1)}/5</p>
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground mt-3">{property.statusBreakdown}</p>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h4 className="font-semibold text-foreground">Usuarios en esta propiedad</h4>
          <Button variant="outline" size="sm" className="text-xs">
            <Clock3 className="w-3.5 h-3.5 mr-1" /> Vista reciente
          </Button>
        </div>

        <Tabs
          value={activeStatusTab}
          onValueChange={(value) => {
            setActiveStatusTab(value as StatusFilter);
            setSelectedUserId(null);
          }}
          className="w-full"
        >
          <TabsList className="h-auto flex-wrap justify-start gap-2 bg-transparent p-0">
            <TabsTrigger value="todos" className="rounded-full border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Todos ({statusCounts.todos})
            </TabsTrigger>
            <TabsTrigger value="ingresado" className="rounded-full border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Ingresado ({statusCounts.ingresado})
            </TabsTrigger>
            <TabsTrigger value="contactado" className="rounded-full border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Contactado ({statusCounts.contactado})
            </TabsTrigger>
            <TabsTrigger value="visita_coordinada" className="rounded-full border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Visita ({statusCounts.visita_coordinada})
            </TabsTrigger>
            <TabsTrigger value="descartado" className="rounded-full border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Descartado ({statusCounts.descartado})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-4">
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left py-2 px-3 font-medium">Usuario</th>
                  <th className="text-left py-2 px-3 font-medium">Estado</th>
                  <th className="text-left py-2 px-3 font-medium">Contacto</th>
                  <th className="text-left py-2 px-3 font-medium">Actualizado</th>
                </tr>
              </thead>
              <tbody>
                {usersByStatus.map((user) => (
                  <tr
                    key={user.id}
                    onClick={() => setSelectedUserId(user.id)}
                    className={`border-b border-border/70 last:border-b-0 cursor-pointer ${
                      selectedUser?.id === user.id ? "bg-primary/5" : "hover:bg-muted/40"
                    }`}
                  >
                    <td className="py-3 px-3">
                      <p className="font-medium text-foreground">{user.name}</p>
                    </td>
                    <td className="py-3 px-3">
                      <Badge variant="outline" className="capitalize">
                        {user.status.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="py-3 px-3">
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                      <p className="text-xs text-muted-foreground">{user.phone}</p>
                    </td>
                    <td className="py-3 px-3 text-muted-foreground">{user.updatedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <aside className="rounded-xl border border-border p-4 bg-muted/20">
            {!selectedUser ? (
              <p className="text-sm text-muted-foreground">
                No hay usuarios para este estado.
              </p>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">{selectedUser.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Phone className="w-3 h-3" /> {selectedUser.phone}
                  </p>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Calificaciones por etapa
                  </p>
                  <div className="flex items-stretch gap-3 overflow-x-auto pb-1">
                    {(["ingresado", "contactado", "visita_coordinada", "descartado"] as const).map((stage) => {
                      const rating = selectedUser.ratingsByStatus[stage];
                      if (!rating) return null;
                      return (
                        <div key={stage} className="rounded-lg border border-border bg-card p-3 space-y-2 min-w-[220px] shrink-0">
                          <div className="flex items-center justify-between">
                            <Badge variant="secondary" className="capitalize">
                              {stage.replace("_", " ")}
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            <div>
                              <p className="text-[11px] text-muted-foreground">{ratingLabels[stage].itemA}</p>
                              {stars(rating.itemA)}
                            </div>
                            <div>
                              <p className="text-[11px] text-muted-foreground">{ratingLabels[stage].itemB}</p>
                              {stars(rating.itemB)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
