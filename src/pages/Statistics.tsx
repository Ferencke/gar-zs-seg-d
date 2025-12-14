import { useMemo } from 'react';
import { useServiceRecords } from '@/hooks/useServiceRecords';
import { useVehicles } from '@/hooks/useVehicles';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Wrench, Car, DollarSign } from 'lucide-react';

export default function Statistics() {
  const { serviceRecords } = useServiceRecords();
  const { vehicles } = useVehicles();

  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    // Monthly revenue for last 6 months
    const monthlyRevenue: { month: string; revenue: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(thisYear, thisMonth - i, 1);
      const monthName = date.toLocaleDateString('hu-HU', { month: 'short' });
      const revenue = serviceRecords
        .filter(s => {
          const sDate = new Date(s.date);
          return sDate.getMonth() === date.getMonth() && sDate.getFullYear() === date.getFullYear();
        })
        .reduce((sum, s) => sum + (s.cost || 0), 0);
      monthlyRevenue.push({ month: monthName, revenue });
    }

    // Total revenue
    const totalRevenue = serviceRecords.reduce((sum, s) => sum + (s.cost || 0), 0);

    // This month revenue
    const thisMonthRevenue = serviceRecords
      .filter(s => {
        const sDate = new Date(s.date);
        return sDate.getMonth() === thisMonth && sDate.getFullYear() === thisYear;
      })
      .reduce((sum, s) => sum + (s.cost || 0), 0);

    // Most common repairs
    const repairCounts: Record<string, number> = {};
    serviceRecords.forEach(s => {
      const desc = s.description.toLowerCase().trim();
      repairCounts[desc] = (repairCounts[desc] || 0) + 1;
    });
    const topRepairs = Object.entries(repairCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), count }));

    // Repairs by vehicle brand
    const brandCounts: Record<string, number> = {};
    serviceRecords.forEach(s => {
      const vehicle = vehicles.find(v => v.id === s.vehicleId);
      if (vehicle) {
        brandCounts[vehicle.brand] = (brandCounts[vehicle.brand] || 0) + 1;
      }
    });
    const brandStats = Object.entries(brandCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([brand, count]) => ({ brand, count }));

    // Status breakdown
    const statusCounts = {
      completed: serviceRecords.filter(s => s.status === 'completed').length,
      inProgress: serviceRecords.filter(s => s.status === 'in-progress').length,
      pending: serviceRecords.filter(s => s.status === 'pending').length,
    };

    return {
      monthlyRevenue,
      totalRevenue,
      thisMonthRevenue,
      topRepairs,
      brandStats,
      statusCounts,
      totalServices: serviceRecords.length,
      totalVehicles: vehicles.length,
    };
  }, [serviceRecords, vehicles]);

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))', 'hsl(var(--muted-foreground))'];

  return (
    <>
      <Header title="Statisztikák" />
      <PageContainer>
        <div className="p-4 space-y-4 animate-fade-in">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-success/20">
                    <DollarSign className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Összes bevétel</p>
                    <p className="text-lg font-bold text-success">{stats.totalRevenue.toLocaleString()} Ft</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">E havi bevétel</p>
                    <p className="text-lg font-bold text-primary">{stats.thisMonthRevenue.toLocaleString()} Ft</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-warning/20">
                    <Wrench className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Összes szerviz</p>
                    <p className="text-lg font-bold text-warning">{stats.totalServices}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-accent/20">
                    <Car className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Járművek</p>
                    <p className="text-lg font-bold text-accent">{stats.totalVehicles}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Revenue Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Havi bevétel</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.monthlyRevenue.some(m => m.revenue > 0) ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={stats.monthlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                    <Tooltip 
                      formatter={(value: number) => [`${value.toLocaleString()} Ft`, 'Bevétel']}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">Nincs elegendő adat</p>
              )}
            </CardContent>
          </Card>

          {/* Top Repairs */}
          <Card className="border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Wrench className="h-4 w-4 text-primary" />
                Leggyakoribb javítások
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.topRepairs.length > 0 ? (
                <div className="space-y-2">
                  {stats.topRepairs.map((repair, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-gradient-to-r from-primary/5 to-transparent">
                      <span className="text-sm truncate flex-1">{repair.name}</span>
                      <span className="text-sm font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full ml-2">
                        {repair.count}x
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">Nincs adat</p>
              )}
            </CardContent>
          </Card>

          {/* Brand Distribution */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Szervizelt márkák</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.brandStats.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={stats.brandStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="count"
                      nameKey="brand"
                      label={({ brand, percent }) => `${brand} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {stats.brandStats.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number, name: string) => [`${value} db`, name]}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">Nincs adat</p>
              )}
            </CardContent>
          </Card>

          {/* Status Breakdown */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Szerviz státuszok</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 rounded-lg bg-success/10">
                  <p className="text-2xl font-bold text-success">{stats.statusCounts.completed}</p>
                  <p className="text-xs text-muted-foreground">Kész</p>
                </div>
                <div className="p-3 rounded-lg bg-primary/10">
                  <p className="text-2xl font-bold text-primary">{stats.statusCounts.inProgress}</p>
                  <p className="text-xs text-muted-foreground">Folyamatban</p>
                </div>
                <div className="p-3 rounded-lg bg-warning/10">
                  <p className="text-2xl font-bold text-warning">{stats.statusCounts.pending}</p>
                  <p className="text-xs text-muted-foreground">Függőben</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </>
  );
}
