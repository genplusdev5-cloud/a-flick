'use client'
import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { openDB } from 'idb'
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns'
import {
  Box,
  Button,
  Card,
  CardHeader,
  CardContent,
  Typography,
  Menu,
  MenuItem,
  IconButton,
  Divider,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Breadcrumbs,
  Chip,
  Select,
  TextField,
  FormControl,
  FormControlLabel,
  CircularProgress,
  InputAdornment,
  Checkbox
} from '@mui/material'

import CustomAvatar from '@core/components/mui/Avatar'
import PermissionGuard from '@/components/auth/PermissionGuard'
import { usePermission } from '@/hooks/usePermission'
import PresetDateRangePicker from '@/components/common/PresetDateRangePicker'

import { exportMyob } from '@/api/customer_group/customer'

import { getCustomerList, deleteCustomer } from '@/api/customer_group/customer'
import { getCustomerSummary } from '@/api/customer_group/customer'
import { getCustomerOrigin } from '@/api/customer_group/customer/origin'
import GlobalButton from '@/components/common/GlobalButton'
import GlobalAutocomplete from '@/components/common/GlobalAutocomplete'
import GlobalDateRange from '@/components/common/GlobalDateRange'
import GlobalTextField from '@/components/common/GlobalTextField'
import { getCompanyList } from '@/api/master/company'

import TableChartIcon from '@mui/icons-material/TableChart'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import FileCopyIcon from '@mui/icons-material/FileCopy'

import { showToast } from '@/components/common/Toasts'
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
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'

import GroupIcon from '@mui/icons-material/Group'
import BarChartIcon from '@mui/icons-material/BarChart'
import DialogCloseButton from '@components/dialogs/DialogCloseButton'
import TablePaginationComponent from '@/components/TablePaginationComponent'
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
import DonutChartGeneratedLeads from '@/views/pages/widget-examples/statistics/DonutChartGeneratedLeads'
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

// ───────────────────────────────────────────
// Component
// ───────────────────────────────────────────
// ───────────────────────────────────────────
const CustomersPageContent = () => {
  const { canAccess } = usePermission()
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const [selectedIds, setSelectedIds] = useState([])

  // Initialize pagination from URL search params
  const initialPageIndex = searchParams.get('pageIndex') ? Number(searchParams.get('pageIndex')) : 0
  const initialPageSize = searchParams.get('pageSize') ? Number(searchParams.get('pageSize')) : 25

  const [rows, setRows] = useState([])
  const [rowCount, setRowCount] = useState(0)
  const [searchText, setSearchText] = useState('')
  const [pagination, setPagination] = useState({ pageIndex: initialPageIndex, pageSize: initialPageSize })
  const [loading, setLoading] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, row: null })
  const [exportAnchorEl, setExportAnchorEl] = useState(null)
  const [originMap, setOriginMap] = useState({})

  const [filterOrigin, setFilterOrigin] = useState(null)
  const [filterMyob, setFilterMyob] = useState(null)
  const [companyOptions, setCompanyOptions] = useState([])
  const [sorting, setSorting] = useState([])
  const [uiDateFilter, setUiDateFilter] = useState(false)
  const [uiDateRange, setUiDateRange] = useState([null, null])

  const [appliedSearchText, setAppliedSearchText] = useState('')
  const [appliedFilterOrigin, setAppliedFilterOrigin] = useState(null)
  const [appliedFilterMyob, setAppliedFilterMyob] = useState(null)
  const [appliedDateFilter, setAppliedDateFilter] = useState(false)
  const [appliedDateRange, setAppliedDateRange] = useState([null, null])

  // Sync pagination state to URL search params
  const isFirstRender = useRef(true)

  const handleMyobExport = async () => {
    if (selectedIds.length === 0) {
      showToast('warning', 'Select at least one customer')
      return
    }

    try {
      setLoading(true)

      // 🔥 Convert array → comma separated string
      const items = selectedIds.join(',')

      const res = await exportMyob(items)

      // 🔥 FILE DOWNLOAD
      const blob = new Blob([res.data], {
        type: 'text/csv;charset=utf-8;' // ✅ Changed to CSV
      })

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')

      link.href = url
      link.download = 'MYOB_Customers.csv' // ✅ Changed extension
      document.body.appendChild(link)
      link.click()

      link.remove()
      window.URL.revokeObjectURL(url)

      showToast('success', 'MYOB export completed')

      // reset
      setSelectedIds([])
      setFilterMyob(null)
      handleRefresh()
    } catch (err) {
      console.error(err)
      showToast('error', 'MYOB export failed')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    setAppliedSearchText(searchText)
    setAppliedFilterOrigin(filterOrigin)
    setAppliedFilterMyob(filterMyob)
    setAppliedDateFilter(uiDateFilter)
    setAppliedDateRange(uiDateRange)

    setPagination(p => ({
      ...p,
      pageIndex: 0
    }))
  }

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        page: pagination.pageIndex + 1,
        page_size: pagination.pageSize,
        search: appliedSearchText.trim()
      }

      // Date range params removed for frontend filtering
      // if (appliedDateFilter && appliedDateRange[0]) ...

      if (appliedFilterOrigin?.id) {
        params.company = appliedFilterOrigin.id
      }

      if (appliedFilterMyob?.value) {
        params.myob_status = appliedFilterMyob.value
      }

      const res = await getCustomerList(params)

      let list = res?.results || res?.data?.results || res?.data || []

      // Frontend Date Filtering
      if (appliedDateFilter && appliedDateRange[0] && appliedDateRange[1]) {
        const startDate = startOfDay(appliedDateRange[0])
        const endDate = endOfDay(appliedDateRange[1])

        list = list.filter(item => {
          if (!item.commence_date) return false
          const d = parseISO(item.commence_date)
          return isWithinInterval(d, { start: startDate, end: endDate })
        })
      }

      const normalized = list.map((item, index) => ({
        sno: index + 1,
        id: item.id,
        cardId: item.customer_code || '',
        abssName: item.business_name || '',
        myobStatus: item.myob_status || 'Not Exported',
        status: item.status || 'Active',
        name: item.name,
        email: item.billing_email || item.email || '',
        phone: item.billing_phone || item.pic_phone || '',
        address: item.billing_address || '',
        postalCode: item.postal_code || '',
        commenceDate: item.commence_date || '',
        origin: originMap[item.company_id] || item.company_name || '-',
        contacts: item.contact || []
      }))

      setRows(normalized)
      setRowCount(res?.count || normalized.length)
    } catch (err) {
      showToast('error', 'Failed to load customers')
    } finally {
      setLoading(false)
    }
  }, [
    pagination.pageIndex,
    pagination.pageSize,
    appliedSearchText,
    appliedFilterOrigin,
    appliedFilterMyob,
    appliedDateFilter,
    appliedDateRange,
    originMap
  ])

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const list = await getCompanyList()
        const mapped = list.map(c => ({
          id: c.id,
          label: c.name,
          value: c.id // ✅ Use ID for value to match API expectations
        }))
        setCompanyOptions(mapped)
      } catch (err) {
        console.error('Company list error', err)
      }
    }
    loadCompanies()
  }, [])

  useEffect(() => {
    const loadOrigins = async () => {
      const res = await getCustomerOrigin()
      const list = res?.data || []

      const map = {}
      list.forEach(item => {
        map[item.id] = item.name
      })

      setOriginMap(map)
    }

    loadOrigins()
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleEdit = id => {
    const encodedId = btoa(id.toString())
    router.push(`/en/admin/customers/edit?id=${encodedId}`)
  }

  const confirmDelete = async () => {
    try {
      const res = await deleteCustomer(deleteDialog.row.id)

      if (res.status === 'success') {
        showToast('delete', 'Customer deleted successfully')
        loadData()
      } else {
        showToast('error', res.message || 'Delete failed')
      }
    } catch (err) {
      showToast('error', 'Delete failed')
    } finally {
      setDeleteDialog({ open: false, row: null })
    }
  }

  const [summary, setSummary] = useState({
    total_customers: 0,
    total_myob: 0,
    total_active: 0,
    total_inactive: 0
  })

  useEffect(() => {
    const loadSummary = async () => {
      const res = await getCustomerSummary()
      if (res.status === 'success') {
        setSummary(res.data)
      }
    }

    loadSummary()
  }, [])

  // --- Table ---
  const columnHelper = createColumnHelper()

  const columns = useMemo(
    () => [
      // ✅ 0) CHECKBOX COLUMN (ONLY FOR NOT EXPORTED)
      ...(filterMyob?.value === 'Not Exported'
        ? [
            columnHelper.display({
              id: 'select',
              header: () => (
                <Checkbox
                  checked={rows.length > 0 && selectedIds.length === rows.length}
                  indeterminate={selectedIds.length > 0 && selectedIds.length < rows.length}
                  onChange={e => {
                    setSelectedIds(e.target.checked ? rows.map(r => r.id) : [])
                  }}
                />
              ),
              cell: info => (
                <Checkbox
                  checked={selectedIds.includes(info.row.original.id)}
                  onChange={e => {
                    const id = info.row.original.id
                    setSelectedIds(prev => (e.target.checked ? [...prev, id] : prev.filter(x => x !== id)))
                  }}
                />
              )
            })
          ]
        : []),

      // 1) S.No
      columnHelper.accessor('sno', {
        id: 'sno',
        header: 'S.No'
      }),

      // 2) ACTION
      columnHelper.display({
        id: 'actions',
        header: 'Action',
        cell: info => (
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
            {/* CONTRACT */}
            <IconButton
              size='small'
              color='success'
              onClick={() => {
                const encodedId = btoa(info.row.original.id.toString())
                router.push(`/en/admin/contracts?customer=${encodedId}`)
              }}
            >
              <i className='tabler-file-text' />
            </IconButton>

            {/* EDIT */}
            {canAccess('Customers', 'update') && (
              <IconButton size='small' color='primary' onClick={() => handleEdit(info.row.original.id)}>
                <i className='tabler-edit' />
              </IconButton>
            )}

            {/* DELETE */}
            {canAccess('Customers', 'delete') && (
              <IconButton
                size='small'
                color='error'
                onClick={() => setDeleteDialog({ open: true, row: info.row.original })}
              >
                <i className='tabler-trash text-red-600 text-lg' />
              </IconButton>
            )}
          </Box>
        )
      }),

      // 3) Origin
      columnHelper.accessor('origin', {
        id: 'origin',
        header: 'Origin'
      }),

      // 4) Customer Code
      columnHelper.accessor('cardId', {
        id: 'cardId',
        header: 'Customer Code'
      }),

      // 5) Commence Date
      columnHelper.accessor('commenceDate', {
        header: 'Commence Date',
        sortingFn: dateSortingFn,
        cell: info => {
          const date = info.getValue()
          return date ? new Date(date).toLocaleDateString('en-GB') : '-'
        }
      }),

      // 6) Customer Name
      columnHelper.accessor('name', {
        header: 'Customer Name'
      }),

      // 7) ABSS Customer Name
      columnHelper.accessor('abssName', {
        header: 'Business Name'
      }),

      // 8) Email
      columnHelper.accessor('email', {
        header: 'Contact Email'
      }),

      // 9) Phone
      columnHelper.accessor('phone', {
        header: 'Contact Phone'
      }),

      // 10) Address
      columnHelper.accessor('address', {
        header: 'Billing Address'
      }),

      // 11) Postal Code
      columnHelper.accessor('postalCode', {
        header: 'Postal Code'
      }),

      // 12) MYOB Status
      columnHelper.accessor('myobStatus', {
        header: 'MYOB',
        cell: info => {
          const status = info.getValue()
          return (
            <Chip
              label={status}
              color={status === 'Exported' ? 'success' : 'error'}
              size='small'
              sx={{ fontWeight: 600, color: '#fff', borderRadius: '6px' }}
            />
          )
        }
      }),

      // 13) Status
      columnHelper.accessor('status', {
        header: 'Status',
        cell: info => {
          const raw = info.getValue()
          const value = raw === 1 ? 'Active' : 'Inactive'
          const color = value === 'Active' ? 'success' : 'error'

          return (
            <Chip
              label={value}
              color={color}
              size='small'
              sx={{
                fontWeight: 600,
                color: '#fff',
                borderRadius: '6px',
                textTransform: 'capitalize'
              }}
            />
          )
        }
      })
    ],

    // 🔥🔥🔥 VERY IMPORTANT DEPENDENCIES 🔥🔥🔥
    [filterMyob, selectedIds, rows]
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
    state: { globalFilter: searchText, pagination, sorting },
    onSortingChange: setSorting,
    globalFilterFn: fuzzyFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel()
  })

  // --- Export ---
  const exportOpen = Boolean(exportAnchorEl)
  const exportCSV = () => {
    const headers = ['S.No', 'Origin', 'Email', 'Address', 'Postal Code', 'Name', 'Commence Date', 'Phone']
    const csv = [
      headers.join(','),
      ...rows.map(r =>
        [
          r.sno,
          `"${r.origin}"`,
          `"${r.email}"`,
          `"${r.address}"`,
          `"${r.postalCode}"`,
          `"${r.name}"`,
          r.commenceDate ? new Date(r.commenceDate).toLocaleDateString('en-GB') : '',
          r.phone
        ].join(',')
      )
    ].join('\n')
    const link = document.createElement('a')
    link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    link.download = 'customers.csv'
    link.click()
    showToast('success', 'CSV downloaded')
  }

  const exportPrint = () => {
    const w = window.open('', '_blank')
    const html = `
      <html><head><title>Customer List</title><style>
      body{font-family:Arial;padding:24px;}
      table{width:100%;border-collapse:collapse;}
      th,td{border:1px solid #ccc;padding:8px;text-align:left;}
      th{background:#f4f4f4;}
      </style></head><body>
      <h2>Customer List</h2>
      <table><thead><tr>
      <th>S.No</th><th>Origin</th><th>Email</th><th>Address</th><th>Postal Code</th><th>Name</th><th>Commence Date</th><th>Phone</th>
      </tr></thead><tbody>
      ${rows
        .map(
          r => `<tr>
          <td>${r.sno}</td>
          <td>${r.origin}</td>
          <td>${r.email}</td>
          <td>${r.address}</td>
          <td>${r.postalCode}</td>
          <td>${r.name}</td>
          <td>${r.commenceDate ? new Date(r.commenceDate).toLocaleDateString('en-GB') : ''}</td>
          <td>${r.phone}</td>
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
        <>
          <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 2 }}>
            <Link underline='hover' color='inherit' href='/'>
              Dashboard
            </Link>
            <Typography color='text.primary'>Customer List</Typography>
          </Breadcrumbs>

          {/* Stats Section */}
          <Grid container spacing={3} sx={{ mb: 6 }}>
            <Grid item xs={12} md={9}>
              <Card className='h-full'>
                <CardHeader title='' />
                <CardContent className='flex justify-between flex-wrap gap-4'>
                  <Grid container spacing={4} flex={1}>
                    {/* Total Customers */}
                    <Grid item xs={12} sm={6} md={3} className='flex gap-4 items-center'>
                      <CustomAvatar color='primary' variant='rounded' size={42} skin='light'>
                        <i className='tabler-users text-[26px]' />
                      </CustomAvatar>
                      <div>
                        <Typography variant='h5'>{summary.total_customers}</Typography>
                        <Typography variant='body2'>Total Customers</Typography>
                      </div>
                    </Grid>

                    {/* MYOB Exported */}
                    <Grid item xs={12} sm={6} md={3} className='flex gap-4 items-center'>
                      <CustomAvatar color='secondary' variant='rounded' size={42} skin='light'>
                        <i className='tabler-chart-bar text-[26px]' />
                      </CustomAvatar>
                      <div>
                        <Typography variant='h5'>{summary.total_myob}</Typography>
                        <Typography variant='body2'>MYOB Exported</Typography>
                      </div>
                    </Grid>

                    {/* Active */}
                    <Grid item xs={12} sm={6} md={3} className='flex gap-4 items-center'>
                      <CustomAvatar color='success' variant='rounded' size={42} skin='light'>
                        <i className='tabler-circle-check text-[26px]' />
                      </CustomAvatar>
                      <div>
                        <Typography variant='h5' color='success.main'>
                          {summary.total_active}
                        </Typography>
                        <Typography variant='body2'>Active</Typography>
                      </div>
                    </Grid>

                    {/* Inactive */}
                    <Grid item xs={12} sm={6} md={3} className='flex gap-4 items-center'>
                      <CustomAvatar color='error' variant='rounded' size={42} skin='light'>
                        <i className='tabler-circle-x text-[26px]' />
                      </CustomAvatar>
                      <div>
                        <Typography variant='h5' color='error.main'>
                          {summary.total_inactive}
                        </Typography>
                        <Typography variant='body2'>Inactive</Typography>
                      </div>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <DonutChartGeneratedLeads
                title='Customer Status'
                subtitle='Active vs Inactive'
                total={summary.total_customers}
                series={[summary.total_active, summary.total_inactive]}
                labels={['Active', 'Inactive']}
                customColors={['var(--mui-palette-success-main)', 'var(--mui-palette-error-main)']}
                size={180}
              />
            </Grid>
          </Grid>
        </>
      }
    >
      <Card sx={{ display: 'flex', flexDirection: 'column', maxHeight: '100%', minHeight: 0 }}>
        <CardHeader
          title={
            <Box display='flex' alignItems='center' gap={2}>
              <Typography variant='h5' fontWeight={600}>
                Customer List
              </Typography>
            </Box>
          }
          action={
            <Box display='flex' alignItems='center' gap={2}>
              {filterMyob?.value === 'Not Exported' && (
                <GlobalButton
                  variant='contained'
                  color='success'
                  disabled={selectedIds.length === 0}
                  onClick={handleMyobExport}
                  sx={{ textTransform: 'none', fontWeight: 500, px: 2.5, height: 36 }}
                >
                  Export
                </GlobalButton>
              )}

              <GlobalButton
                variant='contained'
                color='secondary'
                onClick={e => setExportAnchorEl(e.currentTarget)}
                startIcon={<FileDownloadIcon />}
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

              {canAccess('Customers', 'create') && (
                <GlobalButton
                  variant='contained'
                  startIcon={<AddIcon />}
                  onClick={() => router.push('/admin/customers/add')}
                  sx={{ textTransform: 'none', fontWeight: 500, px: 2.5, height: 36 }}
                >
                  Add Customer
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

            {/* Origin */}
            <Box sx={{ width: 220 }}>
              <GlobalAutocomplete
                label='Origin'
                placeholder='Select Origin'
                options={companyOptions}
                value={filterOrigin}
                getOptionLabel={opt => opt?.label || ''}
                isOptionEqualToValue={(a, b) => a?.id === b?.id}
                onChange={val => {
                  setFilterOrigin(val)
                }}
              />
            </Box>

            {/* MYOB Status */}
            <Box sx={{ width: 220 }}>
              <GlobalAutocomplete
                label='MYOB Status'
                placeholder='Select'
                options={[{ id: 2, label: 'Not Exported', value: 'Not Exported' }]}
                value={filterMyob}
                getOptionLabel={opt => opt?.label || ''}
                isOptionEqualToValue={(a, b) => a?.id === b?.id}
                onChange={val => {
                  setFilterMyob(val)
                  setSelectedIds([]) // 🔥 RESET selection
                }}
              />
            </Box>

            {/* Refresh Button */}
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
              onClick={handleRefresh}
              sx={{ textTransform: 'none', fontWeight: 500, px: 2.5, height: 36 }}
            >
              {loading ? 'Refreshing...' : 'Refresh'}
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
            <FormControl size='small' sx={{ width: 140 }}>
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

            {/* Search */}
            <DebouncedInput
              value={searchText}
              onChange={v => {
                setSearchText(String(v))
              }}
              placeholder='Search by Name, Email, Address, Origin...'
              sx={{ width: 420 }}
              variant='outlined'
              size='small'
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position='start'>
                      <SearchIcon />
                    </InputAdornment>
                  )
                }
              }}
            />
          </Box>

          <Box sx={{ position: 'relative', flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <div className={classnames('customer-table', { 'has-select': filterMyob?.value === 'Not Exported' })}>
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
                            <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                          ))}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={columns.length} className='text-center py-4'>
                          {loading ? 'Loading customers...' : 'No results found'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </StickyTableWrapper>
            </div>
          </Box>

          <Box sx={{ flexShrink: 0, mt: 'auto' }}>
            <TablePaginationComponent totalCount={rowCount} pagination={pagination} setPagination={setPagination} />
          </Box>
        </Box>
      </Card>

      {/* Delete Confirmation Dialog */}
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
            Are you sure you want to delete customer{' '}
            <strong style={{ color: '#d32f2f' }}>{deleteDialog.row?.name || 'this customer'}</strong>?
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
            {loading ? 'Deleting...' : 'Delete'}
          </GlobalButton>
        </DialogActions>
      </Dialog>
    </StickyListLayout>
  )
}

// Wrapper for RBAC
export default function CustomersPage() {
  return (
    <PermissionGuard permission='Customers'>
      <CustomersPageContent />
    </PermissionGuard>
  )
}
