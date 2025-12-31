/**
 * Mappings between Backend DB Module Names and Frontend Standard Permission Keys.
 * Key = Backend Module Name (from API/DB)
 * Value = Frontend Standard Key (used in VerticalMenu and usePermission checks)
 */
export const PERMISSION_ALIASES = {
  // Dashboard
  'Dashboard': 'Dashboard',

  // Master
  'Master': 'Master',
  'Tax': 'Tax',
  'Taxes': 'Tax',
  'Company Origin': 'Company Origin',
  'Company_origin': 'Company Origin',
  'Frequency_master': 'Service Frequency',
  'Service Frequency': 'Service Frequency',
  'Billing Frequency': 'Billing Frequency',
  'UOM': 'Unit Of Measurement',
  'Unit Of Measurement': 'Unit Of Measurement',
  'Call Type': 'Call Type',
  'Chemicals': 'Chemicals',
  'Industry': 'Industry',
  'Holidays': 'Holidays',
  'Incident': 'Incident',
  'Todo Items': 'Todo Items',
  'Site Risk': 'Site Risk',
  'Equipments': 'Equipments',

  // Employee
  'Department': 'Department',
  'Designation': 'Designation',
  'Employee': 'Employee List',
  'Employee List': 'Employee List',
  'Employee_leave': 'Employee Leave',
  'Employee Leave': 'Employee Leave',
  'Employee Leaves': 'Employee Leave',
  'Employee Leave Type': 'Employee Leave Type',
  'User Privilege': 'User Privilege',
  'Employee/User Privilege': 'User Privilege',
  'Employee/Employee List': 'Employee List',
  'Employee/Department': 'Department',
  'Employee/Designation': 'Designation',
  'Employee/Employee Leave Type': 'Employee Leave Type',

  // Service / Pest
  'Service_types': 'Service Type (Pest)',
  'Service Type Pest': 'Service Type (Pest)',
  'Service Type (Pest)': 'Service Type (Pest)',

  // Contracts
  'Customers': 'Customers',
  'Contracts': 'Contracts',
  'Contract Status': 'Contract Status',
  'View Contract Status': 'View Contract Status',

  // Attendance
  'Scheduling': 'Attendance Schedule',
  'Attendance Schedule': 'Attendance Schedule',
  'Attendance': 'Attendance',
  'Attendance Slots': 'Attendance Slots',
  'Payslip Summary': 'Payslip Summary',

  // Operations
  'Service Requests': 'Service Request',
  'Service Request': 'Service Request',
  'Calendar': 'Calendar',
  'Invoice': 'Invoice',
  'Suppliers': 'Suppliers',

  // Stock
  'Material Request': 'Material Request',
  'Stock Report': 'Stock Report',
  'Usage Report': 'Usage Report',

  // Finder
  'Non Pre-Schedule': 'Non Pre-Schedule',
  'Backlog Finder': 'Backlog Finder',
  'Followup Finder': 'Followup Finder',
  'KIV Finder': 'KIV Finder',
  'Productivity Finder': 'Productivity Finder',

  // Reports
  'Service Summary Report': 'Service Summary Report',
  'RIC Report': 'RIC / Follow-up Report',
  'RIC Follow-up Report': 'RIC / Follow-up Report',
  'RIC / Follow-up Report': 'RIC / Follow-up Report',
  'Productivity Summary': 'Productivity Summary',
  'SCDF Report': 'SCDF Report',
  'Sales Report': 'Sales Report',
  'Pest Trending': 'Pest Trending',

  // Audit
  'Customer Audit': 'Customer Audit',
  'Contract Audit': 'Contracts Audit',
  'Contracts Audit': 'Contracts Audit',

  // Map
  'Map': 'Map'
}
