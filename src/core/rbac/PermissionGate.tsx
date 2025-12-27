import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { Permission, AppRole } from './permissions';

interface PermissionGateProps {
  permission?: Permission;
  permissions?: Permission[];
  role?: AppRole;
  roles?: AppRole[];
  requireAll?: boolean; // For multiple permissions/roles, require all instead of any
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * PermissionGate component - Conditionally renders children based on permissions/roles
 * 
 * Usage:
 * <PermissionGate permission="students.write">
 *   <Button>Add Student</Button>
 * </PermissionGate>
 * 
 * <PermissionGate roles={['admin', 'principal']}>
 *   <AdminPanel />
 * </PermissionGate>
 */
export function PermissionGate({
  permission,
  permissions,
  role,
  roles,
  requireAll = false,
  fallback = null,
  children,
}: PermissionGateProps) {
  const { hasPermission, hasRole, isAdmin } = useAuth();

  // Admins always pass
  if (isAdmin) {
    return <>{children}</>;
  }

  // Check single permission
  if (permission && !hasPermission(permission)) {
    return <>{fallback}</>;
  }

  // Check multiple permissions
  if (permissions && permissions.length > 0) {
    const check = requireAll
      ? permissions.every(p => hasPermission(p))
      : permissions.some(p => hasPermission(p));
    if (!check) {
      return <>{fallback}</>;
    }
  }

  // Check single role
  if (role && !hasRole(role)) {
    return <>{fallback}</>;
  }

  // Check multiple roles
  if (roles && roles.length > 0) {
    const check = requireAll
      ? roles.every(r => hasRole(r))
      : roles.some(r => hasRole(r));
    if (!check) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
}

/**
 * Hook version for programmatic permission checks
 */
export function usePermissionGate() {
  const { hasPermission, hasRole, isAdmin } = useAuth();

  const canAccess = (options: {
    permission?: Permission;
    permissions?: Permission[];
    role?: AppRole;
    roles?: AppRole[];
    requireAll?: boolean;
  }): boolean => {
    const { permission, permissions, role, roles, requireAll = false } = options;

    // Admins always pass
    if (isAdmin) return true;

    // Check single permission
    if (permission && !hasPermission(permission)) return false;

    // Check multiple permissions
    if (permissions && permissions.length > 0) {
      const check = requireAll
        ? permissions.every(p => hasPermission(p))
        : permissions.some(p => hasPermission(p));
      if (!check) return false;
    }

    // Check single role
    if (role && !hasRole(role)) return false;

    // Check multiple roles
    if (roles && roles.length > 0) {
      const check = requireAll
        ? roles.every(r => hasRole(r))
        : roles.some(r => hasRole(r));
      if (!check) return false;
    }

    return true;
  };

  return { canAccess, hasPermission, hasRole, isAdmin };
}
