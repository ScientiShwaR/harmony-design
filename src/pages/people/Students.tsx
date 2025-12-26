import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Plus, 
  Filter, 
  Download, 
  MoreHorizontal,
  ChevronDown,
  GraduationCap,
} from "lucide-react";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Mock student data
const students = [
  { id: 1, name: "Aarav Sharma", rollNo: "5A-01", class: "5A", dob: "2014-03-15", status: "active", attendance: 96.5 },
  { id: 2, name: "Ananya Patel", rollNo: "5A-02", class: "5A", dob: "2014-07-22", status: "active", attendance: 98.2 },
  { id: 3, name: "Arjun Reddy", rollNo: "5A-03", class: "5A", dob: "2014-01-08", status: "active", attendance: 78.4 },
  { id: 4, name: "Diya Gupta", rollNo: "5A-04", class: "5A", dob: "2014-11-30", status: "active", attendance: 94.1 },
  { id: 5, name: "Ishaan Kumar", rollNo: "5B-01", class: "5B", dob: "2014-05-12", status: "active", attendance: 91.8 },
  { id: 6, name: "Kavya Nair", rollNo: "5B-02", class: "5B", dob: "2014-09-03", status: "transferred", attendance: 88.5 },
  { id: 7, name: "Rohan Joshi", rollNo: "5B-03", class: "5B", dob: "2014-02-28", status: "active", attendance: 95.7 },
  { id: 8, name: "Priya Menon", rollNo: "4A-01", class: "4A", dob: "2015-06-14", status: "active", attendance: 99.1 },
];

export default function StudentsPage() {
  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Students</h1>
            <p className="text-muted-foreground">
              Manage student records and information
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="mr-2 size-4" />
              Export
            </Button>
            <Button size="sm">
              <Plus className="mr-2 size-4" />
              Add Student
            </Button>
          </div>
        </div>

        {/* Filters & Search */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search students by name, roll number..."
                  className="pl-9"
                />
              </div>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Filter className="mr-2 size-4" />
                      Class
                      <ChevronDown className="ml-2 size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-popover">
                    <DropdownMenuItem>All Classes</DropdownMenuItem>
                    <DropdownMenuItem>Class 4A</DropdownMenuItem>
                    <DropdownMenuItem>Class 4B</DropdownMenuItem>
                    <DropdownMenuItem>Class 5A</DropdownMenuItem>
                    <DropdownMenuItem>Class 5B</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Status
                      <ChevronDown className="ml-2 size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-popover">
                    <DropdownMenuItem>All Status</DropdownMenuItem>
                    <DropdownMenuItem>Active</DropdownMenuItem>
                    <DropdownMenuItem>Transferred</DropdownMenuItem>
                    <DropdownMenuItem>Graduated</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Students Table */}
        <Card elevated>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">All Students</CardTitle>
                <CardDescription>{students.length} students found</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-12">
                    <input type="checkbox" className="rounded border-border" />
                  </TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Roll No</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>DOB</TableHead>
                  <TableHead>Attendance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id} className="cursor-pointer">
                    <TableCell>
                      <input type="checkbox" className="rounded border-border" />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-sm">
                          {student.name.split(" ").map(n => n[0]).join("")}
                        </div>
                        <span className="font-medium">{student.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{student.rollNo}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <GraduationCap className="size-4 text-muted-foreground" />
                        {student.class}
                      </div>
                    </TableCell>
                    <TableCell>{new Date(student.dob).toLocaleDateString("en-IN")}</TableCell>
                    <TableCell>
                      <span className={`font-medium ${
                        student.attendance >= 90 
                          ? "text-success" 
                          : student.attendance >= 75 
                          ? "text-warning" 
                          : "text-destructive"
                      }`}>
                        {student.attendance}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={student.status === "active" ? "success" : "secondary"}>
                        {student.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-xs">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover">
                          <DropdownMenuItem>View Profile</DropdownMenuItem>
                          <DropdownMenuItem>Edit Details</DropdownMenuItem>
                          <DropdownMenuItem>Print ID Card</DropdownMenuItem>
                          <DropdownMenuItem>Issue Certificate</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
