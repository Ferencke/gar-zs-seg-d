import { useState } from 'react';
import { useCustomers } from '@/hooks/useCustomers';
import { useVehicles } from '@/hooks/useVehicles';
import { useServiceRecords } from '@/hooks/useServiceRecords';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Car, Wrench, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { customers } = useCustomers();
  const { vehicles } = useVehicles();
  const { serviceRecords } = useServiceRecords();
  const navigate = useNavigate();

  const pendingServices = serviceRecords.filter((s) => s.status === 'pending').length;
  const inProgressServices = serviceRecords.filter((s) => s.status === 'in-progress').length;
  const completedServices = serviceRecords.filter((s) => s.status === 'completed').length;

  const stats = [
    {
      title: 'Ügyfelek',
      value: customers.length,
      icon: Users,
      color: 'text-primary',
      bg: 'bg-primary/10',
      onClick: () => navigate('/customers'),
    },
    {
      title: 'Autók',
      value: vehicles.length,
      icon: Car,
      color: 'text-accent',
      bg: 'bg-accent/10',
      onClick: () => navigate('/vehicles'),
    },
    {
      title: 'Szervizek',
      value: serviceRecords.length,
      icon: Wrench,
      color: 'text-success',
      bg: 'bg-success/10',
      onClick: () => navigate('/services'),
    },
    {
      title: 'Folyamatban',
      value: inProgressServices,
      icon: TrendingUp,
      color: 'text-warning',
      bg: 'bg-warning/10',
      onClick: () => navigate('/services'),
    },
  ];

  const recentServices = serviceRecords
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <>
      <Header title="Autószerviz Kezelő" />
      <PageContainer>
        <div className="p-4 space-y-6 animate-fade-in">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            {stats.map((stat) => (
              <Card
                key={stat.title}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={stat.onClick}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${stat.bg}`}>
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.title}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Service Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Szerviz státusz</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Függőben</span>
                <span className="font-medium text-warning">{pendingServices}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Folyamatban</span>
                <span className="font-medium text-primary">{inProgressServices}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Kész</span>
                <span className="font-medium text-success">{completedServices}</span>
              </div>
            </CardContent>
          </Card>

          {/* Recent Services */}
          {recentServices.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Legutóbbi szervizek</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {recentServices.map((service) => (
                  <div
                    key={service.id}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{service.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(service.date).toLocaleDateString('hu-HU')}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        service.status === 'completed'
                          ? 'bg-success/10 text-success'
                          : service.status === 'in-progress'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-warning/10 text-warning'
                      }`}
                    >
                      {service.status === 'completed'
                        ? 'Kész'
                        : service.status === 'in-progress'
                        ? 'Folyamatban'
                        : 'Függőben'}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {customers.length === 0 && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-6 text-center">
                <Users className="h-12 w-12 mx-auto text-primary/50 mb-3" />
                <h3 className="font-medium mb-1">Kezdj el dolgozni!</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add hozzá az első ügyfelet az alkalmazáshoz
                </p>
                <button
                  onClick={() => navigate('/customers')}
                  className="text-primary text-sm font-medium"
                >
                  Új ügyfél hozzáadása →
                </button>
              </CardContent>
            </Card>
          )}
        </div>
      </PageContainer>
    </>
  );
}
