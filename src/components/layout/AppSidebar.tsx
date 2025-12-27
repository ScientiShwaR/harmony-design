import { 
  Home, 
  ListTodo, 
  Users, 
  GraduationCap, 
  Wallet, 
  Settings, 
  ClipboardCheck,
  ShieldCheck,
  Wrench,
  ChevronDown,
  School,
  History,
  UserCog
} from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissionGate } from "@/core/rbac/PermissionGate";
import type { Permission } from "@/core/rbac/permissions";

interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: Permission;
  children?: { title: string; url: string; permission?: Permission }[];
}

const navigation: { label: string; items: NavItem[] }[] = [
  {
    label: "Overview",
    items: [
      { title: "Home", url: "/", icon: Home },
    ],
  },
  {
    label: "Work",
    items: [
      { 
        title: "Tasks & Approvals", 
        url: "/work", 
        icon: ListTodo,
        children: [
          { title: "My Tasks", url: "/work/tasks" },
          { title: "Approvals", url: "/work/approvals" },
          { title: "Exceptions", url: "/work/exceptions" },
        ]
      },
    ],
  },
  {
    label: "Records",
    items: [
      { 
        title: "People", 
        url: "/people", 
        icon: Users,
        children: [
          { title: "Students", url: "/people/students", permission: "students.read" },
          { title: "Staff", url: "/people/staff", permission: "staff.read" },
        ]
      },
      { 
        title: "Academics", 
        url: "/academics", 
        icon: GraduationCap,
        children: [
          { title: "Classes", url: "/academics/classes" },
          { title: "Timetable", url: "/academics/timetable" },
          { title: "Attendance", url: "/academics/attendance", permission: "attendance.read" },
          { title: "Assessments", url: "/academics/assessments" },
          { title: "Report Cards", url: "/academics/report-cards" },
          { title: "Certificates", url: "/academics/certificates" },
        ]
      },
      { 
        title: "Finance", 
        url: "/finance", 
        icon: Wallet,
        children: [
          { title: "Procurement", url: "/finance/procurement" },
          { title: "Expenses", url: "/finance/expenses" },
        ]
      },
      { 
        title: "Operations", 
        url: "/operations", 
        icon: Wrench,
        children: [
          { title: "Inventory", url: "/operations/inventory" },
          { title: "Assets", url: "/operations/assets" },
          { title: "Maintenance", url: "/operations/maintenance" },
          { title: "Transport", url: "/operations/transport" },
          { title: "Meals", url: "/operations/meals" },
        ]
      },
      { 
        title: "Safety", 
        url: "/safety", 
        icon: ShieldCheck,
        children: [
          { title: "Incidents", url: "/safety/incidents" },
          { title: "Drills", url: "/safety/drills" },
        ]
      },
    ],
  },
  {
    label: "Compliance",
    items: [
      { 
        title: "Compliance", 
        url: "/compliance", 
        icon: ClipboardCheck,
        children: [
          { title: "Evidence Vault", url: "/compliance/evidence", permission: "evidence.read" },
          { title: "Registers", url: "/compliance/registers" },
          { title: "Inspection Mode", url: "/compliance/inspection" },
        ]
      },
    ],
  },
  {
    label: "System",
    items: [
      { 
        title: "Settings", 
        url: "/settings", 
        icon: Settings,
        children: [
          { title: "School Profile", url: "/settings/school" },
          { title: "Users", url: "/settings/users", permission: "users.admin" },
          { title: "Roles & Permissions", url: "/settings/roles", permission: "roles.read" },
          { title: "Policies", url: "/settings/policies", permission: "policies.read" },
          { title: "Audit Log", url: "/settings/audit", permission: "audit.read" },
          { title: "Board Packs", url: "/settings/board-packs" },
          { title: "Templates", url: "/settings/templates" },
          { title: "Import/Export", url: "/settings/import-export" },
        ]
      },
    ],
  },
];

export function AppSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;
  const { profile, roles } = useAuth();
  const { canAccess } = usePermissionGate();

  const isActive = (url: string) => currentPath === url;
  const isParentActive = (item: NavItem) => {
    if (isActive(item.url)) return true;
    return item.children?.some(child => isActive(child.url)) ?? false;
  };

  const canAccessItem = (item: { permission?: Permission }) => {
    if (!item.permission) return true;
    return canAccess({ permission: item.permission });
  };

  // Filter children based on permissions
  const getVisibleChildren = (children: { title: string; url: string; permission?: Permission }[] | undefined) => {
    if (!children) return [];
    return children.filter(canAccessItem);
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <School className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">School OS</span>
                  <span className="text-xs text-muted-foreground">Kamal Vidyalaya</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      
      <SidebarContent>
        {navigation.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const visibleChildren = getVisibleChildren(item.children);
                  
                  // Skip if no permission for item and no visible children
                  if (!canAccessItem(item) && visibleChildren.length === 0) return null;

                  return visibleChildren.length > 0 ? (
                    <Collapsible 
                      key={item.title} 
                      asChild 
                      defaultOpen={isParentActive(item)}
                      className="group/collapsible"
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton 
                            tooltip={item.title}
                            isActive={isParentActive(item)}
                          >
                            <item.icon className="size-4" />
                            <span>{item.title}</span>
                            <ChevronDown className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {visibleChildren.map((child) => (
                              <SidebarMenuSubItem key={child.title}>
                                <SidebarMenuSubButton 
                                  asChild
                                  isActive={isActive(child.url)}
                                >
                                  <Link to={child.url}>
                                    <span>{child.title}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  ) : (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        tooltip={item.title}
                        isActive={isActive(item.url)}
                      >
                        <Link to={item.url}>
                          <item.icon className="size-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <div className="flex aspect-square size-8 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
                {profile?.full_name?.slice(0, 2).toUpperCase() || 'U'}
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-medium text-sm">{profile?.full_name || 'User'}</span>
                <span className="text-xs text-muted-foreground capitalize">
                  {roles.length > 0 ? roles[0] : 'No role'}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
