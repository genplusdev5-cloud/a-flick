'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
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
import StickyListLayout from '@/components/common/StickyListLayout'
import StickyTableWrapper from '@/components/common/StickyTableWrapper'
import TablePaginationComponent from '@/components/TablePaginationComponent'

import { getTicketReportList } from '@/api/service_request/report'
import { getReportDropdowns } from '@/api/service_request/report'
import { getTicketDetails } from '@/api/ticket/details'

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
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { showToast } from '@/components/common/Toasts'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import DialogCloseButton from '@components/dialogs/DialogCloseButton'
import GlobalButton from '@/components/common/GlobalButton'
import SummaryCards from '@/components/common/SummaryCards'

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  createColumnHelper,
  flexRender
} from '@tanstack/react-table'

import classnames from 'classnames'
import styles from '@core/styles/table.module.css'
import ChevronRight from '@menu/svg/ChevronRight'
import { dateSortingFn } from '@/utils/tableUtils'

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

  const searchParams = useSearchParams()

  const encodedCustomer = searchParams.get('customer')
  const encodedContract = searchParams.get('contract')

  const decodedCustomerId = encodedCustomer ? Number(atob(encodedCustomer)) : ''
  const decodedContractId = encodedContract ? Number(atob(encodedContract)) : ''

  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })

  // -- UI (TEMPORARY) FILTER STATES --
  const [uiEnableDateFilter, setUiEnableDateFilter] = useState(false)
  const [uiStartDate, setUiStartDate] = useState(new Date())
  const [uiEndDate, setUiEndDate] = useState(new Date())
  const [uiCustomer, setUiCustomer] = useState(decodedCustomerId)
  const [uiContract, setUiContract] = useState(decodedContractId)
  const [uiTechnician, setUiTechnician] = useState('')
  const [uiSupervisor, setUiSupervisor] = useState('')
  const [uiStatus, setUiStatus] = useState('')
  const [uiAppointment, setUiAppointment] = useState('')
  const [uiSearch, setUiSearch] = useState('')
  const [deleteDialog, setDeleteDialog] = useState({ open: false, row: null })
  const [editDialog, setEditDialog] = useState({ open: false, row: null, details: null, loading: false })

  // -- APPLIED FILTER STATES (Triggers API) --
  const [appliedFilters, setAppliedFilters] = useState({
    enableDate: false,
    start: new Date(),
    end: new Date(),
    customer: decodedCustomerId,
    contract: decodedContractId,
    technician: '',
    supervisor: '',
    status: '',
    appointment: '',
    search: ''
  })

  // refs
  const techRef = useRef(null)
  const contractRef = useRef(null)

  // Lazy init Contract Options from URL
  const [contractOptions, setContractOptions] = useState(() => {
    const contractId = searchParams.get('contract')
    const contractCode = searchParams.get('contractCode')
    return contractId && contractCode ? [{ id: Number(contractId), label: contractCode }] : []
  })

  // Lazy init Customer Options from URL
  const [customerOptions, setCustomerOptions] = useState(() => {
    const custId = searchParams.get('customer')
    const custName = searchParams.get('customerName')
    return custId && custName ? [{ id: Number(custId), label: custName }] : []
  })
  const [technicianOptions, setTechnicianOptions] = useState([])
  const [supervisorOptions, setSupervisorOptions] = useState([])
  const [attendanceOptions, setAttendanceOptions] = useState([])
  const [summaryData, setSummaryData] = useState([])

  // ... (existing imports)

  const loadReportDropdownData = async () => {
    try {
      const res = await getReportDropdowns()
      const dd = res?.data?.data || {}

      const customerList = dd?.customer?.name || []
      const technicianList = dd?.technician?.name || []
      const supervisorList = dd?.supervisor?.name || []

      const attendanceList = dd?.attendance?.label || []

      let formattedCustomers = customerList.map(c => ({ id: c.id, label: c.name || '' }))

      // 🔥 PERSIST URL OPTION (Customer)
      const urlCustId = searchParams.get('customer')
      const urlCustName = searchParams.get('customerName')

      if (urlCustId && urlCustName) {
        const exists = formattedCustomers.find(c => String(c.id) === String(urlCustId))
        if (!exists) {
          formattedCustomers.push({ id: Number(urlCustId), label: urlCustName })
        }
      }

      setCustomerOptions(formattedCustomers)
      setTechnicianOptions(technicianList.map(t => ({ id: t.id, label: t.name || '' })))
      setSupervisorOptions(supervisorList.map(s => ({ id: s.id, label: s.name || '' })))
      setAttendanceOptions(attendanceList.map(a => ({ id: a.id, label: a.label || '' })))
    } catch (err) {
      console.error('Report dropdown fetch failed:', err)
      showToast('error', 'Failed to load dropdowns')
    }
  }

  // ───────────────────────────────────────────
  // 🔥 URL Params for Redirection handled in Lazy State Init
  // ───────────────────────────────────────────

  useEffect(() => {
    fetchTicketsFromApi()
  }, [pagination.pageIndex, pagination.pageSize, appliedFilters])

  useEffect(() => {
    loadReportDropdownData()
  }, [])

  const handleEdit = async row => {
    setEditDialog({ open: true, row, details: null, loading: true })
    try {
      const details = await getTicketDetails(row.id)
      // EXTRACT DATA SAFELY
      const actualData = details?.data || details
      setEditDialog(prev => ({ ...prev, details: actualData, loading: false }))
    } catch (err) {
      console.error(err)
      showToast('error', 'Failed to load ticket details')
      setEditDialog(prev => ({ ...prev, loading: false }))
    }
  }

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
              {/* <IconButton size='small' onClick={() => router.push(`/admin/contracts/${item.id}/view`)}>
                <i className='tabler-eye text-gray-600 text-[18px]' />
              </IconButton> */}

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
        sortingFn: dateSortingFn,
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

      if (appliedFilters.customer) params.customer_id = appliedFilters.customer
      if (appliedFilters.contract) params.contract_id = appliedFilters.contract
      if (appliedFilters.technician) params.technician_id = appliedFilters.technician
      if (appliedFilters.supervisor) params.supervisor_id = appliedFilters.supervisor
      if (appliedFilters.status) params.ticket_status = appliedFilters.status
      if (appliedFilters.appointment) params.ticket_type = appliedFilters.appointment

      if (appliedFilters.enableDate && appliedFilters.start && appliedFilters.end) {
        params.from_date = format(appliedFilters.start, 'yyyy-MM-dd')
        params.to_date = format(appliedFilters.end, 'yyyy-MM-dd')
      }

      if (appliedFilters.search?.trim()) params.search = appliedFilters.search.trim()

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

      // Calculate summary stats (example - ideally from separate API or full fetch)
      // This is a POC for summary cards. In production, use backend metrics.
      const summaryStats = [
        { title: 'Total Requests', value: total, icon: 'tabler-file-report', color: '#7367f0' },
        {
          title: 'Completed',
          value: mapped.filter(t => t.status === 'Completed').length,
          icon: 'tabler-circle-check',
          color: '#28c76f'
        },
        {
          title: 'Pending',
          value: mapped.filter(t => t.status === 'Pending').length,
          icon: 'tabler-clock',
          color: '#ff9f43'
        },
        {
          title: 'Cancelled',
          value: mapped.filter(t => t.status === 'Cancelled').length,
          icon: 'tabler-circle-x',
          color: '#ea5455'
        }
      ]
      setSummaryData(summaryStats)

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
      if (!uiCustomer) {
        setContractOptions([])
        setUiContract('')
        return
      }

      try {
        const res = await getReportDropdowns({ customer_id: uiCustomer })

        const dd = res?.data?.data || {}
        const list = dd?.contract_list?.label || [] // ⭐ backend key

        let formattedContracts = list.map(c => ({
          id: c.id,
          label: c.label || ''
        }))

        // 🔥 URL contract persistence
        const urlContractCode = searchParams.get('contractCode')

        if (decodedContractId && urlContractCode && uiCustomer === decodedCustomerId) {
          const exists = formattedContracts.find(c => c.id === decodedContractId)

          if (!exists) {
            formattedContracts.push({
              id: decodedContractId,
              label: urlContractCode
            })
          }
        }

        // ✅ set dropdown options
        setContractOptions(formattedContracts)

        // 🔥 AUTO APPLY CONTRACT FILTER (IMPORTANT)
        if (decodedContractId && uiCustomer === decodedCustomerId) {
          setUiContract(decodedContractId)
          // Also set in applied if it's initial load from URL
          setAppliedFilters(prev => ({ ...prev, contract: decodedContractId }))
        }
      } catch (err) {
        console.error('Contract fetch failed:', err)
        setContractOptions([])
      }
    }

    fetchContractByCustomer()
  }, [uiCustomer, decodedContractId, decodedCustomerId])

  // react-table
  const table = useReactTable({
    data: rows,
    columns,

    manualPagination: true,
    pageCount: Math.ceil(rowCount / pagination.pageSize),

    state: {
      pagination
    },

    onPaginationChange: setPagination,

    getCoreRowModel: getCoreRowModel(),
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
    <StickyListLayout
      header={
        <Box sx={{ mb: 2 }}>
          <Box role='presentation' sx={{ mb: 2 }}>
            <Breadcrumbs aria-label='breadcrumb'>
              <Link underline='hover' color='inherit' href='/'>
                Home
              </Link>
              <Typography color='text.primary'>Service Request</Typography>
            </Breadcrumbs>
          </Box>

          {summaryData.length > 0 && <SummaryCards data={summaryData} />}
        </Box>
      }
    >
      <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, position: 'relative' }}>
        <CardHeader
          title={
            <Box display='flex' alignItems='center' gap={2}>
              <Typography variant='h5' fontWeight={600}>
                Service Request
              </Typography>

              <Button
                variant='contained'
                startIcon={<RefreshIcon />}
                onClick={() => {
                  setPagination({ pageIndex: 0, pageSize: pagination.pageSize })
                  setAppliedFilters({
                    enableDate: uiEnableDateFilter,
                    start: uiStartDate,
                    end: uiEndDate,
                    customer: uiCustomer,
                    contract: uiContract,
                    technician: uiTechnician,
                    supervisor: uiSupervisor,
                    status: uiStatus,
                    appointment: uiAppointment,
                    search: uiSearch
                  })
                }}
                sx={{ textTransform: 'none' }}
              >
                Refresh
              </Button>
            </Box>
          }
          action={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {canAccess('Service Request', 'create') && (
                <Button variant='contained' startIcon={<AddIcon />} sx={{ textTransform: 'none' }}>
                  Global Change
                </Button>
              )}
            </Box>
          }
        />

        <Divider />

        <Box sx={{ p: 4, flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              mb: 3,
              flexWrap: 'wrap',
              flexShrink: 0
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <FormControlLabel
                control={
                  <Checkbox checked={uiEnableDateFilter} onChange={e => setUiEnableDateFilter(e.target.checked)} />
                }
                label='Date Filter'
                sx={{ mb: -0.5 }}
              />
              <Box sx={{ width: 220 }}>
                <GlobalDateRange
                  start={uiStartDate}
                  end={uiEndDate}
                  onSelectRange={({ start, end }) => {
                    setUiStartDate(start)
                    setUiEndDate(end)
                  }}
                  disabled={!uiEnableDateFilter}
                />
              </Box>
            </Box>

            <CustomAutocomplete
              options={customerOptions}
              value={customerOptions.find(o => o.id === uiCustomer) || null}
              getOptionLabel={option => option?.label || ''}
              getOptionKey={option => option?.id}
              isOptionEqualToValue={(o, v) => o.id === v?.id}
              onChange={(_, v) => {
                const id = v?.id || ''
                setUiCustomer(id)
                setUiContract('')
              }}
              renderInput={params => (
                <CustomTextField
                  {...params}
                  label='Customer'
                  size='small'
                  sx={{ width: 200 }}
                  placeholder='Select customer...'
                />
              )}
            />

            <CustomAutocomplete
              options={contractOptions}
              value={contractOptions.find(o => o.id === uiContract) || null}
              getOptionLabel={option => option?.label || ''}
              getOptionKey={option => option?.id}
              isOptionEqualToValue={(o, v) => o.id === v?.id}
              onChange={(_, v) => setUiContract(v?.id || '')}
              renderInput={params => (
                <CustomTextField
                  {...params}
                  label='Contract'
                  size='small'
                  sx={{ width: 200 }}
                  placeholder='Select contract...'
                />
              )}
            />

            <CustomAutocomplete
              options={technicianOptions}
              value={technicianOptions.find(o => o.id === uiTechnician) || null}
              onChange={(_, v) => setUiTechnician(v?.id || '')}
              getOptionLabel={option => option?.label || ''}
              renderInput={params => (
                <CustomTextField
                  {...params}
                  label='Technician'
                  size='small'
                  sx={{ width: 180 }}
                  placeholder='Select Technician...'
                />
              )}
            />

            <CustomAutocomplete
              options={supervisorOptions}
              value={supervisorOptions.find(o => o.id === uiSupervisor) || null}
              onChange={(_, v) => setUiSupervisor(v?.id || '')}
              getOptionLabel={option => option?.label || ''}
              renderInput={params => (
                <CustomTextField
                  {...params}
                  label='Supervisor'
                  size='small'
                  sx={{ width: 180 }}
                  placeholder='Select Supervisor...'
                />
              )}
            />

            <CustomAutocomplete
              options={appointmentStatusList}
              value={appointmentStatusList.find(o => o.id === uiStatus) || null}
              onChange={(_, v) => setUiStatus(v?.id || '')}
              getOptionLabel={option => option?.label || ''}
              renderInput={params => (
                <CustomTextField
                  {...params}
                  label='Status'
                  size='small'
                  sx={{ width: 180 }}
                  placeholder='Select Status...'
                />
              )}
            />

            <CustomAutocomplete
              options={appointmentList}
              value={appointmentList.find(o => o.id === uiAppointment) || null}
              onChange={(_, v) => setUiAppointment(v?.id || '')}
              getOptionLabel={option => option?.label || ''}
              renderInput={params => (
                <CustomTextField
                  {...params}
                  label='Appointment'
                  size='small'
                  sx={{ width: 180 }}
                  placeholder='Select Appointment...'
                />
              )}
            />
          </Box>

          <Divider sx={{ mb: 2 }} />

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 2,
              mb: 2,
              flexWrap: 'wrap',
              flexShrink: 0
            }}
          >
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
                      b === 'CSV'
                        ? exportCSV
                        : b === 'Print'
                          ? exportPrint
                          : () => showToast('info', `${b} coming soon`)
                    }
                    sx={{ bgcolor: '#6c757d', color: '#fff', textTransform: 'none' }}
                  >
                    {b}
                  </Button>
                ))}
              </Box>
            </Box>

            <TextField
              size='small'
              placeholder='Search any field...'
              value={uiSearch}
              onChange={e => {
                setUiSearch(e.target.value)
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

          <Box sx={{ position: 'relative', flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            {loading && (
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  bgcolor: 'rgba(255,255,255,0.7)',
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
                              asc: <ChevronRight fontSize='1.25rem' className='-rotate-90' />,
                              desc: <ChevronRight fontSize='1.25rem' className='rotate-90' />
                            }[h.column.getIsSorted()] ?? null}
                          </div>
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {rows.length > 0 ? (
                    table.getRowModel().rows.map(row => (
                      <tr key={row.id}>
                        {row.getVisibleCells().map(cell => (
                          <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={columns.length} className='text-center py-6'>
                        {loading ? 'Fetching report list...' : 'No results found'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </StickyTableWrapper>
          </Box>
          <Box sx={{ mt: 'auto', pt: 2, flexShrink: 0 }}>
            <TablePaginationComponent totalCount={rowCount} pagination={pagination} setPagination={setPagination} />
          </Box>
        </Box>
      </Card>

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
            sx={{ position: 'absolute', right: 3, top: 2 }}
          >
            <i className='tabler-x' />
          </DialogCloseButton>
        </DialogTitle>

        <DialogContent sx={{ px: 5, pt: 1 }}>
          <Typography sx={{ color: 'text.secondary', fontSize: 14, lineHeight: 1.6 }}>
            Are you sure you want to delete{' '}
            <strong style={{ color: '#d32f2f' }}>{deleteDialog.row?.name || 'this incident'}</strong>?
            <br />
            This action cannot be undone.
          </Typography>
        </DialogContent>

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

      {/* Edit Dialog */}
      <Dialog
        onClose={() => setEditDialog({ open: false, row: null })}
        aria-labelledby='edit-dialog-title'
        open={editDialog.open}
        maxWidth='xl'
        fullWidth
        scroll='paper'
        closeAfterTransition={false}
        PaperProps={{ sx: { overflow: 'visible' } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant='h5' component='span' fontWeight={600}>
            Service Request Details
          </Typography>
          <DialogCloseButton onClick={() => setEditDialog({ open: false, row: null })} disableRipple>
            <i className='tabler-x' />
          </DialogCloseButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 6 }}>
          {editDialog.loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <ProgressCircularCustomization size={40} />
            </Box>
          ) : editDialog.details ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, pt: 2 }}>
              {/* SECTION 1: DATES & TIMES */}
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3 }}>
                <CustomTextField
                  fullWidth
                  label='Scheduled Date'
                  value={editDialog.details.schedule_date || ''}
                  InputProps={{ readOnly: true }}
                />
                <CustomTextField
                  fullWidth
                  label='Start Time'
                  value={editDialog.details.schedule_start_time || ''}
                  InputProps={{ readOnly: true }}
                />
                <CustomTextField
                  fullWidth
                  label='End Time'
                  value={editDialog.details.schedule_end_time || ''}
                  InputProps={{ readOnly: true }}
                />

                <CustomTextField
                  fullWidth
                  label='Appointment Date'
                  value={editDialog.details.ticket_date || ''}
                  InputProps={{ readOnly: true }}
                />
                <CustomTextField
                  fullWidth
                  label='Start Time'
                  value={editDialog.details.start_time || ''}
                  InputProps={{ readOnly: true }}
                />
                <CustomTextField
                  fullWidth
                  label='End Time'
                  value={editDialog.details.end_time || ''}
                  InputProps={{ readOnly: true }}
                />

                <CustomTextField
                  fullWidth
                  label='Actual Start Time'
                  value={editDialog.details.actual_start_time || ''}
                  InputProps={{ readOnly: true }}
                />
                <CustomTextField
                  fullWidth
                  label='Actual End Time'
                  value={editDialog.details.actual_end_time || ''}
                  InputProps={{ readOnly: true }}
                />
                <CustomTextField
                  fullWidth
                  label='Appointment Status'
                  value={editDialog.details.ticket_status || ''}
                  InputProps={{ readOnly: true }}
                />
              </Box>

              {/* SECTION 2: STATUS & TYPE */}
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3 }}>
                <CustomTextField
                  fullWidth
                  multiline
                  rows={2}
                  label='Action'
                  value={editDialog.details.action || ''}
                  InputProps={{ readOnly: true }}
                />
                <CustomTextField
                  fullWidth
                  multiline
                  rows={2}
                  label='Findings'
                  value={editDialog.details.finding || ''}
                  InputProps={{ readOnly: true }}
                />
                <CustomTextField
                  fullWidth
                  multiline
                  rows={2}
                  label='Recommendation'
                  value={editDialog.details.recommendation || ''}
                  InputProps={{ readOnly: true }}
                />
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                <CustomTextField
                  fullWidth
                  label='Call Type'
                  value={editDialog.details.ticket_type || ''}
                  InputProps={{ readOnly: true }}
                />
                <CustomTextField
                  fullWidth
                  multiline
                  rows={2}
                  label='Special note for Technician (this service)'
                  value={editDialog.details.instructions || ''}
                  InputProps={{ readOnly: true }}
                />
              </Box>

              {/* SECTION 3: REMARKS */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                <CustomTextField
                  fullWidth
                  multiline
                  rows={2}
                  label='Appointment Remarks (this service)'
                  value={editDialog.details.remarks || ''}
                  InputProps={{ readOnly: true }}
                />
                <Box /> {/* Spacer */}
                <CustomTextField
                  fullWidth
                  multiline
                  rows={2}
                  label='Appointment Remarks (From Contract)'
                  value={editDialog.details.contract_remarks || ''}
                  InputProps={{ readOnly: true }}
                />
                <CustomTextField
                  fullWidth
                  multiline
                  rows={2}
                  label='Technician Remarks (From Contract)'
                  value={editDialog.details.contract_tech_remarks || ''} // Check field name if possible
                  InputProps={{ readOnly: true }}
                />
              </Box>

              <Divider />

              {/* SECTION 4: PEST DETAILS TABLE */}
              <Box>
                <Typography variant='h6' sx={{ mb: 2, fontWeight: 600 }}>
                  PEST DETAILS
                </Typography>
                <Box sx={{ overflowX: 'auto', border: '1px solid #eee', borderRadius: 1 }}>
                  <table className={styles.table} style={{ minWidth: '100%' }}>
                    <thead style={{ background: '#f9f9f9' }}>
                      <tr>
                        <th style={{ padding: '8px' }}>ID</th>
                        <th style={{ padding: '8px' }}>Pest</th>
                        <th style={{ padding: '8px' }}>Frequency</th>
                        <th style={{ padding: '8px' }}>Pest Value</th>
                        <th style={{ padding: '8px' }}>Purpose</th>
                        <th style={{ padding: '8px' }}>Count</th>
                        <th style={{ padding: '8px' }}>Level</th>
                        <th style={{ padding: '8px' }}>Chemicals</th>
                        <th style={{ padding: '8px' }}>Work Time(Hrs)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(editDialog.details.ref_job_pests || []).length > 0 ? (
                        editDialog.details.ref_job_pests.map((pest, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #f0f0f0' }}>
                            <td style={{ padding: '8px' }}>{idx + 1}</td>
                            <td style={{ padding: '8px' }}>{pest.pest_name}</td>
                            <td style={{ padding: '8px' }}>{pest.frequency}</td>
                            <td style={{ padding: '8px' }}>{pest.pest_value}</td>
                            <td style={{ padding: '8px' }}>{pest.purpose}</td>
                            <td style={{ padding: '8px' }}>{pest.pest_count}</td>
                            <td style={{ padding: '8px' }}>{pest.infestation_level}</td>
                            <td style={{ padding: '8px' }}>
                              {pest.ref_job_chemical?.map(c => c.chemical_name).join(', ') || ''}
                            </td>
                            <td style={{ padding: '8px' }}>{pest.time_spent}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={9} style={{ padding: '12px', textAlign: 'center' }}>
                            No pest details found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </Box>
              </Box>

              {/* SECTION 5: TECHNICIAN DETAILS TABLE */}
              <Box>
                <Typography variant='h6' sx={{ mb: 2, fontWeight: 600 }}>
                  TECHNICIAN DETAILS
                </Typography>
                <Box sx={{ overflowX: 'auto', border: '1px solid #eee', borderRadius: 1 }}>
                  <table className={styles.table} style={{ minWidth: '100%' }}>
                    <thead style={{ background: '#f9f9f9' }}>
                      <tr>
                        <th style={{ padding: '8px' }}>ID</th>
                        <th style={{ padding: '8px' }}>Technician</th>
                        <th style={{ padding: '8px' }}>Productivity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(editDialog.details.job_allocations || []).length > 0 ? (
                        editDialog.details.job_allocations.map((tech, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #f0f0f0' }}>
                            <td style={{ padding: '8px' }}>{idx + 1}</td>
                            <td style={{ padding: '8px' }}>{tech.employee_name}</td>
                            <td style={{ padding: '8px' }}>{tech.productivity_value || tech.productivity}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} style={{ padding: '12px', textAlign: 'center' }}>
                            No technician details found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </Box>
              </Box>
            </Box>
          ) : (
            <Typography sx={{ p: 4, textAlign: 'center' }}>No details available</Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 6 }}>
          <Button onClick={() => setEditDialog({ open: false, row: null })} variant='tonal' color='secondary'>
            Close
          </Button>
          <Button onClick={() => setEditDialog({ open: false, row: null })} variant='contained'>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </StickyListLayout>
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
