import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Settings, Shield, Bell, User, Mail, UserCog, Save } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<{nome: string, email: string, tipo: string}>({ nome: "", email: "", tipo: "" });
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
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
            tipo: data.tipo as any
          });

          if (data.tipo === 'admin') {
            const { data: allUsers } = await supabase
              .from("perfis")
              .select("*")
              .order('nome');
            setUsers(allUsers || []);
          }
        }
      }
      setLoading(false);
    };

    fetchData();
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
      console.error("Erro ao salvar perfil:", error);
      toast.error("Erro ao salvar: " + (error.message || "Tente novamente"));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from("perfis")
        .update({ tipo: newRole as any })
        .eq("id", userId);

      if (error) throw error;
      
      setUsers(users.map(u => u.id === userId ? { ...u, tipo: newRole } : u));
      toast.success("Nível de acesso atualizado!");
    } catch (error: any) {
      console.error("Erro ao atualizar nível de acesso:", error);
      toast.error("Erro ao atualizar nível: " + (error.message || "Tente novamente"));
    }
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Carregando configurações...</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground mt-1">Gerencie seu perfil e preferências do sistema.</p>
      </div>

      <Tabs defaultValue="perfil" className="w-full">
        <TabsList className="bg-card/50 border border-white/5 p-1 mb-6">
          <TabsTrigger value="perfil" className="gap-2">
            <User className="h-4 w-4" /> Perfil
          </TabsTrigger>
          <TabsTrigger value="acesso" disabled={profile.tipo !== 'admin'} className="gap-2">
            <Shield className="h-4 w-4" /> Acesso e Permissões
          </TabsTrigger>
          <TabsTrigger value="notificacoes" className="gap-2">
            <Bell className="h-4 w-4" /> Notificações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="perfil">
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

            <form onSubmit={handleSave} className="space-y-4 max-w-md">
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
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tipo">Nível de Acesso</Label>
                <Badge className="w-fit py-1 px-3 uppercase" variant="outline">
                  {profile.tipo}
                </Badge>
              </div>
              <Button type="submit" disabled={saving} className="gap-2">
                <Save className="h-4 w-4" /> {saving ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="acesso">
          <Card className="p-6 bg-card/50 backdrop-blur-xl border-white/10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-lg bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-xl">Gestão de Usuários</h3>
                <p className="text-sm text-muted-foreground">Gerencie quem tem acesso e quais as permissões.</p>
              </div>
            </div>

            <ScrollArea className="h-[400px] rounded-md border border-white/5">
              <div className="divide-y divide-white/5">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                        {user.nome?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{user.nome}</p>
                        <p className="text-xs text-muted-foreground uppercase">{user.tipo}</p>
                      </div>
                    </div>
                    
                    <Select 
                      defaultValue={user.tipo} 
                      onValueChange={(val) => handleUpdateUserRole(user.id, val)}
                    >
                      <SelectTrigger className="w-[180px] bg-black/20 border-white/10">
                        <SelectValue placeholder="Nível de Acesso" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="líder">Líder</SelectItem>
                        <SelectItem value="operador">Operador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        </TabsContent>

        <TabsContent value="notificacoes">
          <Card className="p-6 bg-card/50 backdrop-blur-xl border-white/10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-lg bg-primary/10">
                <Bell className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-xl">Configurações de Alerta</h3>
                <p className="text-sm text-muted-foreground">Como você quer ser notificado pelo sistema.</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                <div className="space-y-0.5">
                  <Label className="text-base">Mensagens Internas</Label>
                  <p className="text-sm text-muted-foreground">Receber alertas de novas mensagens no dashboard.</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                <div className="space-y-0.5">
                  <Label className="text-base">Novos Eleitores</Label>
                  <p className="text-sm text-muted-foreground">Notificar quando um líder cadastrar um novo eleitor.</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                <div className="space-y-0.5">
                  <Label className="text-base">Notificações Push (PWA)</Label>
                  <p className="text-sm text-muted-foreground">Habilitar notificações diretamente no seu celular/navegador.</p>
                </div>
                <Switch />
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
