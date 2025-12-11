import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2, Calendar, Users, Clock, MapPin, FileText, Linkedin } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { AvailableEventsSection } from '@/components/company/AvailableEventsSection';
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
      avatar_url: string | null;
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
          .select('id, full_name, email, linkedin_url, cv_url, phone, avatar_url')
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
              avatar_url: candidate.avatar_url,
            } : { id: '', full_name: null, email: '', linkedin_url: null, cv_url: null, phone: null, avatar_url: null },
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
        <div className="grid md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  // Empty state - no company name
  if (!profile?.company_name) {
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
              Hola {profile?.full_name || 'Empresa'}, tu perfil no está completo
            </h2>
            <p className="text-muted-foreground max-w-md">
              Por favor, actualiza tu perfil con el nombre de tu empresa para poder inscribirte en eventos.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // State with no allocations yet - show available events
  if (totalSlots === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard de {profile.company_name}</h1>
          <p className="text-muted-foreground">
            Gestiona tus entrevistas y candidatos
          </p>
        </div>

        <AvailableEventsSection companyName={profile.company_name} />

        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <h3 className="font-semibold text-foreground mb-1">Aún no tienes slots asignados</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Inscríbete en los eventos disponibles arriba para empezar a recibir candidatos.
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
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard de {profile.company_name}</h1>
        <p className="text-muted-foreground">
          Gestiona tus entrevistas y candidatos
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-medium">Slots</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold">{totalSlots}</div>
            <p className="text-xs text-muted-foreground">
              {uniqueEvents} evento{uniqueEvents !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-medium">Reservados</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold">{bookedSlots}</div>
            <p className="text-xs text-muted-foreground">
              {totalSlots - bookedSlots} disponible{totalSlots - bookedSlots !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-medium">Eventos</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold">{uniqueEvents}</div>
            <p className="text-xs text-muted-foreground">
              Ferias activas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Available Events Section */}
      <AvailableEventsSection companyName={profile.company_name} />

      {/* My Slots Grid by Event */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">Mis Inscripciones</h2>
      </div>
      {allocationsByEvent && Object.values(allocationsByEvent).map(({ event, allocations: eventAllocations }) => (
        <div key={event.id} className="space-y-4">
          {/* Event Header */}
          <div className="flex items-center gap-3 pb-2 border-b">
            <Calendar className="h-5 w-5 text-primary" />
            <div>
              <h2 className="font-semibold text-foreground">{event.title}</h2>
              <p className="text-sm text-muted-foreground capitalize">{formatDate(event.event_date)}</p>
            </div>
          </div>

          {/* Grid of Slot Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {eventAllocations.map((allocation) => (
              <Card 
                key={allocation.id} 
                className={`shadow-sm border transition-all hover:shadow-md ${
                  allocation.booking 
                    ? 'border-primary/30 bg-primary/5' 
                    : 'border-border bg-card'
                }`}
              >
                {/* Card Header: Time + Status */}
                <CardHeader className="pb-2 pt-4 px-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold text-foreground">
                        {formatTime(allocation.slot.start_time)} - {formatTime(allocation.slot.end_time)}
                      </span>
                    </div>
                    <Badge 
                      variant={allocation.booking ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {allocation.booking ? 'Reservado' : 'Disponible'}
                    </Badge>
                  </div>
                  {allocation.stand_number && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <MapPin className="h-3 w-3" />
                      Stand {allocation.stand_number}
                    </div>
                  )}
                </CardHeader>

                {/* Card Body: Candidate Info */}
                <CardContent className="px-4 pb-4">
                  {allocation.booking ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage 
                            src={allocation.booking.candidate.avatar_url || undefined} 
                            alt={allocation.booking.candidate.full_name || 'Candidato'}
                          />
                          <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                            {getInitials(allocation.booking.candidate.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground text-sm truncate">
                            {allocation.booking.candidate.full_name || 'Sin nombre'}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {allocation.booking.candidate.email}
                          </p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        {allocation.booking.candidate.linkedin_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-8 text-xs"
                            asChild
                          >
                            <a
                              href={allocation.booking.candidate.linkedin_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Linkedin className="h-3 w-3 mr-1" />
                              LinkedIn
                            </a>
                          </Button>
                        )}
                        {allocation.booking.candidate.cv_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-8 text-xs"
                            asChild
                          >
                            <a
                              href={allocation.booking.candidate.cv_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <FileText className="h-3 w-3 mr-1" />
                              CV
                            </a>
                          </Button>
                        )}
                        {!allocation.booking.candidate.linkedin_url && !allocation.booking.candidate.cv_url && (
                          <p className="text-xs text-muted-foreground italic">
                            Sin documentos adjuntos
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-6">
                      <p className="text-sm text-muted-foreground text-center">
                        Slot disponible
                      </p>
                    </div>
                  )}

                  {/* Interviewer (if assigned) */}
                  {allocation.interviewer_name && (
                    <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                      Entrevistador: {allocation.interviewer_name}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
