import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  MoreHorizontal, 
  UserPlus,
  Phone,
  MapPin,
  TrendingUp,
  Award,
  Info,
  Upload,
  File,
  X as XIcon,
  Download,
  Loader2,
  FileCheck,
  ShieldCheck,
  Target
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
import { onlyDigits, getLatLongFromCep, cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/liderancas")({
  component: Liderancas,
});

type FormState = {
  nome: string;
  telefone: string;
  email: string;
  senha?: string;
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
  lgpd_consent: boolean;
  latitude: number | null;
  longitude: number | null;
  titulo_eleitor: string;
  situacao_eleitoral: string;
  data_consulta_eleitoral: string;
  observacao_situacao_eleitoral: string;
  situacao_eleitoral_validada: boolean;
};

const initialForm: FormState = {
  nome: "", telefone: "", email: "", senha: "", data_nascimento: "", cpf: "",
  cep: "", endereco: "", numero: "", complemento: "",
  bairro: "", cidade: "", uf: "",
  zona_votacao: "", secao_votacao: "", local_votacao_nome: "",
  lgpd_consent: false,
  latitude: null,
  longitude: null,
  titulo_eleitor: "",
  situacao_eleitoral: "Não informado",
  data_consulta_eleitoral: "",
  observacao_situacao_eleitoral: "",
  situacao_eleitoral_validada: false,
};




function isValidCPF(cpf: string) {
  const cleanCPF = onlyDigits(cpf);
  if (!cleanCPF || cleanCPF.length !== 11) return false;
  if (/^(\d)\1+$/.test(cleanCPF)) return false;
  let add = 0;
  for (let i = 0; i < 9; i++) add += parseInt(cleanCPF.charAt(i)) * (10 - i);
  let rev = 11 - (add % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(cleanCPF.charAt(9))) return false;
  add = 0;
  for (let i = 0; i < 10; i++) add += parseInt(cleanCPF.charAt(i)) * (11 - i);
  rev = 11 - (add % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(cleanCPF.charAt(10))) return false;
  return true;
}

function Liderancas() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [form, setForm] = useState<FormState>(initialForm);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  const { data: documentos, refetch: refetchDocumentos } = useQuery({
    queryKey: ["documentos-lideranca", editingId],
    queryFn: async () => {
      if (!editingId) return [];
      const { data, error } = await supabase
        .from("documentos_lideranca")
        .select("*")
        .eq("lider_id", editingId);
      if (error) throw error;
      return data;
    },
    enabled: !!editingId,
  });

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingId) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${editingId}/${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documentos-liderancas')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from('documentos_lideranca')
        .insert({
          lider_id: editingId,
          nome_arquivo: file.name,
          caminho_arquivo: filePath,
          tipo_arquivo: file.type,
          tamanho_arquivo: file.size
        });

      if (dbError) throw dbError;

      toast.success("Arquivo enviado com sucesso!");
      refetchDocumentos();
    } catch (error: any) {
      toast.error("Erro no upload: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (doc: any) => {
    if (!confirm("Excluir este arquivo?")) return;

    try {
      const { error: storageError } = await supabase.storage
        .from('documentos-liderancas')
        .remove([doc.caminho_arquivo]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from('documentos_lideranca')
        .delete()
        .eq('id', doc.id);

      if (dbError) throw dbError;

      toast.success("Arquivo removido");
      refetchDocumentos();
    } catch (error: any) {
      toast.error("Erro ao excluir: " + error.message);
    }
  };

  const handleDownloadFile = async (doc: any) => {
    try {
      const { data, error } = await supabase.storage
        .from('documentos-liderancas')
        .download(doc.caminho_arquivo);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.nome_arquivo;
      a.click();
    } catch (error: any) {
      toast.error("Erro no download: " + error.message);
    }
  };

  const lookupLocalVotacao = async (cep: string, bairro?: string, cidade?: string) => {
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
    setEditingId(null);
    setForm(initialForm);
    setSuggestions([]);
    setOpen(true);
  };

  const handleEdit = (lider: any) => {
    setEditingId(lider.id);
    setForm({
      nome: lider.nome || "",
      telefone: lider.telefone || "",
      email: lider.email || "",
      senha: "",
      data_nascimento: lider.data_nascimento || "",
      cpf: lider.cpf || "",
      cep: lider.cep || "",
      endereco: lider.endereco || "",
      numero: lider.numero || "",
      complemento: lider.complemento || "",
      bairro: lider.bairro || "",
      cidade: lider.cidade || "",
      uf: lider.uf || "",
      zona_votacao: lider.zona_votacao ? String(lider.zona_votacao) : "",
      secao_votacao: lider.secao_votacao ? String(lider.secao_votacao) : "",
      local_votacao_nome: lider.local_votacao_nome || "",
      lgpd_consent: lider.lgpd_consent || false,
      latitude: lider.latitude || null,
      longitude: lider.longitude || null,
      titulo_eleitor: lider.titulo_eleitor || "",
      situacao_eleitoral: lider.situacao_eleitoral || "Não informado",
      data_consulta_eleitoral: lider.data_consulta_eleitoral ? new Date(lider.data_consulta_eleitoral).toISOString().split('T')[0] : "",
      observacao_situacao_eleitoral: lider.observacao_situacao_eleitoral || "",
      situacao_eleitoral_validada: lider.situacao_eleitoral_validada || false,
    });

    setOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim()) return toast.error("Nome é obrigatório");
    if (!form.email.trim()) return toast.error("E-mail é obrigatório");
    if (!editingId && (!form.senha || !form.senha?.trim())) return toast.error("Senha é obrigatória");
    if (form.cpf && !isValidCPF(form.cpf)) return toast.error("CPF inválido");
    if (!form.lgpd_consent) return toast.error("É necessário aceitar os termos da LGPD");
    
    setSaving(true);
    try {
      let authUserId = null;

      if (!editingId) {
        // 1. Criar o usuário no Auth apenas se for novo
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: form.email,
          password: form.senha || "",
          options: {
            data: {
              nome: form.nome,
              tipo: 'líder'
            }
          }
        });

        if (authError) throw authError;
        authUserId = authData.user?.id;
      }

      const payload = {
        nome: form.nome,
        telefone: form.telefone,
        email: form.email,
        data_nascimento: form.data_nascimento || null,
        cpf: form.cpf ? onlyDigits(form.cpf) : null,
        cep: form.cep ? onlyDigits(form.cep) : null,
        endereco: form.endereco,
        numero: form.numero,
        complemento: form.complemento,
        bairro: form.bairro,
        cidade: form.cidade,
        uf: form.uf,
        zona_votacao: form.zona_votacao ? parseInt(onlyDigits(form.zona_votacao)) : null,
        secao_votacao: form.secao_votacao ? parseInt(onlyDigits(form.secao_votacao)) : null,
        local_votacao_nome: form.local_votacao_nome,
        lgpd_consent: form.lgpd_consent,
        latitude: form.latitude,
        longitude: form.longitude,
        titulo_eleitor: form.titulo_eleitor,
        situacao_eleitoral: form.situacao_eleitoral,
        data_consulta_eleitoral: form.data_consulta_eleitoral || null,
        observacao_situacao_eleitoral: form.observacao_situacao_eleitoral,
        situacao_eleitoral_validada: form.situacao_eleitoral_validada,
      };


      if (editingId) {
        const { error } = await supabase
          .from("liderancas")
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
        toast.success("Liderança atualizada com sucesso!");
      } else {
        const { error } = await supabase.from("liderancas").insert({
          ...payload,
          auth_user_id: authUserId,
        });
        if (error) throw error;
        toast.success("Liderança cadastrada e conta de acesso criada!");
      }

      setForm(initialForm);
      setOpen(false);
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ["liderancas"] });
    } catch (error: any) {
      console.error("Erro detalhado na gestão de liderança:", error);
      let errorMessage = "Erro inesperado ao salvar.";
      
      if (error.code === "23505") {
        errorMessage = "Este E-mail ou CPF já está em uso.";
      } else if (error.code === "42501") {
        errorMessage = "Você não tem permissão para esta operação.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(`Falha ao salvar liderança: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  const { data: liderancas, isLoading } = useQuery({
    queryKey: ["liderancas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("liderancas")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Lideranças</h1>
          <p className="text-muted-foreground mt-1">Gerencie a rede de líderes e multiplicadores.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={async () => {
            toast.info("Preparando exportação... Aguarde.");
            // Lógica de ZIP seria feita via Edge Function ou lib client-side.
            // Como não temos JSZip instalado agora, deixamos o feedback.
            toast.success("Recurso de exportação em massa (ZIP) será integrado em breve.");
          }}>
            <Download className="mr-2 h-4 w-4" />
            Exportar Todos (ZIP)
          </Button>
          <Button className="shadow-lg shadow-primary/20" onClick={handleOpenCreate}>
            <UserPlus className="mr-2 h-4 w-4" />
            Cadastrar Líder
          </Button>
        </div>
      </div>

      <Card className="dashboard-card p-0 overflow-hidden">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/5">
              <TableHead>Líder</TableHead>
              <TableHead>Bairro</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="text-center">Carregando...</TableCell></TableRow>
            ) : liderancas?.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center">Nenhum líder cadastrado.</TableCell></TableRow>
            ) : (
              liderancas?.map((lider) => (
                <TableRow key={lider.id} className="border-white/5">
                  <TableCell className="font-bold">{lider.nome}</TableCell>
                  <TableCell>{lider.bairro || "---"}</TableCell>
                  <TableCell>{lider.telefone || "---"}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(lider)}>Editar</DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={async () => {
                            if (confirm("Tem certeza que deseja remover este líder?")) {
                              const { error } = await supabase.from("liderancas").delete().eq("id", lider.id);
                              if (error) toast.error("Erro ao remover");
                              else {
                                toast.success("Líder removido");
                                queryClient.invalidateQueries({ queryKey: ["liderancas"] });
                              }
                            }
                          }}
                        >
                          Remover
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card/95 backdrop-blur-xl border-white/10">
          <DialogHeader><DialogTitle>{editingId ? "Editar Liderança" : "Cadastrar Nova Liderança"}</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2 md:col-span-2">
                <Label>Nome Completo *</Label>
                <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>E-mail (Acesso ao Sistema) *</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@exemplo.com" required />
              </div>
              {!editingId && (
                <div className="space-y-2">
                  <Label>Senha de Acesso *</Label>
                  <Input type="password" value={form.senha} onChange={(e) => setForm({ ...form, senha: e.target.value })} placeholder="Mínimo 6 caracteres" required />
                </div>
              )}
              <div className="space-y-2">
                <Label>Telefone *</Label>
                <Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} placeholder="(21) 99999-9999" required />
              </div>
              <div className="space-y-2">
                <Label>Data de Nascimento</Label>
                <Input type="date" value={form.data_nascimento} onChange={(e) => setForm({ ...form, data_nascimento: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>CPF</Label>
                <Input value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} placeholder="000.000.000-00" />
              </div>
              <div className="space-y-2">
                <Label>CEP</Label>
                <Input value={form.cep} onChange={(e) => setForm({ ...form, cep: e.target.value })} onBlur={handleCepBlur} placeholder="00000-000" />
              </div>
              <div className="space-y-2">
                <Label>Número</Label>
                <Input value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Endereço</Label>
                <Input value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Complemento</Label>
                <Input value={form.complemento} onChange={(e) => setForm({ ...form, complemento: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Bairro</Label>
                <Input value={form.bairro} onChange={(e) => setForm({ ...form, bairro: e.target.value })} />
            </div>

            {editingId && (
              <div className="md:col-span-2 space-y-3 pt-4 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold text-primary">Documentos e Contratos</Label>
                  <div className="relative">
                    <Input
                      type="file"
                      className="hidden"
                      id="file-upload"
                      onChange={handleUploadFile}
                      disabled={uploading}
                    />
                    <Label
                      htmlFor="file-upload"
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary/10 text-primary text-xs font-medium cursor-pointer hover:bg-primary/20 transition-colors",
                        uploading && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                      {uploading ? "Enviando..." : "Subir Arquivo"}
                    </Label>
                  </div>
                </div>

                <div className="grid gap-2">
                  {documentos && documentos.length > 0 ? (
                    documentos.map((doc: any) => (
                      <div key={doc.id} className="flex items-center justify-between p-2 rounded bg-black/20 border border-white/5 group">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <File className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="flex flex-col overflow-hidden">
                            <span className="text-xs font-medium truncate">{doc.nome_arquivo}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {(doc.tamanho_arquivo / 1024).toFixed(1)} KB • {new Date(doc.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7"
                            onClick={() => handleDownloadFile(doc)}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteFile(doc)}
                          >
                            <XIcon className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground italic text-center py-4 border border-dashed border-white/10 rounded">
                      Nenhum documento anexado.
                    </p>
                  )}
                </div>
              </div>
            )}

              <div className="space-y-2">
                <Label>Cidade</Label>
                <Input value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>UF</Label>
                <Input value={form.uf} maxLength={2} onChange={(e) => setForm({ ...form, uf: e.target.value.toUpperCase() })} />
              </div>

              <div className="md:col-span-2 rounded-md border border-white/10 bg-white/5 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-primary">Local de Votação</p>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground bg-white/5 px-2 py-0.5 rounded">Ajuste manual</span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Zona</Label>
                    <Input 
                      className="h-8 bg-black/40" 
                      value={form.zona_votacao} 
                      onChange={(e) => setForm({ ...form, zona_votacao: e.target.value })} 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Seção</Label>
                    <Input 
                      className="h-8 bg-black/40" 
                      value={form.secao_votacao} 
                      onChange={(e) => setForm({ ...form, secao_votacao: e.target.value })} 
                    />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <Label className="text-xs text-muted-foreground">Local</Label>
                    <Input 
                      className="h-8 bg-black/40" 
                      value={form.local_votacao_nome} 
                      onChange={(e) => setForm({ ...form, local_votacao_nome: e.target.value })} 
                    />
                  </div>
                </div>

                {suggestions.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-white/5">
                    <Label className="text-[10px] text-muted-foreground uppercase font-bold">Sugestões de locais:</Label>
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
                          className="text-left p-2 rounded bg-black/20 hover:bg-black/40 border border-white/5 transition-colors text-xs"
                        >
                          <div className="font-medium text-white/80">{s.local_nome}</div>
                          <div className="text-[10px] text-muted-foreground">Zona {s.zona} • Seção {s.secao}</div>
                        </button>
                      ))}
                    </div>
                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setForm({
                            ...form,
                            zona_votacao: "",
                            secao_votacao: "",
                            local_votacao_nome: ""
                          });
                          setSuggestions([]);
                        }}
                        className="text-[10px] text-primary hover:underline font-medium"
                      >
                        Não voto em nenhum desses locais
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="md:col-span-2 rounded-md border border-white/10 bg-white/5 p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-primary" />
                  <h3 className="text-sm font-semibold text-primary">Situação Eleitoral</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Situação Eleitoral</Label>
                    <select 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={form.situacao_eleitoral}
                      onChange={(e) => setForm({ ...form, situacao_eleitoral: e.target.value })}
                    >
                      <option value="Não informado">Não informado</option>
                      <option value="Apto">Apto</option>
                      <option value="Inapto">Inapto</option>
                      <option value="Pendente de validação">Pendente de validação</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Título de Eleitor</Label>
                    <Input 
                      value={form.titulo_eleitor} 
                      onChange={(e) => setForm({ ...form, titulo_eleitor: e.target.value })} 
                      placeholder="Número do título"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Data da Consulta</Label>
                    <Input 
                      type="date" 
                      value={form.data_consulta_eleitoral} 
                      onChange={(e) => setForm({ ...form, data_consulta_eleitoral: e.target.value })} 
                    />
                  </div>

                  <div className="space-y-2 flex items-end">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-full gap-2"
                      onClick={() => window.open("https://www.tse.jus.br/servicos-eleitorais/autoatendimento-eleitoral", "_blank")}
                    >
                      <Target className="h-4 w-4" />
                      Consultar no TSE
                    </Button>
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <Label>Observações</Label>
                    <Input 
                      value={form.observacao_situacao_eleitoral} 
                      onChange={(e) => setForm({ ...form, observacao_situacao_eleitoral: e.target.value })} 
                      placeholder="Notas sobre a situação eleitoral"
                    />
                  </div>

                  <div className="md:col-span-2 flex items-center space-x-2">
                    <Checkbox 
                      id="eleitoral-validada" 
                      checked={form.situacao_eleitoral_validada}
                      onCheckedChange={(checked) => setForm({ ...form, situacao_eleitoral_validada: !!checked })}
                    />
                    <Label htmlFor="eleitoral-validada" className="text-sm font-medium cursor-pointer">
                      Validado pelo administrador
                    </Label>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground italic">
                  A consulta deve ser realizada no ambiente oficial da Justiça Eleitoral. Este sistema apenas registra a situação informada ou validada.
                </p>
              </div>

              <div className="md:col-span-2 flex items-start space-x-3 p-3 rounded-lg border border-primary/20 bg-primary/5">

                <Checkbox 
                  id="lgpd-lider" 
                  checked={form.lgpd_consent}
                  onCheckedChange={(checked) => setForm({ ...form, lgpd_consent: !!checked })}
                  className="mt-1"
                />
                <div className="grid gap-1.5 leading-none">
                  <Label 
                    htmlFor="lgpd-lider" 
                    className="text-sm font-medium leading-none cursor-pointer"
                  >
                    Consentimento LGPD
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    O líder declara estar ciente e de acordo em ceder seus dados pessoais conforme a Lei Geral de Proteção de Dados (LGPD).
                  </p>
                </div>
              </div>
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