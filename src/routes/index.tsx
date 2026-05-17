import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Shield, BarChart3, Users, Zap, ArrowRight, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background selection:bg-primary/30">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-[0_0_15px_-3px_var(--primary)]">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">LiderX</span>
          </div>
          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">Recursos</a>
            <a href="#about" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">Sobre</a>
            <Button variant="ghost" className="text-sm font-medium" onClick={() => navigate({ to: "/login" })}>Login</Button>
            <Button className="rounded-full px-6 shadow-primary/20 shadow-lg" onClick={() => navigate({ to: "/login" })}>Acessar Painel</Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -z-10 h-[500px] w-full -translate-x-1/2 bg-[radial-gradient(circle_at_center,var(--primary)_0%,transparent_70%)] opacity-10" />
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-6 inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary shadow-[0_0_15px_-5px_var(--primary)]">
              <Zap className="mr-1 h-3 w-3" />
              O CRM Político do Futuro
            </div>
            <h1 className="mb-6 text-5xl font-extrabold tracking-tight md:text-7xl">
              Vença as Eleições com <br />
              <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                Dados e Inteligência
              </span>
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground md:text-xl">
              Transforme indecisos em apoiadores. O LiderX é o seu painel de guerra eleitoral inteligente, focado em conversão e controle total da sua base.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" className="h-12 rounded-full px-8 text-base font-semibold shadow-primary/25 shadow-xl" onClick={() => navigate({ to: "/login" })}>
                Começar Agora
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" className="h-12 rounded-full border-white/10 px-8 text-base font-semibold backdrop-blur-sm">
                Ver Demonstração
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-black/40">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">Poder de Fogo Eleitoral</h2>
            <p className="text-muted-foreground">Ferramentas avançadas para quem não aceita perder.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                title: "IA Preditiva",
                description: "Saiba quantos votos você precisa e onde eles estão em tempo real.",
                icon: <BarChart3 className="h-6 w-6 text-primary" />,
              },
              {
                title: "Controle de Lideranças",
                description: "Monitore o desempenho da sua equipe e ranking de conversão.",
                icon: <Users className="h-6 w-6 text-primary" />,
              },
              {
                title: "Atendimento Inteligente",
                description: "Integração total com WhatsApp e fluxos automáticos de conversão.",
                icon: <Zap className="h-6 w-6 text-primary" />,
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="dashboard-card group">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                    {feature.icon}
                  </div>
                  <h3 className="mb-2 text-xl font-bold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats/Trust */}
      <section className="py-24 border-y border-white/5">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {[
              { label: "Votos Mapeados", value: "500k+" },
              { label: "Precisão de Dados", value: "98.5%" },
              { label: "Candidatos Eleitos", value: "120+" },
              { label: "Dados em Tempo Real", value: "24/7" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="mb-2 text-3xl font-bold md:text-4xl text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-primary/5" />
        <div className="container mx-auto px-4">
          <Card className="relative overflow-hidden border-primary/20 bg-black/60 p-12 text-center md:p-20 shadow-2xl">
            <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-primary/20 blur-[100px]" />
            <h2 className="mb-6 text-3xl font-bold md:text-5xl">Pronto para assumir o controle?</h2>
            <p className="mx-auto mb-10 max-w-xl text-muted-foreground md:text-lg">
              Não deixe sua campanha ao acaso. Use a mesma tecnologia que elege governadores e prefeitos.
            </p>
            <Button size="lg" className="h-12 rounded-full px-10 text-base font-bold shadow-primary/30 shadow-2xl" onClick={() => navigate({ to: "/login" })}>
              Acessar Painel de Guerra
            </Button>
            <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-primary" /> Painel Exclusivo</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-primary" /> Segurança de Dados</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-primary" /> IA Integrada</span>
            </div>
          </Card>
        </div>
      </section>

      <footer className="py-12 border-t border-white/5">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Shield className="h-5 w-5 text-primary" />
            <span className="text-lg font-bold tracking-tight">LiderX</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2024 LiderX - CRM Político Inteligente. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
