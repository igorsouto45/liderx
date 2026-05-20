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

export const Route = createFileRoute("/_authenticated/qrcode-lider")({
  component: QrCodeLider,
});

function QrCodeLider() {
  const [copied, setCopied] = useState(false);
  const [captureUrl, setCaptureUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCaptureUrl(`${window.location.origin}/cadastro-lider`);
    }
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
    const svg = document.getElementById("qr-code-lider-svg");
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
      downloadLink.download = "qrcode-cadastro-lider.png";
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Recrutamento de Líderes</h1>
        <p className="text-muted-foreground">Utilize este QR Code para que novos líderes possam se cadastrar e enviar documentos.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="dashboard-card p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Smartphone className="h-5 w-5" />
            </div>
            <h3 className="text-xl font-bold">Link de Recrutamento</h3>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Este é o link oficial para o auto-cadastro de novas lideranças. Ao acessar, o líder preencherá seus dados, definirá sua senha de acesso e enviará os documentos necessários.
          </p>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Link de Cadastro</Label>
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
                Abrir Página de Cadastro
              </a>
            </Button>
            <Button className="w-full gap-2" variant="ghost">
              <Share2 className="h-4 w-4" />
              Compartilhar Link
            </Button>
          </div>
        </Card>

        <Card className="dashboard-card p-8 space-y-6 flex flex-col items-center">
          <div className="w-full flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <QrCode className="h-5 w-5" />
            </div>
            <h3 className="text-xl font-bold">QR Code do Líder</h3>
          </div>

          <div className="p-4 bg-white rounded-2xl shadow-2xl shadow-primary/20">
            <QRCodeSVG 
              id="qr-code-lider-svg"
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
            Exiba este QR Code para permitir que candidatos a líder iniciem seu processo de contratação imediatamente.
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
          O que acontece no cadastro?
        </h3>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-2">
            <div className="text-primary font-bold">1. Identificação</div>
            <p className="text-sm text-muted-foreground">O candidato preenche seus dados pessoais, endereço e contato.</p>
          </div>
          <div className="space-y-2">
            <div className="text-primary font-bold">2. Acesso</div>
            <p className="text-sm text-muted-foreground">Ele define seu e-mail e senha para acessar o sistema LiderX.</p>
          </div>
          <div className="space-y-2">
            <div className="text-primary font-bold">3. Documentação</div>
            <p className="text-sm text-muted-foreground">Anexa fotos de documentos e contrato para análise da equipe administrativa.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}