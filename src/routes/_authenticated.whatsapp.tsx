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
  const [newInstanceUrl, setNewInstanceUrl] = useState("");
  const [newInstanceKey, setNewInstanceKey] = useState("");
  const [newInstanceTech, setNewInstanceTech] = useState("evolution_go");
  const [selectedInstance, setSelectedInstance] = useState<any>(null);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [globalAntiBan, setGlobalAntiBan] = useState<any>({
    anti_ban_delay_min: 5,
    anti_ban_delay_max: 15,
    anti_ban_batch_size: 50
  });
  const [config, setConfig] = useState<any>({
    auto_responder_enabled: false,
    auto_responder_brain: "",
    auto_responder_limit_per_contact: 10
  });

  useEffect(() => {
    fetchInstances();
    fetchGlobalAntiBan();
    
    // Set dynamic webhook URL based on Supabase URL
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (supabaseUrl) {
      setWebhookUrl(`${supabaseUrl}/functions/v1/whatsapp-webhook`);
    } else {
      const projectId = window.location.hostname.split('.')[0];
      setWebhookUrl(`https://${projectId}.functions.supabase.co/whatsapp-webhook`);
    }
  }, []);

  const fetchGlobalAntiBan = async () => {
    // Buscamos a configuração anti-ban global (id 0 ou o primeiro registro sem instancia_id específico)
    const { data, error } = await supabase
      .from("whatsapp_configuracoes")
      .select("*")
      .is("instancia_id", null)
      .maybeSingle();

    if (data) {
      setGlobalAntiBan({
        anti_ban_delay_min: data.anti_ban_delay_min,
        anti_ban_delay_max: data.anti_ban_delay_max,
        anti_ban_batch_size: data.anti_ban_batch_size,
      });
    }
  };

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
      setConfig({
        auto_responder_enabled: data.auto_responder_enabled,
        auto_responder_brain: data.auto_responder_brain,
        auto_responder_limit_per_contact: data.auto_responder_limit_per_contact
      });
    } else {
      setConfig({
        auto_responder_enabled: false,
        auto_responder_brain: "",
        auto_responder_limit_per_contact: 10
      });
    }
  };

  const updateGlobalAntiBan = async () => {
    const { error } = await supabase
      .from("whatsapp_configuracoes")
      .upsert({
        id: '00000000-0000-0000-0000-000000000000', // ID fixo para global ou usar unique constraint
        instancia_id: null,
        ...globalAntiBan
      }, { onConflict: 'instancia_id' });

    if (error) {
      toast.error("Erro ao salvar anti-banimento global");
    } else {
      toast.success("Configuração Anti-Banimento salva globalmente");
    }
  };

  const createInstance = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    if (!newInstanceName.trim()) {
      toast.error("Informe um nome para a instância");
      return;
    }

    if (!newInstanceUrl.trim()) {
      toast.error("Informe a URL da instância");
      return;
    }

    if (!newInstanceKey.trim()) {
      toast.error("Informe a API Key da instância");
      return;
    }

    setCreating(true);
    try {
      const { data, error } = await supabase
        .from("whatsapp_instancias")
        .insert([{ 
          nome: newInstanceName.trim(),
          token: newInstanceUrl.trim(), // Storing URL in token field
          instancia_key: newInstanceKey.trim(), // Storing API Key
          status: "connected", // Mark as connected since it's already created externally
          tecnologia: newInstanceTech,
          owner_id: session.user.id
        }])
        .select()
        .single();

      if (error) {
        toast.error(`Erro ao adicionar instância: ${error.message}`);
      } else if (data) {
        toast.success("Instância adicionada com sucesso");
        setNewInstanceName("");
        setNewInstanceUrl("");
        setNewInstanceKey("");
        await fetchInstances();
        setSelectedInstance(data);
        await fetchConfig(data.id);
      }
    } catch (err) {
      toast.error("Erro ao adicionar instância");
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
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">WhatsApp (Evolution GO)</h1>
          <p className="text-muted-foreground">Gerencie suas conexões Baileys, automações e cérebro do Líder-X.</p>
        </div>
        
        <Card className="bg-card/50 border-white/10 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-muted-foreground">Nome</Label>
              <Input 
                placeholder="Ex: Minha Instância" 
                value={newInstanceName}
                onChange={(e) => setNewInstanceName(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1 lg:col-span-2">
              <Label className="text-[10px] uppercase text-muted-foreground">URL da Evolution API</Label>
              <Input 
                placeholder="https://sua-api.com" 
                value={newInstanceUrl}
                onChange={(e) => setNewInstanceUrl(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-muted-foreground">Global API Key</Label>
              <Input 
                placeholder="Key..." 
                type="password"
                value={newInstanceKey}
                onChange={(e) => setNewInstanceKey(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={createInstance} disabled={creating} className="w-full gap-2 h-9">
                {creating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Add Instância
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Seção Global - Sempre Visível */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Webhook Section */}
        <Card className="bg-card/50 border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Webhook className="h-5 w-5 text-blue-500" />
              Webhook
            </CardTitle>
            <CardDescription>
              URL para receber eventos da Evolution API.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input value={webhookUrl} readOnly className="bg-black/20 font-mono text-xs" />
              <Button variant="outline" size="icon" onClick={() => {
                navigator.clipboard.writeText(webhookUrl);
                toast.success("URL copiada!");
              }}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-[10px] bg-blue-500/10 p-2 rounded border border-blue-500/20 text-blue-400 flex items-start gap-2">
              <Zap className="h-3 w-3 mt-0.5 shrink-0" />
              <span>Marque <strong>MESSAGES_UPSERT</strong> e <strong>CONNECTION_UPDATE</strong> na Evolution.</span>
            </div>
          </CardContent>
        </Card>

        {/* Global Anti-Ban Section */}
        <Card className="bg-card/50 border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-orange-500" />
              Anti-Banimento Global
            </CardTitle>
            <CardDescription>
              Configurações aplicadas a todos os envios.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-[11px]">
                <Label className="text-muted-foreground">Delay: {globalAntiBan.anti_ban_delay_min}s - {globalAntiBan.anti_ban_delay_max}s</Label>
              </div>
              <Slider 
                value={[globalAntiBan.anti_ban_delay_min]} 
                min={1} max={30} step={1}
                onValueChange={(val) => setGlobalAntiBan({...globalAntiBan, anti_ban_delay_min: val[0]})}
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-[11px]">
                <Label className="text-muted-foreground">Lote: {globalAntiBan.anti_ban_batch_size} msg</Label>
              </div>
              <Slider 
                value={[globalAntiBan.anti_ban_batch_size]} 
                min={10} max={200} step={10}
                onValueChange={(val) => setGlobalAntiBan({...globalAntiBan, anti_ban_batch_size: val[0]})}
              />
            </div>
            <Button size="sm" onClick={updateGlobalAntiBan} className="w-full h-8 text-xs">Salvar Global</Button>
          </CardContent>
        </Card>
      </div>

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
                    <div className="text-center space-y-4 w-full px-4">
                      <div className="h-20 w-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-2 border border-green-500/20">
                        <CheckCircle2 className="h-10 w-10 text-green-500" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-bold text-lg">Conectado (Evolution GO)</h3>
                        <div className="bg-black/20 p-3 rounded-lg text-left space-y-2 border border-white/5">
                          <div className="flex flex-col">
                            <span className="text-[10px] text-muted-foreground uppercase">Endpoint</span>
                            <span className="text-xs font-mono break-all">{selectedInstance.token}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] text-muted-foreground uppercase">Instance Key</span>
                            <span className="text-xs font-mono">{selectedInstance.instancia_key?.substring(0, 8)}...</span>
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={deleteInstance} className="text-red-500 border-red-500/20 hover:bg-red-500/10 w-full">
                        <Trash2 className="h-4 w-4 mr-2" /> Remover Instância
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

              {/* Brain Settings (Agora ocupando mais espaço quando selecionado) */}
              <Card className="bg-card/50 border-white/10">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Bot className="h-6 w-6 text-primary" /> Cérebro do Lider-X (Auto-Responder)
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground">{config.auto_responder_enabled ? 'Ativado' : 'Desativado'}</Label>
                      <Switch 
                        checked={config.auto_responder_enabled}
                        onCheckedChange={(val) => setConfig({...config, auto_responder_enabled: val})}
                        className="data-[state=checked]:bg-primary"
                      />
                    </div>
                  </div>
                  <CardDescription>
                    Configure a inteligência artificial para responder automaticamente por esta instância.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Personalidade e Base de Conhecimento</Label>
                    <Textarea 
                      placeholder="Ex: Você é o assistente virtual do candidato João Silva. Seja cordial, responda sobre as propostas de saúde e educação..." 
                      className="min-h-[200px] text-sm bg-black/20 focus:ring-primary/50 border-white/5"
                      value={config.auto_responder_brain || ""}
                      onChange={(e) => setConfig({...config, auto_responder_brain: e.target.value})}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <div className="flex items-end">
                      <Button onClick={updateConfig} className="w-full shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90">
                        <RefreshCw className="h-4 w-4 mr-2" /> Salvar Configurações do Cérebro
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
