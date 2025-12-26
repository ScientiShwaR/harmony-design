# School OS v1.0 Governance Core - Implementation Notes

## Route Map

```
/                          → Home (Dashboard)
/login                     → Login (NEW)

Work:
/work                      → Tasks & Approvals
/work/tasks                → My Tasks
/work/approvals            → Approvals Queue
/work/exceptions           → Exceptions

People:
/people/students           → Students List
/people/staff              → Staff List

Academics:
/academics/classes         → Classes
/academics/timetable       → Timetable
/academics/attendance      → Attendance
/academics/assessments     → Assessments
/academics/report-cards    → Report Cards
/academics/certificates    → Certificates

Finance:
/finance/procurement       → Procurement
/finance/expenses          → Expenses

Operations:
/operations/inventory      → Inventory
/operations/assets         → Assets
/operations/maintenance    → Maintenance
/operations/transport      → Transport
/operations/meals          → Meals

Safety:
/safety/incidents          → Incidents
/safety/drills             → Drills

Compliance:
/compliance/evidence       → Evidence Vault
/compliance/registers      → Registers
/compliance/inspection     → Inspection Mode

Settings:
/settings/school           → School Profile
/settings/users            → Users Management (NEW)
/settings/roles            → Roles & Permissions
/settings/policies         → Policies
/settings/audit            → Audit Log (NEW)
/settings/board-packs      → Board Packs
/settings/templates        → Templates
/settings/import-export    → Import/Export
```

## Command Palette Structure

Current spotlight commands:
- **Recent Items**: Student records, recent attendance
- **Quick Actions**: Add Student, Mark Attendance, Issue Certificate
- **Navigation**: Home, Students, Attendance, Evidence Vault, Exceptions

## Data JSONs

Located in `/src/data/`:
- `classes.json` - Class/section definitions
- `evidencePacks.json` - Evidence pack templates
- `policies.json` - Policy configuration (workflow rules)
- `staff.json` - Staff sample data
- `students.json` - Student sample data
- `themePack.json` - UI theme configuration

## Module Folders

```
src/
├── components/
│   ├── layout/          # AppLayout, AppSidebar, Topbar, SpotlightSearch
│   └── ui/              # shadcn/ui components
├── core/                # NEW: Command bus, RBAC, Policy engine
│   ├── commands/        # Command types and executor
│   ├── rbac/            # Role bundles, permissions, gates
│   └── policies/        # Policy engine
├── contexts/            # NEW: Auth, Permissions contexts
├── data/                # Sample JSON data
├── hooks/               # Custom hooks
├── lib/                 # Utilities
├── pages/
│   ├── academics/       # Attendance, etc.
│   ├── compliance/      # Evidence Vault
│   ├── people/          # Students
│   ├── settings/        # NEW: Users, Roles, Policies, Audit
│   └── work/            # Tasks, Approvals
└── integrations/
    └── supabase/        # Auto-generated client + types
```

---

## Permission Vocabulary

```typescript
type Permission =
  // Students
  | 'students.read'
  | 'students.write'
  
  // Staff
  | 'staff.read'
  | 'staff.write'
  
  // Attendance
  | 'attendance.read'
  | 'attendance.mark'
  | 'attendance.edit'
  
  // Evidence/Compliance
  | 'evidence.read'
  | 'evidence.write'
  
  // Exports
  | 'exports.generate'
  
  // Audit
  | 'audit.read'
  | 'audit.admin'
  
  // Policies
  | 'policies.read'
  | 'policies.write'
  
  // Users & Roles
  | 'users.read'
  | 'users.admin'
  | 'roles.read'
  | 'roles.admin';
```

## Role Bundles

| Role      | Permissions |
|-----------|-------------|
| Teacher   | students.read, attendance.read, attendance.mark, evidence.read |
| Clerk     | students.read, students.write, staff.read, exports.generate, evidence.read, evidence.write |
| Principal | ALL permissions |
| Admin     | ALL permissions (super-admin) |

## Running Locally

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

## Database Schema (Supabase)

Tables created via migrations:
- `profiles` - User profiles (linked to auth.users)
- `roles` - Role definitions (Teacher, Clerk, Principal, Admin)
- `role_permissions` - Permission assignments per role
- `user_roles` - User-to-role assignments
- `policies` - Versioned policy configurations
- `audit_events` - Append-only audit log

## RLS Summary

- **audit_events**: audit.read can SELECT, audit.admin can SELECT all. NO UPDATE/DELETE.
- **policies**: policies.read can SELECT, policies.write can INSERT (versioned append).
- **user_roles**: users.admin can manage, users can read their own.
- **profiles**: Users can read/update their own profile.
