/**
 * Mappings between Backend DB Module Names and Frontend Standard Permission Keys.
 * Key = Backend Module Name (from API/DB)
 * Value = Frontend Standard Key (used in VerticalMenu and usePermission checks)
 */
export const PERMISSION_ALIASES = {
  // Master
  'Master': 'Master',
  'Tax': 'Tax',
  'Company Origin': 'Company Origin',
  'Frequency_master': 'Service Frequency', // Confirmed from context
  'Service Frequency': 'Service Frequency',
  'Billing Frequency': 'Billing Frequency',
  'UOM': 'Unit Of Measurement', // Check if DB uses 'UOM' or full name
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
  'Employee': 'Employee List', // Screenshot shows 'Employee'
  'Employee_leave': 'Employee Leave', // Change to match VerticalMenu: 'Employee Leave'
  'Employee Leave Type': 'Employee Leave Type',
  'User Privilege': 'User Privilege',

  // Service / Pest
  'Service_types': 'Service Type (Pest)', // Change to match VerticalMenu: 'Service Type (Pest)'

  // Contracts
  'Customers': 'Customers',
  'Contracts': 'Contracts',
  'Contract Status': 'Contract Status',

  // Attendance
  'Scheduling': 'Attendance Schedule', // Screenshot shows 'Scheduling'
  'Attendance': 'Attendance',
  'Attendance Slots': 'Attendance Slots',
  'Payslip Summary': 'Payslip Summary',

  // Operations
  'Service Requests': 'Service Request', // Screenshot shows 'Service Requests' (plural)
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
  'RIC Report': 'RIC / Follow-up Report', // Likely DB name based on short alias pattern
  'RIC / Follow-up Report': 'RIC / Follow-up Report',
  'Productivity Summary': 'Productivity Summary',
  'SCDF Report': 'SCDF Report',
  'Sales Report': 'Sales Report',
  'Pest Trending': 'Pest Trending',

  // Audit
  'Customer Audit': 'Customer Audit',
  'Contracts Audit': 'Contracts Audit',

  // Map
  'Map': 'Map'
}
