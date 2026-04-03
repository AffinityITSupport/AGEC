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
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Search, 
  Users, 
  Calendar as CalendarIcon, 
  Clock, 
  MoreVertical, 
  Edit, 
  Trash2, 
  X, 
  Check, 
  UserPlus,
  Info,
  Inbox
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
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetFooter
} from "@/components/ui/sheet";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
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
  where
} from "firebase/firestore";
import { SundaySchoolClass, AgeGroup, Member, AuditLog } from "../types";
import { logAudit } from "../lib/audit";
import { cn } from "@/lib/utils";
import { TableSkeleton } from "@/components/LoadingSkeleton";
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

export default function Groups() {
  const { user, role, ministry, isSuperAdmin, isSecretary, isMinistryLeader, isFinance, canEditSundaySchool, canDelete } = useFirebase();
  const [sundaySchoolClasses, setSundaySchoolClasses] = useState<SundaySchoolClass[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [activeTab, setActiveTab] = useState("directory");
  const [selectedClass, setSelectedClass] = useState<SundaySchoolClass | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [classToDelete, setClassToDelete] = useState<string | null>(null);
  const [editingClass, setEditingClass] = useState<SundaySchoolClass | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Real-time data fetching
  useEffect(() => {
    if (!user) return;
    setIsLoading(true);
    
    let classesQuery;
    if (isSuperAdmin || isSecretary || isFinance) {
      classesQuery = collection(db, "classes");
    } else if (isMinistryLeader && ministry) {
      classesQuery = query(collection(db, "classes"), where("className", "==", ministry));
    } else {
      setIsLoading(false);
      return;
    }

    const membersQuery = collection(db, "members");

    const unsubscribeClasses = onSnapshot(classesQuery, (snapshot) => {
      const classesData = snapshot.docs.map(doc => ({ ...doc.data(), classId: doc.id } as SundaySchoolClass));
      setSundaySchoolClasses(classesData);
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "classes");
    });

    const unsubscribeMembers = onSnapshot(membersQuery, (snapshot) => {
      const membersData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Member));
      setMembers(membersData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "members");
    });

    return () => {
      unsubscribeClasses();
      unsubscribeMembers();
    };
  }, []);

  // --- Tab 2: Form State ---
  const [formData, setFormData] = useState<Partial<SundaySchoolClass>>({
    className: "",
    ageGroup: "Children",
    teacherMemberId: "",
    meetingDay: "Sunday",
    meetingTime: "09:00",
    description: "",
    members: []
  });
  const [memberSearch, setMemberSearch] = useState("");
  const [teacherSearch, setTeacherSearch] = useState("");

  const filteredMembersForEnrollment = useMemo(() => {
    return members.filter(m => 
      `${m.firstName} ${m.lastName}`.toLowerCase().includes(memberSearch.toLowerCase()) ||
      m.id.toLowerCase().includes(memberSearch.toLowerCase())
    );
  }, [members, memberSearch]);

  const filteredTeachers = useMemo(() => {
    return members.filter(m => 
      `${m.firstName} ${m.lastName}`.toLowerCase().includes(teacherSearch.toLowerCase()) ||
      m.id.toLowerCase().includes(teacherSearch.toLowerCase())
    );
  }, [members, teacherSearch]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.className || !formData.teacherMemberId) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      if (editingClass) {
        const classRef = doc(db, "classes", editingClass.classId);
        const updateData = {
          ...formData,
          members: formData.members || []
        };
        await updateDoc(classRef, updateData);
        
        await logAudit(
          "UPDATE",
          "GROUP",
          editingClass.classId,
          `Updated class: ${formData.className}`,
          Object.keys(updateData).map(key => ({
            field: key,
            oldValue: (editingClass as any)[key],
            newValue: (updateData as any)[key]
          })).filter(c => JSON.stringify(c.oldValue) !== JSON.stringify(c.newValue))
        );

        toast.success("Class updated successfully");
      } else {
        const newData = {
          ...formData,
          members: formData.members || [],
          createdAt: new Date().toISOString()
        };
        const docRef = await addDoc(collection(db, "classes"), newData);
        
        await logAudit(
          "CREATE",
          "GROUP",
          docRef.id,
          `Created new class: ${formData.className}`
        );

        toast.success("New class registered successfully");
      }

      resetForm();
      setActiveTab("directory");
    } catch (error) {
      handleFirestoreError(error, editingClass ? OperationType.UPDATE : OperationType.CREATE, "classes");
    }
  };

  const resetForm = () => {
    setEditingClass(null);
    setFormData({
      className: "",
      ageGroup: "Children",
      teacherMemberId: "",
      meetingDay: "Sunday",
      meetingTime: "09:00",
      description: "",
      members: []
    });
  };

  const toggleMemberEnrollment = (memberId: string) => {
    const currentMembers = formData.members || [];
    if (currentMembers.includes(memberId)) {
      setFormData({ ...formData, members: currentMembers.filter(id => id !== memberId) });
    } else {
      setFormData({ ...formData, members: [...currentMembers, memberId] });
    }
  };

  const getMemberName = (id: string) => {
    const m = members.find(member => member.id === id);
    return m ? `${m.firstName} ${m.lastName}` : "Unknown Member";
  };

  const getMemberAvatar = (id: string) => {
    const m = members.find(member => member.id === id);
    return m?.photo;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight text-primary">Sunday School & Groups</h2>
        <p className="text-muted-foreground">Manage classes, groups, and member enrollment.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList variant="premium" className="grid w-full grid-cols-2 max-w-md mb-8">
          <TabsTrigger value="directory">Class Directory</TabsTrigger>
          <TabsTrigger value="form">{editingClass ? "Edit Class" : "Add New Class"}</TabsTrigger>
        </TabsList>

        {/* --- Tab 1: Class Directory --- */}
        <TabsContent value="directory" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Registered Classes</h3>
            {canEditSundaySchool && (
              <Button onClick={() => { resetForm(); setActiveTab("form"); }} className="gap-2">
                <Plus className="h-4 w-4" /> Add New Class
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="border-border/50">
                  <CardHeader className="pb-3">
                    <div className="h-5 w-20 bg-muted animate-pulse rounded mb-2" />
                    <div className="h-7 w-3/4 bg-muted animate-pulse rounded" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
                      <div className="space-y-1">
                        <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                        <div className="h-3 w-12 bg-muted animate-pulse rounded" />
                      </div>
                    </div>
                    <div className="h-px bg-border/50" />
                    <div className="grid grid-cols-2 gap-4">
                      <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                      <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : sundaySchoolClasses.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No classes registered"
              description="Start by creating your first Sunday School class or group."
              actionLabel="Add New Class"
              onAction={() => { resetForm(); setActiveTab("form"); }}
            />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {sundaySchoolClasses.map((cls) => (
                <Card 
                  key={cls.classId} 
                  className="group hover:shadow-md transition-all cursor-pointer border-border/50"
                  onClick={() => {
                    setSelectedClass(cls);
                    setIsDetailOpen(true);
                  }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <Badge variant="secondary" className="mb-2">
                        {cls.ageGroup}
                      </Badge>
                      {canEditSundaySchool && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingClass(cls);
                            setFormData(cls);
                            setActiveTab("form");
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <CardTitle className="text-xl">{cls.className}</CardTitle>
                    <CardDescription className="line-clamp-2">{cls.description || "No description provided."}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3 text-sm">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={getMemberAvatar(cls.teacherMemberId)} />
                        <AvatarFallback>{getMemberName(cls.teacherMemberId).charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{getMemberName(cls.teacherMemberId)}</p>
                        <p className="text-xs text-muted-foreground">Teacher</p>
                      </div>
                    </div>
                    <Separator className="bg-border/50" />
                    <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Users className="h-3 w-3" />
                        <span>{cls.members.length} Members</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-3 w-3" />
                        <span>{cls.meetingDay}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        <span>{cls.meetingTime}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* --- Tab 2: Add / Edit Class Form --- */}
        <TabsContent value="form">
          <Card className="max-w-4xl mx-auto shadow-sm">
            <CardHeader>
              <CardTitle>{editingClass ? "Edit Sunday School Class" : "Register New Class"}</CardTitle>
              <CardDescription>Define class details and enroll members.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleFormSubmit} className="space-y-8">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="className">Class Name</Label>
                      <Input 
                        id="className"
                        placeholder="e.g. Beginners Sunday School" 
                        value={formData.className}
                        onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Age Group</Label>
                      <Select 
                        value={formData.ageGroup} 
                        onValueChange={(val) => setFormData({ ...formData, ageGroup: val as AgeGroup })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select age group" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Children">Children</SelectItem>
                          <SelectItem value="Youth">Youth</SelectItem>
                          <SelectItem value="Young Adults">Young Adults</SelectItem>
                          <SelectItem value="Adults">Adults</SelectItem>
                          <SelectItem value="Seniors">Seniors</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Teacher</Label>
                      <Select 
                        value={formData.teacherMemberId} 
                        onValueChange={(val) => setFormData({ ...formData, teacherMemberId: val })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select teacher" />
                        </SelectTrigger>
                        <SelectContent>
                          <div className="p-2">
                            <Input 
                              placeholder="Search teacher..." 
                              value={teacherSearch}
                              onChange={(e) => setTeacherSearch(e.target.value)}
                              className="h-8"
                            />
                          </div>
                          {filteredTeachers.map(m => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.firstName} {m.lastName} ({m.id})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Meeting Day</Label>
                        <Select 
                          value={formData.meetingDay} 
                          onValueChange={(val) => setFormData({ ...formData, meetingDay: val })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Day" />
                          </SelectTrigger>
                          <SelectContent>
                            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => (
                              <SelectItem key={day} value={day}>{day}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Meeting Time</Label>
                        <Input 
                          type="time" 
                          value={formData.meetingTime}
                          onChange={(e) => setFormData({ ...formData, meetingTime: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea 
                        id="description"
                        placeholder="Briefly describe the class goals..." 
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="h-24"
                      />
                    </div>
                  </div>

                  {/* Member Enrollment Section */}
                  <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold">Member Enrollment</Label>
                      <Badge variant="outline" className="bg-background">
                        {formData.members?.length || 0} Enrolled
                      </Badge>
                    </div>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input 
                        placeholder="Search members to enroll..." 
                        className="pl-10 bg-background"
                        value={memberSearch}
                        onChange={(e) => setMemberSearch(e.target.value)}
                      />
                    </div>
                    <ScrollArea className="h-[300px] pr-4">
                      <div className="space-y-2">
                        {filteredMembersForEnrollment.map((m) => (
                          <div 
                            key={m.id} 
                            className={cn(
                              "flex items-center justify-between p-2 rounded-md transition-colors cursor-pointer",
                              formData.members?.includes(m.id) ? "bg-primary/10" : "hover:bg-muted"
                            )}
                            onClick={() => toggleMemberEnrollment(m.id)}
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={m.photo} />
                                <AvatarFallback>{m.firstName[0]}{m.lastName[0]}</AvatarFallback>
                              </Avatar>
                              <div className="text-sm">
                                <p className="font-medium">{m.firstName} {m.lastName}</p>
                                <p className="text-xs text-muted-foreground">{m.id}</p>
                              </div>
                            </div>
                            <Checkbox 
                              checked={formData.members?.includes(m.id)} 
                              onCheckedChange={() => toggleMemberEnrollment(m.id)}
                            />
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                    
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground uppercase">Enrolled Members</Label>
                      <div className="flex flex-wrap gap-2">
                        {formData.members?.length === 0 ? (
                          <p className="text-xs text-muted-foreground italic">No members enrolled yet.</p>
                        ) : (
                          formData.members?.map(id => (
                            <div key={id} className="flex items-center gap-1 bg-background border rounded-full pl-1 pr-2 py-1 text-[10px] font-medium">
                              <Avatar className="h-4 w-4">
                                <AvatarImage src={getMemberAvatar(id)} />
                                <AvatarFallback>{getMemberName(id).charAt(0)}</AvatarFallback>
                              </Avatar>
                              <span>{getMemberName(id)}</span>
                              <X 
                                className="h-3 w-3 cursor-pointer hover:text-destructive" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleMemberEnrollment(id);
                                }}
                              />
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      resetForm();
                      setActiveTab("directory");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-primary px-8">
                    {editingClass ? "Update Class" : "Create Class"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detail Drawer */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          {selectedClass && (
            <>
              <SheetHeader className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{selectedClass.ageGroup}</Badge>
                  <span className="text-xs text-muted-foreground">ID: {selectedClass.classId}</span>
                </div>
                <SheetTitle className="text-2xl font-bold">{selectedClass.className}</SheetTitle>
                <SheetDescription>
                  {selectedClass.description || "No description provided for this class."}
                </SheetDescription>
              </SheetHeader>

              <div className="py-6 space-y-6">
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Info className="h-4 w-4 text-primary" /> Schedule & Teacher
                  </h4>
                  <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase">Meeting Day</p>
                      <p className="font-medium">{selectedClass.meetingDay}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase">Meeting Time</p>
                      <p className="font-medium">{selectedClass.meetingTime}</p>
                    </div>
                    <div className="col-span-2 pt-2 border-t border-border/50">
                      <p className="text-xs text-muted-foreground uppercase mb-2">Teacher</p>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={getMemberAvatar(selectedClass.teacherMemberId)} />
                          <AvatarFallback>{getMemberName(selectedClass.teacherMemberId).charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{getMemberName(selectedClass.teacherMemberId)}</p>
                          <p className="text-xs text-muted-foreground">Assigned Teacher</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" /> Enrolled Members
                    </h4>
                    <Badge variant="outline">{selectedClass.members.length}</Badge>
                  </div>
                  <div className="space-y-2">
                    {selectedClass.members.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic text-center py-4">No members enrolled in this class.</p>
                    ) : (
                      selectedClass.members.map(id => {
                        const m = members.find(member => member.id === id);
                        return (
                          <div key={id} className="flex items-center justify-between p-2 border rounded-md hover:bg-muted/30 transition-colors">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={m?.photo} />
                                <AvatarFallback>{m?.firstName[0]}{m?.lastName[0]}</AvatarFallback>
                              </Avatar>
                              <div className="text-sm">
                                <p className="font-medium">{m?.firstName} {m?.lastName}</p>
                                <p className="text-xs text-muted-foreground">{m?.id}</p>
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Info className="h-4 w-4" />
                            </Button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              <SheetFooter className="pt-6 border-t">
                <div className="flex gap-2 w-full">
                  {canEditSundaySchool && (
                    <Button 
                      variant="outline" 
                      className="flex-1 gap-2"
                      onClick={() => {
                        setIsDetailOpen(false);
                        setEditingClass(selectedClass);
                        setFormData(selectedClass);
                        setActiveTab("form");
                      }}
                    >
                      <Edit className="h-4 w-4" /> Edit Class
                    </Button>
                  )}
                  {canDelete && (
                    <Button 
                      variant="destructive" 
                      size="icon"
                      onClick={() => {
                        setClassToDelete(selectedClass.classId);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Class</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this class? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (classToDelete) {
                  const classRecord = sundaySchoolClasses.find(c => c.classId === classToDelete);
                  try {
                    await deleteDoc(doc(db, "classes", classToDelete));
                    
                    if (classRecord) {
                      await logAudit(
                        "DELETE",
                        "GROUP",
                        classToDelete,
                        `Deleted class: ${classRecord.className}`
                      );
                    }

                    setIsDeleteDialogOpen(false);
                    setIsDetailOpen(false);
                    toast.info("Class deleted");
                  } catch (error) {
                    handleFirestoreError(error, OperationType.DELETE, `classes/${classToDelete}`);
                  }
                }
              }}
            >
              Delete Class
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
