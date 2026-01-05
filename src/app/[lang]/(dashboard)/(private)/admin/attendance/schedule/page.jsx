'use client'

import { useState, useEffect, useMemo } from 'react'
import React from 'react'
import Link from 'next/link'
import {
  Box,
  Card,
  CardHeader,
  Typography,
  Divider,
  FormControl,
  Select,
  MenuItem,
  Checkbox,
  Menu,
  FormControlLabel,
  Breadcrumbs,
  TextField,
  InputAdornment,
  IconButton
} from '@mui/material'

import PermissionGuard from '@/components/auth/PermissionGuard'

import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'
import GlobalButton from '@/components/common/GlobalButton'
import GlobalDateRange from '@/components/common/GlobalDateRange'
import GlobalAutocomplete from '@/components/common/GlobalAutocomplete'
import { getAttendanceDropdowns } from '@/api/attendance/dropdowns'
import RefreshIcon from '@mui/icons-material/Refresh'
import PrintIcon from '@mui/icons-material/Print'
import TableChartIcon from '@mui/icons-material/TableChart'
import StickyTableWrapper from '@/components/common/StickyTableWrapper'
import StickyListLayout from '@/components/common/StickyListLayout'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import FileCopyIcon from '@mui/icons-material/FileCopy'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import ProgressCircularCustomization from '@/components/common/ProgressCircularCustomization'

import SearchIcon from '@mui/icons-material/Search'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'

import TablePaginationComponent from '@/components/TablePaginationComponent'
import PresetDateRangePicker from '@/components/common/PresetDateRangePicker'

import styles from '@core/styles/table.module.css'

import { format, addDays } from 'date-fns'
import CustomTextField from '@core/components/mui/TextField'

import {
  getScheduleList,
  getScheduleDetails,
  updateSchedule,
  deleteSchedule,
  addSchedule
} from '@/api/attendanceSchedule'

import classnames from 'classnames'
import ChevronRight from '@menu/svg/ChevronRight'

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper
} from '@tanstack/react-table'

// -----------------------------------------------------

const approvalStatusOptions = [
  { label: 'Pending', value: 'pending' },
  { label: 'Confirmed', value: 'confirmed' }
]

const appointmentStatusOptions = [
  { label: 'Pending', value: 'pending' },
  { label: 'Open', value: 'open' },
  { label: 'Paused', value: 'paused' },
  { label: 'Completed', value: 'completed' }
]

// ───────────────────────────────────────────
const AttendanceSchedulePageContent = () => {
  const [rows, setRows] = useState([])
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 })
  // -- UI (TEMPORARY) FILTER STATES --
  const [uiSearchText, setUiSearchText] = useState('')
  const [uiDateFilter, setUiDateFilter] = useState(false)
  const [uiDateRange, setUiDateRange] = useState([new Date(), new Date()])
  const [uiAttendance, setUiAttendance] = useState(null)
  const [uiTechnician, setUiTechnician] = useState(null)
  const [uiSupervisor, setUiSupervisor] = useState(null)
  const [uiCustomer, setUiCustomer] = useState(null)
  const [uiApproval, setUiApproval] = useState(null)
  const [uiAppointment, setUiAppointment] = useState(null)

  // -- APPLIED (PERSISTENT) FILTER STATES --
  const [appliedFilters, setAppliedFilters] = useState({
    searchText: '',
    dateFilter: false,
    dateRange: [new Date(), new Date()],
    attendance: null,
    technician: null,
    supervisor: null,
    customer: null,
    approval: null,
    appointment: null
  })

  const [exportAnchorEl, setExportAnchorEl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [sorting, setSorting] = useState([])

  const [attendanceList, setAttendanceList] = useState([])
  const [technicianList, setTechnicianList] = useState([])
  const [supervisorList, setSupervisorList] = useState([])
  const [customerList, setCustomerList] = useState([])

  const CustomDateInput = ({ label, start, end, ...rest }, ref) => {
    const startDateFormatted = format(start, 'dd/MM/yyyy')
    const endDateFormatted = end ? ` - ${format(end, 'dd/MM/yyyy')}` : ''

    return (
      <CustomTextField
        {...rest}
        fullWidth
        inputRef={ref}
        label={label}
        value={`${startDateFormatted}${endDateFormatted}`}
      />
    )
  }

  // Export
  const exportOpen = Boolean(exportAnchorEl)

  const exportPrint = () => {
    const w = window.open('', '_blank')
    const html = `
        <html><head><title>Tax List</title><style>
          body{font-family:Arial;padding:24px;}
          table{width:100%;border-collapse:collapse;}
          th,td{border:1px solid #ccc;padding:8px;text-align:left;}
          th{background:#f4f4f4;}
        </style></head><body>
        <h2>Tax List</h2>
        <table><thead><tr>
          <th>S.No</th><th>Tax Name</th><th>Tax (%)</th><th>Status</th>
        </tr></thead><tbody>
        ${rows
          .map(
            r =>
              `<tr><td>${r.sno}</td><td>${r.name}</td><td>${r.tax}</td><td>${
                r.is_active === 1 ? 'Active' : 'Inactive'
              }</td></tr>`
          )
          .join('')}
        </tbody></table></body></html>`
    w?.document.write(html)
    w?.document.close()
    w?.print()
  }

  const exportCSV = () => {
    const headers = ['S.No', 'Tax Name', 'Tax (%)', 'Status']
    const csv = [
      headers.join(','),
      ...rows.map(r => [r.sno, r.name, r.tax, r.is_active === 1 ? 'Active' : 'Inactive'].join(','))
    ].join('\n')
    const link = document.createElement('a')
    link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    link.download = 'Tax_List.csv'
    link.click()
    showToast('success', 'CSV downloaded')
  }

  const exportExcel = async () => {
    const XLSX = await import('xlsx')
    const ws = XLSX.utils.json_to_sheet(
      rows.map(r => ({
        'S.No': r.sno,
        'Tax Name': r.name,
        'Tax (%)': r.tax,
        Status: r.is_active === 1 ? 'Active' : 'Inactive'
      }))
    )
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Taxes')
    XLSX.writeFile(wb, 'Tax_List.xlsx')
    showToast('success', 'Excel downloaded')
  }

  const exportPDF = async () => {
    const { jsPDF } = await import('jspdf')
    const autoTable = (await import('jspdf-autotable')).default
    const doc = new jsPDF()
    doc.text('Tax List', 14, 15)
    autoTable(doc, {
      startY: 25,
      head: [['S.No', 'Tax Name', 'Tax (%)', 'Status']],
      body: rows.map(r => [r.sno, r.name, r.tax, r.is_active === 1 ? 'Active' : 'Inactive'])
    })
    doc.save('Tax_List.pdf')
    showToast('success', 'PDF exported')
  }

  const exportCopy = () => {
    const text = rows
      .map(r => `${r.sno}. ${r.name} | ${r.tax}% | ${r.is_active === 1 ? 'Active' : 'Inactive'}`)
      .join('\n')
    navigator.clipboard.writeText(text)
    showToast('info', 'Copied to clipboard')
  }

  const handleEdit = async id => {
    const res = await getScheduleDetails(id)
    console.log('Edit Data:', res.data)
  }

  const handleDelete = async id => {
    if (!confirm('Are you sure?')) return
    await deleteSchedule(id)
    loadScheduleList()
  }

  // FETCH FUNCTION
  const loadScheduleList = async () => {
    try {
      setLoading(true)

      const params = {
        page: pagination.pageIndex + 1,
        page_size: pagination.pageSize,
        search_text: appliedFilters.searchText,

        ...(appliedFilters.dateFilter && {
          start_date: format(appliedFilters.dateRange[0], 'yyyy-MM-dd'),
          end_date: format(appliedFilters.dateRange[1], 'yyyy-MM-dd')
        }),

        ...(appliedFilters.attendance && { attendance_id: appliedFilters.attendance.value }),
        ...(appliedFilters.technician && { technician_id: appliedFilters.technician.value }),
        ...(appliedFilters.supervisor && { supervisor_id: appliedFilters.supervisor.value }),
        ...(appliedFilters.customer && { customer_id: appliedFilters.customer.value }),
        ...(appliedFilters.approval && { approval_status: appliedFilters.approval.value }),
        ...(appliedFilters.appointment && { appointment_status: appliedFilters.appointment.value })
      }

      const res = await getScheduleList(params)

      const results = res.count ? res.results : res

      const normalized = results.map((item, index) => ({
        ...item,
        sno: index + 1 + pagination.pageIndex * pagination.pageSize
      }))

      setRows(normalized)

      setPagination(prev => ({ ...prev, total: res.count || 0 }))
    } catch (err) {
      console.error('Schedule Load Failed', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadScheduleList()
  }, [pagination.pageIndex, pagination.pageSize, appliedFilters])

  useEffect(() => {
    loadDropdownData()
  }, [])

  const loadDropdownData = async () => {
    try {
      const res = await getAttendanceDropdowns()
      const data = res?.data?.data || {}

      // Attendance - label array
      setAttendanceList(data.attendance?.label || [])

      setTechnicianList(data.technician?.name || [])
      setSupervisorList(data.supervisor?.name || [])
      setCustomerList(data.customer?.name || [])
    } catch (err) {
      console.error('Dropdown Load Failed', err)
    }
  }

  const ForwardDateInput = React.forwardRef(CustomDateInput)

  const columnHelper = createColumnHelper()

  const columns = [
    columnHelper.accessor('sno', {
      header: 'S.No',
      enableSorting: true
    }),

    columnHelper.display({
      id: 'action',
      header: 'Action',
      cell: ({ row }) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton size='small' color='primary' onClick={() => handleEdit(row.original.id)}>
            <i className='tabler-edit' />
          </IconButton>
          <IconButton size='small' color='error' onClick={() => handleDelete(row.original.id)}>
            <i className='tabler-trash text-red-600 text-lg' />
          </IconButton>
        </Box>
      )
    }),

    columnHelper.accessor('attendance_date', { header: 'Attendance Date' }),
    columnHelper.accessor('day', { header: 'Day' }),
    columnHelper.accessor('time_in', { header: 'Time In' }),
    columnHelper.accessor('time_out', { header: 'Time Out' }),
    columnHelper.accessor('work_hours', { header: 'Work Hours' }),
    columnHelper.accessor('lunch', { header: 'Lunch' }),
    columnHelper.accessor('slot', { header: 'Slot' }),
    columnHelper.accessor('technician', { header: 'Technician' }),
    columnHelper.accessor('customer', { header: 'Customer' }),
    columnHelper.accessor('service_address', { header: 'Service Address' }),
    columnHelper.accessor('postal_code', { header: 'Postal Code' }),
    columnHelper.accessor('contact_person', { header: 'Contact Person' }),
    columnHelper.accessor('phone', { header: 'Phone' }),
    columnHelper.accessor('attendance_status', { header: 'Attendance Status' }),
    columnHelper.accessor('status', { header: 'Status' })
  ]

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    manualPagination: true,
    pageCount: Math.ceil((pagination.total || 0) / pagination.pageSize),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel()
  })

  return (
    <>
      <StickyListLayout
        header={
          <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 2 }}>
            <Link href='/en/admin/dashboards' className='text-primary'>
              Dashboard
            </Link>{' '}
            / <Typography component='span'>Attendance Schedule</Typography>
          </Breadcrumbs>
        }
      >
        <Card
          sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            minHeight: 0,
            position: 'relative'
          }}
        >
          <CardHeader
            title={
              <Box display='flex' alignItems='center' gap={2}>
                <Typography variant='h5' sx={{ fontWeight: 600 }}>
                  Attendance Schedule
                </Typography>

                <GlobalButton
                  startIcon={
                    <RefreshIcon
                      sx={{
                        animation: loading ? 'spin 1s linear infinite' : 'none',
                        '@keyframes spin': {
                          '0%': { transform: 'rotate(0deg)' },
                          '100%': { transform: 'rotate(360deg)' }
                        }
                      }}
                    />
                  }
                  disabled={loading}
                  onClick={() => {
                    setPagination(p => ({ ...p, pageIndex: 0 }))
                    setAppliedFilters({
                      searchText: uiSearchText,
                      dateFilter: uiDateFilter,
                      dateRange: uiDateRange,
                      attendance: uiAttendance,
                      technician: uiTechnician,
                      supervisor: uiSupervisor,
                      customer: uiCustomer,
                      approval: uiApproval,
                      appointment: uiAppointment
                    })
                  }}
                >
                  {loading ? 'Refreshing...' : 'Refresh'}
                </GlobalButton>
              </Box>
            }
            action={
              <Box display='flex' alignItems='center' gap={2}>
                <GlobalButton
                  color='secondary'
                  endIcon={<ArrowDropDownIcon />}
                  onClick={e => setExportAnchorEl(e.currentTarget)}
                >
                  Export
                </GlobalButton>

                <Menu anchorEl={exportAnchorEl} open={Boolean(exportAnchorEl)} onClose={() => setExportAnchorEl(null)}>
                  <MenuItem onClick={exportPrint}>
                    <PrintIcon fontSize='small' sx={{ mr: 1 }} /> Print
                  </MenuItem>
                  <MenuItem onClick={exportCSV}>
                    <FileDownloadIcon fontSize='small' sx={{ mr: 1 }} /> CSV
                  </MenuItem>
                  <MenuItem onClick={exportExcel}>
                    <TableChartIcon fontSize='small' sx={{ mr: 1 }} /> Excel
                  </MenuItem>
                  <MenuItem onClick={exportPDF}>
                    <PictureAsPdfIcon fontSize='small' sx={{ mr: 1 }} /> PDF
                  </MenuItem>
                  <MenuItem onClick={exportCopy}>
                    <FileCopyIcon fontSize='small' sx={{ mr: 1 }} /> Copy
                  </MenuItem>
                </Menu>
              </Box>
            }
            sx={{
              pb: 1.5,
              pt: 5,
              px: 10,
              '& .MuiCardHeader-action': { m: 0, alignItems: 'center' },
              '& .MuiCardHeader-title': { fontWeight: 600, fontSize: '1.125rem' }
            }}
          />
          <Divider />

          {loading && (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                bgcolor: 'rgba(255,255,255,0.8)',
                backdropFilter: 'blur(2px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10
              }}
            >
              <ProgressCircularCustomization size={60} thickness={5} />
            </Box>
          )}
          <Box sx={{ p: 4, flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Box sx={{ mb: 3, flexShrink: 0 }}>
              {/* ---------- ROW 1 ---------- */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: 4,
                  flexWrap: 'wrap',
                  mb: 2
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    mb: 4,
                    gap: 2,
                    flexWrap: 'nowrap'
                  }}
                >
                  {/* Date Filter + Range */}
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <FormControlLabel
                      control={<Checkbox checked={uiDateFilter} onChange={e => setUiDateFilter(e.target.checked)} />}
                      label='Date Filter'
                    />

                    <Box sx={{ width: 220 }}>
                      <PresetDateRangePicker
                        start={uiDateRange[0]}
                        end={uiDateRange[1]}
                        onSelectRange={({ start, end }) => setUiDateRange([start, end])}
                        disabled={!uiDateFilter}
                      />
                    </Box>
                  </Box>

                  {/* Attendance */}
                  <Box sx={{ width: 220 }}>
                    <GlobalAutocomplete
                      label='Attendance'
                      placeholder='Select'
                      options={attendanceList.map(a => ({
                        label: a.label,
                        value: a.id
                      }))}
                      value={uiAttendance}
                      onChange={setUiAttendance}
                    />
                  </Box>

                  {/* Technician */}
                  <Box sx={{ width: 220 }}>
                    <GlobalAutocomplete
                      label='Technician'
                      placeholder='Select'
                      options={technicianList.map(t => ({
                        label: t.name,
                        value: t.id
                      }))}
                      value={uiTechnician}
                      onChange={setUiTechnician}
                    />
                  </Box>

                  {/* Supervisor */}
                  <Box sx={{ width: 220 }}>
                    <GlobalAutocomplete
                      label='Supervisor'
                      placeholder='Select'
                      options={supervisorList.map(s => ({
                        label: s.name,
                        value: s.id
                      }))}
                      value={uiSupervisor}
                      onChange={setUiSupervisor}
                    />
                  </Box>

                  {/* Customer */}
                  <Box sx={{ width: 220 }}>
                    <GlobalAutocomplete
                      label='Customer'
                      placeholder='Select'
                      options={customerList.map(c => ({
                        label: c.name,
                        value: c.id
                      }))}
                      value={uiCustomer}
                      onChange={setUiCustomer}
                    />
                  </Box>

                  {/* Approval Status */}
                  <Box sx={{ width: 200 }}>
                    <GlobalAutocomplete
                      label='Approval Status'
                      placeholder='Select'
                      options={approvalStatusOptions}
                      value={uiApproval}
                      onChange={setUiApproval}
                    />
                  </Box>

                  {/* Appointment Status */}
                  <Box sx={{ width: 200 }}>
                    <GlobalAutocomplete
                      label='Appointment Status'
                      placeholder='Select'
                      options={appointmentStatusOptions}
                      value={uiAppointment}
                      onChange={setUiAppointment}
                    />
                  </Box>
                </Box>

                {/* Refresh Button */}
                <GlobalButton
                  variant='contained'
                  color='primary'
                  sx={{ height: 40 }}
                  onClick={() => {
                    setPagination(p => ({ ...p, pageIndex: 0 }))
                    setAppliedFilters({
                      searchText: uiSearchText,
                      dateFilter: uiDateFilter,
                      dateRange: uiDateRange,
                      attendance: uiAttendance,
                      technician: uiTechnician,
                      supervisor: uiSupervisor,
                      customer: uiCustomer,
                      approval: uiApproval,
                      appointment: uiAppointment
                    })
                  }}
                >
                  Refresh
                </GlobalButton>

                {/* Global Change */}
                <GlobalButton variant='contained' color='secondary' sx={{ height: 40 }}>
                  Global Change
                </GlobalButton>
              </Box>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* EXPORT + ENTRIES + SEARCH ROW */}
            <Box
              sx={{
                mb: 3,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                gap: 2,
                flexShrink: 0
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2 }}>
                <GlobalButton
                  color='secondary'
                  endIcon={<ArrowDropDownIcon />}
                  onClick={e => setExportAnchorEl(e.currentTarget)}
                  sx={{ textTransform: 'none', fontWeight: 500, px: 2.5, height: 36 }}
                >
                  Export
                </GlobalButton>
                <Menu anchorEl={exportAnchorEl} open={Boolean(exportAnchorEl)} onClose={() => setExportAnchorEl(null)}>
                  <MenuItem
                    onClick={() => {
                      setExportAnchorEl(null)
                      exportPrint()
                    }}
                  >
                    <PrintIcon fontSize='small' sx={{ mr: 1 }} /> Print
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      setExportAnchorEl(null)
                      exportCSV()
                    }}
                  >
                    <FileDownloadIcon fontSize='small' sx={{ mr: 1 }} /> CSV
                  </MenuItem>
                  <MenuItem
                    onClick={async () => {
                      setExportAnchorEl(null)
                      exportExcel()
                    }}
                  >
                    <TableChartIcon fontSize='small' sx={{ mr: 1 }} /> Excel
                  </MenuItem>
                  <MenuItem
                    onClick={async () => {
                      setExportAnchorEl(null)
                      exportPDF()
                    }}
                  >
                    <PictureAsPdfIcon fontSize='small' sx={{ mr: 1 }} /> PDF
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      setExportAnchorEl(null)
                      exportCopy()
                    }}
                  >
                    <FileCopyIcon fontSize='small' sx={{ mr: 1 }} /> Copy
                  </MenuItem>
                </Menu>

                <FormControl size='small' sx={{ width: 150 }}>
                  <Select
                    value={pagination.pageSize}
                    onChange={e => setPagination(prev => ({ ...prev, pageSize: Number(e.target.value), pageIndex: 0 }))}
                  >
                    {[25, 50, 75, 100].map(num => (
                      <MenuItem key={num} value={num}>
                        {num} entries
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <Box>
                <TextField
                  value={uiSearchText}
                  onChange={e => setUiSearchText(e.target.value)}
                  placeholder='Search...'
                  sx={{ width: 300 }}
                  size='small'
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position='start'>
                        <SearchIcon />
                      </InputAdornment>
                    )
                  }}
                />
              </Box>
            </Box>

            <Box sx={{ position: 'relative', flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
              <StickyTableWrapper rowCount={rows.length}>
                <table className={styles.table}>
                  <thead>
                    {table.getHeaderGroups().map(hg => (
                      <tr key={hg.id}>
                        {hg.headers.map(h => (
                          <th key={h.id}>
                            <div
                              className={classnames({
                                'flex items-center': h.column.getIsSorted(),
                                'cursor-pointer select-none': h.column.getCanSort()
                              })}
                              onClick={h.column.getToggleSortingHandler()}
                            >
                              {flexRender(h.column.columnDef.header, h.getContext())}
                              {{
                                asc: <ChevronRight className='-rotate-90' />,
                                desc: <ChevronRight className='rotate-90' />
                              }[h.column.getIsSorted()] ?? null}
                            </div>
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>

                  <tbody>
                    {table.getRowModel().rows.length ? (
                      table.getRowModel().rows.map(row => (
                        <tr key={row.id}>
                          {row.getVisibleCells().map(cell => (
                            <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                          ))}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={columns.length} className='text-center py-4'>
                          No data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </StickyTableWrapper>
            </Box>

            <Box sx={{ mt: 'auto', flexShrink: 0, pt: 4 }}>
              <TablePaginationComponent
                totalCount={pagination.total || 0}
                pagination={pagination}
                setPagination={setPagination}
              />
            </Box>
          </Box>
        </Card>
      </StickyListLayout>
    </>
  )
}

// Wrapper for RBAC
export default function AttendanceSchedulePage() {
  return (
    <PermissionGuard permission='Attendance Schedule'>
      <AttendanceSchedulePageContent />
    </PermissionGuard>
  )
}
