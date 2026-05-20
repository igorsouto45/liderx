import { createFileRoute, Outlet, Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  Map, 
  MessageSquare, 
  Settings, 
  LogOut,
  Shield,
  Menu,
  X,
  TrendingUp,
  Award,
  Bot
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) {
        navigate({ to: "/login" });
        return;
      }
      setSession(currentSession);
      
      const { data: currentProfile } = await supabase
        .from("perfis")
        .select("*")
        .eq("id", currentSession.user.id)
        .single();
      
      setProfile(currentProfile);
      setLoading(false);

      if (currentProfile) {
        fetchUnreadCount(currentSession.user.id, currentProfile.tipo);
      }
    };

    const fetchUnreadCount = async (userId: string, tipo: string) => {
      const { count: unreadDirect } = await supabase
        .from("mensagens")
        .select("*", { count: 'exact', head: true })
        .eq("destinatario_id", userId)
        .eq("lida", false);

      let unreadBroadcast = 0;
      if (tipo === 'líder') {
        const { data: readBroadcasts } = await supabase
          .from("mensagens_lidas")
          .select("mensagem_id")
          .eq("perfil_id", userId);
        
        const readIds = readBroadcasts?.map(rb => rb.mensagem_id) || [];
        
        const query = supabase
          .from("mensagens")
          .select("*", { count: 'exact', head: true })
          .is("destinatario_id", null);
        
        if (readIds.length > 0) {
          query.not("id", "in", `(${readIds.join(",")})`);
        }
        
        const { count: broadcastCount } = await query;
        unreadBroadcast = broadcastCount || 0;
      }

      setUnreadCount((unreadDirect || 0) + unreadBroadcast);
    };

    checkAuth();

    const channel = supabase
      .channel('unread-messages-global')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'mensagens' },
        () => {
          if (session?.user?.id && profile) {
            fetchUnreadCount(session.user.id, profile.tipo);
          }
        }
      )
      .subscribe();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!newSession) {
        navigate({ to: "/login" });
      } else {
        setSession(newSession);
      }
    });

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [navigate, session?.user?.id, profile?.tipo]);

  // Handle resizing to close/open sidebar automatically
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Sessão encerrada");
  };

  if (loading) return null;
  if (!session) return null;

  const allMenuItems = [
    { label: "Painel de Guerra", icon: LayoutDashboard, to: "/dashboard", roles: ["admin", "operador"] },
    { label: "Eleitores", icon: Users, to: "/eleitores", roles: ["admin", "operador", "líder"] },
    { label: "Prioridades", icon: Award, to: "/prioridades", roles: ["admin", "operador", "líder"] },
    { label: "Lideranças", icon: TrendingUp, to: "/liderancas", roles: ["admin", "operador"] },
    { label: "Mapa Estratégico", icon: Map, to: "/mapa", roles: ["admin", "operador"] },
    { label: "Captura (QR Code)", icon: UserPlus, to: "/captura", roles: ["admin", "operador", "líder"] },
    { label: "Interações IA", icon: Bot, to: "/interacoes", roles: ["admin", "operador"] },
    { label: "Mensagens", icon: MessageSquare, to: "/mensagens", roles: ["admin", "líder"] },
    { label: "Configurações", icon: Settings, to: "/settings", roles: ["admin"] },
  ];

  const menuItems = allMenuItems.filter(item => 
    !item.roles || (profile && item.roles.includes(profile.tipo))
  );

  // Redirect if current path is not allowed
  const currentItem = allMenuItems.find(item => item.to === location.pathname);
  if (currentItem && profile && !currentItem.roles.includes(profile.tipo)) {
    navigate({ to: menuItems[0]?.to || "/eleitores" });
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-white/5 bg-card/40 backdrop-blur-2xl transition-transform duration-300 lg:static lg:translate-x-0",
        !sidebarOpen && "-translate-x-full"
      )}>
        <div className="flex h-16 items-center justify-between px-6 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">LiderX</span>
          </div>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <ScrollArea className="flex-1 px-4 py-6">
          <nav className="space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all hover:bg-white/5",
                  location.pathname === item.to ? "bg-primary/10 text-primary shadow-[inset_0_0_10px_rgba(108,43,217,0.1)]" : "text-muted-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5", location.pathname === item.to ? "text-primary" : "text-muted-foreground")} />
                <span className="flex-1">{item.label}</span>
                {item.to === "/mensagens" && unreadCount > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </Link>
            ))}
          </nav>
        </ScrollArea>

        <div className="border-t border-white/5 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold">
              {profile?.nome?.[0]?.toUpperCase() || session.user.email?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold truncate">{profile?.nome || session.user.email?.split("@")[0]}</p>
              <p className="text-xs text-muted-foreground capitalize">{profile?.tipo || "Usuário"}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            Sair do Sistema
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="flex h-16 items-center justify-between px-4 md:px-8 border-b border-white/5 bg-background/50 backdrop-blur-xl shrink-0">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-6 w-6" />
          </Button>
          <div className="flex-1 px-2 md:px-4">
            <h2 className="text-base md:text-lg font-semibold tracking-tight truncate">
              {menuItems.find(item => item.to === location.pathname)?.label || "Dashboard"}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end">
              <p className="text-xs text-muted-foreground">Status da Campanha</p>
              <p className="text-sm font-bold text-green-500">Crescimento +12%</p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top_right,var(--primary)_0%,transparent_40%)] opacity-[0.03] absolute inset-0 pointer-events-none" />
        
        <ScrollArea className="flex-1">
          <div className="p-4 md:p-8">
            <Outlet />
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}
