import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { MessageSquare, Bot } from "lucide-react";

export const Route = createFileRoute("/_authenticated/interacoes")({
  component: Interacoes,
});

function Interacoes() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Interações IA</h1>
      <Card className="h-[600px] bg-card/50 backdrop-blur-xl border-white/10 p-6">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/10">
          <Bot className="h-10 w-10 text-primary" />
          <div>
            <h3 className="font-bold">Assistente de Campanha LiderX</h3>
            <p className="text-sm text-muted-foreground">Como posso otimizar a estratégia hoje?</p>
          </div>
        </div>
        <div className="text-center mt-20 text-muted-foreground">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p>Nenhuma interação registrada recentemente.</p>
        </div>
      </Card>
    </div>
  );
}
