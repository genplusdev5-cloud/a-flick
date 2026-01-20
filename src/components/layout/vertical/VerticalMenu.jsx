'use client'

import { useParams } from 'next/navigation'
import { useTheme } from '@mui/material/styles'
import PerfectScrollbar from 'react-perfect-scrollbar'

import { Menu, SubMenu, MenuItem } from '@menu/vertical-menu'
import useVerticalNav from '@menu/hooks/useVerticalNav'
import StyledVerticalNavExpandIcon from '@menu/styles/vertical/StyledVerticalNavExpandIcon'
import menuItemStyles from '@core/styles/vertical/menuItemStyles'
import menuSectionStyles from '@core/styles/vertical/menuSectionStyles'
import { usePermission } from '@/hooks/usePermission'

import { PermissionItem, PermissionSubMenu, PermissionGroup } from '@/components/auth/MenuPermissions'

// ───────────────────────────────────────────
// Module Groups for Sidebar Visibility
// ───────────────────────────────────────────
const MASTER_MODULES = [
  'Tax',
  'Company Origin',
  'Service Frequency',
  'Billing Frequency',
  'Unit Of Measurement',
  'Call Type',
  'Chemicals',
  'Industry',
  'Holidays',
  'Incident',
  'Todo Items',
  'Site Risk',
  'Equipments'
]

const EMPLOYEE_MODULES = ['Department', 'Designation', 'Employee List', 'Employee Leave Type', 'User Privilege']

const ATTENDANCE_MODULES = [
  'Attendance Slots',
  'Attendance',
  'Attendance Schedule',
  'Attendance Timesheet',
  'Payslip Summary'
]

const STOCK_MODULES = ['Suppliers', 'Stock Report', 'Usage Report', 'Stock Summary', 'Material Usage']

const FINDER_MODULES = ['Non Pre-Schedule', 'Backlog Finder', 'Followup Finder', 'KIV Finder', 'Productivity Finder']

const REPORT_MODULES = [
  'Service Summary Report',
  'RIC / Follow-up Report',
  'Productivity Summary',
  'SCDF Report',
  'Sales Report',
  'Pest Trending'
]

const PURCHASE_MODULES = ['Purchase Order', 'Purchase Inward', 'Purchase Return']

const TRANSFER_MODULES = [
  'Transfer Request',
  'Material Request',
  'Material Request Received',
  'Material Request Issued'
]

const AUDIT_MODULES = ['Customer Audit', 'Contracts Audit']

const SALES_MODULES = ['Proposal Item', 'Sales Quotation']

const RenderExpandIcon = ({ open, transitionDuration }) => (
  <StyledVerticalNavExpandIcon open={open} transitionDuration={transitionDuration}>
    <i className='tabler-chevron-right' />
  </StyledVerticalNavExpandIcon>
)

// ✅ Custom Pest Icon
const PestIcon = (
  <svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24'>
    <path
      fill='none'
      stroke='currentColor'
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth='2'
      d='M7 10h3V7L6.5 3.5a6 6 0 0 1 8 8l6 6a2 2 0 0 1-3 3l-6-6a6 6 0 0 1-8-8z'
    />
  </svg>
)

const VerticalMenu = ({ scrollMenu }) => {
  const theme = useTheme()
  const verticalNavOptions = useVerticalNav()
  const params = useParams()

  const { isBreakpointReached, transitionDuration, isCollapsed, isHovered } = verticalNavOptions
  const { lang: locale } = params
  const ScrollWrapper = isBreakpointReached ? 'div' : PerfectScrollbar

  // ✅ Safe section header
  const SectionHeader = ({ label }) => (
    <MenuItem
      disabled
      className='uppercase tracking-wider'
      style={{
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.05em',
        opacity: 0.7,
        cursor: 'default'
      }}
    >
      {label}
    </MenuItem>
  )

  const showHeadings = !isCollapsed || isHovered

  return (
    <ScrollWrapper
      {...(isBreakpointReached
        ? {
            className: 'bs-full overflow-y-auto overflow-x-hidden'
            // onScroll: container => scrollMenu(container, false)
          }
        : {
            options: { wheelPropagation: false, suppressScrollX: true }
            // onScrollY: container => scrollMenu(container, true)
          })}
    >
      <Menu
        popoutMenuOffset={{ mainAxis: 23 }}
        menuItemStyles={menuItemStyles(verticalNavOptions, theme)}
        renderExpandIcon={({ open }) => <RenderExpandIcon open={open} transitionDuration={transitionDuration} />}
        renderExpandedMenuItemIcon={{ icon: <i className='tabler-circle text-xs' /> }}
        menuSectionStyles={menuSectionStyles(verticalNavOptions, theme)}
      >
        {/* ✅ Dashboard */}
        <PermissionItem module='Dashboard'>
          <MenuItem href={`/${locale}/admin/dashboards`} icon={<i className='tabler-home' />}>
            Dashboard
          </MenuItem>
        </PermissionItem>

        {/* ✅ Master */}
        <PermissionSubMenu label='Master' icon={<i className='tabler-database' />} modules={MASTER_MODULES}>
          <PermissionItem module='Tax'>
            <MenuItem href={`/${locale}/admin/tax`}>Tax</MenuItem>
          </PermissionItem>
          <PermissionItem module='Company Origin'>
            <MenuItem href={`/${locale}/admin/company-origin`}>Company Origin</MenuItem>
          </PermissionItem>
          <PermissionItem module='Service Frequency'>
            <MenuItem href={`/${locale}/admin/service-frequency`}>Service Frequency</MenuItem>
          </PermissionItem>
          <PermissionItem module='Billing Frequency'>
            <MenuItem href={`/${locale}/admin/billing-frequency`}>Billing Frequency</MenuItem>
          </PermissionItem>
          <PermissionItem module='Unit Of Measurement'>
            <MenuItem href={`/${locale}/admin/uom`}>Unit Of Measurement</MenuItem>
          </PermissionItem>
          <PermissionItem module='Call Type'>
            <MenuItem href={`/${locale}/admin/call-type`}>Call Type</MenuItem>
          </PermissionItem>
          <PermissionItem module='Chemicals'>
            <MenuItem href={`/${locale}/admin/chemicals`}>Chemicals</MenuItem>
          </PermissionItem>
          <PermissionItem module='Industry'>
            <MenuItem href={`/${locale}/admin/industry`}>Industry</MenuItem>
          </PermissionItem>
          <PermissionItem module='Holidays'>
            <MenuItem href={`/${locale}/admin/holidays`}>Holidays</MenuItem>
          </PermissionItem>
          <PermissionItem module='Incident'>
            <MenuItem href={`/${locale}/admin/incident`}>Incident</MenuItem>
          </PermissionItem>
          <PermissionItem module='Todo Items'>
            <MenuItem href={`/${locale}/admin/todo-items`}>Todo Items</MenuItem>
          </PermissionItem>
          <PermissionItem module='Site Risk'>
            <MenuItem href={`/${locale}/admin/site-risk`}>Site Risk</MenuItem>
          </PermissionItem>
          <PermissionItem module='Equipments'>
            <MenuItem href={`/${locale}/admin/equipments`}>Equipments</MenuItem>
          </PermissionItem>
        </PermissionSubMenu>

        {/* ✅ Employee */}
        <PermissionSubMenu label='Employee' icon={<i className='tabler-user' />} modules={EMPLOYEE_MODULES}>
          <PermissionItem module='Department'>
            <MenuItem href={`/${locale}/admin/department`}>Department</MenuItem>
          </PermissionItem>
          <PermissionItem module='Designation'>
            <MenuItem href={`/${locale}/admin/designation`}>Designation</MenuItem>
          </PermissionItem>
          <PermissionItem module='Employee List'>
            <MenuItem href={`/${locale}/admin/employee-list`}>Employee List</MenuItem>
          </PermissionItem>
          <PermissionItem module='Employee Leave Type'>
            <MenuItem href={`/${locale}/admin/employee-leave-type`}>Employee Leave Type</MenuItem>
          </PermissionItem>
          <PermissionItem module='User Privilege'>
            <MenuItem href={`/${locale}/admin/user-privilege`}>User Privilege</MenuItem>
          </PermissionItem>
        </PermissionSubMenu>

        {/* Single Items need direct PermissionItem wrapper */}
        <PermissionItem module='Employee Leave'>
          <MenuItem href={`/${locale}/admin/employee-leave`} icon={<i className='tabler-calendar-time' />}>
            Employee Leaves
          </MenuItem>
        </PermissionItem>

        <PermissionItem module='Service Type (Pest)'>
          <MenuItem href={`/${locale}/admin/pests`} icon={PestIcon}>
            Service Type (Pest)
          </MenuItem>
        </PermissionItem>

        <PermissionItem module='Customers'>
          <MenuItem href={`/${locale}/admin/customers`} icon={<i className='tabler-users' />}>
            Customers
          </MenuItem>
        </PermissionItem>

        <PermissionItem module='Contracts'>
          <MenuItem href={`/${locale}/admin/contracts`} icon={<i className='tabler-file-text' />}>
            Contracts
          </MenuItem>
        </PermissionItem>

        <PermissionItem module='Service Request'>
          <MenuItem href={`/${locale}/admin/service-request`} icon={<i className='tabler-calendar' />}>
            Service Request
          </MenuItem>
        </PermissionItem>

        <PermissionItem module='Calendar'>
          <MenuItem href={`/${locale}/admin/calendar`} icon={<i className='tabler-calendar' />}>
            Calendar
          </MenuItem>
        </PermissionItem>

        <PermissionItem module='Invoice'>
          <MenuItem href={`/${locale}/admin/invoice`} icon={<i className='tabler-receipt-2' />}>
            Invoice
          </MenuItem>
        </PermissionItem>

        {/* ==================== SALES ==================== */}
        <PermissionSubMenu label='Sales' icon={<i className='tabler-briefcase' />} modules={SALES_MODULES}>
          <PermissionItem module='Proposal Item'>
            <MenuItem href={`/${locale}/admin/proposal-item`}>Proposal Item</MenuItem>
          </PermissionItem>

          <PermissionItem module='Sales Quotation'>
            <MenuItem href={`/${locale}/admin/sales-quotation`}>Sales Quotation</MenuItem>
          </PermissionItem>
        </PermissionSubMenu>

        {/* ==================== PURCHASE ==================== */}
        <PermissionSubMenu label='Purchase' icon={<i className='tabler-shopping-cart' />} modules={PURCHASE_MODULES}>
          <PermissionItem module='Suppliers'>
            <MenuItem href={`/${locale}/admin/suppliers`}>Suppliers</MenuItem>
          </PermissionItem>
          <PermissionItem module='Purchase Order'>
            <MenuItem href={`/${locale}/admin/purchase/purchase-order`}>Purchase Order</MenuItem>
          </PermissionItem>

          <PermissionItem module='Purchase Inward'>
            <MenuItem href={`/${locale}/admin/purchase/purchase-inward`}>Purchase Inward</MenuItem>
          </PermissionItem>

          <PermissionItem module='Purchase Return'>
            <MenuItem href={`/${locale}/admin/purchase/purchase-return`}>Purchase Return</MenuItem>
          </PermissionItem>
        </PermissionSubMenu>

        {/* ==================== TRANSFER ==================== */}
        <PermissionSubMenu
          label='Transfer'
          icon={<i className='tabler-arrows-transfer-down' />}
          modules={TRANSFER_MODULES}
        >
          {/* <PermissionItem module='Transfer Request'>
            <MenuItem href={`/${locale}/admin/transfer/transfer-request`}>Transfer Request</MenuItem>
          </PermissionItem> */}

          <PermissionItem module='Material Request'>
            <MenuItem href={`/${locale}/admin/transfer/material-request`}>Material Request</MenuItem>
          </PermissionItem>

          <PermissionItem module='Material Request Received'>
            <MenuItem href={`/${locale}/admin/transfer/material-received`}>Material Received</MenuItem>
          </PermissionItem>

          <PermissionItem module='Material Request Issued'>
            <MenuItem href={`/${locale}/admin/transfer/material-issued`}>Material Issued</MenuItem>
          </PermissionItem>
        </PermissionSubMenu>

        {/* ✅ Stock Dropdown */}
        <PermissionSubMenu label='Stock' icon={<i className='tabler-package' />} modules={STOCK_MODULES}>
          {/* <PermissionItem module='Stock Report'>
            <MenuItem href={`/${locale}/admin/stock/report`}>Stock Report</MenuItem>
          </PermissionItem> */}
          {/* <PermissionItem module='Usage Report'>
            <MenuItem href={`/${locale}/admin/stock/usage-report`}>Usage Report</MenuItem>
          </PermissionItem> */}

          <PermissionItem module='Stock Summary'>
            <MenuItem href={`/${locale}/admin/stock/stock-summary`}>Stock Summary</MenuItem>
          </PermissionItem>

          <PermissionItem module='Material Usage'>
            <MenuItem href={`/${locale}/admin/stock/material-usage`}>Material Usage</MenuItem>
          </PermissionItem>
        </PermissionSubMenu>

        {/* ✅ Attendance */}
        <PermissionSubMenu label='Attendance' icon={<i className='tabler-user-check' />} modules={ATTENDANCE_MODULES}>
          <PermissionItem module='Attendance Slots'>
            <MenuItem href={`/${locale}/admin/attendance/slots`}>Slots</MenuItem>
          </PermissionItem>
          <PermissionItem module='Attendance'>
            <MenuItem href={`/${locale}/admin/attendance/attendance`}>Attendance</MenuItem>
          </PermissionItem>
          <PermissionItem module='Attendance Schedule'>
            <MenuItem href={`/${locale}/admin/attendance/schedule`}>Schedule</MenuItem>
          </PermissionItem>
          <PermissionItem module='Attendance Timesheet'>
            <MenuItem href={`/${locale}/admin/attendance/timesheet`}>Attendance Timesheet</MenuItem>
          </PermissionItem>
          <PermissionItem module='Payslip Summary'>
            <MenuItem href={`/${locale}/admin/attendance/payslip-summary`}>Payslip Summary Report</MenuItem>
          </PermissionItem>
        </PermissionSubMenu>

        <PermissionItem module='View Contract Status'>
          <MenuItem href={`/${locale}/admin/view-contract-status`} icon={<i className='tabler-list-details' />}>
            View Contract Status
          </MenuItem>
        </PermissionItem>

        <PermissionItem module='Map'>
          <MenuItem href={`/${locale}/admin/map`} icon={<i className='tabler-map' />}>
            Map
          </MenuItem>
        </PermissionItem>

        {/* ==================== FINDER ==================== */}
        {showHeadings && (
          <PermissionGroup modules={FINDER_MODULES}>
            <SectionHeader label='Finder' />
          </PermissionGroup>
        )}

        <PermissionItem module='Non Pre-Schedule'>
          <MenuItem href={`/${locale}/admin/non-pre-schedule`} icon={<i className='tabler-chart-line' />}>
            Non Pre-Schedule
          </MenuItem>
        </PermissionItem>

        <PermissionItem module='Backlog Finder'>
          <MenuItem href={`/${locale}/admin/backlog-finder`} icon={<i className='tabler-trending-up' />}>
            Backlog Finder
          </MenuItem>
        </PermissionItem>

        <PermissionItem module='Followup Finder'>
          <MenuItem href={`/${locale}/admin/followup-finder`} icon={<i className='tabler-chart-line' />}>
            Followup Finder
          </MenuItem>
        </PermissionItem>

        <PermissionItem module='KIV Finder'>
          <MenuItem href={`/${locale}/admin/kiv-finder`} icon={<i className='tabler-trending-up-2' />}>
            KIV Finder
          </MenuItem>
        </PermissionItem>

        <PermissionItem module='Productivity Finder'>
          <MenuItem href={`/${locale}/admin/productivity-finder`} icon={<i className='tabler-activity' />}>
            Productivity Finder
          </MenuItem>
        </PermissionItem>

        {/* ==================== REPORTS ==================== */}
        {showHeadings && (
          <PermissionGroup modules={REPORT_MODULES}>
            <SectionHeader label='Reports' />
          </PermissionGroup>
        )}

        <PermissionItem module='Service Summary Report'>
          <MenuItem href={`/${locale}/admin/service-summary-report`} icon={<i className='tabler-report' />}>
            Service Summary Report
          </MenuItem>
        </PermissionItem>

        <PermissionItem module='RIC / Follow-up Report'>
          <MenuItem href={`/${locale}/admin/ric-followup-report`} icon={<i className='tabler-report-analytics' />}>
            RIC / Follow-up Report
          </MenuItem>
        </PermissionItem>

        <PermissionItem module='Productivity Summary'>
          <MenuItem href={`/${locale}/admin/productivity-summary`} icon={<i className='tabler-chart-bar' />}>
            Productivity Summary
          </MenuItem>
        </PermissionItem>

        <PermissionItem module='SCDF Report'>
          <MenuItem href={`/${locale}/admin/scdf-report`} icon={<i className='tabler-file-analytics' />}>
            SCDF Report
          </MenuItem>
        </PermissionItem>

        <PermissionItem module='Sales Report'>
          <MenuItem href={`/${locale}/admin/sales-report`} icon={<i className='tabler-report-money' />}>
            Sales Report
          </MenuItem>
        </PermissionItem>

        <PermissionItem module='Pest Trending'>
          <MenuItem href={`/${locale}/admin/pest-trending`} icon={<i className='tabler-trending-up' />}>
            Pest Trending
          </MenuItem>
        </PermissionItem>

        {/* ==================== AUDIT TRIAL ==================== */}
        {showHeadings && (
          <PermissionGroup modules={AUDIT_MODULES}>
            <SectionHeader label='Audit Trial' />
          </PermissionGroup>
        )}

        <PermissionItem module='Customer Audit'>
          <MenuItem href={`/${locale}/admin/customer-audit`} icon={<i className='tabler-archive' />}>
            Customer Audit
          </MenuItem>
        </PermissionItem>

        <PermissionItem module='Contracts Audit'>
          <MenuItem href={`/${locale}/admin/contracts-audit`} icon={<i className='tabler-archive' />}>
            Contracts Audit
          </MenuItem>
        </PermissionItem>
      </Menu>
    </ScrollWrapper>
  )
}

export default VerticalMenu
