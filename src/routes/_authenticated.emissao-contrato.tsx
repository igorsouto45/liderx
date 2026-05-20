import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { FileText, Download, Printer, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/emissao-contrato")({
  component: EmissaoContrato,
});

function EmissaoContrato() {
  const [selectedLiderId, setSelectedLiderId] = useState<string>("");
  const [generating, setGenerating] = useState(false);

  const { data: liderancas, isLoading } = useQuery({
    queryKey: ["liderancas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("liderancas")
        .select("*")
        .order("nome");
      if (error) throw error;
      return data;
    }
  });

  const selectedLider = liderancas?.find(l => l.id === selectedLiderId);

  const handleGenerateContract = () => {
    if (!selectedLiderId) {
      toast.error("Selecione uma liderança primeiro");
      return;
    }
    
    setGenerating(true);
    // Simulação de geração
    setTimeout(() => {
      setGenerating(false);
      toast.info("Modelo de contrato será gerado aqui. Aguardando o upload do modelo oficial.");
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Emissão de Contrato</h1>
        <p className="text-muted-foreground mt-1">Gere contratos de trabalho para suas lideranças.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 p-6 space-y-4 bg-card/50 backdrop-blur-xl border-white/5">
          <div className="space-y-2">
            <Label>Selecione o Líder</Label>
            <Select value={selectedLiderId} onValueChange={setSelectedLiderId}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha um líder cadastrado" />
              </SelectTrigger>
              <SelectContent>
                {liderancas?.map((lider) => (
                  <SelectItem key={lider.id} value={lider.id}>
                    {lider.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button 
            className="w-full" 
            onClick={handleGenerateContract}
            disabled={!selectedLiderId || generating}
          >
            {generating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileText className="mr-2 h-4 w-4" />
            )}
            Gerar Contrato
          </Button>

          {selectedLider && (
            <div className="pt-4 border-t border-white/5 space-y-3">
              <p className="text-xs font-bold uppercase text-muted-foreground">Dados do Contratado</p>
              <div className="space-y-1">
                <p className="text-sm font-medium">{selectedLider.nome}</p>
                <p className="text-xs text-muted-foreground">CPF: {selectedLider.cpf || "Não informado"}</p>
                <p className="text-xs text-muted-foreground">Endereço: {selectedLider.endereco}, {selectedLider.numero}</p>
                <p className="text-xs text-muted-foreground">{selectedLider.bairro} - {selectedLider.cidade}/{selectedLider.uf}</p>
              </div>
            </div>
          )}
        </Card>

        <Card className="lg:col-span-2 p-6 bg-card/50 backdrop-blur-xl border-white/5 min-h-[500px] flex flex-col items-center justify-center text-center">
          {!selectedLider ? (
            <div className="space-y-4">
              <div className="h-16 w-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-medium">Prévia do Contrato</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  Selecione uma liderança para visualizar a prévia do contrato preenchido.
                </p>
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium">Contrato: {selectedLider.nome}</h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Printer className="mr-2 h-4 w-4" /> Imprimir
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" /> PDF
                  </Button>
                </div>
              </div>
              
              <div className="flex-1 bg-white p-8 text-black text-left shadow-inner rounded overflow-y-auto font-serif">
                <h2 className="text-center font-bold text-xl mb-8 uppercase underline">Contrato Particular de Prestação de Serviços</h2>
                
                <p className="mb-4">
                  Pelo presente instrumento particular, de um lado <strong>CAMPANHA ELEITORAL 2026</strong>, 
                  adiante denominada apenas CONTRATANTE, e de outro lado:
                </p>

                <div className="mb-6 p-4 border border-black/10">
                  <p><strong>NOME:</strong> {selectedLider.nome}</p>
                  <p><strong>CPF:</strong> {selectedLider.cpf || "____________________"}</p>
                  <p><strong>ENDEREÇO:</strong> {selectedLider.endereco || "____________________"}, {selectedLider.numero || "____"}</p>
                  <p><strong>BAIRRO:</strong> {selectedLider.bairro || "____________________"}</p>
                  <p><strong>CIDADE/UF:</strong> {selectedLider.cidade || "____________________"} / {selectedLider.uf || "__"}</p>
                </div>

                <p className="mb-4">
                  Resolvem as partes ajustar a prestação de serviços de mobilização e coordenação de campanha, 
                  conforme as cláusulas a seguir:
                </p>

                <p className="mb-2 italic text-muted-foreground text-center py-20 border-2 border-dashed border-black/10">
                  [ O modelo completo do contrato será inserido aqui ]
                </p>

                <div className="mt-20 flex justify-between">
                  <div className="text-center w-5/12">
                    <div className="border-t border-black mb-1"></div>
                    <p className="text-xs uppercase">Contratante</p>
                  </div>
                  <div className="text-center w-5/12">
                    <div className="border-t border-black mb-1"></div>
                    <p className="text-xs uppercase">{selectedLider.nome}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
