import React, { useState, useMemo, useRef, useEffect } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  UserPlus, 
  Filter, 
  MoreVertical, 
  Mail, 
  Phone, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  Camera, 
  Trash2, 
  Edit, 
  Eye, 
  Users as UsersIcon,
  Plus,
  X,
  Inbox,
  FileText,
  Loader2
} from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { MemberPdfTemplate } from "../components/MemberPdfTemplate";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectLabel,
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { toast } from "sonner";
import { auth, db } from "../firebase";
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  where,
  getDoc,
  setDoc,
  deleteDoc
} from "firebase/firestore";
import { Member, Gender, MembershipStatus, HouseholdRole, Household, AuditLog } from "../types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { logAudit } from "../lib/audit";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TableSkeleton } from "../components/LoadingSkeleton";
import { EmptyState } from "../components/EmptyState";
import { MemberProfileDialog } from "../components/MemberProfileDialog";

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  toast.error("Database operation failed. Please check your permissions.");
  throw new Error(JSON.stringify(errInfo));
}

import { useFirebase } from "../context/FirebaseContext";

export default function Membership() {
  const { user, loading, role, ministry, isSuperAdmin, isSecretary, isMinistryLeader, isFinance, canEditMembership, canDelete, canExport } = useFirebase();
  const [members, setMembers] = useState<Member[]>([]);
  const [households, setHouseholds] = useState<Household[]>([]);
  const [memberTitles, setMemberTitles] = useState<string[]>(["Mr.", "Mrs.", "Ms.", "Miss.", "Dr.", "Rev.", "Pastor", "Elder", "Deacon", "Deaconess"]);
  const [daysOfWeek, setDaysOfWeek] = useState<string[]>(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]);
  const [maritalStatuses, setMaritalStatuses] = useState<string[]>(["Single", "Married", "Divorced", "Widowed"]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [teams, setTeams] = useState<string[]>([]);
  const [countries, setCountries] = useState<string[]>(["Ghana", "Nigeria", "Togo", "Benin", "Ivory Coast", "USA", "UK", "Canada"]);
  const [regions, setRegions] = useState<string[]>(["Greater Accra", "Ashanti", "Central", "Eastern", "Western", "Volta", "Northern", "Upper East", "Upper West", "Bono", "Bono East", "Ahafo", "Savannah", "North East", "Oti", "Western North"]);
  const [educationLevels, setEducationLevels] = useState<string[]>(["None", "Primary", "JHS", "SHS", "Vocational", "Diploma", "Bachelor's Degree", "Master's Degree", "PhD", "Other"]);
  const [activeTab, setActiveTab] = useState("all");
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [viewingMember, setViewingMember] = useState<Member | null>(null);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [isBulkUpdateDialogOpen, setIsBulkUpdateDialogOpen] = useState(false);
  const [bulkUpdateData, setBulkUpdateData] = useState<{
    status?: MembershipStatus | "";
    ministry?: string;
  }>({ status: "", ministry: "" });
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [isGeneratingBulkPdf, setIsGeneratingBulkPdf] = useState(false);

  // Real-time data fetching
  useEffect(() => {
    console.log("Membership useEffect triggered", { 
      user: user?.email, 
      loading,
      role, 
      isSuperAdmin, 
      isSecretary, 
      isFinance, 
      isMinistryLeader, 
      ministry 
    });
    if (!user || loading) {
      if (!user && !loading) setIsLoading(false);
      return;
    }
    setIsLoading(true);
    
    const settingsDoc = doc(db, "settings", "global");

    let unsubscribeMembers = () => {};
    let unsubscribeHouseholds = () => {};

    const unsubscribeSettings = onSnapshot(settingsDoc, (docSnap) => {
      console.log("Settings Snapshot received, exists:", docSnap.exists());
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log("Settings data content:", data);
        if (data.memberTitles) setMemberTitles(data.memberTitles);
        if (data.departments) setDepartments(data.departments);
        if (data.teams) setTeams(data.teams);
        if (data.countries) setCountries(data.countries);
        if (data.regions) {
          console.log("Regions found in settings:", data.regions);
          setRegions(data.regions);
        } else {
          console.log("No regions found in settings data");
        }
        if (data.educationLevels) setEducationLevels(data.educationLevels);
        if (data.maritalStatuses) setMaritalStatuses(data.maritalStatuses);
        if (data.daysOfWeek) setDaysOfWeek(data.daysOfWeek);
      } else {
        console.log("Settings document 'settings/global' does not exist");
      }
    }, (error) => {
      console.error("Settings Snapshot error:", error);
      handleFirestoreError(error, OperationType.GET, "settings/global");
    });

    let membersQuery;
    if (isSuperAdmin || isSecretary || isFinance) {
      console.log("Fetching all members (Admin/Secretary/Finance role)");
      membersQuery = collection(db, "members");
    } else if (isMinistryLeader && ministry) {
      console.log(`Fetching members for ministry: ${ministry}`);
      membersQuery = query(collection(db, "members"), where("groupMinistry", "==", ministry));
    } else {
      console.log("No authorized role detected for fetching members, or ministry missing for leader");
      setIsLoading(false);
      return () => {
        unsubscribeSettings();
      };
    }

    const householdsQuery = collection(db, "households");

    unsubscribeMembers = onSnapshot(membersQuery, (snapshot) => {
      console.log("Members Snapshot received, count:", snapshot.size);
      const membersData = snapshot.docs.map(doc => {
        const data = doc.data();
        console.log("Member doc data:", data);
        return { ...data, id: doc.id } as Member;
      });
      setMembers(membersData);
      setIsLoading(false);
    }, (error) => {
      console.error("Members Snapshot error:", error);
      handleFirestoreError(error, OperationType.LIST, "members");
    });

    unsubscribeHouseholds = onSnapshot(householdsQuery, (snapshot) => {
      const householdsData = snapshot.docs.map(doc => ({ ...doc.data(), householdId: doc.id } as Household));
      setHouseholds(householdsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "households");
    });

    return () => {
      unsubscribeMembers();
      unsubscribeHouseholds();
      unsubscribeSettings();
    };
  }, [user, loading, isSuperAdmin, isSecretary, isFinance, isMinistryLeader, ministry]);

  // --- Tab 1: All Members State ---
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deptFilter, setDeptFilter] = useState<string>("all");
  const [genderFilter, setGenderFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 15;

  const filteredMembers = useMemo(() => {
    console.log("Calculating filteredMembers", { 
      totalMembers: members.length, 
      searchTerm, 
      statusFilter, 
      deptFilter, 
      genderFilter 
    });
    const result = members.filter(m => {
      const fullName = `${m.firstName || ""} ${m.lastName || ""}`.toLowerCase();
      const matchesSearch = 
        fullName.includes(searchTerm.toLowerCase()) ||
        (m.email && m.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (m.id && m.id.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === "all" || m.membershipStatus === statusFilter;
      const matchesDept = deptFilter === "all" || m.department === deptFilter;
      const matchesGender = genderFilter === "all" || m.gender === genderFilter;

      return matchesSearch && matchesStatus && matchesDept && matchesGender;
    });
    console.log("filteredMembers result count:", result.length);
    return result;
  }, [members, searchTerm, statusFilter, deptFilter, genderFilter]);

  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredMembers.slice(start, start + rowsPerPage);
  }, [filteredMembers, currentPage]);

  const totalPages = Math.ceil(filteredMembers.length / rowsPerPage);

  const exportToCSV = () => {
    const headers = ["Member ID", "First Name", "Last Name", "Gender", "Phone", "Email", "Department", "Status", "Joined Date"];
    const rows = filteredMembers.map(m => [
      m.id, m.firstName, m.lastName, m.gender, m.phone, m.email, m.department, m.membershipStatus, m.membershipDate
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `church_members_${format(new Date(), "yyyyMMdd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Members list exported successfully");
  };

  const handleEditMember = (member: Member) => {
    setEditingMember(member);
    setActiveTab("add");
  };

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfMember, setPdfMember] = useState<Member | null>(null);
  const [pdfHousehold, setPdfHousehold] = useState<Household | null | undefined>(null);

  const handleGeneratePdf = async (member: Member) => {
    setPdfMember(member);
    setIsGeneratingPdf(true);
    toast.info("Preparing multi-page PDF document...");

    // Wait for the template to render
    setTimeout(async () => {
      const element = document.getElementById(`member-pdf-${member.id}`);
      if (!element) {
        toast.error("Failed to generate PDF: Template not found");
        setIsGeneratingPdf(false);
        return;
      }

      try {
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
          allowTaint: true,
          onclone: (clonedDoc) => {
            // Remove all stylesheets that might contain oklch to prevent parsing errors
            const styles = clonedDoc.querySelectorAll('style, link[rel="stylesheet"]');
            styles.forEach(s => s.remove());
            
            // Add a basic style for the PDF template classes
            const style = clonedDoc.createElement('style');
            style.innerHTML = `
              .flex { display: flex; }
              .flex-col { flex-direction: column; }
              .flex-wrap { flex-wrap: wrap; }
              .justify-between { justify-content: space-between; }
              .justify-center { justify-content: center; }
              .items-start { align-items: flex-start; }
              .items-center { align-items: center; }
              .items-end { align-items: flex-end; }
              .gap-1\\.5 { gap: 0.375rem; }
              .gap-2 { gap: 0.5rem; }
              .gap-3 { gap: 0.75rem; }
              .gap-4 { gap: 1rem; }
              .gap-6 { gap: 1.5rem; }
              .gap-8 { gap: 2rem; }
              .gap-12 { gap: 3rem; }
              .gap-x-3 { column-gap: 0.75rem; }
              .gap-x-4 { column-gap: 1rem; }
              .gap-x-8 { column-gap: 2rem; }
              .gap-y-1\\.5 { row-gap: 0.375rem; }
              .gap-y-2 { row-gap: 0.5rem; }
              .gap-y-4 { row-gap: 1rem; }
              .grid { display: grid; }
              .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
              .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
              .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
              .grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
              .col-span-1 { grid-column: span 1 / span 1; }
              .col-span-2 { grid-column: span 2 / span 2; }
              .col-span-3 { grid-column: span 3 / span 3; }
              .col-span-4 { grid-column: span 4 / span 4; }
              .mt-0\\.5 { margin-top: 0.125rem; }
              .mt-1 { margin-top: 0.25rem; }
              .mt-2 { margin-top: 0.5rem; }
              .mt-3 { margin-top: 0.75rem; }
              .mt-4 { margin-top: 1rem; }
              .mt-6 { margin-top: 1.5rem; }
              .mt-8 { margin-top: 2rem; }
              .mt-10 { margin-top: 2.5rem; }
              .mt-12 { margin-top: 3rem; }
              .mb-0\\.5 { margin-bottom: 0.125rem; }
              .mb-1 { margin-bottom: 0.25rem; }
              .mb-1\\.5 { margin-bottom: 0.375rem; }
              .mb-2 { margin-bottom: 0.5rem; }
              .mb-3 { margin-bottom: 0.75rem; }
              .mb-4 { margin-bottom: 1rem; }
              .mb-6 { margin-bottom: 1.5rem; }
              .mb-8 { margin-bottom: 2rem; }
              .mb-10 { margin-bottom: 2.5rem; }
              .ml-auto { margin-left: auto; }
              .p-1\\.5 { padding: 0.375rem; }
              .p-2 { padding: 0.5rem; }
              .p-4 { padding: 1rem; }
              .p-6 { padding: 1.5rem; }
              .p-8 { padding: 2rem; }
              .p-12 { padding: 3rem; }
              .px-1\\.5 { padding-left: 0.375rem; padding-right: 0.375rem; }
              .px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
              .px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
              .px-4 { padding-left: 1rem; padding-right: 1rem; }
              .py-0\\.5 { padding-top: 0.125rem; padding-bottom: 0.125rem; }
              .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
              .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
              .pb-0\\.5 { padding-bottom: 0.125rem; }
              .pb-1 { padding-bottom: 0.25rem; }
              .pb-2 { padding-bottom: 0.5rem; }
              .pb-3 { padding-bottom: 0.75rem; }
              .pb-4 { padding-bottom: 1rem; }
              .pb-8 { padding-bottom: 2rem; }
              .pt-3 { padding-top: 0.75rem; }
              .pt-4 { padding-top: 1rem; }
              .pt-8 { padding-top: 2rem; }
              .w-3\\.5 { width: 0.875rem; }
              .w-5 { width: 1.25rem; }
              .w-8 { width: 2rem; }
              .w-10 { width: 2.5rem; }
              .w-16 { width: 4rem; }
              .w-20 { width: 5rem; }
              .w-24 { width: 6rem; }
              .w-32 { width: 8rem; }
              .w-40 { width: 10rem; }
              .w-\\[300px\\] { width: 300px; }
              .w-\\[800px\\] { width: 800px; }
              .h-3\\.5 { height: 0.875rem; }
              .h-5 { height: 1.25rem; }
              .h-8 { height: 2rem; }
              .h-10 { height: 2.5rem; }
              .h-16 { height: 4rem; }
              .h-20 { height: 5rem; }
              .h-32 { height: 8rem; }
              .w-full { width: 100%; }
              .h-full { height: 100%; }
              .rounded { border-radius: 0.25rem; }
              .rounded-lg { border-radius: 0.5rem; }
              .rounded-xl { border-radius: 0.75rem; }
              .rounded-full { border-radius: 9999px; }
              .border { border: 1px solid #e5e7eb; }
              .border-2 { border: 2px solid #e5e7eb; }
              .border-4 { border: 4px solid #e5e7eb; }
              .border-b { border-bottom: 1px solid #e5e7eb; }
              .border-b-2 { border-bottom: 2px solid #e5e7eb; }
              .border-t { border-top: 1px solid #e5e7eb; }
              .border-gray-50 { border-color: #f9fafb; }
              .border-gray-100 { border-color: #f3f4f6; }
              .border-gray-200 { border-color: #e5e7eb; }
              .border-gray-300 { border-color: #d1d5db; }
              .border-blue-100 { border-color: #dbeafe; }
              .border-blue-200 { border-color: #bfdbfe; }
              .bg-white { background-color: #ffffff; }
              .bg-gray-50 { background-color: #f9fafb; }
              .bg-gray-100 { background-color: #f3f4f6; }
              .bg-blue-50 { background-color: #eff6ff; }
              .bg-blue-50\\/30 { background-color: rgba(239, 246, 255, 0.3); }
              .bg-blue-50\\/50 { background-color: rgba(239, 246, 255, 0.5); }
              .bg-green-50 { background-color: #f0fdf4; }
              .text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
              .text-xl { font-size: 1.25rem; line-height: 1.75rem; }
              .text-lg { font-size: 1.125rem; line-height: 1.75rem; }
              .text-base { font-size: 1rem; line-height: 1.5rem; }
              .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
              .text-xs { font-size: 0.75rem; line-height: 1rem; }
              .text-\\[7px\\] { font-size: 7px; }
              .text-\\[8px\\] { font-size: 8px; }
              .text-\\[9px\\] { font-size: 9px; }
              .text-\\[10px\\] { font-size: 10px; }
              .text-\\[11px\\] { font-size: 11px; }
              .font-bold { font-weight: 700; }
              .font-black { font-weight: 900; }
              .font-medium { font-weight: 500; }
              .italic { font-style: italic; }
              .uppercase { text-transform: uppercase; }
              .tracking-wide { letter-spacing: 0.025em; }
              .tracking-wider { letter-spacing: 0.05em; }
              .leading-tight { line-height: 1.25; }
              .leading-none { line-height: 1; }
              .text-right { text-align: right; }
              .text-center { text-align: center; }
              .text-gray-900 { color: #111827; }
              .text-gray-800 { color: #1f2937; }
              .text-gray-600 { color: #4b5563; }
              .text-gray-500 { color: #6b7280; }
              .text-gray-400 { color: #9ca3af; }
              .text-gray-300 { color: #d1d5db; }
              .text-blue-400 { color: #60a5fa; }
              .text-blue-600 { color: #2563eb; }
              .text-blue-700 { color: #1d4ed8; }
              .text-green-700 { color: #15803d; }
              .overflow-hidden { overflow: hidden; }
              .object-cover { object-fit: cover; }
              .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
              .font-sans { font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif; }
              .space-y-0\\.5 > * + * { margin-top: 0.125rem; }
              .space-y-1 > * + * { margin-top: 0.25rem; }
              .space-y-2 > * + * { margin-top: 0.5rem; }
              .space-y-3 > * + * { margin-top: 0.75rem; }
              .break-inside-avoid { break-inside: avoid; }
              .max-w-\\[300px\\] { max-width: 300px; }
            `;
            clonedDoc.head.appendChild(style);
          }
        });
        
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4"
        });

        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        const pageHeight = pdf.internal.pageSize.getHeight();
        let heightLeft = pdfHeight;
        let position = 0;

        // Add first page
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;

        // Add subsequent pages if content is longer than one page
        while (heightLeft >= 0) {
          position = heightLeft - pdfHeight;
          pdf.addPage();
          pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
          heightLeft -= pageHeight;
        }

        pdf.save(`member_profile_${member.firstName}_${member.lastName}.pdf`);
        toast.success("PDF generated successfully");
      } catch (error) {
        console.error("PDF Generation Error:", error);
        toast.error("Failed to generate PDF");
      } finally {
        setIsGeneratingPdf(false);
        setPdfMember(null);
      }
    }, 800);
  };

  const [isDeactivateDialogOpen, setIsDeactivateDialogOpen] = useState(false);
  const [memberToDeactivate, setMemberToDeactivate] = useState<string | null>(null);

  const handleDeactivate = async (id: string) => {
    const member = members.find(m => m.id === id);
    if (member) {
      try {
        await updateDoc(doc(db, "members", id), {
          membershipStatus: "Inactive"
        });
        
        await logAudit(
          "UPDATE",
          "MEMBER",
          id,
          `Deactivated member: ${member.firstName} ${member.lastName}`,
          [{ field: "membershipStatus", oldValue: member.membershipStatus, newValue: "Inactive" }]
        );

        toast.success(`Member ${member.firstName} ${member.lastName} deactivated`);
        setIsDeactivateDialogOpen(false);
        setMemberToDeactivate(null);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `members/${id}`);
      }
    }
  };

  // --- Tab 2: Add/Edit Member Form State ---
  const initialFormData: Partial<Member> = {
    title: "",
    firstName: "",
    lastName: "",
    otherNames: "",
    gender: "Male",
    dateOfBirth: "",
    placeOfBirth: "",
    dayBorn: "",
    homeTown: "",
    region: "",
    country: "Ghana",
    languagesSpoken: "",
    maritalStatus: "",
    typeOfMarriage: "",
    dateOfMarriage: "",
    placeOfMarriage: "",
    spouseName: "",
    children: [],
    father: { name: "", isAlive: true, phone: "" },
    mother: { name: "", isAlive: true, phone: "" },
    nextOfKin: "",
    nextOfKinPhone: "",
    contactPersonFamilyName: "",
    contactPersonFamilyTel: "",
    educationLevel: "",
    occupationProfession: "",
    membershipDate: format(new Date(), "yyyy-MM-dd"),
    groupMinistry: "",
    generalGroup: "",
    position: "",
    effectiveDate: "",
    relDenomination: "",
    isBaptized: false,
    isCommunicant: false,
    baptismDate: "",
    baptismPlace: "",
    baptismMinisterName: "",
    confirmationDate: "",
    confirmationPlace: "",
    confirmationMinisterName: "",
    housePhoneNumber: "",
    cellPhoneNumber: "",
    email: "",
    residenceArea: "",
    address: "",
    gpsAddress: "",
    postalAddress: "",
    membershipStatus: "Active",
    department: "",
    role: "Other",
    householdId: "",
    phone: ""
  };

  const [formData, setFormData] = useState<Partial<Member>>(initialFormData);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isCreatingNewHousehold, setIsCreatingNewHousehold] = useState(false);
  const [newHouseholdName, setNewHouseholdName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset form when editingMember changes
  useEffect(() => {
    if (editingMember) {
      setFormData(editingMember);
      setPhotoPreview(editingMember.photo || null);
    } else {
      setFormData(initialFormData);
      setPhotoPreview(null);
    }
  }, [editingMember]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateMemberId = () => {
    const random = Math.floor(10000 + Math.random() * 90000);
    return `CHU-${random}`;
  };

  const updateFather = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      father: { 
        ...prev.father!, 
        [field]: value,
        ...(field === 'isAlive' && value === false ? { phone: "" } : {})
      }
    }));
  };

  const updateMother = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      mother: { 
        ...prev.mother!, 
        [field]: value,
        ...(field === 'isAlive' && value === false ? { phone: "" } : {})
      }
    }));
  };

  const updateChild = (index: number, field: string, value: any) => {
    const newChildren = [...(formData.children || [])];
    if (!newChildren[index]) {
      newChildren[index] = { name: "", dateOfBirth: "", placeOfBirth: "" };
    }
    newChildren[index] = { ...newChildren[index], [field]: value };
    setFormData(prev => ({ ...prev, children: newChildren }));
  };

  const addChild = () => {
    setFormData(prev => ({
      ...prev,
      children: [...(prev.children || []), { name: "", dateOfBirth: "", placeOfBirth: "" }]
    }));
  };

  const removeChild = (index: number) => {
    setFormData(prev => ({
      ...prev,
      children: prev.children?.filter((_, i) => i !== index)
    }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.firstName || !formData.lastName || !formData.cellPhoneNumber) {
      toast.error("Please fill in all required fields (First Name, Last Name, Cell Phone)");
      return;
    }

    let householdId = formData.householdId === "none" ? "" : (formData.householdId || "");
    const memberId = editingMember ? editingMember.id : generateMemberId();
    
    try {
      // Handle new household creation
      if (isCreatingNewHousehold && newHouseholdName) {
        householdId = `FAM-${Math.floor(100 + Math.random() * 899)}`;
        const newHousehold: Household = {
          householdId,
          householdName: newHouseholdName,
          members: [memberId]
        };
        await setDoc(doc(db, "households", householdId), newHousehold);
        setIsCreatingNewHousehold(false);
        setNewHouseholdName("");
      }

      const memberData: Member = {
        ...(formData as Member),
        id: memberId,
        photo: photoPreview || "",
        householdId
      };

      // If editing, handle old household removal if household changed
      if (editingMember && editingMember.householdId && editingMember.householdId !== householdId) {
        const oldHousehold = households.find(h => h.householdId === editingMember.householdId);
        if (oldHousehold) {
          await updateDoc(doc(db, "households", editingMember.householdId), {
            members: oldHousehold.members.filter(id => id !== memberId)
          });
        }
      }

      if (editingMember) {
        await setDoc(doc(db, "members", memberId), memberData);
        
        await logAudit(
          "UPDATE",
          "MEMBER",
          memberId,
          `Updated member: ${memberData.firstName} ${memberData.lastName}`,
          Object.keys(memberData).map(key => ({
            field: key,
            oldValue: (editingMember as any)[key],
            newValue: (memberData as any)[key]
          })).filter(c => JSON.stringify(c.oldValue) !== JSON.stringify(c.newValue))
        );

        toast.success("Member updated successfully");
      } else {
        await setDoc(doc(db, "members", memberId), memberData);
        
        await logAudit(
          "CREATE",
          "MEMBER",
          memberId,
          `Registered new member: ${memberData.firstName} ${memberData.lastName}`
        );

        toast.success("New member registered successfully");
      }

      // Update existing household members list if not a newly created one
      if (householdId && !(isCreatingNewHousehold && newHouseholdName)) {
        const household = households.find(h => h.householdId === householdId);
        if (household && !household.members.includes(memberId)) {
          await updateDoc(doc(db, "households", householdId), {
            members: [...household.members, memberId]
          });
        }
      }

      setEditingMember(null);
      setFormData(initialFormData);
      setPhotoPreview(null);
      setActiveTab("all");
    } catch (error) {
      handleFirestoreError(error, editingMember ? OperationType.UPDATE : OperationType.CREATE, "members/households");
    }
  };

  // --- Tab 3: Households State ---
  const [selectedHousehold, setSelectedHousehold] = useState<Household | null>(null);
  const [isAddHouseholdOpen, setIsAddHouseholdOpen] = useState(false);
  const [addHouseholdName, setAddHouseholdName] = useState("");

  const handleCreateHousehold = async () => {
    if (addHouseholdName) {
      const householdId = `FAM-${Math.floor(100 + Math.random() * 899)}`;
      const newHousehold: Household = {
        householdId,
        householdName: addHouseholdName,
        members: []
      };
      try {
        await setDoc(doc(db, "households", householdId), newHousehold);
        
        await logAudit(
          "CREATE",
          "HOUSEHOLD",
          householdId,
          `Created new household: ${addHouseholdName}`
        );

        setAddHouseholdName("");
        setIsAddHouseholdOpen(false);
        toast.success("Household created successfully");
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, "households");
      }
    }
  };

  const removeMemberFromHousehold = async (householdId: string, memberId: string) => {
    const household = households.find(h => h.householdId === householdId);
    if (household) {
      const updatedMembers = household.members.filter(id => id !== memberId);
      try {
        await updateDoc(doc(db, "households", householdId), {
          members: updatedMembers
        });
        
        const member = members.find(m => m.id === memberId);
        if (member) {
          await updateDoc(doc(db, "members", memberId), {
            householdId: ""
          });
        }
        
        toast.info("Member removed from household");
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, "households/members");
      }
    }
  };

  const handleBulkUpdate = async () => {
    if (selectedMemberIds.length === 0) return;
    setIsBulkUpdating(true);
    try {
      const updates = selectedMemberIds.map(async (id) => {
        const member = members.find(m => m.id === id);
        if (!member) return;

        const updatePayload: any = {};
        if (bulkUpdateData.status) updatePayload.membershipStatus = bulkUpdateData.status;
        if (bulkUpdateData.ministry) updatePayload.groupMinistry = bulkUpdateData.ministry;

        if (Object.keys(updatePayload).length > 0) {
          await updateDoc(doc(db, "members", id), updatePayload);
          await logAudit(
            "UPDATE",
            "MEMBER",
            id,
            `Bulk updated member: ${member.firstName} ${member.lastName}`,
            Object.keys(updatePayload).map(key => ({
              field: key,
              oldValue: (member as any)[key],
              newValue: updatePayload[key]
            }))
          );
        }
      });

      await Promise.all(updates);
      toast.success(`Successfully updated ${selectedMemberIds.length} members`);
      setIsBulkUpdateDialogOpen(false);
      setSelectedMemberIds([]);
      setBulkUpdateData({ status: "", ministry: "" });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, "bulk-members");
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleBulkCsvExport = () => {
    const selectedMembers = members.filter(m => selectedMemberIds.includes(m.id));
    const dataToExport = selectedMembers.length > 0 ? selectedMembers : filteredMembers;
    
    const headers = ["ID", "Title", "First Name", "Last Name", "Gender", "Phone", "Email", "Department", "Status"];
    const csvContent = [
      headers.join(","),
      ...dataToExport.map(m => [
        m.id,
        m.title,
        m.firstName,
        m.lastName,
        m.gender,
        m.phone,
        m.email,
        m.department || "",
        m.membershipStatus
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `church_members_${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Exported ${dataToExport.length} members to CSV`);
  };

  const handleBulkPdfExport = async () => {
    const selectedMembers = members.filter(m => selectedMemberIds.includes(m.id));
    if (selectedMembers.length === 0) {
      toast.error("Please select members to export to PDF");
      return;
    }

    setIsGeneratingBulkPdf(true);
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    try {
      for (let i = 0; i < selectedMembers.length; i++) {
        const member = selectedMembers[i];
        const household = households.find(h => h.householdId === member.householdId);
        
        setPdfMember(member);
        setPdfHousehold(household);
        
        // Wait for render
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const element = document.getElementById(`member-pdf-${member.id}`);
        if (element) {
          const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: "#ffffff"
          });
          
          const imgData = canvas.toDataURL("image/jpeg", 0.95);
          const imgProps = pdf.getImageProperties(imgData);
          const ratio = Math.min(pdfWidth / imgProps.width, pdfHeight / imgProps.height);
          
          if (i > 0) pdf.addPage();
          pdf.addImage(imgData, "JPEG", 0, 0, imgProps.width * ratio, imgProps.height * ratio);
        }
      }

      pdf.save(`church_members_profiles_${format(new Date(), "yyyy-MM-dd")}.pdf`);
      toast.success(`Generated PDF for ${selectedMembers.length} members`);
      setPdfMember(null);
      setPdfHousehold(null);
    } catch (error) {
      console.error("PDF Generation Error:", error);
      toast.error("Failed to generate combined PDF");
    } finally {
      setIsGeneratingBulkPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-primary">Membership Management</h2>
            <p className="text-muted-foreground">Manage church members, households, and registration.</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList variant="premium" className="grid w-full grid-cols-3 max-w-md mb-8">
          <TabsTrigger value="all">All Members</TabsTrigger>
          <TabsTrigger value="add">{editingMember ? "Edit Member" : "Registration"}</TabsTrigger>
          <TabsTrigger value="households">Households</TabsTrigger>
        </TabsList>

        {/* --- Tab 1: All Members --- */}
        <TabsContent value="all" className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Search by name, ID, or email..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Visitor">Visitor</SelectItem>
                  <SelectItem value="Deceased">Deceased</SelectItem>
                </SelectContent>
              </Select>
              <Select value={genderFilter} onValueChange={setGenderFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genders</SelectItem>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                </SelectContent>
              </Select>
              {canExport && (
                <Button variant="outline" size="sm" onClick={handleBulkCsvExport} className="gap-2">
                  <Download className="h-4 w-4" /> Export
                </Button>
              )}
              {canEditMembership && (
                <Button size="sm" onClick={() => { setEditingMember(null); setActiveTab("add"); }} className="gap-2 bg-primary">
                  <UserPlus className="h-4 w-4" /> Add New
                </Button>
              )}
            </div>
          </div>

          {selectedMemberIds.length > 0 && (canEditMembership || canExport) && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mb-4 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-3">
                <Badge variant="default" className="bg-primary">{selectedMemberIds.length} selected</Badge>
                <span className="text-sm font-medium">Bulk Actions:</span>
              </div>
              <div className="flex items-center gap-2">
                {canEditMembership && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 gap-1"
                    onClick={() => setIsBulkUpdateDialogOpen(true)}
                  >
                    <Edit className="h-3.5 w-3.5" /> Update Status/Ministry
                  </Button>
                )}
                {canExport && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 gap-1"
                    onClick={handleBulkPdfExport}
                    disabled={isGeneratingBulkPdf}
                  >
                    {isGeneratingBulkPdf ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
                    Export Combined PDF
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 text-muted-foreground"
                  onClick={() => setSelectedMemberIds([])}
                >
                  <X className="h-3.5 w-3.5 mr-1" /> Clear
                </Button>
              </div>
            </div>
          )}

          <Card className="shadow-sm border-border">
            <CardContent className="p-0">
              {isLoading ? (
                <TableSkeleton rows={10} />
              ) : filteredMembers.length === 0 ? (
                <div className="py-12">
                  <EmptyState 
                    icon={Inbox}
                    title="No members found"
                    description={searchTerm ? `We couldn't find any members matching "${searchTerm}".` : "Your church membership list is currently empty."}
                    actionLabel={searchTerm ? "Clear Search" : "Add New Member"}
                    onAction={() => {
                      if (searchTerm) {
                        setSearchTerm("");
                      } else {
                        setActiveTab("add");
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-[40px]">
                          <Checkbox 
                            checked={selectedMemberIds.length === paginatedMembers.length && paginatedMembers.length > 0}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedMemberIds(paginatedMembers.map(m => m.id));
                              } else {
                                setSelectedMemberIds([]);
                              }
                            }}
                          />
                        </TableHead>
                        <TableHead className="w-[100px]">ID</TableHead>
                        <TableHead>Photo</TableHead>
                        <TableHead>Full Name</TableHead>
                        <TableHead>Gender</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Household</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedMembers.map((member) => (
                        <TableRow key={member.id} className={`hover:bg-muted/30 ${selectedMemberIds.includes(member.id) ? 'bg-primary/5' : ''}`}>
                          <TableCell>
                            <Checkbox 
                              checked={selectedMemberIds.includes(member.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedMemberIds(prev => [...prev, member.id]);
                                } else {
                                  setSelectedMemberIds(prev => prev.filter(id => id !== member.id));
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">{member.id}</TableCell>
                          <TableCell>
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={member.photo} alt={member.firstName} />
                              <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                                {member.firstName[0]}{member.lastName[0]}
                              </AvatarFallback>
                            </Avatar>
                          </TableCell>
                          <TableCell className="font-medium">{member.firstName} {member.lastName}</TableCell>
                          <TableCell className="text-xs">{member.gender}</TableCell>
                          <TableCell className="text-xs">{member.phone}</TableCell>
                          <TableCell className="text-xs">{member.department || "N/A"}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={member.membershipStatus === "Active" ? "default" : "secondary"}
                              className={member.membershipStatus === "Active" ? "bg-green-100 text-green-800 hover:bg-green-100 border-none" : ""}
                            >
                              {member.membershipStatus}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">
                            {households.find(h => h.householdId === member.householdId)?.householdName || "None"}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => {
                                  setViewingMember(member);
                                  setIsProfileDialogOpen(true);
                                }}>
                                  <Eye className="mr-2 h-4 w-4" /> View Profile
                                </DropdownMenuItem>
                                {canEditMembership && (
                                  <DropdownMenuItem onClick={() => handleEditMember(member)}>
                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                  </DropdownMenuItem>
                                )}
                                {canExport && (
                                  <DropdownMenuItem 
                                    onClick={() => handleGeneratePdf(member)}
                                    disabled={isGeneratingPdf}
                                  >
                                    {isGeneratingPdf && pdfMember?.id === member.id ? (
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                      <FileText className="mr-2 h-4 w-4" />
                                    )}
                                    Generate PDF
                                  </DropdownMenuItem>
                                )}
                                {canDelete && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      className="text-destructive"
                                      onClick={() => {
                                        setMemberToDeactivate(member.id);
                                        setIsDeactivateDialogOpen(true);
                                      }}
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" /> Deactivate
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex items-center justify-between p-4 border-t">
              <div className="text-xs text-muted-foreground">
                Showing {paginatedMembers.length} of {filteredMembers.length} members
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8" 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-xs font-medium">Page {currentPage} of {totalPages || 1}</div>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8"
                  disabled={currentPage === totalPages || totalPages === 0}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* --- Tab 2: Add/Edit Member Form --- */}
        <TabsContent value="add">
          <Card className="max-w-4xl mx-auto shadow-sm">
            <CardHeader>
              <CardTitle>{editingMember ? `Edit Member: ${editingMember.firstName} ${editingMember.lastName}` : "New Member Registration"}</CardTitle>
              <CardDescription>
                {editingMember ? "Update the member's information below." : "Fill in the details to register a new church member."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleFormSubmit} className="space-y-8">
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-10">
                    {/* Section 1: Personal Information */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-primary font-semibold">
                        <div className="h-6 w-1 bg-primary rounded-full" />
                        <h3>Personal Information</h3>
                      </div>

                      <div className="flex flex-col md:flex-row gap-6 items-start">
                        <div className="flex flex-col items-center gap-2">
                          <Avatar className="h-24 w-24 border-2 border-muted">
                            <AvatarImage src={photoPreview || ""} />
                            <AvatarFallback className="bg-muted text-muted-foreground">
                              <Camera className="h-8 w-8" />
                            </AvatarFallback>
                          </Avatar>
                          <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/*"
                            onChange={handlePhotoUpload}
                          />
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm" 
                            onClick={() => fileInputRef.current?.click()}
                            className="h-8"
                          >
                            Upload Photo
                          </Button>
                          {photoPreview && (
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => { setPhotoPreview(null); setFormData(prev => ({ ...prev, photo: "" })); }}
                              className="h-7 text-destructive text-[10px]"
                            >
                              Remove
                            </Button>
                          )}
                        </div>

                        <div className="flex-1 grid gap-4 md:grid-cols-3 w-full">
                          <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Select 
                              value={formData.title} 
                              onValueChange={(v) => setFormData({ ...formData, title: v })}
                            >
                              <SelectTrigger id="title">
                                <SelectValue placeholder="Select Title" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectLabel>Member Titles</SelectLabel>
                                <Separator className="my-1" />
                                {memberTitles.map(title => (
                                  <SelectItem key={title} value={title}>{title}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Surname (Last Name)</Label>
                          <Input 
                            id="lastName" 
                            required 
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="firstName">Other Names (First Name)</Label>
                          <Input 
                            id="firstName" 
                            required 
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Gender</Label>
                          <RadioGroup 
                            value={formData.gender} 
                            onValueChange={(v) => setFormData({ ...formData, gender: v as Gender })}
                            className="flex gap-4 pt-2"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="Male" id="male" />
                              <Label htmlFor="male" className="font-normal">Male</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="Female" id="female" />
                              <Label htmlFor="female" className="font-normal">Female</Label>
                            </div>
                          </RadioGroup>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="dob">Date of Birth</Label>
                          <Input 
                            id="dob" 
                            type="date" 
                            value={formData.dateOfBirth}
                            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="pob">Place of Birth</Label>
                          <Input 
                            id="pob" 
                            value={formData.placeOfBirth}
                            onChange={(e) => setFormData({ ...formData, placeOfBirth: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="dayBorn">Day Born</Label>
                          <Select 
                            value={formData.dayBorn} 
                            onValueChange={(v) => setFormData({ ...formData, dayBorn: v })}
                          >
                            <SelectTrigger id="dayBorn">
                              <SelectValue placeholder="Select Day" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectLabel>Day of the Week</SelectLabel>
                              <Separator className="my-1" />
                              {daysOfWeek.map(day => (
                                <SelectItem key={day} value={day}>{day}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="homeTown">Home Town</Label>
                          <Input 
                            id="homeTown" 
                            value={formData.homeTown}
                            onChange={(e) => setFormData({ ...formData, homeTown: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="region">Region</Label>
                          <Select 
                            value={formData.region} 
                            onValueChange={(v) => setFormData({ ...formData, region: v })}
                          >
                            <SelectTrigger id="region">
                              <SelectValue placeholder="Select Region" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectLabel>Ghana Regions</SelectLabel>
                              <Separator className="my-1" />
                              {regions.map(region => (
                                <SelectItem key={region} value={region}>{region}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="country">Country</Label>
                          <Select 
                            value={formData.country} 
                            onValueChange={(v) => setFormData({ ...formData, country: v })}
                          >
                            <SelectTrigger id="country">
                              <SelectValue placeholder="Select Country" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectLabel>Countries</SelectLabel>
                              <Separator className="my-1" />
                              {countries.map(country => (
                                <SelectItem key={country} value={country}>{country}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="md:col-span-2 space-y-2">
                          <Label htmlFor="languages">Languages Spoken</Label>
                          <Input 
                            id="languages" 
                            placeholder="e.g. English, Twi, Ga"
                            value={formData.languagesSpoken}
                            onChange={(e) => setFormData({ ...formData, languagesSpoken: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                    {/* Section 2: Family Details */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-primary font-semibold">
                        <div className="h-6 w-1 bg-primary rounded-full" />
                        <h3>Family Details</h3>
                      </div>
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                          <Label htmlFor="maritalStatus">Marital Status</Label>
                          <Select 
                            value={formData.maritalStatus} 
                            onValueChange={(v) => {
                              const updates: any = { maritalStatus: v };
                              if (v === "Single") {
                                updates.typeOfMarriage = "N/A";
                                updates.dateOfMarriage = "";
                                updates.placeOfMarriage = "N/A";
                                updates.spouseName = "N/A";
                              }
                              setFormData({ ...formData, ...updates });
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectLabel>Marital Status</SelectLabel>
                              <Separator className="my-1" />
                              {maritalStatuses.map(status => (
                                <SelectItem key={status} value={status}>{status}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {formData.maritalStatus !== "Single" && (
                          <>
                            <div className="space-y-2">
                              <Label htmlFor="typeOfMarriage">Type of Marriage</Label>
                              <Input 
                                id="typeOfMarriage" 
                                placeholder="e.g. Ordinance, Customary"
                                value={formData.typeOfMarriage}
                                onChange={(e) => setFormData({ ...formData, typeOfMarriage: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="dateOfMarriage">Date of Marriage</Label>
                              <Input 
                                id="dateOfMarriage" 
                                type="date"
                                value={formData.dateOfMarriage}
                                onChange={(e) => setFormData({ ...formData, dateOfMarriage: e.target.value })}
                              />
                            </div>
                            <div className="md:col-span-1 space-y-2">
                              <Label htmlFor="placeOfMarriage">Place of Marriage</Label>
                              <Input 
                                id="placeOfMarriage" 
                                value={formData.placeOfMarriage}
                                onChange={(e) => setFormData({ ...formData, placeOfMarriage: e.target.value })}
                              />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                              <Label htmlFor="spouseName">Spouse Name</Label>
                              <Input 
                                id="spouseName" 
                                value={formData.spouseName}
                                onChange={(e) => setFormData({ ...formData, spouseName: e.target.value })}
                              />
                            </div>
                          </>
                        )}
                      </div>

                      {/* Children Section */}
                      <div className="mt-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">Children</Label>
                          <Button type="button" variant="outline" size="sm" onClick={addChild} className="h-7 gap-1">
                            <Plus className="h-3 w-3" /> Add Child
                          </Button>
                        </div>
                        <div className="space-y-3">
                          {formData.children?.map((child, index) => (
                            <div key={index} className="grid gap-3 md:grid-cols-4 items-end p-3 border rounded-lg bg-muted/20">
                              <div className="md:col-span-2 space-y-1">
                                <Label className="text-[10px] uppercase text-muted-foreground">Name</Label>
                                <Input 
                                  value={child.name} 
                                  onChange={(e) => updateChild(index, "name", e.target.value)}
                                  className="h-8 text-sm"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[10px] uppercase text-muted-foreground">DOB</Label>
                                <Input 
                                  type="date"
                                  value={child.dateOfBirth} 
                                  onChange={(e) => updateChild(index, "dateOfBirth", e.target.value)}
                                  className="h-8 text-sm"
                                />
                              </div>
                              <div className="flex gap-2 items-end">
                                <div className="flex-1 space-y-1">
                                  <Label className="text-[10px] uppercase text-muted-foreground">POB</Label>
                                  <Input 
                                    value={child.placeOfBirth} 
                                    onChange={(e) => updateChild(index, "placeOfBirth", e.target.value)}
                                    className="h-8 text-sm"
                                  />
                                </div>
                                <Button 
                                  type="button" 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-destructive"
                                  onClick={() => removeChild(index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                          {(!formData.children || formData.children.length === 0) && (
                            <p className="text-xs text-muted-foreground italic text-center py-2">No children added.</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Section 3: Parents & Family Contact */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-primary font-semibold">
                        <div className="h-6 w-1 bg-primary rounded-full" />
                        <h3>Parents & Family Contact</h3>
                      </div>
                      <div className="grid gap-6 md:grid-cols-2">
                        {/* Father */}
                        <div className="space-y-3 p-4 border rounded-lg">
                          <Label className="font-semibold text-sm">Biological Father</Label>
                          <div className="space-y-2">
                            <Label htmlFor="fName">Name</Label>
                            <Input 
                              id="fName" 
                              value={formData.father?.name}
                              onChange={(e) => updateFather("name", e.target.value)}
                            />
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="space-y-1">
                              <Label>Alive?</Label>
                              <RadioGroup 
                                value={formData.father?.isAlive ? "yes" : "no"} 
                                onValueChange={(v) => updateFather("isAlive", v === "yes")}
                                className="flex gap-4 pt-1"
                              >
                                <div className="flex items-center space-x-1">
                                  <RadioGroupItem value="yes" id="f-yes" />
                                  <Label htmlFor="f-yes" className="font-normal text-xs">Yes</Label>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <RadioGroupItem value="no" id="f-no" />
                                  <Label htmlFor="f-no" className="font-normal text-xs">No</Label>
                                </div>
                              </RadioGroup>
                            </div>
                            <div className="flex-1 space-y-1">
                              <Label htmlFor="fPhone">Phone No</Label>
                              <Input 
                                id="fPhone" 
                                value={formData.father?.phone}
                                onChange={(e) => updateFather("phone", e.target.value)}
                                className="h-8"
                                disabled={!formData.father?.isAlive}
                                placeholder={!formData.father?.isAlive ? "N/A" : ""}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Mother */}
                        <div className="space-y-3 p-4 border rounded-lg">
                          <Label className="font-semibold text-sm">Biological Mother</Label>
                          <div className="space-y-2">
                            <Label htmlFor="mName">Name</Label>
                            <Input 
                              id="mName" 
                              value={formData.mother?.name}
                              onChange={(e) => updateMother("name", e.target.value)}
                            />
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="space-y-1">
                              <Label>Alive?</Label>
                              <RadioGroup 
                                value={formData.mother?.isAlive ? "yes" : "no"} 
                                onValueChange={(v) => updateMother("isAlive", v === "yes")}
                                className="flex gap-4 pt-1"
                              >
                                <div className="flex items-center space-x-1">
                                  <RadioGroupItem value="yes" id="m-yes" />
                                  <Label htmlFor="m-yes" className="font-normal text-xs">Yes</Label>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <RadioGroupItem value="no" id="m-no" />
                                  <Label htmlFor="m-no" className="font-normal text-xs">No</Label>
                                </div>
                              </RadioGroup>
                            </div>
                            <div className="flex-1 space-y-1">
                              <Label htmlFor="mPhone">Phone No</Label>
                              <Input 
                                id="mPhone" 
                                value={formData.mother?.phone}
                                onChange={(e) => updateMother("phone", e.target.value)}
                                className="h-8"
                                disabled={!formData.mother?.isAlive}
                                placeholder={!formData.mother?.isAlive ? "N/A" : ""}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2 mt-4">
                        <div className="space-y-2">
                          <Label htmlFor="nextOfKin">Next of Kin Name</Label>
                          <Input 
                            id="nextOfKin" 
                            value={formData.nextOfKin}
                            onChange={(e) => setFormData({ ...formData, nextOfKin: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="nextOfKinPhone">Next of Kin Phone No</Label>
                          <Input 
                            id="nextOfKinPhone" 
                            value={formData.nextOfKinPhone}
                            onChange={(e) => setFormData({ ...formData, nextOfKinPhone: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="contactPerson">Contact Person (Family) Name</Label>
                          <Input 
                            id="contactPerson" 
                            value={formData.contactPersonFamilyName}
                            onChange={(e) => setFormData({ ...formData, contactPersonFamilyName: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="contactPersonTel">Tel</Label>
                          <Input 
                            id="contactPersonTel" 
                            value={formData.contactPersonFamilyTel}
                            onChange={(e) => setFormData({ ...formData, contactPersonFamilyTel: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Section 4: Education & Professional Details */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-primary font-semibold">
                        <div className="h-6 w-1 bg-primary rounded-full" />
                        <h3>Education & Professional Details</h3>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="eduLevel">Education Level</Label>
                          <Select 
                            value={formData.educationLevel} 
                            onValueChange={(v) => setFormData({ ...formData, educationLevel: v })}
                          >
                            <SelectTrigger id="eduLevel">
                              <SelectValue placeholder="Select Education Level" />
                            </SelectTrigger>
                            <SelectContent>
                              {educationLevels.map(level => (
                                <SelectItem key={level} value={level}>{level}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="occupation">Occupation/Profession</Label>
                          <Input 
                            id="occupation" 
                            value={formData.occupationProfession}
                            onChange={(e) => setFormData({ ...formData, occupationProfession: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Section 5: Membership Details */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-primary font-semibold">
                        <div className="h-6 w-1 bg-primary rounded-full" />
                        <h3>Membership Details</h3>
                      </div>
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                          <Label htmlFor="membershipDate">Membership Date</Label>
                          <Input 
                            id="membershipDate" 
                            type="date"
                            value={formData.membershipDate}
                            onChange={(e) => setFormData({ ...formData, membershipDate: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="groupMinistry">Group/Ministry (Team)</Label>
                          <Select 
                            value={formData.groupMinistry} 
                            onValueChange={(v) => setFormData({ ...formData, groupMinistry: v })}
                          >
                            <SelectTrigger id="groupMinistry">
                              <SelectValue placeholder="Select Team" />
                            </SelectTrigger>
                            <SelectContent>
                              {teams.length > 0 ? (
                                teams.map(team => (
                                  <SelectItem key={team} value={team}>{team}</SelectItem>
                                ))
                              ) : (
                                <>
                                  <SelectItem value="Praise Team">Praise Team</SelectItem>
                                  <SelectItem value="Protocol">Protocol</SelectItem>
                                  <SelectItem value="Welfare Team">Welfare Team</SelectItem>
                                </>
                              )}
                              <SelectItem value="None">None</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="generalGroup">General Group</Label>
                          <Input 
                            id="generalGroup" 
                            value={formData.generalGroup}
                            onChange={(e) => setFormData({ ...formData, generalGroup: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="position">Position</Label>
                          <Input 
                            id="position" 
                            value={formData.position}
                            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="effectiveDate">Effective Date</Label>
                          <Input 
                            id="effectiveDate" 
                            type="date"
                            value={formData.effectiveDate}
                            onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="relDenom">Rel. Denomination</Label>
                          <Input 
                            id="relDenom" 
                            value={formData.relDenomination}
                            onChange={(e) => setFormData({ ...formData, relDenomination: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="grid gap-6 md:grid-cols-2 mt-4">
                        <div className="flex items-center gap-8 p-3 border rounded-lg bg-muted/10">
                          <div className="flex items-center space-x-2">
                            <Label>Baptized?</Label>
                            <RadioGroup 
                              value={formData.isBaptized ? "yes" : "no"} 
                              onValueChange={(v) => setFormData({ ...formData, isBaptized: v === "yes" })}
                              className="flex gap-4"
                            >
                              <div className="flex items-center space-x-1">
                                <RadioGroupItem value="yes" id="b-yes" />
                                <Label htmlFor="b-yes" className="font-normal">Yes</Label>
                              </div>
                              <div className="flex items-center space-x-1">
                                <RadioGroupItem value="no" id="b-no" />
                                <Label htmlFor="b-no" className="font-normal">No</Label>
                              </div>
                            </RadioGroup>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Label>Communicant?</Label>
                            <RadioGroup 
                              value={formData.isCommunicant ? "yes" : "no"} 
                              onValueChange={(v) => setFormData({ ...formData, isCommunicant: v === "yes" })}
                              className="flex gap-4"
                            >
                              <div className="flex items-center space-x-1">
                                <RadioGroupItem value="yes" id="c-yes" />
                                <Label htmlFor="c-yes" className="font-normal">Yes</Label>
                              </div>
                              <div className="flex items-center space-x-1">
                                <RadioGroupItem value="no" id="c-no" />
                                <Label htmlFor="c-no" className="font-normal">No</Label>
                              </div>
                            </RadioGroup>
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-6 md:grid-cols-2 mt-4">
                        {/* Baptism Details */}
                        <div className="space-y-3 p-4 border rounded-lg">
                          <Label className="font-semibold text-sm">Baptism Details</Label>
                          <div className="grid gap-3">
                            <div className="space-y-1">
                              <Label htmlFor="bDate">Date</Label>
                              <Input 
                                id="bDate" 
                                type="date"
                                value={formData.baptismDate}
                                onChange={(e) => setFormData({ ...formData, baptismDate: e.target.value })}
                                className="h-8"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="bPlace">Place</Label>
                              <Input 
                                id="bPlace" 
                                value={formData.baptismPlace}
                                onChange={(e) => setFormData({ ...formData, baptismPlace: e.target.value })}
                                className="h-8"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="bMinister">Minister's Name</Label>
                              <Input 
                                id="bMinister" 
                                value={formData.baptismMinisterName}
                                onChange={(e) => setFormData({ ...formData, baptismMinisterName: e.target.value })}
                                className="h-8"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Confirmation Details */}
                        <div className="space-y-3 p-4 border rounded-lg">
                          <Label className="font-semibold text-sm">Confirmation Details</Label>
                          <div className="grid gap-3">
                            <div className="space-y-1">
                              <Label htmlFor="confDate">Date</Label>
                              <Input 
                                id="confDate" 
                                type="date"
                                value={formData.confirmationDate}
                                onChange={(e) => setFormData({ ...formData, confirmationDate: e.target.value })}
                                className="h-8"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="confPlace">Place</Label>
                              <Input 
                                id="confPlace" 
                                value={formData.confirmationPlace}
                                onChange={(e) => setFormData({ ...formData, confirmationPlace: e.target.value })}
                                className="h-8"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="confMinister">Minister's Name</Label>
                              <Input 
                                id="confMinister" 
                                value={formData.confirmationMinisterName}
                                onChange={(e) => setFormData({ ...formData, confirmationMinisterName: e.target.value })}
                                className="h-8"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Section 6: Contact & Residence Details */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-primary font-semibold">
                        <div className="h-6 w-1 bg-primary rounded-full" />
                        <h3>Contact & Residence Details</h3>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="housePhone">House Phone Number</Label>
                          <Input 
                            id="housePhone" 
                            value={formData.housePhoneNumber}
                            onChange={(e) => setFormData({ ...formData, housePhoneNumber: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cellPhone">Cell Phone Number</Label>
                          <Input 
                            id="cellPhone" 
                            required
                            value={formData.cellPhoneNumber}
                            onChange={(e) => setFormData({ ...formData, cellPhoneNumber: e.target.value, phone: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address</Label>
                          <Input 
                            id="email" 
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="resArea">Residence Area</Label>
                          <Input 
                            id="resArea" 
                            value={formData.residenceArea}
                            onChange={(e) => setFormData({ ...formData, residenceArea: e.target.value })}
                          />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                          <Label htmlFor="resAddress">Residence Address</Label>
                          <Input 
                            id="resAddress" 
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                          <Label htmlFor="gpsAddress">GPS Address (Google Maps Location)</Label>
                          <Input 
                            id="gpsAddress" 
                            placeholder="e.g. GA-123-4567 or Latitude, Longitude"
                            value={formData.gpsAddress || ""}
                            onChange={(e) => setFormData({ ...formData, gpsAddress: e.target.value })}
                          />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                          <Label htmlFor="postalAddress">Postal Address</Label>
                          <Input 
                            id="postalAddress" 
                            value={formData.postalAddress}
                            onChange={(e) => setFormData({ ...formData, postalAddress: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Section 7: Administrative Details */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-primary font-semibold">
                        <div className="h-6 w-1 bg-primary rounded-full" />
                        <h3>Administrative Details</h3>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Membership Status</Label>
                          <Select 
                            value={formData.membershipStatus} 
                            onValueChange={(v) => setFormData({ ...formData, membershipStatus: v as MembershipStatus })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Active">Active</SelectItem>
                              <SelectItem value="Inactive">Inactive</SelectItem>
                              <SelectItem value="Visitor">Visitor</SelectItem>
                              <SelectItem value="Deceased">Deceased</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="dept">Department</Label>
                          <Select 
                            value={formData.department} 
                            onValueChange={(v) => setFormData({ ...formData, department: v })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                            <SelectContent>
                              {departments.length > 0 ? (
                                departments.map((dept) => (
                                  <SelectItem key={dept} value={dept}>
                                    {dept}
                                  </SelectItem>
                                ))
                              ) : (
                                <>
                                  <SelectItem value="Choir">Choir</SelectItem>
                                  <SelectItem value="Ushers">Ushers</SelectItem>
                                  <SelectItem value="Youth">Youth</SelectItem>
                                  <SelectItem value="Media">Media</SelectItem>
                                  <SelectItem value="Children's Ministry">Children's Ministry</SelectItem>
                                  <SelectItem value="Elders">Elders</SelectItem>
                                  <SelectItem value="Evangelism">Evangelism</SelectItem>
                                </>
                              )}
                              <SelectItem value="None">None</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Household</Label>
                          <div className="space-y-3">
                            {!isCreatingNewHousehold ? (
                              <div className="flex gap-2">
                                <Select 
                                  value={formData.householdId} 
                                  onValueChange={(v) => setFormData({ ...formData, householdId: v })}
                                >
                                  <SelectTrigger className="flex-1">
                                    <SelectValue placeholder="Link to household" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">No Household</SelectItem>
                                    {households.map(h => (
                                      <SelectItem key={h.householdId} value={h.householdId}>
                                        {h.householdName}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  onClick={() => setIsCreatingNewHousehold(true)}
                                >
                                  New
                                </Button>
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                <Input 
                                  placeholder="New Household Name" 
                                  value={newHouseholdName}
                                  onChange={(e) => setNewHouseholdName(e.target.value)}
                                  className="flex-1"
                                />
                                <Button 
                                  type="button" 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => { setIsCreatingNewHousehold(false); setNewHouseholdName(""); }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                            <Select 
                              value={formData.role} 
                              onValueChange={(v) => setFormData({ ...formData, role: v as HouseholdRole })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Role in household" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Head of Household">Head of Household</SelectItem>
                                <SelectItem value="Spouse">Spouse</SelectItem>
                                <SelectItem value="Child">Child</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="flex flex-col items-center justify-center p-4 border rounded-lg bg-muted/5">
                          <div className="relative group">
                            <div className="h-24 w-24 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden bg-muted/50">
                              {photoPreview ? (
                                <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
                              ) : (
                                <Camera className="h-8 w-8 text-muted-foreground/50" />
                              )}
                            </div>
                            <Button 
                              type="button"
                              variant="secondary" 
                              size="icon" 
                              className="absolute bottom-0 right-0 h-7 w-7 rounded-full shadow-md"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/*" 
                            onChange={handlePhotoUpload}
                          />
                          <Label className="text-[10px] text-muted-foreground mt-2">Profile Photo</Label>
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollArea>

                <div className="flex justify-end gap-3 pt-6 border-t">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => { setEditingMember(null); setActiveTab("all"); }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-primary px-8">
                    {editingMember ? "Update Member" : "Register Member"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- Tab 3: Households --- */}
        <TabsContent value="households" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search households..." className="pl-10" />
            </div>
            <Dialog open={isAddHouseholdOpen} onOpenChange={setIsAddHouseholdOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-primary">
                  <Plus className="h-4 w-4" /> Create Household
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Household</DialogTitle>
                  <DialogDescription>Enter a name for the new family unit.</DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Label htmlFor="hName">Household Name</Label>
                  <Input 
                    id="hName" 
                    placeholder="e.g. The Mensah Family" 
                    className="mt-2"
                    value={addHouseholdName}
                    onChange={(e) => setAddHouseholdName(e.target.value)}
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddHouseholdOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreateHousehold}>Create</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {households.map((household) => {
              const householdMembers = members.filter(m => household.members.includes(m.id));
              const headOfHousehold = householdMembers.find(m => m.role === "Head of Household");

              return (
                <Card key={household.householdId} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{household.householdName}</CardTitle>
                      <UsersIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <CardDescription>{householdMembers.length} members</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="flex -space-x-2 overflow-hidden mb-4">
                      {householdMembers.slice(0, 5).map((m) => (
                        <Avatar key={m.id} className="inline-block border-2 border-background h-8 w-8">
                          <AvatarImage src={m.photo} />
                          <AvatarFallback className="text-[10px]">{m.firstName[0]}</AvatarFallback>
                        </Avatar>
                      ))}
                      {householdMembers.length > 5 && (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-medium">
                          +{householdMembers.length - 5}
                        </div>
                      )}
                    </div>
                    <div className="text-xs">
                      <span className="text-muted-foreground">Head: </span>
                      <span className="font-medium">{headOfHousehold ? `${headOfHousehold.firstName} ${headOfHousehold.lastName}` : "Not set"}</span>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t p-3">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="w-full text-xs gap-2">
                          <Eye className="h-3 w-3" /> View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>{household.householdName}</DialogTitle>
                          <DialogDescription>Household Members and Details</DialogDescription>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                          <div className="space-y-2">
                            <Label className="text-xs uppercase text-muted-foreground">Members</Label>
                            <div className="space-y-2">
                              {householdMembers.map(m => (
                                <div key={m.id} className="flex items-center justify-between p-2 rounded-md bg-muted/30">
                                  <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8">
                                      <AvatarImage src={m.photo} />
                                      <AvatarFallback className="text-[10px]">{m.firstName[0]}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <div className="text-sm font-medium">{m.firstName} {m.lastName}</div>
                                      <div className="text-[10px] text-muted-foreground">{m.role}</div>
                                    </div>
                                  </div>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-7 w-7 text-destructive"
                                    onClick={() => removeMemberFromHousehold(household.householdId, m.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                          <Separator />
                          <Button variant="outline" className="w-full gap-2 text-xs">
                            <Plus className="h-3 w-3" /> Add Member to Household
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
      
      <MemberProfileDialog 
        member={viewingMember}
        isOpen={isProfileDialogOpen}
        onClose={() => {
          setIsProfileDialogOpen(false);
          setViewingMember(null);
        }}
        households={households}
      />

      {/* Deactivate Confirmation Dialog */}
      {/* Hidden PDF Template */}
      <div style={{ position: "absolute", left: "-9999px", top: "-9999px" }}>
        {pdfMember && (
          <MemberPdfTemplate 
            member={pdfMember} 
            household={households.find(h => h.householdId === pdfMember.householdId)}
          />
        )}
      </div>

      <AlertDialog open={isDeactivateDialogOpen} onOpenChange={setIsDeactivateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate this member? They will be marked as Inactive in the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setMemberToDeactivate(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => memberToDeactivate && handleDeactivate(memberToDeactivate)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isBulkUpdateDialogOpen} onOpenChange={setIsBulkUpdateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Bulk Update Members</DialogTitle>
            <DialogDescription>
              Update the status or ministry for {selectedMemberIds.length} selected members.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="bulk-status">Membership Status</Label>
              <Select 
                value={bulkUpdateData.status} 
                onValueChange={(v) => setBulkUpdateData(prev => ({ ...prev, status: v as MembershipStatus }))}
              >
                <SelectTrigger id="bulk-status">
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Visitor">Visitor</SelectItem>
                  <SelectItem value="Deceased">Deceased</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bulk-ministry">Group/Ministry</Label>
              <Select 
                value={bulkUpdateData.ministry} 
                onValueChange={(v) => setBulkUpdateData(prev => ({ ...prev, ministry: v }))}
              >
                <SelectTrigger id="bulk-ministry">
                  <SelectValue placeholder="Select new ministry" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkUpdateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleBulkUpdate} disabled={isBulkUpdating || (!bulkUpdateData.status && !bulkUpdateData.ministry)}>
              {isBulkUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Update {selectedMemberIds.length} Members
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
