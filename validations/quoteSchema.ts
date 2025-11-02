import * as Yup from "yup";

export const quoteItemSchema = Yup.object().shape({
  variant: Yup
    .string()
    .required('Vehicle variant is required')
    .matches(/^[0-9a-fA-F]{24}$/, 'Invalid variant ID format'),
  
  color: Yup
    .string()
    .nullable()
    .matches(/^[0-9a-fA-F]{24}$/, 'Invalid color ID format'),
  
  qty: Yup
    .number()
    .required('Quantity is required')
    .min(1, 'Quantity must be at least 1')
    .integer('Quantity must be an integer'),
  
  unitPrice: Yup
    .number()
    .required('Unit price is required')
    .min(0, 'Unit price must be non-negative'),
  
  promotionApplied: Yup
    .array()
    .of(
      Yup.string().matches(/^[0-9a-fA-F]{24}$/, 'Invalid promotion ID format')
    )
    .nullable()
    .default([]),
});

export const feesSchema = Yup.object().shape({
  registration: Yup
    .number()
    .min(0, 'Registration fee must be non-negative')
    .default(0),
  
  plate: Yup
    .number()
    .min(0, 'Plate fee must be non-negative')
    .default(0),
  
  delivery: Yup
    .number()
    .min(0, 'Delivery fee must be non-negative')
    .default(0),
});

export const createQuoteSchema = Yup.object().shape({
  customer: Yup
    .string()
    .required('Customer is required')
    .matches(/^[0-9a-fA-F]{24}$/, 'Invalid customer ID format'),
  
  items: Yup
    .array()
    .of(quoteItemSchema)
    .min(1, 'At least one item is required')
    .required('Items are required'),
  
  subtotal: Yup
    .number()
    .min(0, 'Subtotal must be non-negative')
    .nullable(),
  
  discount: Yup
    .number()
    .min(0, 'Discount must be non-negative')
    .nullable(),
  
  promotionTotal: Yup
    .number()
    .min(0, 'Promotion total must be non-negative')
    .nullable(),
  
  fees: feesSchema.nullable().default(null),
  
  total: Yup
    .number()
    .min(0, 'Total must be non-negative')
    .nullable(),
  
  validUntil: Yup
    .date()
    .nullable()
    .min(new Date(), 'Valid until date must be in the future'),
  
  status: Yup
    .string()
    .oneOf(['draft', 'sent', 'accepted', 'rejected'], 'Invalid status')
    .default('draft'),
  
  notes: Yup
    .string()
    .max(1000, 'Notes must be less than 1000 characters')
    .nullable(),
});

export const updateQuoteSchema = Yup.object().shape({
  quotedPrice: Yup
    .number()
    .min(0, 'Quoted price must be non-negative')
    .nullable(),
  
  validUntil: Yup
    .date()
    .nullable()
    .min(new Date(), 'Valid until date must be in the future'),
  
  status: Yup
    .string()
    .oneOf(['draft', 'sent', 'accepted', 'rejected'], 'Invalid status')
    .nullable(),
  
  notes: Yup
    .string()
    .max(1000, 'Notes must be less than 1000 characters')
    .nullable(),
  
});

export const quoteIdSchema = Yup.object().shape({
  id: Yup
    .string()
    .required('Quote ID is required')
    .matches(/^[0-9a-fA-F]{24}$/, 'Invalid quote ID format'),
});

export const convertQuoteSchema = Yup.object().shape({
 
});
