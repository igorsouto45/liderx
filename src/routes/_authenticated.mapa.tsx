import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect, lazy, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, MapPin, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getLatLongFromCep } from "@/lib/utils";

const StrategicMapView = lazy(() => import("@/components/StrategicMapView"));

export const Route = createFileRoute("/_authenticated/mapa")({
  component: MapaEstrategico,
  ssr: false,
});

function MapaEstrategico() {
  const [updating, setUpdating] = useState(false);
  const [showLeaders, setShowLeaders] = useState(true);
  const [showVoters, setShowVoters] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: liderancas, isLoading: loadingLiderancas, refetch: refetchLiderancas } = useQuery({
    queryKey: ["liderancas-mapa"],
    queryFn: async () => {
      const { data, error } = await supabase.from("liderancas").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: eleitores, isLoading: loadingEleitores, refetch: refetchEleitores } = useQuery({
    queryKey: ["eleitores-mapa"],
    queryFn: async () => {
      const { data, error } = await supabase.from("eleitores").select("*");
      if (error) throw error;
      return data;
    },
  });

  const stats = useMemo(() => {
    if (!liderancas || !eleitores) return null;
    const totalEleitores = eleitores.length;
    const leadersWithCounts = liderancas.map((leader: any) => {
      const count = eleitores.filter((e: any) => e.origem_usuario_id === leader.auth_user_id).length;
      const percentage = totalEleitores > 0 ? (count / totalEleitores) * 100 : 0;
      return { ...leader, voterCount: count, percentage: percentage.toFixed(1) };
    });
    return { totalEleitores, totalLiderancas: liderancas.length, leadersWithCounts };
  }, [liderancas, eleitores]);

  const updateCoordinates = async () => {
    setUpdating(true);
    let updatedCount = 0;
    try {
      if (liderancas) {
        for (const leader of liderancas) {
          if ((!leader.latitude || !leader.longitude) && leader.cep) {
            const coords = await getLatLongFromCep(
              leader.cep, 
              leader.endereco || undefined, 
              leader.bairro || undefined, 
              leader.cidade || undefined
            );
            if (coords) {
              await supabase.from("liderancas").update({ latitude: coords.lat, longitude: coords.lng }).eq("id", leader.id);
              updatedCount++;
            }
          }
        }
      }
      if (eleitores) {
        for (const eleitor of eleitores) {
          if ((!eleitor.latitude || !eleitor.longitude) && eleitor.cep) {
            const coords = await getLatLongFromCep(
              eleitor.cep, 
              eleitor.endereco || undefined, 
              eleitor.bairro || undefined, 
              eleitor.cidade || undefined
            );
            
            console.log(`Buscando coordenadas para ${eleitor.nome}:`, coords);

            if (coords) {
              const { error } = await supabase.from("eleitores").update({ 
                latitude: coords.lat, 
                longitude: coords.lng 
              }).eq("id", eleitor.id);
              
              if (!error) updatedCount++;
            }
          }
        }
      }
      if (updatedCount > 0) {
        toast.success(`${updatedCount} coordenadas atualizadas!`);
        refetchLiderancas();
        refetchEleitores();
      } else {
        toast.info("Nenhuma nova coordenada encontrada para atualizar.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao atualizar coordenadas.");
    } finally {
      setUpdating(false);
    }
  };

  const allWithCoords = useMemo(() => {
    return [
      ...(stats?.leadersWithCounts || []),
      ...(eleitores || [])
    ].filter((p: any) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude));
  }, [stats, eleitores]);

  const firstWithCoords = allWithCoords[0];
  const center: [number, number] = firstWithCoords
    ? [Number(firstWithCoords.latitude), Number(firstWithCoords.longitude)]
    : [-15.7801, -47.9292];

  if (loadingLiderancas || loadingEleitores) {
    return <div className="p-8 text-center text-muted-foreground">Carregando dados do mapa...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mapa Estratégico</h1>
          <p className="text-muted-foreground">Visualização geográfica de líderes e eleitores.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white/5 p-1 rounded-lg border border-white/10">
            <Button
              variant={showLeaders ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setShowLeaders(!showLeaders)}
              className="h-8 text-xs gap-2"
            >
              <div className="w-2 h-2 rounded-full bg-red-500" />
              Líderes
            </Button>
            <Button
              variant={showVoters ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setShowVoters(!showVoters)}
              className="h-8 text-xs gap-2"
            >
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              Eleitores
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={updateCoordinates} disabled={updating} className="gap-2 h-8">
            <RefreshCw className={`h-4 w-4 ${updating ? "animate-spin" : ""}`} />
            Sincronizar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card/50 backdrop-blur-xl border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-primary" />
              Total de Líderes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalLiderancas || 0}</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur-xl border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Total de Eleitores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalEleitores || 0}</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur-xl border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Locais Cobertos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set([
                ...(liderancas?.filter((l: any) => l.bairro).map((l: any) => l.bairro) || []),
                ...(eleitores?.filter((e: any) => e.bairro).map((e: any) => e.bairro) || []),
              ]).size}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="p-0 overflow-hidden border-white/10 shadow-2xl bg-card">
        <div className="h-[600px] w-full relative z-0">
          {mounted ? (
            <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Carregando mapa...</div>}>
              <StrategicMapView
                center={center}
                showLeaders={showLeaders}
                showVoters={showVoters}
                leaders={stats?.leadersWithCounts || []}
                voters={eleitores || []}
              />
            </Suspense>
          ) : (
            <div className="p-8 text-center text-muted-foreground">Carregando mapa...</div>
          )}

          <div className="absolute bottom-4 left-4 z-[1000] rounded-md border border-border bg-background/95 p-3 shadow-lg backdrop-blur space-y-2 text-foreground">
            <h4 className="text-xs font-bold uppercase tracking-wide text-foreground">Legenda</h4>
            <div className="flex items-center gap-2 text-xs text-foreground">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span>Lideranças</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-foreground">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span>Eleitores</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
