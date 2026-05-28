import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Search, 
  Filter, 
  FileCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Target, 
  FileText, 
  History, 
  Download, 
  Eye, 
  Check, 
  X,
  Loader2,
  Upload
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/situacao-eleitoral")({
  component: SituacaoEleitoral,
});

type ElectoralStatus = "Não informado" | "Apto" | "Inapto" | "Pendente de validação";

function SituacaoEleitoral() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedLider, setSelectedLider] = useState<any>(null);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLiderId, setHistoryLiderId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Form state for update
  const [form, setForm] = useState({
    situacao: "Não informado" as ElectoralStatus,
    dataConsulta: "",
    observacao: "",
    validada: false,
    tituloEleitor: ""
  });

  const { data: profile } = useQuery({
    queryKey: ["perfil-atual"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;
      const { data } = await supabase.from("perfis").select("*").eq("id", session.user.id).single();
      return data;
    }
  });

  const { data: liderancas, isLoading } = useQuery({
    queryKey: ["liderancas-eleitoral"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("liderancas")
        .select("*")
        .order("nome");
      if (error) throw error;
      return data;
    },
  });

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ["electoral-history", historyLiderId],
    queryFn: async () => {
      if (!historyLiderId) return [];
      const { data, error } = await supabase
        .from("historico_situacao_eleitoral")
        .select(`
          *,
          perfis:usuario_id (nome)
        `)
        .eq("lider_id", historyLiderId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!historyLiderId
  });

  const stats = useMemo(() => {
    if (!liderancas) return { total: 0, apto: 0, inapto: 0, pendente: 0, naoInformado: 0, pctApto: 0 };
    const total = liderancas.length;
    const apto = liderancas.filter(l => l.situacao_eleitoral === "Apto").length;
    const inapto = liderancas.filter(l => l.situacao_eleitoral === "Inapto").length;
    const pendente = liderancas.filter(l => l.situacao_eleitoral === "Pendente de validação").length;
    const naoInformado = liderancas.filter(l => l.situacao_eleitoral === "Não informado" || !l.situacao_eleitoral).length;
    const pctApto = total > 0 ? (apto / total) * 100 : 0;
    return { total, apto, inapto, pendente, naoInformado, pctApto };
  }, [liderancas]);

  const filteredLiderancas = useMemo(() => {
    if (!liderancas) return [];
    return liderancas.filter(l => {
      const matchesSearch = l.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           (l.cpf && l.cpf.includes(searchTerm)) ||
                           (l.titulo_eleitor && l.titulo_eleitor.includes(searchTerm));
      const matchesStatus = statusFilter === "all" || l.situacao_eleitoral === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [liderancas, searchTerm, statusFilter]);

  const updateMutation = useMutation({
    mutationFn: async (vars: any) => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Update leader
      const { error: updateError } = await supabase
        .from("liderancas")
        .update({
          situacao_eleitoral: vars.situacao,
          data_consulta_eleitoral: vars.dataConsulta || null,
          observacao_situacao_eleitoral: vars.observacao,
          situacao_eleitoral_validada: vars.validada,
          titulo_eleitor: vars.tituloEleitor,
          data_validacao_eleitoral: vars.validada ? new Date().toISOString() : null,
          usuario_validacao_eleitoral: vars.validada ? session?.user.id : null
        })
        .eq("id", selectedLider.id);

      if (updateError) throw updateError;

      // Insert history
      const { error: historyError } = await supabase
        .from("historico_situacao_eleitoral")
        .insert({
          lider_id: selectedLider.id,
          situacao_anterior: selectedLider.situacao_eleitoral,
          situacao_nova: vars.situacao,
          usuario_id: session?.user.id,
          observacao: vars.observacao
        });

      if (historyError) throw historyError;
    },
    onSuccess: () => {
      toast.success("Situação eleitoral atualizada!");
      queryClient.invalidateQueries({ queryKey: ["liderancas-eleitoral"] });
      setUpdateOpen(false);
    },
    onError: (error) => {
      toast.error("Erro ao atualizar: " + error.message);
    }
  });

  const handleUpdateClick = (lider: any) => {
    setSelectedLider(lider);
    setForm({
      situacao: (lider.situacao_eleitoral as ElectoralStatus) || "Não informado",
      dataConsulta: lider.data_consulta_eleitoral ? new Date(lider.data_consulta_eleitoral).toISOString().split('T')[0] : "",
      observacao: lider.observacao_situacao_eleitoral || "",
      validada: lider.situacao_eleitoral_validada || false,
      tituloEleitor: lider.titulo_eleitor || ""
    });
    setUpdateOpen(true);
  };

  const handleUploadProof = async (e: React.ChangeEvent<HTMLInputElement>, liderId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${liderId}/${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('comprovantes-eleitorais')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from("liderancas")
        .update({
          comprovante_situacao_eleitoral: filePath
        })
        .eq("id", liderId);

      if (updateError) throw updateError;

      toast.success("Comprovante enviado!");
      queryClient.invalidateQueries({ queryKey: ["liderancas-eleitoral"] });
    } catch (error: any) {
      toast.error("Erro no upload: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleViewProof = async (filePath: string) => {
    const { data } = supabase.storage
      .from('comprovantes-eleitorais')
      .getPublicUrl(filePath);
    
    // If private, we need a signed URL
    const { data: signedData, error } = await supabase.storage
      .from('comprovantes-eleitorais')
      .createSignedUrl(filePath, 60);

    if (error) {
      toast.error("Erro ao abrir comprovante");
      return;
    }
    window.open(signedData.signedUrl, "_blank");
  };

  const exportToCSV = () => {
    if (!filteredLiderancas.length) return;
    
    const headers = ["Nome", "CPF", "Município", "Bairro", "Situação Eleitoral", "Data Consulta", "Validada", "Observação"];
    const rows = filteredLiderancas.map(l => [
      l.nome,
      l.cpf || "",
      l.cidade || "",
      l.bairro || "",
      l.situacao_eleitoral || "Não informado",
      l.data_consulta_eleitoral ? format(new Date(l.data_consulta_eleitoral), "dd/MM/yyyy") : "",

      l.situacao_eleitoral_validada ? "Sim" : "Não",
      l.observacao_situacao_eleitoral || ""
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `situacao_eleitoral_${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "Apto": return <Badge className="bg-green-500 hover:bg-green-600">Apto</Badge>;
      case "Inapto": return <Badge className="bg-red-500 hover:bg-red-600">Inapto</Badge>;
      case "Pendente de validação": return <Badge className="bg-yellow-500 text-black hover:bg-yellow-600">Pendente</Badge>;
      default: return <Badge variant="secondary">Não informado</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileCheck className="h-8 w-8 text-primary" /> Situação Eleitoral
          </h1>
          <p className="text-muted-foreground mt-1">Acompanhamento de regularidade dos líderes.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportToCSV} disabled={!filteredLiderancas.length}>
            <Download className="mr-2 h-4 w-4" /> Exportar CSV
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="bg-card/50 backdrop-blur-sm border-white/10">
          <CardHeader className="pb-2 p-4"><CardTitle className="text-xs font-medium text-muted-foreground uppercase">Total Líderes</CardTitle></CardHeader>
          <CardContent className="p-4 pt-0 text-2xl font-bold">{stats.total}</CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/20">
          <CardHeader className="pb-2 p-4"><CardTitle className="text-xs font-medium text-green-500 uppercase">Aptos</CardTitle></CardHeader>
          <CardContent className="p-4 pt-0 text-2xl font-bold text-green-500">{stats.apto}</CardContent>
        </Card>
        <Card className="bg-red-500/10 border-red-500/20">
          <CardHeader className="pb-2 p-4"><CardTitle className="text-xs font-medium text-red-500 uppercase">Inaptos</CardTitle></CardHeader>
          <CardContent className="p-4 pt-0 text-2xl font-bold text-red-500">{stats.inapto}</CardContent>
        </Card>
        <Card className="bg-yellow-500/10 border-yellow-500/20">
          <CardHeader className="pb-2 p-4"><CardTitle className="text-xs font-medium text-yellow-500 uppercase">Pendentes</CardTitle></CardHeader>
          <CardContent className="p-4 pt-0 text-2xl font-bold text-yellow-500">{stats.pendente}</CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur-sm border-white/10">
          <CardHeader className="pb-2 p-4"><CardTitle className="text-xs font-medium text-muted-foreground uppercase">Não Informado</CardTitle></CardHeader>
          <CardContent className="p-4 pt-0 text-2xl font-bold">{stats.naoInformado}</CardContent>
        </Card>
        <Card className="bg-primary/10 border-primary/20">
          <CardHeader className="pb-2 p-4"><CardTitle className="text-xs font-medium text-primary uppercase">% Aptos</CardTitle></CardHeader>
          <CardContent className="p-4 pt-0 text-2xl font-bold text-primary">{stats.pctApto.toFixed(1)}%</CardContent>
        </Card>
      </div>

      <Card className="border-white/10 bg-card/30 backdrop-blur-md">
        <CardHeader className="p-4 border-b border-white/5">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Nome, CPF ou Título..." 
                className="pl-9 h-10 bg-white/5 border-white/10" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select 
                className="h-10 px-3 py-2 rounded-md border border-white/10 bg-white/5 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Todas as situações</option>
                <option value="Apto">Apto</option>
                <option value="Inapto">Inapto</option>
                <option value="Pendente de validação">Pendente</option>
                <option value="Não informado">Não informado</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="border-white/5">
                  <TableHead>Líder</TableHead>
                  <TableHead>CPF / Título</TableHead>
                  <TableHead>Município / Bairro</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead>Última Verificação</TableHead>
                  <TableHead className="text-center">Validada</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></TableCell></TableRow>
                ) : filteredLiderancas.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground italic">Nenhum líder encontrado.</TableCell></TableRow>
                ) : (
                  filteredLiderancas.map(l => (
                    <TableRow key={l.id} className="border-white/5 hover:bg-white/5 transition-colors">
                      <TableCell className="font-bold py-4">
                        <div className="flex flex-col">
                          <span>{l.nome}</span>
                          <span className="text-[10px] text-muted-foreground font-normal">{l.id}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">
                          <p>CPF: {l.cpf || "---"}</p>
                          <p>Tít: {l.titulo_eleitor || "---"}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">
                          <p>{l.cidade || "---"}</p>
                          <p className="text-muted-foreground">{l.bairro || "---"}</p>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(l.situacao_eleitoral)}</TableCell>
                      <TableCell className="text-xs">
                        {l.data_consulta_eleitoral ? format(new Date(l.data_consulta_eleitoral), "dd/MM/yyyy") : "Nunca"}
                      </TableCell>
                      <TableCell className="text-center">
                        {l.situacao_eleitoral_validada ? (
                          <div className="flex flex-col items-center">
                            <CheckCircle2 className="text-green-500 h-5 w-5" />
                            <span className="text-[9px] text-green-500 uppercase font-bold mt-1">Validado</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center opacity-30">
                            <Clock className="text-muted-foreground h-5 w-5" />
                            <span className="text-[9px] uppercase font-bold mt-1">Pendente</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            title="Atualizar Situação"
                            onClick={() => handleUpdateClick(l)}
                          >
                            <Target className="h-4 w-4" />
                          </Button>
                          
                          <div className="relative">
                            <Input 
                              type="file" 
                              className="hidden" 
                              id={`upload-${l.id}`} 
                              onChange={(e) => handleUploadProof(e, l.id)}
                              disabled={uploading}
                            />
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              title="Anexar Comprovante"
                              asChild
                            >
                              <Label htmlFor={`upload-${l.id}`} className="cursor-pointer">
                                <Upload className="h-4 w-4" />
                              </Label>
                            </Button>
                          </div>

                          {l.comprovante_situacao_eleitoral && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              title="Ver Comprovante"
                              onClick={() => handleViewProof(l.comprovante_situacao_eleitoral)}
                            >
                              <FileText className="h-4 w-4 text-primary" />
                            </Button>
                          )}

                          <Button 
                            variant="ghost" 
                            size="icon" 
                            title="Histórico"
                            onClick={() => {
                              setHistoryLiderId(l.id);
                              setHistoryOpen(true);
                            }}
                          >
                            <History className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Update Modal */}
      <Dialog open={updateOpen} onOpenChange={setUpdateOpen}>
        <DialogContent className="bg-card/95 backdrop-blur-xl border-white/10">
          <DialogHeader>
            <DialogTitle>Atualizar Situação Eleitoral</DialogTitle>
            <DialogDescription>
              {selectedLider?.nome}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Situação Eleitoral</Label>
              <select 
                className="flex h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary"
                value={form.situacao}
                onChange={(e) => setForm({ ...form, situacao: e.target.value as ElectoralStatus })}
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
                value={form.tituloEleitor} 
                onChange={(e) => setForm({ ...form, tituloEleitor: e.target.value })} 
                className="bg-white/5 border-white/10"
              />
            </div>

            <div className="space-y-2">
              <Label>Data da Consulta</Label>
              <Input 
                type="date" 
                value={form.dataConsulta} 
                onChange={(e) => setForm({ ...form, dataConsulta: e.target.value })} 
                className="bg-white/5 border-white/10"
              />
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Input 
                value={form.observacao} 
                onChange={(e) => setForm({ ...form, observacao: e.target.value })} 
                placeholder="Ex: Consultas realizadas no site do TSE"
                className="bg-white/5 border-white/10"
              />
            </div>

            {(profile?.tipo === 'admin') && (
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox 
                  id="validada-modal" 
                  checked={form.validada}
                  onCheckedChange={(checked) => setForm({ ...form, validada: !!checked })}
                />
                <Label htmlFor="validada-modal" className="text-sm font-medium cursor-pointer">
                  Validar como administrador
                </Label>
              </div>
            )}
            
            <div className="pt-4 flex flex-col gap-2">
              <Button 
                variant="outline" 
                className="w-full gap-2 border-primary/20 hover:bg-primary/10"
                onClick={() => window.open("https://www.tse.jus.br/servicos-eleitorais/autoatendimento-eleitoral", "_blank")}
              >
                <Target className="h-4 w-4" />
                Abrir Site do TSE
              </Button>
              <p className="text-[10px] text-muted-foreground italic text-center">
                Realize a consulta manual no TSE e registre o resultado aqui.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdateOpen(false)}>Cancelar</Button>
            <Button 
              onClick={() => updateMutation.mutate(form)} 
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Modal */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-2xl bg-card/95 backdrop-blur-xl border-white/10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" /> Histórico de Alterações
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <ScrollArea className="h-[400px] pr-4">
              {historyLoading ? (
                <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : history?.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground italic">Nenhuma alteração registrada.</p>
              ) : (
                <div className="space-y-4">
                  {history?.map((h) => (
                    <div key={h.id} className="p-3 rounded-lg border border-white/5 bg-white/5 space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="flex gap-2 items-center">
                          <span className="text-xs text-muted-foreground">{h.situacao_anterior || "---"}</span>
                          <span className="text-muted-foreground">→</span>
                          {getStatusBadge(h.situacao_nova)}
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {format(new Date(h.created_at!), "dd/MM/yyyy HH:mm")}
                        </span>
                      </div>
                      <div className="text-xs">
                        <p className="text-muted-foreground font-medium">Alterado por: <span className="text-foreground">{(h as any).perfis?.nome || "Sistema"}</span></p>
                        {h.observacao && <p className="mt-1 bg-black/20 p-2 rounded italic">"{h.observacao}"</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
          <DialogFooter>
            <Button onClick={() => setHistoryOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const ScrollArea = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn("overflow-y-auto", className)}>{children}</div>
);
