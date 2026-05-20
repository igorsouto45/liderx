import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Target, CheckCircle2, Clock, Plus, Trash2, MapPin, Building2, Flag } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/prioridades")({
  component: Prioridades,
});

function Prioridades() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [openMeta, setOpenMeta] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ titulo: "", descricao: "", lider_id: "" });
  const [metaForm, setMetaForm] = useState({ tipo: "geral", nome: "", meta: "", lider_id: "" });

  const { data: profile } = useQuery({
    queryKey: ["perfil-atual"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase.from("perfis").select("*").eq("id", user.id).single();
      return data;
    }
  });

  const isAdmin = profile?.tipo === 'admin' || profile?.tipo === 'operador';

  const { data: liderancas } = useQuery({
    queryKey: ["liderancas-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("liderancas").select("id, nome").order("nome");
      if (error) throw error;
      return data;
    },
    enabled: isAdmin
  });

  const { data: prioridades, isLoading: loadingPrioridades } = useQuery({
    queryKey: ["prioridades"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prioridades")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const { data: metas, isLoading: loadingMetas } = useQuery({
    queryKey: ["metas_votos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("metas_votos")
        .select("*")
        .order("tipo", { ascending: true });
      if (error) throw error;
      return data;
    }
  });

  const { data: eleitoresStats } = useQuery({
    queryKey: ["eleitores-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("eleitores")
        .select("bairro, cidade");
      if (error) throw error;
      return data;
    }
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titulo.trim()) return toast.error("Título é obrigatório");
    
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase.from("prioridades").insert({
        titulo: form.titulo,
        descricao: form.descricao,
        lider_id: form.lider_id || user.id,
      });

      if (error) throw error;

      toast.success("Prioridade registrada!");
      setForm({ titulo: "", descricao: "", lider_id: "" });
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["prioridades"] });
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateMeta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!metaForm.meta) return toast.error("Meta é obrigatória");
    if (metaForm.tipo !== "geral" && !metaForm.nome.trim()) return toast.error("Nome é obrigatório para metas por local");
    
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Admin can set meta for a specific leader if metaForm.lider_id is provided, otherwise defaults to current user
      const { error } = await supabase.from("metas_votos").insert({
        tipo: metaForm.tipo as 'geral' | 'bairro' | 'municipio',
        nome: metaForm.tipo === "geral" ? "Geral" : metaForm.nome,
        meta: parseInt(metaForm.meta),
        lider_id: metaForm.lider_id || user.id,
      });

      if (error) throw error;

      toast.success("Meta registrada!");
      setMetaForm({ tipo: "geral", nome: "", meta: "", lider_id: "" });
      setOpenMeta(false);
      queryClient.invalidateQueries({ queryKey: ["metas_votos"] });
    } catch (error: any) {
      toast.error("Erro ao salvar meta: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMeta = async (id: string) => {
    try {
      const { error } = await supabase.from("metas_votos").delete().eq("id", id);
      if (error) throw error;
      toast.success("Meta removida");
      queryClient.invalidateQueries({ queryKey: ["metas_votos"] });
    } catch (error: any) {
      toast.error("Erro ao remover: " + error.message);
    }
  };

  const getProgress = (meta: any) => {
    if (!eleitoresStats) return 0;
    let count = 0;
    if (meta.tipo === "geral") {
      count = eleitoresStats.length;
    } else if (meta.tipo === "bairro") {
      count = eleitoresStats.filter(e => e.bairro?.toLowerCase() === meta.nome?.toLowerCase()).length;
    } else if (meta.tipo === "municipio") {
      count = eleitoresStats.filter(e => e.cidade?.toLowerCase() === meta.nome?.toLowerCase()).length;
    }
    const percent = (count / meta.meta) * 100;
    return Math.min(Math.round(percent), 100);
  };

  const getCount = (meta: any) => {
    if (!eleitoresStats) return 0;
    if (meta.tipo === "geral") return eleitoresStats.length;
    if (meta.tipo === "bairro") return eleitoresStats.filter(e => e.bairro?.toLowerCase() === meta.nome?.toLowerCase()).length;
    if (meta.tipo === "municipio") return eleitoresStats.filter(e => e.cidade?.toLowerCase() === meta.nome?.toLowerCase()).length;
    return 0;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "concluido": return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "pendente": return <Clock className="h-5 w-5 text-amber-500" />;
      default: return <Target className="h-5 w-5 text-primary" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Estratégia e Metas</h1>
          <p className="text-muted-foreground mt-1">Planeje e acompanhe os objetivos da sua campanha.</p>
        </div>
      </div>

      <Tabs defaultValue="metas" className="w-full">
        <TabsList className="bg-card/50 border border-white/5 p-1 mb-6">
          <TabsTrigger value="metas" className="gap-2">
            <Target className="h-4 w-4" /> Metas de Votos
          </TabsTrigger>
          <TabsTrigger value="prioridades" className="gap-2">
            <Flag className="h-4 w-4" /> Prioridades Estratégicas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="prioridades">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Prioridades Estratégicas</h2>
              {isAdmin && (
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2 shadow-lg shadow-primary/20">
                      <Plus className="h-4 w-4" /> Nova Prioridade
                    </Button>
                  </DialogTrigger>
              )}
            </div>
                <DialogContent className="bg-card/95 backdrop-blur-xl border-white/10">
                  <DialogHeader><DialogTitle>Adicionar Prioridade</DialogTitle></DialogHeader>
                  <form onSubmit={handleCreate} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Título *</Label>
                      <Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Ex: Organizar reunião no bairro" required />
                    </div>
                    <div className="space-y-2">
                      <Label>Descrição</Label>
                      <Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Detalhes da demanda..." />
                    </div>
                    <div className="space-y-2">
                      <Label>Líder Responsável (Opcional)</Label>
                      <Select value={form.lider_id} onValueChange={(v) => setForm({ ...form, lider_id: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um líder" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="null">Nenhum (Geral)</SelectItem>
                          {liderancas?.map(l => (
                            <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Líder Alocado (Opcional)</Label>
                      <Select value={metaForm.lider_id} onValueChange={(v) => setMetaForm({ ...metaForm, lider_id: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um líder" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="null">Nenhum (Geral)</SelectItem>
                          {liderancas?.map(l => (
                            <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                      <Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Criar"}</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {loadingPrioridades ? (
                <p>Carregando...</p>
              ) : prioridades?.length === 0 ? (
                <Card className="p-12 text-center col-span-full bg-card/40 border-dashed border-white/10">
                  <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                  <p className="text-muted-foreground">Nenhuma prioridade definida ainda.</p>
                </Card>
              ) : (
                prioridades?.map((item) => (
                  <Card key={item.id} className="p-6 bg-card/50 backdrop-blur-xl border-white/10 flex flex-col justify-between group hover:border-primary/30 transition-all">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <h3 className="font-bold text-lg leading-tight">{item.titulo}</h3>
                        {getStatusIcon(item.status || "pendente")}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-3">{item.descricao}</p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                      <Badge variant="outline" className="capitalize">{item.status || "pendente"}</Badge>
                      <span className="text-[10px] text-muted-foreground">{new Date(item.created_at || "").toLocaleDateString()}</span>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="metas">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Metas de Votos</h2>
              {isAdmin && (
                <Dialog open={openMeta} onOpenChange={setOpenMeta}>
                  <DialogTrigger asChild>
                    <Button className="gap-2 shadow-lg shadow-primary/20">
                      <Plus className="h-4 w-4" /> Nova Meta
                    </Button>
                  </DialogTrigger>
              )}
            </div>
                <DialogContent className="bg-card/95 backdrop-blur-xl border-white/10">
                  <DialogHeader><DialogTitle>Configurar Meta de Votos</DialogTitle></DialogHeader>
                  <form onSubmit={handleCreateMeta} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Tipo de Meta</Label>
                      <Select value={metaForm.tipo} onValueChange={(v) => setMetaForm({ ...metaForm, tipo: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="geral">Geral (Toda Campanha)</SelectItem>
                          <SelectItem value="bairro">Por Bairro</SelectItem>
                          <SelectItem value="municipio">Por Município</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {metaForm.tipo !== "geral" && (
                      <div className="space-y-2">
                        <Label>{metaForm.tipo === "bairro" ? "Nome do Bairro" : "Nome do Município"}</Label>
                        <Input 
                          value={metaForm.nome} 
                          onChange={(e) => setMetaForm({ ...metaForm, nome: e.target.value })} 
                          placeholder={metaForm.tipo === "bairro" ? "Ex: Centro" : "Ex: São Paulo"} 
                          required 
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>Quantidade de Votos (Meta)</Label>
                      <Input 
                        type="number" 
                        value={metaForm.meta} 
                        onChange={(e) => setMetaForm({ ...metaForm, meta: e.target.value })} 
                        placeholder="Ex: 500" 
                        required 
                      />
                    </div>

                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setOpenMeta(false)}>Cancelar</Button>
                      <Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar Meta"}</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {loadingMetas ? (
                <p>Carregando metas...</p>
              ) : metas?.length === 0 ? (
                <Card className="p-12 text-center col-span-full bg-card/40 border-dashed border-white/10">
                  <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                  <p className="text-muted-foreground">Nenhuma meta configurada ainda.</p>
                </Card>
              ) : (
                metas?.map((meta) => {
                  const progress = getProgress(meta);
                  const count = getCount(meta);
                  return (
                    <Card key={meta.id} className="p-6 bg-card/50 backdrop-blur-xl border-white/10 flex flex-col group hover:border-primary/30 transition-all">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            {meta.tipo === "geral" ? <Flag className="h-4 w-4 text-primary" /> : 
                             meta.tipo === "bairro" ? <MapPin className="h-4 w-4 text-primary" /> : 
                             <Building2 className="h-4 w-4 text-primary" />}
                          </div>
                          <div>
                            <h3 className="font-bold leading-tight">{meta.nome}</h3>
                            <p className="text-xs text-muted-foreground uppercase">{meta.tipo}</p>
                          </div>
                        </div>
                        {isAdmin && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteMeta(meta.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Progresso</span>
                          <span className="font-bold">{count} / {meta.meta}</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                        <p className="text-[10px] text-right text-muted-foreground">{progress}% da meta alcançada</p>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
