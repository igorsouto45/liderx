import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Settings, Shield, Bell, User } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
      <div className="grid gap-6">
        {[
          { title: "Perfil do Usuário", icon: User },
          { title: "Acesso e Permissões", icon: Shield },
          { title: "Notificações", icon: Bell },
        ].map((item, i) => (
          <Card key={i} className="p-6 flex items-center gap-4 hover:bg-white/5 transition-colors cursor-pointer bg-card/50 backdrop-blur-xl border-white/10">
            <div className="p-3 rounded-lg bg-primary/10">
              <item.icon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-bold">{item.title}</h3>
              <p className="text-sm text-muted-foreground">Gerencie suas preferências de {item.title.toLowerCase()}.</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
