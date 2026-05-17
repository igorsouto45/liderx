import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  MoreHorizontal, 
  MessageSquare, 
  UserPlus,
  ArrowUpDown,
  Phone,
  MapPin,
  Circle
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/eleitores")({
  component: Eleitores,
});

type FormState = {
  nome: string;
  telefone: string;
  data_nascimento: string;
  cpf: string;
  cep: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  zona_votacao: string;
  secao_votacao: string;
  local_votacao_nome: string;
  status: string;
};

const initialForm: FormState = {
  nome: "", telefone: "", data_nascimento: "", cpf: "",
  cep: "", endereco: "", numero: "", complemento: "",
  bairro: "", cidade: "", uf: "",
  zona_votacao: "", secao_votacao: "", local_votacao_nome: "",
  status: "indeciso",
};

function onlyDigits(s: string) { return s.replace(/\D/g, ""); }

function Eleitores() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [form, setForm] = useState<FormState>(initialForm);

  const lookupLocalVotacao = async (cep: string, bairro?: string, cidade?: string) => {
    // Try exact CEP match first
    let { data } = await supabase
      .from("locais_votacao")
      .select("zona, secao, local_nome")
      .eq("cep", cep)
      .limit(1);
    if ((!data || data.length === 0) && bairro && cidade) {
      const r = await supabase
        .from("locais_votacao")
        .select("zona, secao, local_nome")
        .ilike("bairro", bairro)
        .ilike("municipio", cidade)
        .limit(1);
      data = r.data;
    }
    if (data && data[0]) {
      setForm((f) => ({
        ...f,
        zona_votacao: String(data![0].zona ?? ""),
        secao_votacao: String(data![0].secao ?? ""),
        local_votacao_nome: data![0].local_nome ?? "",
      }));
    }
  };

  const handleCepBlur = async () => {
    const cep = onlyDigits(form.cep);
    if (cep.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (data.erro) {
        toast.error("CEP não encontrado");
        return;
      }
      setForm((f) => ({
        ...f,
        cep,
        endereco: data.logradouro || f.endereco,
        bairro: data.bairro || f.bairro,
        cidade: data.localidade || f.cidade,
        uf: data.uf || f.uf,
      }));
      await lookupLocalVotacao(cep, data.bairro, data.localidade);
    } catch {
      toast.error("Erro ao consultar CEP");
    } finally {
      setCepLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim()) return toast.error("Nome é obrigatório");
    if (!form.telefone.trim()) return toast.error("WhatsApp é obrigatório");
    if (!form.data_nascimento) return toast.error("Data de nascimento é obrigatória");
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("eleitores").insert({
      nome: form.nome,
      telefone: form.telefone,
      data_nascimento: form.data_nascimento,
      cpf: form.cpf || null,
      cep: form.cep || null,
      endereco: form.endereco || null,
      numero: form.numero || null,
      complemento: form.complemento || null,
      bairro: form.bairro || null,
      cidade: form.cidade || null,
      uf: form.uf || null,
      zona_votacao: form.zona_votacao ? parseInt(form.zona_votacao) : null,
      secao_votacao: form.secao_votacao ? parseInt(form.secao_votacao) : null,
      local_votacao_nome: form.local_votacao_nome || null,
      status: form.status as any,
      origem_usuario_id: user?.id,
    });
    setSaving(false);
    if (error) {
      toast.error("Erro ao cadastrar: " + error.message);
      return;
    }
    toast.success("Eleitor cadastrado!");
    setForm(initialForm);
    setOpen(false);
    queryClient.invalidateQueries({ queryKey: ["eleitores"] });
  };

  const { data: eleitores, isLoading } = useQuery({
    queryKey: ["eleitores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("eleitores")
        .select(`
          *,
          perfis (nome)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "apoiador":
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20 gap-1.5"><Circle className="h-1.5 w-1.5 fill-current" /> Apoiador</Badge>;
      case "indeciso":
        return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 gap-1.5"><Circle className="h-1.5 w-1.5 fill-current" /> Indeciso</Badge>;
      case "rejeição":
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20 gap-1.5"><Circle className="h-1.5 w-1.5 fill-current" /> Rejeição</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Base de Eleitores</h1>
          <p className="text-muted-foreground mt-1">Gerencie e acompanhe todos os eleitores cadastrados.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="border-white/10">
            <Filter className="mr-2 h-4 w-4" />
            Filtros
          </Button>
          <Button className="shadow-lg shadow-primary/20" onClick={() => setOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Cadastrar Eleitor
          </Button>
        </div>
      </div>

      <Card className="dashboard-card p-0 overflow-hidden">
        <div className="p-4 border-b border-white/5 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por nome, telefone ou bairro..." 
              className="pl-10 bg-black/20 border-white/10"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{eleitores?.length || 0} eleitores encontrados</span>
          </div>
        </div>

        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="w-[300px]">Eleitor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Bairro</TableHead>
              <TableHead>Liderança</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  Carregando eleitores...
                </TableCell>
              </TableRow>
            ) : eleitores?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  Nenhum eleitor encontrado.
                </TableCell>
              </TableRow>
            ) : (
              eleitores?.map((eleitor) => (
                <TableRow key={eleitor.id} className="border-white/5 hover:bg-white/5 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {eleitor.nome[0]}
                      </div>
                      <div>
                        <div className="font-bold">{eleitor.nome}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Phone className="h-3 w-3" /> {eleitor.telefone || "Não informado"}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(eleitor.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      {eleitor.bairro || "---"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">{eleitor.perfis?.nome || "Campanha Direta"}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 border-white/10 bg-card/90 backdrop-blur-xl">
                        <DropdownMenuItem className="gap-2">
                          <Users className="h-4 w-4" /> Ver Perfil
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2">
                          <MessageSquare className="h-4 w-4" /> Enviar Mensagem
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive">
                          Remover Registro
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card/95 backdrop-blur-xl border-white/10">
          <DialogHeader>
            <DialogTitle>Cadastrar Eleitor</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Bairro</Label>
              <Input value={form.bairro} onChange={(e) => setForm({ ...form, bairro: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="apoiador">Apoiador</SelectItem>
                  <SelectItem value="indeciso">Indeciso</SelectItem>
                  <SelectItem value="rejeição">Rejeição</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Cadastrar"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
