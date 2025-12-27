import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { History, Search, Filter, Eye, Loader2, Calendar, User, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

interface AuditEvent {
  id: string;
  created_at: string;
  actor_user_id: string;
  actor_roles: string[];
  command_type: string;
  entity_type: string;
  entity_id: string | null;
  before_json: Record<string, unknown> | null;
  after_json: Record<string, unknown> | null;
  reason: string | null;
  metadata_json: Record<string, unknown> | null;
  device_id: string | null;
}

interface ActorProfile {
  id: string;
  full_name: string;
  email: string;
}

export default function AuditLogPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ActorProfile>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [commandTypeFilter, setCommandTypeFilter] = useState<string>('all');
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('all');

  useEffect(() => {
    const fetchAuditEvents = async () => {
      setIsLoading(true);
      
      const { data } = await supabase
        .from('audit_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      const eventsData = (data || []) as AuditEvent[];
      setEvents(eventsData);

      // Fetch actor profiles
      const actorIds = [...new Set(eventsData.map(e => e.actor_user_id).filter(Boolean))];
      if (actorIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', actorIds);

        const profileMap: Record<string, ActorProfile> = {};
        profilesData?.forEach(p => {
          profileMap[p.id] = p;
        });
        setProfiles(profileMap);
      }

      setIsLoading(false);
    };

    fetchAuditEvents();
  }, []);

  const getCommandTypes = () => {
    const types = [...new Set(events.map(e => e.command_type))];
    return types.sort();
  };

  const getEntityTypes = () => {
    const types = [...new Set(events.map(e => e.entity_type))];
    return types.sort();
  };

  const filteredEvents = events.filter(event => {
    if (commandTypeFilter !== 'all' && event.command_type !== commandTypeFilter) return false;
    if (entityTypeFilter !== 'all' && event.entity_type !== entityTypeFilter) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const actor = profiles[event.actor_user_id];
      if (
        !event.command_type.toLowerCase().includes(search) &&
        !event.entity_type.toLowerCase().includes(search) &&
        !(actor?.full_name.toLowerCase().includes(search)) &&
        !(event.reason?.toLowerCase().includes(search))
      ) {
        return false;
      }
    }
    return true;
  });

  const getCommandBadgeVariant = (type: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (type.includes('delete') || type.includes('remove')) return 'destructive';
    if (type.includes('create') || type.includes('assign')) return 'default';
    if (type.includes('update') || type.includes('edit')) return 'secondary';
    return 'outline';
  };

  const viewDetails = (event: AuditEvent) => {
    setSelectedEvent(event);
    setIsDetailOpen(true);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Audit Log</h1>
          <p className="text-muted-foreground">Complete history of all system changes (append-only)</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="size-5" />
              Event History
            </CardTitle>
            <CardDescription>
              Every command execution is logged with before/after state for full traceability
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by actor, command, or reason..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <Select value={commandTypeFilter} onValueChange={setCommandTypeFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Command type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All commands</SelectItem>
                  {getCommandTypes().map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Entity type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All entities</SelectItem>
                  {getEntityTypes().map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No audit events found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Command</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead className="w-16">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEvents.map(event => (
                    <TableRow key={event.id}>
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="size-3" />
                          {format(new Date(event.created_at), 'MMM d, HH:mm:ss')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="size-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium text-sm">
                              {profiles[event.actor_user_id]?.full_name || 'Unknown'}
                            </div>
                            {event.actor_roles && event.actor_roles.length > 0 && (
                              <div className="flex gap-1 mt-0.5">
                                {event.actor_roles.map(role => (
                                  <Badge key={role} variant="outline" className="text-xs py-0">
                                    {role}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getCommandBadgeVariant(event.command_type)}>
                          {event.command_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">{event.entity_type}</span>
                        {event.entity_id && (
                          <span className="text-muted-foreground text-xs ml-1">
                            #{event.entity_id.slice(0, 8)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                        {event.reason || '-'}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => viewDetails(event)}>
                          <Eye className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Detail Dialog */}
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Audit Event Details</DialogTitle>
              <DialogDescription>
                {selectedEvent && format(new Date(selectedEvent.created_at), 'MMMM d, yyyy HH:mm:ss')}
              </DialogDescription>
            </DialogHeader>
            {selectedEvent && (
              <ScrollArea className="max-h-[60vh]">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Command</label>
                      <div className="mt-1">
                        <Badge variant={getCommandBadgeVariant(selectedEvent.command_type)}>
                          {selectedEvent.command_type}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Entity</label>
                      <div className="mt-1 font-mono text-sm">
                        {selectedEvent.entity_type}
                        {selectedEvent.entity_id && ` (${selectedEvent.entity_id})`}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Actor</label>
                      <div className="mt-1">
                        {profiles[selectedEvent.actor_user_id]?.full_name || 'Unknown'}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Device ID</label>
                      <div className="mt-1 font-mono text-xs">
                        {selectedEvent.device_id || '-'}
                      </div>
                    </div>
                  </div>

                  {selectedEvent.reason && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Reason</label>
                      <div className="mt-1 p-3 bg-muted rounded-md text-sm">
                        {selectedEvent.reason}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Before</label>
                      <pre className="mt-1 p-3 bg-muted rounded-md text-xs overflow-auto max-h-48">
                        {selectedEvent.before_json 
                          ? JSON.stringify(selectedEvent.before_json, null, 2) 
                          : '(no previous state)'}
                      </pre>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">After</label>
                      <pre className="mt-1 p-3 bg-muted rounded-md text-xs overflow-auto max-h-48">
                        {selectedEvent.after_json 
                          ? JSON.stringify(selectedEvent.after_json, null, 2) 
                          : '(no new state)'}
                      </pre>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
