import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import type { Permission, AppRole } from '@/core/rbac/permissions';

interface ProtectedRouteProps {
  children: React.ReactNode;
  permission?: Permission;
  permissions?: Permission[];
  role?: AppRole;
  roles?: AppRole[];
  requireAll?: boolean;
}

export function ProtectedRoute({
  children,
  permission,
  permissions,
  role,
  roles,
  requireAll = false,
}: ProtectedRouteProps) {
  const { user, isLoading, hasPermission, hasRole, isAdmin } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check permissions/roles if specified
  if (!isAdmin) {
    // Check single permission
    if (permission && !hasPermission(permission)) {
      return <Navigate to="/" replace />;
    }

    // Check multiple permissions
    if (permissions && permissions.length > 0) {
      const check = requireAll
        ? permissions.every(p => hasPermission(p))
        : permissions.some(p => hasPermission(p));
      if (!check) {
        return <Navigate to="/" replace />;
      }
    }

    // Check single role
    if (role && !hasRole(role)) {
      return <Navigate to="/" replace />;
    }

    // Check multiple roles
    if (roles && roles.length > 0) {
      const check = requireAll
        ? roles.every(r => hasRole(r))
        : roles.some(r => hasRole(r));
      if (!check) {
        return <Navigate to="/" replace />;
      }
    }
  }

  return <>{children}</>;
}
