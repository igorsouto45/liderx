import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "@/components/ui/sonner";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
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
  Circle,
  Info
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
import { cn, getLatLongFromCep, onlyDigits } from "@/lib/utils";

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
  lgpd_consent: boolean;
  latitude: number | null;
  longitude: number | null;
  situacao_eleitoral: string;
  titulo_eleitor: string;
};

const initialForm: FormState = {
  nome: "", telefone: "", data_nascimento: "", cpf: "",
  cep: "", endereco: "", numero: "", complemento: "",
  bairro: "", cidade: "", uf: "",
  zona_votacao: "", secao_votacao: "", local_votacao_nome: "",
  status: "indeciso",
  lgpd_consent: false,
  latitude: null,
  longitude: null,
  situacao_eleitoral: "Não informado",
  titulo_eleitor: "",
};




function isValidCPF(cpf: string) {
  const cleanCPF = onlyDigits(cpf);
  if (!cleanCPF || cleanCPF.length !== 11) return false;
  
  // Elimina CPFs conhecidos inválidos
  if (/^(\d)\1+$/.test(cleanCPF)) return false;

  // Valida 1o dígito
  let add = 0;
  for (let i = 0; i < 9; i++) add += parseInt(cleanCPF.charAt(i)) * (10 - i);
  let rev = 11 - (add % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(cleanCPF.charAt(9))) return false;

  // Valida 2o dígito
  add = 0;
  for (let i = 0; i < 10; i++) add += parseInt(cleanCPF.charAt(i)) * (11 - i);
  rev = 11 - (add % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(cleanCPF.charAt(10))) return false;

  return true;
}

function Eleitores() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingEleitor, setViewingEleitor] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [form, setForm] = useState<FormState>(initialForm);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [electoralStatusFilter, setElectoralStatusFilter] = useState<string>("all");


  const lookupLocalVotacao = async (cep: string, bairro?: string, cidade?: string) => {
    // Try exact CEP match first
    let { data } = await supabase
      .from("locais_votacao")
      .select("zona, secao, local_nome, endereco, bairro")
      .eq("cep", cep)
      .limit(5);

    if ((!data || data.length === 0) && bairro && cidade) {
      const r = await supabase
        .from("locais_votacao")
        .select("zona, secao, local_nome, endereco, bairro")
        .ilike("bairro", bairro)
        .ilike("municipio", cidade)
        .limit(5);
      data = r.data;
    }

    if (data && data.length > 0) {
      setSuggestions(data);
      // Auto-fill with the first one
      setForm((f) => ({
        ...f,
        zona_votacao: String(data![0].zona ?? ""),
        secao_votacao: String(data![0].secao ?? ""),
        local_votacao_nome: data![0].local_nome ?? "",
      }));
    } else {
      setSuggestions([]);
    }
  };

  const handleCepBlur = async () => {
    const cep = onlyDigits(form.cep);
    if (cep.length !== 8) return;
    setCepLoading(true);
    try {
      const viacepRes = await fetch(`https://viacep.com.br/ws/${cep}/json/`).then(r => r.json());

      if (viacepRes.erro) {
        toast.error("CEP não encontrado");
        return;
      }

      const coords = await getLatLongFromCep(
        cep,
        viacepRes.logradouro,
        viacepRes.bairro,
        viacepRes.localidade
      );

      setForm((f) => ({
        ...f,
        cep,
        endereco: viacepRes.logradouro || f.endereco,
        bairro: viacepRes.bairro || f.bairro,
        cidade: viacepRes.localidade || f.cidade,
        uf: viacepRes.uf || f.uf,
        latitude: coords?.lat ?? f.latitude,
        longitude: coords?.lng ?? f.longitude,
      }));
      await lookupLocalVotacao(cep, viacepRes.bairro, viacepRes.localidade);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao consultar CEP");
    } finally {
      setCepLoading(false);
    }
  };

  const handleOpenCreate = () => {
    console.log("Abrindo modal de cadastro...");
    setEditingId(null);
    setForm(initialForm);
    setSuggestions([]);
    setOpen(true);
    // Pequeno atraso para garantir que o DOM renderizou antes do log
    setTimeout(() => {
      console.log("Modal aberto, estado 'open':", open);
    }, 100);
  };

  const handleEdit = (eleitor: any) => {
    setEditingId(eleitor.id);
    setForm({
      nome: eleitor.nome || "",
      telefone: eleitor.telefone || "",
      data_nascimento: eleitor.data_nascimento || "",
      cpf: eleitor.cpf || "",
      cep: eleitor.cep || "",
      endereco: eleitor.endereco || "",
      numero: eleitor.numero || "",
      complemento: eleitor.complemento || "",
      bairro: eleitor.bairro || "",
      cidade: eleitor.cidade || "",
      uf: eleitor.uf || "",
      zona_votacao: eleitor.zona_votacao ? String(eleitor.zona_votacao) : "",
      secao_votacao: eleitor.secao_votacao ? String(eleitor.secao_votacao) : "",
      local_votacao_nome: eleitor.local_votacao_nome || "",
      status: eleitor.status || "indeciso",
      lgpd_consent: eleitor.lgpd_consent || false,
      latitude: eleitor.latitude || null,
      longitude: eleitor.longitude || null,
      situacao_eleitoral: eleitor.situacao_eleitoral || "Não informado",
      titulo_eleitor: eleitor.titulo_eleitor || "",
    });

    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    console.log("Submit disparado via formulário");
    setValidationError(null);
    
    // Validação básica
    if (!form.nome.trim()) {
      setValidationError("O nome do eleitor é obrigatório.");
      return toast.error("Nome é obrigatório");
    }
    if (!form.telefone.trim()) {
      setValidationError("O WhatsApp é obrigatório para o cadastro.");
      return toast.error("WhatsApp é obrigatório");
    }
    if (!form.data_nascimento) {
      setValidationError("A data de nascimento é obrigatória.");
      return toast.error("Data de nascimento é obrigatória");
    }
    
    if (form.cpf && !isValidCPF(form.cpf)) {
      setValidationError("O CPF informado é inválido.");
      return toast.error("CPF inválido.");
    }

    if (!form.lgpd_consent) {
      setValidationError("Você precisa marcar o consentimento da LGPD.");
      return toast.error("Aceite os termos da LGPD.");
    }

    setSaving(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error("Sessão expirada. Por favor, faça login novamente.");

      const zonaStr = onlyDigits(form.zona_votacao);
      const secaoStr = onlyDigits(form.secao_votacao);
      const zona = zonaStr ? parseInt(zonaStr) : null;
      const secao = secaoStr ? parseInt(secaoStr) : null;
      const cleanPhone = onlyDigits(form.telefone);

      const payload = {
        nome: form.nome.trim(),
        telefone: cleanPhone,
        data_nascimento: form.data_nascimento || null,
        cpf: form.cpf ? onlyDigits(form.cpf) : null,
        cep: form.cep ? onlyDigits(form.cep) : null,
        endereco: form.endereco?.trim() || null,
        numero: form.numero?.trim() || null,
        complemento: form.complemento?.trim() || null,
        bairro: form.bairro?.trim() || null,
        cidade: form.cidade?.trim() || null,
        uf: form.uf?.trim().toUpperCase() || null,
        zona_votacao: zona,
        secao_votacao: secao,
        local_votacao_nome: form.local_votacao_nome?.trim() || null,
        status: form.status as "apoiador" | "indeciso" | "rejeição",
        origem_usuario_id: user.id,
        lgpd_consent: form.lgpd_consent,
        latitude: form.latitude,
        longitude: form.longitude,
        situacao_eleitoral: form.situacao_eleitoral,
        titulo_eleitor: form.titulo_eleitor,

      };

      // Verificação de duplicidade por telefone
      const { data: existing, error: checkError } = await supabase
        .from("eleitores")
        .select("id, nome")
        .eq("telefone", cleanPhone)
        .maybeSingle();

      if (existing && (!editingId || existing.id !== editingId)) {
        setSaving(false);
        setValidationError(`Este telefone já está cadastrado para: ${existing.nome}`);
        return toast.error("Telefone já cadastrado");
      }

      let resultError;
      if (editingId) {
        const { error } = await supabase
          .from("eleitores")
          .update(payload)
          .eq("id", editingId);
        resultError = error;
      } else {
        const { error } = await supabase
          .from("eleitores")
          .insert(payload);
        resultError = error;
      }
      
      if (resultError) throw resultError;

      toast.success(editingId ? "Dados atualizados com sucesso!" : "Eleitor cadastrado com sucesso!");
      
      setForm(initialForm);
      setOpen(false);
      setEditingId(null);
      await queryClient.invalidateQueries({ queryKey: ["eleitores"] });
    } catch (error: any) {
      console.error("Erro no cadastro:", error);
      let msg = error.message || "Erro de conexão com o servidor.";
      if (error.code === "42501") msg = "Você não tem permissão para realizar esta operação (RLS).";
      
      setValidationError(msg);
      toast.error(`Falha: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  const { data: eleitores, isLoading } = useQuery({
    queryKey: ["eleitores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("eleitores")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;

      const profileIds = [...new Set((data || []).map((eleitor) => eleitor.origem_usuario_id).filter((id): id is string => Boolean(id)))];

      if (profileIds.length === 0) {
        return data || [];
      }

      const { data: perfisData, error: perfisError } = await supabase
        .from("perfis")
        .select("id, nome")
        .in("id", profileIds);

      if (perfisError) throw perfisError;

      const perfisMap = new Map((perfisData || []).map((perfil) => [perfil.id, perfil]));

      return (data || []).map((eleitor) => ({
        ...eleitor,
        perfis: eleitor.origem_usuario_id ? perfisMap.get(eleitor.origem_usuario_id) || null : null,
      })) as any[];
    }
  });

  const filteredEleitores = eleitores?.filter(e => 
    e.nome.toLowerCase().includes(search.toLowerCase()) ||
    e.telefone?.includes(search) ||
    e.bairro?.toLowerCase().includes(search.toLowerCase())
  );

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

  const getElectoralStatusBadge = (status: string | null) => {
    switch (status) {
      case "Apto": return <Badge className="bg-green-500 hover:bg-green-600">Apto</Badge>;
      case "Inapto": return <Badge className="bg-red-500 hover:bg-red-600">Inapto</Badge>;
      case "Pendente de validação": return <Badge className="bg-yellow-500 text-black hover:bg-yellow-600">Pendente</Badge>;
      default: return <Badge variant="secondary">Não informado</Badge>;
    }
  };

  const filteredEleitores = eleitores?.filter(e => {
    const matchesSearch = e.nome.toLowerCase().includes(search.toLowerCase()) ||
      e.telefone?.includes(search) ||
      e.bairro?.toLowerCase().includes(search.toLowerCase()) ||
      e.titulo_eleitor?.includes(search);
    
    const matchesStatus = electoralStatusFilter === "all" || e.situacao_eleitoral === electoralStatusFilter;
    
    return matchesSearch && matchesStatus;
  });


  return (
    <div className="space-y-6">
      <Toaster position="top-right" richColors />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Base de Eleitores</h1>
          <p className="text-muted-foreground mt-1">Gerencie e acompanhe todos os eleitores cadastrados.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            className="border-white/10"
            onClick={() => console.log("Botão Filtros clicado")}
          >
            <Filter className="mr-2 h-4 w-4" />
            Filtros
          </Button>
          <Button 
            className="shadow-lg shadow-primary/20" 
            onClick={() => {
              console.log("Botão Cadastrar Eleitor clicado");
              handleOpenCreate();
            }}
          >
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
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{filteredEleitores?.length || 0} eleitores encontrados</span>
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
            ) : filteredEleitores?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  Nenhum eleitor encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredEleitores?.map((eleitor) => (
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
                        <DropdownMenuItem className="gap-2" onClick={() => setViewingEleitor(eleitor)}>
                          <Users className="h-4 w-4" /> Ver Perfil
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2" onClick={() => handleEdit(eleitor)}>
                          <Info className="h-4 w-4" /> Editar Dados
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2">
                          <MessageSquare className="h-4 w-4" /> Enviar Mensagem
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="gap-2 text-destructive focus:text-destructive"
                          onClick={async () => {
                            if (confirm("Tem certeza que deseja remover este eleitor?")) {
                              const { error } = await supabase.from("eleitores").delete().eq("id", eleitor.id);
                              if (error) toast.error("Erro ao remover");
                              else {
                                toast.success("Eleitor removido");
                                queryClient.invalidateQueries({ queryKey: ["eleitores"] });
                              }
                            }
                          }}
                        >
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

      <Dialog open={open} onOpenChange={(val) => {
        if (!saving) {
          setOpen(val);
          if (!val) setValidationError(null);
        }
      }}>
        <DialogContent className="bg-card/95 backdrop-blur-xl border-white/10 max-w-2xl p-0 overflow-hidden flex flex-col max-h-[95vh] md:max-h-[90vh]">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="text-2xl">{editingId ? "Editar Eleitor" : "Novo Cadastro de Eleitor"}</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 pt-2">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="nome">Nome Completo *</Label>
                  <Input 
                    id="nome" 
                    value={form.nome} 
                    onChange={(e) => setForm({ ...form, nome: e.target.value })} 
                    placeholder="Nome completo do eleitor"
                    className="bg-black/20 border-white/10"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone">WhatsApp *</Label>
                  <Input 
                    id="telefone" 
                    value={form.telefone} 
                    onChange={(e) => setForm({ ...form, telefone: e.target.value })} 
                    placeholder="(00) 00000-0000"
                    className="bg-black/20 border-white/10"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="data_nascimento">Data de Nascimento *</Label>
                  <Input 
                    id="data_nascimento" 
                    type="date" 
                    value={form.data_nascimento} 
                    onChange={(e) => setForm({ ...form, data_nascimento: e.target.value })}
                    className="bg-black/20 border-white/10"
                    required
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>CPF (opcional)</Label>
                  <Input 
                    value={form.cpf} 
                    onChange={(e) => setForm({ ...form, cpf: e.target.value })} 
                    placeholder="000.000.000-00"
                    className="bg-black/20 border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>CEP</Label>
                  <div className="relative">
                    <Input
                      value={form.cep}
                      onChange={(e) => setForm({ ...form, cep: e.target.value })}
                      onBlur={handleCepBlur}
                      placeholder="00000-000"
                      className="bg-black/20 border-white/10"
                    />
                    {cepLoading && (
                      <div className="absolute right-3 top-2.5">
                        <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Número</Label>
                  <Input 
                    value={form.numero} 
                    onChange={(e) => setForm({ ...form, numero: e.target.value })} 
                    className="bg-black/20 border-white/10"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Endereço</Label>
                  <Input 
                    value={form.endereco} 
                    onChange={(e) => setForm({ ...form, endereco: e.target.value })} 
                    className="bg-black/20 border-white/10"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Complemento</Label>
                  <Input 
                    value={form.complemento} 
                    onChange={(e) => setForm({ ...form, complemento: e.target.value })} 
                    className="bg-black/20 border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bairro</Label>
                  <Input 
                    value={form.bairro} 
                    onChange={(e) => setForm({ ...form, bairro: e.target.value })} 
                    className="bg-black/20 border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cidade</Label>
                  <Input 
                    value={form.cidade} 
                    onChange={(e) => setForm({ ...form, cidade: e.target.value })} 
                    className="bg-black/20 border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>UF</Label>
                  <Input 
                    value={form.uf} 
                    maxLength={2} 
                    onChange={(e) => setForm({ ...form, uf: e.target.value.toUpperCase() })} 
                    className="bg-black/20 border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status Político</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger className="bg-black/20 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="apoiador">Apoiador</SelectItem>
                      <SelectItem value="indeciso">Indeciso</SelectItem>
                      <SelectItem value="rejeição">Rejeição</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="md:col-span-2 rounded-lg border border-white/10 bg-white/5 p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-primary">Informações de Votação</p>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Zona</Label>
                      <Input 
                        className="h-9 bg-black/40 border-white/5" 
                        value={form.zona_votacao} 
                        onChange={(e) => setForm({ ...form, zona_votacao: e.target.value })} 
                        placeholder="Ex: 123"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Seção</Label>
                      <Input 
                        className="h-9 bg-black/40 border-white/5" 
                        value={form.secao_votacao} 
                        onChange={(e) => setForm({ ...form, secao_votacao: e.target.value })} 
                        placeholder="Ex: 0456"
                      />
                    </div>
                    <div className="space-y-1.5 col-span-2 md:col-span-2">
                      <Label className="text-xs text-muted-foreground">Nome do Local</Label>
                      <Input 
                        className="h-9 bg-black/40 border-white/5" 
                        value={form.local_votacao_nome} 
                        onChange={(e) => setForm({ ...form, local_votacao_nome: e.target.value })} 
                        placeholder="Nome da Escola ou Prédio"
                      />
                    </div>
                  </div>

                  {suggestions.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-white/5">
                      <Label className="text-[10px] text-muted-foreground uppercase font-bold">Sugestões baseadas no CEP:</Label>
                      <div className="grid gap-2">
                        {suggestions.map((s, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setForm({
                              ...form,
                              zona_votacao: String(s.zona),
                              secao_votacao: String(s.secao),
                              local_votacao_nome: s.local_nome
                            })}
                            className="text-left p-2 rounded bg-primary/10 hover:bg-primary/20 border border-primary/20 transition-colors text-xs"
                          >
                            <div className="font-medium text-white/90">{s.local_nome}</div>
                            <div className="text-[10px] text-muted-foreground">Zona {s.zona} • Seção {s.secao} • {s.bairro}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="md:col-span-2 flex items-start space-x-3 p-4 rounded-lg border border-primary/30 bg-primary/5">
                  <Checkbox 
                    id="lgpd" 
                    checked={form.lgpd_consent}
                    onCheckedChange={(checked) => setForm({ ...form, lgpd_consent: !!checked })}
                    className="mt-1"
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label 
                      htmlFor="lgpd" 
                      className="text-sm font-bold leading-none cursor-pointer text-primary-foreground"
                    >
                      Autorizo o uso dos dados (LGPD) *
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      O eleitor consente com o tratamento de seus dados para fins de mobilização política.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 sticky bottom-0 bg-card/95 backdrop-blur-sm pt-4 border-t border-white/10">
              {validationError && (
                <div className="mb-4 p-3 rounded bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium animate-in fade-in slide-in-from-top-1">
                  {validationError}
                </div>
              )}
              
              <DialogFooter className="flex flex-row justify-end gap-3 pb-2">
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="hover:bg-white/5"
                  disabled={saving} 
                  onClick={() => setOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="bg-primary hover:bg-primary/90 text-white font-bold px-10 h-11 shadow-lg shadow-primary/20"
                  disabled={saving}
                >
                  {saving ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      <span>Processando...</span>
                    </div>
                  ) : (
                    editingId ? "Salvar Alterações" : "FINALIZAR CADASTRO"
                  )}
                </Button>
              </DialogFooter>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingEleitor} onOpenChange={(o) => !o && setViewingEleitor(null)}>
        <DialogContent className="bg-card/95 backdrop-blur-xl border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle>Perfil do Eleitor</DialogTitle>
          </DialogHeader>
          {viewingEleitor && (
            <div className="space-y-6 py-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
                  {viewingEleitor.nome[0]}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{viewingEleitor.nome}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusBadge(viewingEleitor.status)}
                  </div>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-bold">WhatsApp</p>
                    <p className="text-sm flex items-center gap-2"><Phone className="h-3 w-3" /> {viewingEleitor.telefone}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-bold">CPF</p>
                    <p className="text-sm">{viewingEleitor.cpf || "Não informado"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-bold">Nascimento</p>
                    <p className="text-sm">{viewingEleitor.data_nascimento ? new Date(viewingEleitor.data_nascimento).toLocaleDateString('pt-BR') : "---"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-bold">Cadastrado por</p>
                    <p className="text-sm font-medium">{viewingEleitor.perfis?.nome || "Campanha Direta"}</p>
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-white/5">
                  <p className="text-xs text-muted-foreground uppercase font-bold">Endereço</p>
                  <div className="text-sm space-y-1">
                    <p>{viewingEleitor.endereco}{viewingEleitor.numero ? `, ${viewingEleitor.numero}` : ""}</p>
                    <p>{viewingEleitor.bairro} - {viewingEleitor.cidade}/{viewingEleitor.uf}</p>
                    <p className="text-muted-foreground text-xs">{viewingEleitor.cep}</p>
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-white/5">
                  <p className="text-xs text-muted-foreground uppercase font-bold">Local de Votação</p>
                  <div className="text-sm space-y-1">
                    <p className="font-medium">{viewingEleitor.local_votacao_nome || "Não definido"}</p>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>Zona: {viewingEleitor.zona_votacao || "---"}</span>
                      <span>Seção: {viewingEleitor.secao_votacao || "---"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingEleitor(null)}>Fechar</Button>
            <Button onClick={() => {
              handleEdit(viewingEleitor);
              setViewingEleitor(null);
            }}>Editar Dados</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
