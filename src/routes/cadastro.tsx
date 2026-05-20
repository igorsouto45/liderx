import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Shield, CheckCircle2 } from "lucide-react";
import { onlyDigits, getLatLongFromCep } from "@/lib/utils";

export const Route = createFileRoute("/cadastro")({
  component: CadastroPublico,
});

function CadastroPublico() {
  const { ref } = useSearch({ from: "/cadastro" }) as { ref?: string };
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [leaderName, setLeaderName] = useState("");

  const [form, setForm] = useState({
    nome: "",
    telefone: "",
    data_nascimento: "",
    cep: "",
    endereco: "",
    bairro: "",
    cidade: "",
    uf: "",
    numero: "",
    complemento: "",
    lgpd_consent: false,
  });

  useEffect(() => {
    if (ref) {
      const fetchLeader = async () => {
        const { data } = await supabase
          .from("perfis")
          .select("nome")
          .eq("id", ref)
          .single();
        if (data) setLeaderName(data.nome);
      };
      fetchLeader();
    }
  }, [ref]);

  const handleCepBlur = async () => {
    const cep = onlyDigits(form.cep);
    if (cep.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`).then(r => r.json());
      if (!res.erro) {
        setForm(f => ({
          ...f,
          endereco: res.logradouro,
          bairro: res.bairro,
          cidade: res.localidade,
          uf: res.uf,
        }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.lgpd_consent) return toast.error("Aceite os termos da LGPD");
    
    setLoading(true);
    try {
      const coords = await getLatLongFromCep(form.cep, form.endereco, form.bairro, form.cidade);
      
      const cleanPhone = onlyDigits(form.telefone);
      
      // Check for duplicate telephone
      const { data: existing } = await supabase
        .from("eleitores")
        .select("id, nome")
        .eq("telefone", cleanPhone)
        .maybeSingle();

      if (existing) {
        setLoading(false);
        return toast.error("Este telefone já possui um cadastro realizado.");
      }

      const { error } = await supabase.from("eleitores").insert({
        nome: form.nome,
        telefone: cleanPhone,
        data_nascimento: form.data_nascimento,
        cep: onlyDigits(form.cep),
        endereco: form.endereco,
        bairro: form.bairro,
        cidade: form.cidade,
        uf: form.uf,
        numero: form.numero,
        complemento: form.complemento,
        origem_usuario_id: ref || null,
        lgpd_consent: form.lgpd_consent,
        status: "indeciso",
        latitude: coords?.lat,
        longitude: coords?.lng,
      });

      if (error) throw error;
      setSuccess(true);
      toast.success("Cadastro realizado com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao cadastrar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8 space-y-6">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
              <CheckCircle2 className="h-10 w-10" />
            </div>
          </div>
          <h2 className="text-2xl font-bold">Obrigado por se cadastrar!</h2>
          <p className="text-muted-foreground">
            Suas informações foram recebidas com sucesso. Sua participação é fundamental para nossa jornada.
          </p>
          <Button className="w-full" onClick={() => window.location.reload()}>Fazer novo cadastro</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
              <Shield className="h-7 w-7 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Cadastro de Apoiador</h1>
          {leaderName && (
            <p className="text-primary font-medium">Indicado por: {leaderName}</p>
          )}
          <p className="text-muted-foreground">Preencha os dados abaixo para se unir à nossa causa.</p>
        </div>

        <Card className="border-white/5 bg-card/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-lg">Informações Pessoais</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nome Completo</Label>
                <Input 
                  required 
                  value={form.nome} 
                  onChange={e => setForm({...form, nome: e.target.value})} 
                  placeholder="Seu nome completo"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>WhatsApp</Label>
                  <Input 
                    required 
                    value={form.telefone} 
                    onChange={e => setForm({...form, telefone: e.target.value})} 
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data de Nascimento</Label>
                  <Input 
                    type="date" 
                    required 
                    value={form.data_nascimento} 
                    onChange={e => setForm({...form, data_nascimento: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>CEP</Label>
                <Input 
                  required 
                  value={form.cep} 
                  onChange={e => setForm({...form, cep: e.target.value})} 
                  onBlur={handleCepBlur}
                  placeholder="00000-000"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Endereço</Label>
                  <Input value={form.endereco} onChange={e => setForm({...form, endereco: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Número</Label>
                  <Input value={form.numero} onChange={e => setForm({...form, numero: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Bairro</Label>
                  <Input value={form.bairro} onChange={e => setForm({...form, bairro: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Cidade</Label>
                  <Input value={form.cidade} onChange={e => setForm({...form, cidade: e.target.value})} />
                </div>
              </div>

              <div className="flex items-start space-x-3 pt-4">
                <Checkbox 
                  id="lgpd" 
                  checked={form.lgpd_consent} 
                  onCheckedChange={checked => setForm({...form, lgpd_consent: !!checked})} 
                />
                <div className="grid gap-1.5 leading-none">
                  <label htmlFor="lgpd" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Aceito os termos da LGPD
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Autorizo o uso dos meus dados para fins de comunicação da campanha.
                  </p>
                </div>
              </div>

              <Button type="submit" className="w-full h-12 text-lg shadow-lg shadow-primary/20" disabled={loading}>
                {loading ? "Processando..." : "Confirmar Apoio"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
