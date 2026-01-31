import { useMemo, useState } from 'react';
import { useServiceRecords } from '@/hooks/useServiceRecords';
import { useVehicles } from '@/hooks/useVehicles';
import { useCustomers } from '@/hooks/useCustomers';
import { useAppointments } from '@/hooks/useAppointments';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Wrench, Car, DollarSign, Users, Database, CalendarClock } from 'lucide-react';

export default function Statistics() {
  const { serviceRecords } = useServiceRecords();
  const { vehicles } = useVehicles();
  const { customers } = useCustomers();
  const { appointments } = useAppointments();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('all');

  // Year/month filter state
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  // Available years for filter
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    years.add(currentYear);
    serviceRecords.forEach(s => years.add(new Date(s.date).getFullYear()));
    vehicles.forEach(v => years.add(new Date(v.createdAt).getFullYear()));
    customers.forEach(c => years.add(new Date(c.createdAt).getFullYear()));
    return Array.from(years).sort((a, b) => b - a);
  }, [serviceRecords, vehicles, customers, currentYear]);

  const months = [
    { value: '0', label: 'Január' },
    { value: '1', label: 'Február' },
    { value: '2', label: 'Március' },
    { value: '3', label: 'Április' },
    { value: '4', label: 'Május' },
    { value: '5', label: 'Június' },
    { value: '6', label: 'Július' },
    { value: '7', label: 'Augusztus' },
    { value: '8', label: 'Szeptember' },
    { value: '9', label: 'Október' },
    { value: '10', label: 'November' },
    { value: '11', label: 'December' },
  ];

  // Customer spending per vehicle stats
  const customerVehicleSpending = useMemo(() => {
    if (selectedCustomerId === 'all') return null;

    const customerVehicles = vehicles.filter(v => v.customerId === selectedCustomerId);
    return customerVehicles.map(vehicle => {
      const vehicleServices = serviceRecords.filter(s => s.vehicleId === vehicle.id);
      const totalSpent = vehicleServices.reduce((sum, s) => sum + (s.cost || 0), 0);
      const serviceCount = vehicleServices.length;
      return {
        vehicleId: vehicle.id,
        licensePlate: vehicle.licensePlate,
        brand: vehicle.brand,
        model: vehicle.model,
        totalSpent,
        serviceCount
      };
    }).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [selectedCustomerId, vehicles, serviceRecords]);

  // Filtered stats based on year/month selection
  const filteredStats = useMemo(() => {
    const year = parseInt(selectedYear);
    const month = selectedMonth !== 'all' ? parseInt(selectedMonth) : null;

    const filterByDate = (dateStr: string) => {
      const d = new Date(dateStr);
      const matchesYear = d.getFullYear() === year;
      const matchesMonth = month === null || d.getMonth() === month;
      return matchesYear && matchesMonth;
    };

    // Revenue for selected period
    const periodRevenue = serviceRecords
      .filter(s => filterByDate(s.date) && s.status === 'completed')
      .reduce((sum, s) => sum + (s.cost || 0), 0);

    // Serviced vehicles count
    const servicedVehicleIds = new Set(
      serviceRecords
        .filter(s => filterByDate(s.date))
        .map(s => s.vehicleId)
    );
    const servicedVehiclesCount = servicedVehicleIds.size;

    // Service count
    const serviceCount = serviceRecords.filter(s => filterByDate(s.date)).length;

    // New vehicles registered
    const newVehicles = vehicles.filter(v => filterByDate(v.createdAt)).length;

    // New customers registered
    const newCustomers = customers.filter(c => filterByDate(c.createdAt)).length;

    return {
      periodRevenue,
      servicedVehiclesCount,
      serviceCount,
      newVehicles,
      newCustomers,
    };
  }, [selectedYear, selectedMonth, serviceRecords, vehicles, customers]);

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

  // Total records for summary
  const totalRecords = customers.length + vehicles.length + serviceRecords.length + appointments.length;

  return (
    <>
      <Header title="Statisztikák" />
      <PageContainer>
        <div className="p-4 space-y-4 animate-fade-in">
          {/* Data Summary - moved from DataManagement */}
          <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Database className="h-5 w-5 text-primary" />
                </div>
                Adatok összegzése
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex justify-between p-3 bg-gradient-to-r from-primary/10 to-transparent rounded-lg border border-primary/10">
                  <span className="text-muted-foreground">Ügyfelek</span>
                  <span className="font-bold text-primary">{customers.length}</span>
                </div>
                <div className="flex justify-between p-3 bg-gradient-to-r from-accent/10 to-transparent rounded-lg border border-accent/10">
                  <span className="text-muted-foreground">Járművek</span>
                  <span className="font-bold text-accent">{vehicles.length}</span>
                </div>
                <div className="flex justify-between p-3 bg-gradient-to-r from-success/10 to-transparent rounded-lg border border-success/10">
                  <span className="text-muted-foreground">Szervizek</span>
                  <span className="font-bold text-success">{serviceRecords.length}</span>
                </div>
                <div className="flex justify-between p-3 bg-gradient-to-r from-warning/10 to-transparent rounded-lg border border-warning/10">
                  <span className="text-muted-foreground">Előjegyzések</span>
                  <span className="font-bold text-warning">{appointments.length}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3 text-center">
                Összesen <span className="font-semibold text-foreground">{totalRecords}</span> bejegyzés
              </p>
            </CardContent>
          </Card>

          {/* Year/Month Filter */}
          <Card className="border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-primary" />
                Időszak szűrő
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="Év..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableYears.map(year => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger>
                    <SelectValue placeholder="Hónap..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Összes hónap</SelectItem>
                    {months.map(month => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtered Period Stats */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <div className="p-3 rounded-lg bg-gradient-to-r from-success/10 to-transparent border border-success/20">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-success" />
                    <span className="text-xs text-muted-foreground">Bevétel</span>
                  </div>
                  <p className="text-lg font-bold text-success mt-1">
                    {filteredStats.periodRevenue.toLocaleString()} Ft
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-gradient-to-r from-primary/10 to-transparent border border-primary/20">
                  <div className="flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-primary" />
                    <span className="text-xs text-muted-foreground">Szervizek</span>
                  </div>
                  <p className="text-lg font-bold text-primary mt-1">
                    {filteredStats.serviceCount}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-gradient-to-r from-accent/10 to-transparent border border-accent/20">
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4 text-accent" />
                    <span className="text-xs text-muted-foreground">Szervizelt járművek</span>
                  </div>
                  <p className="text-lg font-bold text-accent mt-1">
                    {filteredStats.servicedVehiclesCount}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-gradient-to-r from-warning/10 to-transparent border border-warning/20">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-warning" />
                    <span className="text-xs text-muted-foreground">Új ügyfelek</span>
                  </div>
                  <p className="text-lg font-bold text-warning mt-1">
                    {filteredStats.newCustomers}
                  </p>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-gradient-to-r from-primary/5 to-accent/5 border border-border/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Car className="h-3 w-3" />
                    Új járművek regisztrálva
                  </span>
                  <span className="font-bold text-primary">{filteredStats.newVehicles}</span>
                </div>
              </div>
            </CardContent>
          </Card>

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

          {/* Customer Vehicle Spending Filter */}
          <Card className="border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Ügyfél autónkénti költése
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Válassz ügyfelet..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Összes ügyfél</SelectItem>
                  {customers.map(customer => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedCustomerId !== 'all' && customerVehicleSpending && (
                <div className="space-y-2">
                  {customerVehicleSpending.length > 0 ? (
                    customerVehicleSpending.map(vehicle => (
                      <div 
                        key={vehicle.vehicleId} 
                        className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-primary/5 to-transparent border border-border/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Car className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{vehicle.licensePlate}</p>
                            <p className="text-xs text-muted-foreground">{vehicle.brand} {vehicle.model}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-success">{vehicle.totalSpent.toLocaleString()} Ft</p>
                          <p className="text-xs text-muted-foreground">{vehicle.serviceCount} szerviz</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-4">
                      Ennek az ügyfélnek nincs járműve
                    </p>
                  )}
                  
                  {customerVehicleSpending.length > 0 && (
                    <div className="flex justify-between p-3 rounded-lg bg-success/10 border border-success/20 font-bold">
                      <span>Összes költés:</span>
                      <span className="text-success">
                        {customerVehicleSpending.reduce((sum, v) => sum + v.totalSpent, 0).toLocaleString()} Ft
                      </span>
                    </div>
                  )}
                </div>
              )}
              
              {selectedCustomerId === 'all' && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Válassz egy ügyfelet a járművenkénti költés megtekintéséhez
                </p>
              )}
            </CardContent>
          </Card>

          {/* Monthly Revenue Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Havi bevétel (utolsó 6 hónap)</CardTitle>
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
