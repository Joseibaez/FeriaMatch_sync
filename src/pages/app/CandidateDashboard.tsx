import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Clock, Building2, MapPin, CheckCircle, XCircle, Hourglass } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface BookingWithDetails {
  id: string;
  status: string;
  created_at: string;
  slot_allocation: {
    id: string;
    company_name: string;
    sector: string | null;
    stand_number: string | null;
    slot: {
      id: string;
      start_time: string;
      end_time: string;
      event: {
        id: string;
        title: string;
        event_date: string;
      };
    };
  };
}

export default function CandidateDashboard() {
  const { user } = useAuth();

  // Fetch candidate's bookings with all related info
  const { data: bookings, isLoading } = useQuery({
    queryKey: ['candidate-bookings', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get bookings for this user
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('id, status, created_at, slot_allocation_id')
        .eq('user_id', user.id);

      if (bookingsError) throw bookingsError;
      if (!bookingsData?.length) return [];

      // Get slot allocations
      const allocationIds = bookingsData.map(b => b.slot_allocation_id);
      const { data: allocations, error: allocError } = await supabase
        .from('slot_allocations')
        .select('id, company_name, sector, stand_number, slot_id')
        .in('id', allocationIds);

      if (allocError) throw allocError;

      // Get slots
      const slotIds = allocations?.map(a => a.slot_id) || [];
      const { data: slots, error: slotsError } = await supabase
        .from('slots')
        .select('id, start_time, end_time, event_id')
        .in('id', slotIds);

      if (slotsError) throw slotsError;

      // Get events
      const eventIds = [...new Set(slots?.map(s => s.event_id) || [])];
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('id, title, event_date')
        .in('id', eventIds);

      if (eventsError) throw eventsError;

      // Combine all data
      const result: BookingWithDetails[] = bookingsData.map(booking => {
        const allocation = allocations?.find(a => a.id === booking.slot_allocation_id);
        const slot = slots?.find(s => s.id === allocation?.slot_id);
        const event = events?.find(e => e.id === slot?.event_id);

        return {
          id: booking.id,
          status: booking.status,
          created_at: booking.created_at,
          slot_allocation: {
            id: allocation?.id || '',
            company_name: allocation?.company_name || '',
            sector: allocation?.sector || null,
            stand_number: allocation?.stand_number || null,
            slot: {
              id: slot?.id || '',
              start_time: slot?.start_time || '',
              end_time: slot?.end_time || '',
              event: {
                id: event?.id || '',
                title: event?.title || '',
                event_date: event?.event_date || '',
              },
            },
          },
        };
      });

      // Sort by date
      return result.sort((a, b) => {
        const dateA = new Date(`${a.slot_allocation.slot.event.event_date}T${a.slot_allocation.slot.start_time}`);
        const dateB = new Date(`${b.slot_allocation.slot.event.event_date}T${b.slot_allocation.slot.start_time}`);
        return dateA.getTime() - dateB.getTime();
      });
    },
    enabled: !!user?.id,
  });

  const formatTime = (timestamp: string) => {
    try {
      return format(new Date(timestamp), 'HH:mm', { locale: es });
    } catch {
      return '--:--';
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "EEEE d 'de' MMMM, yyyy", { locale: es });
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Confirmada
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Hourglass className="h-3 w-3 mr-1" />
            Pendiente
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Rechazada
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Stats
  const totalBookings = bookings?.length || 0;
  const confirmedBookings = bookings?.filter(b => b.status === 'confirmed').length || 0;
  const pendingBookings = bookings?.filter(b => b.status === 'pending').length || 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Mi Panel</h1>
        <p className="text-muted-foreground">
          Gestiona tus entrevistas agendadas
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold">{totalBookings}</div>
            <p className="text-xs text-muted-foreground">Entrevistas</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-medium">Confirmadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold text-green-600">{confirmedBookings}</div>
            <p className="text-xs text-muted-foreground">Listas</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-yellow-200 bg-yellow-50/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Hourglass className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold text-yellow-600">{pendingBookings}</div>
            <p className="text-xs text-muted-foreground">Por confirmar</p>
          </CardContent>
        </Card>
      </div>

      {/* Bookings List */}
      <Card>
        <CardHeader>
          <CardTitle>Mis Entrevistas</CardTitle>
          <CardDescription>Lista de todas tus entrevistas agendadas</CardDescription>
        </CardHeader>
        <CardContent>
          {bookings && bookings.length > 0 ? (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border bg-background"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-foreground">
                        {booking.slot_allocation.company_name}
                      </span>
                      {getStatusBadge(booking.status)}
                    </div>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{formatDate(booking.slot_allocation.slot.event.event_date)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        <span>
                          {formatTime(booking.slot_allocation.slot.start_time)} - {formatTime(booking.slot_allocation.slot.end_time)}
                        </span>
                      </div>
                      {booking.slot_allocation.stand_number && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>Stand {booking.slot_allocation.stand_number}</span>
                        </div>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground">
                      {booking.slot_allocation.slot.event.title}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <h3 className="font-semibold text-foreground mb-1">No tienes entrevistas agendadas</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Explora los eventos disponibles y agenda entrevistas con las empresas participantes.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}