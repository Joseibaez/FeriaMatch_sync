import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, AppRole } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Search, 
  MoreVertical, 
  UserCog, 
  Trash2, 
  CheckCircle2, 
  Clock,
  Users,
  Shield,
  Building2,
  User
} from "lucide-react";

// Role badge styles
const roleBadgeStyles: Record<AppRole, string> = {
  admin: "bg-primary/10 text-primary border-primary/20",
  recruiter: "bg-accent/10 text-accent border-accent/20",
  candidate: "bg-muted text-muted-foreground border-border",
};

const roleLabels: Record<AppRole, string> = {
  admin: "Admin",
  recruiter: "Empresa",
  candidate: "Candidato",
};

interface UserWithRole {
  id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
  is_onboarded: boolean;
  created_at: string;
  role: AppRole | null;
}

const AdminUsers = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState<AppRole>("candidate");
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);

  // Fetch all users with their roles
  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Get all roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // Create role lookup
      const roleMap = new Map(roles?.map(r => [r.user_id, r.role as AppRole]));

      // Combine data
      return profiles?.map(profile => ({
        ...profile,
        role: roleMap.get(profile.id) || null,
      })) as UserWithRole[];
    },
  });

  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    if (!searchQuery.trim()) return users;

    const query = searchQuery.toLowerCase();
    return users.filter(u => 
      u.email.toLowerCase().includes(query) ||
      u.full_name?.toLowerCase().includes(query) ||
      u.company_name?.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  // Change role mutation
  const changeRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      // First check if role exists
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (existingRole) {
        // Update existing role
        const { error } = await supabase
          .from("user_roles")
          .update({ role })
          .eq("user_id", userId);
        if (error) throw error;
      } else {
        // Insert new role
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({
        title: "Rol actualizado",
        description: `El rol del usuario ha sido cambiado a ${roleLabels[newRole]}.`,
      });
      setIsRoleDialogOpen(false);
      setSelectedUser(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      // Delete user role first
      await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);

      // Delete profile
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({
        title: "Usuario eliminado",
        description: "El usuario ha sido eliminado correctamente.",
      });
      setDeleteUserId(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleRoleChange = () => {
    if (!selectedUser) return;
    changeRoleMutation.mutate({ userId: selectedUser.id, role: newRole });
  };

  const openRoleDialog = (userRow: UserWithRole) => {
    setSelectedUser(userRow);
    setNewRole(userRow.role || "candidate");
    setIsRoleDialogOpen(true);
  };

  // Check if actions should be disabled for current user
  const isCurrentUser = (userId: string) => user?.id === userId;

  // Get initials from name or email
  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  // Stats
  const stats = useMemo(() => {
    if (!users) return { total: 0, admins: 0, companies: 0, candidates: 0 };
    return {
      total: users.length,
      admins: users.filter(u => u.role === "admin").length,
      companies: users.filter(u => u.role === "recruiter").length,
      candidates: users.filter(u => u.role === "candidate").length,
    };
  }, [users]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Usuarios
            </h1>
            <Badge variant="outline" className="bg-primary/5 text-primary">
              Admin
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Gestiona los usuarios registrados en la plataforma
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, email o empresa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administradores</CardTitle>
            <Shield className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.admins}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empresas</CardTitle>
            <Building2 className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{stats.companies}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Candidatos</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.candidates}</div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuarios</CardTitle>
          <CardDescription>
            {filteredUsers.length} usuario{filteredUsers.length !== 1 ? "s" : ""} encontrado{filteredUsers.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Usuario</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Tipo / Sector</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-[70px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      No se encontraron usuarios.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((userRow) => (
                    <TableRow key={userRow.id}>
                      {/* User Info */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-primary/10 text-primary text-sm">
                              {getInitials(userRow.full_name, userRow.email)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">
                              {userRow.full_name || "Sin nombre"}
                              {isCurrentUser(userRow.id) && (
                                <Badge variant="outline" className="ml-2 text-xs">Tú</Badge>
                              )}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {userRow.email}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Role Badge */}
                      <TableCell>
                        {userRow.role ? (
                          <Badge variant="outline" className={roleBadgeStyles[userRow.role]}>
                            {roleLabels[userRow.role]}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            Sin rol
                          </Badge>
                        )}
                      </TableCell>

                      {/* Type / Sector */}
                      <TableCell>
                        {userRow.role === "recruiter" && userRow.company_name ? (
                          <div className="flex items-center gap-1.5 text-sm">
                            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                            {userRow.company_name}
                          </div>
                        ) : userRow.role === "candidate" ? (
                          <span className="text-sm text-muted-foreground">Candidato</span>
                        ) : userRow.role === "admin" ? (
                          <span className="text-sm text-muted-foreground">Administrador</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        {userRow.is_onboarded ? (
                          <div className="flex items-center gap-1.5 text-sm text-accent">
                            <CheckCircle2 className="h-4 w-4" />
                            Completado
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-sm text-warning">
                            <Clock className="h-4 w-4" />
                            Pendiente
                          </div>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover">
                            <DropdownMenuItem
                              onClick={() => openRoleDialog(userRow)}
                              disabled={isCurrentUser(userRow.id)}
                              className="gap-2"
                            >
                              <UserCog className="h-4 w-4" />
                              Cambiar Rol
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeleteUserId(userRow.id)}
                              disabled={isCurrentUser(userRow.id)}
                              className="gap-2 text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                              Eliminar Usuario
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Change Role Dialog */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar Rol de Usuario</DialogTitle>
            <DialogDescription>
              Selecciona el nuevo rol para {selectedUser?.full_name || selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={newRole} onValueChange={(v) => setNewRole(v as AppRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    Administrador
                  </div>
                </SelectItem>
                <SelectItem value="recruiter">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-accent" />
                    Empresa
                  </div>
                </SelectItem>
                <SelectItem value="candidate">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Candidato
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleRoleChange}
              disabled={changeRoleMutation.isPending}
            >
              {changeRoleMutation.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteUserId} onOpenChange={(open) => !open && setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente el perfil del usuario y sus datos asociados. 
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteUserId && deleteUserMutation.mutate(deleteUserId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteUserMutation.isPending ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminUsers;
