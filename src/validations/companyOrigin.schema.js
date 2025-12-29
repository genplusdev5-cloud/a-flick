import { z } from 'zod'
import { requiredString } from './common'

export const companyOriginSchema = z.object({
  companyCode: requiredString('Company Code'),
  companyName: requiredString('Company Name'),
  phone: requiredString('Phone')
    .min(8, 'Phone must be at least 8 characters')
    .refine(val => /^[0-9\s+]+$/.test(val), 'Phone must contain only numbers'),
  
  email: requiredString('Email')
    .email('Invalid email address'),
  
  // Tax Number is optional in some contexts but let's check current logic. 
  // Current logic: formData.taxNumber || '' in payload. Not strictly required in handleSave?
  // handleSave checks: code, name, email, phone. Tax Number not checked.
  taxNumber: z.string().optional(),

  addressLine1: z.string().optional(), // Not checked in handleSave
  addressLine2: z.string().optional(),
  city: z.string().optional(),

  // GL Accounts - Required in handleSave? 
  // handleSave didn't explicitly check them in the 'if' block shown, 
  // BUT the JSX had 'required' prop on them. 
  // Let's make them required to be safe and better UX.
  glContractAccount: requiredString('GL Contract Account'),
  glJobAccount: requiredString('GL Job Account'),
  glContJobAccount: requiredString('GL Cont Job Account'),
  glWarrantyAccount: requiredString('GL Warranty Account'),

  uenNumber: requiredString('UEN Number'),
  gstNumber: requiredString('GST Reg. Number'),
  invoicePrefixCode: requiredString('Invoice Prefix'),
  
  invoiceStartNumber: requiredString('Invoice Start No.')
    .refine(val => !isNaN(val) && Number(val) > 0, 'Must be a positive number'),

  contractPrefixCode: requiredString('Contract Prefix'),
  
  bankName: requiredString('Bank Name'),
  bankAccountNumber: requiredString('Bank Account Number'),
  bankCode: requiredString('Bank Code'),
  swiftCode: requiredString('Swift Code'),

  accountingDate: z.date().nullable().optional(), // Date picker usually returns Date object or null

  status: z.number().optional() // 1 or 0
})
