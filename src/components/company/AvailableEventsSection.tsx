import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Calendar, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  Check, 
  Plus,
  CalendarDays,
  CalendarRange
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { SingleSlotBookingDialog } from './SingleSlotBookingDialog';
import { CompanyBulkBookingDialog } from './CompanyBulkBookingDialog';

interface Event {
  id: string;
  title: string;
  event_date: string;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
}

interface Slot {
  id: string;
  start_time: string;
  end_time: string;
  event_id: string;
}

interface AvailableEventsSectionProps {
  companyName: string | null;
  companySector?: string | null;
}

export function AvailableEventsSection({ companyName, companySector }: AvailableEventsSectionProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  
  // Dialog states
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [singleBookingOpen, setSingleBookingOpen] = useState(false);
  const [bulkBookingOpen, setBulkBookingOpen] = useState(false);

  // Fetch all events
  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ['available-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: true });
      
      if (error) throw error;
      return data as Event[];
    },
  });

  // Fetch slots for expanded event
  const { data: eventSlots, isLoading: slotsLoading } = useQuery({
    queryKey: ['event-slots', expandedEvent],
    queryFn: async () => {
      if (!expandedEvent) return [];
      
      const { data, error } = await supabase
        .from('slots')
        .select('id, start_time, end_time, event_id')
        .eq('event_id', expandedEvent)
        .order('start_time', { ascending: true });
      
      if (error) throw error;
      return data as Slot[];
    },
    enabled: !!expandedEvent,
  });

  // Fetch existing allocations for this company
  const { data: myAllocations } = useQuery({
    queryKey: ['my-allocations', companyName],
    queryFn: async () => {
      if (!companyName) return [];
      
      const { data, error } = await supabase
        .from('slot_allocations')
        .select('slot_id')
        .eq('company_name', companyName);
      
      if (error) throw error;
      return data?.map(a => a.slot_id) || [];
    },
    enabled: !!companyName,
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
      return format(new Date(dateStr), "EEEE d 'de' MMMM", { locale: es });
    } catch {
      return dateStr;
    }
  };

  const isSlotJoined = (slotId: string) => myAllocations?.includes(slotId);

  const handleParticipar = (slot: Slot) => {
    setSelectedSlot(slot);
    setSingleBookingOpen(true);
  };

  if (eventsLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!events?.length) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <CalendarDays className="h-12 w-12 text-muted-foreground/50 mb-3" />
          <h3 className="font-semibold text-foreground mb-1">No hay eventos disponibles</h3>
          <p className="text-sm text-muted-foreground">
            Cuando haya eventos programados aparecerán aquí
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarDays className="h-5 w-5 text-primary" />
              Eventos Disponibles
            </CardTitle>
            {expandedEvent && eventSlots && eventSlots.length > 0 && (
              <Button
                onClick={() => setBulkBookingOpen(true)}
                disabled={!companyName}
                className="gap-2"
              >
                <CalendarRange className="h-4 w-4" />
                Inscribirse por Rango
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {events.map((event) => (
            <Collapsible
              key={event.id}
              open={expandedEvent === event.id}
              onOpenChange={(open) => setExpandedEvent(open ? event.id : null)}
            >
              <Card className="border bg-muted/30">
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-primary" />
                      <div>
                        <h4 className="font-medium text-foreground">{event.title}</h4>
                        <p className="text-sm text-muted-foreground capitalize">
                          {formatDate(event.event_date)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {event.slot_duration_minutes} min/slot
                      </Badge>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        {expandedEvent === event.id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="px-4 pb-4 border-t pt-3">
                    <h5 className="text-sm font-medium text-muted-foreground mb-3">
                      Huecos disponibles
                    </h5>
                    
                    {slotsLoading ? (
                      <div className="space-y-2">
                        {[1, 2, 3].map(i => (
                          <Skeleton key={i} className="h-10 w-full" />
                        ))}
                      </div>
                    ) : !eventSlots?.length ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No hay huecos configurados para este evento
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {eventSlots.map((slot) => {
                          const joined = isSlotJoined(slot.id);
                          
                          return (
                            <div
                              key={slot.id}
                              className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                                joined 
                                  ? 'bg-primary/10 border-primary/30' 
                                  : 'bg-background hover:bg-muted/50'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">
                                  {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                                </span>
                              </div>
                              
                              {joined ? (
                                <Badge variant="default" className="gap-1">
                                  <Check className="h-3 w-3" />
                                  Inscrito
                                </Badge>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleParticipar(slot)}
                                  disabled={!companyName}
                                  className="h-7 text-xs"
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Participar
                                </Button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </CardContent>
      </Card>

      {/* Single Slot Booking Dialog */}
      <SingleSlotBookingDialog
        open={singleBookingOpen}
        onOpenChange={setSingleBookingOpen}
        slot={selectedSlot}
        companyName={companyName || ''}
        defaultSector={companySector}
      />

      {/* Bulk Booking Dialog */}
      <CompanyBulkBookingDialog
        open={bulkBookingOpen}
        onOpenChange={setBulkBookingOpen}
        slots={eventSlots || []}
        companyName={companyName || ''}
        defaultSector={companySector}
        existingAllocations={myAllocations || []}
      />
    </>
  );
}
