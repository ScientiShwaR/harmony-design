import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Pages
import HomePage from "./pages/Home";
import WorkPage from "./pages/work/Work";
import StudentsPage from "./pages/people/Students";
import AttendancePage from "./pages/academics/Attendance";
import EvidenceVaultPage from "./pages/compliance/EvidenceVault";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Home */}
          <Route path="/" element={<HomePage />} />
          
          {/* Work */}
          <Route path="/work" element={<WorkPage />} />
          <Route path="/work/tasks" element={<WorkPage />} />
          <Route path="/work/approvals" element={<WorkPage />} />
          <Route path="/work/exceptions" element={<WorkPage />} />
          
          {/* People */}
          <Route path="/people/students" element={<StudentsPage />} />
          <Route path="/people/staff" element={<StudentsPage />} />
          
          {/* Academics */}
          <Route path="/academics/attendance" element={<AttendancePage />} />
          <Route path="/academics/classes" element={<AttendancePage />} />
          <Route path="/academics/timetable" element={<AttendancePage />} />
          <Route path="/academics/assessments" element={<AttendancePage />} />
          <Route path="/academics/report-cards" element={<AttendancePage />} />
          <Route path="/academics/certificates" element={<AttendancePage />} />
          
          {/* Finance */}
          <Route path="/finance/procurement" element={<WorkPage />} />
          <Route path="/finance/expenses" element={<WorkPage />} />
          
          {/* Operations */}
          <Route path="/operations/inventory" element={<WorkPage />} />
          <Route path="/operations/assets" element={<WorkPage />} />
          <Route path="/operations/maintenance" element={<WorkPage />} />
          <Route path="/operations/transport" element={<WorkPage />} />
          <Route path="/operations/meals" element={<WorkPage />} />
          
          {/* Safety */}
          <Route path="/safety/incidents" element={<WorkPage />} />
          <Route path="/safety/drills" element={<WorkPage />} />
          
          {/* Compliance */}
          <Route path="/compliance/evidence" element={<EvidenceVaultPage />} />
          <Route path="/compliance/registers" element={<EvidenceVaultPage />} />
          <Route path="/compliance/inspection" element={<EvidenceVaultPage />} />
          
          {/* Settings */}
          <Route path="/settings/school" element={<WorkPage />} />
          <Route path="/settings/roles" element={<WorkPage />} />
          <Route path="/settings/policies" element={<WorkPage />} />
          <Route path="/settings/board-packs" element={<WorkPage />} />
          <Route path="/settings/templates" element={<WorkPage />} />
          <Route path="/settings/import-export" element={<WorkPage />} />
          
          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
