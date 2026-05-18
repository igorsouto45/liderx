import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Map as MapIcon, Users, UserCheck, MapPin, RefreshCw, TrendingUp } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getLatLongFromCep } from "@/lib/utils";

// Fix Leaflet marker icons
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const blueIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export const Route = createFileRoute("/_authenticated/mapa")({
  component: MapaEstrategico,
});

function MapRecenter({ coords }: { coords: [number, number] }) {
  const map = useMap();
  map.setView(coords);
  return null;
}

function MapaEstrategico() {
  const [updating, setUpdating] = useState(false);
  const [showLeaders, setShowLeaders] = useState(true);
  const [showVoters, setShowVoters] = useState(true);

  const { data: liderancas, isLoading: loadingLiderancas, refetch: refetchLiderancas } = useQuery({
    queryKey: ["liderancas-mapa"],
    queryFn: async () => {
      const { data, error } = await supabase.from("liderancas").select("*");
      if (error) throw error;
      return data;
    }
  });

  const { data: eleitores, isLoading: loadingEleitores, refetch: refetchEleitores } = useQuery({
    queryKey: ["eleitores-mapa"],
    queryFn: async () => {
      const { data, error } = await supabase.from("eleitores").select("*");
      if (error) throw error;
      return data;
    }
  });

  const stats = useMemo(() => {
    if (!liderancas || !eleitores) return null;
    
    const totalEleitores = eleitores.length;
    
    const leadersWithCounts = liderancas.map(leader => {
      const count = eleitores.filter(e => e.origem_usuario_id === leader.auth_user_id).length;
      const percentage = totalEleitores > 0 ? (count / totalEleitores) * 100 : 0;
      return {
        ...leader,
        voterCount: count,
        percentage: percentage.toFixed(1)
      };
    });

    return {
      totalEleitores,
      totalLiderancas: liderancas.length,
      leadersWithCounts
    };
  }, [liderancas, eleitores]);

  const updateCoordinates = async () => {
    setUpdating(true);
    let updatedCount = 0;
    
    try {
      // Update Lideranças
      if (liderancas) {
        for (const leader of liderancas) {
          if ((!leader.latitude || !leader.longitude) && leader.cep) {
            const coords = await getLatLongFromCep(leader.cep);
            if (coords) {
              await supabase.from("liderancas").update({
                latitude: coords.lat,
                longitude: coords.lng
              }).eq("id", leader.id);
              updatedCount++;
            }
          }
        }
      }

      // Update Eleitores
      if (eleitores) {
        for (const eleitor of eleitores) {
          if ((!eleitor.latitude || !eleitor.longitude) && eleitor.cep) {
            const coords = await getLatLongFromCep(eleitor.cep);
            if (coords) {
              await supabase.from("eleitores").update({
                latitude: coords.lat,
                longitude: coords.lng
              }).eq("id", eleitor.id);
              updatedCount++;
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

  const center: [number, number] = stats?.leadersWithCounts?.find(l => l.latitude)?.latitude 
    ? [stats.leadersWithCounts.find(l => l.latitude)!.latitude!, stats.leadersWithCounts.find(l => l.longitude)!.longitude!]
    : [-15.7801, -47.9292]; // Brasilia

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
          <Button 
            variant="outline" 
            size="sm" 
            onClick={updateCoordinates} 
            disabled={updating}
            className="gap-2 h-8"
          >
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
                ...(liderancas?.filter(l => l.bairro).map(l => l.bairro) || []),
                ...(eleitores?.filter(e => e.bairro).map(e => e.bairro) || [])
              ]).size}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="p-0 overflow-hidden border-white/10 shadow-2xl bg-card">
        <div className="h-[600px] w-full relative z-0">
          <MapContainer 
            center={center} 
            zoom={4} 
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* Lideranças */}
            {showLeaders && stats?.leadersWithCounts.map((leader) => (
              leader.latitude && leader.longitude && (
                <Marker 
                  key={`leader-${leader.id}`} 
                  position={[leader.latitude, leader.longitude]}
                  icon={redIcon}
                >
                  <Popup className="custom-popup">
                    <div className="p-1">
                      <h3 className="font-bold text-base border-b border-gray-100 pb-1 mb-2">Líder: {leader.nome}</h3>
                      <div className="space-y-1">
                        <p className="text-sm flex items-center gap-2">
                          <Users className="h-3 w-3 text-primary" />
                          <span className="font-semibold">{leader.voterCount}</span> eleitores cadastrados
                        </p>
                        <p className="text-sm flex items-center gap-2">
                          <TrendingUp className="h-3 w-3 text-green-500" />
                          Representatividade: <span className="font-semibold">{leader.percentage}%</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {leader.bairro}, {leader.cidade}
                        </p>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              )
            ))}

            {/* Eleitores */}
            {showVoters && eleitores?.map((eleitor) => (
              eleitor.latitude && eleitor.longitude && (
                <Marker 
                  key={`eleitor-${eleitor.id}`} 
                  position={[eleitor.latitude, eleitor.longitude]}
                  icon={blueIcon}
                >
                  <Popup>
                    <div className="p-1">
                      <h3 className="font-bold text-sm">Eleitor: {eleitor.nome}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Status: <Badge variant="secondary" className="text-[10px] py-0">{eleitor.status}</Badge>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {eleitor.bairro}, {eleitor.cidade}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              )
            ))}
          </MapContainer>

          <div className="absolute bottom-4 left-4 z-[1000] bg-white/90 backdrop-blur p-3 rounded-lg border border-white/20 shadow-lg space-y-2">
            <h4 className="text-xs font-bold uppercase text-muted-foreground">Legenda</h4>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span>Lideranças</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span>Eleitores</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

