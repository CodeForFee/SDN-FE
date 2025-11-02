import * as Yup from 'yup';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const objectIdValidator = Yup.string()
  .matches(objectIdRegex, 'Invalid ID format')
  .required('ID is required');

const optionalObjectId = Yup.string()
  .nullable()
  .matches(objectIdRegex, 'Invalid ID format');

const testDriveResultSchema = Yup.object().shape({
  feedback: Yup.string()
    .nullable()
    .max(1000, 'Feedback must be less than 1000 characters')
    .trim(),
  
  interestRate: Yup.number()
    .nullable()
    .min(0, 'Interest rate must be at least 0')
    .max(100, 'Interest rate must be at most 100'),
});

export const createTestDriveSchema = Yup.object().shape({
  customer: objectIdValidator,
  
  variant: objectIdValidator,
  
  preferredTime: Yup.date()
    .required('Preferred time is required')
    .min(new Date(), 'Preferred time must be in the future'),
  
  dealer: optionalObjectId,
  
  status: Yup.string()
    .oneOf(
      ['requested', 'confirmed', 'done', 'cancelled'],
      'Status must be requested, confirmed, done, or cancelled'
    )
    .default('requested')
    .nullable(),
  
  assignedStaff: optionalObjectId,
  
  result: testDriveResultSchema.nullable(),
});

export const updateTestDriveSchema = Yup.object().shape({
  customer: optionalObjectId,
  
  variant: optionalObjectId,
  
  dealer: optionalObjectId,
  
  preferredTime: Yup.date()
    .nullable()
    .min(new Date(), 'Preferred time must be in the future'),
  
  status: Yup.string()
    .nullable()
    .oneOf(
      ['requested', 'confirmed', 'done', 'cancelled'],
      'Status must be requested, confirmed, done, or cancelled'
    ),
  
  assignedStaff: optionalObjectId,
  
  result: testDriveResultSchema.nullable(),
});

export const testDriveIdSchema = Yup.object().shape({
  id: objectIdValidator,
});

export const testDriveFieldValidators = {
  objectId: objectIdValidator,
  optionalObjectId: optionalObjectId,
  
  preferredTime: Yup.date()
    .required('Preferred time is required')
    .min(new Date(), 'Preferred time must be in the future'),
  
  status: Yup.string()
    .oneOf(
      ['requested', 'confirmed', 'done', 'cancelled'],
      'Invalid test drive status'
    ),
  
  feedback: Yup.string()
    .nullable()
    .max(1000, 'Feedback must be less than 1000 characters')
    .trim(),
  
  interestRate: Yup.number()
    .nullable()
    .min(0, 'Interest rate must be at least 0')
    .max(100, 'Interest rate must be at most 100'),
};
