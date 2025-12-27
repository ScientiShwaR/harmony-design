import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Pages
import LoginPage from "./pages/Login";
import HomePage from "./pages/Home";
import WorkPage from "./pages/work/Work";
import StudentsPage from "./pages/people/Students";
import StaffPage from "./pages/people/Staff";
import AttendancePage from "./pages/academics/Attendance";
import ClassesPage from "./pages/academics/Classes";
import EvidenceVaultPage from "./pages/compliance/EvidenceVault";
import UsersPage from "./pages/settings/Users";
import RolesPage from "./pages/settings/Roles";
import PoliciesPage from "./pages/settings/Policies";
import AuditLogPage from "./pages/settings/AuditLog";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            
            {/* Protected routes */}
            <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
            
            {/* Work */}
            <Route path="/work" element={<ProtectedRoute><WorkPage /></ProtectedRoute>} />
            <Route path="/work/tasks" element={<ProtectedRoute><WorkPage /></ProtectedRoute>} />
            <Route path="/work/approvals" element={<ProtectedRoute><WorkPage /></ProtectedRoute>} />
            <Route path="/work/exceptions" element={<ProtectedRoute><WorkPage /></ProtectedRoute>} />
            
            {/* People */}
            <Route path="/people/students" element={<ProtectedRoute permission="students.read"><StudentsPage /></ProtectedRoute>} />
            <Route path="/people/staff" element={<ProtectedRoute permission="staff.read"><StaffPage /></ProtectedRoute>} />
            
            {/* Academics */}
            <Route path="/academics/attendance" element={<ProtectedRoute permission="attendance.read"><AttendancePage /></ProtectedRoute>} />
            <Route path="/academics/classes" element={<ProtectedRoute permission="students.read"><ClassesPage /></ProtectedRoute>} />
            <Route path="/academics/timetable" element={<ProtectedRoute><WorkPage /></ProtectedRoute>} />
            <Route path="/academics/assessments" element={<ProtectedRoute><WorkPage /></ProtectedRoute>} />
            <Route path="/academics/report-cards" element={<ProtectedRoute><WorkPage /></ProtectedRoute>} />
            <Route path="/academics/certificates" element={<ProtectedRoute><WorkPage /></ProtectedRoute>} />
            
            {/* Finance */}
            <Route path="/finance/procurement" element={<ProtectedRoute><WorkPage /></ProtectedRoute>} />
            <Route path="/finance/expenses" element={<ProtectedRoute><WorkPage /></ProtectedRoute>} />
            
            {/* Operations */}
            <Route path="/operations/inventory" element={<ProtectedRoute><WorkPage /></ProtectedRoute>} />
            <Route path="/operations/assets" element={<ProtectedRoute><WorkPage /></ProtectedRoute>} />
            <Route path="/operations/maintenance" element={<ProtectedRoute><WorkPage /></ProtectedRoute>} />
            <Route path="/operations/transport" element={<ProtectedRoute><WorkPage /></ProtectedRoute>} />
            <Route path="/operations/meals" element={<ProtectedRoute><WorkPage /></ProtectedRoute>} />
            
            {/* Safety */}
            <Route path="/safety/incidents" element={<ProtectedRoute><WorkPage /></ProtectedRoute>} />
            <Route path="/safety/drills" element={<ProtectedRoute><WorkPage /></ProtectedRoute>} />
            
            {/* Compliance */}
            <Route path="/compliance/evidence" element={<ProtectedRoute permission="evidence.read"><EvidenceVaultPage /></ProtectedRoute>} />
            <Route path="/compliance/registers" element={<ProtectedRoute><EvidenceVaultPage /></ProtectedRoute>} />
            <Route path="/compliance/inspection" element={<ProtectedRoute><EvidenceVaultPage /></ProtectedRoute>} />
            
            {/* Settings - Admin only */}
            <Route path="/settings/school" element={<ProtectedRoute><WorkPage /></ProtectedRoute>} />
            <Route path="/settings/users" element={<ProtectedRoute permission="users.admin"><UsersPage /></ProtectedRoute>} />
            <Route path="/settings/roles" element={<ProtectedRoute permission="roles.read"><RolesPage /></ProtectedRoute>} />
            <Route path="/settings/policies" element={<ProtectedRoute permission="policies.read"><PoliciesPage /></ProtectedRoute>} />
            <Route path="/settings/audit" element={<ProtectedRoute permission="audit.read"><AuditLogPage /></ProtectedRoute>} />
            <Route path="/settings/board-packs" element={<ProtectedRoute><WorkPage /></ProtectedRoute>} />
            <Route path="/settings/templates" element={<ProtectedRoute><WorkPage /></ProtectedRoute>} />
            <Route path="/settings/import-export" element={<ProtectedRoute><WorkPage /></ProtectedRoute>} />
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
