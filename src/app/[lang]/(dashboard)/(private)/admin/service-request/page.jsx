'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
import Link from 'next/link'
import { format, isValid } from 'date-fns'
import {
  Box,
  Button,
  Card,
  CardHeader,
  Typography,
  Divider,
  InputAdornment,
  Breadcrumbs,
  IconButton,
  DialogContent,
  DialogActions,
  TextField,
  Dialog,
  DialogTitle,
  MenuItem,
  FormControlLabel,
  Pagination,
  FormControl,
  Select,
  Checkbox
} from '@mui/material'

import PermissionGuard from '@/components/auth/PermissionGuard'
import { usePermission } from '@/hooks/usePermission'

import { getTicketReportList } from '@/api/service_request/report'
import { getReportDropdowns } from '@/api/service_request/report'

import RefreshIcon from '@mui/icons-material/Refresh'
import SearchIcon from '@mui/icons-material/Search'
import AddIcon from '@mui/icons-material/Add'
import GlobalDateRange from '@/components/common/GlobalDateRange'

import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'

import ProgressCircularCustomization from '@/components/common/ProgressCircularCustomization'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'
import CustomTextField from '@core/components/mui/TextField'
import CustomAutocomplete from '@core/components/mui/Autocomplete'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { showToast } from '@/components/common/Toasts'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import DialogCloseButton from '@components/dialogs/DialogCloseButton'
import GlobalButton from '@/components/common/GlobalButton'

import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  createColumnHelper,
  flexRender
} from '@tanstack/react-table'

import classnames from 'classnames'
import styles from '@core/styles/table.module.css'
import ChevronRight from '@menu/svg/ChevronRight'

const appointmentStatusList = [
  { id: 'NOT STARTED', label: 'NOT STARTED' },
  { id: 'IN-PROGRESS', label: 'IN-PROGRESS' },
  { id: 'PAUSED', label: 'PAUSED' },
  { id: 'NOT UPLOADED', label: 'NOT UPLOADED' },
  { id: 'COMPLETED', label: 'COMPLETED' }
]

const appointmentList = [
  { id: 'SCHEDULED', label: 'SCHEDULED' },
  { id: 'NOT SCHEDULED', label: 'NOT SCHEDULED' }
]

// -------------------------
// Service Request Page (full)
// -------------------------
// -------------------------
const ServiceRequestPageContent = () => {
  const { canAccess } = usePermission()
  // state
  const [rows, setRows] = useState([])
  const [rowCount, setRowCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [allTickets, setAllTickets] = useState([])

  // filters
  const [enableDateFilter, setEnableDateFilter] = useState(false)
  const [startDate, setStartDate] = useState(new Date())
  const [endDate, setEndDate] = useState(new Date())
  const [customerFilter, setCustomerFilter] = useState('')
  const [contractFilter, setContractFilter] = useState('')
  const [technicianFilter, setTechnicianFilter] = useState('')
  const [supervisorFilter, setSupervisorFilter] = useState('')
  const [appointmentStatusFilter, setAppointmentStatusFilter] = useState('')
  const [appointmentTypeFilter, setAppointmentTypeFilter] = useState('')
  const [deleteDialog, setDeleteDialog] = useState({ open: false, row: null })
  const [contractOptions, setContractOptions] = useState([])

  const [searchText, setSearchText] = useState('')
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })

  // refs
  const customerRef = useRef(null)
  const contractRef = useRef(null)
  const techRef = useRef(null)

  const [customerOptions, setCustomerOptions] = useState([])
  const [technicianOptions, setTechnicianOptions] = useState([])
  const [supervisorOptions, setSupervisorOptions] = useState([])
  const [attendanceOptions, setAttendanceOptions] = useState([])

  const loadReportDropdownData = async () => {
    try {
      const res = await getReportDropdowns()
      const dd = res?.data?.data || {}

      const customerList = dd?.customer?.name || []
      const technicianList = dd?.technician?.name || []
      const supervisorList = dd?.supervisor?.name || []

      const attendanceList = dd?.attendance?.label || []

      setCustomerOptions(customerList.map(c => ({ id: c.id, label: c.name || '' })))
      setTechnicianOptions(technicianList.map(t => ({ id: t.id, label: t.name || '' })))
      setSupervisorOptions(supervisorList.map(s => ({ id: s.id, label: s.name || '' })))
      setAttendanceOptions(attendanceList.map(a => ({ id: a.id, label: a.label || '' })))
    } catch (err) {
      console.error('Report dropdown fetch failed:', err)
      showToast('error', 'Failed to load dropdowns')
    }
  }

  useEffect(() => {
    fetchTicketsFromApi()
  }, [pagination.pageIndex, pagination.pageSize])

  useEffect(() => {
    loadReportDropdownData()
  }, [])

  const confirmDelete = async () => {
    try {
      const id = deleteDialog.row?.id
      if (!id) return

      setLoading(true)

      const res = await deleteSchedule(id) // 🔥 REAL DELETE API CALL

      showToast('success', res?.message || 'Deleted successfully')

      // Close Dialog
      setDeleteDialog({ open: false, row: null })

      // Refresh Table
      await fetchTicketsFromApi()
      loadData(true)
    } catch (err) {
      console.error(err)
      showToast('error', 'Failed to delete item')
    } finally {
      setLoading(false)
    }
  }

  // columns
  const columnHelper = createColumnHelper()
  const columns = useMemo(
    () => [
      columnHelper.accessor('sno', {
        header: 'S.No',
        meta: { width: '60px' }
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        meta: { width: '110px', align: 'center' },

        cell: ({ row }) => {
          const item = row.original

          return (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1.2
              }}
            >
              {/* 👁 VIEW */}
              <IconButton size='small' onClick={() => router.push(`/admin/contracts/${item.id}/view`)}>
                <i className='tabler-eye text-gray-600 text-[18px]' />
              </IconButton>

              {/* ✏ EDIT */}
              {canAccess('Service Request', 'update') && (
                <IconButton size='small' onClick={() => handleEdit(item)}>
                  <i className='tabler-edit text-blue-600 text-[18px]' />
                </IconButton>
              )}

              {/* 🗑 DELETE */}
              {canAccess('Service Request', 'delete') && (
                <IconButton size='small' onClick={() => setDeleteDialog({ open: true, row: item })}>
                  <i className='tabler-trash text-red-600 text-[18px]' />
                </IconButton>
              )}
            </Box>
          )
        }
      }),
      columnHelper.accessor('scheduleDate', {
        header: 'Schedule Date',
        cell: info => (info.getValue() ? format(new Date(info.getValue()), 'dd/MM/yyyy') : '')
      }),
      columnHelper.accessor('day', { header: 'Day' }),
      columnHelper.accessor('timeIn', { header: 'Appointment time in' }),
      columnHelper.accessor('timeOut', { header: 'Appointment time out' }),
      columnHelper.accessor('pestCode', { header: 'Pest Code' }),
      columnHelper.accessor('technician', { header: 'Technician' }),
      columnHelper.accessor('prodVal', { header: 'Prod.Val', cell: i => Number(i.getValue() || 0).toLocaleString() }),
      columnHelper.accessor('customer', { header: 'Customer' }),
      columnHelper.accessor('serviceAddress', { header: 'Service Address' }),
      columnHelper.accessor('postalCode', { header: 'Postal Code' }),
      columnHelper.accessor('contactPerson', { header: 'Contact person' }),
      columnHelper.accessor('phone', { header: 'Phone' }),
      columnHelper.accessor('contractCode', { header: 'Contract Code' }),
      columnHelper.accessor('appointmentRemarks', { header: 'Appointment Remarks' }),
      columnHelper.accessor('serviceType', { header: 'Service Type' }),
      columnHelper.accessor('scheduleStatus', { header: 'Schedule Status' }),
      columnHelper.accessor('appointmentStatus', {
        header: 'Appointment Status',
        cell: info => {
          const s = info.getValue() || 'Pending'

          const bg =
            s === 'Done'
              ? 'success.main'
              : s === 'Pending'
                ? 'warning.main'
                : s === 'Cancelled'
                  ? 'error.main'
                  : 'info.main'

          return (
            <Box
              component='span'
              sx={{
                bgcolor: bg,
                color: '#fff',
                px: 1.2,
                py: 0.3,
                borderRadius: 1,
                fontWeight: 600,
                fontSize: '0.75rem'
              }}
            >
              {s}
            </Box>
          )
        }
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: info => {
          const s = info.getValue() || 'Pending'

          const bg =
            s === 'Completed'
              ? 'success.main'
              : s === 'Pending'
                ? 'warning.main'
                : s === 'Cancelled'
                  ? 'error.main'
                  : 'info.main'

          return (
            <Box
              component='span'
              sx={{
                bgcolor: bg,
                color: '#fff',
                px: 1.2,
                py: 0.3,
                borderRadius: 1,
                fontWeight: 600,
                fontSize: '0.75rem'
              }}
            >
              {s}
            </Box>
          )
        }
      })
    ],
    []
  )

  const mapTicketToRow = ticket => {
    let scheduleDate = ticket.schedule_date || ticket.ticket_date || ''

    // Convert DD-MM-YYYY → YYYY-MM-DD
    if (scheduleDate && scheduleDate.includes('-') && scheduleDate.split('-')[2].length === 4) {
      const [dd, mm, yyyy] = scheduleDate.split('-')
      scheduleDate = `${yyyy}-${mm}-${dd}`
    }

    const dateObj = new Date(scheduleDate)

    return {
      id: ticket.id,

      scheduleDate,
      day: isValid(dateObj) ? format(dateObj, 'EEE') : '',
      timeIn: ticket.schedule_start_time || ticket.start_time || '',
      timeOut: ticket.schedule_end_time || ticket.end_time || '',
      pestCode: ticket.pest_code || '',
      prodVal: Number(ticket.productivity || 0),
      customer: ticket.customer_name || ticket.business_name || '',
      serviceAddress: ticket.service_address || '',
      postalCode: ticket.postal_address || '',
      contactPerson: ticket.contact_person_name || '',
      phone: ticket.contract_phone || ticket.phone || '',
      appointmentRemarks: ticket.appointment_remarks || ticket.remarks || '',
      contractCode: ticket.contract_code || ticket.ticket_no || ticket.num_series || '',
      serviceType: ticket.ticket_type_name || ticket.ticket_type || '',
      scheduleStatus: ticket.is_alloted ? 'Allocated' : 'Unallocated',
      appointmentStatus: ticket.ticket_status || 'Pending',
      status: ticket.status == 2 ? 'Completed' : ticket.status == 3 ? 'Cancelled' : 'Pending',
      technician: ticket.employee_name || ''
    }
  }

  const fetchTicketsFromApi = async (showToastMsg = false) => {
    try {
      setLoading(true)

      const params = {
        page: pagination.pageIndex + 1,
        page_size: pagination.pageSize
      }

      // Filters will apply only if selected
      if (customerFilter) params.customer_id = customerFilter
      if (contractFilter) params.contract_id = contractFilter
      if (technicianFilter) params.technician_id = technicianFilter
      if (supervisorFilter) params.supervisor_id = supervisorFilter
      if (appointmentStatusFilter) params.ticket_status = appointmentStatusFilter
      if (appointmentTypeFilter) params.ticket_type = appointmentTypeFilter
      if (enableDateFilter && startDate && endDate) {
        params.from_date = format(startDate, 'yyyy-MM-dd')
        params.to_date = format(endDate, 'yyyy-MM-dd')
      }
      if (searchText?.trim()) params.search = searchText.trim()

      // Optional filters
      if (enableDateFilter && startDate && endDate) {
        params.from_date = format(startDate, 'yyyy-MM-dd')
        params.to_date = format(endDate, 'yyyy-MM-dd')
      }

      if (technicianFilter) params.technician_id = technicianFilter
      if (supervisorFilter) params.supervisor_id = supervisorFilter
      if (appointmentStatusFilter) params.ticket_status = appointmentStatusFilter
      if (appointmentTypeFilter) params.schedule_status = appointmentTypeFilter
      if (appointmentTypeFilter) params.ticket_type = appointmentTypeFilter
      if (searchText?.trim()) params.search = searchText.trim()

      console.log('Ticket Params =>', params)

      const res = await getTicketReportList(params)
      const list = res?.results || res?.data?.results || res?.data?.data?.results || []
      const total = res?.count || res?.data?.count || list.length

      console.log('API Updated:', list.length, total) // ← Paste here 👌

      const mapped = list.map(mapTicketToRow)

      const startIndex = pagination.pageIndex * pagination.pageSize
      const withSno = mapped.map((item, index) => ({
        ...item,
        sno: startIndex + index + 1
      }))

      setRows(withSno)
      setRowCount(total)

      if (showToastMsg) {
        if (total > 0) showToast('success', `${total} service request(s) found`)
        else showToast('info', 'No service requests found for selected filters')
      }
    } catch (err) {
      console.error('Ticket fetch failed:', err)
      showToast('error', 'Failed to load service requests')
      setRows([])
      setRowCount(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const fetchContractByCustomer = async () => {
      if (!customerFilter) {
        setContractOptions([])
        setContractFilter('')
        return
      }

      try {
        const res = await getReportDropdowns({ customer_id: customerFilter })

        const dd = res?.data?.data || {}
        const list = dd?.contract_list?.label || [] // ⭐ FIXED KEY

        setContractOptions(
          list.map(c => ({
            id: c.id,
            label: c.label || ''
          }))
        )
      } catch (err) {
        console.error('Contract fetch failed:', err)
        setContractOptions([])
      }
    }

    fetchContractByCustomer()
  }, [customerFilter])

  // react-table
  const table = useReactTable({
    data: rows,
    columns,
    manualPagination: true,
    pageCount: Math.ceil(rowCount / pagination.pageSize),
    state: { globalFilter: searchText, pagination },
    onGlobalFilterChange: setSearchText,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel()
  })

  // export CSV
  const exportCSV = () => {
    const headers = columns.map(c => c.header).filter(Boolean)
    const csv = [
      headers.join(','),
      ...rows.map(r =>
        columns
          .map(col => {
            const key = col.accessorKey || ''
            const val = key ? (r[key] ?? '') : ''
            return `"${String(val).replace(/"/g, '""')}"`
          })
          .join(',')
      )
    ].join('\n')
    const link = document.createElement('a')
    link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    link.download = 'service_requests.csv'
    link.click()
    showToast('success', 'CSV downloaded')
  }

  const exportPrint = () => {
    const w = window.open('', '_blank')
    const html = `
      <html><head><title>Service Requests</title><style>
      body{font-family:Arial;padding:24px;}
      table{border-collapse:collapse;width:100%;font-size:12px;}
      th,td{border:1px solid #ccc;padding:6px;text-align:left;}
      th{background:#f4f4f4}
      </style></head><body>
      <h2>Service Requests</h2>
      <table><thead><tr>${columns.map(c => `<th>${c.header}</th>`).join('')}</tr></thead><tbody>
      ${rows
        .map(
          r =>
            `<tr>${columns
              .map(col => {
                const key = col.accessorKey || ''
                const val = key ? (r[key] ?? '') : ''
                return `<td>${String(val)}</td>`
              })
              .join('')}</tr>`
        )
        .join('')}
      </tbody></table></body></html>`
    w.document.write(html)
    w.document.close()
    w.print()
  }

  // UI render
  return (
    <Box>
      <Box role='presentation' sx={{ mb: 2 }}>
        <Breadcrumbs aria-label='breadcrumb'>
          <Link underline='hover' color='inherit' href='/'>
            Home
          </Link>
          <Typography color='text.primary'>Service Request</Typography>
        </Breadcrumbs>
      </Box>

      <Card sx={{ p: 3 }}>
        {/* Header */}
        <CardHeader
          title={
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant='h5' sx={{ fontWeight: 600 }}>
                  Service Request
                </Typography>

                <Button
                  variant='contained'
                  startIcon={<RefreshIcon />}
                  onClick={async () => {
                    // Always fetch full list or filtered list
                    setPagination({ pageIndex: 0, pageSize: pagination.pageSize })
                    await fetchTicketsFromApi(true)
                  }}
                  sx={{ textTransform: 'none' }}
                >
                  Refresh
                </Button>
              </Box>

              {canAccess('Service Request', 'create') && (
                <Button variant='contained' startIcon={<AddIcon />} sx={{ textTransform: 'none' }}>
                  Global Change
                </Button>
              )}
            </Box>
          }
          sx={{ pb: 1.5, pt: 1.5 }}
          action={null}
        />

        <Divider sx={{ mb: 2 }} />

        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-end', // ⭐ FIX: Align bottom of all fields
            gap: 2,
            mb: 3,
            flexWrap: 'nowrap'
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <FormControlLabel
              control={<Checkbox checked={enableDateFilter} onChange={e => setEnableDateFilter(e.target.checked)} />}
              label='Date Filter'
            />
            <Box sx={{ width: 220 }}>
              <GlobalDateRange
                start={startDate}
                end={endDate}
                onSelectRange={({ start, end }) => {
                  setStartDate(start)
                  setEndDate(end)
                }}
                disabled={!enableDateFilter}
              />
            </Box>
          </Box>

          <CustomAutocomplete
            options={customerOptions}
            value={customerOptions.find(o => o.id === customerFilter) || null}
            getOptionLabel={option => option?.label || ''} // ✔ only once
            getOptionKey={option => option?.id}
            isOptionEqualToValue={(o, v) => o.id === v?.id} // ⭐ IMPORTANT
            onChange={(_, v) => {
              const id = v?.id || ''
              setCustomerFilter(id)
              setContractFilter('')
            }}
            renderInput={params => (
              <CustomTextField
                {...params}
                label='Customer'
                size='small'
                sx={{ width: 220 }}
                placeholder='Select customer...'
              />
            )}
          />

          <CustomAutocomplete
            options={contractOptions}
            value={contractOptions.find(o => o.id === contractFilter) || null}
            getOptionLabel={option => option?.label || ''}
            getOptionKey={option => option?.id}
            isOptionEqualToValue={(o, v) => o.id === v?.id}
            onChange={(_, v) => setContractFilter(v?.id || '')}
            renderInput={params => (
              <CustomTextField
                {...params}
                label='Contract'
                size='small'
                sx={{ width: 220 }}
                placeholder='Select contract...'
              />
            )}
          />

          {/* Technician */}
          <CustomAutocomplete
            options={technicianOptions}
            value={technicianOptions.find(o => o.id === technicianFilter) || null}
            onChange={(_, v) => setTechnicianFilter(v?.id || '')}
            getOptionLabel={option => option?.label || ''}
            renderInput={params => (
              <CustomTextField
                {...params}
                label='Technician'
                size='small'
                sx={{ width: 220 }}
                placeholder='Select Technician...'
              />
            )}
          />

          {/* Supervisor */}
          <CustomAutocomplete
            options={supervisorOptions}
            value={supervisorOptions.find(o => o.id === supervisorFilter) || null}
            onChange={(_, v) => setSupervisorFilter(v?.id || '')}
            getOptionLabel={option => option?.label || ''}
            renderInput={params => (
              <CustomTextField
                {...params}
                label='Supervisor'
                size='small'
                sx={{ width: 220 }}
                placeholder='Select Supervisor...'
              />
            )}
          />

          {/* Appointment Status */}
          <CustomAutocomplete
            options={appointmentStatusList}
            value={appointmentStatusList.find(o => o.id === appointmentStatusFilter) || null}
            onChange={(_, v) => setAppointmentStatusFilter(v?.id || '')}
            getOptionLabel={option => option?.label || ''}
            renderInput={params => (
              <CustomTextField
                {...params}
                label='Appointment Status'
                size='small'
                sx={{ width: 200 }}
                placeholder='Select Status...'
              />
            )}
          />

          {/* Appointment */}
          <CustomAutocomplete
            options={appointmentList}
            value={appointmentList.find(o => o.id === appointmentTypeFilter) || null}
            onChange={(_, v) => setAppointmentTypeFilter(v?.id || '')}
            getOptionLabel={option => option?.label || ''}
            renderInput={params => (
              <CustomTextField
                {...params}
                label='Appointment'
                size='small'
                sx={{ width: 200 }}
                placeholder='Select Appointment...'
              />
            )}
          />
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Toolbar: entries + export + search */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
            mb: 2,
            flexWrap: 'wrap'
          }}
        >
          {/* left: entries + export */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FormControl size='small' sx={{ width: 120 }}>
              <Select
                value={pagination.pageSize}
                onChange={e => setPagination(p => ({ ...p, pageSize: Number(e.target.value), pageIndex: 0 }))}
              >
                {[10, 25, 50, 100].map(s => (
                  <MenuItem key={s} value={s}>
                    {s} entries
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ display: 'flex', gap: 1 }}>
              {['Copy', 'CSV', 'Excel', 'PDF', 'Print'].map(b => (
                <Button
                  key={b}
                  variant='contained'
                  size='small'
                  onClick={
                    b === 'CSV' ? exportCSV : b === 'Print' ? exportPrint : () => showToast('info', `${b} coming soon`)
                  }
                  sx={{ bgcolor: '#6c757d', color: '#fff', textTransform: 'none' }}
                >
                  {b}
                </Button>
              ))}
            </Box>
          </Box>

          {/* right: search */}
          <TextField
            size='small'
            placeholder='Search any field...'
            value={searchText}
            onChange={e => {
              setSearchText(e.target.value)
              setPagination(p => ({ ...p, pageIndex: 0 }))
            }}
            sx={{ width: 360 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <SearchIcon />
                </InputAdornment>
              )
            }}
          />
        </Box>

        {/* Loading overlay */}
        {loading && (
          <Box
            sx={{
              position: 'fixed',
              inset: 0,
              bgcolor: 'rgba(255,255,255,0.7)',
              backdropFilter: 'blur(2px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2000
            }}
          >
            <ProgressCircularCustomization size={60} thickness={5} />
          </Box>
        )}
        {/* Table */}
        <div className='overflow-x-auto'>
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
                        {h.column.getIsSorted() === 'asc' && <ChevronRight className='-rotate-90' fontSize='small' />}
                        {h.column.getIsSorted() === 'desc' && <ChevronRight className='rotate-90' fontSize='small' />}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>

            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className='text-center py-4'>
                    {loading ? 'Loading...' : 'No data available'}
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map(row => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <Box
          sx={{
            mt: 2,
            px: 3,
            py: 1.5,
            borderTop: '1px solid #e0e0e0',
            display: 'flex',
            justifyContent: 'space-between', // 👈 Left text + Right pagination
            alignItems: 'center',
            flexWrap: 'wrap'
          }}
        >
          {/* Left text */}
          <Typography color='text.disabled'>
            {`Showing ${rowCount === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1} to ${Math.min(
              (pagination.pageIndex + 1) * pagination.pageSize,
              rowCount
            )} of ${rowCount} entries`}
          </Typography>

          {/* Right Pagination */}
          <Pagination
            shape='rounded'
            color='primary'
            variant='tonal'
            count={Math.ceil(rowCount / pagination.pageSize) || 1}
            page={pagination.pageIndex + 1}
            onChange={(_, page) => setPagination(p => ({ ...p, pageIndex: page - 1 }))}
            showFirstButton
            showLastButton
          />
        </Box>

        <Dialog
          onClose={() => setDeleteDialog({ open: false, row: null })}
          aria-labelledby='customized-dialog-title'
          open={deleteDialog.open}
          closeAfterTransition={false}
          PaperProps={{
            sx: {
              overflow: 'visible',
              width: 420,
              borderRadius: 1,
              textAlign: 'center'
            }
          }}
        >
          {/* 🔴 Title with Warning Icon */}
          <DialogTitle
            id='customized-dialog-title'
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              color: 'error.main',
              fontWeight: 700,
              pb: 1,
              position: 'relative'
            }}
          >
            <WarningAmberIcon color='error' sx={{ fontSize: 26 }} />
            Confirm Delete
            <DialogCloseButton
              onClick={() => setDeleteDialog({ open: false, row: null })}
              disableRipple
              sx={{ position: 'absolute', right: 1, top: 1 }}
            >
              <i className='tabler-x' />
            </DialogCloseButton>
          </DialogTitle>

          {/* Centered Text */}
          <DialogContent sx={{ px: 5, pt: 1 }}>
            <Typography sx={{ color: 'text.secondary', fontSize: 14, lineHeight: 1.6 }}>
              Are you sure you want to delete{' '}
              <strong style={{ color: '#d32f2f' }}>{deleteDialog.row?.name || 'this incident'}</strong>?
              <br />
              This action cannot be undone.
            </Typography>
          </DialogContent>

          {/* Centered Buttons */}
          <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 3, pt: 2 }}>
            <GlobalButton
              onClick={() => setDeleteDialog({ open: false, row: null })}
              color='secondary'
              sx={{ minWidth: 100, textTransform: 'none', fontWeight: 500 }}
            >
              Cancel
            </GlobalButton>
            <GlobalButton
              onClick={confirmDelete}
              variant='contained'
              color='error'
              sx={{ minWidth: 100, textTransform: 'none', fontWeight: 600 }}
            >
              Delete
            </GlobalButton>
          </DialogActions>
        </Dialog>
      </Card>
    </Box>
  )
}

// Wrapper for RBAC
export default function ServiceRequestPage() {
  return (
    <PermissionGuard permission='Service Request'>
      <ServiceRequestPageContent />
    </PermissionGuard>
  )
}
