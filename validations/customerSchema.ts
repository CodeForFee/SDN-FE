import * as Yup from 'yup';

export const createCustomerSchema = Yup.object({
  fullName: Yup.string()
    .required('Full name is required')
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be less than 100 characters')
    .trim(),
  
  phone: Yup.string()
    .nullable()
    .matches(
      /^[0-9+\-\s()]{8,15}$/,
      'Phone number must be 8-15 characters (can include +, -, spaces, parentheses)'
    ),
  
  email: Yup.string()
    .nullable()
    .email('Invalid email format')
    .max(100, 'Email must be less than 100 characters')
    .trim(),
  
  idNumber: Yup.string()
    .nullable()
    .max(20, 'ID number must be less than 20 characters')
    .trim(),
  
  address: Yup.string()
    .nullable()
    .max(500, 'Address must be less than 500 characters')
    .trim(),
  
  segment: Yup.string()
    .oneOf(['retail', 'fleet'], 'Customer segment must be retail or fleet')
    .default('retail')
    .nullable(),
  
  notes: Yup.string()
    .nullable()
    .max(1000, 'Notes must be less than 1000 characters')
    .trim(),
  
});


export const updateCustomerSchema = Yup.object({
  fullName: Yup.string()
    .nullable()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be less than 100 characters')
    .trim(),
  
  phone: Yup.string()
    .nullable()
    .matches(
      /^[0-9+\-\s()]{8,15}$/,
      'Phone number must be 8-15 characters'
    ),
  
  email: Yup.string()
    .nullable()
    .email('Invalid email format')
    .max(100, 'Email must be less than 100 characters')
    .trim(),
  
  idNumber: Yup.string()
    .nullable()
    .max(20, 'ID number must be less than 20 characters')
    .trim(),
  
  address: Yup.string()
    .nullable()
    .max(500, 'Address must be less than 500 characters')
    .trim(),
  
  segment: Yup.string()
    .nullable()
    .oneOf(['retail', 'fleet'], 'Customer segment must be retail or fleet'),
  
  notes: Yup.string()
    .nullable()
    .max(1000, 'Notes must be less than 1000 characters')
    .trim(),
  
});

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const customerIdSchema = Yup.object().shape({
  id: Yup.string()
    .matches(objectIdRegex, 'Invalid customer ID format')
    .required('Customer ID is required'),
});

export const customerSchema = createCustomerSchema;

export const customerFieldValidators = {
  fullName: Yup.string()
    .required('Full name is required')
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be less than 100 characters')
    .trim(),
  
  phone: Yup.string()
    .nullable()
    .matches(
      /^[0-9+\-\s()]{8,15}$/,
      'Phone number must be 8-15 characters'
    ),
  
  email: Yup.string()
    .nullable()
    .email('Invalid email format')
    .max(100, 'Email must be less than 100 characters')
    .trim(),
  
  idNumber: Yup.string()
    .nullable()
    .max(20, 'ID number must be less than 20 characters')
    .trim(),
  
  address: Yup.string()
    .nullable()
    .max(500, 'Address must be less than 500 characters')
    .trim(),
  
  segment: Yup.string()
    .oneOf(['retail', 'fleet'], 'Customer segment must be retail or fleet'),
  
  notes: Yup.string()
    .nullable()
    .max(1000, 'Notes must be less than 1000 characters')
    .trim(),
};
