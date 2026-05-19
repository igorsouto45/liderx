import { useState, useEffect, useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, MessageSquare, Loader2, BarChart2, FileText, Zap, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/interacoes")({
  component: Interacoes,
});

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};


function Interacoes() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  async function fetchMessages() {
    try {
      const { data, error } = await supabase
        .from("ia_mensagens")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages((data as any) || []);
    } catch (error) {
      console.error("Erro ao buscar mensagens:", error);
      toast.error("Não foi possível carregar o histórico.");
    } finally {
      setIsFetching(false);
    }
  }

  async function handleSend(text?: string) {
    const messageText = text || input;
    if (!messageText.trim() || isLoading) return;

    const userMessageContent = messageText.trim();
    setInput("");
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // 1. Salvar mensagem do usuário
      const { data: userMsg, error: userErr } = await supabase
        .from("ia_mensagens")
        .insert({
          user_id: user.id,
          role: "user",
          content: userMessageContent,
        })
        .select()
        .single();

      if (userErr) throw userErr;
      setMessages((prev) => [...prev, userMsg]);

      // 2. Chamar Edge Function
      const history = messages.slice(-5).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const { data, error: aiError } = await supabase.functions.invoke("campaign-ai", {
        body: { message: userMessageContent, history },
      });

      if (aiError) throw aiError;

      // 3. Salvar resposta da IA
      const { data: assistantMsg, error: assistantErr } = await supabase
        .from("ia_mensagens")
        .insert({
          user_id: user.id,
          role: "assistant",
          content: data.text,
        })
        .select()
        .single();

      if (assistantErr) throw assistantErr;
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      console.error("Erro na interação:", error);
      toast.error("Erro ao processar sua solicitação.");
    } finally {
      setIsLoading(false);
    }
  }

  async function clearChat() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("ia_mensagens")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;
      setMessages([]);
      toast.success("Histórico limpo.");
    } catch (error) {
      toast.error("Erro ao limpar histórico.");
    }
  }

  const quickActions = [
    { label: "Analisar Bairros", icon: BarChart2, prompt: "Quais são os bairros com mais eleitores e onde devo focar mais esforços?" },
    { label: "Script de Discurso", icon: FileText, prompt: "Crie um script de 1 minuto para um vídeo de campanha focado em renovação e liderança." },
    { label: "Dicas de Engajamento", icon: Zap, prompt: "Como posso motivar meus líderes a cadastrar mais eleitores nesta semana?" },
  ];

  return (
    <div className="space-y-6 h-[calc(100vh-12rem)] flex flex-col">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">LiderX IA</h1>
          <p className="text-muted-foreground">Seu consultor estratégico de campanha.</p>
        </div>
        <Button variant="ghost" size="sm" onClick={clearChat} className="text-destructive hover:text-destructive hover:bg-destructive/10">
          <Trash2 className="h-4 w-4 mr-2" />
          Limpar Chat
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 flex-1 min-h-0">
        <Card className="md:col-span-3 flex flex-col bg-card/50 backdrop-blur-xl border-white/10 overflow-hidden">
          <div className="p-4 border-b border-white/10 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-bold">Assistente Estratégico</h3>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs text-muted-foreground">Online</span>
              </div>
            </div>
          </div>

          <ScrollArea ref={scrollRef} className="flex-1 p-4">
            <div className="space-y-4">
              {isFetching ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>Inicie uma conversa para receber dicas estratégicas.</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex w-full max-w-[85%] flex-col gap-2 rounded-lg p-4 text-sm",
                      msg.role === "user" 
                        ? "ml-auto bg-primary text-primary-foreground" 
                        : "bg-muted border border-white/5"
                    )}
                  >
                    <div className="font-bold flex items-center gap-2">
                      {msg.role === "user" ? "Você" : "LiderX IA"}
                    </div>
                    <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                    <div className="text-[10px] opacity-50 self-end">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))
              )}
              {isLoading && (
                <div className="flex w-full max-w-[85%] flex-col gap-2 rounded-lg p-4 text-sm bg-muted animate-pulse">
                  <div className="font-bold">LiderX IA</div>
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-foreground/20 animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-foreground/20 animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-foreground/20 animate-bounce" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="p-4 border-t border-white/10 bg-background/30">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2"
            >
              <Input
                placeholder="Pergunte algo sobre a campanha..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
                className="bg-background/50 border-white/10 focus-visible:ring-primary/50"
              />
              <Button type="submit" disabled={isLoading || !input.trim()}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          </div>
        </Card>

        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-muted-foreground px-1 uppercase tracking-wider">Ações Rápidas</h4>
          {quickActions.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              className="w-full justify-start h-auto py-4 px-4 bg-card/40 border-white/10 hover:bg-primary/10 hover:border-primary/30 transition-all text-left flex gap-3 group"
              onClick={() => handleSend(action.prompt)}
              disabled={isLoading}
            >
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 shrink-0">
                <action.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="flex flex-col gap-0.5 overflow-hidden">
                <span className="font-medium text-sm">{action.label}</span>
                <span className="text-[10px] text-muted-foreground truncate opacity-70">Sugerir estratégia</span>
              </div>
            </Button>
          ))}
          
          <Card className="p-4 bg-primary/5 border-primary/20 mt-6">
            <h5 className="text-xs font-bold text-primary flex items-center gap-2 mb-2">
              <Zap className="h-3 w-3" /> DICA IA
            </h5>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              O LiderX IA analisa seus eleitores e líderes em tempo real. Peça por "Análise de Bairro" para ver onde seu engajamento está maior.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
