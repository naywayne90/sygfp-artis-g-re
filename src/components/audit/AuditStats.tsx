import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuditStats, ENTITY_TYPES, ACTION_TYPES } from "@/hooks/useAuditJournal";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Activity, FileText, Users, Clock } from "lucide-react";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d", "#ffc658", "#ff7c7c"];

export function AuditStats() {
  const stats = useAuditStats();

  if (stats.isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Chargement des statistiques...</div>;
  }

  const data = stats.data;
  if (!data) return null;

  // Préparer les données pour les graphiques
  const entityData = Object.entries(data.byEntityType).map(([key, value]) => ({
    name: ENTITY_TYPES.find(e => e.value === key)?.label || key,
    value,
  })).sort((a, b) => b.value - a.value).slice(0, 8);

  const actionData = Object.entries(data.byAction).map(([key, value]) => ({
    name: ACTION_TYPES.find(a => a.value === key)?.label || key,
    value,
  })).sort((a, b) => b.value - a.value).slice(0, 8);

  const dayData = Object.entries(data.byDay).map(([day, count]) => ({
    day: day.slice(5), // MM-DD
    count,
  }));

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total logs</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.total}</div>
            <p className="text-xs text-muted-foreground">Cet exercice</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Types d'entités</CardTitle>
            <FileText className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(data.byEntityType).length}</div>
            <p className="text-xs text-muted-foreground">Entités différentes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Actions</CardTitle>
            <Users className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(data.byAction).length}</div>
            <p className="text-xs text-muted-foreground">Types d'actions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Aujourd'hui</CardTitle>
            <Clock className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.byDay[new Date().toISOString().split("T")[0]] || 0}
            </div>
            <p className="text-xs text-muted-foreground">Actions</p>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Activité 7 derniers jours */}
        <Card>
          <CardHeader>
            <CardTitle>Activité des 7 derniers jours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dayData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Par type d'entité */}
        <Card>
          <CardHeader>
            <CardTitle>Par type d'entité</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={entityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {entityData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Par action */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Par type d'action</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={actionData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
