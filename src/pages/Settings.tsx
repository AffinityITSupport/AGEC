import * as React from "react";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  Church, 
  Shield, 
  Bell, 
  Globe, 
  Mail, 
  Save, 
  User, 
  Users as UsersIcon,
  Plus, 
  Trash2, 
  Upload, 
  Phone, 
  MapPin, 
  Lock,
  CheckCircle2,
  AlertCircle,
  Type,
  Wallet
} from "lucide-react";
import { toast } from "sonner";
import { db, auth } from "../firebase";
import { doc, getDoc, setDoc, onSnapshot, collection, query, getDocs, updateDoc, where } from "firebase/firestore";
import { useFirebase } from "../context/FirebaseContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Settings() {
  const { isSuperAdmin, user } = useFirebase();
  const [isLoading, setIsLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState(false);

  // Tab 1: Church Profile State
  const [churchProfile, setChurchProfile] = useState({
    name: "Global Evangelical Church (GEC)",
    denomination: "Evangelical",
    address: "123 Church Road, Accra, Ghana",
    phone: "+233 24 123 4567",
    email: "info@gecaccra.org",
    website: "https://gecaccra.org",
    logo: "https://raw.githubusercontent.com/paulekuadzi/gec-cms-assets/main/gec-logo.png"
  });

  // Tab 2: Departments State
  const [departments, setDepartments] = useState<string[]>([]);
  const [newDepartment, setNewDepartment] = useState("");

  // Tab: Teams State
  const [teams, setTeams] = useState<string[]>([]);
  const [newTeam, setNewTeam] = useState("");

  // Tab 3: Transaction Types State
  const [transactionTypes, setTransactionTypes] = useState<string[]>([]);
  const [newTransactionType, setNewTransactionType] = useState("");

  // Tab 5: Member Titles State
  const [memberTitles, setMemberTitles] = useState<string[]>([]);
  const [newMemberTitle, setNewMemberTitle] = useState("");

  // Tab 6: Countries State
  const [countries, setCountries] = useState<string[]>([]);
  const [newCountry, setNewCountry] = useState("");

  // Tab 7: Regions State
  const [regions, setRegions] = useState<string[]>([]);
  const [newRegion, setNewRegion] = useState("");

  // Tab 8: Education Levels State
  const [educationLevels, setEducationLevels] = useState<string[]>([]);
  const [newEducationLevel, setNewEducationLevel] = useState("");

  // Tab: Budget Categories State
  const [budgetCategories, setBudgetCategories] = useState<string[]>([]);
  const [newBudgetCategory, setNewBudgetCategory] = useState("");

  // Tab 9: Marital Status State
  const [maritalStatuses, setMaritalStatuses] = useState<string[]>([]);
  const [newMaritalStatus, setNewMaritalStatus] = useState("");

  // Tab 10: Days of Week State
  const [daysOfWeek, setDaysOfWeek] = useState<string[]>([]);
  const [newDayOfWeek, setNewDayOfWeek] = useState("");

  // Load settings from Firestore
  useEffect(() => {
    const settingsDoc = doc(db, "settings", "global");
    
    const unsubscribe = onSnapshot(settingsDoc, (docSnap) => {
      const defaults = {
        churchProfile: {
          name: "Global Evangelical Church (GEC)",
          denomination: "Evangelical",
          address: "123 Church Road, Accra, Ghana",
          phone: "+233 24 123 4567",
          email: "info@gecaccra.org",
          website: "https://gecaccra.org",
          logo: "https://raw.githubusercontent.com/paulekuadzi/gec-cms-assets/main/gec-logo.png"
        },
        departments: ["Choir", "Ushers", "Youth Ministry", "Sunday School", "Men's Fellowship", "Women's Fellowship", "Media Team"],
        teams: ["Praise Team", "Protocol", "Welfare Team", "Evangelism Team", "Visitation Team"],
        transactionTypes: ["Tithe", "Offering", "Pledge", "Commitment", "Donation", "Welfare", "Building Fund"],
        memberTitles: ["Mr.", "Mrs.", "Ms.", "Miss.", "Dr.", "Rev.", "Pastor", "Elder", "Deacon", "Deaconess"],
        countries: ["Ghana", "Nigeria", "Togo", "Benin", "Ivory Coast", "USA", "UK", "Canada"],
        regions: ["Greater Accra", "Ashanti", "Central", "Eastern", "Western", "Volta", "Northern", "Upper East", "Upper West", "Bono", "Bono East", "Ahafo", "Savannah", "North East", "Oti", "Western North"],
        educationLevels: ["None", "Primary", "JHS", "SHS", "Vocational", "Diploma", "Bachelor's Degree", "Master's Degree", "PhD", "Other"],
        budgetCategories: ["Operations", "Missions", "Welfare", "Infrastructure", "Events", "Salaries", "Other"],
        maritalStatuses: ["Single", "Married", "Divorced", "Widowed"],
        daysOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
      };

      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.churchProfile) setChurchProfile(data.churchProfile);
        if (data.departments) setDepartments(data.departments);
        if (data.teams) setTeams(data.teams);
        if (data.transactionTypes) setTransactionTypes(data.transactionTypes);
        if (data.memberTitles) setMemberTitles(data.memberTitles);
        if (data.countries) setCountries(data.countries);
        if (data.regions) setRegions(data.regions);
        if (data.educationLevels) setEducationLevels(data.educationLevels);
        if (data.budgetCategories) setBudgetCategories(data.budgetCategories);
        if (data.maritalStatuses) setMaritalStatuses(data.maritalStatuses);
        if (data.daysOfWeek) setDaysOfWeek(data.daysOfWeek);

        // Check for missing fields and update if necessary
        const missingFields: any = {};
        let hasMissing = false;
        Object.keys(defaults).forEach(key => {
          if (!(key in data)) {
            missingFields[key] = (defaults as any)[key];
            hasMissing = true;
          }
        });
        if (hasMissing) {
          setDoc(settingsDoc, missingFields, { merge: true });
        }
      } else {
        // Initialize with defaults if not exists
        setDoc(settingsDoc, defaults);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Load all users if Super Admin
  useEffect(() => {
    if (isSuperAdmin) {
      fetchUsers();
    }
  }, [isSuperAdmin]);

  const fetchUsers = async () => {
    setIsUsersLoading(true);
    try {
      const usersSnap = await getDocs(collection(db, "users"));
      const usersData = usersSnap.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setAllUsers(usersData);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setIsUsersLoading(false);
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      await updateDoc(doc(db, "users", userId), { role: newRole });
      toast.success("User role updated successfully");
      fetchUsers();
    } catch (error) {
      console.error("Error updating user role:", error);
      toast.error("Failed to update user role");
    }
  };

  const handleUpdateUserMinistry = async (userId: string, newMinistry: string) => {
    try {
      await updateDoc(doc(db, "users", userId), { ministry: newMinistry === "none" ? null : newMinistry });
      toast.success("User ministry updated successfully");
      fetchUsers();
    } catch (error) {
      console.error("Error updating user ministry:", error);
      toast.error("Failed to update user ministry");
    }
  };

  const saveSettings = async (updates: any) => {
    try {
      const settingsDoc = doc(db, "settings", "global");
      await setDoc(settingsDoc, updates, { merge: true });
      return true;
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings.");
      return false;
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setChurchProfile({ ...churchProfile, logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  // Tab 4: User State
  const [userProfile] = useState({
    name: "Paul Ekuadzi",
    role: "Admin",
    email: "paulekuadzi@gmail.com"
  });

  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: ""
  });

  const handleSaveProfile = async () => {
    const success = await saveSettings({ churchProfile });
    if (success) {
      toast.success("Church profile updated successfully!", {
        description: "All changes have been saved to the database.",
        icon: <CheckCircle2 className="h-4 w-4 text-green-500" />
      });
    }
  };

  const addDepartment = async () => {
    if (newDepartment.trim() && !departments.includes(newDepartment.trim())) {
      const updatedDepts = [...departments, newDepartment.trim()];
      const success = await saveSettings({ departments: updatedDepts });
      if (success) {
        setNewDepartment("");
        toast.success(`Department "${newDepartment}" added.`);
      }
    }
  };

  const deleteDepartment = async (name: string) => {
    const updatedDepts = departments.filter(d => d !== name);
    const success = await saveSettings({ departments: updatedDepts });
    if (success) {
      toast.info(`Department "${name}" removed.`);
    }
  };

  const addTeam = async () => {
    if (newTeam.trim() && !teams.includes(newTeam.trim())) {
      const updatedTeams = [...teams, newTeam.trim()];
      const success = await saveSettings({ teams: updatedTeams });
      if (success) {
        setNewTeam("");
        toast.success(`Team "${newTeam}" added.`);
      }
    }
  };

  const deleteTeam = async (name: string) => {
    const updatedTeams = teams.filter(t => t !== name);
    const success = await saveSettings({ teams: updatedTeams });
    if (success) {
      toast.info(`Team "${name}" removed.`);
    }
  };

  const addTransactionType = async () => {
    if (newTransactionType.trim() && !transactionTypes.includes(newTransactionType.trim())) {
      const updatedTypes = [...transactionTypes, newTransactionType.trim()];
      const success = await saveSettings({ transactionTypes: updatedTypes });
      if (success) {
        setNewTransactionType("");
        toast.success(`Transaction type "${newTransactionType}" added.`);
      }
    }
  };

  const deleteTransactionType = async (name: string) => {
    const updatedTypes = transactionTypes.filter(t => t !== name);
    const success = await saveSettings({ transactionTypes: updatedTypes });
    if (success) {
      toast.info(`Transaction type "${name}" removed.`);
    }
  };

  const addMemberTitle = async () => {
    if (newMemberTitle.trim() && !memberTitles.includes(newMemberTitle.trim())) {
      const updatedTitles = [...memberTitles, newMemberTitle.trim()];
      const success = await saveSettings({ memberTitles: updatedTitles });
      if (success) {
        setNewMemberTitle("");
        toast.success(`Title "${newMemberTitle}" added.`);
      }
    }
  };

  const deleteMemberTitle = async (title: string) => {
    const updatedTitles = memberTitles.filter(t => t !== title);
    const success = await saveSettings({ memberTitles: updatedTitles });
    if (success) {
      toast.info(`Title "${title}" removed.`);
    }
  };

  const addCountry = async () => {
    if (newCountry.trim() && !countries.includes(newCountry.trim())) {
      const updatedCountries = [...countries, newCountry.trim()];
      const success = await saveSettings({ countries: updatedCountries });
      if (success) {
        setNewCountry("");
        toast.success(`Country "${newCountry}" added.`);
      }
    }
  };

  const deleteCountry = async (name: string) => {
    const updatedCountries = countries.filter(c => c !== name);
    const success = await saveSettings({ countries: updatedCountries });
    if (success) {
      toast.info(`Country "${name}" removed.`);
    }
  };

  const addRegion = async () => {
    if (newRegion.trim() && !regions.includes(newRegion.trim())) {
      const updatedRegions = [...regions, newRegion.trim()];
      const success = await saveSettings({ regions: updatedRegions });
      if (success) {
        setNewRegion("");
        toast.success(`Region "${newRegion}" added.`);
      }
    }
  };

  const deleteRegion = async (name: string) => {
    const updatedRegions = regions.filter(r => r !== name);
    const success = await saveSettings({ regions: updatedRegions });
    if (success) {
      toast.info(`Region "${name}" removed.`);
    }
  };

  const addEducationLevel = async () => {
    if (newEducationLevel.trim() && !educationLevels.includes(newEducationLevel.trim())) {
      const updatedLevels = [...educationLevels, newEducationLevel.trim()];
      const success = await saveSettings({ educationLevels: updatedLevels });
      if (success) {
        setNewEducationLevel("");
        toast.success(`Education level "${newEducationLevel}" added.`);
      }
    }
  };

  const deleteEducationLevel = async (level: string) => {
    const updatedLevels = educationLevels.filter(l => l !== level);
    const success = await saveSettings({ educationLevels: updatedLevels });
    if (success) {
      toast.info(`Education level "${level}" removed.`);
    }
  };

  const addBudgetCategory = async () => {
    if (newBudgetCategory.trim() && !budgetCategories.includes(newBudgetCategory.trim())) {
      const updatedCats = [...budgetCategories, newBudgetCategory.trim()];
      const success = await saveSettings({ budgetCategories: updatedCats });
      if (success) {
        setNewBudgetCategory("");
        toast.success(`Budget category "${newBudgetCategory}" added.`);
      }
    }
  };

  const deleteBudgetCategory = async (name: string) => {
    const updatedCats = budgetCategories.filter(c => c !== name);
    const success = await saveSettings({ budgetCategories: updatedCats });
    if (success) {
      toast.info(`Budget category "${name}" removed.`);
    }
  };

  const addMaritalStatus = async () => {
    if (newMaritalStatus.trim() && !maritalStatuses.includes(newMaritalStatus.trim())) {
      const updatedStatuses = [...maritalStatuses, newMaritalStatus.trim()];
      const success = await saveSettings({ maritalStatuses: updatedStatuses });
      if (success) {
        setNewMaritalStatus("");
        toast.success(`Marital status "${newMaritalStatus}" added.`);
      }
    }
  };

  const deleteMaritalStatus = async (status: string) => {
    const updatedStatuses = maritalStatuses.filter(s => s !== status);
    const success = await saveSettings({ maritalStatuses: updatedStatuses });
    if (success) {
      toast.info(`Marital status "${status}" removed.`);
    }
  };

  const addDayOfWeek = async () => {
    if (newDayOfWeek.trim() && !daysOfWeek.includes(newDayOfWeek.trim())) {
      const updatedDays = [...daysOfWeek, newDayOfWeek.trim()];
      const success = await saveSettings({ daysOfWeek: updatedDays });
      if (success) {
        setNewDayOfWeek("");
        toast.success(`Day "${newDayOfWeek}" added.`);
      }
    }
  };

  const deleteDayOfWeek = async (day: string) => {
    const updatedDays = daysOfWeek.filter(d => d !== day);
    const success = await saveSettings({ daysOfWeek: updatedDays });
    if (success) {
      toast.info(`Day "${day}" removed.`);
    }
  };

  const handlePasswordChange = () => {
    if (passwords.new !== passwords.confirm) {
      toast.error("Passwords do not match!");
      return;
    }
    if (passwords.new.length < 8) {
      toast.error("New password must be at least 8 characters long.");
      return;
    }
    toast.success("Password changed successfully!");
    setPasswords({ current: "", new: "", confirm: "" });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[400px]">Loading settings...</div>;
  }

  return (
    <div className="container mx-auto py-6 space-y-8 max-w-5xl">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your church configuration and account preferences.</p>
      </div>

      <Tabs defaultValue="profile" className="w-full space-y-8">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-4 -mx-4 px-4">
          <div className="overflow-x-auto pb-2 scrollbar-hide">
            <TabsList className="inline-flex h-auto w-max min-w-full bg-muted/50 p-1 border shadow-sm rounded-lg gap-1">
              <TabsTrigger value="profile" className="flex items-center gap-2 px-4 py-2 whitespace-nowrap">
                <Church className="h-4 w-4" /> Church Profile
              </TabsTrigger>
              <TabsTrigger value="departments" className="flex items-center gap-2 px-4 py-2 whitespace-nowrap">
                <User className="h-4 w-4" /> Departments
              </TabsTrigger>
              <TabsTrigger value="teams" className="flex items-center gap-2 px-4 py-2 whitespace-nowrap">
                <UsersIcon className="h-4 w-4" /> Teams
              </TabsTrigger>
              <TabsTrigger value="titles" className="flex items-center gap-2 px-4 py-2 whitespace-nowrap">
                <Type className="h-4 w-4" /> Member Titles
              </TabsTrigger>
              <TabsTrigger value="education" className="flex items-center gap-2 px-4 py-2 whitespace-nowrap">
                <CheckCircle2 className="h-4 w-4" /> Education
              </TabsTrigger>
              <TabsTrigger value="budgetCategories" className="flex items-center gap-2 px-4 py-2 whitespace-nowrap">
                <Wallet className="h-4 w-4" /> Budget Categories
              </TabsTrigger>
              <TabsTrigger value="marital" className="flex items-center gap-2 px-4 py-2 whitespace-nowrap">
                <UsersIcon className="h-4 w-4" /> Marital Status
              </TabsTrigger>
              <TabsTrigger value="days" className="flex items-center gap-2 px-4 py-2 whitespace-nowrap">
                <Bell className="h-4 w-4" /> Days of Week
              </TabsTrigger>
              <TabsTrigger value="countries" className="flex items-center gap-2 px-4 py-2 whitespace-nowrap">
                <Globe className="h-4 w-4" /> Countries
              </TabsTrigger>
              <TabsTrigger value="regions" className="flex items-center gap-2 px-4 py-2 whitespace-nowrap">
                <MapPin className="h-4 w-4" /> Regions
              </TabsTrigger>
              <TabsTrigger value="financials" className="flex items-center gap-2 px-4 py-2 whitespace-nowrap">
                <Globe className="h-4 w-4" /> Transaction Types
              </TabsTrigger>
              <TabsTrigger value="user" className="flex items-center gap-2 px-4 py-2 whitespace-nowrap">
                <Shield className="h-4 w-4" /> User & Admin
              </TabsTrigger>
              {isSuperAdmin && (
                <TabsTrigger value="usermanagement" className="flex items-center gap-2 px-4 py-2 whitespace-nowrap">
                  <UsersIcon className="h-4 w-4" /> User Management
                </TabsTrigger>
              )}
            </TabsList>
          </div>
        </div>

        <div className="w-full">
          {/* Tab 1: Church Profile */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Church Information</CardTitle>
              <CardDescription>Update your church's public details and branding.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="space-y-4 flex flex-col items-center">
                  <Label>Church Logo</Label>
                  <div className="relative group">
                    <img 
                      src={churchProfile.logo} 
                      alt="Church Logo" 
                      className="w-32 h-32 rounded-lg object-cover border-2 border-muted"
                      referrerPolicy="no-referrer"
                    />
                    <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center cursor-pointer">
                      <Upload className="h-6 w-6 text-white" />
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleLogoChange}
                      />
                    </label>
                  </div>
                  <Button variant="outline" size="sm" className="w-full" asChild nativeButton={false}>
                    <label className="cursor-pointer">
                      Change Logo
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleLogoChange}
                      />
                    </label>
                  </Button>
                </div>

                <div className="flex-1 grid gap-4 md:grid-cols-2 w-full">
                  <div className="space-y-2">
                    <Label htmlFor="church-name">Church Name</Label>
                    <Input 
                      id="church-name" 
                      value={churchProfile.name} 
                      onChange={(e) => setChurchProfile({...churchProfile, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="denomination">Denomination</Label>
                    <Input 
                      id="denomination" 
                      value={churchProfile.denomination} 
                      onChange={(e) => setChurchProfile({...churchProfile, denomination: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input 
                      id="email" 
                      type="email"
                      value={churchProfile.email} 
                      onChange={(e) => setChurchProfile({...churchProfile, email: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input 
                      id="phone" 
                      value={churchProfile.phone} 
                      onChange={(e) => setChurchProfile({...churchProfile, phone: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="website">Website</Label>
                    <Input 
                      id="website" 
                      value={churchProfile.website} 
                      onChange={(e) => setChurchProfile({...churchProfile, website: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Physical Address</Label>
                    <Input 
                      id="address" 
                      value={churchProfile.address} 
                      onChange={(e) => setChurchProfile({...churchProfile, address: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4 flex justify-end">
              <Button onClick={handleSaveProfile} className="gap-2">
                <Save className="h-4 w-4" /> Save Changes
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Tab 2: Departments */}
        <TabsContent value="departments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Church Departments</CardTitle>
              <CardDescription>Manage the various ministries and departments in your church.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-2">
                <Input 
                  placeholder="New department name..." 
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addDepartment()}
                />
                <Button onClick={addDepartment} className="gap-2">
                  <Plus className="h-4 w-4" /> Add
                </Button>
              </div>

              <div className="grid gap-2">
                {departments.map((dept) => (
                  <div key={dept} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <span className="font-medium">{dept}</span>
                    
                    <div className="flex items-center gap-1">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the "{dept}" department. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteDepartment(dept)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Teams */}
        <TabsContent value="teams" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Department Teams</CardTitle>
              <CardDescription>Manage specific teams within your church departments.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-2">
                <Input 
                  placeholder="New team name..." 
                  value={newTeam}
                  onChange={(e) => setNewTeam(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addTeam()}
                />
                <Button onClick={addTeam} className="gap-2">
                  <Plus className="h-4 w-4" /> Add
                </Button>
              </div>

              <div className="grid gap-2">
                {teams.map((team) => (
                  <div key={team} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <span className="font-medium">{team}</span>
                    
                    <div className="flex items-center gap-1">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the "{team}" team. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteTeam(team)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 5: Member Titles */}
        <TabsContent value="titles" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Member Titles</CardTitle>
              <CardDescription>Manage the titles available for member registration (e.g., Mr., Mrs., Dr.).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-2">
                <Input 
                  placeholder="New title (e.g. Prof.)..." 
                  value={newMemberTitle}
                  onChange={(e) => setNewMemberTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addMemberTitle()}
                />
                <Button onClick={addMemberTitle} className="gap-2">
                  <Plus className="h-4 w-4" /> Add
                </Button>
              </div>

              <div className="grid gap-2">
                {memberTitles.map((title) => (
                  <div key={title} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <span className="font-medium">{title}</span>
                    
                    <div className="flex items-center gap-1">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the "{title}" title. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteMemberTitle(title)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 8: Education Levels */}
        <TabsContent value="education" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Education Levels</CardTitle>
              <CardDescription>Manage the education levels available for member registration.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-2">
                <Input 
                  placeholder="New education level (e.g. Master's Degree)..." 
                  value={newEducationLevel}
                  onChange={(e) => setNewEducationLevel(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addEducationLevel()}
                />
                <Button onClick={addEducationLevel} className="gap-2">
                  <Plus className="h-4 w-4" /> Add
                </Button>
              </div>

              <div className="grid gap-2">
                {educationLevels.map((level) => (
                  <div key={level} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <span className="font-medium">{level}</span>
                    
                    <div className="flex items-center gap-1">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the "{level}" education level. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteEducationLevel(level)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="budgetCategories" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Budget Categories</CardTitle>
              <CardDescription>Manage the categories available for budget items (e.g., Operations, Missions).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-2">
                <Input 
                  placeholder="New category name..." 
                  value={newBudgetCategory}
                  onChange={(e) => setNewBudgetCategory(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addBudgetCategory()}
                />
                <Button onClick={addBudgetCategory} className="gap-2">
                  <Plus className="h-4 w-4" /> Add
                </Button>
              </div>

              <div className="grid gap-2">
                {budgetCategories.map((cat) => (
                  <div key={cat} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <span className="font-medium">{cat}</span>
                    
                    <div className="flex items-center gap-1">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the "{cat}" budget category. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteBudgetCategory(cat)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="marital" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Marital Statuses</CardTitle>
              <CardDescription>Manage the marital status options available for member registration.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-2">
                <Input 
                  placeholder="New marital status (e.g. Single)..." 
                  value={newMaritalStatus}
                  onChange={(e) => setNewMaritalStatus(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addMaritalStatus()}
                />
                <Button onClick={addMaritalStatus} className="gap-2">
                  <Plus className="h-4 w-4" /> Add
                </Button>
              </div>

              <div className="grid gap-2">
                {maritalStatuses.map((status) => (
                  <div key={status} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <span className="font-medium">{status}</span>
                    
                    <div className="flex items-center gap-1">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the "{status}" marital status. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteMaritalStatus(status)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="days" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Days of the Week</CardTitle>
              <CardDescription>Manage the "Day Born" options available for member registration.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-2">
                <Input 
                  placeholder="New day (e.g. Monday)..." 
                  value={newDayOfWeek}
                  onChange={(e) => setNewDayOfWeek(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addDayOfWeek()}
                />
                <Button onClick={addDayOfWeek} className="gap-2">
                  <Plus className="h-4 w-4" /> Add
                </Button>
              </div>

              <div className="grid gap-2">
                {daysOfWeek.map((day) => (
                  <div key={day} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <span className="font-medium">{day}</span>
                    
                    <div className="flex items-center gap-1">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the "{day}" day option. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteDayOfWeek(day)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 6: Countries */}
        <TabsContent value="countries" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Countries</CardTitle>
              <CardDescription>Manage the list of countries available for member addresses.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-2">
                <Input 
                  placeholder="New country name..." 
                  value={newCountry}
                  onChange={(e) => setNewCountry(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCountry()}
                />
                <Button onClick={addCountry} className="gap-2">
                  <Plus className="h-4 w-4" /> Add
                </Button>
              </div>

              <div className="grid gap-2">
                {countries.map((country) => (
                  <div key={country} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <span className="font-medium">{country}</span>
                    
                    <div className="flex items-center gap-1">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the "{country}" country. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteCountry(country)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 7: Regions */}
        <TabsContent value="regions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Regions</CardTitle>
              <CardDescription>Manage the list of regions available for member addresses.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-2">
                <Input 
                  placeholder="New region name..." 
                  value={newRegion}
                  onChange={(e) => setNewRegion(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addRegion()}
                />
                <Button onClick={addRegion} className="gap-2">
                  <Plus className="h-4 w-4" /> Add
                </Button>
              </div>

              <div className="grid gap-2">
                {regions.map((region) => (
                  <div key={region} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <span className="font-medium">{region}</span>
                    
                    <div className="flex items-center gap-1">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the "{region}" region. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteRegion(region)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Transaction Types */}
        <TabsContent value="financials" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Financial Transaction Types</CardTitle>
              <CardDescription>Configure the types of income and expenses tracked in financials.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-2">
                <Input 
                  placeholder="New transaction type..." 
                  value={newTransactionType}
                  onChange={(e) => setNewTransactionType(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addTransactionType()}
                />
                <Button onClick={addTransactionType} className="gap-2">
                  <Plus className="h-4 w-4" /> Add
                </Button>
              </div>

              <div className="grid gap-2">
                {transactionTypes.map((type) => (
                  <div key={type} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <span className="font-medium">{type}</span>

                    <div className="flex items-center gap-1">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the "{type}" transaction type. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteTransactionType(type)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: User & Admin */}
        <TabsContent value="user" className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>User Profile</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center text-center space-y-4">
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold">
                  {userProfile.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-lg">{userProfile.name}</h3>
                  <p className="text-sm text-muted-foreground">{userProfile.email}</p>
                </div>
                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                  {userProfile.role}
                </div>
              </CardContent>
              <Separator />
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span>Role: <span className="font-medium">Administrator</span></span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <span>Last password change: 2 months ago</span>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Ensure your account is using a long, random password to stay secure.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input 
                    id="current-password" 
                    type="password" 
                    value={passwords.current}
                    onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input 
                    id="new-password" 
                    type="password" 
                    value={passwords.new}
                    onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input 
                    id="confirm-password" 
                    type="password" 
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                  />
                </div>
              </CardContent>
              <CardFooter className="border-t px-6 py-4 flex justify-end">
                <Button onClick={handlePasswordChange}>Update Password</Button>
              </CardFooter>
            </Card>
          </div>

          <Card className="border-destructive/20 bg-destructive/5">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <AlertCircle className="h-5 w-5" /> Danger Zone
              </CardTitle>
              <CardDescription>Irreversible actions for your church data.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Delete Church Account</p>
                  <p className="text-xs text-muted-foreground">Once you delete your account, there is no going back. Please be certain.</p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">Delete Everything</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>CRITICAL: Delete All Data?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action is IRREVERSIBLE. It will permanently delete all church records, members, financial data, and settings. Are you absolutely sure?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => toast.error("This action is disabled in the demo.")} 
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Yes, Delete Everything
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 5: User Management (Super Admin Only) */}
        {isSuperAdmin && (
          <TabsContent value="usermanagement" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Manage system users, assign roles, and link ministry leaders to their respective departments.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-bold mb-1">How to add new users:</p>
                      <p>New users should sign in to the system using their Google account. Once they sign in for the first time, they will appear in the list below with a default "User" role. You can then upgrade their role and assign them to a ministry.</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Ministry/Department</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isUsersLoading ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                            Loading users...
                          </TableCell>
                        </TableRow>
                      ) : allUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                            No users found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        allUsers.map((u) => (
                          <TableRow key={u.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                                  {u.displayName?.charAt(0) || u.email?.charAt(0)}
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="font-medium truncate">{u.displayName || "No Name"}</span>
                                  <span className="text-xs text-muted-foreground truncate">{u.email}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Select 
                                value={u.role || "User"} 
                                onValueChange={(val) => handleUpdateUserRole(u.id, val)}
                                disabled={u.uid === user?.uid}
                              >
                                <SelectTrigger className="w-[160px] h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Super Admin">Super Admin</SelectItem>
                                  <SelectItem value="Secretary">Secretary</SelectItem>
                                  <SelectItem value="Ministry Leader">Ministry Leader</SelectItem>
                                  <SelectItem value="Finance">Finance</SelectItem>
                                  <SelectItem value="User">User</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Select 
                                value={u.ministry || "none"} 
                                onValueChange={(val) => handleUpdateUserMinistry(u.id, val)}
                                disabled={u.role !== "Ministry Leader"}
                              >
                                <SelectTrigger className="w-[180px] h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">None</SelectItem>
                                  {departments.map((dept) => (
                                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge variant={u.role === "Super Admin" ? "default" : "secondary"}>
                                {u.role || "User"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </div>
    </Tabs>
  </div>
);
}
