import * as Yup from "yup";

export const staffSchema = Yup.object().shape({
  email: Yup.string()
    .email("Invalid email format")
    .required("Email is required"),
  
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
  
  profile: Yup.object().shape({
    name: Yup.string()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must be less than 100 characters")
      .required("Name is required"),
  }),
  
  role: Yup.string()
    .oneOf(['DealerStaff', 'DealerManager', 'EVMStaff', 'Admin'], 'Invalid role')
    .required("Role is required"),
  
  dealer: Yup.string()
    .when('role', {
      is: (val: string) => ['DealerStaff', 'DealerManager'].includes(val),
      then: (schema: Yup.StringSchema) => schema.required("Dealer is required for dealer roles"),
      otherwise: (schema: Yup.StringSchema) => schema.notRequired(),
    }),
});
