// Permission vocabulary for School OS RBAC
export const PERMISSIONS = {
  // Students
  STUDENTS_READ: 'students.read',
  STUDENTS_WRITE: 'students.write',
  
  // Staff
  STAFF_READ: 'staff.read',
  STAFF_WRITE: 'staff.write',
  
  // Attendance
  ATTENDANCE_READ: 'attendance.read',
  ATTENDANCE_MARK: 'attendance.mark',
  ATTENDANCE_EDIT: 'attendance.edit',
  
  // Evidence/Compliance
  EVIDENCE_READ: 'evidence.read',
  EVIDENCE_WRITE: 'evidence.write',
  
  // Exports
  EXPORTS_GENERATE: 'exports.generate',
  
  // Audit
  AUDIT_READ: 'audit.read',
  AUDIT_ADMIN: 'audit.admin',
  
  // Policies
  POLICIES_READ: 'policies.read',
  POLICIES_WRITE: 'policies.write',
  
  // Users & Roles
  USERS_READ: 'users.read',
  USERS_ADMIN: 'users.admin',
  ROLES_READ: 'roles.read',
  ROLES_ADMIN: 'roles.admin',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Role types
export type AppRole = 'teacher' | 'clerk' | 'principal' | 'admin';

// Role bundles with their permissions
export const ROLE_BUNDLES: Record<AppRole, { displayName: string; permissions: Permission[] }> = {
  teacher: {
    displayName: 'Teacher',
    permissions: [
      PERMISSIONS.STUDENTS_READ,
      PERMISSIONS.ATTENDANCE_READ,
      PERMISSIONS.ATTENDANCE_MARK,
      PERMISSIONS.EVIDENCE_READ,
    ],
  },
  clerk: {
    displayName: 'Clerk',
    permissions: [
      PERMISSIONS.STUDENTS_READ,
      PERMISSIONS.STUDENTS_WRITE,
      PERMISSIONS.STAFF_READ,
      PERMISSIONS.EVIDENCE_READ,
      PERMISSIONS.EVIDENCE_WRITE,
      PERMISSIONS.EXPORTS_GENERATE,
    ],
  },
  principal: {
    displayName: 'Principal',
    permissions: Object.values(PERMISSIONS),
  },
  admin: {
    displayName: 'Administrator',
    permissions: Object.values(PERMISSIONS),
  },
};

// Check if a role is an admin role
export function isAdminRole(role: AppRole): boolean {
  return role === 'admin' || role === 'principal';
}
