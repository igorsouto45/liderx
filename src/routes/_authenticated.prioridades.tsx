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
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ titulo: "", descricao: "" });

  const { data: prioridades, isLoading } = useQuery({
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titulo.trim()) return toast.error("Título é obrigatório");
    
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("prioridades").insert({
        titulo: form.titulo,
        descricao: form.descricao,
        lider_id: user?.id,
      });

      if (error) throw error;

      toast.success("Prioridade registrada!");
      setForm({ titulo: "", descricao: "" });
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["prioridades"] });
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setSaving(false);
    }
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
          <h1 className="text-3xl font-bold tracking-tight">Prioridades Estratégicas</h1>
          <p className="text-muted-foreground mt-1">Defina e acompanhe os objetivos da sua base.</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-lg shadow-primary/20">
              <Plus className="h-4 w-4" /> Nova Prioridade
            </Button>
          </DialogTrigger>
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
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Criar"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
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
  );
}
