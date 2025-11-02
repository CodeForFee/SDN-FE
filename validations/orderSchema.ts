import * as Yup from 'yup';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const objectIdValidator = Yup.string()
  .matches(objectIdRegex, 'Invalid ID format')
  .required('ID is required');

const optionalObjectId = Yup.string()
  .nullable()
  .matches(objectIdRegex, 'Invalid ID format');

export const orderItemSchema = Yup.object().shape({
  variant: objectIdValidator,
  
  color: optionalObjectId,
  
  qty: Yup.number()
    .required('Quantity is required')
    .min(1, 'Quantity must be at least 1')
    .integer('Quantity must be an integer'),
  
  unitPrice: Yup.number()
    .required('Unit price is required')
    .min(0, 'Unit price must be non-negative'),
  
  vins: Yup.array()
    .of(Yup.string().max(17, 'VIN must be max 17 characters'))
    .nullable()
    .default([]),
});

export const createOrderSchema = Yup.object().shape({
  customer: objectIdValidator,
  
  items: Yup.array()
    .of(orderItemSchema)
    .min(1, 'At least one item is required')
    .required('Items are required'),
  
  paymentMethod: Yup.string()
    .oneOf(['cash', 'finance'], 'Payment method must be cash or finance')
    .default('cash')
    .nullable(),
  
  deposit: Yup.number()
    .min(0, 'Deposit must be non-negative')
    .default(0)
    .nullable(),
});

export const updateOrderSchema = Yup.object().shape({
  status: Yup.string()
    .oneOf(
      ['new', 'confirmed', 'allocated', 'invoiced', 'delivered', 'cancelled'],
      'Invalid order status'
    )
    .nullable(),
  
  paymentMethod: Yup.string()
    .oneOf(['cash', 'finance'], 'Payment method must be cash or finance')
    .nullable(),
  
  expectedDelivery: Yup.date()
    .nullable()
    .min(new Date(), 'Expected delivery must be in the future'),
  
});


export const convertOrderToQuoteSchema = Yup.object().shape({
  orderId: objectIdValidator,
});


export const orderIdSchema = Yup.object().shape({
  id: objectIdValidator,
});


export const orderFieldValidators = {
  objectId: objectIdValidator,
  optionalObjectId: optionalObjectId,
  
  quantity: Yup.number()
    .required('Quantity is required')
    .min(1, 'Quantity must be at least 1')
    .integer('Quantity must be an integer'),
  
  price: Yup.number()
    .required('Price is required')
    .min(0, 'Price must be non-negative'),
  
  paymentMethod: Yup.string()
    .oneOf(['cash', 'finance'], 'Invalid payment method'),
  
  orderStatus: Yup.string()
    .oneOf(
      ['new', 'confirmed', 'allocated', 'invoiced', 'delivered', 'cancelled'],
      'Invalid order status'
    ),
  
  vin: Yup.string()
    .length(17, 'VIN must be exactly 17 characters')
    .matches(/^[A-HJ-NPR-Z0-9]{17}$/, 'Invalid VIN format'),
};
