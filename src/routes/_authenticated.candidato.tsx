import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Save, UserSquare2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/candidato")({
  component: CandidatoPage,
});

type CandidatoForm = {
  nome_completo: string;
  nome_urna: string;
  cnpj: string;
  rg: string;
  data_nascimento: string;
  nacionalidade: string;
  estado_civil: string;
  profissao: string;
  cargo_pretendido: string;
  partido_sigla: string;
  coligacao: string;
};

const EMPTY: CandidatoForm = {
  nome_completo: "", nome_urna: "", cnpj: "", rg: "", data_nascimento: "",
  nacionalidade: "Brasileiro(a)", estado_civil: "", profissao: "",
  cargo_pretendido: "", partido_sigla: "", coligacao: "",
};

function CandidatoPage() {
  const [form, setForm] = useState<CandidatoForm>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
        setIsAdmin(!!roles?.some(r => r.role === "admin"));
      }
      const { data } = await supabase.from("candidato").select("*").eq("id", 1).maybeSingle();
      if (data) {
        setForm({
          nome_completo: data.nome_completo ?? "",
          nome_urna: data.nome_urna ?? "",
          cpf: data.cpf ?? "",
          rg: data.rg ?? "",
          data_nascimento: data.data_nascimento ?? "",
          nacionalidade: data.nacionalidade ?? "Brasileiro(a)",
          estado_civil: data.estado_civil ?? "",
          profissao: data.profissao ?? "",
          cargo_pretendido: data.cargo_pretendido ?? "",
          partido_sigla: data.partido_sigla ?? "",
          coligacao: data.coligacao ?? "",
        });
      }
      setLoading(false);
    })();
  }, []);

  const set = (k: keyof CandidatoForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  async function handleSave() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const payload = {
      id: 1,
      ...form,
      data_nascimento: form.data_nascimento || null,
      updated_by: user?.id ?? null,
    };
    const { error } = await supabase.from("candidato").upsert(payload, { onConflict: "id" });
    setSaving(false);
    if (error) return toast.error("Erro ao salvar: " + error.message);
    toast.success("Cadastro do candidato atualizado");
  }

  if (loading) {
    return <div className="flex items-center justify-center p-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
          <UserSquare2 className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cadastro do Candidato</h1>
          <p className="text-muted-foreground text-sm">Dados fixos usados em contratos e recibos.</p>
        </div>
      </div>

      {!isAdmin && (
        <Card className="p-4 bg-amber-500/10 border-amber-500/30 text-amber-200 text-sm">
          Apenas administradores podem editar estes dados. Você pode visualizá-los abaixo.
        </Card>
      )}

      <Card className="p-6 space-y-6 bg-card/60 backdrop-blur-xl border-white/5">
        <section>
          <h2 className="text-sm font-semibold uppercase text-muted-foreground mb-3">Dados básicos</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Nome completo"><Input value={form.nome_completo} onChange={set("nome_completo")} disabled={!isAdmin} /></Field>
            <Field label="Nome de urna"><Input value={form.nome_urna} onChange={set("nome_urna")} disabled={!isAdmin} /></Field>
            <Field label="CPF"><Input value={form.cpf} onChange={set("cpf")} disabled={!isAdmin} /></Field>
            <Field label="RG"><Input value={form.rg} onChange={set("rg")} disabled={!isAdmin} /></Field>
            <Field label="Data de nascimento"><Input type="date" value={form.data_nascimento} onChange={set("data_nascimento")} disabled={!isAdmin} /></Field>
            <Field label="Nacionalidade"><Input value={form.nacionalidade} onChange={set("nacionalidade")} disabled={!isAdmin} /></Field>
            <Field label="Estado civil"><Input value={form.estado_civil} onChange={set("estado_civil")} disabled={!isAdmin} /></Field>
            <Field label="Profissão"><Input value={form.profissao} onChange={set("profissao")} disabled={!isAdmin} /></Field>
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold uppercase text-muted-foreground mb-3">Dados eleitorais</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Cargo pretendido"><Input value={form.cargo_pretendido} onChange={set("cargo_pretendido")} disabled={!isAdmin} /></Field>
            <Field label="Partido (sigla)"><Input value={form.partido_sigla} onChange={set("partido_sigla")} disabled={!isAdmin} /></Field>
            <Field label="Coligação"><Input value={form.coligacao} onChange={set("coligacao")} disabled={!isAdmin} /></Field>
          </div>
        </section>

        {isAdmin && (
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Salvar
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
