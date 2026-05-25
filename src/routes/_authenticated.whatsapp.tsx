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
  XCircle
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
  const [config, setConfig] = useState<any>({
    anti_ban_delay_min: 5,
    anti_ban_delay_max: 15,
    anti_ban_batch_size: 50,
    auto_responder_enabled: false,
    auto_responder_brain: ""
  });

  useEffect(() => {
    fetchInstances();
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
      // Create default config if not exists
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
    
    if (!session) {
      toast.error("Sessão expirada. Faça login novamente.");
      return;
    }

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
      console.error("Erro ao criar instância:", error);
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
      console.error("Erro ao salvar config:", error);
      toast.error("Erro ao salvar configurações");
    } else {
      toast.success("Configurações salvas");
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
        {/* Sidebar de Instâncias */}
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

        {/* Conteúdo Principal */}
        <div className="lg:col-span-3 space-y-6">
          {!selectedInstance ? (
            <Card className="h-64 flex items-center justify-center bg-card/50 border-white/10">
              <p className="text-muted-foreground">Selecione ou crie uma instância para começar.</p>
            </Card>
          ) : (
            <Tabs defaultValue="connection" className="w-full">
              <TabsList className="bg-card/50 border border-white/10 p-1 mb-6">
                <TabsTrigger value="connection" className="gap-2"><Zap className="h-4 w-4" /> Conexão</TabsTrigger>
                <TabsTrigger value="antiban" className="gap-2"><ShieldAlert className="h-4 w-4" /> Anti-Banimento</TabsTrigger>
                <TabsTrigger value="brain" className="gap-2"><Bot className="h-4 w-4" /> Cérebro IA</TabsTrigger>
              </TabsList>

              <TabsContent value="connection" className="space-y-4">
                <Card className="bg-card/50 border-white/10">
                  <CardHeader>
                    <CardTitle>Status da Conexão: {selectedInstance.nome}</CardTitle>
                    <CardDescription>Escaneie o QR Code para conectar seu WhatsApp via Evolution API.</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center justify-center py-10 space-y-6">
                    {selectedInstance.status === 'connected' ? (
                      <div className="text-center space-y-4">
                        <div className="h-20 w-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                          <CheckCircle2 className="h-10 w-10 text-green-500" />
                        </div>
                        <h3 className="text-xl font-bold">Instância Conectada</h3>
                        <p className="text-muted-foreground">O sistema está pronto para enviar e receber mensagens.</p>
                        <Button variant="outline" className="text-red-500 border-red-500/20 hover:bg-red-500/10">
                          <Power className="h-4 w-4 mr-2" /> Desconectar
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center space-y-6">
                        <div className="h-64 w-64 bg-white/5 border-2 border-dashed border-white/10 rounded-2xl flex items-center justify-center">
                          <div className="text-center p-6">
                            <RefreshCw className="h-10 w-10 text-muted-foreground mx-auto mb-4 animate-spin" />
                            <p className="text-sm text-muted-foreground font-medium">Gerando QR Code...</p>
                          </div>
                        </div>
                        <div className="flex gap-3 justify-center">
                          <Button variant="outline" onClick={fetchInstances}>
                            <RefreshCw className="h-4 w-4 mr-2" /> Recarregar
                          </Button>
                          <Button variant="destructive">
                            <Trash2 className="h-4 w-4 mr-2" /> Excluir Instância
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="antiban" className="space-y-4">
                <Card className="bg-card/50 border-white/10">
                  <CardHeader>
                    <CardTitle>Configurações Anti-Banimento</CardTitle>
                    <CardDescription>Ajuste o comportamento do envio para minimizar riscos de bloqueio.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-8 py-6">
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <Label>Intervalo Mínimo entre Mensagens (segundos)</Label>
                        <span className="font-mono text-primary">{config.anti_ban_delay_min}s</span>
                      </div>
                      <Slider 
                        value={[config.anti_ban_delay_min]} 
                        min={1} 
                        max={60} 
                        step={1}
                        onValueChange={(val) => setConfig({...config, anti_ban_delay_min: val[0]})}
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <Label>Intervalo Máximo entre Mensagens (segundos)</Label>
                        <span className="font-mono text-primary">{config.anti_ban_delay_max}s</span>
                      </div>
                      <Slider 
                        value={[config.anti_ban_delay_max]} 
                        min={5} 
                        max={300} 
                        step={5}
                        onValueChange={(val) => setConfig({...config, anti_ban_delay_max: val[0]})}
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <Label>Tamanho do Lote de Disparo</Label>
                        <span className="font-mono text-primary">{config.anti_ban_batch_size} contatos</span>
                      </div>
                      <Slider 
                        value={[config.anti_ban_batch_size]} 
                        min={10} 
                        max={500} 
                        step={10}
                        onValueChange={(val) => setConfig({...config, anti_ban_batch_size: val[0]})}
                      />
                    </div>

                    <Button onClick={updateConfig} className="w-full md:w-auto">Salvar Configurações Anti-Ban</Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="brain" className="space-y-4">
                <Card className="bg-card/50 border-white/10 overflow-hidden">
                  <div className="bg-primary/10 px-6 py-4 border-b border-white/5 flex items-center gap-3">
                    <Bot className="h-6 w-6 text-primary" />
                    <div>
                      <h3 className="font-bold">Cérebro Líder-X (Auto-Responder)</h3>
                      <p className="text-xs text-muted-foreground">Personalidade e inteligência para respostas automáticas.</p>
                    </div>
                  </div>
                  <CardContent className="space-y-6 py-6">
                    <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10">
                      <div className="space-y-1">
                        <h4 className="font-semibold">Status do Robô</h4>
                        <p className="text-sm text-muted-foreground">Ative para permitir que a IA responda automaticamente.</p>
                      </div>
                      <Switch 
                        checked={config.auto_responder_enabled}
                        onCheckedChange={(val) => setConfig({...config, auto_responder_enabled: val})}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label>Contexto e Personalidade</Label>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-xs text-primary"
                          onClick={() => setConfig({
                            ...config, 
                            auto_responder_brain: "Você é o Líder-X, o assistente virtual oficial da campanha. Sua personalidade é prestativa, ética e entusiasmada. Responda dúvidas sobre propostas, agenda e como ajudar na campanha. Seja sempre cordial e use emojis moderadamente."
                          })}
                        >
                          Usar Exemplo
                        </Button>
                      </div>
                      <Textarea 
                        placeholder="Descreva aqui como o robô deve se comportar e quais informações ele deve dominar..." 
                        className="min-h-[250px] bg-white/5 border-white/10 focus:ring-primary/20"
                        value={config.auto_responder_brain || ""}
                        onChange={(e) => setConfig({...config, auto_responder_brain: e.target.value})}
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <Label>Limite Diário de Respostas (por contato)</Label>
                        <span className="font-mono text-primary">{config.auto_responder_limit_per_contact || 10}</span>
                      </div>
                      <Slider 
                        value={[config.auto_responder_limit_per_contact || 10]} 
                        min={1} 
                        max={100} 
                        step={1}
                        onValueChange={(val) => setConfig({...config, auto_responder_limit_per_contact: val[0]})}
                      />
                      <p className="text-[10px] text-muted-foreground">Evita loops de mensagens e economiza créditos de IA.</p>
                    </div>

                    <Button onClick={updateConfig} className="w-full gap-2">
                      <CheckCircle2 className="h-4 w-4" /> Salvar Cérebro do Líder-X
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}
