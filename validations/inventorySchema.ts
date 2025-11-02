import * as Yup from "yup";

export const inventorySchema = Yup.object().shape({
  variant: Yup.string()
    .required("Vehicle variant is required"),
  
  color: Yup.string()
    .required("Vehicle color is required"),
  
  qty: Yup.number()
    .min(1, "Quantity must be at least 1")
    .max(1000, "Quantity cannot exceed 1000")
    .required("Quantity is required"),
  
  dealer: Yup.string()
    .required("Dealer is required"),
  
  vin: Yup.string()
    .length(17, "VIN must be exactly 17 characters")
    .matches(/^[A-HJ-NPR-Z0-9]{17}$/, "Invalid VIN format"),
  
  status: Yup.string()
    .oneOf(['available', 'reserved', 'sold', 'in-transit'], 'Invalid status')
    .default('available'),
  
  location: Yup.string()
    .max(200, "Location must be less than 200 characters"),
  
  notes: Yup.string()
    .max(500, "Notes must be less than 500 characters"),
});
