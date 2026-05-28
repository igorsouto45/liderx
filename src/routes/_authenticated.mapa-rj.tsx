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
import { Input } from "@/components/ui/input";
import { 
  Loader2, 
  Users, 
  MapPin, 
  Target, 
  RotateCcw, 
  Filter, 
  LayoutDashboard,
  Maximize2,
  ChevronRight,
  Search
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
interface DetalheRow { zona: number; secao: number; total: number; bairro: string; local_nome: string; }

function MapaRJ() {
  const [generos, setGeneros] = useState<string[]>(["FEMININO", "MASCULINO"]);
  const [faixas, setFaixas] = useState<string[]>([]);
  const [topN, setTopN] = useState<number>(92);
  const [totais, setTotais] = useState<MuniTotal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [detalhe, setDetalhe] = useState<DetalheRow[]>([]);
  const [loadingDet, setLoadingDet] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [bairroSearch, setBairroSearch] = useState("");


  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    supabase.rpc("mapa_rj_totais_municipio", {
      p_generos: generos.length ? generos : undefined,
      p_faixas: faixas.length ? faixas : undefined,
      p_bairro: bairroSearch || undefined,
    }).then(({ data, error }) => {
      if (cancelled) return;
      if (error) { console.error(error); setTotais([]); }
      else setTotais((data || []) as MuniTotal[]);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [generos, faixas, bairroSearch]);

  useEffect(() => {
    if (!selected) { setDetalhe([]); return; }
    setLoadingDet(true);
    supabase.rpc("mapa_rj_detalhe_municipio", {
      p_municipio: selected,
      p_generos: generos.length ? generos : undefined,
      p_faixas: faixas.length ? faixas : undefined,
      p_bairro: bairroSearch || undefined,
    }).then(({ data, error }) => {
      if (error) console.error(error);
      setDetalhe((data || []) as DetalheRow[]);
      setLoadingDet(false);
    });
  }, [selected, generos, faixas, bairroSearch]);


  const filtrados = useMemo(() => {
    if (!searchTerm) return totais;
    return totais.filter(m => 
      m.municipio.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [totais, searchTerm]);

  const visiveis = useMemo(() => filtrados.slice(0, topN), [filtrados, topN]);
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
    <div className="flex flex-col h-[calc(100vh-100px)] gap-4">
      {/* Cabeçalho Compacto */}
      <div className="flex items-center justify-between gap-4 bg-card p-4 rounded-lg border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <LayoutDashboard className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Mapa Eleitorado RJ</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Análise estratégica baseada em dados oficiais do TSE
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm font-medium px-3 py-1 bg-background">
            <Users className="h-3.5 w-3.5 mr-2 text-primary" />
            {totalGeral.toLocaleString("pt-BR")} <span className="hidden sm:inline ml-1">Eleitores</span>
          </Badge>
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] flex-1 min-h-0 gap-4">
        {/* Coluna Esquerda: Filtros e Ranking */}
        <div className="flex flex-col gap-4 min-h-0">
          {/* Filtros */}
          <Card className="flex flex-col min-h-0 border-primary/20 shadow-sm">
            <CardHeader className="py-3 px-4 border-b bg-muted/30">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Filter className="h-4 w-4 text-primary" /> Filtros
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 px-2 text-[10px]" 
                  onClick={() => { setGeneros(["FEMININO","MASCULINO"]); setFaixas([]); setTopN(92); setSearchTerm(""); }}
                >
                  <RotateCcw className="h-3 w-3 mr-1" />Limpar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-6 overflow-y-auto">
              <div className="space-y-3">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  Gênero
                </Label>
                <div className="grid grid-cols-1 gap-1.5">
                  {GENEROS.map(g => (
                    <label key={g} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 p-1 rounded transition-colors">
                      <Checkbox checked={generos.includes(g)} onCheckedChange={() => toggle(generos, g, setGeneros)} />
                      <span className="text-xs">{g}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Faixa Etária</Label>
                <ScrollArea className="h-48 rounded-md border bg-muted/20 p-2">
                  <div className="space-y-1.5">
                    {FAIXAS.map(f => (
                      <label key={f} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-muted/50 p-1 rounded">
                        <Checkbox checked={faixas.includes(f)} onCheckedChange={() => toggle(faixas, f, setFaixas)} />
                        {f}
                      </label>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex justify-between items-center">
                  <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Top Municípios</Label>
                  <Badge variant="secondary" className="text-[10px]">{topN}</Badge>
                </div>
                <Slider value={[topN]} min={5} max={92} step={1} onValueChange={(v) => setTopN(v[0])} />
              </div>
            </CardContent>
          </Card>

          {/* Ranking / Lista */}
          <Card className="flex-1 min-h-0 flex flex-col shadow-sm">
            <CardHeader className="py-3 px-4 border-b bg-muted/30">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" /> Ranking RJ
              </CardTitle>
              <div className="mt-2 relative">
                <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar município..."
                  className="pl-8 h-8 text-xs"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-2 space-y-1">
                  {visiveis.map((m, i) => (
                    <button
                      key={m.municipio}
                      onClick={() => setSelected(m.municipio)}
                      className={`w-full text-left flex items-center justify-between gap-2 rounded-md p-2 transition-all ${
                        selected === m.municipio 
                          ? "bg-primary text-primary-foreground shadow-md scale-[1.02]" 
                          : "hover:bg-muted"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full ${
                          selected === m.municipio ? "bg-primary-foreground/20" : "bg-muted-foreground/10"
                        }`}>
                          {i + 1}
                        </span>
                        <span className="text-xs font-medium truncate">{m.municipio}</span>
                      </div>
                      <span className="text-[10px] font-bold opacity-80">{m.total.toLocaleString("pt-BR")}</span>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Coluna Direita: Mapa e Detalhes */}
        <div className="flex flex-col gap-4 min-h-0">
          {/* Mapa */}
          <Card className="flex-1 min-h-0 overflow-hidden relative border-primary/10 shadow-lg group">
            <div className="absolute top-4 right-4 z-[500] pointer-events-none group-hover:pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity">
              <Button size="icon" variant="secondary" className="h-8 w-8 shadow-md">
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
            
            {loading && (
              <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-background/40 backdrop-blur-[2px]">
                <div className="bg-background/90 p-4 rounded-xl shadow-2xl flex items-center gap-3 border">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="text-sm font-medium">Carregando dados...</span>
                </div>
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
                      color: isSel ? "hsl(var(--primary))" : "#ef4444",
                      fillColor: isSel ? "hsl(var(--primary))" : "#ef4444",
                      fillOpacity: isSel ? 0.7 : 0.45,
                      weight: isSel ? 3 : 1,
                    }}
                    eventHandlers={{ click: () => setSelected(m.municipio) }}
                  >
                    <Tooltip direction="top" className="rounded-lg shadow-xl border-none p-0 overflow-hidden">
                      <div className="bg-card px-3 py-2 border-l-4 border-primary">
                        <p className="text-[11px] font-bold text-card-foreground">{m.municipio}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {m.total.toLocaleString("pt-BR")} eleitores ({pct.toFixed(1)}%)
                        </p>
                      </div>
                    </Tooltip>
                    <Popup className="custom-popup">
                      <div className="p-1">
                        <h3 className="font-bold text-sm mb-1">{m.municipio}</h3>
                        <p className="text-xs text-muted-foreground mb-3">
                          {m.total.toLocaleString("pt-BR")} eleitores cadastrados
                        </p>
                        <Button size="sm" className="w-full h-8 text-xs" onClick={() => setSelected(m.municipio)}>
                          Explorar Detalhes <ChevronRight className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          </Card>

          {/* Painel de Detalhes (quando selecionado) */}
          {selected && (
            <Card className="h-80 shadow-lg border-t-4 border-t-primary flex flex-col animate-in slide-in-from-bottom-4 duration-300">
              <CardHeader className="py-3 px-4 bg-muted/20 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" /> {selected}
                  </CardTitle>
                  <CardDescription className="text-[10px]">Detalhamento por Zonas e Seções</CardDescription>
                </div>
                <Button variant="outline" size="sm" className="h-8" onClick={() => setSelected(null)}>
                  Fechar Detalhes
                </Button>
              </CardHeader>
              <CardContent className="p-0 flex-1 overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 h-full">
                  <div className="border-r flex flex-col p-4 bg-background">
                    <h4 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                      <Target className="h-3 w-3" /> Zonas Eleitorais
                    </h4>
                    {loadingDet ? (
                      <div className="flex-1 flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
                    ) : (
                      <ScrollArea className="flex-1">
                        <div className="space-y-2 pr-3">
                          {zonasResumo.map(([z, t]) => (
                            <div key={z} className="flex justify-between items-center p-2 rounded-lg border bg-muted/30 hover:bg-muted transition-colors">
                              <span className="text-sm font-medium">Zona {z}</span>
                              <Badge variant="outline" className="font-mono text-xs">{t.toLocaleString("pt-BR")}</Badge>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </div>
                  <div className="flex flex-col p-4 bg-muted/5">
                    <h4 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center justify-between">
                      <span>Seções Eleitorais</span>
                      <Badge variant="secondary" className="text-[10px]">{detalhe.length}</Badge>
                    </h4>
                    {loadingDet ? (
                      <div className="flex-1 flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
                    ) : (
                      <ScrollArea className="flex-1">
                        <div className="grid grid-cols-2 gap-2 pr-3">
                          {detalhe.map(r => (
                            <div key={`${r.zona}-${r.secao}`} className="flex justify-between p-1.5 rounded border bg-background text-[11px]">
                              <span className="text-muted-foreground">Z{r.zona}/S{r.secao}</span>
                              <span className="font-bold">{r.total.toLocaleString("pt-BR")}</span>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
