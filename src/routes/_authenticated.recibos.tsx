import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileText, Plus, Printer, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/recibos")({
  component: RecibosPage,
});

function RecibosPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [candidato, setCandidato] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const [form, setForm] = useState({
    pagador_nome: "", pagador_cpf: "", valor: "", descricao: "",
    forma_pagamento: "Transferência bancária",
    data_emissao: new Date().toISOString().slice(0, 10),
  });

  async function refresh() {
    const { data } = await supabase.from("recibos").select("*").order("numero", { ascending: false });
    setRows(data ?? []);
    const { data: c } = await supabase.from("candidato").select("*").eq("id", 1).maybeSingle();
    setCandidato(c);
  }

  useEffect(() => { (async () => { await refresh(); setLoading(false); })(); }, []);

  async function handleSave() {
    if (!form.pagador_nome || !form.valor) return toast.error("Preencha pagador e valor");
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("recibos").insert({
      pagador_nome: form.pagador_nome,
      pagador_cpf: form.pagador_cpf || null,
      valor: Number(form.valor),
      descricao: form.descricao || null,
      forma_pagamento: form.forma_pagamento || null,
      data_emissao: form.data_emissao,
      emitido_por: user?.id ?? null,
    });
    setSaving(false);
    if (error) return toast.error("Erro: " + error.message);
    toast.success("Recibo criado");
    setOpen(false);
    setForm({ ...form, pagador_nome: "", pagador_cpf: "", valor: "", descricao: "" });
    void refresh();
  }

  if (loading) return <div className="flex items-center justify-center p-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recibos de Pagamento</h1>
          <p className="text-muted-foreground text-sm">Emissão de recibos com dados fixos do candidato.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Novo recibo</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo recibo</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5"><Label>Pagador</Label><Input value={form.pagador_nome} onChange={e => setForm({ ...form, pagador_nome: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>CPF</Label><Input value={form.pagador_cpf} onChange={e => setForm({ ...form, pagador_cpf: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Valor (R$)</Label><Input type="number" step="0.01" value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Data</Label><Input type="date" value={form.data_emissao} onChange={e => setForm({ ...form, data_emissao: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Forma de pagamento</Label><Input value={form.forma_pagamento} onChange={e => setForm({ ...form, forma_pagamento: e.target.value })} /></div>
              </div>
              <div className="space-y-1.5"><Label>Descrição</Label><Textarea value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} /></div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button onClick={handleSave} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Salvar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {(!candidato?.nome_completo) && (
        <Card className="p-4 bg-amber-500/10 border-amber-500/30 text-amber-200 text-sm">
          Cadastro do candidato ainda incompleto. Preencha em <strong>Cadastro do Candidato</strong> para que apareça como emissor nos recibos.
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="bg-card/60 backdrop-blur-xl border-white/5 divide-y divide-white/5">
          {rows.length === 0 && <div className="p-6 text-sm text-muted-foreground">Nenhum recibo emitido ainda.</div>}
          {rows.map(r => (
            <button key={r.id} onClick={() => setPreview(r)} className="w-full p-4 flex items-center justify-between text-left hover:bg-white/5">
              <div>
                <p className="font-medium">Recibo nº {r.numero} — {r.pagador_nome}</p>
                <p className="text-xs text-muted-foreground">{new Date(r.data_emissao).toLocaleDateString()} • R$ {Number(r.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
              </div>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </button>
          ))}
        </Card>

        <Card className="p-6 bg-card/60 backdrop-blur-xl border-white/5 min-h-[400px]">
          {!preview ? (
            <div className="text-center text-muted-foreground py-12">Selecione um recibo para visualizar.</div>
          ) : (
            <ReciboPreview recibo={preview} candidato={candidato} />
          )}
        </Card>
      </div>
    </div>
  );
}

function ReciboPreview({ recibo, candidato }: { recibo: any; candidato: any }) {
  function valorPorExtenso(v: number) {
    return `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
  }
  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="outline" onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-2" />Imprimir
        </Button>
      </div>
      <div className="bg-white text-black p-8 rounded shadow-inner font-serif">
        <h2 className="text-center text-xl font-bold uppercase underline mb-6">Recibo nº {recibo.numero}</h2>
        <p className="mb-4">
          Recebi de <strong>{recibo.pagador_nome}</strong>
          {recibo.pagador_cpf && `, CPF ${recibo.pagador_cpf}`},
          a importância de <strong>{valorPorExtenso(Number(recibo.valor))}</strong>
          {recibo.forma_pagamento && ` por meio de ${recibo.forma_pagamento.toLowerCase()}`},
          referente a {recibo.descricao || "serviços prestados à campanha eleitoral"}.
        </p>
        <p className="mb-12 italic text-sm text-black/60 text-center border border-dashed border-black/10 p-3">
          [ Layout final será aplicado quando o modelo oficial for enviado ]
        </p>
        <p className="mb-16 text-right">Data: {new Date(recibo.data_emissao).toLocaleDateString("pt-BR")}</p>
        <div className="text-center">
          <div className="border-t border-black w-2/3 mx-auto mb-1"></div>
          <p className="text-xs uppercase">{candidato?.nome_completo || "Candidato"}</p>
          {candidato?.cpf && <p className="text-xs">CPF: {candidato.cpf}</p>}
          {candidato?.cargo_pretendido && <p className="text-xs">{candidato.cargo_pretendido}{candidato.partido_sigla ? ` • ${candidato.partido_sigla}` : ""}</p>}
        </div>
      </div>
    </div>
  );
}
