import { supabase } from '@/integrations/supabase/client';
import type { Command, CommandResult, AuditEvent, CommandType } from './types';
import { COMMAND_PERMISSIONS } from './types';
import type { Permission, AppRole } from '@/core/rbac/permissions';

// Device ID for audit trail
const getDeviceId = (): string => {
  let deviceId = localStorage.getItem('device_id');
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem('device_id', deviceId);
  }
  return deviceId;
};

interface ExecuteCommandOptions {
  userId: string;
  userRoles: AppRole[];
  userPermissions: Permission[];
  isAdmin: boolean;
}

/**
 * Command Bus - Single pathway for all write operations
 * 
 * Every mutation MUST go through this function.
 * It validates permissions, executes the command, and logs an audit event.
 */
export async function executeCommand<T = unknown>(
  command: Omit<Command, 'id' | 'createdAt' | 'actorId' | 'actorRoleIds'>,
  options: ExecuteCommandOptions
): Promise<CommandResult<T>> {
  const { userId, userRoles, userPermissions, isAdmin } = options;

  // 1. Check permission for this command type
  const requiredPermission = COMMAND_PERMISSIONS[command.type];
  if (!isAdmin && !userPermissions.includes(requiredPermission)) {
    return {
      success: false,
      error: `Permission denied: requires ${requiredPermission}`,
    };
  }

  // 2. Build full command
  const fullCommand: Command = {
    ...command,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    actorId: userId,
    actorRoleIds: userRoles,
  };

  // 3. Execute the command (domain logic)
  let result: CommandResult<T>;
  let beforeState: Record<string, unknown> | undefined;
  let afterState: Record<string, unknown> | undefined;

  try {
    const executionResult = await executeCommandLogic<T>(fullCommand);
    result = executionResult.result;
    beforeState = executionResult.beforeState;
    afterState = executionResult.afterState;
  } catch (error) {
    result = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  // 4. Write audit event (append-only)
  if (result.success) {
    const auditEventData = {
      actor_user_id: userId,
      actor_roles: userRoles as string[],
      command_type: command.type as string,
      entity_type: command.entityRef?.type || command.type.split('.')[0],
      entity_id: command.entityRef?.id || null,
      before_json: beforeState ? JSON.parse(JSON.stringify(beforeState)) : null,
      after_json: afterState ? JSON.parse(JSON.stringify(afterState)) : null,
      reason: command.reason || null,
      metadata_json: command.metadata ? JSON.parse(JSON.stringify(command.metadata)) : null,
      device_id: getDeviceId(),
    };

    const { data: auditData, error: auditError } = await supabase
      .from('audit_events')
      .insert([auditEventData])
      .select('id')
      .single();

    if (auditError) {
      console.error('Failed to write audit event:', auditError);
    } else {
      result.auditEventId = auditData?.id;
    }
  }

  return result;
}

/**
 * Execute the actual command logic
 * This is where domain-specific operations happen
 */
async function executeCommandLogic<T>(
  command: Command
): Promise<{ 
  result: CommandResult<T>; 
  beforeState?: Record<string, unknown>; 
  afterState?: Record<string, unknown> 
}> {
  switch (command.type) {
    case 'policy.update':
      return await handlePolicyUpdate(command) as { 
        result: CommandResult<T>; 
        beforeState?: Record<string, unknown>; 
        afterState?: Record<string, unknown> 
      };

    case 'user.role.assign':
      return await handleUserRoleAssign(command) as { 
        result: CommandResult<T>; 
        beforeState?: Record<string, unknown>; 
        afterState?: Record<string, unknown> 
      };

    case 'user.role.remove':
      return await handleUserRoleRemove(command) as { 
        result: CommandResult<T>; 
        beforeState?: Record<string, unknown>; 
        afterState?: Record<string, unknown> 
      };

    // Add more command handlers as needed
    default:
      // Generic handler - log the command and return success
      return {
        result: { success: true, data: command.payload as T },
        afterState: command.payload,
      };
  }
}

// Command handlers

async function handlePolicyUpdate(command: Command) {
  const { policy_key, policy_value, description } = command.payload as {
    policy_key: string;
    policy_value: unknown;
    description?: string;
  };

  // Get current version
  const { data: currentPolicy } = await supabase
    .from('policies')
    .select('*')
    .eq('policy_key', policy_key)
    .eq('is_active', true)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();

  const beforeState = currentPolicy || undefined;
  const newVersion = (currentPolicy?.version || 0) + 1;

  // Deactivate old version
  if (currentPolicy) {
    await supabase
      .from('policies')
      .update({ is_active: false })
      .eq('id', currentPolicy.id);
  }

  // Insert new version
  const { data: newPolicy, error } = await supabase
    .from('policies')
    .insert({
      policy_key,
      policy_value: JSON.parse(JSON.stringify(policy_value)),
      description,
      version: newVersion,
      is_active: true,
      created_by: command.actorId,
    })
    .select()
    .single();

  if (error) {
    return { result: { success: false, error: error.message } };
  }

  return {
    result: { success: true, data: newPolicy },
    beforeState,
    afterState: newPolicy,
  };
}

async function handleUserRoleAssign(command: Command) {
  const { user_id, role } = command.payload as { user_id: string; role: AppRole };

  const { data, error } = await supabase
    .from('user_roles')
    .insert({
      user_id,
      role,
      assigned_by: command.actorId,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return { result: { success: false, error: 'User already has this role' } };
    }
    return { result: { success: false, error: error.message } };
  }

  return {
    result: { success: true, data },
    afterState: { user_id, role },
  };
}

async function handleUserRoleRemove(command: Command) {
  const { user_id, role } = command.payload as { user_id: string; role: AppRole };

  // Get before state
  const { data: beforeData } = await supabase
    .from('user_roles')
    .select('*')
    .eq('user_id', user_id)
    .eq('role', role)
    .maybeSingle();

  const { error } = await supabase
    .from('user_roles')
    .delete()
    .eq('user_id', user_id)
    .eq('role', role);

  if (error) {
    return { result: { success: false, error: error.message } };
  }

  return {
    result: { success: true },
    beforeState: beforeData || { user_id, role },
  };
}

// Export a hook for using the command bus
export function useCommandBus() {
  return { executeCommand };
}
