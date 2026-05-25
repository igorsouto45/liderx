import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Send, Plus, MoreVertical, Smartphone, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function WhatsAppChat() {
  const [activeChat, setActiveChat] = useState<any>(null);

  const chats = [
    { id: 1, name: "João Silva", lastMessage: "Olá, gostaria de saber...", time: "10:30", unread: 2, avatar: "JS" },
    { id: 2, name: "Maria Oliveira", lastMessage: "Obrigada pelas informações!", time: "Ontem", unread: 0, avatar: "MO" },
    { id: 3, name: "Grupo Bairro Centro", lastMessage: "Candidato: Vamos ganhar!", time: "Ontem", unread: 0, avatar: "BC" },
  ];

  const messages = [
    { id: 1, content: "Olá, sou o João. Como posso ajudar na campanha?", fromMe: false, time: "10:25" },
    { id: 2, content: "Olá João! Ficamos muito felizes com seu interesse. Você já é cadastrado?", fromMe: true, time: "10:26" },
    { id: 3, content: "Ainda não. O que preciso fazer?", fromMe: false, time: "10:30" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-16rem)] min-h-[600px]">
      {/* Sidebar: Chat List */}
      <Card className="flex flex-col bg-card/40 backdrop-blur-xl border-white/5 overflow-hidden">
        <div className="p-4 border-b border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">Conversas</h3>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Plus className="h-5 w-5" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar contato..." className="pl-9 bg-background/50 border-white/5" />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {chats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => setActiveChat(chat)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-white/5 text-left",
                  activeChat?.id === chat.id && "bg-white/10 shadow-sm"
                )}
              >
                <Avatar className="h-12 w-12 border border-white/5">
                  <AvatarFallback className="bg-primary/20 text-primary font-bold">{chat.avatar}</AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="font-bold truncate">{chat.name}</span>
                    <span className="text-[10px] text-muted-foreground">{chat.time}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{chat.lastMessage}</p>
                </div>
                {chat.unread > 0 && (
                  <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground">
                    {chat.unread}
                  </div>
                )}
              </button>
            ))}
          </div>
        </ScrollArea>
      </Card>

      {/* Main: Chat Window */}
      <Card className="md:col-span-2 flex flex-col bg-card/40 backdrop-blur-xl border-white/5 overflow-hidden relative">
        {activeChat ? (
          <>
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-background/20 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/20 text-primary font-bold">{activeChat.avatar}</AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-bold">{activeChat.name}</h4>
                  <p className="text-[10px] text-green-500 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                    Online
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Search className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1 p-6 bg-[url('https://wweb.dev/static/966270d744b4e543666f7f2b1d31065a/d992d/whatsapp-wallpaper-dark.png')] bg-repeat opacity-[0.03] absolute inset-0 pointer-events-none" />
            
            <ScrollArea className="flex-1 p-6 relative">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex w-full max-w-[75%] flex-col gap-1",
                      msg.fromMe ? "ml-auto" : "mr-auto"
                    )}
                  >
                    <div
                      className={cn(
                        "p-3 rounded-2xl shadow-sm text-sm relative",
                        msg.fromMe 
                          ? "bg-primary text-primary-foreground rounded-tr-none" 
                          : "bg-muted/80 backdrop-blur-sm border border-white/5 rounded-tl-none"
                      )}
                    >
                      {msg.content}
                      <div className="flex items-center justify-end gap-1 mt-1">
                        <span className="text-[9px] opacity-70">{msg.time}</span>
                        {msg.fromMe && <CheckCheck className="h-3 w-3 opacity-70" />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="p-4 bg-background/40 backdrop-blur-md border-t border-white/5">
              <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
                <Button variant="ghost" size="icon" type="button" className="shrink-0 rounded-full hover:bg-white/10">
                  <Plus className="h-5 w-5" />
                </Button>
                <Input 
                  placeholder="Digite sua mensagem..." 
                  className="bg-background/50 border-white/5 focus-visible:ring-primary/30"
                />
                <Button className="shrink-0 rounded-full h-10 w-10 p-0 shadow-lg shadow-primary/20">
                  <Send className="h-5 w-5" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-4">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <Smartphone className="h-10 w-10 text-primary opacity-50" />
            </div>
            <h3 className="text-xl font-bold">Lider-X WhatsApp</h3>
            <p className="text-muted-foreground max-w-xs">
              Selecione uma conversa para começar a interagir ou envie uma nova mensagem.
            </p>
            <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-[10px] text-muted-foreground flex items-center gap-2">
              <CheckCheck className="h-3 w-3 text-primary" />
              Suas mensagens são protegidas por criptografia de ponta a ponta.
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
