// src/validations/vehicleColorSchema.ts
import * as Yup from 'yup';

export const vehicleColorSchema = Yup.object().shape({
  name: Yup.string()
    .trim()
    .min(2, 'Color name must be at least 2 characters')
    .max(50, 'Color name cannot exceed 50 characters')
    .required('Color name is required'),

  code: Yup.string()
    .trim()
    .max(10, 'Code cannot exceed 10 characters')
    .required('Code is required'),

  hex: Yup.string()
    .trim()
    .matches(/^#([0-9A-F]{3}){1,2}$/i, 'Invalid HEX color code (must be like #RRGGBB)')
    .required('HEX code is required'),

  extraPrice: Yup.number()
    .min(0, 'Extra price cannot be negative')
    .nullable()
    .typeError('Extra price must be a number')
    .required('Extra price is required'),
    
  active: Yup.mixed<boolean | string>()
    .required('Active status is required'),
});

export type VehicleColorFormData = Yup.InferType<typeof vehicleColorSchema>;