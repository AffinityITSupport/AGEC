import React, { useState, useMemo } from "react";
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
  BarChart3, 
  Download, 
  FileText, 
  PieChart as PieChartIcon, 
  TrendingUp, 
  Calendar as CalendarIcon, 
  Filter, 
  Printer, 
  FileSpreadsheet,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  EyeOff,
  Users,
  Check
} from "lucide-react";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  AreaChart,
  Area
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { auth, db } from "../firebase";
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  limit 
} from "firebase/firestore";
import { Member, FinancialRecord, SundaySchoolClass } from "../types";
import { useEffect } from "react";
import { ChartSkeleton, DashboardSkeleton } from "@/components/LoadingSkeleton";

// --- Helper Components ---

const StatCard = ({ title, value, subtext, icon: Icon, trend }: any) => (
  <Card className="shadow-md">
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-primary" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <div className="flex items-center gap-1 mt-1">
        {trend && (
          <span className={`text-xs flex items-center ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(trend)}%
          </span>
        )}
        <p className="text-xs text-muted-foreground">{subtext}</p>
      </div>
    </CardContent>
  </Card>
);

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

export default function Reporting() {
  const [members, setMembers] = useState<Member[]>([]);
  const [financialRecords, setFinancialRecords] = useState<FinancialRecord[]>([]);
  const [sundaySchoolClasses, setSundaySchoolClasses] = useState<SundaySchoolClass[]>([]);
  const [anonymizeContributors, setAnonymizeContributors] = useState(false);
  const [activeTab, setActiveTab] = useState("membership");
  const [isLoading, setIsLoading] = useState(true);

  const membershipGrowthData = useMemo(() => {
    const months: Record<string, { month: string, total: number, new: number, departures: number }> = {};
    members.forEach(m => {
      if (!m.membershipDate) return;
      const date = new Date(m.membershipDate);
      if (isNaN(date.getTime())) return;
      const monthKey = date.toLocaleString('default', { month: 'short', year: '2-digit' });
      if (!months[monthKey]) {
        months[monthKey] = { month: monthKey, total: 0, new: 0, departures: 0 };
      }
      months[monthKey].new += 1;
    });
    
    const sortedMonths = Object.values(months).sort((a, b) => {
      const dateA = new Date(a.month);
      const dateB = new Date(b.month);
      return dateA.getTime() - dateB.getTime();
    });
    
    let cumulative = 0;
    return sortedMonths.map(m => {
      cumulative += m.new;
      return { ...m, total: cumulative };
    });
  }, [members]);

  const departmentBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    members.forEach(m => {
      const dept = m.department || "Unassigned";
      counts[dept] = (counts[dept] || 0) + 1;
    });
    
    const colors = ["#2563eb", "#059669", "#d97706", "#dc2626", "#7c3aed", "#0891b2", "#4f46e5", "#db2777"];
    return Object.entries(counts).map(([name, count], idx) => ({
      name,
      count,
      color: colors[idx % colors.length]
    }));
  }, [members]);

  const financialData = useMemo(() => {
    const months: Record<string, { month: string, tithe: number, offering: number, pledge: number }> = {};
    financialRecords.forEach(r => {
      const date = new Date(r.date);
      if (isNaN(date.getTime())) return;
      const monthKey = date.toLocaleString('default', { month: 'short', year: '2-digit' });
      if (!months[monthKey]) {
        months[monthKey] = { month: monthKey, tithe: 0, offering: 0, pledge: 0 };
      }
      if (r.type === "Tithe") months[monthKey].tithe += r.amount;
      else if (r.type === "Offering") months[monthKey].offering += r.amount;
      else if (r.type === "Pledge") months[monthKey].pledge += r.amount;
    });
    
    return Object.values(months).sort((a, b) => {
      const dateA = new Date(a.month);
      const dateB = new Date(b.month);
      return dateA.getTime() - dateB.getTime();
    });
  }, [financialRecords]);

  const topContributors = useMemo(() => {
    const contributors: Record<string, { name: string, amount: number, frequency: string }> = {};
    financialRecords.forEach(r => {
      if (!contributors[r.memberId]) {
        contributors[r.memberId] = { name: r.memberName, amount: 0, frequency: "Occasional" };
      }
      contributors[r.memberId].amount += r.amount;
    });
    
    return Object.values(contributors)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);
  }, [financialRecords]);

  const pledgeFulfillment = useMemo(() => {
    const pledges = financialRecords.filter(r => r.type === "Pledge");
    const fulfilled = pledges.filter(p => p.pledgeStatus === "Fulfilled").length;
    const partial = pledges.filter(p => p.pledgeStatus === "Partial").length;
    const pending = pledges.filter(p => p.pledgeStatus === "Pending").length;
    
    const total = pledges.length || 1;
    return [
      { name: "Fulfilled", value: Math.round((fulfilled / total) * 100), color: "#059669" },
      { name: "Partial", value: Math.round((partial / total) * 100), color: "#d97706" },
      { name: "Pending", value: Math.round((pending / total) * 100), color: "#dc2626" },
    ];
  }, [financialRecords]);

  const momComparison = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    
    const categories = ["Tithe", "Offering", "Pledge"];
    return categories.map(cat => {
      const currentVal = financialRecords
        .filter(r => r.type === cat && new Date(r.date).getMonth() === currentMonth && new Date(r.date).getFullYear() === currentYear)
        .reduce((sum, r) => sum + r.amount, 0);
      const prevVal = financialRecords
        .filter(r => r.type === cat && new Date(r.date).getMonth() === prevMonth && new Date(r.date).getFullYear() === prevYear)
        .reduce((sum, r) => sum + r.amount, 0);
      
      const change = prevVal === 0 ? (currentVal > 0 ? 100 : 0) : Math.round(((currentVal - prevVal) / prevVal) * 100);
      
      return {
        category: cat + "s",
        current: currentVal,
        previous: prevVal,
        change
      };
    });
  }, [financialRecords]);

  const attendanceTrendData = useMemo(() => [], []);
  const heatmapData = useMemo(() => [], []);
  const classes = useMemo(() => sundaySchoolClasses.map(c => c.className), [sundaySchoolClasses]);
  const weeks = useMemo(() => ["W1", "W2", "W3", "W4"], []);

  const avgMonthlyTithe = useMemo(() => {
    const tithes = financialRecords.filter(r => r.type === "Tithe");
    if (tithes.length === 0) return 0;
    const total = tithes.reduce((sum, r) => sum + r.amount, 0);
    const months = new Set(tithes.map(r => {
      const d = new Date(r.date);
      return `${d.getMonth()}-${d.getFullYear()}`;
    }));
    return Math.round(total / (months.size || 1));
  }, [financialRecords]);

  const overallPledgeFulfillmentRate = useMemo(() => {
    const pledges = financialRecords.filter(r => r.type === "Pledge");
    if (pledges.length === 0) return 0;
    const fulfilled = pledges.filter(p => p.pledgeStatus === "Fulfilled").length;
    return Math.round((fulfilled / pledges.length) * 100);
  }, [financialRecords]);

  const netGrowthRate = useMemo(() => {
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    const newMembers = members.filter(m => m.membershipDate && new Date(m.membershipDate) >= twelveMonthsAgo).length;
    const totalMembers = members.length || 1;
    return Math.round((newMembers / totalMembers) * 100);
  }, [members]);

  useEffect(() => {
    setIsLoading(true);
    
    const membersQuery = collection(db, "members");
    const financialsQuery = collection(db, "transactions");
    const classesQuery = collection(db, "classes");

    const unsubscribeMembers = onSnapshot(membersQuery, (snapshot) => {
      const membersData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Member));
      setMembers(membersData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "members");
    });

    const unsubscribeFinancials = onSnapshot(financialsQuery, (snapshot) => {
      const financialsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as FinancialRecord));
      setFinancialRecords(financialsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "transactions");
    });

    const unsubscribeClasses = onSnapshot(classesQuery, (snapshot) => {
      const classesData = snapshot.docs.map(doc => ({ ...doc.data(), classId: doc.id } as SundaySchoolClass));
      setSundaySchoolClasses(classesData);
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "classes");
    });

    return () => {
      unsubscribeMembers();
      unsubscribeFinancials();
      unsubscribeClasses();
    };
  }, [activeTab]);

  const handleExportPDF = () => {
    toast.success("Generating PDF report...");
    // Mock PDF generation
  };

  const handleExportCSV = () => {
    toast.success("Exporting data to CSV...");
    // Mock CSV export
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-blue-600 tracking-tight">Reporting & Analytics</h2>
          <p className="text-muted-foreground">Comprehensive insights into church growth, attendance, and finances.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={handleExportCSV}>
            <FileSpreadsheet className="h-4 w-4" /> Export CSV
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={handlePrint}>
            <Printer className="h-4 w-4" /> Print
          </Button>
          <Button size="sm" className="gap-2 bg-blue-600 text-white hover:bg-blue-700 border-none shadow-md" onClick={handleExportPDF}>
            <Download className="h-4 w-4" /> Export PDF
          </Button>
        </div>
      </div>

      <Tabs defaultValue="membership" className="w-full" onValueChange={setActiveTab}>
        <TabsList variant="premium" className="grid w-full grid-cols-3 mb-10">
          <TabsTrigger value="membership" className="gap-2">
            <TrendingUp className="h-4 w-4" /> Membership Growth
          </TabsTrigger>
          <TabsTrigger value="attendance" className="gap-2">
            <CalendarIcon className="h-4 w-4" /> Attendance Analysis
          </TabsTrigger>
          <TabsTrigger value="financial" className="gap-2">
            <PieChartIcon className="h-4 w-4" /> Financial Summary
          </TabsTrigger>
        </TabsList>

        {/* --- Tab 1: Membership Growth --- */}
        <TabsContent value="membership" className="space-y-6">
          {isLoading ? (
            <DashboardSkeleton />
          ) : (
            <>
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Membership Growth Report</h3>
                <div className="flex items-center gap-2">
                  <Select defaultValue="2026">
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2026">2026</SelectItem>
                      <SelectItem value="2025">2025</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <StatCard 
                  title="Total Active Members" 
                  value={members.filter(m => m.membershipStatus === 'Active').length} 
                  subtext="Current active count"
                  icon={Users}
                  trend={0}
                />
                <StatCard 
                  title="Total Inactive" 
                  value={members.filter(m => m.membershipStatus === 'Inactive').length} 
                  subtext="Members on hiatus"
                  icon={EyeOff}
                  trend={0}
                />
                <StatCard 
                  title="Net Growth Rate" 
                  value={`${netGrowthRate}%`} 
                  subtext="Last 12 months"
                  icon={TrendingUp}
                  trend={0}
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <Card className="shadow-sm border border-border">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold">Total Membership Trend</CardTitle>
                    <CardDescription>Cumulative member count over the last 12 months</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={membershipGrowthData}>
                        <defs>
                          <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                        <Area type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="shadow-sm border border-border">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold">New Members vs. Departures</CardTitle>
                    <CardDescription>Monthly movement within the congregation</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={membershipGrowthData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                        <Bar dataKey="new" fill="#2563eb" radius={[4, 4, 0, 0]} name="New Members" />
                        <Bar dataKey="departures" fill="#dc2626" radius={[4, 4, 0, 0]} name="Departures" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <Card className="shadow-sm border border-border">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Department Breakdown</CardTitle>
                  <CardDescription>Member distribution across various church ministries</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-8 items-center">
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={departmentBreakdown}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="count"
                          >
                            {departmentBreakdown.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Department Name</TableHead>
                          <TableHead className="text-right">Member Count</TableHead>
                          <TableHead className="text-right">% of Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {departmentBreakdown.map((dept) => (
                          <TableRow key={dept.name}>
                            <TableCell className="font-medium flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: dept.color }} />
                              {dept.name}
                            </TableCell>
                            <TableCell className="text-right">{dept.count}</TableCell>
                            <TableCell className="text-right">
                              {((dept.count / departmentBreakdown.reduce((s, d) => s + d.count, 0)) * 100).toFixed(1)}%
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* --- Tab 2: Attendance Trend --- */}
        <TabsContent value="attendance" className="space-y-6">
          {isLoading ? (
            <div className="space-y-6">
              <DashboardSkeleton />
              <ChartSkeleton />
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Attendance Trend Analysis</h3>
                <div className="flex items-center gap-2">
                  <Select defaultValue="all">
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Age Group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Ages</SelectItem>
                      <SelectItem value="children">Children</SelectItem>
                      <SelectItem value="youth">Youth</SelectItem>
                      <SelectItem value="adults">Adults</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select defaultValue="all">
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Classes</SelectItem>
                      {classes.map(c => <SelectItem key={c} value={c.toLowerCase()}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <StatCard 
                  title="Most Attended Class" 
                  value="N/A" 
                  subtext="No data available"
                  icon={Users}
                />
                <StatCard 
                  title="Least Attended Class" 
                  value="N/A" 
                  subtext="No data available"
                  icon={Users}
                />
                <StatCard 
                  title="Overall Avg. Attendance" 
                  value="0" 
                  subtext="Last 8 weeks"
                  icon={TrendingUp}
                />
              </div>

              <Card className="shadow-sm border border-border">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Sunday School Attendance Trends</CardTitle>
                  <CardDescription>Weekly attendance per class over the last 8 weeks</CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={attendanceTrendData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="week" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                        {classes.map((cls, idx) => {
                          const colors = ["#2563eb", "#059669", "#d97706", "#dc2626", "#7c3aed", "#0891b2"];
                          return (
                            <Line 
                              key={cls}
                              type="monotone" 
                              dataKey={cls} 
                              stroke={colors[idx % colors.length]} 
                              strokeWidth={2} 
                              dot={{ r: 4 }} 
                            />
                          );
                        })}
                      </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="shadow-sm border border-border overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Attendance Heatmap</CardTitle>
                  <CardDescription>Visualizing attendance intensity across classes and weeks</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="w-[200px] font-bold">Class Name</TableHead>
                          {weeks.map(w => (
                            <TableHead key={w} className="text-center font-bold">{w}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {heatmapData.map((row) => (
                          <TableRow key={row.className}>
                            <TableCell className="font-medium">{row.className}</TableCell>
                            {row.attendance.map((val, idx) => {
                              // Color intensity logic: low (light) to high (dark)
                              const intensity = Math.min(Math.max((val - 20) / 40, 0.1), 1);
                              const bgColor = `rgba(37, 99, 235, ${intensity})`;
                              const textColor = intensity > 0.6 ? 'white' : 'black';
                              
                              return (
                                <TableCell 
                                  key={idx} 
                                  className="text-center p-0 h-12"
                                  style={{ backgroundColor: bgColor, color: textColor }}
                                >
                                  <span className="font-semibold">{val}</span>
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/30 p-4 flex justify-end gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-blue-100 border border-blue-200" />
                    <span>Low Attendance</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-blue-600" />
                    <span>High Attendance</span>
                  </div>
                </CardFooter>
              </Card>
            </>
          )}
        </TabsContent>

        {/* --- Tab 3: Financial Summary --- */}
        <TabsContent value="financial" className="space-y-6">
          {isLoading ? (
            <div className="space-y-6">
              <DashboardSkeleton />
              <ChartSkeleton />
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Financial Summary Dashboard</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="anonymize" className="text-sm cursor-pointer">Anonymize Contributors</Label>
                    <Switch 
                      id="anonymize" 
                      checked={anonymizeContributors} 
                      onCheckedChange={setAnonymizeContributors} 
                    />
                  </div>
                  <Select defaultValue="6m">
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3m">Last 3 Months</SelectItem>
                      <SelectItem value="6m">Last 6 Months</SelectItem>
                      <SelectItem value="1y">Last Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-4">
                <Card className="shadow-md bg-blue-600 text-white border-none">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium opacity-90">Total Income (All Time)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">GHS {financialRecords.reduce((sum, r) => sum + r.amount, 0).toLocaleString()}</div>
                    <p className="text-xs opacity-75 mt-1">Since inception</p>
                  </CardContent>
                </Card>
                <StatCard 
                  title="Current Month Income" 
                  value={`GHS ${financialRecords
                    .filter(r => new Date(r.date).getMonth() === new Date().getMonth() && new Date(r.date).getFullYear() === new Date().getFullYear())
                    .reduce((sum, r) => sum + r.amount, 0)
                    .toLocaleString()}`} 
                  subtext={new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
                  icon={FileText}
                  trend={0}
                />
                <StatCard 
                  title="Avg. Monthly Tithe" 
                  value={`GHS ${avgMonthlyTithe.toLocaleString()}`} 
                  subtext="Based on records"
                  icon={TrendingUp}
                  trend={0}
                />
                <StatCard 
                  title="Pledge Fulfillment" 
                  value={`${overallPledgeFulfillmentRate}%`} 
                  subtext="Overall rate"
                  icon={Check}
                  trend={0}
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <Card className="shadow-sm border border-border">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold">Income Breakdown</CardTitle>
                    <CardDescription>Tithe vs. Offering vs. Pledge (Last 6 Months)</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={financialData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                        <Bar dataKey="tithe" stackId="a" fill="#2563eb" name="Tithes" />
                        <Bar dataKey="offering" stackId="a" fill="#059669" name="Offerings" />
                        <Bar dataKey="pledge" stackId="a" fill="#d97706" name="Pledges" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="shadow-sm border border-border">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold">Pledge Fulfillment Rate</CardTitle>
                    <CardDescription>Status of committed pledges for the current year</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center justify-center">
                    <div className="h-[250px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pledgeFulfillment}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {pledgeFulfillment.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 text-center">
                      <p className="text-sm text-muted-foreground">
                        <span className="font-bold text-blue-600">{overallPledgeFulfillmentRate}%</span> of pledges have been fully fulfilled.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <Card className="shadow-sm border border-border">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold">Top 10 Contributors</CardTitle>
                    <CardDescription>Highest financial contributions this year</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead className="text-right">Total Amount</TableHead>
                          <TableHead className="text-right">Frequency</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topContributors.map((contributor, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">
                              {anonymizeContributors ? `Contributor #${idx + 1}` : contributor.name}
                            </TableCell>
                            <TableCell className="text-right font-semibold">GHS {contributor.amount.toLocaleString()}</TableCell>
                            <TableCell className="text-right">
                              <Badge variant="outline">{contributor.frequency}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card className="shadow-sm border border-border">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold">Month-over-Month Comparison</CardTitle>
                    <CardDescription>Comparing current month to previous month performance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Category</TableHead>
                          <TableHead className="text-right">Current</TableHead>
                          <TableHead className="text-right">Previous</TableHead>
                          <TableHead className="text-right">Change</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {momComparison.map((item) => (
                          <TableRow key={item.category}>
                            <TableCell className="font-medium">{item.category}</TableCell>
                            <TableCell className="text-right">GHS {item.current.toLocaleString()}</TableCell>
                            <TableCell className="text-right text-muted-foreground">GHS {item.previous.toLocaleString()}</TableCell>
                            <TableCell className={`text-right font-bold ${item.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {item.change > 0 ? '+' : ''}{item.change}%
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <div className="mt-8 p-4 bg-muted/30 rounded-lg border border-dashed border-muted-foreground/20">
                      <h4 className="text-sm font-bold flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-blue-600" /> Financial Insight
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Financial data is currently being aggregated from your records. As more transactions are added, this section will provide automated insights into your church's financial health and trends.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
