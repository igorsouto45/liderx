import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Target, CheckCircle2, Clock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/prioridades")({
  component: Prioridades,
});

function Prioridades() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Prioridades Estratégicas</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[
          { title: "Alcançar 5k Votos", status: "Em progresso", icon: Target },
          { title: "Reunião Bairro Centro", status: "Concluído", icon: CheckCircle2 },
          { title: "Panfletagem Zona Norte", status: "Pendente", icon: Clock },
        ].map((item, i) => (
          <Card key={i} className="p-6 bg-card/50 backdrop-blur-xl border-white/10">
            <div className="flex items-center gap-4">
              <item.icon className="h-8 w-8 text-primary" />
              <div>
                <h3 className="font-bold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.status}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
