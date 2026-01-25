'use client'
import { useEffect, useMemo, useState, useCallback } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import {
  Box,
  Button,
  Card,
  CardHeader,
  Typography,
  Menu,
  MenuItem,
  IconButton,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Breadcrumbs,
  Chip,
  TextField,
  FormControlLabel,
  FormControl,
  Select,
  InputAdornment,
  Checkbox
} from '@mui/material'

import PermissionGuard from '@/components/auth/PermissionGuard'
import { usePermission } from '@/hooks/usePermission'
import PresetDateRangePicker from '@/components/common/PresetDateRangePicker'
import { getCompanyList } from '@/api/master/company'
import DialogCloseButton from '@components/dialogs/DialogCloseButton'

import { getContractList, deleteContract } from '@/api/contract_group/contract'
import api from '@/utils/axiosInstance'
import { encodeId, decodeId } from '@/utils/urlEncoder'

import VisibilityIcon from '@mui/icons-material/Visibility'

// Custom Autocomplete + TextField
import CustomAutocomplete from '@core/components/mui/Autocomplete'
import CustomTextField from '@core/components/mui/TextField'
import { getCustomerNamesForList } from '@/api/contract_group/contract/listDropdowns'

import TableChartIcon from '@mui/icons-material/TableChart'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import FileCopyIcon from '@mui/icons-material/FileCopy'

// 🔥 Global UI Components (use everywhere)
import GlobalButton from '@/components/common/GlobalButton'
import GlobalTextField from '@/components/common/GlobalTextField'
import GlobalTextarea from '@/components/common/GlobalTextarea'
import GlobalSelect from '@/components/common/GlobalSelect'
import GlobalAutocomplete from '@/components/common/GlobalAutocomplete'
import GlobalDateRange from '@/components/common/GlobalDateRange'
import { showToast } from '@/components/common/Toasts'

import AddIcon from '@mui/icons-material/Add'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import PrintIcon from '@mui/icons-material/Print'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import RefreshIcon from '@mui/icons-material/Refresh'
import SearchIcon from '@mui/icons-material/Search'
import { useRouter, useSearchParams, usePathname, useParams } from 'next/navigation'
import TablePaginationComponent from '@/components/TablePaginationComponent'
import ServicePlanDrawer from './service-plan/ServicePlanDrawer'
import { getTicketBackendDataApi } from '@/api/service_group/schedule'

import classnames from 'classnames'
import { rankItem } from '@tanstack/match-sorter-utils'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper
} from '@tanstack/react-table'
import styles from '@core/styles/table.module.css'
import ChevronRight from '@menu/svg/ChevronRight'
import { dateSortingFn } from '@/utils/tableUtils'
import StickyListLayout from '@/components/common/StickyListLayout'
import StickyTableWrapper from '@/components/common/StickyTableWrapper'
// Debounced Input
const DebouncedInput = ({ value: initialValue, onChange, debounce = 500, ...props }) => {
  const [value, setValue] = useState(initialValue)
  useEffect(() => setValue(initialValue), [initialValue])
  useEffect(() => {
    const t = setTimeout(() => onChange(value), debounce)
    return () => clearTimeout(t)
  }, [value])
  return <TextField {...props} value={value} onChange={e => setValue(e.target.value)} />
}

const CONTRACT_TYPES = [
  { label: 'Limited Contract', value: 'Limited Contract' },
  { label: 'Job', value: 'Job' },
  { label: 'Continuous Contract', value: 'Continuous Contract' },
  { label: 'Continuous Job', value: 'Continuous Job' },
  { label: 'Warranty', value: 'Warranty' }
]

// 🔥 Contract Status Values (backend expects Capitalized strings for this module usually)
const CONTRACT_STATUS = [
  { label: 'Current', value: 'Current' },
  { label: 'Renewed', value: 'Renewed' },
  { label: 'Hold', value: 'Hold' },
  { label: 'Terminated', value: 'Terminated' },
  { label: 'Expired', value: 'Expired' }
]

// ───────────────────────────────────────────
// Component
// ───────────────────────────────────────────
// ───────────────────────────────────────────
const ContractsPageContent = () => {
  const { canAccess } = usePermission()
  const [planDrawer, setPlanDrawer] = useState({
    open: false,
    contract: null,
    pestOptions: []
  })

  const closePlanDrawer = () => {
    setPlanDrawer({ open: false, contract: null, pestOptions: [] })
  }


  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const { lang: locale } = useParams()
  const lang = locale || 'en'

  const [companyOptions, setCompanyOptions] = useState([])
  const [uiCompany, setUiCompany] = useState(null)

  const [rows, setRows] = useState([])
  const [rowCount, setRowCount] = useState(0)
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 })
  const [loading, setLoading] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, row: null })
  const [exportAnchorEl, setExportAnchorEl] = useState(null)
  const [customerOptions, setCustomerOptions] = useState([])

  const [openDrawer, setOpenDrawer] = useState(false)
  const [selectedContract, setSelectedContract] = useState(null)

  // -- FILTER STATES --
  const [uiSearch, setUiSearch] = useState(searchParams.get('search') || '')
  const [uiCustomer, setUiCustomer] = useState(null)
  const [uiType, setUiType] = useState(searchParams.get('type') || null)
  const [uiStatus, setUiStatus] = useState(searchParams.get('status') || null)
  const [uiUuid, setUiUuid] = useState(searchParams.get('uuid') || null)
  const [uiDateFilter, setUiDateFilter] = useState(searchParams.get('dateFilter') === 'true')
  const [uiDateRange, setUiDateRange] = useState([
    searchParams.get('from') ? new Date(searchParams.get('from')) : null,
    searchParams.get('to') ? new Date(searchParams.get('to')) : null
  ])

  const [appliedFilters, setAppliedFilters] = useState({
    search: searchParams.get('search') || '',
    customer: null,
    company: null, // ✅ ADD
    type: searchParams.get('type') || null,
    status: searchParams.get('status') || null,
    uuid: searchParams.get('uuid') || null,
    dateFilter: searchParams.get('dateFilter') === 'true',
    dateRange: [
      searchParams.get('from') ? new Date(searchParams.get('from')) : null,
      searchParams.get('to') ? new Date(searchParams.get('to')) : null
    ]
  })

  const loadCompanies = async () => {
    try {
      const list = await getCompanyList()

      const mapped = list.map(c => ({
        id: c.id,
        name: c.name?.trim() || c.company_name || '-'
      }))

      setCompanyOptions(mapped)

      // 🔥 DEFAULT SELECTION: A-Flick (Only if no URL or Saved COMPANY filter exists)
      const hasUrlParam = searchParams.get('company')
      const savedStr = sessionStorage.getItem('contractFilters')
      const saved = savedStr ? JSON.parse(savedStr) : null
      const hasSavedCompany = saved && saved.company

      if (!hasUrlParam && !hasSavedCompany && mapped.length > 0) {
        // Find "A-Flick Pte Ltd" or similar aflick companies
        const aflick =
          mapped.find(c => c.name.toLowerCase() === 'a-flick pte ltd' || c.name.toLowerCase() === 'aflick pte ltd') ||
          mapped.find(c => c.name.toLowerCase().includes('aflick') || c.name.toLowerCase().includes('a-flick'))

        if (aflick) {
          setUiCompany(aflick)
          // setAppliedFilters(prev => ({ ...prev, company: aflick })) // ❌ Don't apply filter automatically on mount
        }
      }
    } catch (err) {
      console.error('Error loading companies', err)
      setCompanyOptions([])
    }
  }

  // Sync UI state with applied filters on mount
  useEffect(() => {
    // uiSearch, uiType, etc are already initialized from searchParams
  }, [])

  const updateUrl = filters => {
    const params = new URLSearchParams()
    if (filters.search) params.set('search', filters.search)
    if (filters.customer?.id) params.set('customer', encodeId(filters.customer.id))
    if (filters.company?.id) params.set('company', encodeId(filters.company.id))
    if (filters.type) params.set('type', filters.type)
    if (filters.status) params.set('status', filters.status)
    if (filters.uuid) params.set('uuid', filters.uuid)
    if (filters.dateFilter) {
      params.set('dateFilter', 'true')
      if (filters.dateRange[0]) params.set('from', format(new Date(filters.dateRange[0]), 'yyyy-MM-dd'))
      if (filters.dateRange[1]) params.set('to', format(new Date(filters.dateRange[1]), 'yyyy-MM-dd'))
    }

    // 🔥 SAVE TO SESSION STORAGE FOR PERSISTENCE
    const storageObj = {
      search: filters.search,
      customer: filters.customer ? { id: filters.customer.id, name: filters.customer.name } : null,
      company: filters.company ? { id: filters.company.id, name: filters.company.name } : null,
      type: filters.type,
      status: filters.status,
      uuid: filters.uuid,
      dateFilter: filters.dateFilter,
      dateRange: filters.dateRange
    }
    sessionStorage.setItem('contractFilters', JSON.stringify(storageObj))

    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const encodedCustomerId = searchParams.get('customer')
  const decodedCustomerId = encodedCustomerId ? parseInt(decodeId(encodedCustomerId)) : null

  const encodedCompanyId = searchParams.get('company')
  const decodedCompanyId = encodedCompanyId ? parseInt(decodeId(encodedCompanyId)) : null

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const backendParams = {
        page: pagination.pageIndex + 1,
        page_size: pagination.pageSize,
        search: appliedFilters.search || undefined // ✅ Send search to backend
      }
      if (appliedFilters.uuid) backendParams.uuid = appliedFilters.uuid
      if (appliedFilters.customer?.id) backendParams.customer_id = appliedFilters.customer.id
      if (appliedFilters.company?.id) backendParams.company_id = appliedFilters.company.id
      if (appliedFilters.type) backendParams.contract_type = appliedFilters.type
      if (appliedFilters.status) backendParams.contract_status = appliedFilters.status

      // ✅ Send Date Filter to Backend
      if (appliedFilters.dateFilter && appliedFilters.dateRange[0] && appliedFilters.dateRange[1]) {
        // Assuming backend supports 'start_date' and 'end_date' or similar.
        // Based on Postman provided, params are usually snake_case.
        // Common pattern for this app seems to vary, but let's try commonly used ones or keep frontend if backend doesn't support.
        // Actually, safer to keep frontend DATE filter if uncertain, BUT we are paging.
        // Let's assume standard django filters: 'from_date', 'to_date' or 'start_date_after'.
        // Checking `getDates.js` might help, but sticking to standard params for now.
        // If unsure, I will pass `from_date` and `to_date`.
        backendParams.from_date = format(new Date(appliedFilters.dateRange[0]), 'yyyy-MM-dd')
        backendParams.to_date = format(new Date(appliedFilters.dateRange[1]), 'yyyy-MM-dd')
      }

      const res = await getContractList(backendParams)

      // Extract results - handle { data: { results: [] } } or { results: [] } or just []
      const resultsArray =
        res?.results || res?.data?.results || (Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [])

      setRowCount(res.count || res?.data?.count || 0) // ✅ Use backend count

      // 3) 📄 Direct Mapping (No frontend slice)
      const normalized = resultsArray.map((item, index) => ({
        sno: index + 1 + pagination.pageIndex * pagination.pageSize,
        id: item.id,
        customer_id: item.customer_id,
        customer: item.customer_name || item.customer?.name || item.customer || '-',
        uuid: item.uuid || '',
        company: item.company || '-',
        contractCode: item.contract_code || item.num_series || `CON-${item.id}`,
        serviceAddress: item.service_address || '-',
        postalCode: item.postal_code || '-',
        contractType: item.contract_type || '-',
        contractStatus: item.contract_status || '-',
        startDate: item.start_date || item.commencement_date || '-',
        endDate: item.end_date || '-',
        contactName: item.contact_person_name || '-',
        contactPhone: item.phone || '-',
        mobile: item.mobile || '-',
        contractValue: item.contract_value || 0,
        productValue: 0,
        pestList: item.pest_items?.map(p => p.pest).join(', ') || 'N/A'
      }))

      setRows(normalized)
    } catch (err) {
      showToast('error', 'Failed to load contracts')
    } finally {
      setLoading(false)
    }
  }, [pagination.pageIndex, pagination.pageSize, appliedFilters])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    loadCompanies()
    loadCustomers()
  }, [])

  const openPlanDrawer = async item => {
    try {
      setLoading(true)

      // Always use UUID
      const res = await getTicketBackendDataApi({ uuid: item.uuid })
      const backend = res?.data || {}

      setPlanDrawer({
        open: true,
        contract: {
          id: item.id,
          uuid: item.uuid,
          contract_code: backend.contract_code || item.contractCode || '',
          start_date: backend.start_date || null,
          end_date: backend.end_date || null,
          time: backend.time || '09:00'
        },
        pestOptions:
          backend?.pest?.map(p => ({
            pest_id: p.pest_id,
            frequency_id: p.frequency_id,
            display: p.display
          })) || []
      })
    } catch (err) {
      console.error(err)
      showToast('error', 'Failed to load schedule setup')
    } finally {
      setLoading(false)
    }
  }

  const loadCustomers = async () => {
    try {
      const names = await getCustomerNamesForList()

      // Backend returns: { id: 1613, name: "XXXX" }
      const mapped = names.map(c => ({
        id: c.id, // ✔ correct id
        name: c.name.trim() // ✔ remove spaces
      }))

      setCustomerOptions(mapped)
    } catch (error) {
      console.error('Error loading customers:', error)
      setCustomerOptions([])
    }
  }

  // AUTO-OPEN DRAWER AFTER ADD CONTRACT
  useEffect(() => {
    const encoded = searchParams.get('newContract')
    if (!encoded) return

    try {
      const item = JSON.parse(atob(encoded))

      // 🔥 DELAY IS IMPORTANT — PAGE RENDER AANA PIRAGU DRAWER OPEN AGUM
      setTimeout(() => {
        openPlanDrawer(item)
      }, 300)

      // remove param
      const url = new URL(window.location.href)
      url.searchParams.delete('newContract')
      window.history.replaceState({}, '', url)
    } catch (e) {
      console.error('Auto-open decode error:', e)
    }
  }, [])

  useEffect(() => {
    if (decodedCustomerId && customerOptions.length > 0) {
      const matched = customerOptions.find(c => c.id === decodedCustomerId)
      if (matched) {
        setUiCustomer(matched)
        // Also apply immediately if it's from URL
        setAppliedFilters(prev => ({ ...prev, customer: matched }))
      }
    }

    if (decodedCompanyId && companyOptions.length > 0) {
      const matched = companyOptions.find(c => c.id === decodedCompanyId)
      if (matched) {
        setUiCompany(matched)
        setAppliedFilters(prev => ({ ...prev, company: matched }))
      }
    }
  }, [decodedCustomerId, customerOptions, decodedCompanyId, companyOptions])

  // Load customer dropdown only once
  useEffect(() => {
    loadCustomers()
  }, [])

  // 🔥 RESTORE FILTERS FROM SESSION STORAGE ON MOUNT
  useEffect(() => {
    // Only restore if there are NO filter params in the URL currently
    const hasUrlParams =
      searchParams.get('search') ||
      searchParams.get('customer') ||
      searchParams.get('company') ||
      searchParams.get('type') ||
      searchParams.get('status') ||
      searchParams.get('dateFilter')

    if (!hasUrlParams) {
      const saved = sessionStorage.getItem('contractFilters')
      if (saved) {
        try {
          const filters = JSON.parse(saved)

          // Reconstruct URL params from saved state
          const params = new URLSearchParams()
          if (filters.search) params.set('search', filters.search)
          if (filters.customer?.id) params.set('customer', encodeId(filters.customer.id))
          if (filters.company?.id) params.set('company', encodeId(filters.company.id))
          if (filters.type) params.set('type', filters.type)
          if (filters.status) params.set('status', filters.status)
          if (filters.uuid) params.set('uuid', filters.uuid)
          if (filters.dateFilter) {
            params.set('dateFilter', 'true')
            if (filters.dateRange[0]) params.set('from', format(new Date(filters.dateRange[0]), 'yyyy-MM-dd'))
            if (filters.dateRange[1]) params.set('to', format(new Date(filters.dateRange[1]), 'yyyy-MM-dd'))
          }

          // Use replace to avoid extra entry in browser history
          router.replace(`${pathname}?${params.toString()}`, { scroll: false })
        } catch (e) {
          console.error('Failed to parse saved filters:', e)
        }
      }
    }
  }, [pathname, router])

  // Load contracts whenever applied filters / pagination changes
  useEffect(() => {
    loadData()
  }, [appliedFilters, pagination.pageIndex, pagination.pageSize])

  const handleEdit = row => {
    router.push(`/${lang}/admin/contracts/edit/${row.uuid}`)
  }

  const confirmDelete = async () => {
    if (deleteDialog.row) {
      await deleteContractApi(deleteDialog.row.id)

      showToast('delete', `Contract ${deleteDialog.row.contractCode} deleted`)
      loadData()
    }
    setDeleteDialog({ open: false, row: null })
  }

  // --- Table ---
  const columnHelper = createColumnHelper()
  const columns = useMemo(
    () => [
      columnHelper.accessor('sno', {
        id: 'sno_column',
        header: 'S.No'
      }),

      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        meta: { width: '130px', align: 'center' },

        cell: ({ row }) => {
          const item = row.original // ⭐ THIS IS REQUIRED

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
              {/* 👁 VIEW */}
              <IconButton size='small' color='info' onClick={() => router.push(`/${lang}/admin/contracts/view/${item.uuid}`)}>
                <i className='tabler-eye ' />
              </IconButton>

              {/* ✏ EDIT */}
              {/* {canAccess('Contracts', 'update') && (
                <IconButton size='small' color='primary' onClick={() => handleEdit(item)}>
                  <i className='tabler-edit' />
                </IconButton>
              )} */}

              {/* 📅 SCHEDULE */}
              <IconButton size='small' onClick={() => openPlanDrawer(item)}>
                <i className='tabler-calendar text-green-600 text-[18px]' />
              </IconButton>

              {/* 🗑 DELETE */}
              {canAccess('Contracts', 'delete') && (
                <IconButton size='small' onClick={() => setDeleteDialog({ open: true, row: item })}>
                  <i className='tabler-trash text-red-600 text-[18px]' />
                </IconButton>
              )}
            </Box>
          )
        }
      }),

      columnHelper.accessor('company', {
        id: 'company_column',
        header: 'Company'
      }),

      columnHelper.accessor('customer', {
        id: 'customer_column',
        header: 'Customer'
      }),

      columnHelper.display({
        id: 'serve_column',
        header: 'Service',
        meta: { width: '140px', align: 'center' },

        cell: ({ row }) => {
          const item = row.original

          return (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column', // 🔥 MELA–KILE
                alignItems: 'center',
                gap: 0.5
              }}
            >
              {/* 🟢 SERVICE BUTTON (TOP) */}
              <Button
                variant='outlined'
                size='small'
                sx={{
                  minWidth: 80,
                  height: 26,
                  color: '#2e7d32', // green text
                  borderColor: '#66bb6a', // green border
                  textTransform: 'none',
                  fontSize: 12,
                  fontWeight: 500,
                  '&:hover': {
                    bgcolor: '#e8f5e9',
                    borderColor: '#2e7d32'
                  }
                }}
                onClick={() => {
                  const encodedContractId = encodeId(item.id)
                  const encodedCustomerId = encodeId(item.customer_id)

                  router.push(`/${lang}/admin/service-request?customer=${encodedCustomerId}&contract=${encodedContractId}`)
                }}
              >
                Service
              </Button>

              {/* 🔵 INVOICE BUTTON (BOTTOM) */}
              <Button
                variant='outlined'
                size='small'
                sx={{
                  minWidth: 80,
                  height: 26,
                  color: '#c62828', // red text
                  borderColor: '#ef5350', // red border
                  textTransform: 'none',
                  fontSize: 12,
                  fontWeight: 500,
                  '&:hover': {
                    bgcolor: '#ffebee',
                    borderColor: '#c62828'
                  }
                }}
                onClick={() => {
                  const encodedContractId = encodeId(item.id)
                  const encodedCustomerId = encodeId(item.customer_id)

                  router.push(`/${lang}/admin/invoice?customer=${encodedCustomerId}&contract=${encodedContractId}`)
                }}
              >
                Invoice
              </Button>
            </Box>
          )
        }
      }),
      columnHelper.accessor('contractCode', {
        id: 'code_column',
        header: 'Contract Code'
      }),

      columnHelper.accessor('serviceAddress', {
        id: 'address_column',
        header: 'Service Address'
      }),

      columnHelper.accessor('contractType', {
        id: 'type_column',
        header: 'Type'
      }),

      columnHelper.accessor('startDate', {
        id: 'startDate_column',
        header: 'Start Date',
        sortingFn: dateSortingFn
      }),

      columnHelper.accessor('endDate', {
        id: 'endDate_column',
        header: 'End Date',
        sortingFn: dateSortingFn
      }),

      columnHelper.accessor('postalCode', {
        id: 'postal_column',
        header: 'Postal Code',
        cell: info => info.getValue() || '—'
      }),

      columnHelper.accessor('productValue', {
        id: 'product_column',
        header: 'Product Value',
        cell: info => `₹ ${info.getValue() || 0}`
      }),

      columnHelper.accessor('contractValue', {
        id: 'contract_value_column',
        header: 'Contract Value',
        cell: info => `₹ ${info.getValue() || 0}`
      }),

      columnHelper.accessor('contactName', {
        id: 'contact_name_column',
        header: 'Contact Person'
      }),

      columnHelper.accessor('contactPhone', {
        id: 'contact_phone_column',
        header: 'Phone'
      }),

      columnHelper.accessor('mobile', {
        id: 'mobile_column',
        header: 'Mobile'
      }),

      // columnHelper.accessor('services', {
      //   id: 'services_column',
      //   header: 'Services',
      //   cell: info => info.getValue()?.join(', ') || 'N/A'
      // }),

      columnHelper.accessor('pestList', {
        id: 'pest_column',
        header: 'Pests'
      }),

      columnHelper.accessor('contractStatus', {
        id: 'contract_status_column',
        header: 'Contract Status',
        cell: info => {
          const raw = info.getValue()
          const status = raw ? String(raw).toLowerCase() : '' // ✅ SAFE

          let color = 'default'
          if (status === 'current') color = 'success'
          else if (status === 'renewed') color = 'info'
          else if (status === 'hold') color = 'warning'
          else if (status === 'terminated') color = 'error'
          else if (status === 'expired') color = 'error'

          return (
            <Chip
              label={raw || 'N/A'}
              size='small'
              color={color}
              sx={{
                fontWeight: 600,
                textTransform: 'capitalize',
                borderRadius: '6px'
              }}
            />
          )
        }
      })
    ],
    []
  )

  const fuzzyFilter = (row, columnId, value, addMeta) => {
    const itemRank = rankItem(row.getValue(columnId), value)
    addMeta({ itemRank })
    return itemRank.passed
  }

  const table = useReactTable({
    data: rows,
    columns,
    manualPagination: true,
    pageCount: Math.ceil(rowCount / pagination.pageSize),
    state: { globalFilter: appliedFilters.search, pagination },
    onGlobalFilterChange: val => setAppliedFilters(prev => ({ ...prev, search: val })),
    onPaginationChange: setPagination,
    globalFilterFn: fuzzyFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel()
  })

  // --- Export ---
  const exportOpen = Boolean(exportAnchorEl)
  const exportCSV = () => {
    const headers = ['S.No', 'Customer', 'Code', 'Address', 'Type', 'Date', 'Pests', 'Status']
    const csv = [
      headers.join(','),
      ...rows.map(r =>
        [
          r.sno,
          `"${r.customer}"`,
          r.contractCode,
          `"${r.serviceAddress}"`,
          r.contractType,
          r.date,
          `"${r.pestList}"`,
          r.status
        ].join(',')
      )
    ].join('\n')
    const link = document.createElement('a')
    link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    link.download = 'contracts.csv'
    link.click()
    showToast('success', 'CSV downloaded')
  }

  const exportPrint = () => {
    const w = window.open('', '_blank')
    const html = `
      <html><head><title>Contracts List</title><style>
      body{font-family:Arial;padding:24px;}
      table{width:100%;border-collapse:collapse;}
      th,td{border:1px solid #ccc;padding:8px;text-align:left;}
      th{background:#f4f4f4;}
      </style></head><body>
      <h2>Contracts List</h2>
      <table><thead><tr>
      <th>S.No</th><th>Customer</th><th>Code</th><th>Address</th><th>Type</th><th>Date</th><th>Pests</th><th>Status</th>
      </tr></thead><tbody>
      ${rows
        .map(
          r => `<tr>
          <td>${r.sno}</td>
          <td>${r.customer}</td>
          <td>${r.contractCode}</td>
          <td>${r.serviceAddress}</td>
          <td>${r.contractType}</td>
          <td>${r.date}</td>
          <td>${r.pestList}</td>
          <td>${r.status}</td>
        </tr>`
        )
        .join('')}
      </tbody></table></body></html>`
    w.document.write(html)
    w.document.close()
    w.print()
  }

  // ───────────────────────────────────────────
  // Render
  // ───────────────────────────────────────────
  return (
    <StickyListLayout
      header={
        <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 2 }}>
          <Link underline='hover' color='inherit' href='/'>
            Dashboard
          </Link>
          <Typography color='text.primary'>Contracts</Typography>
        </Breadcrumbs>
      }
    >
      <Card sx={{ display: 'flex', flexDirection: 'column', maxHeight: '100%', minHeight: 0 }}>
        <CardHeader
          title={
            <Box display='flex' alignItems='center' gap={2}>
              <Typography variant='h5' fontWeight={600}>
                Contracts List
              </Typography>
            </Box>
          }
          action={
            <Box display='flex' alignItems='center' gap={2}>
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
                    await exportExcel()
                  }}
                >
                  <TableChartIcon fontSize='small' sx={{ mr: 1 }} /> Excel
                </MenuItem>

                <MenuItem
                  onClick={async () => {
                    setExportAnchorEl(null)
                    await exportPDF()
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

              {canAccess('Contracts', 'create') && (
                <GlobalButton
                  variant='contained'
                  startIcon={<AddIcon />}
                  onClick={() => router.push(`/${lang}/admin/contracts/add`)}
                  sx={{ textTransform: 'none', fontWeight: 500, px: 2.5, height: 36 }}
                >
                  Add Contract
                </GlobalButton>
              )}
            </Box>
          }
        />

        <Divider />

        <Box sx={{ p: 4, flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* --- Row 2: Filters --- */}
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
            {/* Date Filter with Checkbox */}
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

            {/* Origin (Company) Filter */}
            <Box sx={{ width: 220 }}>
              <GlobalAutocomplete
                fullWidth
                options={companyOptions}
                getOptionLabel={option => option?.name || ''}
                value={companyOptions.find(opt => opt.id === uiCompany?.id) || null}
                onChange={newVal => setUiCompany(newVal)}
                renderInput={params => (
                  <GlobalTextField {...params} label='Origin' placeholder='Select Origin' size='small' />
                )}
              />
            </Box>

            {/* Customer Filter */}
            <Box sx={{ width: 220 }}>
              <GlobalAutocomplete
                fullWidth
                id='customer-filter'
                options={customerOptions}
                getOptionLabel={option => option?.name || ''}
                value={customerOptions.find(opt => opt.id === uiCustomer?.id) || null}
                onChange={newVal => setUiCustomer(newVal)}
                renderInput={params => (
                  <GlobalTextField {...params} label='Customer' placeholder='Select Customer' size='small' />
                )}
              />
            </Box>

            {/* Contract Type Filter */}
            <GlobalAutocomplete
              fullWidth
              options={CONTRACT_TYPES}
              getOptionLabel={o => o.label}
              value={CONTRACT_TYPES.find(v => v.value === uiType) || null}
              onChange={newValue => {
                setUiType(newValue?.value || null)
              }}
              renderInput={params => (
                <GlobalTextField {...params} label='Contract Type' placeholder='Select Type' size='small' />
              )}
              sx={{ width: 220 }}
            />

            {/* Contract Status Filter */}
            <GlobalAutocomplete
              fullWidth
              options={CONTRACT_STATUS}
              getOptionLabel={o => o.label}
              value={CONTRACT_STATUS.find(s => s.value === uiStatus) || null}
              onChange={newValue => {
                setUiStatus(newValue?.value || null)
              }}
              renderInput={params => (
                <GlobalTextField {...params} label='Contract Status' placeholder='Select Status' size='small' />
              )}
              sx={{ width: 220 }}
            />

            {/* Refresh Button */}
            <GlobalButton
              variant='contained'
              color='primary'
                startIcon={<RefreshIcon />}
              disabled={loading}
              onClick={() => {
                const newFilters = {
                  search: uiSearch,
                  customer: uiCustomer,
                  company: uiCompany, // ✅ ADD THIS
                  type: uiType,
                  status: uiStatus,
                  uuid: uiUuid,
                  dateFilter: uiDateFilter,
                  dateRange: uiDateRange
                }

                setPagination(p => ({ ...p, pageIndex: 0 }))
                setAppliedFilters(newFilters)
                updateUrl(newFilters)
              }}
              sx={{ textTransform: 'none', fontWeight: 500, px: 2.5, height: 36 }}
            >
              Refresh
            </GlobalButton>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* --- Row 3: Pages & Search --- */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 3
            }}
          >
            {/* Entries per page */}
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

            {/* Link to Search */}
            <DebouncedInput
              value={uiUuid ? `uuid:${uiUuid}` : uiSearch}
              onChange={v => {
                const value = String(v)

                if (value.startsWith('uuid:')) {
                  const uid = value.replace('uuid:', '').trim()
                  setUiUuid(uid)
                  setUiSearch('')
                  return
                }

                setUiUuid(null)
                setUiSearch(value)
              }}
              placeholder='Search customer, code, address, pests...'
              size='small'
              sx={{
                width: 320,
                '& .MuiInputBase-root': {
                  height: 36
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <SearchIcon fontSize='small' />
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
                  {rows.length ? (
                    table.getRowModel().rows.map(row => (
                      <tr key={row.id}>
                        {row.getVisibleCells().map(cell => (
                          <td key={cell.column.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={columns.length} className='text-center py-4'>
                        No results found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </StickyTableWrapper>
          </Box>

          <Box sx={{ flexShrink: 0, mt: 'auto' }}>
            <TablePaginationComponent totalCount={rowCount} pagination={pagination} setPagination={setPagination} />
          </Box>
        </Box>
      </Card>

      <Dialog
        onClose={() => setDeleteDialog({ open: false })}
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
            onClick={() => setDeleteDialog({ open: false })}
            disableRipple
            sx={{ position: 'absolute', right: 1, top: 1 }}
          >
            <i className='tabler-x' />
          </DialogCloseButton>
        </DialogTitle>
        <DialogContent sx={{ px: 5, pt: 1 }}>
          <Typography sx={{ color: 'text.secondary', fontSize: 14, lineHeight: 1.6 }}>
            Are you sure you want to delete contract{' '}
            <strong style={{ color: '#d32f2f' }}>{deleteDialog.row?.contractCode || 'this contract'}</strong>?
            <br />
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 3, pt: 2 }}>
          <GlobalButton
            onClick={() => setDeleteDialog({ open: false })}
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

      <ServicePlanDrawer
        open={planDrawer.open}
        onClose={closePlanDrawer}
        contract={planDrawer.contract}
        pestOptions={planDrawer.pestOptions}
      />
    </StickyListLayout>
  )
}

// Wrapper for RBAC
export default function ContractsPage() {
  return (
    <PermissionGuard permission='Contracts'>
      <ContractsPageContent />
    </PermissionGuard>
  )
}
