// validations/vehicleModelSchema.ts
import * as Yup from "yup";

export const vehicleModelSchema = Yup.object().shape({
  name: Yup.string().required("Model name is required"),
  brand: Yup.string().required("Brand is required"),
  segment: Yup.string().max(50, "Segment must be less than 50 characters"),
  description: Yup.string().max(
    200,
    "Description must be less than 200 characters"
  ),
  active: Yup.boolean(),
});
