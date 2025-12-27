import type { Permission } from '@/core/rbac/permissions';

// Command types for the Command Bus
export interface Command {
  id: string;
  type: CommandType;
  payload: Record<string, unknown>;
  entityRef?: {
    type: string;
    id: string;
  };
  createdAt: string;
  actorId: string;
  actorRoleIds: string[];
  reason?: string;
  metadata?: Record<string, unknown>;
}

export type CommandType =
  // Student commands
  | 'student.create'
  | 'student.update'
  | 'student.delete'
  // Staff commands
  | 'staff.create'
  | 'staff.update'
  | 'staff.delete'
  // Attendance commands
  | 'attendance.mark'
  | 'attendance.edit'
  // Evidence commands
  | 'evidence.create'
  | 'evidence.update'
  // Policy commands
  | 'policy.update'
  // User management commands
  | 'user.role.assign'
  | 'user.role.remove'
  // Role commands
  | 'role.permission.add'
  | 'role.permission.remove';

// Map command types to required permissions
export const COMMAND_PERMISSIONS: Record<CommandType, Permission> = {
  'student.create': 'students.write',
  'student.update': 'students.write',
  'student.delete': 'students.write',
  'staff.create': 'staff.write',
  'staff.update': 'staff.write',
  'staff.delete': 'staff.write',
  'attendance.mark': 'attendance.mark',
  'attendance.edit': 'attendance.edit',
  'evidence.create': 'evidence.write',
  'evidence.update': 'evidence.write',
  'policy.update': 'policies.write',
  'user.role.assign': 'users.admin',
  'user.role.remove': 'users.admin',
  'role.permission.add': 'roles.admin',
  'role.permission.remove': 'roles.admin',
};

// Audit event structure
export interface AuditEvent {
  id?: string;
  created_at?: string;
  actor_user_id: string;
  actor_roles: string[];
  command_type: CommandType;
  entity_type: string;
  entity_id?: string;
  before_json?: Record<string, unknown>;
  after_json?: Record<string, unknown>;
  reason?: string;
  metadata_json?: Record<string, unknown>;
  device_id?: string;
}

// Command result
export interface CommandResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  auditEventId?: string;
}
