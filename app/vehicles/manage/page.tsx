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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Edit, Trash2, Car, Check, Palette } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Formik, Form, Field, ErrorMessage, useFormikContext } from "formik";
import { vehicleService, Vehicle } from "@/services/vehicleService";
import {
  vehicleModelService,
  VehicleModel,
} from "@/services/vehicleModelService";
import {
  vehicleColorService,
  VehicleColor,
} from "@/services/vehicleColorService";
import { vehicleSchema as vehicleSchemaImport } from "@/validations/vehicleSchema";
import { Input } from "@/components/ui/input";

const vehicleSchema = vehicleSchemaImport;

const cn = (...classes: string[]) => classes.filter(Boolean).join(" ");

interface VehicleFormValues {
  model: string;
  trim: string;
  colors: string[];
  battery: string;
  range: number;
  motorPower: number;
  msrp: number;
  features: string[];
  images: string[];
  active: boolean;
}

const ColorMultiSelector = ({ allColors }: { allColors: VehicleColor[] }) => {
  const { values, setFieldValue } = useFormikContext<VehicleFormValues>();
  const selectedColorIds = values.colors || [];

  const handleToggleColor = (colorId: string) => {
    let newColors;
    if (selectedColorIds.includes(colorId)) {
      newColors = selectedColorIds.filter((id) => id !== colorId);
    } else {
      newColors = [...selectedColorIds, colorId];
    }
    setFieldValue("colors", newColors);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-3 p-4 border rounded-2xl bg-gray-50 max-h-40 overflow-y-auto">
        {allColors
          .filter((c) => c.active !== false)
          .map((color) => {
            const isSelected = selectedColorIds.includes(color._id);
            const checkmarkColor =
              color.hex === "#000000" ||
              color.hex === "#028A00" ||
              color.hex === "#0077B6"
                ? "text-white"
                : "text-black";

            const conditionalClasses = isSelected
              ? "ring-4 ring-offset-2 ring-primary border-primary"
              : "border-gray-300 hover:ring-2 hover:ring-gray-400";

            return (
              <button
                key={color._id}
                type="button"
                onClick={() => handleToggleColor(color._id)}
                className={cn(
                  "w-10 h-10 rounded-full shadow-md transition-all duration-200 flex items-center justify-center border-2",
                  conditionalClasses
                )}
                style={{ backgroundColor: color.hex || "#ffffff" }}
                title={`${color.name} (${color.hex})`}
              >
                {isSelected && (
                  <Check className={cn("h-4 w-4", checkmarkColor)} />
                )}
              </button>
            );
          })}
      </div>
      <ErrorMessage
        name="colors"
        component="div"
        className="text-sm text-destructive"
      />
    </div>
  );
};

export default function VehicleManagementPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [models, setModels] = useState<VehicleModel[]>([]);
  const [colors, setColors] = useState<VehicleColor[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  const getInitialValues = (vehicle?: Vehicle): VehicleFormValues => ({
    model:
      typeof vehicle?.model === "string"
        ? vehicle.model
        : vehicle?.model?._id || "",
    trim: vehicle?.trim || "",
    colors: (vehicle?.colors || []).map((c) =>
      typeof c === "string" ? c : c._id
    ),
    battery: vehicle?.battery || "",
    range: vehicle?.range || 0,
    motorPower: vehicle?.motorPower || 0,
    msrp: vehicle?.msrp || 0,
    features: vehicle?.features || [],
    images: vehicle?.images || [],
    active: vehicle?.active ?? true,
  });

  useEffect(() => {
    fetchVehicles();
    fetchModels();
    fetchColors();
  }, []);

  const fetchColors = async () => {
    try {
      const data = await vehicleColorService.list();
      setColors(data);
    } catch (error) {
      console.error("Failed to fetch vehicle colors:", error);
      toast.error("Failed to load available colors");
    }
  };

  const fetchModels = async () => {
    try {
      const data = await vehicleModelService.list();
      setModels(data);
    } catch (error) {
      console.error("Failed to fetch vehicle models:", error);
      toast.error("Failed to load vehicle models");
    }
  };

  const fetchVehicles = async () => {
    try {
      const data = await vehicleService.getVehicles();
      setVehicles(data);
    } catch (error) {
      console.error("Failed to fetch vehicles:", error);
      toast.error("Failed to load vehicles");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (vehicle?: Vehicle) => {
    setEditingVehicle(vehicle || null);
    setOpen(true);
  };

  const handleDelete = async (vehicleId: string) => {
    if (!confirm("Are you sure you want to delete this vehicle?")) return;
    try {
      await vehicleService.deleteVehicle(vehicleId);
      toast.success("Vehicle deleted successfully");
      fetchVehicles();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete vehicle");
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
            <h1 className="text-3xl font-bold">Vehicle Management</h1>
            <p className="text-muted-foreground">Manage vehicle catalog</p>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Vehicle
              </Button>
            </DialogTrigger>

            <DialogContent className="rounded-2xl max-w-3xl max-h-[90vh] overflow-y-auto">
              <Formik
                initialValues={getInitialValues(editingVehicle || undefined)}
                validationSchema={vehicleSchema}
                enableReinitialize
                onSubmit={async (values, { setSubmitting }) => {
                  try {
                    // Sửa lỗi Type Assertion cho payload
                    const payload = values as unknown as Partial<Vehicle>;

                    if (editingVehicle) {
                      await vehicleService.updateVehicle(
                        editingVehicle._id,
                        payload
                      );
                      toast.success("Vehicle updated successfully");
                    } else {
                      await vehicleService.createVehicle(payload as Vehicle);
                      toast.success("Vehicle created successfully");
                    }

                    setOpen(false);
                    fetchVehicles();
                  } catch (error: any) {
                    toast.error(
                      error.response?.data?.message || "Operation failed"
                    );
                  } finally {
                    setSubmitting(false);
                  }
                }}
              >
                {({ values, setFieldValue, isSubmitting }) => (
                  <Form>
                    <DialogHeader>
                      <DialogTitle>
                        {editingVehicle ? "Edit Vehicle" : "Create New Vehicle"}
                      </DialogTitle>
                      <DialogDescription>
                        {editingVehicle
                          ? "Update vehicle information"
                          : "Add a new vehicle to the catalog"}
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="model">Vehicle Model *</Label>
                        <Select
                          value={values.model}
                          onValueChange={(val) => setFieldValue("model", val)}
                          required
                        >
                          <SelectTrigger id="model">
                            <SelectValue placeholder="Select a vehicle model" />
                          </SelectTrigger>
                          <SelectContent>
                            {models.length === 0 ? (
                              <SelectItem value="__no_models__" disabled>
                                No models available
                              </SelectItem>
                            ) : (
                              models
                                .filter((m) => m.active !== false)
                                .map((model) => (
                                  <SelectItem key={model._id} value={model._id}>
                                    {model.name}{" "}
                                    {model.brand ? `(${model.brand})` : ""}
                                  </SelectItem>
                                ))
                            )}
                          </SelectContent>
                        </Select>
                        <ErrorMessage
                          name="model"
                          component="div"
                          className="text-sm text-destructive"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="trim">Trim</Label>
                          <Field
                            id="trim"
                            name="trim"
                            placeholder="e.g. Standard, Premium"
                            className="w-full rounded-2xl border border-input px-3 py-2"
                          />
                          <ErrorMessage
                            name="trim"
                            component="div"
                            className="text-sm text-destructive"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="colors">Available Colors *</Label>
                          {colors.length > 0 ? (
                            <ColorMultiSelector allColors={colors} />
                          ) : (
                            <div className="text-sm text-muted-foreground pt-2">
                              No active colors found.
                            </div>
                          )}

                          <ErrorMessage
                            name="colors"
                            component="div"
                            className="text-sm text-destructive"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="battery">Battery</Label>
                          <Field
                            id="battery"
                            name="battery"
                            placeholder="e.g. 60kWh"
                            className="w-full rounded-2xl border border-input px-3 py-2"
                          />
                          <ErrorMessage
                            name="battery"
                            component="div"
                            className="text-sm text-destructive"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="range">Range (km)</Label>
                          <Field
                            id="range"
                            name="range"
                            type="number"
                            min={1}
                            step={1}
                            className="w-full rounded-2xl border border-input px-3 py-2"
                          />

                          <ErrorMessage
                            name="range"
                            component="div"
                            className="text-sm text-destructive"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="motorPower">Motor Power (kW)</Label>
                          <Field
                            id="motorPower"
                            name="motorPower"
                            type="number"
                            min={1}
                            step={1}
                            className="w-full rounded-2xl border border-input px-3 py-2"
                          />
                          <ErrorMessage
                            name="motorPower"
                            component="div"
                            className="text-sm text-destructive"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="msrp">MSRP (Price)</Label>

                          <Field
                            id="msrp"
                            name="msrp"
                            type="number"
                            min={1}
                            step={1}
                            className="w-full rounded-2xl border border-input px-3 py-2"
                          />
                          <ErrorMessage
                            name="msrp"
                            component="div"
                            className="text-sm text-destructive"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="features">
                          Features (comma separated)
                        </Label>
                        <Field
                          id="features"
                          name="features"
                          value={(values.features || []).join(", ")}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setFieldValue(
                              "features",
                              e.target.value
                                .split(",")
                                .map((f) => f.trim())
                                .filter((f) => f)
                            )
                          }
                          placeholder="e.g. GPS, Bluetooth, Auto Pilot"
                          className="w-full rounded-2xl border border-input px-3 py-2"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="images">
                          Images (comma separated URLs)
                        </Label>
                        <Field
                          id="images"
                          name="images"
                          value={(values.images || []).join(", ")}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setFieldValue(
                              "images",
                              e.target.value
                                .split(",")
                                .map((i) => i.trim())
                                .filter((i) => i)
                            )
                          }
                          placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                          className="w-full rounded-2xl border border-input px-3 py-2"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="active">Active</Label>
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
                        {editingVehicle ? "Update" : "Create"}
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
                  <TableHead>Model</TableHead>
                  <TableHead>Trim</TableHead>
                  <TableHead>Colors</TableHead>
                  <TableHead>Battery</TableHead>
                  <TableHead>MSRP</TableHead>
                  <TableHead>Range</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicles.map((vehicle, index) => (
                  <motion.tr
                    key={vehicle._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4 text-muted-foreground" />
                        {typeof vehicle.model === "string"
                          ? vehicle.model
                          : vehicle.model?.name || "N/A"}
                      </div>
                    </TableCell>
                    <TableCell>{vehicle.trim || "N/A"}</TableCell>

                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {vehicle.colors && vehicle.colors.length > 0 ? (
                          vehicle.colors.map((colorItem, colorIndex) => {
                            const color =
                              typeof colorItem === "string"
                                ? colors.find((c) => c._id === colorItem)
                                : colorItem;

                            if (color) {
                              return (
                                <div
                                  key={color._id || colorIndex}
                                  className="h-4 w-4 rounded-full border border-gray-300 shadow-sm"
                                  style={{
                                    backgroundColor: color.hex || "#ffffff",
                                  }}
                                  title={color.name || color.hex || "Color"}
                                />
                              );
                            }
                            return null;
                          })
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            N/A
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>{vehicle.battery || "N/A"}</TableCell>
                    <TableCell>
                      ${(vehicle.msrp || 0).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {vehicle.range ? `${vehicle.range} km` : "N/A"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          vehicle.active !== false ? "default" : "secondary"
                        }
                      >
                        {vehicle.active !== false ? "active" : "inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(vehicle)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(vehicle._id)}
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
