import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Users, 
  CreditCard, 
  GraduationCap, 
  TrendingUp, 
  Calendar, 
  ArrowUpRight, 
  UserPlus, 
  DollarSign, 
  Clock,
  ChevronRight,
  Inbox
} from "lucide-react";
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  LineChart, 
  Line,
  AreaChart,
  Area,
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from "recharts";
import { toast } from "sonner";
import { auth, db } from "../firebase";
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  limit,
  where
} from "firebase/firestore";
import { Member, FinancialRecord, SundaySchoolClass } from "../types";
import { format, startOfMonth, subMonths, isWithinInterval, parseISO, endOfMonth, differenceInYears, startOfYear, eachMonthOfInterval, subYears, isValid } from "date-fns";
import { cn } from "@/lib/utils";
import React, { useState, useEffect, useMemo } from "react";
import { DashboardSkeleton } from "@/components/LoadingSkeleton";
import { EmptyState } from "@/components/EmptyState";

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

export default function Dashboard() {
  const { user, loading, role, ministry, isSuperAdmin, isSecretary, isMinistryLeader, isFinance } = useFirebase();
  const [members, setMembers] = useState<Member[]>([]);
  const [financialRecords, setFinancialRecords] = useState<FinancialRecord[]>([]);
  const [sundaySchoolClasses, setSundaySchoolClasses] = useState<SundaySchoolClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const now = useMemo(() => new Date(), []);
  const today = format(now, "MMMM do, yyyy");

  useEffect(() => {
    if (!user || loading) return;
    setIsLoading(true);
    
    // Conditional queries based on role
    const membersQuery = (isSuperAdmin || isSecretary || isFinance) 
      ? collection(db, "members")
      : (isMinistryLeader && ministry)
        ? query(collection(db, "members"), where("groupMinistry", "==", ministry))
        : null;

    const financialsQuery = (isSuperAdmin || isFinance)
      ? collection(db, "transactions")
      : null;

    const classesQuery = (isSuperAdmin || isFinance || isSecretary)
      ? collection(db, "classes")
      : (isMinistryLeader && ministry)
        ? query(collection(db, "classes"), where("className", "==", ministry))
        : null;

    let unsubscribeMembers = () => {};
    if (membersQuery) {
      unsubscribeMembers = onSnapshot(membersQuery, (snapshot) => {
        console.log("Dashboard: Members Snapshot received, count:", snapshot.size);
        const membersData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Member));
        setMembers(membersData);
      }, (error) => {
        console.error("Dashboard: Members Snapshot error:", error);
        handleFirestoreError(error, OperationType.LIST, "members");
      });
    }

    let unsubscribeFinancials = () => {};
    if (financialsQuery) {
      unsubscribeFinancials = onSnapshot(financialsQuery, (snapshot) => {
        console.log("Dashboard: Financials Snapshot received, count:", snapshot.size);
        const financialsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as FinancialRecord));
        setFinancialRecords(financialsData);
      }, (error) => {
        console.error("Dashboard: Financials Snapshot error:", error);
        handleFirestoreError(error, OperationType.LIST, "transactions");
      });
    }

    let unsubscribeClasses = () => {};
    if (classesQuery) {
      unsubscribeClasses = onSnapshot(classesQuery, (snapshot) => {
        const classesData = snapshot.docs.map(doc => ({ ...doc.data(), classId: doc.id } as SundaySchoolClass));
        setSundaySchoolClasses(classesData);
        setIsLoading(false);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, "classes");
      });
    } else {
      setIsLoading(false);
    }

    return () => {
      unsubscribeMembers();
      unsubscribeFinancials();
      unsubscribeClasses();
    };
  }, [user, loading, isSuperAdmin, isSecretary, isMinistryLeader, isFinance, ministry]);

  // KPI Calculations
  const totalMembers = members.length;
  const activeMembers = members.filter(m => m.membershipStatus === "Active").length;
  
  const startOfThisMonth = startOfMonth(now);
  const startOfLastMonth = startOfMonth(subMonths(now, 1));
  const endOfLastMonth = endOfMonth(subMonths(now, 1));
  
  const newMembersThisMonth = members.filter(m => {
    if (!m.membershipDate) return false;
    try {
      const date = parseISO(m.membershipDate);
      return isValid(date) && date >= startOfThisMonth;
    } catch (e) {
      return false;
    }
  }).length;

  const newMembersLastMonth = members.filter(m => {
    if (!m.membershipDate) return false;
    try {
      const date = parseISO(m.membershipDate);
      return isValid(date) && date >= startOfLastMonth && date <= endOfLastMonth;
    } catch (e) {
      return false;
    }
  }).length;

  const totalMembersLastMonth = totalMembers - newMembersThisMonth;
  const membersChangePercent = totalMembersLastMonth > 0 
    ? ((newMembersThisMonth / totalMembersLastMonth) * 100).toFixed(1) 
    : "0";

  const newMembersChangePercent = newMembersLastMonth > 0 
    ? (((newMembersThisMonth - newMembersLastMonth) / newMembersLastMonth) * 100).toFixed(1) 
    : "0";

  const monthlyFinances = financialRecords.filter(r => {
    const date = parseISO(r.date);
    return date >= startOfThisMonth;
  });

  const lastMonthFinances = financialRecords.filter(r => {
    const date = parseISO(r.date);
    return date >= startOfLastMonth && date <= endOfLastMonth;
  });

  const totalTithesOfferings = monthlyFinances
    .filter(r => r.type === "Tithe" || r.type === "Offering")
    .reduce((sum, r) => sum + r.amount, 0);

  const lastMonthTithesOfferings = lastMonthFinances
    .filter(r => r.type === "Tithe" || r.type === "Offering")
    .reduce((sum, r) => sum + r.amount, 0);

  const financesChangePercent = lastMonthTithesOfferings > 0 
    ? (((totalTithesOfferings - lastMonthTithesOfferings) / lastMonthTithesOfferings) * 100).toFixed(1) 
    : "0";

  const sundaySchoolEnrollment = sundaySchoolClasses.reduce((sum, c) => sum + c.members.length, 0);

  // --- NEW ANALYTICS CALCULATIONS ---

  // 1. Demographics: Gender Ratio
  const genderData = useMemo(() => {
    const counts: Record<string, number> = { Male: 0, Female: 0, Other: 0 };
    members.forEach(m => {
      if (m.gender === "Male") counts.Male++;
      else if (m.gender === "Female") counts.Female++;
      else counts.Other++;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [members]);

  // 2. Demographics: Marital Status
  const maritalData = useMemo(() => {
    const counts: Record<string, number> = {};
    members.forEach(m => {
      const status = m.maritalStatus || "Unknown";
      counts[status] = (counts[status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [members]);

  // 3. Demographics: Age Distribution
  const ageData = useMemo(() => {
    const groups = [
      { name: "0-12", min: 0, max: 12, value: 0 },
      { name: "13-19", min: 13, max: 19, value: 0 },
      { name: "20-35", min: 20, max: 35, value: 0 },
      { name: "36-50", min: 36, max: 50, value: 0 },
      { name: "51-65", min: 51, max: 65, value: 0 },
      { name: "65+", min: 66, max: 150, value: 0 },
    ];
      members.forEach(m => {
        if (m.dateOfBirth) {
          try {
            const dob = parseISO(m.dateOfBirth);
            if (isValid(dob)) {
              const age = differenceInYears(now, dob);
              const group = groups.find(g => age >= g.min && age <= g.max);
              if (group) group.value++;
            }
          } catch (e) {
            // Skip invalid dates
          }
        }
      });
    return groups;
  }, [members, now]);

  // 4. Growth Trends: Monthly Membership Growth (Last 12 Months)
  const growthData = useMemo(() => {
    const months = eachMonthOfInterval({
      start: subMonths(now, 11),
      end: now
    });
    
    return months.map(month => {
      const monthStr = format(month, "MMM yyyy");
      const count = members.filter(m => {
        if (!m.membershipDate) return true; // Count members without date as existing from start
        try {
          const joinDate = parseISO(m.membershipDate);
          return joinDate.getTime() <= endOfMonth(month).getTime();
        } catch (e) {
          return true; // Fallback for invalid dates
        }
      }).length;
      return { name: monthStr, total: count };
    });
  }, [members, now]);

  // 5. Spiritual Maturity: Baptism Status
  const spiritualData = useMemo(() => {
    const baptized = members.filter(m => m.isBaptized === true || m.isBaptized === "Yes").length;
    const notBaptized = members.length - baptized;
    return [
      { name: "Baptized", value: baptized },
      { name: "Not Baptized", value: notBaptized }
    ];
  }, [members]);

  // 6. Group Density: Ministries/Groups
  const groupDensityData = useMemo(() => {
    const counts: Record<string, number> = {};
    members.forEach(m => {
      if (m.groupMinistry) {
        counts[m.groupMinistry] = (counts[m.groupMinistry] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Top 8 groups
  }, [members]);

  const COLORS = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

  // Financial Overview Data (Last 6 Months)
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return {
      month: format(d, "MMM"),
      monthIdx: d.getMonth(),
      year: d.getFullYear(),
      tithes: 0,
      offerings: 0
    };
  }).reverse();

  last6Months.forEach(m => {
    financialRecords.forEach(r => {
      const rDate = new Date(r.date);
      if (rDate.getMonth() === m.monthIdx && rDate.getFullYear() === m.year) {
        if (r.type === "Tithe") m.tithes += r.amount;
        if (r.type === "Offering") m.offerings += r.amount;
      }
    });
  });

  // Recent Members
  const recentMembers = [...members]
    .sort((a, b) => new Date(b.membershipDate).getTime() - new Date(a.membershipDate).getTime())
    .slice(0, 5);

  // Upcoming Pledges (Mocking due dates for UI)
  const pendingPledges = financialRecords
    .filter(r => r.type === "Pledge" && r.pledgeStatus !== "Fulfilled")
    .map(p => ({
      ...p,
      dueDate: format(new Date(new Date(p.date).getTime() + 30 * 24 * 60 * 60 * 1000), "MMM dd, yyyy")
    }))
    .slice(0, 4);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Greeting Banner */}
      <div className="bg-blue-600 text-white p-6 rounded-xl shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {user?.displayName || "User"}</h1>
          <p className="text-blue-50 flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-white border-white/30 bg-white/10">
              {role || "User"}
            </Badge>
            {isMinistryLeader && ministry && (
              <Badge variant="outline" className="text-white border-white/30 bg-white/10">
                {ministry}
              </Badge>
            )}
            <span className="flex items-center gap-1 ml-2">
              <Calendar className="h-4 w-4" /> {today}
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          {isSuperAdmin && (
            <Button variant="secondary" size="sm" className="bg-white/10 hover:bg-white/20 border-none text-white">
              View Logs
            </Button>
          )}
          {isSuperAdmin && (
            <Button variant="secondary" size="sm" className="bg-white text-blue-600 hover:bg-white/90 border-none">
              System Settings
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-600 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Members</CardTitle>
            <Users className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-bold">{totalMembers}</div>
              <Badge variant="secondary" className="bg-blue-50 text-blue-700 text-[10px] px-1.5 py-0">
                {activeMembers} Active
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {Number(membersChangePercent) !== 0 && (
                <span className={cn(
                  "font-medium inline-flex items-center",
                  Number(membersChangePercent) > 0 ? "text-green-600" : "text-red-600"
                )}>
                  <ArrowUpRight className={cn("h-3 w-3 mr-1", Number(membersChangePercent) < 0 && "rotate-90")} /> 
                  {Math.abs(Number(membersChangePercent))}%
                </span>
              )}
              {" "}vs last month
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-600 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">New Members</CardTitle>
            <UserPlus className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{newMembersThisMonth}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {Number(newMembersChangePercent) !== 0 && (
                <span className={cn(
                  "font-medium inline-flex items-center",
                  Number(newMembersChangePercent) > 0 ? "text-green-600" : "text-red-600"
                )}>
                  <ArrowUpRight className={cn("h-3 w-3 mr-1", Number(newMembersChangePercent) < 0 && "rotate-90")} /> 
                  {Math.abs(Number(newMembersChangePercent))}%
                </span>
              )}
              {" "}vs last month
            </p>
          </CardContent>
        </Card>

        {(isSuperAdmin || isFinance) && (
          <Card className="border-l-4 border-l-amber-500 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Tithes & Offerings</CardTitle>
              <DollarSign className="h-5 w-5 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">GHS {totalTithesOfferings.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {Number(financesChangePercent) !== 0 && (
                  <span className={cn(
                    "font-medium inline-flex items-center",
                    Number(financesChangePercent) > 0 ? "text-green-600" : "text-red-600"
                  )}>
                    <ArrowUpRight className={cn("h-3 w-3 mr-1", Number(financesChangePercent) < 0 && "rotate-90")} /> 
                    {Math.abs(Number(financesChangePercent))}%
                  </span>
                )}
                {" "}vs last month
              </p>
            </CardContent>
          </Card>
        )}

        {(isSuperAdmin || isFinance || isMinistryLeader || isSecretary) && (
          <Card className="border-l-4 border-l-purple-600 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">S.S. Enrollment</CardTitle>
              <GraduationCap className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sundaySchoolEnrollment}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Total students enrolled
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Growth Trends */}
        <Card className="shadow-sm border border-border">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Membership Growth</CardTitle>
            <CardDescription>Total congregation size over the last 12 months</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Area type="monotone" dataKey="total" stroke="#2563eb" fillOpacity={1} fill="url(#colorTotal)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Financial Overview */}
        {(isSuperAdmin || isFinance) && (
          <Card className="shadow-sm border border-border">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Financial Overview</CardTitle>
              <CardDescription>Tithe vs Offering comparison (Last 6 Months)</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={last6Months}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{fontSize: 12}} />
                  <Bar dataKey="tithes" name="Tithes" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="offerings" name="Offerings" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Gender Ratio */}
        <Card className="shadow-sm border border-border">
          <CardHeader>
            <CardTitle className="text-base font-bold">Gender Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[250px] flex flex-col items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {genderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Spiritual Maturity */}
        <Card className="shadow-sm border border-border">
          <CardHeader>
            <CardTitle className="text-base font-bold">Spiritual Maturity</CardTitle>
            <CardDescription>Baptism Status</CardDescription>
          </CardHeader>
          <CardContent className="h-[250px] flex flex-col items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={spiritualData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {spiritualData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? "#2563eb" : "#e2e8f0"} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Marital Status */}
        <Card className="shadow-sm border border-border">
          <CardHeader>
            <CardTitle className="text-base font-bold">Marital Status</CardTitle>
          </CardHeader>
          <CardContent className="h-[250px] flex flex-col items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={maritalData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {maritalData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Age Distribution */}
        <Card className="shadow-sm border border-border">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Age Distribution</CardTitle>
            <CardDescription>Congregation by age groups</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ageData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                <XAxis type="number" axisLine={false} tickLine={false} hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 12}} width={60} />
                <Tooltip 
                  cursor={{fill: 'transparent'}}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="value" name="Members" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Group Density */}
        <Card className="shadow-sm border border-border">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Group Density</CardTitle>
            <CardDescription>Active Ministries & Groups</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={groupDensityData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="value" name="Members" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section: Recent Members & Pledge Deadlines */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-sm border border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold">Recent Members</CardTitle>
              <CardDescription>Latest registrations in the system</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="text-primary gap-1">
              View All <ChevronRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentMembers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <Inbox className="h-8 w-8 mb-2 opacity-20" />
                        <p>No members found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  recentMembers.map((member) => (
                    <TableRow key={member.id} className="hover:bg-muted/20">
                      <TableCell className="font-mono text-[10px]">{member.id}</TableCell>
                      <TableCell className="font-medium">{member.firstName} {member.lastName}</TableCell>
                      <TableCell className="text-xs">{member.phone}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={member.membershipStatus === "Active" ? "default" : "secondary"}
                          className={member.membershipStatus === "Active" ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}
                        >
                          {member.membershipStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{member.membershipDate}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="shadow-sm border border-border">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Pledge Deadlines</CardTitle>
            <CardDescription>Pending commitments due soon</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingPledges.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                    <Clock className="h-6 w-6 text-muted-foreground opacity-50" />
                  </div>
                  <p className="text-sm font-medium">No pending pledges</p>
                  <p className="text-xs text-muted-foreground mt-1">All commitments are up to date.</p>
                </div>
              ) : (
                pendingPledges.map((pledge) => (
                  <div key={pledge.id} className="flex items-start gap-3 p-3 rounded-lg border border-dashed border-border hover:bg-muted/30 transition-colors">
                    <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h4 className="text-sm font-semibold truncate">{pledge.memberName}</h4>
                        <span className="text-[10px] font-bold text-blue-600">GHS {pledge.amount}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Due: <span className="font-medium text-foreground">{pledge.dueDate}</span>
                      </p>
                      <div className="mt-2 w-full bg-muted rounded-full h-1">
                        <div 
                          className="bg-blue-600 h-1 rounded-full" 
                          style={{ width: `${((pledge.amount || 0) / (pledge.pledgeTargetAmount || 1)) * 100}%` }} 
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <Button variant="outline" className="w-full mt-4 text-xs h-8">
              Manage All Pledges
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
