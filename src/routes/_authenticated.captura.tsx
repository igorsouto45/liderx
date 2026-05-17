import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  QrCode, 
  Copy, 
  ExternalLink, 
  UserPlus, 
  Smartphone,
  CheckCircle2,
  Share2
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/captura")({
  component: Captura,
});

function Captura() {
  const [copied, setCopied] = useState(false);
  const [captureUrl, setCaptureUrl] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && typeof window !== "undefined") {
        setCaptureUrl(`${window.location.origin}/cadastro?ref=${user.id}`);
      }
    };
    fetchUser();
  }, []);

  const copyToClipboard = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(captureUrl);
      setCopied(true);
      toast.success("Link copiado com sucesso!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadQRCode = () => {
    if (typeof document === "undefined") return;
    const svg = document.getElementById("qr-code-svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = "qrcode-liderx.png";
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Captura de Eleitores</h1>
        <p className="text-muted-foreground">Utilize seu link exclusivo ou QR Code para cadastrar novos apoiadores.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Link Card */}
        <Card className="dashboard-card p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Smartphone className="h-5 w-5" />
            </div>
            <h3 className="text-xl font-bold">Link de Cadastro</h3>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Compartilhe este link em suas redes sociais, WhatsApp ou grupos de campanha. Cada cadastro realizado através dele será atribuído a você.
          </p>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Seu Link Exclusivo</Label>
            <div className="flex gap-2">
              <Input 
                value={captureUrl} 
                readOnly 
                className="bg-black/20 border-white/10 font-mono text-xs"
              />
              <Button size="icon" variant="outline" onClick={copyToClipboard}>
                {copied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button className="w-full gap-2" variant="secondary" asChild>
              <a href={captureUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                Testar Página Pública
              </a>
            </Button>
            <Button className="w-full gap-2" variant="ghost">
              <Share2 className="h-4 w-4" />
              Compartilhar Link
            </Button>
          </div>
        </Card>

        {/* QR Code Card */}
        <Card className="dashboard-card p-8 space-y-6 flex flex-col items-center">
          <div className="w-full flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <QrCode className="h-5 w-5" />
            </div>
            <h3 className="text-xl font-bold">QR Code de Guerra</h3>
          </div>

          <div className="p-4 bg-white rounded-2xl shadow-2xl shadow-primary/20">
            <QRCodeSVG 
              id="qr-code-svg"
              value={captureUrl} 
              size={200}
              level="H"
              includeMargin={false}
              imageSettings={{
                src: "https://raw.githubusercontent.com/lucide-react/lucide/main/icons/shield.png",
                x: undefined,
                y: undefined,
                height: 40,
                width: 40,
                excavate: true,
              }}
            />
          </div>

          <p className="text-xs text-center text-muted-foreground max-w-[250px]">
            Imprima este QR Code em adesivos, santinhos ou banners para facilitar o cadastro presencial.
          </p>

          <Button className="w-full gap-2" onClick={downloadQRCode}>
            <QrCode className="h-4 w-4" />
            Baixar QR Code (PNG)
          </Button>
        </Card>
      </div>

      <Card className="dashboard-card p-8 border-primary/20 bg-primary/5">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-primary" />
          Como funciona a captura?
        </h3>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-2">
            <div className="text-primary font-bold">1. Acesso</div>
            <p className="text-sm text-muted-foreground">O eleitor acessa o link ou escaneia o QR Code através do smartphone.</p>
          </div>
          <div className="space-y-2">
            <div className="text-primary font-bold">2. Cadastro</div>
            <p className="text-sm text-muted-foreground">Preenche o formulário rápido de intenção de voto e informações básicas.</p>
          </div>
          <div className="space-y-2">
            <div className="text-primary font-bold">3. Inteligência</div>
            <p className="text-sm text-muted-foreground">O sistema classifica automaticamente o eleitor e gera alertas para a equipe.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
