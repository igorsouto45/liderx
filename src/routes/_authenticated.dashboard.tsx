import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Users, 
  UserCheck, 
  UserMinus, 
  TrendingUp, 
  AlertCircle,
  BarChart,
  Target,
  Zap,
  ArrowUpRight
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { 
  BarChart as ReBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["dashboard-data"],
    queryFn: async () => {
      const { data: eleitores } = await supabase
        .from("eleitores")
        .select("status, created_at, bairro");
      
      const counts = {
        total: eleitores?.length || 0,
        apoiadores: eleitores?.filter(e => e.status === "apoiador").length || 0,
        indecisos: eleitores?.filter(e => e.status === "indeciso").length || 0,
        rejeicao: eleitores?.filter(e => e.status === "rejeição").length || 0,
      };

      // Process chart data for last 7 days
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return {
          date: d.toISOString().split("T")[0],
          name: d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", ""),
          cadastros: 0
        };
      });

      eleitores?.forEach(e => {
        const createdAt = new Date(e.created_at).toISOString().split("T")[0];
        const day = last7Days.find(d => d.date === createdAt);
        if (day) day.cadastros++;
      });

      // Calculate trends
      const lastWeekCount = eleitores?.filter(e => {
        const date = new Date(e.created_at);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return date > weekAgo;
      }).length || 0;

      const previousWeekCount = eleitores?.filter(e => {
        const date = new Date(e.created_at);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        return date > twoWeeksAgo && date <= weekAgo;
      }).length || 0;

      const calculateTrend = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? `+${current}` : "0%";
        const diff = ((current - previous) / previous) * 100;
        return `${diff > 0 ? "+" : ""}${diff.toFixed(0)}%`;
      };

      // Most active neighborhood
      const bairrosCount: Record<string, number> = {};
      eleitores?.forEach(e => {
        if (e.bairro) bairrosCount[e.bairro] = (bairrosCount[e.bairro] || 0) + 1;
      });
      const topBairro = Object.entries(bairrosCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

      return {
        stats: counts,
        chartData: last7Days,
        trends: {
          total: calculateTrend(lastWeekCount, previousWeekCount),
          apoiadores: "+0%",
          indecisos: "+0%",
          rejeicao: "+0%",
        },
        topBairro
      };
    }
  });

  const stats = dashboardData?.stats;
  const chartData = dashboardData?.chartData || [];
  const trends = dashboardData?.trends;

  const pieData = [
    { name: "Apoiadores", value: stats?.apoiadores || 0, color: "#10b981" },
    { name: "Indecisos", value: stats?.indecisos || 0, color: "#f59e0b" },
    { name: "Rejeição", value: stats?.rejeicao || 0, color: "#ef4444" },
  ];

  const insights = [
    { text: `O bairro ${dashboardData?.topBairro || "Centro"} possui o maior número de registros.`, type: "alert", icon: AlertCircle },
    { text: "Você precisa definir uma meta de votos nas configurações.", type: "target", icon: Target },
    { text: `A campanha teve ${chartData.reduce((acc, curr) => acc + curr.cadastros, 0)} novos cadastros nos últimos 7 dias.`, type: "trend", icon: TrendingUp },
    { text: "Sincronize seus contatos para aumentar a base eleitoral.", type: "award", icon: Zap },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Painel de Guerra</h1>
          <p className="text-muted-foreground mt-1">Inteligência estratégica em tempo real.</p>
        </div>
        <div className="flex items-center gap-3 bg-primary/10 border border-primary/20 px-4 py-2 rounded-xl">
          <Zap className="h-5 w-5 text-primary animate-pulse" />
          <span className="text-sm font-bold text-primary">IA Operacional Ativa</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          label="Total de Eleitores" 
          value={stats?.total || 0} 
          icon={Users} 
          trend="+15%" 
          color="primary"
        />
        <StatCard 
          label="Apoiadores (Sim)" 
          value={stats?.apoiadores || 0} 
          icon={UserCheck} 
          trend="+8%" 
          color="green"
        />
        <StatCard 
          label="Indecisos" 
          value={stats?.indecisos || 0} 
          icon={BarChart} 
          trend="-2%" 
          color="amber"
        />
        <StatCard 
          label="Rejeição" 
          value={stats?.rejeicao || 0} 
          icon={UserMinus} 
          trend="+1%" 
          color="red"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        {/* Main Chart */}
        <Card className="lg:col-span-4 dashboard-card overflow-hidden">
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <h3 className="font-bold">Evolução de Cadastros</h3>
            <span className="text-xs text-muted-foreground font-mono">ÚLTIMOS 7 DIAS</span>
          </div>
          <div className="h-[350px] w-full p-4">
            <ResponsiveContainer width="100%" height="100%">
              <ReBarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#888888" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#888888" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333", borderRadius: "8px" }}
                  itemStyle={{ color: "#fff" }}
                />
                <Bar dataKey="cadastros" fill="var(--primary)" radius={[4, 4, 0, 0]} barSize={40} />
              </ReBarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* AI Insights & Distribution */}
        <div className="lg:col-span-3 space-y-6">
          {/* Distribution Pie */}
          <Card className="dashboard-card">
            <h3 className="font-bold mb-6">Distribuição de Intenção</h3>
            <div className="h-[200px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold">Base</span>
                <span className="text-xs text-muted-foreground">ELEITORAL</span>
              </div>
            </div>
            <div className="flex justify-between mt-4">
              {pieData.map((item) => (
                <div key={item.name} className="flex flex-col items-center">
                  <span className="text-xs text-muted-foreground">{item.name}</span>
                  <span className="text-sm font-bold" style={{ color: item.color }}>{item.value}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* AI Insights Panel */}
          <Card className="dashboard-card border-primary/20 bg-primary/5">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-5 w-5 text-primary" />
              <h3 className="font-bold">Insights da IA LiderX</h3>
            </div>
            <div className="space-y-4">
              {insights.map((insight, i) => (
                <div key={i} className="flex gap-3 group cursor-default">
                  <div className="mt-0.5 shrink-0">
                    <insight.icon className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors leading-snug">
                    {insight.text}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, trend, color }: any) {
  const colors: any = {
    primary: "text-primary bg-primary/10 border-primary/20",
    green: "text-green-500 bg-green-500/10 border-green-500/20",
    amber: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    red: "text-red-500 bg-red-500/10 border-red-500/20",
  };

  return (
    <Card className="dashboard-card flex items-center justify-between group">
      <div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <div className="flex items-baseline gap-2 mt-1">
          <h3 className="text-2xl font-bold">{value}</h3>
          <span className={cn(
            "text-xs font-bold flex items-center",
            trend.startsWith("+") ? "text-green-500" : "text-red-500"
          )}>
            <ArrowUpRight className={cn("h-3 w-3 mr-0.5", trend.startsWith("-") && "rotate-90")} />
            {trend}
          </span>
        </div>
      </div>
      <div className={cn("p-3 rounded-xl border transition-all group-hover:scale-110", colors[color])}>
        <Icon className="h-5 w-5" />
      </div>
    </Card>
  );
}
