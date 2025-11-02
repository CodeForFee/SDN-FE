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
  vehicleColorService,
  VehicleColor,
  CreateRequest,
  UpdateRequest,
} from "@/services/vehicleColorService";
import { Plus, Edit, Trash2, Check } from "lucide-react"; // Thêm Check icon
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Formik,
  Form,
  Field,
  ErrorMessage,
  FormikHelpers,
  useFormikContext,
} from "formik"; // Import useFormikContext
import { vehicleColorSchema } from "@/validations/vehicleColorSchema";
import { useAuthStore } from "@/stores/authStore";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils"; // Giả định bạn có util cho Tailwind class merge

// --- Dữ liệu giả lập cho Bảng Màu ---
interface PredefinedColor {
  name: string;
  code: string;
  hex: string;
}

const PREDEFINED_COLORS: PredefinedColor[] = [
  { name: "White Pearl", code: "WP", hex: "#F5F5F5" },
  { name: "Deep Ocean Blue", code: "DOB", hex: "#0077B6" },
  { name: "Sunset Red", code: "SR", hex: "#E5383B" },
  { name: "Mystic Grey", code: "MG", hex: "#778899" },
  { name: "Midnight Black", code: "MB", hex: "#000000" },
  { name: "Vibrant Yellow", code: "VY", hex: "#FFDD00" },
  { name: "Forest Green", code: "FG", hex: "#028A00" },
  { name: "Cosmic Silver", code: "CS", hex: "#C0C0C0" },
];
// ------------------------------------

// --- Component Chọn Màu Dạng Grid Selector ---
const ColorGridSelector = ({
  colorsList,
}: {
  colorsList: PredefinedColor[];
}) => {
  // Sử dụng context để truy cập Formik values và setFieldValue
  const { values, setFieldValue } = useFormikContext<CreateRequest>();

  const handleSelectColor = (color: PredefinedColor) => {
    setFieldValue("hex", color.hex);
    setFieldValue("name", color.name);
    setFieldValue("code", color.code);
  };

  return (
    <div className="space-y-2">
      <Label>Color Palette *</Label>
      <div className="grid grid-cols-5 gap-3 p-2 border rounded-2xl">
        {colorsList.map((color) => (
          <button
            key={color.hex}
            type="button"
            onClick={() => handleSelectColor(color)}
            className={cn(
              "w-full h-16 rounded-lg shadow-md transition-all duration-150 border-4",
              {
                "border-primary ring-2 ring-primary ring-offset-2":
                  values.hex === color.hex,
                "border-transparent hover:ring-2 hover:ring-gray-300":
                  values.hex !== color.hex,
              }
            )}
            style={{
              backgroundColor: color.hex,
              color: color.hex === "#000000" ? "#ffffff" : "#000000",
            }}
            title={`${color.name} (${color.code})`}
          >
            {values.hex === color.hex && (
              <Check className="h-5 w-5 mx-auto opacity-100" />
            )}
          </button>
        ))}
      </div>
      <div className="text-sm text-muted-foreground pt-1">
        Selected:{" "}
        <span className="font-semibold">
          {values.name} ({values.hex})
        </span>
      </div>
      <ErrorMessage
        name="hex"
        component="div"
        className="text-sm text-destructive"
      />
    </div>
  );
};
// ------------------------------------

export default function VehicleColorManagementPage() {
  const { user } = useAuthStore();
  const [colors, setColors] = useState<VehicleColor[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingColor, setEditingColor] = useState<VehicleColor | null>(null);

  const getInitialValues = (color?: VehicleColor): CreateRequest => ({
    name: color?.name || PREDEFINED_COLORS[0]?.name || "",
    code: color?.code || PREDEFINED_COLORS[0]?.code || "",
    hex: color?.hex || PREDEFINED_COLORS[0]?.hex || "#ffffff",
    extraPrice: color?.extraPrice || 0,
    active: color?.active ?? true,
  });

  useEffect(() => {
    fetchColors();
  }, []);

  const fetchColors = async () => {
    try {
      const data = await vehicleColorService.list();
      setColors(data);
    } catch (error) {
      console.error("Failed to fetch vehicle colors:", error);
      toast.error("Failed to load vehicle colors");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (color?: VehicleColor) => {
    setEditingColor(color || null);
    setOpen(true);
  };

  const handleDelete = async (colorId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this vehicle color? This action cannot be undone."
      )
    )
      return;
    try {
      await vehicleColorService.remove(colorId);
      toast.success("Vehicle color deleted successfully");
      fetchColors();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to delete vehicle color"
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
            <h1 className="text-3xl font-bold">Vehicle Color Management 🎨</h1>
            <p className="text-muted-foreground">
              Manage color options available for vehicle variants.
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Color
              </Button>
            </DialogTrigger>

            <DialogContent className="rounded-2xl max-w-2xl">
              <Formik
                initialValues={getInitialValues(editingColor || undefined)}
                validationSchema={vehicleColorSchema}
                enableReinitialize
                onSubmit={async (values, { setSubmitting }) => {
                  try {
                    if (editingColor) {
                      await vehicleColorService.update(
                        editingColor._id,
                        values as UpdateRequest
                      );
                      toast.success("Vehicle color updated successfully");
                    } else {
                      await vehicleColorService.create(values as CreateRequest);
                      toast.success("Vehicle color created successfully");
                    }
                    setOpen(false);
                    fetchColors();
                  } catch (error: any) {
                    toast.error(
                      error.response?.data?.message || "Operation failed"
                    );
                  } finally {
                    setSubmitting(false);
                  }
                }}
              >
                {({ isSubmitting, values }) => (
                  <Form>
                    <DialogHeader>
                      <DialogTitle>
                        {editingColor
                          ? "Edit Vehicle Color"
                          : "Create New Vehicle Color"}
                      </DialogTitle>
                      <DialogDescription>
                        {editingColor
                          ? `Update color: ${editingColor.name}`
                          : "Select a color from the palette and set the extra price."}
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                      {/* Bảng chọn màu trực quan */}
                      <ColorGridSelector colorsList={PREDEFINED_COLORS} />

                      {/* Hiển thị thông tin đã chọn (Disabled Inputs) */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Color Name</Label>
                          <Input
                            value={values.name}
                            disabled
                            className="bg-gray-100"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="code">Code</Label>
                          <Input
                            value={values.code}
                            disabled
                            className="bg-gray-100"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="hex">HEX Code</Label>
                          <Input
                            value={values.hex}
                            disabled
                            className="bg-gray-100"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="extraPrice">Extra Price</Label>
                          <Field
                            id="extraPrice"
                            name="extraPrice"
                            type="number"
                            placeholder="0"
                            className="w-full rounded-2xl border border-input px-3 py-2"
                            as={Input}
                          />
                          <ErrorMessage
                            name="extraPrice"
                            component="div"
                            className="text-sm text-destructive"
                          />
                        </div>
                      </div>

                      {/* Status */}
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
                      <Button
                        type="submit"
                        disabled={isSubmitting || !values.hex}
                      >
                        {editingColor ? "Update Color" : "Create Color"}
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
                  <TableHead>Color Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>HEX</TableHead>
                  <TableHead>Price Add-on</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {colors.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground py-8"
                    >
                      No vehicle colors found. Create your first color above.
                    </TableCell>
                  </TableRow>
                ) : (
                  colors.map((color, index) => (
                    <motion.tr
                      key={color._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-4 w-4 rounded-full border border-gray-300"
                            style={{ backgroundColor: color.hex || "#ffffff" }}
                          />
                          {color.name || "N/A"}
                        </div>
                      </TableCell>
                      <TableCell>{color.code || "N/A"}</TableCell>
                      <TableCell>{color.hex || "N/A"}</TableCell>
                      <TableCell>
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "USD",
                          minimumFractionDigits: 0,
                        }).format(color.extraPrice || 0)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            color.active !== false ? "default" : "secondary"
                          }
                        >
                          {color.active !== false ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(color)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>

                          {user?.role === "Admin" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(color._id)}
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
