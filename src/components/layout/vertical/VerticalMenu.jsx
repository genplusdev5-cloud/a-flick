'use client'

import { useParams } from 'next/navigation'
import { useTheme } from '@mui/material/styles'
import PerfectScrollbar from 'react-perfect-scrollbar'

import { Menu, SubMenu, MenuItem } from '@menu/vertical-menu'
import useVerticalNav from '@menu/hooks/useVerticalNav'
import StyledVerticalNavExpandIcon from '@menu/styles/vertical/StyledVerticalNavExpandIcon'
import menuItemStyles from '@core/styles/vertical/menuItemStyles'
import menuSectionStyles from '@core/styles/vertical/menuSectionStyles'

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
        <MenuItem href={`/${locale}/admin/dashboards`} icon={<i className='tabler-home' />}>
          Dashboard
        </MenuItem>

        {/* ✅ Master */}

        <SubMenu label='Master' icon={<i className='tabler-database' />}>
          <MenuItem href={`/${locale}/admin/tax`}>Tax</MenuItem>
          <MenuItem href={`/${locale}/admin/company-origin`}>Company Origin</MenuItem>
          {/* <MenuItem href={`/${locale}/admin/account-item-code`}>Account Item Code</MenuItem> */}
          <MenuItem href={`/${locale}/admin/service-frequency`}>Service Frequency</MenuItem>
          <MenuItem href={`/${locale}/admin/billing-frequency`}>Billing Frequency</MenuItem>
          <MenuItem href={`/${locale}/admin/uom`}>Unit Of Measurement</MenuItem>
          <MenuItem href={`/${locale}/admin/call-type`}>Call Type</MenuItem>
          <MenuItem href={`/${locale}/admin/chemicals`}>Chemicals</MenuItem>
          <MenuItem href={`/${locale}/admin/industry`}>Industry</MenuItem>
          <MenuItem href={`/${locale}/admin/holidays`}>Holidays</MenuItem>
          <MenuItem href={`/${locale}/admin/incident`}>Incident</MenuItem>
          <MenuItem href={`/${locale}/admin/todo-items`}>Todo Items</MenuItem>
          <MenuItem href={`/${locale}/admin/site-risk`}>Site Risk</MenuItem>
          <MenuItem href={`/${locale}/admin/equipments`}>Equipments</MenuItem>
        </SubMenu>

        {/* ✅ Employee */}
        <SubMenu label='Employee' icon={<i className='tabler-user' />}>
          <MenuItem href={`/${locale}/admin/department`}>Department</MenuItem>
          <MenuItem href={`/${locale}/admin/designation`}>Designation</MenuItem>
          <MenuItem href={`/${locale}/admin/employee-list`}>Employee List</MenuItem>
          <MenuItem href={`/${locale}/admin/employee-leave-type`}>Employee Leave Type</MenuItem>
          <MenuItem href={`/${locale}/admin/user-privilege`}>User Privilege</MenuItem>
        </SubMenu>
        <MenuItem href={`/${locale}/admin/employee-leave`} icon={<i className='tabler-calendar-time' />}>
          Employee Leaves
        </MenuItem>

        {/* ✅ Service Type (Pest) */}
        <MenuItem href={`/${locale}/admin/pests`} icon={PestIcon}>
          Service Type (Pest)
        </MenuItem>

        {/* ✅ Customers */}

        <MenuItem href={`/${locale}/admin/customers`} icon={<i className='tabler-users' />}>
          Customers
        </MenuItem>

        {/* ✅ Contracts */}
        <MenuItem href={`/${locale}/admin/contracts`} icon={<i className='tabler-file-text' />}>
          Contracts
        </MenuItem>

        {/* ✅ Contract Status */}
        <MenuItem href={`/${locale}/admin/view-contract-status`} icon={<i className='tabler-list-details' />}>
          View Contract Status
        </MenuItem>

        {/* ✅ Attendance */}
        <SubMenu label='Attendance' icon={<i className='tabler-user-check' />}>
          <MenuItem href={`/${locale}/admin/attendance/slots`}>Slots</MenuItem>
          <MenuItem href={`/${locale}/admin/attendance/attendance`}>Attendance</MenuItem>
          <MenuItem href={`/${locale}/admin/attendance/schedule`}>Schedule</MenuItem>
          {/* <MenuItem href={`/${locale}/admin/attendance/hr-project-report`}>HR & Project Report</MenuItem>
          <MenuItem href={`/${locale}/admin/attendance/hr-report`}>HR Report</MenuItem> */}
          <MenuItem href={`/${locale}/admin/attendance/timesheet`}>Attendance Timesheet</MenuItem>
          {/* <MenuItem href={`/${locale}/admin/attendance/timesheet-with-leave`}>Attendance Timesheet With Leave</MenuItem> */}
          <MenuItem href={`/${locale}/admin/attendance/payslip-summary`}>Payslip Summary Report</MenuItem>
          {/* <MenuItem href={`/${locale}/admin/attendance/salary-report`}>Salary Report</MenuItem> */}
        </SubMenu>

        {/* ✅ Suppliers & Stock */}
        {/* {showHeadings && <SectionHeader label="Suppliers & Stock" />} */}

        <MenuItem href={`/${locale}/admin/suppliers`} icon={<i className='tabler-building-store' />}>
          Suppliers
        </MenuItem>

        {/* ✅ Stock Dropdown */}
        <SubMenu label='Stock' icon={<i className='tabler-package' />}>
          {/* <MenuItem href={`/${locale}/admin/stock/chemicals`}>Chemicals</MenuItem> */}
          <MenuItem href={`/${locale}/admin/stock/material-request`}>Material Request</MenuItem>
          <MenuItem href={`/${locale}/admin/stock/report`}>Stock Report</MenuItem>
          <MenuItem href={`/${locale}/admin/stock/usage-report`}>Usage Report</MenuItem>
        </SubMenu>

        {/* ✅ Calendar */}
        <MenuItem href={`/${locale}/admin/service-request`} icon={<i className='tabler-calendar' />}>
          Service Request
        </MenuItem>

        {/* ✅ Calendar */}
        <MenuItem href={`/${locale}/admin/calendar`} icon={<i className='tabler-calendar' />}>
          Calendar
        </MenuItem>

        {/* ✅ Invoice */}
        <MenuItem href={`/${locale}/admin/invoice`} icon={<i className='tabler-receipt-2' />}>
          Invoice
        </MenuItem>

        {/* ✅ Map */}
        <MenuItem href={`/${locale}/admin/map`} icon={<i className='tabler-map' />}>
          Map
        </MenuItem>

        {/* ==================== FINDER ==================== */}
        {showHeadings && <SectionHeader label='Finder' />}

        <MenuItem href={`/${locale}/admin/non-pre-schedule`} icon={<i className='tabler-chart-line' />}>
          Non Pre-Schedule
        </MenuItem>

        <MenuItem href={`/${locale}/admin/backlog-finder`} icon={<i className='tabler-trending-up' />}>
          Backlog Finder
        </MenuItem>

        <MenuItem href={`/${locale}/admin/followup-finder`} icon={<i className='tabler-chart-line' />}>
          Followup Finder
        </MenuItem>

        <MenuItem href={`/${locale}/admin/kiv-finder`} icon={<i className='tabler-trending-up-2' />}>
          KIV Finder
        </MenuItem>

        <MenuItem href={`/${locale}/admin/productivity-finder`} icon={<i className='tabler-activity' />}>
          Productivity Finder
        </MenuItem>

        {/* ==================== REPORTS ==================== */}
        {showHeadings && <SectionHeader label='Reports' />}

        <MenuItem href={`/${locale}/admin/service-summary-report`} icon={<i className='tabler-report' />}>
          Service Summary Report
        </MenuItem>

        <MenuItem href={`/${locale}/admin/ric-followup-report`} icon={<i className='tabler-report-analytics' />}>
          RIC / Follow-up Report
        </MenuItem>

        <MenuItem href={`/${locale}/admin/productivity-summary`} icon={<i className='tabler-chart-bar' />}>
          Productivity Summary
        </MenuItem>

        <MenuItem href={`/${locale}/admin/scdf-report`} icon={<i className='tabler-file-analytics' />}>
          SCDF Report
        </MenuItem>

        <MenuItem href={`/${locale}/admin/sales-report`} icon={<i className='tabler-report-money' />}>
          Sales Report
        </MenuItem>

        <MenuItem href={`/${locale}/admin/pest-trending`} icon={<i className='tabler-trending-up' />}>
          Pest Trending
        </MenuItem>

        {/* ==================== AUDIT TRIAL ==================== */}
        {showHeadings && <SectionHeader label='Audit Trial' />}

        <MenuItem href={`/${locale}/admin/customer-audit`} icon={<i className='tabler-archive' />}>
          Customer Audit
        </MenuItem>

        <MenuItem href={`/${locale}/admin/contracts-audit`} icon={<i className='tabler-archive' />}>
          Contracts Audit
        </MenuItem>
      </Menu>
    </ScrollWrapper>
  )
}

export default VerticalMenu
