"use client";

import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Textarea } from "@/components/ui/textarea";
import {
  vehicleModelService,
  VehicleModel,
} from "@/services/vehicleModelService";
import { Plus, Edit, Trash2, Car } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { vehicleModelSchema } from "@/validations/vehicleModelSchema";
import { useAuthStore } from "@/stores/authStore";

export default function VehicleModelManagementPage() {
  const { user } = useAuthStore(); // Lấy user hiện tại từ Zustand
  const [models, setModels] = useState<VehicleModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<VehicleModel | null>(null);
  const [formData, setFormData] = useState<Partial<VehicleModel>>({
    name: "",
    brand: "EVM",
    segment: "",
    description: "",
    active: true,
  });

  const getInitialValues = (model?: VehicleModel) => ({
    name: model?.name || "",
    brand: model?.brand || "EVM",
    segment: model?.segment || "",
    description: model?.description || "",
    active: model?.active ?? true,
  });

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    try {
      const data = await vehicleModelService.list();
      setModels(data);
    } catch (error) {
      console.error("Failed to fetch vehicle models:", error);
      toast.error("Failed to load vehicle models");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (model?: VehicleModel) => {
    if (model) {
      setEditingModel(model);
      setFormData({
        name: model.name || "",
        brand: model.brand || "EVM",
        segment: model.segment || "",
        description: model.description || "",
        active: model.active !== false,
      });
    } else {
      setEditingModel(null);
      setFormData({
        name: "",
        brand: "EVM",
        segment: "",
        description: "",
        active: true,
      });
    }
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingModel) {
        await vehicleModelService.update(editingModel._id, formData);
        toast.success("Vehicle model updated successfully");
      } else {
        await vehicleModelService.create(formData);
        toast.success("Vehicle model created successfully");
      }
      setOpen(false);
      fetchModels();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Operation failed");
    }
  };

  const handleDelete = async (modelId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this vehicle model? This action cannot be undone."
      )
    )
      return;
    try {
      await vehicleModelService.delete(modelId);
      toast.success("Vehicle model deleted successfully");
      fetchModels();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to delete vehicle model"
      );
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Vehicle Model Management</h1>
            <p className="text-muted-foreground">
              Manage vehicle models (create models before creating variants)
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Model
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl max-w-2xl">
              <Formik
                initialValues={getInitialValues(editingModel || undefined)}
                validationSchema={vehicleModelSchema}
                enableReinitialize
                onSubmit={async (values, { setSubmitting }) => {
                  try {
                    if (editingModel) {
                      await vehicleModelService.update(
                        editingModel._id,
                        values
                      );
                      toast.success("Vehicle model updated successfully");
                    } else {
                      await vehicleModelService.create(values);
                      toast.success("Vehicle model created successfully");
                    }
                    setOpen(false);
                    fetchModels();
                  } catch (error: any) {
                    toast.error(
                      error.response?.data?.message || "Operation failed"
                    );
                  } finally {
                    setSubmitting(false);
                  }
                }}
              >
                {({ isSubmitting, values, setFieldValue }) => (
                  <Form>
                    <DialogHeader>
                      <DialogTitle>
                        {editingModel
                          ? "Edit Vehicle Model"
                          : "Create New Vehicle Model"}
                      </DialogTitle>
                      <DialogDescription>
                        {editingModel
                          ? "Update vehicle model information"
                          : "Add a new vehicle model to the catalog"}
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Model Name *</Label>
                          <Field
                            id="name"
                            name="name"
                            placeholder="e.g. VF9, VF8, VF6"
                            className="w-full rounded-2xl border border-input px-3 py-2"
                          />
                          <ErrorMessage
                            name="name"
                            component="div"
                            className="text-sm text-destructive"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="brand">Brand *</Label>
                          <Field
                            id="brand"
                            name="brand"
                            placeholder="e.g. EVM, Tesla"
                            className="w-full rounded-2xl border border-input px-3 py-2"
                          />
                          <ErrorMessage
                            name="brand"
                            component="div"
                            className="text-sm text-destructive"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="segment">Segment</Label>
                        <Field
                          id="segment"
                          name="segment"
                          placeholder="e.g. SUV, Sedan, Hatchback"
                          className="w-full rounded-2xl border border-input px-3 py-2"
                        />
                        <ErrorMessage
                          name="segment"
                          component="div"
                          className="text-sm text-destructive"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Field
                          as="textarea"
                          id="description"
                          name="description"
                          placeholder="Enter vehicle model description..."
                          rows={3}
                          className="w-full rounded-2xl border border-input px-3 py-2"
                        />
                        <ErrorMessage
                          name="description"
                          component="div"
                          className="text-sm text-destructive"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="active">Status</Label>
                        <Field
                          as="select"
                          id="active"
                          name="active"
                          className="flex h-10 w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="true">Active</option>
                          <option value="false">Inactive</option>
                        </Field>
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
                      <Button type="submit" disabled={isSubmitting}>
                        {editingModel ? "Update" : "Create"}
                      </Button>
                    </DialogFooter>
                  </Form>
                )}
              </Formik>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="rounded-2xl shadow-md">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Model Name</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Segment</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {models.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground py-8"
                    >
                      No vehicle models found. Create your first model above.
                    </TableCell>
                  </TableRow>
                ) : (
                  models.map((model, index) => (
                    <motion.tr
                      key={model._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4 text-muted-foreground" />
                          {model.name || "N/A"}
                        </div>
                      </TableCell>
                      <TableCell>{model.brand || "EVM"}</TableCell>
                      <TableCell>{model.segment || "N/A"}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {model.description || "N/A"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            model.active !== false ? "default" : "secondary"
                          }
                        >
                          {model.active !== false ? "active" : "inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(model)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>

                          {/* Delete button - only Admin */}
                          {user?.role === "Admin" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(model._id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
