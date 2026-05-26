import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Loader2, 
  Users, 
  MapPin, 
  Target, 
  RotateCcw, 
  Filter, 
  LayoutDashboard,
  Maximize2,
  ChevronRight
} from "lucide-react";
import municipiosGeo from "@/data/rj_municipios.json";

export const Route = createFileRoute("/_authenticated/mapa-rj")({
  component: MapaRJ,
});

const GENEROS = ["FEMININO", "MASCULINO", "NÃO INFORMADO"] as const;
const FAIXAS = [
  "15 anos","16 anos","17 anos","18 anos","19 anos","20 anos",
  "21 a 24 anos","25 a 29 anos","30 a 34 anos","35 a 39 anos",
  "40 a 44 anos","45 a 49 anos","50 a 54 anos","55 a 59 anos",
  "60 a 64 anos","65 a 69 anos","70 a 74 anos","75 a 79 anos",
  "80 a 84 anos","85 a 89 anos","90 a 94 anos","95 a 99 anos",
  "100 anos ou mais","Inválida",
];

const RJ_CENTER: [number, number] = [-22.4, -42.7];
const GEO = municipiosGeo as unknown as Record<string, [number, number]>;

interface MuniTotal { municipio: string; total: number; }
interface DetalheRow { zona: number; secao: number; total: number; }

function MapaRJ() {
  const [generos, setGeneros] = useState<string[]>(["FEMININO", "MASCULINO"]);
  const [faixas, setFaixas] = useState<string[]>([]);
  const [topN, setTopN] = useState<number>(92);
  const [totais, setTotais] = useState<MuniTotal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [detalhe, setDetalhe] = useState<DetalheRow[]>([]);
  const [loadingDet, setLoadingDet] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    supabase.rpc("mapa_rj_totais_municipio", {
      p_generos: generos.length ? generos : undefined,
      p_faixas: faixas.length ? faixas : undefined,
    }).then(({ data, error }) => {
      if (cancelled) return;
      if (error) { console.error(error); setTotais([]); }
      else setTotais((data || []) as MuniTotal[]);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [generos, faixas]);

  useEffect(() => {
    if (!selected) { setDetalhe([]); return; }
    setLoadingDet(true);
    supabase.rpc("mapa_rj_detalhe_municipio", {
      p_municipio: selected,
      p_generos: generos.length ? generos : undefined,
      p_faixas: faixas.length ? faixas : undefined,
    }).then(({ data, error }) => {
      if (error) console.error(error);
      setDetalhe((data || []) as DetalheRow[]);
      setLoadingDet(false);
    });
  }, [selected, generos, faixas]);

  const visiveis = useMemo(() => totais.slice(0, topN), [totais, topN]);
  const maxTotal = visiveis[0]?.total ?? 1;
  const totalGeral = useMemo(() => totais.reduce((a, b) => a + b.total, 0), [totais]);

  const toggle = (arr: string[], v: string, set: (x: string[]) => void) =>
    set(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);

  const radiusFor = (n: number) => 6 + Math.sqrt(n / maxTotal) * 28;

  const zonasResumo = useMemo(() => {
    const m = new Map<number, number>();
    detalhe.forEach(r => m.set(r.zona, (m.get(r.zona) || 0) + r.total));
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, [detalhe]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mapa Estratégico do RJ</h1>
          <p className="text-sm text-muted-foreground">
            Eleitorado agregado por município, zona e seção · TSE
          </p>
        </div>
        <Badge variant="secondary" className="text-base px-3 py-1">
          <Users className="h-4 w-4 mr-2" />
          {totalGeral.toLocaleString("pt-BR")} eleitores
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr_320px] gap-4">
        {/* Filtros */}
        <Card className="lg:max-h-[calc(100vh-180px)] flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2"><Target className="h-4 w-4" /> Filtros</span>
              <Button variant="ghost" size="sm" onClick={() => { setGeneros(["FEMININO","MASCULINO"]); setFaixas([]); setTopN(92); }}>
                <RotateCcw className="h-3 w-3 mr-1" />Reset
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 overflow-y-auto">
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Gênero</Label>
              <div className="space-y-2 mt-2">
                {GENEROS.map(g => (
                  <label key={g} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={generos.includes(g)} onCheckedChange={() => toggle(generos, g, setGeneros)} />
                    {g}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Faixa etária</Label>
              <p className="text-[10px] text-muted-foreground mb-2">Vazio = todas as faixas</p>
              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-2">
                {FAIXAS.map(f => (
                  <label key={f} className="flex items-center gap-2 text-xs cursor-pointer">
                    <Checkbox checked={faixas.includes(f)} onCheckedChange={() => toggle(faixas, f, setFaixas)} />
                    {f}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Top municípios: {topN}
              </Label>
              <Slider value={[topN]} min={5} max={92} step={1} onValueChange={(v) => setTopN(v[0])} className="mt-3" />
            </div>
          </CardContent>
        </Card>

        {/* Mapa */}
        <Card className="overflow-hidden">
          <div className="h-[calc(100vh-180px)] min-h-[500px] relative">
            {loading && (
              <div className="absolute inset-0 z-[400] flex items-center justify-center bg-background/60 backdrop-blur">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}
            <MapContainer center={RJ_CENTER} zoom={8} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
              <TileLayer
                attribution='&copy; OpenStreetMap'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {visiveis.map((m) => {
                const coord = GEO[m.municipio];
                if (!coord) return null;
                const pct = (m.total / (totalGeral || 1)) * 100;
                const isSel = selected === m.municipio;
                return (
                  <CircleMarker
                    key={m.municipio}
                    center={coord}
                    radius={radiusFor(m.total)}
                    pathOptions={{
                      color: isSel ? "hsl(var(--primary))" : "#e94560",
                      fillColor: isSel ? "hsl(var(--primary))" : "#e94560",
                      fillOpacity: 0.55,
                      weight: isSel ? 3 : 1,
                    }}
                    eventHandlers={{ click: () => setSelected(m.municipio) }}
                  >
                    <Tooltip direction="top">
                      <div className="text-xs">
                        <strong>{m.municipio}</strong><br />
                        {m.total.toLocaleString("pt-BR")} ({pct.toFixed(1)}%)
                      </div>
                    </Tooltip>
                    <Popup>
                      <div className="text-sm">
                        <strong>{m.municipio}</strong>
                        <div className="text-muted-foreground">
                          {m.total.toLocaleString("pt-BR")} eleitores · {pct.toFixed(2)}%
                        </div>
                        <Button size="sm" className="mt-2" onClick={() => setSelected(m.municipio)}>
                          Detalhar zonas
                        </Button>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          </div>
        </Card>

        {/* Painel lateral */}
        <Card className="lg:max-h-[calc(100vh-180px)] flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {selected ? selected : "Top municípios"}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full px-4 pb-4">
              {!selected && (
                <div className="space-y-1.5">
                  {visiveis.map((m, i) => (
                    <button
                      key={m.municipio}
                      onClick={() => setSelected(m.municipio)}
                      className="w-full text-left flex items-center justify-between gap-2 rounded-md p-2 hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs text-muted-foreground w-5">{i + 1}</span>
                        <span className="text-sm truncate">{m.municipio}</span>
                      </div>
                      <span className="text-xs font-semibold">{m.total.toLocaleString("pt-BR")}</span>
                    </button>
                  ))}
                </div>
              )}

              {selected && (
                <div className="space-y-3">
                  <Button variant="outline" size="sm" onClick={() => setSelected(null)}>← Voltar ao Top</Button>
                  {loadingDet ? (
                    <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>
                  ) : (
                    <>
                      <div>
                        <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Por Zona Eleitoral</h4>
                        <div className="space-y-1">
                          {zonasResumo.map(([z, t]) => (
                            <div key={z} className="flex justify-between text-sm border-b border-border/40 py-1.5">
                              <span>Zona {z}</span>
                              <span className="font-semibold">{t.toLocaleString("pt-BR")}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                          Seções ({detalhe.length})
                        </h4>
                        <div className="space-y-0.5 text-xs max-h-96 overflow-y-auto pr-2">
                          {detalhe.map(r => (
                            <div key={`${r.zona}-${r.secao}`} className="flex justify-between py-1 border-b border-border/30">
                              <span className="text-muted-foreground">Z{r.zona} · S{r.secao}</span>
                              <span className="font-mono">{r.total.toLocaleString("pt-BR")}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
