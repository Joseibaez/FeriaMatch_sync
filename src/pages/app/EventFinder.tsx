import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, isToday, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, MapPin, Users, Building2, ArrowRight, ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

// Helper to determine event status
const getEventStatus = (eventDate: string, slotsAvailable: number): "open" | "full" | "past" => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = parseISO(eventDate);
  date.setHours(0, 0, 0, 0);

  if (date < today) return "past";
  if (slotsAvailable <= 0) return "full";
  return "open";
};

const statusConfig = {
  open: { label: "Abierto", class: "bg-green-100 text-green-800 border-green-200" },
  full: { label: "Completo", class: "bg-red-100 text-red-700 border-red-200" },
  past: { label: "Finalizado", class: "bg-muted text-muted-foreground border-border" },
};

// Format time from "HH:MM:SS" to "HH:MM"
const formatTime = (time: string) => time.slice(0, 5);

const EventFinder = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [calendarBaseMonth, setCalendarBaseMonth] = useState(new Date());

  // Fetch all events
  const { data: events, isLoading } = useQuery({
    queryKey: ["public-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("event_date", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  // Get dates with events for calendar highlighting
  const eventDates = useMemo(() => {
    if (!events) return new Set<string>();
    return new Set(events.map((e) => e.event_date));
  }, [events]);

  // Filter events based on selected date
  const filteredEvents = useMemo(() => {
    if (!events) return [];
    if (!selectedDate) return events;
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    return events.filter((e) => e.event_date === dateStr);
  }, [events, selectedDate]);

  // Generate calendar days for a month
  const getMonthDays = (baseDate: Date) => {
    const start = startOfMonth(baseDate);
    const end = endOfMonth(baseDate);
    return eachDayOfInterval({ start, end });
  };

  // Calendar navigation
  const goToPreviousMonth = () => setCalendarBaseMonth(addMonths(calendarBaseMonth, -1));
  const goToNextMonth = () => setCalendarBaseMonth(addMonths(calendarBaseMonth, 1));

  const currentMonthDays = getMonthDays(calendarBaseMonth);
  const nextMonthDays = getMonthDays(addMonths(calendarBaseMonth, 1));

  // Render calendar month
  const renderCalendarMonth = (days: Date[], monthDate: Date) => {
    const firstDayOfMonth = startOfMonth(monthDate);
    // Get day of week (0 = Sunday, adjust for Monday start)
    const startDayOfWeek = firstDayOfMonth.getDay();
    const adjustedStartDay = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

    return (
      <div className="flex-1 min-w-[280px]">
        {/* Month header */}
        <h3 className="text-center font-semibold text-foreground mb-3 capitalize">
          {format(monthDate, "MMMM yyyy", { locale: es })}
        </h3>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["L", "M", "X", "J", "V", "S", "D"].map((day) => (
            <div key={day} className="text-center text-xs font-medium text-muted-foreground py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for alignment */}
          {Array.from({ length: adjustedStartDay }).map((_, i) => (
            <div key={`empty-${i}`} className="h-9" />
          ))}

          {/* Day cells */}
          {days.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const hasEvent = eventDates.has(dateStr);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isDayToday = isToday(day);

            return (
              <button
                key={dateStr}
                onClick={() => {
                  if (hasEvent) {
                    setSelectedDate(isSelected ? null : day);
                  }
                }}
                disabled={!hasEvent}
                className={cn(
                  "h-9 w-full rounded-md text-sm font-medium transition-all relative",
                  "flex items-center justify-center",
                  hasEvent && "cursor-pointer hover:bg-primary/10",
                  !hasEvent && "text-muted-foreground/50 cursor-default",
                  isSelected && "bg-primary text-primary-foreground hover:bg-primary/90",
                  isDayToday && !isSelected && "ring-1 ring-primary/50",
                  hasEvent && !isSelected && "text-foreground font-semibold"
                )}
              >
                {format(day, "d")}
                {/* Event indicator dot */}
                {hasEvent && !isSelected && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-80 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl flex items-center gap-2">
            <Search className="h-7 w-7 text-primary" />
            Explorar Eventos
          </h1>
          <p className="text-muted-foreground">
            Descubre ferias de empleo y reserva tu lugar
          </p>
        </div>
        {selectedDate && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedDate(null)}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Limpiar filtro
          </Button>
        )}
      </div>

      {/* Big Calendar Section */}
      <Card className="border bg-card shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Calendario de Eventos
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={goToPreviousMonth} className="h-8 w-8">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={goToNextMonth} className="h-8 w-8">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <CardDescription>
            Los días con eventos aparecen marcados. Haz clic para filtrar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Two-month calendar view */}
          <div className="flex flex-col md:flex-row gap-6 md:gap-8">
            {renderCalendarMonth(currentMonthDays, calendarBaseMonth)}
            {renderCalendarMonth(nextMonthDays, addMonths(calendarBaseMonth, 1))}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span>Con evento</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-primary flex items-center justify-center text-xs text-primary-foreground font-medium">
                15
              </span>
              <span>Seleccionado</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected date indicator */}
      {selectedDate && (
        <div className="flex items-center gap-2 text-sm">
          <Badge variant="secondary" className="bg-primary/10 text-primary gap-1">
            <Calendar className="h-3 w-3" />
            {format(selectedDate, "EEEE d 'de' MMMM, yyyy", { locale: es })}
          </Badge>
          <span className="text-muted-foreground">
            {filteredEvents.length} evento{filteredEvents.length !== 1 ? "s" : ""}
          </span>
        </div>
      )}

      {/* Events Grid */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">
          {selectedDate ? "Eventos en esta fecha" : "Todos los eventos"}
        </h2>

        {filteredEvents.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="font-semibold text-foreground mb-1">
                {selectedDate ? "Sin eventos en esta fecha" : "No hay eventos disponibles"}
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                {selectedDate
                  ? "Selecciona otra fecha en el calendario o limpia el filtro para ver todos los eventos."
                  : "Aún no hay ferias de empleo programadas. Vuelve pronto."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEvents.map((event) => {
              const status = getEventStatus(event.event_date, 10); // TODO: Get actual slots available
              const formattedDate = format(parseISO(event.event_date), "EEEE d 'de' MMMM", { locale: es });
              const timeRange = `${formatTime(event.start_time)} - ${formatTime(event.end_time)}`;

              return (
                <Card
                  key={event.id}
                  className="border bg-card shadow-sm hover:shadow-md transition-all duration-200 group overflow-hidden"
                >
                  {/* Color accent bar */}
                  <div className="h-1.5 bg-gradient-to-r from-primary to-primary/60" />

                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-2">
                        {event.title}
                      </CardTitle>
                      <Badge variant="outline" className={statusConfig[status].class}>
                        {statusConfig[status].label}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Event details */}
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2.5 text-sm">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                          <Calendar className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground capitalize">{formattedDate}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 text-sm">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
                          <Clock className="h-4 w-4 text-accent" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{timeRange}</p>
                          <p className="text-xs text-muted-foreground">
                            {event.slot_duration_minutes} min por entrevista
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                      <div className="flex items-center gap-1.5 text-sm">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Empresas</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Candidatos</span>
                      </div>
                    </div>

                    {/* CTA Button */}
                    <Button
                      className="w-full gap-2 group-hover:bg-primary/90"
                      onClick={() => navigate(`/app/agenda/${event.id}`)}
                      disabled={status === "past"}
                    >
                      {status === "past" ? (
                        "Evento finalizado"
                      ) : (
                        <>
                          Ver Agenda
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Results count */}
      {filteredEvents.length > 0 && (
        <p className="text-center text-sm text-muted-foreground">
          Mostrando {filteredEvents.length} de {events?.length || 0} evento{events?.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
};

export default EventFinder;
