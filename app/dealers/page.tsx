"use client";

import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  dealerService,
  Dealer,
  CreateDealerRequest,
  UpdateSaleTarget,
} from "@/services/dealerService";
import { Plus, Edit, Trash2, Building2, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function DealersPage() {
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [editingDealer, setEditingDealer] = useState<Dealer | null>(null);
  const [formData, setFormData] = useState<CreateDealerRequest>({
    name: "",
    code: "",
    region: "",
    address: "",
    contacts: [{ name: "", phone: "", email: "" }],
    creditLimit: 0,
    status: "active",
  });

  const [salesTargetDialogOpen, setSalesTargetDialogOpen] = useState(false);
  const [salesTargetDealer, setSalesTargetDealer] = useState<Dealer | null>(
    null
  );
  const [salesTargetInput, setSalesTargetInput] = useState<number>(0);

  useEffect(() => {
    fetchDealers();
  }, []);

  const fetchDealers = async () => {
    try {
      const data = await dealerService.getDealers();
      setDealers(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load dealers");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (dealer?: Dealer) => {
    if (dealer) {
      setEditingDealer(dealer);
      setFormData({
        name: dealer.name || "",
        code: dealer.code || "",
        region: dealer.region || "",
        address: dealer.address || "",
        contacts: dealer.contacts?.length
          ? [...dealer.contacts]
          : [{ name: "", phone: "", email: "" }],
        creditLimit: dealer.creditLimit || 0,
        status: dealer.status || "active",
      });
    } else {
      setEditingDealer(null);
      setFormData({
        name: "",
        code: "",
        region: "",
        address: "",
        contacts: [{ name: "", phone: "", email: "" }],
        creditLimit: 0,
        status: "active",
      });
    }
    setOpen(true);
  };

  const handleContactChange = (
    index: number,
    field: "name" | "phone" | "email",
    value: string
  ) => {
    const updatedContacts = [...(formData.contacts || [])];
    updatedContacts[index] = {
      ...updatedContacts[index],
      [field]: value,
    };
    setFormData({ ...formData, contacts: updatedContacts });
  };

  const handleAddContact = () => {
    setFormData({
      ...formData,
      contacts: [
        ...(formData.contacts || []),
        { name: "", phone: "", email: "" },
      ],
    });
  };

  const handleRemoveContact = (index: number) => {
    const updatedContacts = [...(formData.contacts || [])];
    updatedContacts.splice(index, 1);
    setFormData({ ...formData, contacts: updatedContacts });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: CreateDealerRequest = {
      name: formData.name || "",
      code: formData.code || "",
      region: formData.region || "",
      address: formData.address || "",
      contacts:
        formData.contacts
          ?.filter((c) => c.name || c.phone || c.email)
          .map((c) => ({
            name: c.name || "",
            phone: c.phone || "",
            email: c.email || "",
          })) || [],
      creditLimit: Number(formData.creditLimit) || 0,
      status: formData.status || "active",
    };

    try {
      if (editingDealer) {
        await dealerService.updateDealer(editingDealer._id, payload);
        toast.success("Dealer updated successfully");
      } else {
        await dealerService.createDealer(payload);
        toast.success("Dealer created successfully");
      }
      setOpen(false);
      fetchDealers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Operation failed");
    }
  };

  const handleOpenSalesTargetDialog = (dealer: Dealer) => {
    setSalesTargetDealer(dealer);
    setSalesTargetInput(dealer.salesTarget || 0);
    setSalesTargetDialogOpen(true);
  };

  const handleUpdateSalesTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!salesTargetDealer) return;

    const newTarget = Number(salesTargetInput);
    if (newTarget < 0) {
      toast.error("Sales Target must be zero or greater.");
      return;
    }

    const payload: UpdateSaleTarget = { salesTarget: newTarget };

    try {
      await dealerService.updateSalesTarget(salesTargetDealer._id, payload);
      toast.success(
        `Sales Target for ${salesTargetDealer.name} updated successfully`
      );
      setSalesTargetDialogOpen(false);
      fetchDealers();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to update Sales Target"
      );
    }
  };

  const handleDelete = async (dealerId: string) => {
    if (!window.confirm("Are you sure you want to delete this dealer?")) return;
    try {
      await dealerService.deleteDealer(dealerId);
      toast.success("Dealer deleted successfully");
      fetchDealers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete dealer");
    }
  };

  if (loading)
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-xl text-primary font-semibold">
            Loading Dealers...
          </p>
        </div>
      </MainLayout>
    );

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header + Add Dealer */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Building2 className="h-7 w-7 text-primary" /> Dealer Management
            </h1>
            <p className="text-muted-foreground">Manage dealerships</p>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" /> Add Dealer
              </Button>
            </DialogTrigger>

            {/* Dialog Content for Create/Edit Dealer */}
            <DialogContent className="rounded-2xl max-w-2xl">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>
                    {editingDealer ? "Edit Dealer" : "Create New Dealer"}
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Dealer Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="code">Code</Label>
                      <Input
                        id="code"
                        value={formData.code}
                        onChange={(e) =>
                          setFormData({ ...formData, code: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="region">Region</Label>
                      <Input
                        id="region"
                        value={formData.region}
                        onChange={(e) =>
                          setFormData({ ...formData, region: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="creditLimit">Credit Limit</Label>
                      <Input
                        id="creditLimit"
                        type="number"
                        value={formData.creditLimit || 0}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            creditLimit: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                  </div>

                  {/* Contacts */}
                  <div className="space-y-2 border p-3 rounded-lg">
                    <Label className="text-lg font-semibold block mb-2">
                      Contacts
                    </Label>
                    {formData.contacts?.map((c, i) => (
                      <div
                        key={i}
                        className="grid grid-cols-5 gap-2 mb-2 items-end"
                      >
                        <Input
                          placeholder="Name"
                          value={c.name}
                          onChange={(e) =>
                            handleContactChange(i, "name", e.target.value)
                          }
                        />
                        <Input
                          placeholder="Phone"
                          value={c.phone}
                          onChange={(e) =>
                            handleContactChange(i, "phone", e.target.value)
                          }
                        />
                        <Input
                          placeholder="Email"
                          type="email"
                          value={c.email}
                          onChange={(e) =>
                            handleContactChange(i, "email", e.target.value)
                          }
                        />
                        <div className="col-span-1">
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            onClick={() => handleRemoveContact(i)}
                            disabled={formData.contacts.length <= 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddContact}
                    >
                      <Plus className="mr-2 h-4 w-4" /> Add Contact
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Input
                      id="status"
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          status: e.target.value as "active" | "inactive",
                        })
                      }
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingDealer ? "Update" : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Dialog Cập nhật Sales Target */}
        <Dialog
          open={salesTargetDialogOpen}
          onOpenChange={setSalesTargetDialogOpen}
        >
          <DialogContent className="sm:max-w-[425px] rounded-2xl">
            <DialogHeader>
              <DialogTitle>Update Sales Target</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateSalesTarget}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="target">
                    Sales Target for {salesTargetDealer?.name}
                  </Label>
                  <Input
                    id="target"
                    type="number"
                    min="0"
                    value={salesTargetInput}
                    onChange={(e) =>
                      setSalesTargetInput(Number(e.target.value))
                    }
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Update Target</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dealers Table */}
        <Card className="rounded-2xl shadow-md">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Sales Target</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dealers.map((dealer, index) => (
                  <motion.tr
                    key={dealer._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <TableCell className="font-medium flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      {dealer.name}
                    </TableCell>
                    <TableCell>{dealer.code}</TableCell>
                    <TableCell>{dealer.address}</TableCell>
                    <TableCell>{dealer.region || "N/A"}</TableCell>
                    <TableCell>
                      <div className="text-sm space-y-1">
                        {dealer.contacts?.length ? (
                          dealer.contacts.map((c, idx) => (
                            <div key={idx}>
                              <div className="font-medium">
                                {c.name || "N/A"}
                              </div>
                              <div className="text-muted-foreground">
                                {c.phone || "N/A"}
                              </div>
                              {idx < dealer.contacts.length - 1 && (
                                <hr className="my-1 border-t border-gray-100" />
                              )}
                            </div>
                          ))
                        ) : (
                          <div>N/A</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-primary">
                      ${dealer.salesTarget?.toLocaleString() || "0"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          dealer.status === "active" ? "default" : "secondary"
                        }
                        className={
                          dealer.status === "inactive"
                            ? "bg-red-100 text-red-600 hover:bg-red-100"
                            : ""
                        }
                      >
                        {dealer.status || "active"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Update Sales Target"
                          onClick={() => handleOpenSalesTargetDialog(dealer)}
                        >
                          <TrendingUp className="h-4 w-4 text-orange-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Edit Dealer Details"
                          onClick={() => handleOpenDialog(dealer)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Delete Dealer"
                          onClick={() => handleDelete(dealer._id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
