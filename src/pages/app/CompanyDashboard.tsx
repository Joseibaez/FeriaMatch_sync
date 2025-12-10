import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2, Calendar, Users, Clock, MapPin, ExternalLink, FileText, Linkedin } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface SlotAllocationWithBooking {
  id: string;
  company_name: string;
  sector: string | null;
  stand_number: string | null;
  interviewer_name: string | null;
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
  booking: {
    id: string;
    status: string;
    candidate: {
      id: string;
      full_name: string | null;
      email: string;
      linkedin_url: string | null;
      cv_url: string | null;
      phone: string | null;
    };
  } | null;
}

export default function CompanyDashboard() {
  const { user } = useAuth();

  // Fetch the recruiter's profile to get company_name
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['recruiter-profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('company_name, full_name')
        .eq('id', user!.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch slot allocations for the company with bookings and candidate info
  const { data: allocations, isLoading: allocationsLoading } = useQuery({
    queryKey: ['company-allocations', profile?.company_name],
    queryFn: async () => {
      if (!profile?.company_name) return [];

      // First get all slot allocations for this company
      const { data: slotAllocations, error: allocError } = await supabase
        .from('slot_allocations')
        .select(`
          id,
          company_name,
          sector,
          stand_number,
          interviewer_name,
          slot_id
        `)
        .eq('company_name', profile.company_name);

      if (allocError) throw allocError;
      if (!slotAllocations?.length) return [];

      // Get slot details with events
      const slotIds = slotAllocations.map(a => a.slot_id);
      const { data: slots, error: slotsError } = await supabase
        .from('slots')
        .select(`
          id,
          start_time,
          end_time,
          event_id
        `)
        .in('id', slotIds);

      if (slotsError) throw slotsError;

      // Get events
      const eventIds = [...new Set(slots?.map(s => s.event_id) || [])];
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('id, title, event_date')
        .in('id', eventIds);

      if (eventsError) throw eventsError;

      // Get bookings for these allocations
      const allocationIds = slotAllocations.map(a => a.id);
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('id, status, user_id, slot_allocation_id')
        .in('slot_allocation_id', allocationIds);

      if (bookingsError) throw bookingsError;

      // Get candidate profiles for bookings
      const candidateIds = bookings?.map(b => b.user_id) || [];
      let candidates: any[] = [];
      if (candidateIds.length > 0) {
        const { data: candidateData, error: candidatesError } = await supabase
          .from('profiles')
          .select('id, full_name, email, linkedin_url, cv_url, phone')
          .in('id', candidateIds);

        if (candidatesError) throw candidatesError;
        candidates = candidateData || [];
      }

      // Combine all data
      const result: SlotAllocationWithBooking[] = slotAllocations.map(allocation => {
        const slot = slots?.find(s => s.id === allocation.slot_id);
        const event = events?.find(e => e.id === slot?.event_id);
        const booking = bookings?.find(b => b.slot_allocation_id === allocation.id);
        const candidate = booking ? candidates.find(c => c.id === booking.user_id) : null;

        return {
          id: allocation.id,
          company_name: allocation.company_name,
          sector: allocation.sector,
          stand_number: allocation.stand_number,
          interviewer_name: allocation.interviewer_name,
          slot: slot ? {
            id: slot.id,
            start_time: slot.start_time,
            end_time: slot.end_time,
            event: event ? {
              id: event.id,
              title: event.title,
              event_date: event.event_date,
            } : { id: '', title: 'Evento desconocido', event_date: '' },
          } : { id: '', start_time: '', end_time: '', event: { id: '', title: '', event_date: '' } },
          booking: booking ? {
            id: booking.id,
            status: booking.status,
            candidate: candidate ? {
              id: candidate.id,
              full_name: candidate.full_name,
              email: candidate.email,
              linkedin_url: candidate.linkedin_url,
              cv_url: candidate.cv_url,
              phone: candidate.phone,
            } : { id: '', full_name: null, email: '', linkedin_url: null, cv_url: null, phone: null },
          } : null,
        };
      });

      // Sort by date and time
      return result.sort((a, b) => {
        const dateA = new Date(`${a.slot.event.event_date}T${a.slot.start_time}`);
        const dateB = new Date(`${b.slot.event.event_date}T${b.slot.start_time}`);
        return dateA.getTime() - dateB.getTime();
      });
    },
    enabled: !!profile?.company_name,
  });

  const isLoading = profileLoading || allocationsLoading;
  
  // Stats
  const totalSlots = allocations?.length || 0;
  const bookedSlots = allocations?.filter(a => a.booking)?.length || 0;
  const uniqueEvents = new Set(allocations?.map(a => a.slot.event.id)).size;

  // Get initials for avatar
  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Format time from timestamp
  const formatTime = (timestamp: string) => {
    try {
      return format(new Date(timestamp), 'HH:mm', { locale: es });
    } catch {
      return '--:--';
    }
  };

  // Format date
  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "EEEE d 'de' MMMM", { locale: es });
    } catch {
      return dateStr;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  // Empty state - no company name or no allocations
  if (!profile?.company_name || totalSlots === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard de Empresa</h1>
          <p className="text-muted-foreground">
            Gestiona tus entrevistas y candidatos
          </p>
        </div>

        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Building2 className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Hola {profile?.full_name || profile?.company_name || 'Empresa'}, tu agenda aún no está configurada
            </h2>
            <p className="text-muted-foreground max-w-md">
              {!profile?.company_name 
                ? 'Por favor, actualiza tu perfil con el nombre de tu empresa para ver tus slots asignados.'
                : 'Aún no tienes slots de entrevista asignados. Contacta al organizador del evento para que te asignen horarios.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Group allocations by event
  const allocationsByEvent = allocations?.reduce((acc, allocation) => {
    const eventId = allocation.slot.event.id;
    if (!acc[eventId]) {
      acc[eventId] = {
        event: allocation.slot.event,
        allocations: [],
      };
    }
    acc[eventId].allocations.push(allocation);
    return acc;
  }, {} as Record<string, { event: { id: string; title: string; event_date: string }; allocations: SlotAllocationWithBooking[] }>);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard de {profile.company_name}</h1>
        <p className="text-muted-foreground">
          Gestiona tus entrevistas y candidatos
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Slots Asignados</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSlots}</div>
            <p className="text-xs text-muted-foreground">
              En {uniqueEvents} evento{uniqueEvents !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Candidatos Agendados</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookedSlots}</div>
            <p className="text-xs text-muted-foreground">
              {totalSlots - bookedSlots} slot{totalSlots - bookedSlots !== 1 ? 's' : ''} disponible{totalSlots - bookedSlots !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Eventos Activos</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueEvents}</div>
            <p className="text-xs text-muted-foreground">
              Ferias de empleo
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Slots by Event */}
      {allocationsByEvent && Object.values(allocationsByEvent).map(({ event, allocations: eventAllocations }) => (
        <Card key={event.id}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {event.title}
            </CardTitle>
            <CardDescription className="capitalize">
              {formatDate(event.event_date)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {eventAllocations.map((allocation) => (
                <div
                  key={allocation.id}
                  className={`border rounded-lg p-4 transition-colors ${
                    allocation.booking 
                      ? 'bg-primary/5 border-primary/20' 
                      : 'bg-muted/30 border-border'
                  }`}
                >
                  {/* Time and Location Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {formatTime(allocation.slot.start_time)} - {formatTime(allocation.slot.end_time)}
                      </div>
                      {allocation.stand_number && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          Stand {allocation.stand_number}
                        </div>
                      )}
                    </div>
                    <Badge variant={allocation.booking ? 'default' : 'secondary'}>
                      {allocation.booking ? 'Reservado' : 'Disponible'}
                    </Badge>
                  </div>

                  {/* Candidate Card */}
                  {allocation.booking ? (
                    <div className="bg-background rounded-md p-4 border">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {getInitials(allocation.booking.candidate.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-foreground">
                            {allocation.booking.candidate.full_name || 'Sin nombre'}
                          </h4>
                          <p className="text-sm text-muted-foreground truncate">
                            {allocation.booking.candidate.email}
                          </p>
                          {allocation.booking.candidate.phone && (
                            <p className="text-sm text-muted-foreground">
                              {allocation.booking.candidate.phone}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {allocation.booking.candidate.linkedin_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                            >
                              <a
                                href={allocation.booking.candidate.linkedin_url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Linkedin className="h-4 w-4 mr-1" />
                                LinkedIn
                              </a>
                            </Button>
                          )}
                          {allocation.booking.candidate.cv_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                            >
                              <a
                                href={allocation.booking.candidate.cv_url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <FileText className="h-4 w-4 mr-1" />
                                CV
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-sm text-muted-foreground">
                      Ningún candidato ha reservado este horario todavía
                    </div>
                  )}

                  {/* Interviewer info */}
                  {allocation.interviewer_name && (
                    <div className="mt-3 text-xs text-muted-foreground">
                      Entrevistador: {allocation.interviewer_name}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}