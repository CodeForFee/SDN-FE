// validations/vehicleSchema.ts
import * as Yup from "yup";

export const vehicleSchema = Yup.object().shape({
  model: Yup.string().required("Vehicle model is required"),
  trim: Yup.string().required("Trim is required"),

  // Thêm trường colors
  colors: Yup.array()
    .of(Yup.string().required("Color ID is required"))
    .min(1, "At least one color must be selected")
    .required("Available colors selection is required"),

  battery: Yup.string().max(50, "Battery info must be less than 50 characters"),

  range: Yup.number()
    .typeError("Range must be a number")
    .min(1, "Range must be greater than 0")
    .required("Range is required"),

  motorPower: Yup.number()
    .typeError("Motor Power must be a number")
    .min(1, "Motor Power must be greater than 0")
    .required("Motor Power is required"),

  msrp: Yup.number()
    .typeError("MSRP must be a number")
    .min(1, "MSRP must be greater than 0")
    .required("MSRP is required"),

  features: Yup.array().of(Yup.string()),

  images: Yup.array().of(Yup.string().url("Must be a valid URL")),

  active: Yup.boolean(),
});
