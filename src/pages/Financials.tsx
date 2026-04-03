import React, { useState, useMemo, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Download, 
  Plus, 
  Search, 
  Filter, 
  Printer, 
  MoreVertical, 
  Trash2, 
  Edit, 
  CheckCircle2, 
  CreditCard,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Clock,
  X
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, isWithinInterval, parseISO, startOfDay, endOfDay } from "date-fns";
import { toast } from "sonner";
import { auth, db } from "../firebase";
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  deleteDoc,
  query,
  orderBy
} from "firebase/firestore";
import { 
  FinancialRecord, 
  FinancialRecordType, 
  Currency, 
  PledgeStatus,
  Member,
  AuditLog,
  FinancialCampaign
} from "../types";
import { logAudit } from "../lib/audit";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
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

export default function Financials() {
  const { user, role, isSuperAdmin, isSecretary, isFinance, canEditFinancials, canDelete, canExport } = useFirebase();
  const [financialRecords, setFinancialRecords] = useState<FinancialRecord[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [campaigns, setCampaigns] = useState<FinancialCampaign[]>([]);
  const [transactionTypes, setTransactionTypes] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("ledger");
  const [editingRecord, setEditingRecord] = useState<FinancialRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Real-time data fetching
  useEffect(() => {
    if (!user) return;
    setIsLoading(true);
    
    // Only allow access if user has appropriate role
    if (!isSuperAdmin && !isSecretary && !isFinance) {
      setIsLoading(false);
      return;
    }

    const recordsQuery = query(collection(db, "transactions"), orderBy("date", "desc"));
    const membersQuery = collection(db, "members");

    const unsubscribeRecords = onSnapshot(recordsQuery, (snapshot) => {
      const recordsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as FinancialRecord));
      setFinancialRecords(recordsData);
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "transactions");
    });

    const unsubscribeMembers = onSnapshot(membersQuery, (snapshot) => {
      const membersData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Member));
      setMembers(membersData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "members");
    });

    const campaignsQuery = query(collection(db, "campaigns"), orderBy("createdAt", "desc"));
    const unsubscribeCampaigns = onSnapshot(campaignsQuery, (snapshot) => {
      const campaignsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as FinancialCampaign));
      setCampaigns(campaignsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "campaigns");
    });

    const settingsDoc = doc(db, "settings", "global");
    const unsubscribeSettings = onSnapshot(settingsDoc, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.transactionTypes) setTransactionTypes(data.transactionTypes);
      }
    });

    return () => {
      unsubscribeRecords();
      unsubscribeMembers();
      unsubscribeCampaigns();
      unsubscribeSettings();
    };
  }, []);

  // --- Tab 1: Record Transaction State ---
  const [formData, setFormData] = useState<Partial<FinancialRecord>>({
    memberId: "",
    memberName: "",
    type: "Tithe",
    amount: "" as any,
    currency: "GHS",
    date: format(new Date(), "yyyy-MM-dd"),
    notes: "",
    pledgeStatus: undefined,
    pledgeTargetAmount: "" as any,
    pledgeDueDate: "",
    pledgeId: "",
    campaignId: "",
    campaignName: ""
  });
  const [memberSearch, setMemberSearch] = useState("");

  const pledges = useMemo(() => {
    const mainPledges = financialRecords.filter(r => r.type === "Pledge" || r.type === "Commitment");
    const payments = financialRecords.filter(r => r.type === "Pledge Payment");
    
    return mainPledges.map(p => {
      const pledgePayments = payments.filter(pay => pay.pledgeId === p.id);
      const paidAmount = pledgePayments.reduce((sum, pay) => sum + pay.amount, 0);
      const target = p.pledgeTargetAmount || p.amount || 0;
      
      let status: PledgeStatus = "Pending";
      if (paidAmount >= target && target > 0) status = "Fulfilled";
      else if (paidAmount > 0) status = "Partial";

      return {
        ...p,
        paidAmount,
        pledgeStatus: status
      };
    });
  }, [financialRecords]);

  const selectedMemberPledge = useMemo(() => {
    if (!formData.memberId) return null;
    const memberPledges = pledges.filter(p => p.memberId === formData.memberId);
    if (memberPledges.length === 0) return null;
    
    const totalTarget = memberPledges.reduce((sum, p) => sum + (p.pledgeTargetAmount || p.amount || 0), 0);
    const totalPaid = memberPledges.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
    const balance = Math.max(0, totalTarget - totalPaid);
    
    return {
      target: totalTarget,
      paid: totalPaid,
      balance: balance,
      currency: memberPledges[0].currency,
      count: memberPledges.length
    };
  }, [formData.memberId, pledges]);

  const memberActivePledges = useMemo(() => {
    if (!formData.memberId) return [];
    return pledges.filter(p => p.memberId === formData.memberId);
  }, [formData.memberId, pledges]);

  const filteredMembers = useMemo(() => {
    return members.filter(m => 
      `${m.firstName} ${m.lastName}`.toLowerCase().includes(memberSearch.toLowerCase()) ||
      m.id.toLowerCase().includes(memberSearch.toLowerCase())
    );
  }, [members, memberSearch]);

  const [pledgeCampaignFilter, setPledgeCampaignFilter] = useState("all");

  const filteredPledges = useMemo(() => {
    return pledges.filter(p => {
      const matchesCampaign = pledgeCampaignFilter === "all" || p.campaignId === pledgeCampaignFilter;
      return matchesCampaign;
    });
  }, [pledges, pledgeCampaignFilter]);

  const campaignSummaries = useMemo(() => {
    return campaigns.map(c => {
      const campaignPledges = financialRecords.filter(r => (r.type === "Pledge" || r.type === "Commitment") && r.campaignId === c.id);
      const pledgeIds = campaignPledges.map(p => p.id);
      const linkedPayments = financialRecords.filter(r => r.type === "Pledge Payment" && pledgeIds.includes(r.pledgeId || ""));
      const totalRedeemed = linkedPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      
      return {
        ...c,
        totalRedeemed
      };
    });
  }, [campaigns, financialRecords]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // For Offering, we don't strictly require a memberId
    const isOffering = formData.type === "Offering";
    if ((!isOffering && !formData.memberId) || !formData.amount) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      // Set default member name for Offering if not provided
      const finalMemberName = isOffering && !formData.memberId ? "General Congregation" : formData.memberName;
      const finalMemberId = isOffering && !formData.memberId ? "GENERAL" : formData.memberId;

      const isPledgeType = formData.type === "Pledge" || formData.type === "Commitment";

      if (editingRecord) {
        const recordRef = doc(db, "transactions", editingRecord.id);
        const updateData: any = {
          ...formData,
          memberId: finalMemberId,
          memberName: finalMemberName,
          amount: Number(formData.amount),
        };

        // Only include pledge fields if type is Pledge or Commitment
        if (isPledgeType) {
          updateData.pledgeTargetAmount = Number(formData.amount) || 0;
          updateData.pledgeStatus = formData.pledgeStatus || "Pending";
          updateData.pledgeDueDate = formData.pledgeDueDate || "";
          updateData.campaignId = formData.campaignId || "";
          updateData.campaignName = formData.campaignName || "";
        } else if (formData.type === "Pledge Payment") {
          updateData.pledgeId = formData.pledgeId || "";
          const linkedPledge = pledges.find(p => p.id === formData.pledgeId);
          if (linkedPledge) {
            updateData.campaignId = linkedPledge.campaignId || "";
            updateData.campaignName = linkedPledge.campaignName || "";
          }
        } else {
          // Remove pledge fields if type is not Pledge/Commitment
          delete updateData.pledgeStatus;
          delete updateData.pledgeTargetAmount;
          delete updateData.pledgeDueDate;
          delete updateData.pledgeId;
          delete updateData.campaignId;
          delete updateData.campaignName;
        }

        await updateDoc(recordRef, updateData);
        
        await logAudit(
          "UPDATE",
          "FINANCIAL",
          editingRecord.id,
          `Updated financial record for ${formData.memberName}`,
          Object.keys(updateData).map(key => ({
            field: key,
            oldValue: (editingRecord as any)[key],
            newValue: (updateData as any)[key]
          })).filter(c => JSON.stringify(c.oldValue) !== JSON.stringify(c.newValue))
        );

        toast.success("Transaction updated successfully");
      } else {
        const newData: any = {
          ...formData,
          memberId: finalMemberId,
          memberName: finalMemberName,
          amount: Number(formData.amount),
          createdAt: new Date().toISOString()
        };

        // Only include pledge fields if type is Pledge or Commitment
        if (isPledgeType) {
          newData.pledgeTargetAmount = Number(formData.amount) || 0;
          newData.pledgeStatus = formData.pledgeStatus || "Pending";
          newData.pledgeDueDate = formData.pledgeDueDate || "";
          newData.campaignId = formData.campaignId || "";
          newData.campaignName = formData.campaignName || "";
        } else if (formData.type === "Pledge Payment") {
          newData.pledgeId = formData.pledgeId || "";
          const linkedPledge = pledges.find(p => p.id === formData.pledgeId);
          if (linkedPledge) {
            newData.campaignId = linkedPledge.campaignId || "";
            newData.campaignName = linkedPledge.campaignName || "";
          }
        } else {
          // Remove pledge fields if type is not Pledge/Commitment
          delete newData.pledgeStatus;
          delete newData.pledgeTargetAmount;
          delete newData.pledgeDueDate;
          delete newData.pledgeId;
          delete newData.campaignId;
          delete newData.campaignName;
        }

        const docRef = await addDoc(collection(db, "transactions"), newData);
        
        await logAudit(
          "CREATE",
          "FINANCIAL",
          docRef.id,
          `Recorded new ${formData.type} for ${formData.memberName}`
        );

        toast.success("Transaction recorded successfully");
      }

      // If it's a Pledge Payment, we should also update the original Pledge's status in Firestore
      // for consistency in the Ledger view.
      if (formData.type === "Pledge Payment" && formData.pledgeId) {
        const pledge = pledges.find(p => p.id === formData.pledgeId);
        if (pledge) {
          const target = pledge.pledgeTargetAmount || pledge.amount || 0;
          // Calculate new paid amount including this transaction
          const currentPayments = financialRecords.filter(r => r.type === "Pledge Payment" && r.pledgeId === pledge.id && r.id !== editingRecord?.id);
          const newPaidAmount = currentPayments.reduce((sum, r) => sum + (Number(r.amount) || 0), 0) + Number(formData.amount);
          
          let newStatus = "Pending";
          if (newPaidAmount >= target) newStatus = "Fulfilled";
          else if (newPaidAmount > 0) newStatus = "Partial";

          await updateDoc(doc(db, "transactions", pledge.id), {
            pledgeStatus: newStatus
          });
        }
      }

      setEditingRecord(null);
      setFormData({
        memberId: "",
        memberName: "",
        type: "Tithe",
        amount: "" as any,
        currency: "GHS",
        date: format(new Date(), "yyyy-MM-dd"),
        notes: "",
        pledgeStatus: undefined,
        pledgeTargetAmount: "" as any,
        pledgeDueDate: "",
        pledgeId: "",
        campaignId: "",
        campaignName: ""
      });
      setActiveTab("ledger");
    } catch (error) {
      handleFirestoreError(error, editingRecord ? OperationType.UPDATE : OperationType.CREATE, "transactions");
    }
  };

  // --- Tab 2: Transaction Ledger State ---
  const [ledgerSearch, setLedgerSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [currencyFilter, setCurrencyFilter] = useState<string>("all");
  const [pledgeStatusFilter, setPledgeStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({
    from: "",
    to: ""
  });

  const filteredLedger = useMemo(() => {
    return financialRecords.filter(r => {
      const matchesSearch = r.memberName.toLowerCase().includes(ledgerSearch.toLowerCase()) || 
                           r.notes.toLowerCase().includes(ledgerSearch.toLowerCase());
      const matchesType = typeFilter === "all" || r.type === typeFilter;
      const matchesCurrency = currencyFilter === "all" || r.currency === currencyFilter;
      const matchesPledgeStatus = pledgeStatusFilter === "all" || r.pledgeStatus === pledgeStatusFilter;
      
      let matchesDate = true;
      if (dateRange.from || dateRange.to) {
        const recordDate = parseISO(r.date);
        if (dateRange.from && dateRange.to) {
          matchesDate = isWithinInterval(recordDate, {
            start: startOfDay(parseISO(dateRange.from)),
            end: endOfDay(parseISO(dateRange.to))
          });
        } else if (dateRange.from) {
          matchesDate = recordDate >= startOfDay(parseISO(dateRange.from));
        } else if (dateRange.to) {
          matchesDate = recordDate <= endOfDay(parseISO(dateRange.to));
        }
      }

      return matchesSearch && matchesType && matchesCurrency && matchesPledgeStatus && matchesDate;
    });
  }, [financialRecords, ledgerSearch, typeFilter, currencyFilter, pledgeStatusFilter, dateRange]);

  const totalsByType = useMemo(() => {
    const totals: Record<string, number> = {};
    filteredLedger.forEach(r => {
      const key = `${r.type}_${r.currency}`;
      totals[key] = (totals[key] || 0) + r.amount;
    });
    return totals;
  }, [filteredLedger]);

  const exportLedgerCSV = () => {
    const headers = ["Date", "Member Name", "Type", "Amount", "Currency", "Pledge Status", "Notes"];
    const rows = filteredLedger.map(r => [
      r.date, 
      r.memberName, 
      r.type, 
      r.amount, 
      r.currency, 
      (r.type === "Pledge" || r.type === "Commitment") ? (r.pledgeStatus || "Pending") : "N/A", 
      r.notes
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `financial_ledger_${format(new Date(), "yyyyMMdd")}.csv`;
    link.click();
    toast.success("Ledger exported to CSV");
  };

  // --- Tab 3: Pledge Tracker State ---
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);

  const [isCampaignDialogOpen, setIsCampaignDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<FinancialCampaign | null>(null);
  const [campaignFormData, setCampaignFormData] = useState<Partial<FinancialCampaign>>({
    name: "",
    targetAmount: undefined,
    currency: "GHS",
    description: "",
    dueDate: format(new Date(), "yyyy-MM-dd"),
    status: "Active"
  });

  const handleCampaignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignFormData.name || !campaignFormData.targetAmount) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      if (editingCampaign) {
        const campaignRef = doc(db, "campaigns", editingCampaign.id);
        await updateDoc(campaignRef, {
          ...campaignFormData,
          targetAmount: Number(campaignFormData.targetAmount)
        });
        toast.success("APPEAL updated successfully");
      } else {
        await addDoc(collection(db, "campaigns"), {
          ...campaignFormData,
          targetAmount: Number(campaignFormData.targetAmount),
          createdAt: new Date().toISOString()
        });
        toast.success("APPEAL created successfully");
      }
      setIsCampaignDialogOpen(false);
      setEditingCampaign(null);
      setCampaignFormData({
        name: "",
        targetAmount: undefined,
        currency: "GHS",
        description: "",
        dueDate: format(new Date(), "yyyy-MM-dd"),
        status: "Active"
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "campaigns");
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    try {
      await deleteDoc(doc(db, "campaigns", id));
      toast.success("APPEAL deleted successfully");
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `campaigns/${id}`);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    const record = financialRecords.find(r => r.id === id);
    try {
      await deleteDoc(doc(db, "transactions", id));
      
      if (record) {
        await logAudit(
          "DELETE",
          "FINANCIAL",
          id,
          `Deleted financial record for ${record.memberName}`
        );
      }

      toast.success("Transaction deleted successfully");
      setIsDeleteDialogOpen(false);
      setRecordToDelete(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `transactions/${id}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight text-primary">Financial Management</h2>
        <p className="text-muted-foreground">Track tithes, offerings, pledges, and church expenses.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList variant="premium" className="grid w-full grid-cols-4 max-w-xl mb-8">
          {canEditFinancials && <TabsTrigger value="record">Record Transaction</TabsTrigger>}
          <TabsTrigger value="ledger">Transaction Ledger</TabsTrigger>
          <TabsTrigger value="pledges">Pledge Tracker</TabsTrigger>
          <TabsTrigger value="campaigns">APPEALS</TabsTrigger>
        </TabsList>

        {/* --- Tab 1: Record Transaction --- */}
        <TabsContent value="record">
          <Card className="max-w-2xl mx-auto shadow-sm">
            <CardHeader>
              <CardTitle>{editingRecord ? "Edit Transaction" : "New Transaction"}</CardTitle>
              <CardDescription>Enter details for the financial contribution or expense.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleFormSubmit} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Transaction Type</Label>
                    <Select 
                      value={formData.type} 
                      onValueChange={(val) => {
                        const type = val as FinancialRecordType;
                        if (type === "Offering") {
                          setFormData({ ...formData, type, memberId: "", memberName: "" });
                        } else {
                          setFormData({ ...formData, type });
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {transactionTypes.length > 0 ? (
                          transactionTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))
                        ) : (
                          <>
                            <SelectItem value="Tithe">Tithe</SelectItem>
                            <SelectItem value="Offering">Offering</SelectItem>
                            <SelectItem value="Pledge">Pledge</SelectItem>
                            <SelectItem value="Pledge Payment">Pledge Payment</SelectItem>
                            <SelectItem value="Commitment">Commitment</SelectItem>
                            <SelectItem value="Donation">Donation</SelectItem>
                          </>
                        )}
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.type !== "Offering" && (
                    <div className="space-y-2">
                      <Label>Member</Label>
                      <Select 
                        value={formData.memberId} 
                        onValueChange={(val) => {
                          const m = members.find(member => member.id === val);
                          setFormData({ ...formData, memberId: val, memberName: m ? `${m.firstName} ${m.lastName}` : "" });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select member" />
                        </SelectTrigger>
                        <SelectContent>
                          <div className="p-2">
                            <Input 
                              placeholder="Search member..." 
                              value={memberSearch}
                              onChange={(e) => setMemberSearch(e.target.value)}
                              className="h-8"
                            />
                          </div>
                          {filteredMembers.map(m => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.firstName} {m.lastName} ({m.id})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {formData.type !== "Offering" && selectedMemberPledge && (
                    <div className="md:col-span-2 bg-primary/5 border border-primary/10 rounded-lg p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-full">
                          <Clock className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Pledge Summary</p>
                          <p className="text-sm font-semibold">
                            {selectedMemberPledge.count} {selectedMemberPledge.count === 1 ? 'Pledge' : 'Pledges'} Found
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-8 w-full md:w-auto">
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase">Target</p>
                          <p className="text-sm font-bold">{selectedMemberPledge.currency} {selectedMemberPledge.target.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase">Paid</p>
                          <p className="text-sm font-bold text-green-600">{selectedMemberPledge.currency} {selectedMemberPledge.paid.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase">Due</p>
                          <p className="text-sm font-bold text-red-600">{selectedMemberPledge.currency} {selectedMemberPledge.balance.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>
                      {formData.type === "Pledge" || formData.type === "Commitment" ? "Pledge Target Amount" : 
                       formData.type === "Pledge Payment" ? "Payment Amount" : "Amount"}
                    </Label>
                    <Input 
                      type="number" 
                      step="0.01"
                      value={formData.amount ?? ""}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value ? parseFloat(e.target.value) : undefined })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Select 
                      value={formData.currency} 
                      onValueChange={(val) => setFormData({ ...formData, currency: val as Currency })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GHS">GHS (Ghana Cedi)</SelectItem>
                        <SelectItem value="USD">USD (US Dollar)</SelectItem>
                        <SelectItem value="GBP">GBP (British Pound)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input 
                      type="date" 
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>
                  
                  {(formData.type === "Pledge" || formData.type === "Commitment") && (
                    <>
                      <div className="space-y-2">
                        <Label>Select APPEAL (Master Setup)</Label>
                        <Select 
                          value={formData.campaignId || "none"} 
                          onValueChange={(val) => {
                            if (val === "none") {
                              setFormData({ 
                                ...formData, 
                                campaignId: "", 
                                campaignName: "" 
                              });
                              return;
                            }
                            const campaign = campaigns.find(c => c.id === val);
                            setFormData({ 
                              ...formData, 
                              campaignId: val, 
                              campaignName: campaign ? campaign.name : "",
                              currency: campaign ? campaign.currency : formData.currency
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select APPEAL" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None / General Pledge</SelectItem>
                            {campaigns.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.name} ({c.currency} {c.targetAmount.toLocaleString()})
                              </SelectItem>
                            ))}
                            {campaigns.length === 0 && (
                              <SelectItem value="no-campaigns" disabled>No active APPEALS found</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Pledge Due Date</Label>
                        <Input 
                          type="date" 
                          value={formData.pledgeDueDate}
                          onChange={(e) => setFormData({ ...formData, pledgeDueDate: e.target.value })}
                        />
                      </div>
                    </>
                  )}

                  {formData.type === "Pledge Payment" && (
                    <div className="md:col-span-2 space-y-2">
                      <Label>Select Pledge to Redeem</Label>
                      <Select 
                        value={formData.pledgeId} 
                        onValueChange={(val) => {
                          const pledge = pledges.find(p => p.id === val);
                          const target = pledge ? (pledge.pledgeTargetAmount || pledge.amount || 0) : 0;
                          const paid = pledge ? (pledge.paidAmount || 0) : 0;
                          const balance = Math.max(0, target - paid);
                          
                          setFormData({ 
                            ...formData, 
                            pledgeId: val,
                            currency: pledge ? pledge.currency : formData.currency,
                            amount: balance > 0 ? balance : formData.amount
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select an active pledge" />
                        </SelectTrigger>
                        <SelectContent>
                          {memberActivePledges.length > 0 ? (
                            memberActivePledges.map((p: any) => {
                              const target = p.pledgeTargetAmount || p.amount || 0;
                              const paid = p.paidAmount || 0;
                              const balance = Math.max(0, target - paid);
                              return (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.campaignName || "General Pledge"} - Target: {p.currency} {target.toLocaleString()} (Due: {p.currency} {balance.toLocaleString()})
                                </SelectItem>
                              );
                            })
                          ) : (
                            <div className="p-2 text-sm text-muted-foreground">No active pledges found for this member.</div>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea 
                    placeholder="Add any additional details..." 
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setEditingRecord(null);
                      setFormData({
                        memberId: "",
                        memberName: "",
                        type: "Tithe",
                        amount: "" as any,
                        currency: "GHS",
                        date: format(new Date(), "yyyy-MM-dd"),
                        notes: "",
                        pledgeStatus: undefined,
                        pledgeTargetAmount: "" as any,
                        pledgeDueDate: "",
                        pledgeId: "",
                        campaignId: "",
                        campaignName: ""
                      });
                    }}
                  >
                    Clear
                  </Button>
                  <Button type="submit" className="bg-primary px-8">
                    {editingRecord ? "Update Record" : "Save Transaction"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- Tab 2: Transaction Ledger --- */}
        <TabsContent value="ledger" className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Search ledger..." 
                className="pl-10"
                value={ledgerSearch}
                onChange={(e) => setLedgerSearch(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Tithe">Tithe</SelectItem>
                  <SelectItem value="Offering">Offering</SelectItem>
                  <SelectItem value="Pledge">Pledge</SelectItem>
                  <SelectItem value="Donation">Donation</SelectItem>
                </SelectContent>
              </Select>
              <Select value={currencyFilter} onValueChange={setCurrencyFilter}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="GHS">GHS</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex items-center gap-2 border rounded-md px-2 py-1 bg-background">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <Input 
                  type="date" 
                  className="h-7 w-[130px] border-none p-0 focus-visible:ring-0 text-xs"
                  value={dateRange.from}
                  onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                />
                <span className="text-muted-foreground text-xs">to</span>
                <Input 
                  type="date" 
                  className="h-7 w-[130px] border-none p-0 focus-visible:ring-0 text-xs"
                  value={dateRange.to}
                  onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                />
                {(dateRange.from || dateRange.to) && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6" 
                    onClick={() => setDateRange({ from: "", to: "" })}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>

              {canExport && (
                <Button variant="outline" size="sm" onClick={exportLedgerCSV} className="gap-2">
                  <Download className="h-4 w-4" /> Export
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-2">
                <Printer className="h-4 w-4" /> Print
              </Button>
            </div>
          </div>

          <Card className="shadow-sm border-border">
            <CardContent className="p-0">
              {isLoading ? (
                <TableSkeleton rows={10} />
              ) : filteredLedger.length === 0 ? (
                <div className="py-12">
                  <EmptyState 
                    icon={Inbox}
                    title="No transactions found"
                    description={ledgerSearch ? `We couldn't find any transactions matching "${ledgerSearch}".` : "Your financial ledger is currently empty."}
                    actionLabel={ledgerSearch ? "Clear Search" : "Record Transaction"}
                    onAction={() => {
                      if (ledgerSearch) {
                        setLedgerSearch("");
                      } else {
                        setActiveTab("record");
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Date</TableHead>
                        <TableHead>Member Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Currency</TableHead>
                        <TableHead>Pledge Status</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLedger.map((record) => (
                        <TableRow key={record.id} className="hover:bg-muted/30">
                          <TableCell className="text-xs">{record.date}</TableCell>
                          <TableCell className="font-medium">{record.memberName}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-normal">
                              {record.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-semibold text-green-600">
                            {record.amount.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-xs">{record.currency}</TableCell>
                          <TableCell>
                            {record.type === "Pledge" && record.pledgeStatus ? (
                              <Badge 
                                variant="secondary" 
                                className={cn(
                                  "text-[10px] uppercase",
                                  record.pledgeStatus === "Fulfilled" && "bg-green-100 text-green-800",
                                  record.pledgeStatus === "Partial" && "bg-yellow-100 text-yellow-800",
                                  record.pledgeStatus === "Pending" && "bg-red-100 text-red-800"
                                )}
                              >
                                {record.pledgeStatus}
                              </Badge>
                            ) : "-"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">
                            {record.notes}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {canEditFinancials && (
                                  <DropdownMenuItem onClick={() => {
                                    setEditingRecord(record);
                                    setFormData(record);
                                    setActiveTab("record");
                                  }}>
                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                  </DropdownMenuItem>
                                )}
                                {canDelete && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      className="text-destructive"
                                      onClick={() => {
                                        setRecordToDelete(record.id);
                                        setIsDeleteDialogOpen(true);
                                      }}
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" /> Delete
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
            <CardFooter className="bg-muted/20 p-4 border-t">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                {Object.entries(totalsByType).map(([key, total]) => {
                  const [type, currency] = key.split("_");
                  return (
                    <div key={key} className="flex flex-col">
                      <span className="text-[10px] text-muted-foreground uppercase">{type} ({currency})</span>
                      <span className="text-sm font-bold">{currency} {total.toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* --- Tab 3: Pledge Tracker --- */}
        <TabsContent value="pledges" className="space-y-4">
          <Card className="shadow-sm border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Pledge & Commitment Tracking</CardTitle>
                <CardDescription>Monitor fulfillment progress for all member pledges.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs">APPEAL:</Label>
                <Select value={pledgeCampaignFilter} onValueChange={setPledgeCampaignFilter}>
                  <SelectTrigger className="h-8 w-[180px] text-xs">
                    <SelectValue placeholder="All APPEALS" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All APPEALS</SelectItem>
                    {campaigns.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <TableSkeleton rows={5} />
              ) : filteredPledges.length === 0 ? (
                <div className="py-12">
                  <EmptyState 
                    icon={Clock}
                    title="No pledges found"
                    description={pledgeCampaignFilter === "all" ? "There are currently no active pledges or commitments found." : "No pledges found for this APPEAL."}
                    actionLabel="Record Pledge"
                    onAction={() => setActiveTab("record")}
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Member Name</TableHead>
                        <TableHead>APPEAL/Project</TableHead>
                        <TableHead>Target Amount</TableHead>
                        <TableHead>Redeemed (Paid)</TableHead>
                        <TableHead>Outstanding</TableHead>
                        <TableHead>Progress</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPledges.map((pledge: any) => {
                        const target = pledge.pledgeTargetAmount || pledge.amount || 1;
                        const paid = pledge.paidAmount || 0;
                        const outstanding = Math.max(0, target - paid);
                        const progress = Math.min(100, (paid / target) * 100);

                        return (
                          <TableRow key={pledge.id}>
                            <TableCell className="font-medium">{pledge.memberName}</TableCell>
                            <TableCell className="text-xs font-semibold text-primary">{pledge.campaignName || "General Pledge"}</TableCell>
                            <TableCell>{pledge.currency} {target.toLocaleString()}</TableCell>
                            <TableCell className="text-green-600 font-medium">{pledge.currency} {paid.toLocaleString()}</TableCell>
                            <TableCell className="text-red-500 font-medium">{pledge.currency} {outstanding.toLocaleString()}</TableCell>
                            <TableCell className="w-[150px]">
                              <div className="space-y-1">
                                <Progress value={progress} className="h-2" />
                                <span className="text-[10px] text-muted-foreground">{progress.toFixed(0)}% fulfilled</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs">{pledge.pledgeDueDate || "N/A"}</TableCell>
                            <TableCell>
                              <Badge 
                                variant="secondary" 
                                className={cn(
                                  "text-[10px] uppercase",
                                  pledge.pledgeStatus === "Fulfilled" && "bg-green-100 text-green-800",
                                  pledge.pledgeStatus === "Partial" && "bg-yellow-100 text-yellow-800",
                                  pledge.pledgeStatus === "Pending" && "bg-red-100 text-red-800"
                                )}
                              >
                                {pledge.pledgeStatus}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="h-7 text-[10px] gap-1"
                                  onClick={() => {
                                    setFormData({
                                      ...formData,
                                      type: "Pledge Payment",
                                      memberId: pledge.memberId,
                                      memberName: pledge.memberName,
                                      pledgeId: pledge.id,
                                      currency: pledge.currency,
                                      amount: undefined
                                    });
                                    setActiveTab("record");
                                  }}
                                  disabled={pledge.pledgeStatus === "Fulfilled"}
                                >
                                  <CreditCard className="h-3 w-3" /> Redeem
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- Tab 4: APPEALS --- */}
        <TabsContent value="campaigns">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Pledge APPEALS</CardTitle>
                <CardDescription>Manage master pledge targets and projects.</CardDescription>
              </div>
              {canEditFinancials && (
                <Button onClick={() => {
                  setEditingCampaign(null);
                  setCampaignFormData({
                    name: "",
                    targetAmount: "" as any,
                    currency: "GHS",
                    description: "",
                    dueDate: format(new Date(), "yyyy-MM-dd"),
                    status: "Active"
                  });
                  setIsCampaignDialogOpen(true);
                }}>
                  <Plus className="h-4 w-4 mr-2" /> New APPEAL
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {campaigns.length === 0 ? (
                <EmptyState 
                  title="No APPEALS Found" 
                  description="Create an APPEAL to start tracking master pledge targets."
                  icon={Inbox}
                />
              ) : (
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>APPEAL Name</TableHead>
                        <TableHead>Target Amount</TableHead>
                        <TableHead>Total Redeemed</TableHead>
                        <TableHead>Progress</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {campaignSummaries.map((campaign) => {
                        const progress = campaign.targetAmount > 0 ? Math.min(100, (campaign.totalRedeemed / campaign.targetAmount) * 100) : 0;
                        return (
                          <TableRow key={campaign.id}>
                            <TableCell className="font-medium">
                              <div className="font-bold">{campaign.name}</div>
                              {campaign.description && <div className="text-[10px] text-muted-foreground line-clamp-1">{campaign.description}</div>}
                            </TableCell>
                            <TableCell className="text-xs font-semibold">{campaign.currency} {campaign.targetAmount.toLocaleString()}</TableCell>
                            <TableCell className="text-xs text-green-600 font-medium">{campaign.currency} {campaign.totalRedeemed.toLocaleString()}</TableCell>
                            <TableCell className="w-[120px]">
                              <div className="space-y-1">
                                <Progress value={progress} className="h-1.5" />
                                <span className="text-[10px] text-muted-foreground">{progress.toFixed(0)}% of target</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs">{campaign.dueDate}</TableCell>
                            <TableCell>
                              <Badge variant={campaign.status === "Active" ? "default" : "secondary"} className="text-[10px] h-5">
                                {campaign.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                {canEditFinancials && (
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8"
                                    onClick={() => {
                                      setEditingCampaign(campaign);
                                      setCampaignFormData(campaign);
                                      setIsCampaignDialogOpen(true);
                                    }}
                                  >
                                    <Edit className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                                {canDelete && (
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-destructive"
                                    onClick={() => handleDeleteCampaign(campaign.id)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* APPEAL Dialog */}
      <Dialog open={isCampaignDialogOpen} onOpenChange={setIsCampaignDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingCampaign ? "Edit APPEAL" : "New APPEAL"}</DialogTitle>
            <DialogDescription>
              Set up a master pledge target for a specific project or APPEAL.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCampaignSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">APPEAL Name</Label>
              <Input 
                id="name"
                placeholder="e.g. Chapel Project"
                value={campaignFormData.name}
                onChange={(e) => setCampaignFormData({ ...campaignFormData, name: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="target">Target Amount</Label>
                <Input 
                  id="target"
                  type="number"
                  step="0.01"
                  value={campaignFormData.targetAmount ?? ""}
                  onChange={(e) => setCampaignFormData({ ...campaignFormData, targetAmount: e.target.value ? parseFloat(e.target.value) : undefined })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select 
                  value={campaignFormData.currency} 
                  onValueChange={(val) => setCampaignFormData({ ...campaignFormData, currency: val as Currency })}
                >
                  <SelectTrigger id="currency">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GHS">GHS</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input 
                id="dueDate"
                type="date"
                value={campaignFormData.dueDate}
                onChange={(e) => setCampaignFormData({ ...campaignFormData, dueDate: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={campaignFormData.status} 
                onValueChange={(val) => setCampaignFormData({ ...campaignFormData, status: val as any })}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description"
                placeholder="Briefly describe the purpose of this APPEAL..."
                value={campaignFormData.description}
                onChange={(e) => setCampaignFormData({ ...campaignFormData, description: e.target.value })}
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsCampaignDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Save APPEAL</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this transaction? This action cannot be undone and will affect financial reports.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRecordToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => recordToDelete && handleDeleteRecord(recordToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
