import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { 
  Send, 
  User, 
  Users as UsersIcon, 
  MessageSquare, 
  Check, 
  CheckCheck,
  Plus,
  ArrowLeft
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/mensagens")({
  component: MensagensPage,
});

function MensagensPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [leaders, setLeaders] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState({
    destinatario_id: "all",
    titulo: "",
    conteudo: "",
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [replyContent, setReplyContent] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  useEffect(() => {
    fetchInitialData();

    // Subscribe to new messages
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mensagens'
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchInitialData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("perfis")
      .select("*")
      .eq("id", user.id)
      .single();

    setCurrentUser({ ...user, ...profile });

    if (profile?.tipo === 'admin') {
      const { data: leadersData } = await supabase
        .from("perfis")
        .select("*")
        .eq("tipo", "líder");
      setLeaders(leadersData || []);
    }

    await fetchMessages();
    setLoading(false);
  };

  const fetchMessages = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("mensagens")
      .select(`
        *,
        remetente:perfis!mensagens_remetente_id_fkey(nome, tipo),
        destinatario:perfis!mensagens_destinatario_id_fkey(nome, tipo)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Erro ao buscar mensagens:", error);
    } else {
      setMessages(data || []);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.conteudo) {
      toast.error("A mensagem não pode estar vazia");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const messageData: any = {
        remetente_id: user.id,
        titulo: newMessage.titulo,
        conteudo: newMessage.conteudo,
        destinatario_id: newMessage.destinatario_id === "all" ? null : newMessage.destinatario_id
      };

      const { error } = await supabase
        .from("mensagens")
        .insert(messageData);

      if (error) throw error;

      toast.success("Mensagem enviada com sucesso!");
      setNewMessage({ destinatario_id: "all", titulo: "", conteudo: "" });
      setIsDialogOpen(false);
      fetchMessages();
    } catch (error: any) {
      toast.error("Erro ao enviar: " + error.message);
    }
  };

  const handleSendReply = async () => {
    if (!replyContent || !selectedMessage) return;

    setSendingReply(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { error } = await supabase
        .from("mensagens")
        .insert({
          remetente_id: user.id,
          destinatario_id: selectedMessage.remetente_id, // Reply goes to sender
          titulo: `Re: ${selectedMessage.titulo || "Mensagem"}`,
          conteudo: replyContent,
        });

      if (error) throw error;

      toast.success("Resposta enviada!");
      setReplyContent("");
      fetchMessages();
    } catch (error: any) {
      toast.error("Erro ao responder: " + error.message);
    } finally {
      setSendingReply(false);
    }
  };

  const markAsRead = async (message: any) => {
    if (message.remetente_id === currentUser?.id) return;
    if (message.lida) return;

    try {
      if (message.destinatario_id) {
        await supabase
          .from("mensagens")
          .update({ lida: true })
          .eq("id", message.id);
      } else {
        // For broadcast, check if already in mensagens_lidas
        await supabase
          .from("mensagens_lidas")
          .upsert({ 
            mensagem_id: message.id, 
            perfil_id: currentUser.id 
          });
      }
      fetchMessages();
    } catch (error) {
      console.error("Erro ao marcar como lida:", error);
    }
  };

  if (loading) return <div className="p-8 text-center">Carregando mensagens...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mensagens</h1>
          <p className="text-muted-foreground mt-1">Comunicação interna do sistema.</p>
        </div>
        
        {currentUser?.tipo === 'admin' && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> Nova Mensagem
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-card/95 backdrop-blur-xl border-white/10">
              <DialogHeader>
                <DialogTitle>Enviar Mensagem</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Destinatário</label>
                  <Select 
                    value={newMessage.destinatario_id} 
                    onValueChange={(val) => setNewMessage({...newMessage, destinatario_id: val})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o destinatário" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Líderes (Broadcast)</SelectItem>
                      {leaders.map(leader => (
                        <SelectItem key={leader.id} value={leader.id}>{leader.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Assunto (Opcional)</label>
                  <Input 
                    placeholder="Assunto da mensagem" 
                    value={newMessage.titulo}
                    onChange={(e) => setNewMessage({...newMessage, titulo: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Mensagem</label>
                  <Textarea 
                    placeholder="Digite sua mensagem aqui..." 
                    rows={5}
                    value={newMessage.conteudo}
                    onChange={(e) => setNewMessage({...newMessage, conteudo: e.target.value})}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleSendMessage} className="gap-2">
                  <Send className="h-4 w-4" /> Enviar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 p-0 overflow-hidden bg-card/50 backdrop-blur-xl border-white/10 h-[600px] flex flex-col">
          <div className="p-4 border-b border-white/5 bg-white/5">
            <h3 className="font-semibold flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" /> Inbox
            </h3>
          </div>
          <ScrollArea className="flex-1">
            <div className="divide-y divide-white/5">
              {messages.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  Nenhuma mensagem encontrada.
                </div>
              ) : (
                messages.map((msg) => (
                  <button
                    key={msg.id}
                    onClick={() => {
                      setSelectedMessage(msg);
                      markAsRead(msg);
                    }}
                    className={cn(
                      "w-full text-left p-4 transition-colors hover:bg-white/5 flex flex-col gap-1",
                      selectedMessage?.id === msg.id && "bg-primary/10 border-r-2 border-primary"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-primary uppercase tracking-wider">
                        {msg.remetente_id === currentUser.id ? "Enviada" : "Recebida"}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {format(new Date(msg.created_at), "HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    <div className="font-semibold text-sm truncate">
                      {msg.titulo || "Sem assunto"}
                    </div>
                    <div className="text-xs text-muted-foreground line-clamp-1">
                      {msg.conteudo}
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-[10px] font-medium text-muted-foreground truncate max-w-[120px]">
                        {msg.remetente_id === currentUser.id 
                          ? `Para: ${msg.destinatario?.nome || "Todos"}` 
                          : `De: ${msg.remetente?.nome}`
                        }
                      </span>
                      {msg.remetente_id === currentUser.id && (
                        msg.lida ? <CheckCheck className="h-3 w-3 text-primary" /> : <Check className="h-3 w-3 text-muted-foreground" />
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </Card>

        <Card className="md:col-span-2 p-6 bg-card/50 backdrop-blur-xl border-white/10 h-[600px] flex flex-col">
          {selectedMessage ? (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                    {selectedMessage.destinatario_id ? <User className="h-5 w-5" /> : <UsersIcon className="h-5 w-5" />}
                  </div>
                  <div>
                    <h3 className="font-bold">{selectedMessage.titulo || "Sem assunto"}</h3>
                    <p className="text-xs text-muted-foreground">
                      {selectedMessage.remetente_id === currentUser.id 
                        ? `Para: ${selectedMessage.destinatario?.nome || "Todos os Líderes"}`
                        : `De: ${selectedMessage.remetente?.nome}`
                      } • {format(new Date(selectedMessage.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
                {selectedMessage.destinatario_id === null && (
                  <Badge variant="secondary" className="bg-primary/20 text-primary border-none">Broadcast</Badge>
                )}
              </div>
              
              <ScrollArea className="flex-1 pr-4">
                <div className="bg-white/5 rounded-2xl p-6 text-sm leading-relaxed whitespace-pre-wrap">
                  {selectedMessage.conteudo}
                </div>
              </ScrollArea>

              {/* Responder */}
              {(selectedMessage.remetente_id !== currentUser.id) && (
                <div className="mt-6 pt-6 border-t border-white/5">
                  <div className="flex gap-2">
                    <Textarea 
                      placeholder="Escreva uma resposta..." 
                      className="min-h-[80px] bg-black/20 border-white/10"
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.ctrlKey) {
                          handleSendReply();
                        }
                      }}
                    />
                    <Button 
                      className="h-auto" 
                      onClick={handleSendReply}
                      disabled={sendingReply || !replyContent}
                    >
                      {sendingReply ? "..." : <Send className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">Pressione Ctrl + Enter para enviar rapidamente.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-4">
              <div className="p-6 rounded-full bg-white/5">
                <MessageSquare className="h-12 w-12 opacity-20" />
              </div>
              <p>Selecione uma mensagem para visualizar o conteúdo</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
