'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { format, isValid, parseISO, startOfDay, endOfDay, isWithinInterval } from 'date-fns'
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
  Checkbox,
  Chip
} from '@mui/material'

import PermissionGuard from '@/components/auth/PermissionGuard'
import { usePermission } from '@/hooks/usePermission'
import StickyListLayout from '@/components/common/StickyListLayout'
import StickyTableWrapper from '@/components/common/StickyTableWrapper'
import TablePaginationComponent from '@/components/TablePaginationComponent'

import { getTicketReportList, getReportDropdowns } from '@/api/service_group/service_request/report'
import { getTicketDetails, addTicket, updateTicket, deleteTicket, searchTicket } from '@/api/service_group/ticket'
import {
  addTicketPest,
  updateTicketPest,
  deleteTicketPest,
  addTicketTechnician,
  updateTicketTechnician,
  deleteTicketTechnician
} from '@/api/service_group/ticket'
import { getPestList } from '@/api/master/pest/list'
import { getServiceFrequencyList } from '@/api/master/serviceFrequency/list'

import RefreshIcon from '@mui/icons-material/Refresh'
import SearchIcon from '@mui/icons-material/Search'
import AddIcon from '@mui/icons-material/Add'
import GlobalDateRange from '@/components/common/GlobalDateRange'
import PresetDateRangePicker from '@/components/common/PresetDateRangePicker'

import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'

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

  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 })

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
  const [pestModal, setPestModal] = useState({ open: false, mode: 'add', index: null, data: {} })
  const [techModal, setTechModal] = useState({ open: false, mode: 'add', index: null, data: {} })
  const [deleteDialogNested, setDeleteDialogNested] = useState({ open: false, type: 'pest', index: null })

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
  const filterTimeoutRef = useRef(null)

  // No changes needed here, just removing the reactive effects

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
  const [pestOptions, setPestOptions] = useState([])
  const [frequencyOptions, setFrequencyOptions] = useState([])
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

      // Fetch Pests
      const pestRes = await getPestList()
      const pests = pestRes?.data?.data?.results || pestRes?.data?.results || []
      setPestOptions(pests.map(p => ({ id: p.id, label: p.pest_name || p.name || '' })))

      // Fetch Frequencies
      const freqRes = await getServiceFrequencyList()
      const freqs = freqRes?.data?.data?.results || freqRes?.data?.results || freqRes?.results || []
      setFrequencyOptions(freqs.map(f => ({ id: f.id, label: f.service_frequency || f.name || '' })))
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

  const safeParseDate = dateStr => {
    if (!dateStr || dateStr.startsWith('0011') || dateStr.startsWith('0000')) return null
    try {
      const date = parseISO(dateStr)
      return isValid(date) ? date : null
    } catch (e) {
      return null
    }
  }

  const fetchTicketDetails = async id => {
    try {
      const res = await getTicketDetails(id)
      const actualData = res?.data || res
      const details = {
        ...actualData,
        pest_items: actualData.pest_items || actualData.ref_job_pests || actualData.ref_ticket_pests || [],
        job_allocations:
          actualData.job_allocations ||
          actualData.technician_items ||
          actualData.ref_job_technicians ||
          actualData.ref_ticket_technicians ||
          []
      }
      setEditDialog(prev => ({ ...prev, details, loading: false }))
    } catch (err) {
      console.error(err)
      showToast('error', 'Failed to load ticket details')
      setEditDialog(prev => ({ ...prev, loading: false }))
    }
  }

  const handleEdit = async row => {
    setEditDialog({ open: true, row, details: null, loading: true })
    fetchTicketDetails(row.id)
  }

  const deletePestRow = index => {
    const item = editDialog.details.pest_items[index]
    setDeleteDialogNested({ open: true, type: 'pest', index, id: item?.id })
  }

  const deleteTechRow = index => {
    const item = editDialog.details.job_allocations[index]
    setDeleteDialogNested({ open: true, type: 'tech', index, id: item?.id })
  }

  const handleConfirmDeleteNested = async () => {
    const { type, id } = deleteDialogNested
    if (!id) {
      // Local removal if ID doesn't exist (shouldn't happen with direct CRUD but good to have)
      const field = type === 'pest' ? 'pest_items' : 'job_allocations'
      const newItems = [...editDialog.details[field]]
      newItems.splice(deleteDialogNested.index, 1)
      setEditDialog(prev => ({ ...prev, details: { ...prev.details, [field]: newItems } }))
      setDeleteDialogNested({ open: false, type: 'pest', index: null, id: null })
      return
    }

    try {
      setLoading(true)
      if (type === 'pest') {
        await deleteTicketPest(id)
      } else {
        await deleteTicketTechnician(id)
      }
      showToast('success', `${type === 'pest' ? 'Pest' : 'Technician'} deleted successfully`)
      fetchTicketDetails(editDialog.row.id)
    } catch (err) {
      console.error(err)
      showToast('error', `Failed to delete ${type}`)
    } finally {
      setLoading(false)
      setDeleteDialogNested({ open: false, type: 'pest', index: null, id: null })
    }
  }

  const addPestRow = () => {
    setPestModal({ open: true, mode: 'add', index: null, data: { pest_id: '', frequency_id: '' } })
  }

  const addTechRow = () => {
    setTechModal({ open: true, mode: 'add', index: null, data: { technician_id: '', is_attachment_technician: 0 } })
  }

  const handleEditPest = (pest, index) => {
    setPestModal({ open: true, mode: 'edit', index, data: { ...pest } })
  }

  const handleEditTech = (tech, index) => {
    setTechModal({ open: true, mode: 'edit', index, data: { ...tech } })
  }

  const handleSavePestModal = async () => {
    try {
      setLoading(true)
      const ticket_id = editDialog.details.id
      const p = pestModal.data

      const payload = {
        ticket_id: Number(ticket_id),
        pest_id: Number(p.pest_id),
        frequency_id: Number(p.frequency_id),
        pest_value: Number(p.pest_value || 0),
        work_time: String(p.work_time || '0'),
        pest_purpose: p.pest_purpose || 'Routine',
        pest_count: Number(p.pest_count || 0),
        pest_level: p.pest_level || 'Low',
        chemical_used: p.chemical_used || '',
        ticket_pest_action: p.ticket_pest_action || '',
        ticket_pest_recommendation: p.ticket_pest_recommendation || ''
      }

      if (pestModal.mode === 'add') {
        await addTicketPest(payload)
      } else {
        await updateTicketPest(pestModal.data.id, payload)
      }

      showToast('success', `Pest ${pestModal.mode === 'add' ? 'added' : 'updated'} successfully`)
      fetchTicketDetails(ticket_id)
      setPestModal({ open: false, mode: 'add', index: null, data: {} })
    } catch (err) {
      console.error(err)
      showToast('error', `Failed to ${pestModal.mode} pest`)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveTechModal = async () => {
    try {
      setLoading(true)
      const ticket_id = editDialog.details.id
      const t = techModal.data

      const payload = {
        ticket_id: Number(ticket_id),
        technician_id: Number(t.technician_id),
        production_value: Number(t.production_value || 0),
        is_attachment_technician: t.is_attachment_technician ? 1 : 0
      }

      if (techModal.mode === 'add') {
        await addTicketTechnician(payload)
      } else {
        await updateTicketTechnician(techModal.data.id, payload)
      }

      showToast('success', `Technician ${techModal.mode === 'add' ? 'added' : 'updated'} successfully`)
      fetchTicketDetails(ticket_id)
      setTechModal({ open: false, mode: 'add', index: null, data: {} })
    } catch (err) {
      console.error(err)
      showToast('error', `Failed to ${techModal.mode} technician`)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      const d = editDialog.details
      if (!d) return

      setLoading(true)

      const payload = {
        ...d,
        schedule_date: d.schedule_date,
        schedule_start_time: d.schedule_start_time,
        schedule_end_time: d.schedule_end_time,
        remarks: d.remarks || '',
        instructions: d.instructions || '',
        action: d.action || '',
        findings: d.findings || d.finding || '',
        recommendation: d.recommendation || '',
        pest_items: (d.pest_items || []).map(p => ({
          id: p.id || null,
          pest_id: p.pest_id || (typeof p.id === 'string' ? '' : p.id),
          frequency_id: p.frequency_id,
          pest_value: Number(p.pest_value || 0),
          work_time: String(p.work_time || '0'),
          pest_purpose: p.pest_purpose || 'Routine',
          pest_count: p.pest_count || 0,
          pest_level: p.pest_level || p.infestation_level || 'Low',
          chemical_used: p.chemical_used || '',
          ticket_pest_action: p.ticket_pest_action || p.action || '',
          ticket_pest_recommendation: p.ticket_pest_recommendation || p.recommendation || '',
          ticket_id: d.id
        })),
        technician_items: (d.job_allocations || []).map(j => ({
          id: j.id || null,
          technician_id: j.technician_id || (typeof j.id === 'string' ? '' : j.id),
          production_value: Number(j.production_value || j.productivity_value || j.productivity || 0),
          is_attachment_technician: j.is_attachment_technician || j.is_attachment ? 1 : 0,
          ticket_id: d.id
        }))
      }

      // Clean payload of read-only keys and file fields from details API
      delete payload.ref_job_pests
      delete payload.job_allocations
      delete payload.finding // Use findings
      delete payload.file_name
      delete payload.customer_signature
      delete payload.technician_signature

      const res = await updateTicket(d.id, payload)
      showToast('success', res?.message || 'Ticket updated successfully')
      setEditDialog({ open: false, row: null, details: null, loading: false })
      fetchTicketsFromApi()
    } catch (err) {
      console.error(err)
      showToast('error', err?.response?.data?.message || 'Failed to update ticket')
    } finally {
      setLoading(false)
    }
  }

  const confirmDelete = async () => {
    try {
      const id = deleteDialog.row?.id
      if (!id) return

      setLoading(true)

      const res = await deleteTicket({ id }) // Use consolidated deleteTicket API

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
                <IconButton size='small' color='primary' onClick={() => handleEdit(item)}>
                  <i className='tabler-edit ' />
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
        cell: info => {
          const val = info.getValue()
          if (!val) return ''
          const d = new Date(val)
          if (!isValid(d) || d.getFullYear() < 1900) return ''
          return format(d, 'dd/MM/yyyy')
        }
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
      columnHelper.accessor('scheduleStatus', {
        header: 'Schedule Status',
        cell: info => {
          const s = info.getValue()
          const color = s === 'Allocated' ? 'info' : 'secondary'

          return (
            <Chip label={s} color={color} size='small' variant='tonal' sx={{ fontWeight: 600, borderRadius: '6px' }} />
          )
        }
      }),
      columnHelper.accessor('appointmentStatus', {
        header: 'Appointment Status',
        cell: info => {
          const s = info.getValue() || 'Pending'

          let color = 'secondary'
          const sUpper = s.toUpperCase()
          if (['COMPLETED', 'DONE'].includes(sUpper)) color = 'success'
          else if (['PENDING', 'NOT STARTED', 'UNALLOCATED', 'NOT UPLOADED'].includes(sUpper)) color = 'warning'
          else if (['CANCELLED'].includes(sUpper)) color = 'error'
          else if (['SCHEDULED', 'ALLOCATED', 'OPEN', 'IN-PROGRESS', 'PAUSED'].includes(sUpper)) color = 'info'

          return (
            <Chip label={s} color={color} size='small' variant='tonal' sx={{ fontWeight: 600, borderRadius: '6px' }} />
          )
        }
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: info => {
          const s = info.getValue() || 'Pending'

          let color = 'secondary'
          const sUpper = s.toUpperCase()
          if (['COMPLETED', 'DONE'].includes(sUpper)) color = 'success'
          else if (['PENDING', 'NOT STARTED', 'UNALLOCATED', 'NOT UPLOADED'].includes(sUpper)) color = 'warning'
          else if (['CANCELLED'].includes(sUpper)) color = 'error'
          else if (['SCHEDULED', 'ALLOCATED', 'OPEN', 'IN-PROGRESS', 'PAUSED'].includes(sUpper)) color = 'info'

          return (
            <Chip label={s} color={color} size='small' variant='tonal' sx={{ fontWeight: 600, borderRadius: '6px' }} />
          )
        }
      })
    ],
    []
  )

  const mapTicketToRow = ticket => {
    // 🔥 DATE LOGIC: Prioritize schedule_date but ignore if it's a placeholder (0011, etc.)
    let rawDate = ticket.schedule_date || ticket.ticket_date || ''
    const isBad = d => !d || d.includes('0011') || d.includes('1970') || d.includes('00-00') || d.startsWith('00')

    if (isBad(ticket.schedule_date) && !isBad(ticket.ticket_date)) {
      rawDate = ticket.ticket_date
    }

    let scheduleDate = rawDate
    // Convert DD-MM-YYYY → YYYY-MM-DD (e.g. 30-10-2025 -> 2025-10-30)
    if (scheduleDate && scheduleDate.includes('-')) {
      const parts = scheduleDate.split('-')
      if (parts.length === 3 && parts[2].length === 4) {
        scheduleDate = `${parts[2]}-${parts[1]}-${parts[0]}`
      }
    }

    const dateObj = new Date(scheduleDate)
    const valid = isValid(dateObj) && dateObj.getFullYear() > 1900

    return {
      id: ticket.id,
      scheduleDate: valid ? format(dateObj, 'yyyy-MM-dd') : null,
      day: valid ? format(dateObj, 'EEE') : '',
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
      if (appliedFilters.technician) params.employee_id = appliedFilters.technician
      if (appliedFilters.supervisor) params.supervisor_id = appliedFilters.supervisor
      if (appliedFilters.status) params.ticket_status = appliedFilters.status
      if (appliedFilters.appointment) params.ticket_type = appliedFilters.appointment

      if (appliedFilters.search?.trim()) params.search = appliedFilters.search.trim()
      // Removed backend date params

      console.log('Ticket Params =>', params)

      const res = await getTicketReportList(params)
      // 🔥 ROBUST COUNT & DATA MAPPING
      const list = res?.data?.results || res?.results || res?.data?.data?.results || []
      const total = Number(res?.count ?? res?.data?.count ?? list.length ?? 0)

      console.log('Ticket API Payload:', params)
      console.log('Ticket API Response:', { listLength: list.length, totalCount: total, raw: res })

      const mapped = list.map(mapTicketToRow)

      // Frontend Date Filtering
      let filteredList = mapped
      if (appliedFilters.enableDate && appliedFilters.start && appliedFilters.end) {
        const startDate = startOfDay(appliedFilters.start)
        const endDate = endOfDay(appliedFilters.end)
        filteredList = mapped.filter(t => {
          if (!t.scheduleDate) return false
          return isWithinInterval(parseISO(t.scheduleDate), { start: startDate, end: endDate })
        })
      }

      const startIndex = pagination.pageIndex * pagination.pageSize
      const withSno = filteredList.map((item, index) => ({
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
      <Card sx={{ display: 'flex', flexDirection: 'column', maxHeight: '100%', minHeight: 0, position: 'relative' }}>
        <CardHeader
          title={
            <Box display='flex' alignItems='center' gap={2}>
              <Typography variant='h5' fontWeight={600}>
                Service Request
              </Typography>
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
              alignItems: 'flex-end', // ⭐ KEY FIX
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
                <PresetDateRangePicker
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
              isOptionEqualToValue={(o, v) => String(o?.id) === String(v?.id)}
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
              isOptionEqualToValue={(o, v) => String(o?.id) === String(v?.id)}
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
              isOptionEqualToValue={(o, v) => String(o?.id) === String(v?.id)}
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
              isOptionEqualToValue={(o, v) => String(o?.id) === String(v?.id)}
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

            <GlobalButton
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
            </GlobalButton>
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
                  {[25, 50, 75, 100].map(s => (
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
                  {loading ? (
                    <tr>
                      <td colSpan={columns.length} className='text-center py-6'>
                        Loading...
                      </td>
                    </tr>
                  ) : rows.length > 0 ? (
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
                        No results found
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
            disabled={loading}
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
          {editDialog.details ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, pt: 2 }}>
              {/* SECTION 1: SCHEDULED TIMES */}
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3 }}>
                <Box>
                  <AppReactDatepicker
                    selected={safeParseDate(editDialog.details.schedule_date)}
                    onChange={date =>
                      setEditDialog(prev => ({
                        ...prev,
                        details: { ...prev.details, schedule_date: date ? format(date, 'yyyy-MM-dd') : '' }
                      }))
                    }
                    placeholderText='Select Scheduled Date'
                    customInput={<CustomTextField label='Scheduled Date' fullWidth />}
                  />
                </Box>
                <CustomTextField
                  fullWidth
                  label='Start Time'
                  type='time'
                  value={editDialog.details.schedule_start_time || ''}
                  onChange={e =>
                    setEditDialog(prev => ({
                      ...prev,
                      details: { ...prev.details, schedule_start_time: e.target.value }
                    }))
                  }
                  InputLabelProps={{ shrink: true }}
                />
                <CustomTextField
                  fullWidth
                  label='End Time'
                  type='time'
                  value={editDialog.details.schedule_end_time || ''}
                  onChange={e =>
                    setEditDialog(prev => ({
                      ...prev,
                      details: { ...prev.details, schedule_end_time: e.target.value }
                    }))
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Box>

              {/* SECTION 2: APPOINTMENT TIMES */}
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3 }}>
                <Box>
                  <AppReactDatepicker
                    selected={safeParseDate(editDialog.details.ticket_date)}
                    onChange={date =>
                      setEditDialog(prev => ({
                        ...prev,
                        details: { ...prev.details, ticket_date: date ? format(date, 'yyyy-MM-dd') : '' }
                      }))
                    }
                    placeholderText='Select Appointment Date'
                    customInput={<CustomTextField label='Appointment Date' fullWidth />}
                  />
                </Box>
                <CustomTextField
                  fullWidth
                  label='Start Time'
                  type='time'
                  value={editDialog.details.start_time || ''}
                  onChange={e =>
                    setEditDialog(prev => ({
                      ...prev,
                      details: { ...prev.details, start_time: e.target.value }
                    }))
                  }
                  InputLabelProps={{ shrink: true }}
                />
                <CustomTextField
                  fullWidth
                  label='End Time'
                  type='time'
                  value={editDialog.details.end_time || ''}
                  onChange={e =>
                    setEditDialog(prev => ({
                      ...prev,
                      details: { ...prev.details, end_time: e.target.value }
                    }))
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Box>

              {/* SECTION 3: ACTUAL TIMES & STATUS */}
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3 }}>
                <CustomTextField
                  fullWidth
                  label='Actual Start Time'
                  value={editDialog.details.actual_start_date_time || ''}
                  disabled
                  sx={{
                    '& .MuiInputBase-input.Mui-disabled': {
                      color: 'rgba(0, 0, 0, 0.87)',
                      WebkitTextFillColor: 'rgba(0, 0, 0, 0.87)'
                    },
                    '& .MuiInputLabel-root.Mui-disabled': { color: 'rgba(0, 0, 0, 0.6)' }
                  }}
                />
                <CustomTextField
                  fullWidth
                  label='Actual End Time'
                  value={editDialog.details.actual_end_date_time || ''}
                  disabled
                  sx={{
                    '& .MuiInputBase-input.Mui-disabled': {
                      color: 'rgba(0, 0, 0, 0.87)',
                      WebkitTextFillColor: 'rgba(0, 0, 0, 0.87)'
                    },
                    '& .MuiInputLabel-root.Mui-disabled': { color: 'rgba(0, 0, 0, 0.6)' }
                  }}
                />

                <CustomAutocomplete
                  options={appointmentStatusList}
                  value={appointmentStatusList.find(o => o.id === editDialog.details.ticket_status) || null}
                  onChange={(_, v) =>
                    setEditDialog(prev => ({ ...prev, details: { ...prev.details, ticket_status: v?.id || '' } }))
                  }
                  getOptionLabel={option => option?.label || ''}
                  renderInput={params => <CustomTextField {...params} label='Appointment Status' fullWidth />}
                />
              </Box>

              {/* SECTION 4: REMARKS & FINDINGS */}
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3 }}>
                <CustomTextField
                  fullWidth
                  multiline
                  rows={4}
                  label='Action'
                  value={editDialog.details.action || ''}
                  onChange={e =>
                    setEditDialog(prev => ({
                      ...prev,
                      details: { ...prev.details, action: e.target.value }
                    }))
                  }
                />
                <CustomTextField
                  fullWidth
                  multiline
                  rows={4}
                  label='Recommendation'
                  value={editDialog.details.recommendation || ''}
                  onChange={e =>
                    setEditDialog(prev => ({
                      ...prev,
                      details: { ...prev.details, recommendation: e.target.value }
                    }))
                  }
                />
                <CustomTextField
                  fullWidth
                  multiline
                  rows={4}
                  label='Incidents'
                  value={editDialog.details.findings || editDialog.details.finding || ''}
                  onChange={e =>
                    setEditDialog(prev => ({
                      ...prev,
                      details: { ...prev.details, findings: e.target.value }
                    }))
                  }
                />
              </Box>

              {/* SECTION 5: CALL TYPE & NOTES */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                <Box>
                  <CustomTextField
                    fullWidth
                    label='Call Type'
                    value={editDialog.details.ticket_type_name || editDialog.details.ticket_type || ''}
                    disabled
                    sx={{
                      mb: 4,
                      '& .MuiInputBase-input.Mui-disabled': {
                        color: 'rgba(0, 0, 0, 0.87)',
                        WebkitTextFillColor: 'rgba(0, 0, 0, 0.87)'
                      },
                      '& .MuiInputLabel-root.Mui-disabled': { color: 'rgba(0, 0, 0, 0.6)' }
                    }}
                  />

                  <CustomTextField
                    fullWidth
                    label='Appointment Remarks (this service)'
                    multiline
                    rows={4}
                    value={editDialog.details.remarks || ''}
                    onChange={e =>
                      setEditDialog(prev => ({
                        ...prev,
                        details: { ...prev.details, remarks: e.target.value }
                      }))
                    }
                  />
                </Box>
                <CustomTextField
                  fullWidth
                  multiline
                  rows={7.2}
                  label='Special note for Technician (this service)'
                  value={editDialog.details.instructions || ''}
                  onChange={e =>
                    setEditDialog(prev => ({
                      ...prev,
                      details: { ...prev.details, instructions: e.target.value }
                    }))
                  }
                />
              </Box>

              {/* SECTION 6: CONTRACT REMARKS (READONLY) */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                <CustomTextField
                  fullWidth
                  multiline
                  rows={3}
                  label='Appointment Remarks (From Contract)'
                  value={editDialog.details.contract_remarks || ''}
                  disabled
                  sx={{
                    '& .MuiInputBase-input.Mui-disabled': {
                      color: 'rgba(0, 0, 0, 0.87)',
                      WebkitTextFillColor: 'rgba(0, 0, 0, 0.87)'
                    },
                    '& .MuiInputLabel-root.Mui-disabled': { color: 'rgba(0, 0, 0, 0.6)' }
                  }}
                />
                <CustomTextField
                  fullWidth
                  multiline
                  rows={3}
                  label='Technician Remarks (From Contract)'
                  value={editDialog.details.contract_tech_remarks || ''}
                  disabled
                  sx={{
                    '& .MuiInputBase-input.Mui-disabled': {
                      color: 'rgba(0, 0, 0, 0.87)',
                      '-webkit-text-fill-color': 'rgba(0, 0, 0, 0.87)'
                    },
                    '& .MuiInputLabel-root.Mui-disabled': { color: 'rgba(0, 0, 0, 0.6)' }
                  }}
                />
              </Box>

              <Divider />

              {/* SECTION 4: PEST DETAILS TABLE */}
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant='h6' sx={{ fontWeight: 600 }}>
                    PEST DETAILS
                  </Typography>
                  <Button
                    variant='contained'
                    size='small'
                    startIcon={<AddIcon />}
                    onClick={addPestRow}
                    sx={{ textTransform: 'none' }}
                  >
                    Add Pest
                  </Button>
                </Box>
                <Box sx={{ overflowX: 'auto', border: '1px solid #eee', borderRadius: 1 }}>
                  <table className={styles.table} style={{ minWidth: '100%' }}>
                    <thead style={{ background: '#f9f9f9' }}>
                      <tr>
                        <th style={{ padding: '8px', width: '100px' }}>Action</th>
                        <th style={{ padding: '8px' }}>Pest</th>
                        <th style={{ padding: '8px' }}>Frequency</th>
                        <th style={{ padding: '8px' }}>Pest Value</th>
                        <th style={{ padding: '8px' }}>Purpose</th>
                        <th style={{ padding: '8px' }}>Count</th>
                        <th style={{ padding: '8px' }}>Level</th>
                        <th style={{ padding: '8px' }}>Chemicals</th>
                        <th style={{ padding: '8px', width: '120px' }}>Work Time(Hrs)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(editDialog.details.pest_items || []).length > 0 ? (
                        editDialog.details.pest_items.map((pest, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #f0f0f0' }}>
                            <td style={{ padding: '8px', textAlign: 'center' }}>
                              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                <IconButton size='small' color='primary' onClick={() => handleEditPest(pest, idx)}>
                                  <i className='tabler-edit text-[18px]' />
                                </IconButton>
                                <IconButton size='small' color='error' onClick={() => deletePestRow(idx)}>
                                  <i className='tabler-trash text-[18px]' />
                                </IconButton>
                              </Box>
                            </td>
                            <td style={{ padding: '8px' }}>
                              {pestOptions.find(o => String(o.id) === String(pest.pest_id || pest.id))?.label ||
                                pest.pest_name ||
                                pest.pest ||
                                'N/A'}
                            </td>
                            <td style={{ padding: '8px' }}>
                              {frequencyOptions.find(o => o.id === pest.frequency_id)?.label || 'N/A'}
                            </td>
                            <td style={{ padding: '8px' }}>{pest.pest_value || 0}</td>
                            <td style={{ padding: '8px' }}>{pest.pest_purpose || ''}</td>
                            <td style={{ padding: '8px' }}>{pest.pest_count || 0}</td>
                            <td style={{ padding: '8px' }}>{pest.pest_level || 'Low'}</td>
                            <td style={{ padding: '8px' }}>{pest.chemical_used || ''}</td>
                            <td style={{ padding: '8px' }}>{pest.work_time || '0'}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} style={{ padding: '12px', textAlign: 'center' }}>
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
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant='h6' sx={{ fontWeight: 600 }}>
                    TECHNICIAN DETAILS
                  </Typography>
                  <Button
                    variant='contained'
                    size='small'
                    startIcon={<AddIcon />}
                    onClick={addTechRow}
                    sx={{ textTransform: 'none' }}
                  >
                    Add Technician
                  </Button>
                </Box>
                <Box sx={{ overflowX: 'auto', border: '1px solid #eee', borderRadius: 1 }}>
                  <table className={styles.table} style={{ minWidth: '100%' }}>
                    <thead style={{ background: '#f9f9f9' }}>
                      <tr>
                        <th style={{ padding: '8px', width: '100px' }}>Action</th>
                        <th style={{ padding: '8px' }}>Technician</th>
                        <th style={{ padding: '8px', width: '200px' }}>Productivity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(editDialog.details.job_allocations || []).length > 0 ? (
                        editDialog.details.job_allocations.map((tech, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #f0f0f0' }}>
                            <td style={{ padding: '8px', textAlign: 'center' }}>
                              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                <IconButton size='small' color='primary' onClick={() => handleEditTech(tech, idx)}>
                                  <i className='tabler-edit text-[18px]' />
                                </IconButton>
                                <IconButton size='small' color='error' onClick={() => deleteTechRow(idx)}>
                                  <i className='tabler-trash text-[18px]' />
                                </IconButton>
                              </Box>
                            </td>
                            <td style={{ padding: '8px' }}>
                              {technicianOptions.find(o => String(o.id) === String(tech.technician_id || tech.id))
                                ?.label ||
                                tech.technician_name ||
                                tech.technician ||
                                'N/A'}
                            </td>
                            <td style={{ padding: '8px' }}>
                              {tech.production_value || tech.productivity_value || tech.productivity || 0}
                            </td>
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
        <DialogActions sx={{ px: 6, pb: 8, pt: 3 }}>
          <Button onClick={() => setEditDialog({ open: false, row: null })} variant='tonal' color='secondary'>
            Close
          </Button>
          <Button onClick={handleSave} variant='contained' disabled={loading}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* NESTED PEST MODAL */}
      <Dialog
        open={pestModal.open}
        onClose={() => setPestModal({ ...pestModal, open: false })}
        maxWidth='md'
        fullWidth
        closeAfterTransition={false}
        PaperProps={{ sx: { overflow: 'visible' } }}
      >
        <DialogTitle>
          <Typography variant='h5' component='span'>
            {pestModal.mode === 'add' ? 'Add Pest' : 'Update Ticket'}
          </Typography>
          <DialogCloseButton onClick={() => setPestModal({ ...pestModal, open: false })} disableRipple>
            <i className='tabler-x' />
          </DialogCloseButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 6 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {pestModal.mode === 'add' ? (
              <Box>
                <CustomAutocomplete
                  fullWidth
                  options={pestOptions}
                  value={pestOptions.find(o => o.id === pestModal.data.pest_id) || null}
                  onChange={(_, v) => setPestModal(prev => ({ ...prev, data: { ...prev.data, pest_id: v?.id || '' } }))}
                  getOptionLabel={o => o?.label || ''}
                  isOptionEqualToValue={(o, v) => String(o?.id) === String(v?.id)}
                  renderInput={p => <CustomTextField {...p} label='Pest' />}
                />
              </Box>
            ) : (
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 4 }}>
                <CustomAutocomplete
                  options={pestOptions}
                  value={pestOptions.find(o => o.id === pestModal.data.pest_id) || null}
                  onChange={(_, v) => setPestModal(prev => ({ ...prev, data: { ...prev.data, pest_id: v?.id || '' } }))}
                  getOptionLabel={o => o?.label || ''}
                  renderInput={p => <CustomTextField {...p} label='Pest' />}
                />
                <CustomAutocomplete
                  options={frequencyOptions}
                  value={frequencyOptions.find(o => o.id === pestModal.data.frequency_id) || null}
                  onChange={(_, v) =>
                    setPestModal(prev => ({ ...prev, data: { ...prev.data, frequency_id: v?.id || '' } }))
                  }
                  getOptionLabel={o => o?.label || ''}
                  renderInput={p => <CustomTextField {...p} label='Frequency' />}
                />
                <CustomAutocomplete
                  options={['Job', 'Follow Up', 'Complaint']}
                  value={pestModal.data.pest_purpose || ''}
                  onChange={(_, v) =>
                    setPestModal(prev => ({ ...prev, data: { ...prev.data, pest_purpose: v || '' } }))
                  }
                  renderInput={p => <CustomTextField {...p} label='Purpose' />}
                />
                <CustomTextField
                  label='Pest Count'
                  type='number'
                  value={pestModal.data.pest_count || 0}
                  onChange={e =>
                    setPestModal(prev => ({ ...prev, data: { ...prev.data, pest_count: e.target.value } }))
                  }
                />
                <CustomTextField
                  label='Pest Value'
                  type='number'
                  value={pestModal.data.pest_value || 0}
                  onChange={e =>
                    setPestModal(prev => ({ ...prev, data: { ...prev.data, pest_value: e.target.value } }))
                  }
                />
                <FormControl fullWidth>
                  <Typography variant='caption' sx={{ mb: 1 }}>
                    Level
                  </Typography>
                  <Select
                    value={pestModal.data.pest_level || 'Low'}
                    onChange={e =>
                      setPestModal(prev => ({ ...prev, data: { ...prev.data, pest_level: e.target.value } }))
                    }
                  >
                    <MenuItem value='Low'>Low</MenuItem>
                    <MenuItem value='Medium'>Medium</MenuItem>
                    <MenuItem value='High'>High</MenuItem>
                  </Select>
                </FormControl>
                <Box sx={{ gridColumn: 'span 2' }}>
                  <CustomTextField
                    fullWidth
                    label='Chemicals Used'
                    multiline
                    rows={3}
                    value={pestModal.data.chemical_used || ''}
                    onChange={e =>
                      setPestModal(prev => ({ ...prev, data: { ...prev.data, chemical_used: e.target.value } }))
                    }
                  />
                </Box>
                <Box sx={{ gridColumn: 'span 1' }}>
                  <CustomTextField
                    fullWidth
                    label='Action'
                    multiline
                    rows={3}
                    value={pestModal.data.ticket_pest_action || pestModal.data.action || ''}
                    onChange={e =>
                      setPestModal(prev => ({ ...prev, data: { ...prev.data, ticket_pest_action: e.target.value } }))
                    }
                  />
                </Box>
                <Box sx={{ gridColumn: 'span 1' }}>
                  <CustomTextField
                    fullWidth
                    label='Recommendation'
                    multiline
                    rows={3}
                    value={pestModal.data.ticket_pest_recommendation || pestModal.data.recommendation || ''}
                    onChange={e =>
                      setPestModal(prev => ({
                        ...prev,
                        data: { ...prev.data, ticket_pest_recommendation: e.target.value }
                      }))
                    }
                  />
                </Box>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPestModal({ ...pestModal, open: false })} variant='tonal' color='secondary'>
            Close
          </Button>
          <Button onClick={handleSavePestModal} variant='contained' color='primary'>
            Keep
          </Button>
        </DialogActions>
      </Dialog>

      {/* NESTED TECH MODAL */}
      <Dialog
        open={techModal.open}
        onClose={() => setTechModal({ ...techModal, open: false })}
        maxWidth='xs'
        fullWidth
        closeAfterTransition={false}
        PaperProps={{ sx: { overflow: 'visible' } }}
      >
        <DialogTitle>
          <Typography variant='h5' component='span'>
            {techModal.mode === 'add' ? 'Add Technician' : 'Update Ticket Technician'}
          </Typography>
          <DialogCloseButton onClick={() => setTechModal({ ...techModal, open: false })} disableRipple>
            <i className='tabler-x' />
          </DialogCloseButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 6 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
              <CustomAutocomplete
                fullWidth
                options={technicianOptions}
                value={technicianOptions.find(o => o.id === techModal.data.technician_id) || null}
                onChange={(_, v) =>
                  setTechModal(prev => ({ ...prev, data: { ...prev.data, technician_id: v?.id || '' } }))
                }
                getOptionLabel={o => o?.label || ''}
                renderInput={p => <CustomTextField {...p} label='Technician' />}
              />
              {techModal.mode === 'edit' && (
                <CustomTextField
                  label='Production Value'
                  type='number'
                  value={techModal.data.production_value || techModal.data.productivity_value || 0}
                  onChange={e =>
                    setTechModal(prev => ({ ...prev, data: { ...prev.data, production_value: e.target.value } }))
                  }
                />
              )}
            </Box>
            <FormControlLabel
              control={
                <Checkbox
                  checked={!!(techModal.data.is_attachment_technician || techModal.data.is_attachment)}
                  onChange={e =>
                    setTechModal(prev => ({
                      ...prev,
                      data: { ...prev.data, is_attachment_technician: e.target.checked ? 1 : 0 }
                    }))
                  }
                />
              }
              label='Attachment Technician'
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTechModal({ ...techModal, open: false })} variant='tonal' color='secondary'>
            Close
          </Button>
          <Button onClick={handleSaveTechModal} variant='contained' color='primary'>
            Keep
          </Button>
        </DialogActions>
      </Dialog>

      {/* NESTED DELETE CONFIRMATION */}
      <Dialog
        open={deleteDialogNested.open}
        onClose={() => setDeleteDialogNested({ ...deleteDialogNested, open: false })}
      >
        <DialogTitle>
          <Typography variant='h5' component='span'>
            Confirm Delete
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this {deleteDialogNested.type}?</Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialogNested({ ...deleteDialogNested, open: false })}
            variant='tonal'
            color='secondary'
          >
            Cancel
          </Button>
          <Button onClick={handleConfirmDeleteNested} variant='contained' color='error'>
            Delete
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
