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
  Webhook
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const [newInstanceName, setNewInstanceName] = useState("");
  const [newInstanceTech, setNewInstanceTech] = useState("evolution_go");
  const [selectedInstance, setSelectedInstance] = useState<any>(null);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [config, setConfig] = useState<any>({
    anti_ban_delay_min: 5,
    anti_ban_delay_max: 15,
    anti_ban_batch_size: 50,
    auto_responder_enabled: false,
    auto_responder_brain: ""
  });

  useEffect(() => {
    fetchInstances();
    // Set dynamic webhook URL based on project ID
    const projectId = window.location.hostname.split('.')[0];
    setWebhookUrl(`https://${projectId}.functions.supabase.co/whatsapp-webhook`);
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
      toast.error("Erro ao carregar configurações");
    } else {
      setConfig({
        instancia_id: instanceId,
        anti_ban_delay_min: 5,
        anti_ban_delay_max: 15,
        anti_ban_batch_size: 50,
        auto_responder_enabled: false,
        auto_responder_brain: ""
      });
    }
  };

  const createInstance = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    if (!newInstanceName) {
      toast.error("Informe um nome para a instância");
      return;
    }

    const { data, error } = await supabase
      .from("whatsapp_instancias")
      .insert([{ 
        nome: newInstanceName,
        status: "disconnected",
        tecnologia: newInstanceTech,
        owner_id: session.user.id
      }])
      .select()
      .single();

    if (error) {
      toast.error(`Erro ao criar instância: ${error.message}`);
    } else {
      toast.success("Instância criada com sucesso");
      setNewInstanceName("");
      fetchInstances();
      setSelectedInstance(data);
    }
  };

  const updateConfig = async () => {
    if (!selectedInstance) return;

    const { error } = await supabase
      .from("whatsapp_configuracoes")
      .upsert({
        instancia_id: selectedInstance.id,
        ...config
      });

    if (error) {
      toast.error("Erro ao salvar configurações");
    } else {
      toast.success("Configurações salvas");
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
            <Button onClick={createInstance} className="gap-2">
              <Plus className="h-4 w-4" /> Nova Instância
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1 bg-card/50 backdrop-blur-xl border-white/10">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" /> Instâncias
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-2">
            {instances.length === 0 ? (
              <p className="text-sm text-muted-foreground p-4 text-center">Nenhuma instância cadastrada.</p>
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
                      ? "bg-primary/10 border border-primary/20 text-primary" 
                      : "hover:bg-white/5 border border-transparent text-muted-foreground"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm">{inst.nome}</span>
                    <div className={`h-2 w-2 rounded-full ${inst.status === 'connected' ? 'bg-green-500' : 'bg-red-500'}`} />
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
            <Card className="h-64 flex items-center justify-center bg-card/50 border-white/10">
              <p className="text-muted-foreground">Selecione ou crie uma instância para começar.</p>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Card de Conexão e Webhook (Unificados) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-card/50 border-white/10">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-yellow-500" />
                      Status: {selectedInstance.nome}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center justify-center py-6 space-y-4">
                    {selectedInstance.status === 'connected' ? (
                      <div className="text-center space-y-3">
                        <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
                        <h3 className="font-bold">Conectado</h3>
                        <Button variant="outline" size="sm" className="text-red-500 border-red-500/20">
                          <Power className="h-4 w-4 mr-2" /> Desconectar
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center space-y-4 w-full">
                        <div className="h-40 w-40 bg-white/5 border border-dashed border-white/10 rounded-xl flex items-center justify-center mx-auto">
                          <RefreshCw className="h-8 w-8 text-muted-foreground animate-spin" />
                        </div>
                        <div className="flex gap-2 justify-center">
                          <Button variant="outline" size="sm" onClick={fetchInstances}>
                            <RefreshCw className="h-3 w-3 mr-1" /> Atualizar
                          </Button>
                          <Button variant="destructive" size="sm" onClick={deleteInstance}>
                            <Trash2 className="h-3 w-3 mr-1" /> Excluir
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-card/50 border-white/10">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Webhook className="h-5 w-5 text-blue-500" />
                      Webhook de Recebimento
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-xs text-muted-foreground">
                      Configure esta URL na sua Evolution API para receber mensagens em tempo real.
                    </p>
                    <div className="flex gap-2">
                      <Input value={webhookUrl} readOnly className="bg-black/20 text-xs font-mono" />
                      <Button variant="outline" size="icon" onClick={() => {
                        navigator.clipboard.writeText(webhookUrl);
                        toast.success("Copiado!");
                      }}>
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-[10px] bg-blue-500/10 p-2 rounded border border-blue-500/20 text-blue-400">
                      <strong>Eventos recomendados:</strong> messages.upsert, connection.update
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Seção Anti-Ban e Cérebro IA (Lado a Lado) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-card/50 border-white/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-orange-500" /> Anti-Banimento
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-2">
                    <div className="space-y-3">
                      <div className="flex justify-between text-xs">
                        <Label>Intervalo (seg)</Label>
                        <span className="text-primary">{config.anti_ban_delay_min}s - {config.anti_ban_delay_max}s</span>
                      </div>
                      <Slider 
                        value={[config.anti_ban_delay_min]} 
                        min={1} max={30} step={1}
                        onValueChange={(val) => setConfig({...config, anti_ban_delay_min: val[0]})}
                      />
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between text-xs">
                        <Label>Lote de Envio</Label>
                        <span className="text-primary">{config.anti_ban_batch_size} msg</span>
                      </div>
                      <Slider 
                        value={[config.anti_ban_batch_size]} 
                        min={10} max={200} step={10}
                        onValueChange={(val) => setConfig({...config, anti_ban_batch_size: val[0]})}
                      />
                    </div>
                    <Button onClick={updateConfig} size="sm" className="w-full">Salvar Anti-Ban</Button>
                  </CardContent>
                </Card>

                <Card className="bg-card/50 border-white/10">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Bot className="h-4 w-4 text-primary" /> Cérebro IA
                      </CardTitle>
                      <Switch 
                        checked={config.auto_responder_enabled}
                        onCheckedChange={(val) => setConfig({...config, auto_responder_enabled: val})}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-2">
                    <Textarea 
                      placeholder="Personalidade do robô..." 
                      className="min-h-[100px] text-xs bg-white/5"
                      value={config.auto_responder_brain || ""}
                      onChange={(e) => setConfig({...config, auto_responder_brain: e.target.value})}
                    />
                    <div className="flex justify-between items-center text-xs">
                      <span>Limite Diário</span>
                      <span className="font-mono text-primary">{config.auto_responder_limit_per_contact || 10}</span>
                    </div>
                    <Slider 
                      value={[config.auto_responder_limit_per_contact || 10]} 
                      min={1} max={50} step={1}
                      onValueChange={(val) => setConfig({...config, auto_responder_limit_per_contact: val[0]})}
                    />
                    <Button onClick={updateConfig} size="sm" className="w-full">Salvar Cérebro</Button>
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
