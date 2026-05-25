import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Shield, ShieldCheck, AlertTriangle, Clock, Zap, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function WhatsAppAntiBan({ config, onUpdate }: { config: any, onUpdate: () => void }) {
  const [delayMin, setDelayMin] = useState(config?.anti_ban_delay_min || 5);
  const [delayMax, setDelayMax] = useState(config?.anti_ban_delay_max || 15);
  const [isSaving, setIsSaving] = useState(false);

  const saveConfig = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("whatsapp_config")
        .upsert({
          user_id: user.id,
          anti_ban_delay_min: delayMin,
          anti_ban_delay_max: delayMax,
        });

      if (error) throw error;
      toast.success("Configurações anti-banimento salvas!");
      onUpdate();
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-card/40 backdrop-blur-xl border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10">
          <ShieldCheck className="h-24 w-24" />
        </div>
        
        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-500">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Configurações Anti-Banimento</h3>
            <p className="text-sm text-muted-foreground">Proteja seu número contra bloqueios do WhatsApp</p>
          </div>
        </div>

        <div className="space-y-8">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Intervalo entre mensagens (Segundos)
              </Label>
              <span className="text-sm font-mono font-bold text-primary bg-primary/10 px-2 py-1 rounded">
                {delayMin}s - {delayMax}s
              </span>
            </div>
            <div className="space-y-6 px-2">
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Mínimo</span>
                  <span>{delayMin}s</span>
                </div>
                <Slider 
                  value={[delayMin]} 
                  onValueChange={(v) => setDelayMin(v[0])} 
                  max={60} 
                  step={1}
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Máximo</span>
                  <span>{delayMax}s</span>
                </div>
                <Slider 
                  value={[delayMax]} 
                  onValueChange={(v) => setDelayMax(Math.max(v[0], delayMin + 1))} 
                  max={120} 
                  step={1}
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
              <div className="space-y-0.5">
                <Label className="text-sm font-bold">Simular Digitação</Label>
                <p className="text-[10px] text-muted-foreground">Mostra "digitando..." antes de enviar</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
              <div className="space-y-0.5">
                <Label className="text-sm font-bold">Horário Comercial</Label>
                <p className="text-[10px] text-muted-foreground">Evita envios em horários suspeitos</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
              <div className="space-y-0.5">
                <Label className="text-sm font-bold">Rotação de Mensagens</Label>
                <p className="text-[10px] text-muted-foreground">Varia levemente o texto enviado</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
              <div className="space-y-0.5">
                <Label className="text-sm font-bold">Humanização IA</Label>
                <p className="text-[10px] text-muted-foreground">Adiciona erros gramaticais leves e emojis</p>
              </div>
              <Switch />
            </div>
          </div>

          <Button onClick={saveConfig} disabled={isSaving} className="w-full">
            Salvar Configurações de Segurança
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-amber-500/5 border-amber-500/20">
          <AlertTriangle className="h-5 w-5 text-amber-500 mb-2" />
          <h5 className="text-xs font-bold text-amber-500 mb-1 uppercase">Atenção</h5>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Envios em massa sem consentimento podem levar ao banimento imediato. Use com moderação.
          </p>
        </Card>
        <Card className="p-4 bg-primary/5 border-primary/20">
          <Zap className="h-5 w-5 text-primary mb-2" />
          <h5 className="text-xs font-bold text-primary mb-1 uppercase">Dica de Ouro</h5>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Mantenha o intervalo acima de 10 segundos para envios em listas de transmissão ou grupos.
          </p>
        </Card>
        <Card className="p-4 bg-blue-500/5 border-blue-500/20">
          <MessageSquare className="h-5 w-5 text-blue-500 mb-2" />
          <h5 className="text-xs font-bold text-blue-500 mb-1 uppercase">Aquecimento</h5>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Números novos devem ser "aquecidos" enviando poucas mensagens nos primeiros 7 dias.
          </p>
        </Card>
      </div>
    </div>
  );
}
