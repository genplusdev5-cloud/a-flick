'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
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
  FormControl,
  Select,
  CircularProgress,
  InputAdornment
} from '@mui/material'

import { getContractList, deleteContractApi } from '@/api/contract'
import api from '@/utils/axiosInstance'

import VisibilityIcon from '@mui/icons-material/Visibility'
import { useSearchParams } from 'next/navigation'

// Custom Autocomplete + TextField
import CustomAutocomplete from '@core/components/mui/Autocomplete'
import CustomTextField from '@core/components/mui/TextField'
import { getCustomerNamesForList } from '@/api/contract/listDropdowns'

import TableChartIcon from '@mui/icons-material/TableChart'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import FileCopyIcon from '@mui/icons-material/FileCopy'

// 🔥 Global UI Components (use everywhere)
import GlobalButton from '@/components/common/GlobalButton'
import GlobalTextField from '@/components/common/GlobalTextField'
import GlobalTextarea from '@/components/common/GlobalTextarea'
import GlobalSelect from '@/components/common/GlobalSelect'
import GlobalAutocomplete from '@/components/common/GlobalAutocomplete'
import { showToast } from '@/components/common/Toasts'

import DialogCloseButton from '@components/dialogs/DialogCloseButton'
import ProgressCircularCustomization from '@/components/common/ProgressCircularCustomization'
import AddIcon from '@mui/icons-material/Add'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import PrintIcon from '@mui/icons-material/Print'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import RefreshIcon from '@mui/icons-material/Refresh'
import SearchIcon from '@mui/icons-material/Search'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import TablePaginationComponent from '@/components/TablePaginationComponent'
import ServicePlanDrawer from './service-plan/ServicePlanDrawer'
import { getTicketBackendDataApi } from '@/api/schedule'

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
  { label: 'Limited Contract', value: 'limited' },
  { label: 'Job', value: 'job' },
  { label: 'Continuous Contract', value: 'continuous_contract' },
  { label: 'Continuous Job', value: 'continuous_job' },
  { label: 'Warranty', value: 'warranty' }
]

// 🔥 Contract Status Values (backend expects lowercase)
const CONTRACT_STATUS = [
  { label: 'Current', value: 'current' },
  { label: 'Renewed', value: 'renewed' },
  { label: 'Hold', value: 'hold' },
  { label: 'Terminated', value: 'terminated' },
  { label: 'Expired', value: 'expired' }
]

// ───────────────────────────────────────────
// Component
// ───────────────────────────────────────────
export default function ContractsPage() {
  const [planDrawer, setPlanDrawer] = useState({
    open: false,
    contract: null,
    pestOptions: []
  })

  const closePlanDrawer = () => {
    setPlanDrawer({ open: false, contract: null, pestOptions: [] })
  }

  const router = useRouter()
  const [rows, setRows] = useState([])
  const [rowCount, setRowCount] = useState(0)
  const [searchText, setSearchText] = useState('')
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 })
  const [loading, setLoading] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, row: null })
  const [exportAnchorEl, setExportAnchorEl] = useState(null)
  const [customerOptions, setCustomerOptions] = useState([])

  const [openDrawer, setOpenDrawer] = useState(false)
  const [selectedContract, setSelectedContract] = useState(null)

  const searchParams = useSearchParams()
  const newContractId = searchParams.get('openDrawer')
  const encodedCustomerId = searchParams.get('customer')

  const decodedCustomerId = encodedCustomerId ? parseInt(atob(encodedCustomerId)) : null
  const [uuidFilter, setUuidFilter] = useState(null)

  const [customerFilter, setCustomerFilter] = useState(null)
  const [typeFilter, setTypeFilter] = useState(null)
  const [statusFilter, setStatusFilter] = useState(null)

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

  const loadData = async (extraFilters = {}) => {
    setLoading(true)
    try {
      // 👇 base filters from state + anything extra you pass
      const filters = { ...extraFilters }

      if (customerFilter?.id) filters.customer_id = customerFilter.id
      if (typeFilter) filters.contract_type = typeFilter
      if (statusFilter) filters.contract_status = statusFilter

      // 🔹 UUID filter from state (either from URL or search)
      if (uuidFilter) filters.uuid = uuidFilter

      console.log('🧠 Filters Sent →', filters)

      const all = await getContractList(filters)

      const sorted = all.sort((a, b) => (b.id || 0) - (a.id || 0))

      const start = pagination.pageIndex * pagination.pageSize
      const end = start + pagination.pageSize
      const paginated = sorted.slice(start, end)

      const normalized = paginated.map((item, idx) => ({
        ...item,
        original_id: item.id, // keep real DB id
        uuid: item.uuid, // explicit uuid
        sno: start + idx + 1,

        // Try to map proper customer name (backend may give different shapes)
        customer: item.customer_name || item.customer?.name || item.customer || '',

        contractCode: item.contract_code || '',
        serviceAddress: item.service_address || '',
        contractType: item.contract_type || '',

        postalCode: item.postal_address || item.postal_code || '',
        productValue: item.product_value || 0,
        contractValue: item.contract_value || 0,

        contactName: item.contact_person_name || '',
        contactPhone: item.phone || '',
        mobile: item.mobile || '',

        // Services column – use pest names if available
        services: item.pest_items?.map(p => p.pest_name || p.pest || '').filter(Boolean) || [],

        // Pests column – show nice string
        pestList:
          item.pest_items
            ?.map(p => p.pest_name || p.pest || '')
            .filter(Boolean)
            .join(', ') || 'N/A',

        startDate: item.start_date ? new Date(item.start_date).toLocaleDateString('en-GB') : '',
        endDate: item.end_date ? new Date(item.end_date).toLocaleDateString('en-GB') : '',

        contractStatus: item.contract_status || item.status || 'N/A'
      }))

      setRows(normalized)
      setRowCount(all.length)
    } catch (err) {
      console.error(err)
      showToast('error', 'Failed to load contracts')
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
        setCustomerFilter(matched)
      }
    }
  }, [decodedCustomerId, customerOptions])

  // Load customer dropdown only once
  useEffect(() => {
    loadCustomers()
  }, [])

  // Load contracts whenever filters / pagination / search changes
  useEffect(() => {
    loadData()
  }, [customerFilter, typeFilter, statusFilter, uuidFilter, pagination.pageIndex, pagination.pageSize, searchText])

  const handleEdit = row => {
    router.push(`/admin/contracts/${row.uuid}/edit`)
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
              <IconButton size='small' color='info' onClick={() => router.push(`/admin/contracts/${item.uuid}/view`)}>
                <i className='tabler-eye ' />
              </IconButton>

              {/* ✏ EDIT */}
              <IconButton size='small' color='primary' onClick={() => handleEdit(item)}>
                <i className='tabler-edit' />
              </IconButton>

              {/* 📅 SCHEDULE */}
              <IconButton size='small' onClick={() => openPlanDrawer(item)}>
                <i className='tabler-calendar text-green-600 text-[18px]' />
              </IconButton>

              {/* 🗑 DELETE */}
              <IconButton size='small' onClick={() => setDeleteDialog({ open: true, row: item })}>
                <i className='tabler-trash text-red-600 text-[18px]' />
              </IconButton>
            </Box>
          )
        }
      }),

      columnHelper.accessor('customer', {
        id: 'customer_column',
        header: 'Customer'
      }),

      columnHelper.accessor('contractCode', {
        id: 'code_column',
        header: 'Code'
      }),

      columnHelper.accessor('serviceAddress', {
        id: 'address_column',
        header: 'Address'
      }),

      columnHelper.accessor('contractType', {
        id: 'type_column',
        header: 'Type'
      }),

      columnHelper.accessor('startDate', {
        id: 'startDate_column',
        header: 'Start Date'
      }),

      columnHelper.accessor('endDate', {
        id: 'endDate_column',
        header: 'End Date'
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

      columnHelper.accessor('services', {
        id: 'services_column',
        header: 'Services',
        cell: info => info.getValue()?.join(', ') || 'N/A'
      }),

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
    state: { globalFilter: searchText, pagination },
    onGlobalFilterChange: setSearchText,
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
    <Box>
      <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 2 }}>
        <Link underline='hover' color='inherit' href='/'>
          Dashboard
        </Link>
        <Typography color='text.primary'>Contracts</Typography>
      </Breadcrumbs>

      <Card sx={{ p: 3 }}>
        <CardHeader
          sx={{
            pb: 1.5,
            pt: 1.5,
            '& .MuiCardHeader-action': { m: 0, alignItems: 'center' },
            '& .MuiCardHeader-title': { fontWeight: 600, fontSize: '1.125rem' }
          }}
          title={
            <Box display='flex' alignItems='center' gap={2}>
              <Typography variant='h5' sx={{ fontWeight: 600 }}>
                Contracts List
              </Typography>
              <GlobalButton
                variant='contained'
                color='primary'
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
                onClick={async () => {
                  setLoading(true)
                  await loadData()
                  setTimeout(() => setLoading(false), 600)
                }}
                sx={{ textTransform: 'none', fontWeight: 500, px: 2.5, height: 36 }}
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

              <GlobalButton
                variant='contained'
                startIcon={<AddIcon />}
                onClick={() => router.push('/admin/contracts/add')}
                sx={{ textTransform: 'none', fontWeight: 500, px: 2.5, height: 36 }}
              >
                Add Contract
              </GlobalButton>
            </Box>
          }
        />
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
            <Box textAlign='center'>
              <ProgressCircularCustomization size={60} thickness={5} />
              <Typography mt={2} fontWeight={600} color='primary'>
                Loading...
              </Typography>
            </Box>
          </Box>
        )}

        <Divider sx={{ mb: 6 }} />
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end', // ⭐ FIX: Align by bottom (input line)
            mb: 4,
            gap: 2,
            flexWrap: 'nowrap'
          }}
        >
          {/* 🔥 LEFT SIDE: Entries + Filters */}

          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-end', // ⭐ FIX: Align bottom of all fields
              gap: 2,
              flexWrap: 'nowrap'
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

            {/* Customer Filter (AutoComplete) */}

            <GlobalAutocomplete
              fullWidth
              id='customer-filter'
              options={customerOptions}
              getOptionLabel={option => option?.name || ''}
              value={customerOptions.find(opt => opt.id === customerFilter?.id) || null} // <-- FIXED
              onChange={newVal => setCustomerFilter(newVal)} // <-- FIXED
              renderInput={params => (
                <GlobalTextField {...params} label='Customer' placeholder='Select Customer' size='small' />
              )}
              sx={{ width: 300 }}
            />

            {/* Contract Type (AutoComplete) */}
            <GlobalAutocomplete
              fullWidth
              options={CONTRACT_TYPES}
              getOptionLabel={o => o.label}
              value={CONTRACT_TYPES.find(t => t.value === typeFilter) || null}
              onChange={newVal => setTypeFilter(newVal?.value || null)}
              renderInput={params => (
                <GlobalTextField {...params} label='Contract Type' placeholder='Select Type' size='small' />
              )}
              sx={{ width: 220 }}
            />

            {/* Contract Status (AutoComplete) */}
            <GlobalAutocomplete
              fullWidth
              options={CONTRACT_STATUS}
              getOptionLabel={o => o.label}
              value={CONTRACT_STATUS.find(s => s.value === statusFilter) || null}
              onChange={newValue => {
                setStatusFilter(newValue?.value || null)
              }}
              renderInput={params => (
                <GlobalTextField {...params} label='Contract Status' placeholder='Select Status' size='small' />
              )}
              sx={{ width: 220 }}
            />
          </Box>

          {/* 🔍 RIGHT SIDE: Search */}
          <DebouncedInput
            value={searchText}
            onChange={v => {
              const value = String(v)

              if (value.startsWith('uuid:')) {
                const uid = value.replace('uuid:', '').trim()
                setUuidFilter(uid)
                return
              }

              setUuidFilter(null)
              setSearchText(value)
              setPagination(p => ({ ...p, pageIndex: 0 }))
            }}
            placeholder='Search customer, code, address, pests...'
            size='small'
            sx={{
              width: 320, // 🔥 same width
              '& .MuiInputBase-root': {
                height: 36 // 🔥 same height
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
                    {loading ? 'Loading contracts...' : 'No results found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <TablePaginationComponent totalCount={rowCount} pagination={pagination} setPagination={setPagination} />
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
            onClick={() => setDeleteDialog({ open: false })}
            disableRipple
            sx={{ position: 'absolute', right: 1, top: 1 }}
          >
            <i className='tabler-x' />
          </DialogCloseButton>
        </DialogTitle>

        {/* 🧾 Message */}
        <DialogContent sx={{ px: 5, pt: 1 }}>
          <Typography sx={{ color: 'text.secondary', fontSize: 14, lineHeight: 1.6 }}>
            Are you sure you want to delete contract{' '}
            <strong style={{ color: '#d32f2f' }}>{deleteDialog.row?.contractCode || 'this contract'}</strong>?
            <br />
            This action cannot be undone.
          </Typography>
        </DialogContent>

        {/* ⚙️ Buttons */}
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
    </Box>
  )
}
