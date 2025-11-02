"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/authStore";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { authService, RegisterRequest } from "@/services/authService";
import { userService } from "@/services/userService";
import { dealerService, Dealer } from "@/services/dealerService";
import { Plus } from "lucide-react";

export default function StaffPage() {
  const { user } = useAuthStore();

  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [dealers, setDealers] = useState<Dealer[]>([]);

  const currentDealerId =
    user?.role === "DealerManager"
      ? typeof user.dealer === "string"
        ? user.dealer
        : user.dealer?._id
      : undefined;

  const [formData, setFormData] = useState<RegisterRequest>({
    email: "",
    password: "",
    role: "DealerStaff",
    profile: { name: "", phone: "" },
    dealer: currentDealerId,
  });

  useEffect(() => {
    fetchStaff();
    fetchDealers();
  }, []);

  const fetchStaff = async () => {
    try {
      const data = await userService.getDealerStaff();
      setStaff(data);
    } catch (error: any) {
      
      if (error?.response?.status === 403) {
        toast.error('You do not have permission to view staff');
      } else {
        toast.error(error?.response?.data?.message || 'Failed to load staff');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchDealers = async () => {
    try {
      const data = await dealerService.getDealers();
      setDealers(data);
    } catch (error) {
      console.error("Failed to fetch dealers:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Nếu là DealerManager thì chỉ tạo DealerStaff của dealer mình
    if (user?.role === "DealerManager") {
      formData.role = "DealerStaff";
      formData.dealer = currentDealerId;
    }

    if (!formData.dealer) {
      toast.error("Please select a dealer");
      return;
    }

    try {
      await authService.register(formData);
      toast.success("Staff member created successfully");
      setOpen(false);
      setFormData({
        email: "",
        password: "",
        role: "DealerStaff",
        profile: { name: "", phone: "" },
        dealer: currentDealerId,
      });
      fetchStaff();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Operation failed");
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">Loading...</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header + Add Staff */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Staff Management</h1>
            <p className="text-muted-foreground">
              Manage your dealership staff
            </p>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Add Staff
              </Button>
            </DialogTrigger>

            <DialogContent className="rounded-2xl max-w-lg">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Create New Staff Member</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input
                      type="password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      value={formData.profile?.name || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          profile: {
                            ...formData.profile,
                            name: e.target.value,
                          },
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          role: value as RegisterRequest["role"],
                        })
                      }
                      disabled={user?.role === "DealerManager"} // DealerManager không thể chọn role khác
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DealerStaff">DealerStaff</SelectItem>
                        {user?.role !== "DealerManager" && (
                          <>
                            <SelectItem value="DealerManager">
                              DealerManager
                            </SelectItem>
                            <SelectItem value="EVMStaff">EVMStaff</SelectItem>
                            <SelectItem value="Admin">Admin</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {user?.role !== "DealerManager" ? (
                    <div className="space-y-2">
                      <Label>Dealer</Label>
                      <Select
                        value={formData.dealer || ""}
                        onValueChange={(value) =>
                          setFormData({ ...formData, dealer: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select dealer" />
                        </SelectTrigger>
                        <SelectContent>
                          {dealers.map((d) => (
                            <SelectItem key={d._id} value={d._id}>
                              {d.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label>Dealer</Label>
                      <Input
                        value={
                          dealers.find((d) => d._id === currentDealerId)
                            ?.name || ""
                        }
                        disabled
                      />
                    </div>
                  )}
                </div>

                <DialogFooter className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Create</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Staff Table */}
        <Card className="rounded-2xl shadow-md">
          <CardContent className="p-0">
            {staff.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <p>No staff members found.</p>
                <p className="text-sm mt-2">Click "Add Staff" to create a new staff member.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Dealer</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staff.map((member, index) => (
                    <motion.tr
                      key={member._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <TableCell>{member.email}</TableCell>
                      <TableCell>{member.profile?.name || "N/A"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{member.role}</Badge>
                      </TableCell>
                      <TableCell>{member.dealer?.name || "N/A"}</TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
