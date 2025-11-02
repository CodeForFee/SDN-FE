// validations/promotionSchema.ts
import * as Yup from "yup";

export interface CreatePromotionRequest {
  name: string;
  scope: "global" | "byDealer" | "byVariant";
  dealers: string[];
  variants: string[];
  type: "cashback" | "accessory" | "finance";
  value: number;
  stackable: boolean;
  validFrom: string;
  validTo: string;
  status: "active" | "inactive";
}

export const promotionSchema = Yup.object<CreatePromotionRequest>().shape({
  name: Yup.string().required("Promotion name is required"),

  scope: Yup.mixed<"global" | "byDealer" | "byVariant">()
    .oneOf(["global", "byDealer", "byVariant"])
    .required("Scope is required"),

  dealers: Yup.array()
    .of(Yup.string())
    .when("scope", {
      is: "byDealer",
      then: (schema) =>
        schema.min(
          1,
          "At least one dealer must be selected for 'By Dealer' scope"
        ),
      otherwise: (schema) => schema.notRequired(),
    }),

  variants: Yup.array()
    .of(Yup.string())
    .when("scope", {
      is: "byVariant",
      then: (schema) =>
        schema.min(
          1,
          "At least one variant must be selected for 'By Variant' scope"
        ),
      otherwise: (schema) => schema.notRequired(),
    }),

  type: Yup.mixed<"cashback" | "accessory" | "finance">()
    .oneOf(["cashback", "accessory", "finance"])
    .required("Promotion type is required"),

  value: Yup.number()
    .typeError("Value must be a number")
    .min(0, "Value must be greater than or equal to 0")
    .required("Value is required"),

  stackable: Yup.boolean(),

  validFrom: Yup.string()
    .required("Valid From is required")
    .test(
      "is-valid-date",
      "Valid From must be a valid date format (YYYY-MM-DD)",
      (value) => {
        if (!value) return true;
        const date = new Date(value);
        return !isNaN(date.getTime()) && /^\d{4}-\d{2}-\d{2}$/.test(value);
      }
    ),

  validTo: Yup.string()
    .required("Valid To is required")
    .test(
      "is-valid-date",
      "Valid To must be a valid date format (YYYY-MM-DD)",
      (value) => {
        if (!value) return true;
        const date = new Date(value);
        return !isNaN(date.getTime()) && /^\d{4}-\d{2}-\d{2}$/.test(value);
      }
    )
    .test(
      "is-after-from",
      "Valid To must be on or after Valid From",
      function (validTo) {
        const { validFrom } = this.parent;
        if (!validTo || !validFrom) return true;

        const fromDate = new Date(validFrom);
        const toDate = new Date(validTo);

        return toDate.getTime() >= fromDate.getTime();
      }
    ),

  status: Yup.mixed<"active" | "inactive">()
    .oneOf(["active", "inactive"])
    .required("Status is required"),
});
