import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Smartphone, Shield, MessageSquare, Zap, Brain, RefreshCw } from "lucide-react";
import { WhatsAppConnection } from "@/components/whatsapp/WhatsAppConnection";
import { WhatsAppChat } from "@/components/whatsapp/WhatsAppChat";
import { WhatsAppAutomations } from "@/components/whatsapp/WhatsAppAutomations";
import { WhatsAppAntiBan } from "@/components/whatsapp/WhatsAppAntiBan";
import { WhatsAppBrain } from "@/components/whatsapp/WhatsAppBrain";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/whatsapp")({
  component: WhatsAppPage,
});

function WhatsAppPage() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("whatsapp_config")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      setConfig(data);
    } catch (error) {
      console.error("Erro ao buscar config:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">LiderX WhatsApp</h1>
          <p className="text-muted-foreground">Gerencie sua comunicação via WhatsApp e automações inteligentes.</p>
        </div>
      </div>

      <Tabs defaultValue="chat" className="space-y-6">
        <TabsList className="bg-card/40 backdrop-blur-xl border border-white/5 p-1 h-14 rounded-2xl w-full md:w-auto overflow-x-auto">
          <TabsTrigger value="chat" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2">
            <MessageSquare className="h-4 w-4" />
            Mensagens
          </TabsTrigger>
          <TabsTrigger value="automations" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2">
            <Zap className="h-4 w-4" />
            Automações
          </TabsTrigger>
          <TabsTrigger value="brain" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2">
            <Brain className="h-4 w-4" />
            Cérebro Lider-X
          </TabsTrigger>
          <TabsTrigger value="antiban" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2">
            <Shield className="h-4 w-4" />
            Anti-Banimento
          </TabsTrigger>
          <TabsTrigger value="connection" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2">
            <Smartphone className="h-4 w-4" />
            Configuração API
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="animate-in fade-in-50 duration-500">
          <WhatsAppChat />
        </TabsContent>

        <TabsContent value="automations" className="animate-in fade-in-50 duration-500">
          <WhatsAppAutomations />
        </TabsContent>

        <TabsContent value="brain" className="animate-in fade-in-50 duration-500">
          <WhatsAppBrain config={config} onUpdate={fetchConfig} />
        </TabsContent>

        <TabsContent value="antiban" className="animate-in fade-in-50 duration-500">
          <WhatsAppAntiBan config={config} onUpdate={fetchConfig} />
        </TabsContent>

        <TabsContent value="connection" className="animate-in fade-in-50 duration-500">
          <WhatsAppConnection config={config} onUpdate={fetchConfig} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
