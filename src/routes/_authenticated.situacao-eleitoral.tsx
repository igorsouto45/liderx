import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, AlertCircle, CheckCircle2, XCircle, Clock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/situacao-eleitoral")({
  component: SituacaoEleitoral,
});

function SituacaoEleitoral() {
  const { data: liderancas, isLoading } = useQuery({
    queryKey: ["liderancas-eleitoral"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("liderancas")
        .select("*");
      if (error) throw error;
      return data;
    },
  });

  const stats = {
    total: liderancas?.length || 0,
    apto: liderancas?.filter(l => l.situacao_eleitoral === "Apto").length || 0,
    inapto: liderancas?.filter(l => l.situacao_eleitoral === "Inapto").length || 0,
    pendente: liderancas?.filter(l => l.situacao_eleitoral === "Pendente de validação").length || 0,
    naoInformado: liderancas?.filter(l => l.situacao_eleitoral === "Não informado" || !l.situacao_eleitoral).length || 0,
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "Apto": return <Badge className="bg-green-500">Apto</Badge>;
      case "Inapto": return <Badge className="bg-red-500">Inapto</Badge>;
      case "Pendente de validação": return <Badge className="bg-yellow-500 text-black">Pendente</Badge>;
      default: return <Badge variant="secondary">Não informado</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Situação Eleitoral</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Total</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{stats.total}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-green-500">Aptos</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{stats.apto}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-red-500">Inaptos</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{stats.inapto}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-yellow-500">Pendentes</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{stats.pendente}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Não Inf.</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{stats.naoInformado}</CardContent></Card>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Líder</TableHead>
              <TableHead>CPF</TableHead>
              <TableHead>Município</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead>Validação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={5}>Carregando...</TableCell></TableRow> : liderancas?.map(l => (
              <TableRow key={l.id}>
                <TableCell className="font-medium">{l.nome}</TableCell>
                <TableCell>{l.cpf || "---"}</TableCell>
                <TableCell>{l.cidade || "---"}</TableCell>
                <TableCell>{getStatusBadge(l.situacao_eleitoral)}</TableCell>
                <TableCell>{l.situacao_eleitoral_validada ? <CheckCircle2 className="text-green-500 h-5 w-5" /> : <XCircle className="text-red-500 h-5 w-5" />}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
