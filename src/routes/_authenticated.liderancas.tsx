import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Users, TrendingUp, Award } from "lucide-react";

export const Route = createFileRoute("/_authenticated/liderancas")({
  component: Liderancas,
});

function Liderancas() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Gestão de Lideranças</h1>
      <div className="grid gap-4">
        {[
          { name: "Marcos Oliveira", cargo: "Líder Comunitário", impacto: "+150 votos" },
          { name: "Ana Santos", cargo: "Coordenadora Zonal", impacto: "+85 votos" },
        ].map((leader, i) => (
          <Card key={i} className="p-6 flex items-center justify-between bg-card/50 backdrop-blur-xl border-white/10">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                {leader.name[0]}
              </div>
              <div>
                <h3 className="font-bold">{leader.name}</h3>
                <p className="text-sm text-muted-foreground">{leader.cargo}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-primary font-bold">
              <TrendingUp className="h-4 w-4" />
              {leader.impacto}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
