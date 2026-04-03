import React, { useState, useEffect, useMemo } from "react";
import { useFirebase } from "../context/FirebaseContext";
import { db } from "../firebase";
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  Timestamp
} from "firebase/firestore";
import { BudgetItem, Budget, Currency } from "../types";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2, Wallet, PieChart, Calendar, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function Budgets() {
  const { isSuperAdmin, isFinance, canManageBudgets } = useFirebase();
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [budgetCategories, setBudgetCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form states
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  
  const [itemForm, setItemForm] = useState({
    name: "",
    category: "Operations",
    description: ""
  });
  
  const [budgetForm, setBudgetForm] = useState({
    itemId: "",
    amount: "",
    currency: "GHS" as Currency,
    year: new Date().getFullYear().toString(),
    month: "none", // "none" for yearly, or "1"-"12"
    notes: ""
  });

  useEffect(() => {
    if (!isSuperAdmin && !isFinance) return;

    const unsubscribeItems = onSnapshot(
      query(collection(db, "budgetItems"), orderBy("name")),
      (snapshot) => {
        const items = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as BudgetItem));
        setBudgetItems(items);
      }
    );

    const unsubscribeBudgets = onSnapshot(
      query(collection(db, "budgets"), orderBy("year", "desc")),
      (snapshot) => {
        const b = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Budget));
        setBudgets(b);
        setIsLoading(false);
      }
    );

    const unsubscribeSettings = onSnapshot(
      doc(db, "settings", "global"),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.budgetCategories) {
            setBudgetCategories(data.budgetCategories);
            // Update default category if needed
            if (itemForm.category === "Operations" && !data.budgetCategories.includes("Operations")) {
              setItemForm(prev => ({ ...prev, category: data.budgetCategories[0] || "" }));
            }
          }
        }
      }
    );

    return () => {
      unsubscribeItems();
      unsubscribeBudgets();
      unsubscribeSettings();
    };
  }, [isSuperAdmin, isFinance]);

  const handleSaveItem = async () => {
    if (!itemForm.name || !itemForm.category) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      if (editingItem) {
        await updateDoc(doc(db, "budgetItems", editingItem.id), {
          ...itemForm,
          updatedAt: new Date().toISOString()
        });
        toast.success("Budget item updated");
      } else {
        await addDoc(collection(db, "budgetItems"), {
          ...itemForm,
          createdAt: new Date().toISOString()
        });
        toast.success("Budget item created");
      }
      setIsItemModalOpen(false);
      setEditingItem(null);
      setItemForm({ name: "", category: "Operations", description: "" });
    } catch (error) {
      console.error("Error saving item:", error);
      toast.error("Failed to save budget item");
    }
  };

  const handleSaveBudget = async () => {
    if (!budgetForm.itemId || !budgetForm.amount || !budgetForm.year) {
      toast.error("Please fill in all required fields");
      return;
    }

    const selectedItem = budgetItems.find(i => i.id === budgetForm.itemId);
    if (!selectedItem) return;

    try {
      const budgetData = {
        itemId: budgetForm.itemId,
        itemName: selectedItem.name,
        category: selectedItem.category,
        amount: parseFloat(budgetForm.amount),
        currency: budgetForm.currency,
        year: parseInt(budgetForm.year),
        month: budgetForm.month === "none" ? null : parseInt(budgetForm.month),
        notes: budgetForm.notes,
        updatedAt: new Date().toISOString()
      };

      if (editingBudget) {
        await updateDoc(doc(db, "budgets", editingBudget.id), budgetData);
        toast.success("Budget allocation updated");
      } else {
        await addDoc(collection(db, "budgets"), {
          ...budgetData,
          createdAt: new Date().toISOString()
        });
        toast.success("Budget allocation created");
      }
      setIsBudgetModalOpen(false);
      setEditingBudget(null);
      setBudgetForm({
        itemId: "",
        amount: "",
        currency: "GHS",
        year: new Date().getFullYear().toString(),
        month: "none",
        notes: ""
      });
    } catch (error) {
      console.error("Error saving budget:", error);
      toast.error("Failed to save budget allocation");
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!window.confirm("Are you sure? This will not delete existing budget allocations for this item.")) return;
    try {
      await deleteDoc(doc(db, "budgetItems", id));
      toast.success("Budget item deleted");
    } catch (error) {
      toast.error("Failed to delete item");
    }
  };

  const handleDeleteBudget = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this budget allocation?")) return;
    try {
      await deleteDoc(doc(db, "budgets", id));
      toast.success("Budget allocation deleted");
    } catch (error) {
      toast.error("Failed to delete allocation");
    }
  };

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  if (!isSuperAdmin && !isFinance) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You do not have permission to view budget management.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Budget Management</h1>
          <p className="text-muted-foreground">Manage church budget items and allocations.</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isItemModalOpen} onOpenChange={setIsItemModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={() => {
                setEditingItem(null);
                setItemForm({ name: "", category: "Operations", description: "" });
              }}>
                <Plus className="mr-2 h-4 w-4" /> Setup Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingItem ? "Edit Budget Item" : "Setup New Budget Item"}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Item Name</Label>
                  <Input 
                    id="name" 
                    value={itemForm.name} 
                    onChange={(e) => setItemForm({...itemForm, name: e.target.value})}
                    placeholder="e.g. Electricity, Mission Support"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    value={itemForm.category} 
                    onValueChange={(v) => setItemForm({...itemForm, category: v})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {budgetCategories.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Input 
                    id="description" 
                    value={itemForm.description} 
                    onChange={(e) => setItemForm({...itemForm, description: e.target.value})}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleSaveItem}>Save Item</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isBudgetModalOpen} onOpenChange={setIsBudgetModalOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingBudget(null);
                setBudgetForm({
                  itemId: "",
                  amount: "",
                  currency: "GHS",
                  year: new Date().getFullYear().toString(),
                  month: "none",
                  notes: ""
                });
              }}>
                <Plus className="mr-2 h-4 w-4" /> New Allocation
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingBudget ? "Edit Allocation" : "New Budget Allocation"}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="item">Budget Item</Label>
                  <Select 
                    value={budgetForm.itemId} 
                    onValueChange={(v) => setBudgetForm({...budgetForm, itemId: v})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select item" />
                    </SelectTrigger>
                    <SelectContent>
                      {budgetItems.map(item => (
                        <SelectItem key={item.id} value={item.id}>{item.name} ({item.category})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="amount">Amount</Label>
                    <Input 
                      id="amount" 
                      type="number"
                      value={budgetForm.amount} 
                      onChange={(e) => setBudgetForm({...budgetForm, amount: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select 
                      value={budgetForm.currency} 
                      onValueChange={(v: Currency) => setBudgetForm({...budgetForm, currency: v})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GHS">GHS</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="year">Year</Label>
                    <Input 
                      id="year" 
                      type="number"
                      value={budgetForm.year} 
                      onChange={(e) => setBudgetForm({...budgetForm, year: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="month">Month (Optional)</Label>
                    <Select 
                      value={budgetForm.month} 
                      onValueChange={(v) => setBudgetForm({...budgetForm, month: v})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Yearly" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Yearly (All Year)</SelectItem>
                        {months.map((m, i) => (
                          <SelectItem key={m} value={(i + 1).toString()}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Input 
                    id="notes" 
                    value={budgetForm.notes} 
                    onChange={(e) => setBudgetForm({...budgetForm, notes: e.target.value})}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleSaveBudget}>Save Allocation</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="allocations" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="allocations">Allocations</TabsTrigger>
          <TabsTrigger value="items">Setup Items</TabsTrigger>
        </TabsList>

        <TabsContent value="allocations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Budget Allocations</CardTitle>
              <CardDescription>View and manage budget amounts per item and period.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {budgets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No budget allocations found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    budgets.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell className="font-medium">{b.itemName}</TableCell>
                        <TableCell>{b.category}</TableCell>
                        <TableCell>
                          {b.month ? `${months[b.month - 1]} ${b.year}` : `Year ${b.year}`}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {b.currency} {b.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => {
                              setEditingBudget(b);
                              setBudgetForm({
                                itemId: b.itemId,
                                amount: b.amount.toString(),
                                currency: b.currency,
                                year: b.year.toString(),
                                month: b.month ? b.month.toString() : "none",
                                notes: b.notes || ""
                              });
                              setIsBudgetModalOpen(true);
                            }}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteBudget(b.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="items" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Budget Setup Items</CardTitle>
              <CardDescription>Define the items that can be included in your budgets.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {budgetItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No budget items defined. Click "Setup Item" to start.
                      </TableCell>
                    </TableRow>
                  ) : (
                    budgetItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell className="max-w-xs truncate">{item.description || "-"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => {
                              setEditingItem(item);
                              setItemForm({
                                name: item.name,
                                category: item.category,
                                description: item.description || ""
                              });
                              setIsItemModalOpen(true);
                            }}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteItem(item.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
