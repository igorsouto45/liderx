import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Zap, MessageSquare, UserPlus, Clock, ArrowRight, Settings2, Trash2 } from "lucide-react";

export function WhatsAppAutomations() {
  const [automations, setAutomations] = useState([
    { id: 1, name: "Mensagem de Boas-vindas", type: "welcome", status: true, trigger: "Primeira interação", content: "Olá! Seja bem-vindo ao canal do candidato..." },
    { id: 2, name: "Coleta de CEP", type: "data_collection", status: true, trigger: "Palavra-chave: 'quero apoiar'", content: "Que ótimo! Para começarmos, qual seu CEP?" },
    { id: 3, name: "Fora de Horário", type: "away", status: false, trigger: "20:00 - 08:00", content: "No momento não estamos online, mas amanhã responderemos!" },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold">Automações Inteligentes</h3>
          <p className="text-sm text-muted-foreground">Configure fluxos automáticos para agilizar o atendimento</p>
        </div>
        <Button className="gap-2">
          <Zap className="h-4 w-4" />
          Nova Automação
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {automations.map((auto) => (
          <Card key={auto.id} className="p-5 bg-card/40 backdrop-blur-xl border-white/5 group hover:border-primary/30 transition-all duration-300">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
                  {auto.type === "welcome" ? <UserPlus className="h-5 w-5" /> : 
                   auto.type === "data_collection" ? <Settings2 className="h-5 w-5" /> : 
                   <Clock className="h-5 w-5" />}
                </div>
                <div>
                  <h4 className="font-bold">{auto.name}</h4>
                  <Badge variant="secondary" className="text-[9px] uppercase tracking-wider h-4">
                    {auto.trigger}
                  </Badge>
                </div>
              </div>
              <Switch checked={auto.status} />
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/5 mb-4 text-xs text-muted-foreground line-clamp-2 italic">
              "{auto.content}"
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-white/5 pt-4">
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">Editar</Button>
                <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-destructive hover:text-destructive">Excluir</Button>
              </div>
              <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs text-primary group-hover:bg-primary/10">
                Ver Fluxo <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </Card>
        ))}

        <button className="border-2 border-dashed border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:bg-white/5 hover:border-primary/20 transition-all group">
          <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Plus className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="font-semibold text-muted-foreground">Criar Automação</p>
          <p className="text-[10px] text-muted-foreground/60 max-w-[150px]">Use modelos pré-prontos ou crie do zero</p>
        </button>
      </div>

      <Card className="p-6 bg-gradient-to-br from-primary/10 via-background to-background border-primary/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-20 rotate-12">
          <MessageSquare className="h-24 w-24 text-primary" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1">
            <h4 className="text-lg font-bold flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Auto-Responder IA (Cérebro Lider-X)
            </h4>
            <p className="text-sm text-muted-foreground mt-1">
              Deseja que todas as mensagens sejam respondidas automaticamente por nossa inteligência artificial estratégica?
            </p>
          </div>
          <Button variant="default" className="shadow-lg shadow-primary/20 px-8">
            Configurar Cérebro
          </Button>
        </div>
      </Card>
    </div>
  );
}

function Plus({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}
