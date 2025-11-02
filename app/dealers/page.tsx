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
} from "@/services/dealerService";
import { Plus, Edit, Trash2, Building2 } from "lucide-react";
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

  const handleDelete = async (dealerId: string) => {
    if (!confirm("Are you sure you want to delete this dealer?")) return;
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
        <div className="flex items-center justify-center h-64">Loading...</div>
      </MainLayout>
    );

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header + Add Dealer */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dealer Management</h1>
            <p className="text-muted-foreground">Manage dealerships</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" /> Add Dealer
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl max-w-2xl">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>
                    {editingDealer ? "Edit Dealer" : "Create New Dealer"}
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
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

                  {/* Contacts - nhập tay */}
                  <div className="space-y-2">
                    <Label>Contacts</Label>
                    {formData.contacts?.map((c, i) => (
                      <div
                        key={i}
                        className="grid grid-cols-4 gap-2 mb-2 items-end"
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
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={() => handleRemoveContact(i)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                    <Button type="button" onClick={handleAddContact}>
                      Add Contact
                    </Button>
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
                      <Building2 className="h-4 w-4 text-muted-foreground" />{" "}
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
                              <div>{c.phone || "N/A"}</div>
                              <div className="text-muted-foreground">
                                {c.email || "N/A"}
                              </div>
                              <hr className="my-1 border-t border-gray-200" />
                            </div>
                          ))
                        ) : (
                          <div>N/A</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      ${dealer.salesTarget?.toLocaleString() || "0"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          dealer.status === "active" ? "default" : "secondary"
                        }
                      >
                        {dealer.status || "active"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(dealer)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
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
