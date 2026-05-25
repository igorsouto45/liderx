import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Smartphone, Link2, RefreshCw, QrCode, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function WhatsAppConnection({ config, onUpdate }: { config: any, onUpdate: () => void }) {
  const [apiUrl, setApiUrl] = useState(config?.api_url || "");
  const [apiKey, setApiKey] = useState(config?.api_key || "");
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<"disconnected" | "connecting" | "connected" | "qr">("disconnected");

  const saveConfig = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("whatsapp_config")
        .upsert({
          user_id: user.id,
          api_url: apiUrl,
          api_key: apiKey,
        });

      if (error) throw error;
      toast.success("Configurações salvas!");
      onUpdate();
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const checkStatus = () => {
    if (!apiUrl) {
      setStatus("disconnected");
      return;
    }
    setStatus("connecting");
    // Simulando conexão com a API open-wa
    setTimeout(() => {
      setStatus("qr");
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-card/40 backdrop-blur-xl border-white/5">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
              <Link2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Conexão API</h3>
              <p className="text-sm text-muted-foreground">Configure sua instância do open-wa</p>
            </div>
          </div>
          <Badge variant={status === "connected" ? "default" : "secondary"} className={status === "connected" ? "bg-green-500/20 text-green-500 hover:bg-green-500/30" : ""}>
            {status === "connected" ? "Conectado" : status === "qr" ? "Aguardando QR Code" : status === "connecting" ? "Conectando..." : "Desconectado"}
          </Badge>
        </div>

        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="api_url">URL da API (open-wa host)</Label>
            <Input 
              id="api_url" 
              placeholder="https://seu-host-whatsapp.com" 
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              className="bg-background/50 border-white/10"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="api_key">Chave de API (Secret Key)</Label>
            <Input 
              id="api_key" 
              type="password"
              placeholder="Sua chave secreta" 
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="bg-background/50 border-white/10"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button onClick={saveConfig} disabled={isSaving} className="flex-1">
              {isSaving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Salvar Configurações
            </Button>
            <Button variant="outline" onClick={checkStatus} disabled={!apiUrl}>
              Testar Conexão
            </Button>
          </div>
        </div>
      </Card>

      {status === "qr" && (
        <Card className="p-8 flex flex-col items-center justify-center text-center bg-card/40 backdrop-blur-xl border-white/5 animate-in fade-in zoom-in duration-300">
          <div className="bg-white p-4 rounded-2xl mb-6 shadow-2xl">
            <QrCode className="h-48 w-48 text-black" />
          </div>
          <h4 className="text-xl font-bold mb-2">Escaneie o QR Code</h4>
          <p className="text-muted-foreground max-w-xs mb-6">
            Abra o WhatsApp no seu celular, vá em Aparelhos Conectados e escaneie o código acima para iniciar a sessão.
          </p>
          <div className="flex items-center gap-2 text-sm text-amber-500 bg-amber-500/10 px-4 py-2 rounded-full">
            <AlertCircle className="h-4 w-4" />
            O código expira em 60 segundos
          </div>
        </Card>
      )}

      {status === "connected" && (
        <Card className="p-6 bg-green-500/5 border-green-500/20">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
              <Smartphone className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold text-green-500">Sessão Ativa</h4>
              <p className="text-sm text-green-500/70">Conectado como: +55 (11) 99999-9999</p>
            </div>
            <Button variant="outline" className="ml-auto border-green-500/20 hover:bg-green-500/10 text-green-500">
              Desconectar
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
