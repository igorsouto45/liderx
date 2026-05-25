import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bot, Sparkles, Brain, Save, Zap, HelpCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function WhatsAppBrain({ config, onUpdate }: { config: any, onUpdate: () => void }) {
  const [enabled, setEnabled] = useState(config?.ai_brain_enabled || false);
  const [prompt, setPrompt] = useState(config?.ai_prompt || "");
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
          ai_brain_enabled: enabled,
          ai_prompt: prompt,
        });

      if (error) throw error;
      toast.success("Cérebro Lider-X configurado!");
      onUpdate();
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const defaultPrompt = `Você é o Lider-X Auto Responder. Seu papel é responder dúvidas de eleitores via WhatsApp de forma humana, educada e estratégica.
Sempre seja proativo em coletar o nome e o bairro do eleitor para cadastro.
Se o eleitor perguntar sobre o candidato, responda com base nas propostas principais...`;

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-card/40 backdrop-blur-xl border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10">
          <Brain className="h-24 w-24 text-primary" />
        </div>

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Cérebro Lider-X Auto Responder</h3>
              <p className="text-sm text-muted-foreground">Inteligência Artificial que responde seus eleitores 24/7</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white/5 p-2 rounded-xl border border-white/5">
            <span className={enabled ? "text-primary font-bold text-xs" : "text-muted-foreground text-xs"}>
              {enabled ? "ATIVO" : "INATIVO"}
            </span>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="flex items-center gap-2 text-base font-semibold">
                <Sparkles className="h-4 w-4 text-primary" />
                Instruções do Sistema (System Prompt)
              </Label>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs h-8 text-primary hover:bg-primary/10"
                onClick={() => setPrompt(defaultPrompt)}
              >
                Usar Modelo Padrão
              </Button>
            </div>
            <Textarea 
              placeholder="Descreva como a IA deve se comportar e responder..." 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[300px] bg-background/50 border-white/10 focus-visible:ring-primary/50 text-sm leading-relaxed resize-none"
            />
            <p className="text-[11px] text-muted-foreground italic">
              * Dica: Quanto mais detalhes você der sobre o candidato e as propostas, melhor será a resposta da IA.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4 bg-primary/5 border-primary/20 flex gap-3">
              <Zap className="h-5 w-5 text-primary shrink-0" />
              <div>
                <h5 className="text-xs font-bold uppercase mb-1">Coleta Automática</h5>
                <p className="text-[10px] text-muted-foreground">A IA tentará identificar nome, CEP e bairro durante a conversa.</p>
              </div>
            </Card>
            <Card className="p-4 bg-blue-500/5 border-blue-500/20 flex gap-3">
              <HelpCircle className="h-5 w-5 text-blue-500 shrink-0" />
              <div>
                <h5 className="text-xs font-bold uppercase mb-1">Dúvidas Frequentes</h5>
                <p className="text-[10px] text-muted-foreground">A IA usa sua base de conhecimento para responder sobre locais de votação.</p>
              </div>
            </Card>
          </div>

          <Button onClick={saveConfig} disabled={isSaving} className="w-full h-12 text-base shadow-lg shadow-primary/20">
            {isSaving ? "Salvando..." : "Salvar Configuração do Cérebro"}
            <Save className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
