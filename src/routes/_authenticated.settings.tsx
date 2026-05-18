import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Settings, Shield, Bell, User } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({ nome: "", email: "", tipo: "" });

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from("perfis")
          .select("*")
          .eq("id", user.id)
          .single();
        
        if (data) {
          setProfile({
            nome: data.nome || "",
            email: user.email || "",
            tipo: data.tipo || ""
          });
        }
      }
      setLoading(false);
    };

    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { error } = await supabase
        .from("perfis")
        .update({ nome: profile.nome })
        .eq("id", user.id);

      if (error) throw error;
      toast.success("Perfil atualizado com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Carregando configurações...</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground mt-1">Gerencie seu perfil e preferências do sistema.</p>
      </div>

      <div className="grid gap-6">
        <Card className="p-6 bg-card/50 backdrop-blur-xl border-white/10">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-lg bg-primary/10">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-xl">Perfil do Usuário</h3>
              <p className="text-sm text-muted-foreground">Suas informações básicas de acesso.</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="nome">Nome Completo</Label>
              <Input 
                id="nome" 
                value={profile.nome} 
                onChange={(e) => setProfile({ ...profile, nome: e.target.value })} 
                className="bg-black/20 border-white/10"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input 
                id="email" 
                value={profile.email} 
                disabled 
                className="bg-black/20 border-white/5 opacity-60"
              />
              <p className="text-[10px] text-muted-foreground">O e-mail não pode ser alterado por aqui.</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tipo">Nível de Acesso</Label>
              <Input 
                id="tipo" 
                value={profile.tipo.toUpperCase()} 
                disabled 
                className="bg-black/20 border-white/5 opacity-60"
              />
            </div>
            <Button type="submit" disabled={saving} className="w-full md:w-auto">
              {saving ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </form>
        </Card>

        <Card className="p-6 bg-card/50 backdrop-blur-xl border-white/10 opacity-60 cursor-not-allowed">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-bold">Acesso e Permissões</h3>
              <p className="text-sm text-muted-foreground">Gerencie níveis de acesso (Disponível apenas para Administradores).</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-card/50 backdrop-blur-xl border-white/10 opacity-60 cursor-not-allowed">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Bell className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-bold">Notificações</h3>
              <p className="text-sm text-muted-foreground">Configure como você deseja receber alertas do sistema.</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
