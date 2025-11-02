// validations/vehicleModelSchema.ts
import * as Yup from "yup";

// NOTE: keep schema synchronous and simple here. For uniqueness checks
// (e.g., model name unique in DB) consider doing an async API call on submit
// or adding an async Yup.test that calls the service.
export const vehicleModelSchema = Yup.object().shape({
  name: Yup.string()
    .required("Model name is required")
    .min(2, "Model name must be at least 2 characters")
    .max(100, "Model name must be less than 100 characters")
    .matches(/^[\w\s\-().,:]+$/, "Model name contains invalid characters"),

  brand: Yup.string()
    .trim()
    .required("Brand is required")
    .max(50, "Brand must be less than 50 characters"),

  segment: Yup.string().max(50, "Segment must be less than 50 characters"),

  description: Yup.string().max(
    200,
    "Description must be less than 200 characters"
  ),

  // Formik sends the select value as string "true"/"false" — transform it
  // to actual boolean so Yup.boolean() works as expected.
  active: Yup.boolean().transform((value, originalValue) => {
    if (originalValue === "true") return true;
    if (originalValue === "false") return false;
    return value;
  }),
});
