import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Users, CalendarPlus, Camera, MapPin, Clock, CloudOff, RefreshCcw, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { enqueueFoto, flushFotos, subscribeOutbox, countFotosPendentes } from "@/lib/offline-fotos";

export const Route = createFileRoute("/_authenticated/minha-gestao")({
  component: MinhaGestaoPage,
});

function MinhaGestaoPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="flex items-center justify-center p-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!userId) return <div className="p-6">Faça login para acessar sua gestão.</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Minha Gestão</h1>
        <p className="text-muted-foreground text-sm">Acompanhe seus eleitores captados, reuniões e fotos.</p>
      </div>

      <Tabs defaultValue="eleitores" className="space-y-4">
        <TabsList>
          <TabsTrigger value="eleitores"><Users className="h-4 w-4 mr-2" />Eleitores</TabsTrigger>
          <TabsTrigger value="reunioes"><CalendarPlus className="h-4 w-4 mr-2" />Reuniões</TabsTrigger>
          <TabsTrigger value="fotos"><Camera className="h-4 w-4 mr-2" />Fotos</TabsTrigger>
        </TabsList>

        <TabsContent value="eleitores"><EleitoresCaptados userId={userId} /></TabsContent>
        <TabsContent value="reunioes"><ReunioesTab userId={userId} /></TabsContent>
        <TabsContent value="fotos"><FotosTab userId={userId} /></TabsContent>
      </Tabs>
    </div>
  );
}

/* ============== ELEITORES ============== */
function EleitoresCaptados({ userId }: { userId: string }) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("eleitores")
        .select("id, nome, telefone, bairro, cidade, created_at")
        .eq("origem_usuario_id", userId)
        .order("created_at", { ascending: false });
      setRows(data ?? []);
      setLoading(false);
    })();
  }, [userId]);

  const stats = useMemo(() => {
    const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
    const semana = new Date(Date.now() - 7 * 86400_000);
    const mes = new Date(Date.now() - 30 * 86400_000);
    return {
      total: rows.length,
      hoje: rows.filter(r => new Date(r.created_at) >= hoje).length,
      semana: rows.filter(r => new Date(r.created_at) >= semana).length,
      mes: rows.filter(r => new Date(r.created_at) >= mes).length,
    };
  }, [rows]);

  if (loading) return <div className="flex items-center justify-center p-8"><Loader2 className="h-5 w-5 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Hoje" value={stats.hoje} />
        <StatCard label="Últimos 7 dias" value={stats.semana} />
        <StatCard label="Últimos 30 dias" value={stats.mes} />
      </div>
      <Card className="bg-card/60 backdrop-blur-xl border-white/5 overflow-hidden">
        <div className="max-h-[500px] overflow-y-auto divide-y divide-white/5">
          {rows.length === 0 && <div className="p-6 text-sm text-muted-foreground">Nenhum eleitor captado ainda.</div>}
          {rows.map(r => (
            <div key={r.id} className="p-4 flex items-center justify-between hover:bg-white/5">
              <div>
                <p className="font-medium">{r.nome}</p>
                <p className="text-xs text-muted-foreground">{r.bairro ?? "—"} • {r.cidade ?? "—"} • {r.telefone ?? "—"}</p>
              </div>
              <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-4 bg-card/60 backdrop-blur-xl border-white/5">
      <p className="text-xs text-muted-foreground uppercase">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </Card>
  );
}

/* ============== REUNIÕES ============== */
function ReunioesTab({ userId }: { userId: string }) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ titulo: "", descricao: "", data_hora: "", local_nome: "", endereco: "" });
  const [saving, setSaving] = useState(false);

  async function refresh() {
    const { data } = await supabase
      .from("reunioes_lideranca")
      .select("*")
      .eq("lideranca_user_id", userId)
      .order("data_hora", { ascending: false });
    setRows(data ?? []);
  }

  useEffect(() => { (async () => { await refresh(); setLoading(false); })(); }, [userId]);

  async function getCoords(): Promise<{ lat: number | null; lng: number | null }> {
    if (typeof navigator === "undefined" || !navigator.geolocation) return { lat: null, lng: null };
    return new Promise(resolve => {
      navigator.geolocation.getCurrentPosition(
        p => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
        () => resolve({ lat: null, lng: null }),
        { timeout: 6000 },
      );
    });
  }

  async function handleSave() {
    if (!form.titulo || !form.data_hora) return toast.error("Título e data/hora são obrigatórios");
    setSaving(true);
    const { lat, lng } = await getCoords();
    const { error } = await supabase.from("reunioes_lideranca").insert({
      lideranca_user_id: userId,
      titulo: form.titulo,
      descricao: form.descricao || null,
      data_hora: new Date(form.data_hora).toISOString(),
      local_nome: form.local_nome || null,
      endereco: form.endereco || null,
      latitude: lat,
      longitude: lng,
    });
    setSaving(false);
    if (error) return toast.error("Erro: " + error.message);
    toast.success("Reunião agendada");
    setOpen(false);
    setForm({ titulo: "", descricao: "", data_hora: "", local_nome: "", endereco: "" });
    void refresh();
  }

  async function updateStatus(id: string, status: string) {
    const { error } = await supabase.from("reunioes_lideranca").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    void refresh();
  }

  if (loading) return <div className="flex items-center justify-center p-8"><Loader2 className="h-5 w-5 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><CalendarPlus className="h-4 w-4 mr-2" />Nova reunião</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Agendar reunião</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5"><Label>Título</Label><Input value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Data e hora</Label><Input type="datetime-local" value={form.data_hora} onChange={e => setForm({ ...form, data_hora: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Local</Label><Input value={form.local_nome} onChange={e => setForm({ ...form, local_nome: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Endereço</Label><Input value={form.endereco} onChange={e => setForm({ ...form, endereco: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Descrição</Label><Textarea value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} /></div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button onClick={handleSave} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Salvar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-card/60 backdrop-blur-xl border-white/5 divide-y divide-white/5">
        {rows.length === 0 && <div className="p-6 text-sm text-muted-foreground">Nenhuma reunião cadastrada.</div>}
        {rows.map(r => (
          <div key={r.id} className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <p className="font-medium">{r.titulo}</p>
              <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-2">
                <Clock className="h-3 w-3" />{new Date(r.data_hora).toLocaleString()}
                {r.local_nome && <><MapPin className="h-3 w-3 ml-2" />{r.local_nome}</>}
              </p>
              {r.descricao && <p className="text-sm text-muted-foreground mt-1">{r.descricao}</p>}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-1 rounded bg-white/5 capitalize">{r.status}</span>
              <select
                className="bg-background border rounded text-xs px-2 py-1"
                value={r.status}
                onChange={e => updateStatus(r.id, e.target.value)}
              >
                <option value="agendada">Agendada</option>
                <option value="realizada">Realizada</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

/* ============== FOTOS ============== */
function FotosTab({ userId }: { userId: string }) {
  const [pendentes, setPendentes] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const [fotos, setFotos] = useState<any[]>([]);
  const [reunioes, setReunioes] = useState<any[]>([]);
  const [reuniaoSel, setReuniaoSel] = useState<string>("");
  const fileRef = useRef<HTMLInputElement | null>(null);

  async function refresh() {
    const { data } = await supabase
      .from("fotos_reuniao")
      .select("*")
      .eq("lideranca_user_id", userId)
      .order("capturada_em", { ascending: false })
      .limit(60);
    setFotos(data ?? []);
    const { data: rs } = await supabase
      .from("reunioes_lideranca")
      .select("id, titulo, data_hora")
      .eq("lideranca_user_id", userId)
      .order("data_hora", { ascending: false })
      .limit(50);
    setReunioes(rs ?? []);
  }

  useEffect(() => {
    void refresh();
    const update = async () => setPendentes(await countFotosPendentes());
    void update();
    const unsub = subscribeOutbox(update);
    const onOnline = () => void flushAndRefresh();
    window.addEventListener("online", onOnline);
    return () => { unsub(); window.removeEventListener("online", onOnline); };
  }, [userId]);

  async function flushAndRefresh() {
    setEnviando(true);
    const r = await flushFotos();
    setEnviando(false);
    if (r.enviadas > 0) {
      toast.success(`${r.enviadas} foto(s) enviada(s)`);
      void refresh();
    }
    if (r.falharam > 0) toast.warning(`${r.falharam} foto(s) ainda na fila`);
  }

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const coords = await new Promise<{ lat: number | null; lng: number | null }>(resolve => {
      if (!navigator.geolocation) return resolve({ lat: null, lng: null });
      navigator.geolocation.getCurrentPosition(
        p => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
        () => resolve({ lat: null, lng: null }),
        { timeout: 6000, enableHighAccuracy: true },
      );
    });
    const capturadaEm = new Date().toISOString();
    for (const f of files) {
      await enqueueFoto({
        userId,
        reuniaoId: reuniaoSel || null,
        blob: f,
        filename: f.name.replace(/\s+/g, "_"),
        contentType: f.type || "image/jpeg",
        latitude: coords.lat,
        longitude: coords.lng,
        capturadaEm,
      });
    }
    toast.success(`${files.length} foto(s) na fila`);
    if (fileRef.current) fileRef.current.value = "";
    void flushAndRefresh();
  }

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-card/60 backdrop-blur-xl border-white/5 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-sm">
            {pendentes > 0 ? (
              <span className="flex items-center gap-2 text-amber-400"><CloudOff className="h-4 w-4" />{pendentes} foto(s) aguardando internet</span>
            ) : (
              <span className="text-muted-foreground">Fila offline vazia</span>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={flushAndRefresh} disabled={enviando}>
            <RefreshCcw className={`h-4 w-4 mr-2 ${enviando ? "animate-spin" : ""}`} />Sincronizar agora
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Vincular à reunião (opcional)</Label>
            <select
              className="w-full bg-background border rounded h-9 px-2 text-sm"
              value={reuniaoSel}
              onChange={e => setReuniaoSel(e.target.value)}
            >
              <option value="">— sem reunião —</option>
              {reunioes.map(r => (
                <option key={r.id} value={r.id}>{r.titulo} ({new Date(r.data_hora).toLocaleDateString()})</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Tirar/Enviar foto</Label>
            <Input ref={fileRef} type="file" accept="image/*" capture="environment" multiple onChange={handleFiles} />
            <p className="text-[11px] text-muted-foreground">
              A foto é salva com GPS, data e hora exatos. Sem internet, fica na fila e sobe sozinha quando conectar.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {fotos.length === 0 && (
          <Card className="col-span-full p-8 text-center bg-card/60 backdrop-blur-xl border-white/5">
            <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Nenhuma foto enviada ainda.</p>
          </Card>
        )}
        {fotos.map(f => <FotoCard key={f.id} foto={f} />)}
      </div>
    </div>
  );
}

function FotoCard({ foto }: { foto: any }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    supabase.storage.from("fotos-reunioes").createSignedUrl(foto.storage_path, 3600).then(({ data }) => {
      if (active && data?.signedUrl) setUrl(data.signedUrl);
    });
    return () => { active = false; };
  }, [foto.storage_path]);

  return (
    <Card className="overflow-hidden bg-card/60 backdrop-blur-xl border-white/5">
      <div className="aspect-square bg-muted flex items-center justify-center">
        {url ? <img src={url} alt="" className="w-full h-full object-cover" /> : <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
      </div>
      <div className="p-2 space-y-1 text-[11px]">
        <p className="flex items-center gap-1 text-muted-foreground"><Clock className="h-3 w-3" />{new Date(foto.capturada_em).toLocaleString()}</p>
        {foto.latitude != null && (
          <a
            className="flex items-center gap-1 text-primary hover:underline"
            href={`https://www.google.com/maps?q=${foto.latitude},${foto.longitude}`}
            target="_blank" rel="noreferrer"
          >
            <MapPin className="h-3 w-3" />{foto.latitude.toFixed(5)}, {foto.longitude?.toFixed(5)}
          </a>
        )}
      </div>
    </Card>
  );
}
