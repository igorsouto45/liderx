import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Map } from "lucide-react";

export const Route = createFileRoute("/_authenticated/mapa")({
  component: Mapa,
});

function Mapa() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Mapa Estratégico</h1>
      <Card className="p-8 bg-card/50 backdrop-blur-xl border-white/10 h-[500px] flex items-center justify-center text-muted-foreground border-dashed">
        <div className="text-center">
          <Map className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p>Visualização cartográfica em desenvolvimento.</p>
        </div>
      </Card>
    </div>
  );
}
