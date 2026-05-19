import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Badge } from "@/components/ui/badge";
import { Users, MapPin, TrendingUp } from "lucide-react";

// Fix Leaflet marker icons
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const blueIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const redIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface Leader {
  id: string;
  nome: string;
  latitude: number | null;
  longitude: number | null;
  bairro?: string | null;
  cidade?: string | null;
  voterCount: number;
  percentage: string;
}

interface Voter {
  id: string;
  nome: string;
  latitude: number | null;
  longitude: number | null;
  status: string;
  bairro?: string | null;
  cidade?: string | null;
}

interface Props {
  center: [number, number];
  showLeaders: boolean;
  showVoters: boolean;
  leaders: Leader[];
  voters: Voter[];
}

import { useEffect } from "react";
import { useMap } from "react-leaflet";

function MapUpdater({ center, bounds }: { center: [number, number], bounds?: L.LatLngBounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50] });
    } else {
      map.setView(center, map.getZoom());
    }
  }, [center, bounds, map]);
  return null;
}

export default function StrategicMapView({ center, showLeaders, showVoters, leaders, voters }: Props) {
  // Filter only those with coordinates
  const leadersWithCoords = leaders.filter((l) => Number.isFinite(l.latitude) && Number.isFinite(l.longitude));
  const votersWithCoords = voters.filter((v) => Number.isFinite(v.latitude) && Number.isFinite(v.longitude));

  return (
    <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }} scrollWheelZoom={true}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <MapUpdater center={center} />

      {showLeaders &&
        leadersWithCoords.map(
          (leader) => (
              <Marker key={`leader-${leader.id}`} position={[leader.latitude!, leader.longitude!]} icon={redIcon}>
                <Popup>
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
        )}

      {showVoters &&
        votersWithCoords.map(
          (eleitor) => (
              <Marker key={`eleitor-${eleitor.id}`} position={[eleitor.latitude!, eleitor.longitude!]} icon={blueIcon}>
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
        )}
    </MapContainer>
  );
}
