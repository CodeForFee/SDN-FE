// validations/inventorySchema.ts
import * as Yup from "yup";

export const inventorySchema = Yup.object({
  variant: Yup.string().required("Vehicle variant is required"),
  color: Yup.string().nullable(),
  ownerType: Yup.string()
    .oneOf(["EVM", "Dealer"], "Owner Type must be EVM or Dealer")
    .required("Owner Type is required"),
  owner: Yup.string()
    .nullable()
    .when("ownerType", {
      is: (val: string) => val === "Dealer",
      then: (schema) => schema.required("Dealer is required"),
      otherwise: (schema) => schema.notRequired(),
    }),
  quantity: Yup.number()
    .typeError("Quantity must be a number")
    .min(0, "Quantity must be 0 or more")
    .required("Quantity is required"),
  location: Yup.string().max(100, "Location is too long").nullable(),
});
