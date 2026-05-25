import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { 
  MessageCircle, 
  Settings, 
  Zap, 
  Bot, 
  ShieldAlert, 
  Smartphone,
  Plus,
  RefreshCw,
  Power,
  Trash2,
  CheckCircle2,
  Webhook,
  Copy,
  ExternalLink
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/whatsapp")({
  component: WhatsAppPage,
});

function WhatsAppPage() {
  const [instances, setInstances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newInstanceName, setNewInstanceName] = useState("");
  const [newInstanceTech, setNewInstanceTech] = useState("evolution_go");
  const [selectedInstance, setSelectedInstance] = useState<any>(null);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [config, setConfig] = useState<any>({
    anti_ban_delay_min: 5,
    anti_ban_delay_max: 15,
    anti_ban_batch_size: 50,
    auto_responder_enabled: false,
    auto_responder_brain: "",
    auto_responder_limit_per_contact: 10
  });

  useEffect(() => {
    fetchInstances();
    
    // Set dynamic webhook URL based on Supabase URL
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (supabaseUrl) {
      setWebhookUrl(`${supabaseUrl}/functions/v1/whatsapp-webhook`);
    } else {
      const projectId = window.location.hostname.split('.')[0];
      setWebhookUrl(`https://${projectId}.functions.supabase.co/whatsapp-webhook`);
    }
  }, []);

  const fetchInstances = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      toast.error("Sessão não encontrada");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("whatsapp_instancias")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar instâncias:", error);
      toast.error("Erro ao carregar instâncias");
    } else {
      setInstances(data || []);
      if (data && data.length > 0 && !selectedInstance) {
        setSelectedInstance(data[0]);
        fetchConfig(data[0].id);
      }
    }
    setLoading(false);
  };

  const fetchConfig = async (instanceId: string) => {
    const { data, error } = await supabase
      .from("whatsapp_configuracoes")
      .select("*")
      .eq("instancia_id", instanceId)
      .maybeSingle();

    if (data) {
      setConfig(data);
    } else if (error) {
      console.error("Erro ao buscar config:", error);
    } else {
      setConfig({
        instancia_id: instanceId,
        anti_ban_delay_min: 5,
        anti_ban_delay_max: 15,
        anti_ban_batch_size: 50,
        auto_responder_enabled: false,
        auto_responder_brain: "",
        auto_responder_limit_per_contact: 10
      });
    }
  };

  const createInstance = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    if (!newInstanceName.trim()) {
      toast.error("Informe um nome para a instância");
      return;
    }

    setCreating(true);
    try {
      const { data, error } = await supabase
        .from("whatsapp_instancias")
        .insert([{ 
          nome: newInstanceName.trim(),
          status: "disconnected",
          tecnologia: newInstanceTech,
          owner_id: session.user.id
        }])
        .select()
        .single();

      if (error) {
        toast.error(`Erro ao criar instância: ${error.message}`);
      } else if (data) {
        toast.success("Instância criada com sucesso");
        setNewInstanceName("");
        await fetchInstances();
        setSelectedInstance(data);
        await fetchConfig(data.id);
      }
    } catch (err) {
      toast.error("Erro ao criar instância");
    } finally {
      setCreating(false);
    }
  };

  const updateConfig = async () => {
    if (!selectedInstance) return;

    const { error } = await supabase
      .from("whatsapp_configuracoes")
      .upsert({
        instancia_id: selectedInstance.id,
        ...config
      }, { onConflict: 'instancia_id' });

    if (error) {
      toast.error("Erro ao salvar configurações");
    } else {
      toast.success("Configurações salvas");
      fetchConfig(selectedInstance.id);
    }
  };

  const deleteInstance = async () => {
    if (!selectedInstance) return;
    if (!confirm(`Deseja realmente excluir a instância ${selectedInstance.nome}?`)) return;

    const { error } = await supabase
      .from("whatsapp_instancias")
      .delete()
      .eq("id", selectedInstance.id);

    if (error) {
      toast.error("Erro ao excluir instância");
    } else {
      toast.success("Instância excluída");
      setSelectedInstance(null);
      fetchInstances();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">WhatsApp (Evolution GO)</h1>
          <p className="text-muted-foreground">Gerencie suas conexões Baileys, automações e cérebro do Líder-X.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <select 
            className="bg-background border border-white/10 rounded-md px-3 py-2 text-sm"
            value={newInstanceTech}
            onChange={(e) => setNewInstanceTech(e.target.value)}
          >
            <option value="evolution_go">Evolution GO (Baileys)</option>
            <option value="evolution_api">Evolution API (v2)</option>
          </select>
          <div className="flex gap-2">
            <Input 
              placeholder="Nome da instância" 
              value={newInstanceName}
              onChange={(e) => setNewInstanceName(e.target.value)}
              className="w-full md:w-64"
            />
            <Button onClick={createInstance} disabled={creating} className="gap-2">
              {creating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Nova Instância
            </Button>
          </div>
        </div>
      </div>

      {/* Webhook Section - Always visible */}
      <Card className="bg-card/50 border-white/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Webhook className="h-5 w-5 text-blue-500" />
            Configuração do Webhook
          </CardTitle>
          <CardDescription>
            Configure esta URL na sua Evolution API para receber eventos em tempo real.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input value={webhookUrl} readOnly className="bg-black/20 font-mono text-sm" />
            <Button variant="outline" size="icon" onClick={() => {
              navigator.clipboard.writeText(webhookUrl);
              toast.success("URL copiada!");
            }}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-xs bg-blue-500/10 p-3 rounded-lg border border-blue-500/20 text-blue-400 flex items-start gap-2">
            <Zap className="h-4 w-4 mt-0.5 shrink-0" />
            <div>
              <strong>Eventos recomendados:</strong> Marque <strong>MESSAGES_UPSERT</strong> e <strong>CONNECTION_UPDATE</strong> na sua instância da Evolution API.
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1 bg-card/50 backdrop-blur-xl border-white/10 h-fit">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" /> Instâncias
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-2">
            {loading ? (
              <div className="p-4 flex justify-center">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : instances.length === 0 ? (
              <p className="text-sm text-muted-foreground p-4 text-center italic">Nenhuma instância cadastrada.</p>
            ) : (
              instances.map((inst) => (
                <button
                  key={inst.id}
                  onClick={() => {
                    setSelectedInstance(inst);
                    fetchConfig(inst.id);
                  }}
                  className={`w-full text-left p-3 rounded-xl transition-all ${
                    selectedInstance?.id === inst.id 
                      ? "bg-primary/10 border border-primary/20 text-primary shadow-[inset_0_0_20px_rgba(108,43,217,0.05)]" 
                      : "hover:bg-white/5 border border-transparent text-muted-foreground"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm truncate">{inst.nome}</span>
                    <div className={`h-2 w-2 rounded-full ${inst.status === 'connected' ? 'bg-green-500' : 'bg-red-500'} shadow-[0_0_8px_rgba(34,197,94,0.5)]`} />
                  </div>
                  <div className="flex items-center justify-between opacity-70">
                    <span className="text-[10px] uppercase tracking-tighter">{inst.status}</span>
                    <span className="text-[10px] bg-white/10 px-1.5 rounded uppercase">{inst.tecnologia === 'evolution_go' ? 'GO' : 'API'}</span>
                  </div>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-3 space-y-6">
          {!selectedInstance ? (
            <Card className="h-64 flex flex-col items-center justify-center bg-card/50 border-white/10 border-dashed">
              <MessageCircle className="h-12 w-12 text-muted-foreground/20 mb-4" />
              <p className="text-muted-foreground">Selecione uma instância ao lado ou crie uma nova.</p>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Status and Actions */}
              <Card className="bg-card/50 border-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    Status da Conexão: {selectedInstance.nome}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-6 space-y-6">
                  {selectedInstance.status === 'connected' ? (
                    <div className="text-center space-y-3">
                      <div className="h-20 w-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-2 border border-green-500/20">
                        <CheckCircle2 className="h-10 w-10 text-green-500" />
                      </div>
                      <h3 className="font-bold text-lg">Conectado com Sucesso</h3>
                      <Button variant="outline" size="sm" className="text-red-500 border-red-500/20 hover:bg-red-500/10">
                        <Power className="h-4 w-4 mr-2" /> Desconectar
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center space-y-6 w-full">
                      <div className="h-48 w-48 bg-white/5 border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center mx-auto group hover:border-primary/50 transition-colors">
                        <RefreshCw className="h-10 w-10 text-muted-foreground animate-spin mb-4" />
                        <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">Aguardando QR Code...</span>
                      </div>
                      <div className="flex gap-3 justify-center">
                        <Button variant="outline" size="sm" onClick={fetchInstances} className="gap-2">
                          <RefreshCw className="h-4 w-4" /> Atualizar Status
                        </Button>
                        <Button variant="destructive" size="sm" onClick={deleteInstance} className="gap-2">
                          <Trash2 className="h-4 w-4" /> Excluir Instância
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Anti-Ban and Brain Settings (Lado a Lado) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-card/50 border-white/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ShieldAlert className="h-5 w-5 text-orange-500" /> Configurações Anti-Banimento
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-8 pt-4">
                    <div className="space-y-4">
                      <div className="flex justify-between text-sm">
                        <Label className="text-muted-foreground">Intervalo entre Mensagens</Label>
                        <span className="text-primary font-mono bg-primary/10 px-2 py-0.5 rounded">{config.anti_ban_delay_min}s - {config.anti_ban_delay_max}s</span>
                      </div>
                      <Slider 
                        value={[config.anti_ban_delay_min]} 
                        min={1} max={30} step={1}
                        onValueChange={(val) => setConfig({...config, anti_ban_delay_min: val[0]})}
                      />
                      <p className="text-[10px] text-muted-foreground italic">Recomendado: entre 5 e 15 segundos para evitar bloqueios.</p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between text-sm">
                        <Label className="text-muted-foreground">Tamanho do Lote de Envio</Label>
                        <span className="text-primary font-mono bg-primary/10 px-2 py-0.5 rounded">{config.anti_ban_batch_size} mensagens</span>
                      </div>
                      <Slider 
                        value={[config.anti_ban_batch_size]} 
                        min={10} max={200} step={10}
                        onValueChange={(val) => setConfig({...config, anti_ban_batch_size: val[0]})}
                      />
                    </div>
                    <Button onClick={updateConfig} className="w-full shadow-lg shadow-primary/10">Salvar Anti-Ban</Button>
                  </CardContent>
                </Card>

                <Card className="bg-card/50 border-white/10">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Bot className="h-5 w-5 text-primary" /> Cérebro do Lider-X (Auto-Responder)
                      </CardTitle>
                      <Switch 
                        checked={config.auto_responder_enabled}
                        onCheckedChange={(val) => setConfig({...config, auto_responder_enabled: val})}
                        className="data-[state=checked]:bg-primary"
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-4">
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Personalidade e Conhecimento</Label>
                      <Textarea 
                        placeholder="Ex: Você é o assistente virtual do candidato João Silva. Seja cordial, responda sobre as propostas de saúde e educação..." 
                        className="min-h-[120px] text-sm bg-black/20 focus:ring-primary/50"
                        value={config.auto_responder_brain || ""}
                        onChange={(e) => setConfig({...config, auto_responder_brain: e.target.value})}
                      />
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between text-sm">
                        <Label className="text-muted-foreground">Limite de Respostas/Contato</Label>
                        <span className="font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">{config.auto_responder_limit_per_contact || 10}</span>
                      </div>
                      <Slider 
                        value={[config.auto_responder_limit_per_contact || 10]} 
                        min={1} max={50} step={1}
                        onValueChange={(val) => setConfig({...config, auto_responder_limit_per_contact: val[0]})}
                      />
                    </div>
                    <Button onClick={updateConfig} className="w-full shadow-lg shadow-primary/10">Salvar Cérebro</Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
