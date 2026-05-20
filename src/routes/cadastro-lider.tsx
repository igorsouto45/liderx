import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Shield, CheckCircle2, Upload, File, X, Loader2 } from "lucide-react";
import { onlyDigits, getLatLongFromCep, cn } from "@/lib/utils";

export const Route = createFileRoute("/cadastro-lider")({
  component: CadastroLider,
});

function CadastroLider() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<{file: File, id: string, name: string}[]>([]);

  const [form, setForm] = useState({
    nome: "",
    email: "",
    senha: "",
    telefone: "",
    cpf: "",
    cep: "",
    endereco: "",
    bairro: "",
    cidade: "",
    uf: "",
    numero: "",
    complemento: "",
    lgpd_consent: false,
  });

  const handleCepBlur = async () => {
    const cep = onlyDigits(form.cep);
    if (cep.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`).then(r => r.json());
      if (!res.erro) {
        setForm(f => ({
          ...f,
          endereco: res.logradouro,
          bairro: res.bairro,
          cidade: res.localidade,
          uf: res.uf,
        }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(file => ({
        file,
        id: Math.random().toString(36).substring(7),
        name: file.name
      }));
      setFiles([...files, ...newFiles]);
    }
  };

  const removeFile = (id: string) => {
    setFiles(files.filter(f => f.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.lgpd_consent) return toast.error("Aceite os termos da LGPD");
    if (form.senha.length < 6) return toast.error("A senha deve ter pelo menos 6 caracteres");
    
    setLoading(true);
    try {
      // 1. Criar usuário no Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.senha,
        options: {
          data: {
            nome: form.nome,
            tipo: 'líder'
          }
        }
      });

      if (authError) throw authError;
      const authUserId = authData.user?.id;

      if (!authUserId) throw new Error("Erro ao criar usuário de acesso");

      // 2. Obter coordenadas
      const coords = await getLatLongFromCep(form.cep, form.endereco, form.bairro, form.cidade);
      
      // 3. Inserir na tabela liderancas
      const { data: liderData, error: liderError } = await supabase.from("liderancas").insert({
        nome: form.nome,
        email: form.email,
        telefone: onlyDigits(form.telefone),
        cpf: onlyDigits(form.cpf),
        cep: onlyDigits(form.cep),
        endereco: form.endereco,
        bairro: form.bairro,
        cidade: form.cidade,
        uf: form.uf,
        numero: form.numero,
        complemento: form.complemento,
        auth_user_id: authUserId,
        lgpd_consent: form.lgpd_consent,
        latitude: coords?.lat,
        longitude: coords?.lng,
      }).select().single();

      if (liderError) throw liderError;
      const liderId = liderData.id;

      // 4. Upload de arquivos
      if (files.length > 0) {
        setUploading(true);
        for (const fileObj of files) {
          const fileExt = fileObj.name.split('.').pop();
          const filePath = `${liderId}/${Math.random()}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('documentos-liderancas')
            .upload(filePath, fileObj.file);

          if (!uploadError) {
            await supabase.from('documentos_lideranca').insert({
              lider_id: liderId,
              nome_arquivo: fileObj.name,
              caminho_arquivo: filePath,
              tipo_arquivo: fileObj.file.type,
              tamanho_arquivo: fileObj.file.size
            });
          }
        }
      }

      setSuccess(true);
      toast.success("Cadastro realizado com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao cadastrar: " + error.message);
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8 space-y-6 bg-card/50 backdrop-blur-xl border-white/5">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
              <CheckCircle2 className="h-10 w-10" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white">Cadastro de Líder Realizado!</h2>
          <p className="text-muted-foreground">
            Sua conta de acesso foi criada. Agora você já pode entrar no sistema com seu e-mail e senha para começar o trabalho de campo.
          </p>
          <Button className="w-full" onClick={() => window.location.href = '/login'}>Acessar o Sistema</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
              <Shield className="h-7 w-7 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Seja um Líder LiderX</h1>
          <p className="text-muted-foreground">Faça seu cadastro para gerenciar sua equipe e apoiar nossa causa.</p>
        </div>

        <Card className="border-white/5 bg-card/50 backdrop-blur-xl overflow-hidden">
          <CardHeader className="bg-white/5">
            <CardTitle className="text-lg">Dados do Candidato</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label>Nome Completo</Label>
                  <Input 
                    required 
                    value={form.nome} 
                    onChange={e => setForm({...form, nome: e.target.value})} 
                    placeholder="Nome completo"
                  />
                </div>

                <div className="space-y-2">
                  <Label>E-mail (Será seu login)</Label>
                  <Input 
                    type="email"
                    required 
                    value={form.email} 
                    onChange={e => setForm({...form, email: e.target.value})} 
                    placeholder="email@exemplo.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Defina sua Senha</Label>
                  <Input 
                    type="password"
                    required 
                    value={form.senha} 
                    onChange={e => setForm({...form, senha: e.target.value})} 
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>

                <div className="space-y-2">
                  <Label>WhatsApp</Label>
                  <Input 
                    required 
                    value={form.telefone} 
                    onChange={e => setForm({...form, telefone: e.target.value})} 
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div className="space-y-2">
                  <Label>CPF</Label>
                  <Input 
                    required 
                    value={form.cpf} 
                    onChange={e => setForm({...form, cpf: e.target.value})} 
                    placeholder="000.000.000-00"
                  />
                </div>
              </div>

              <div className="space-y-4 border-t border-white/5 pt-4">
                <Label className="text-primary font-bold">Endereço Residencial</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="col-span-2">
                    <Label>CEP</Label>
                    <Input 
                      required 
                      value={form.cep} 
                      onChange={e => setForm({...form, cep: e.target.value})} 
                      onBlur={handleCepBlur}
                      placeholder="00000-000"
                    />
                  </div>
                  <div className="col-span-2 md:col-span-3">
                    <Label>Endereço</Label>
                    <Input value={form.endereco} onChange={e => setForm({...form, endereco: e.target.value})} />
                  </div>
                  <div className="col-span-1">
                    <Label>Número</Label>
                    <Input value={form.numero} onChange={e => setForm({...form, numero: e.target.value})} />
                  </div>
                  <div className="col-span-2">
                    <Label>Bairro</Label>
                    <Input value={form.bairro} onChange={e => setForm({...form, bairro: e.target.value})} />
                  </div>
                  <div className="col-span-2">
                    <Label>Cidade</Label>
                    <Input value={form.cidade} onChange={e => setForm({...form, cidade: e.target.value})} />
                  </div>
                  <div className="col-span-1">
                    <Label>UF</Label>
                    <Input value={form.uf} maxLength={2} onChange={e => setForm({...form, uf: e.target.value.toUpperCase()})} />
                  </div>
                </div>
              </div>

              <div className="space-y-4 border-t border-white/5 pt-4">
                <div className="flex items-center justify-between">
                  <Label className="text-primary font-bold">Documentação para Contratação</Label>
                  <Badge variant="outline" className="text-[10px] uppercase">Opcional agora</Badge>
                </div>
                
                <div className="relative border-2 border-dashed border-white/10 rounded-xl p-6 text-center hover:border-primary/50 transition-colors">
                  <Input 
                    type="file" 
                    multiple 
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                    onChange={handleFileChange}
                  />
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">Clique ou arraste seus documentos aqui</p>
                  <p className="text-xs text-muted-foreground mt-1">RG, CPF, Comprovante de Residência ou Contrato</p>
                </div>

                {files.length > 0 && (
                  <div className="grid gap-2">
                    {files.map(fileObj => (
                      <div key={fileObj.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                        <div className="flex items-center gap-3">
                          <File className="h-4 w-4 text-primary" />
                          <span className="text-sm truncate max-w-[200px]">{fileObj.name}</span>
                        </div>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => removeFile(fileObj.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-start space-x-3 pt-4 border-t border-white/5">
                <Checkbox 
                  id="lgpd" 
                  checked={form.lgpd_consent} 
                  onCheckedChange={checked => setForm({...form, lgpd_consent: !!checked})} 
                />
                <div className="grid gap-1.5 leading-none">
                  <label htmlFor="lgpd" className="text-sm font-medium leading-none cursor-pointer">
                    Aceito os termos da LGPD
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Autorizo o uso dos meus dados para fins de contratação e comunicação da campanha.
                  </p>
                </div>
              </div>

              <Button type="submit" className="w-full h-12 text-lg shadow-lg shadow-primary/20" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {uploading ? "Enviando arquivos..." : "Processando..."}
                  </span>
                ) : "Finalizar meu Cadastro"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}