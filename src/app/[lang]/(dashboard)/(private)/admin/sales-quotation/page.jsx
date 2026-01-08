'use client'
import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import AddIcon from '@mui/icons-material/Add'
import PrintIcon from '@mui/icons-material/Print'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import TableChartIcon from '@mui/icons-material/TableChart'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import FileCopyIcon from '@mui/icons-material/FileCopy'
import RefreshIcon from '@mui/icons-material/Refresh'
import SearchIcon from '@mui/icons-material/Search'
import { useRouter } from 'next/navigation'

import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import GlobalAutocomplete from '@/components/common/GlobalAutocomplete'
import PresetDateRangePicker from '@/components/common/PresetDateRangePicker'
import {
  Box,
  Card,
  CardHeader,
  Button,
  Typography,
  Grid,
  TextField,
  MenuItem,
  InputAdornment,
  Divider,
  Breadcrumbs,
  Menu,
  FormControl,
  Checkbox,
  FormControlLabel,
  Select,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material'

import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import DialogCloseButton from '@components/dialogs/DialogCloseButton'
import { getSortedRowModel } from '@tanstack/react-table'

import styles from '@core/styles/table.module.css'
import PermissionGuard from '@/components/auth/PermissionGuard'
import StickyTableWrapper from '@/components/common/StickyTableWrapper'
import TablePaginationComponent from '@/components/TablePaginationComponent'
import StickyListLayout from '@/components/common/StickyListLayout'
import GlobalButton from '@/components/common/GlobalButton'
import { showToast } from '@/components/common/Toasts'
import { IconButton, Chip } from '@mui/material'

// ✅ APIs
import { getProposalList, getProposalFilters, deleteProposal } from '@/api/proposal'
import { encodeId } from '@/utils/urlEncoder'

const SalesQuotationPage = () => {
  const router = useRouter()
  const [filters, setFilters] = useState({
    date: '',
    origin: '',
    contractType: '',
    status: '',
    salesperson: '',
    customer: '',
    search: ''
  })

  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 50 })
  const [rows, setRows] = useState([])
  const [rowCount, setRowCount] = useState(0)
  const [sorting, setSorting] = useState([])
  const columnHelper = createColumnHelper()

  const [loading, setLoading] = useState(false)
  const [exportAnchorEl, setExportAnchorEl] = useState(null)

  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    row: null
  })

  // ---------------- DELETE ----------------
  const confirmDelete = async () => {
    try {
      const id = deleteDialog.row?.id
      if (!id) return

      await deleteProposal(id)
      showToast('delete', 'Sales quotation deleted successfully')
      setDeleteDialog({ open: false, row: null })
      loadData()
    } catch (error) {
      console.error('❌ Delete Error:', error)
      showToast('error', 'Failed to delete sales quotation')
    }
  }

  const [uiDateFilter, setUiDateFilter] = useState(false)
  const [uiDateRange, setUiDateRange] = useState([null, null])

  const [appliedDateFilter, setAppliedDateFilter] = useState(false)
  const [appliedDateRange, setAppliedDateRange] = useState([null, null])

  // ---------------- COLUMNS ----------------
  const columns = useMemo(
    () => [
      columnHelper.accessor('sno', {
        header: 'S.No',
        cell: info => <Typography color='text.primary'>{info.row.original.sno}</Typography>
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        size: 100,
        cell: ({ row }) => {
          const encodedId = encodeId(row.original.id)
          return (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton
                size='small'
                color='primary'
                onClick={() => router.push(`/admin/sales-quotation/${encodedId}/edit`)}
              >
                <i className='tabler-edit' />
              </IconButton>
              <IconButton size='small' color='error' onClick={() => setDeleteDialog({ open: true, row: row.original })}>
                <i className='tabler-trash' />
              </IconButton>
            </Box>
          )
        }
      }),
      columnHelper.accessor(row => row.proposal_contract_type || row.proposal_type || '-', {
        id: 'type',
        header: 'Type',
        cell: info => <Typography sx={{ textTransform: 'capitalize' }}>{info.getValue()}</Typography>
      }),
      columnHelper.accessor(row => row.proposal_code || row.contract_code || '-', {
        id: 'proposal_code',
        header: 'Proposal Code',
        cell: info => (
          <Typography color='primary' fontWeight={500}>
            {info.getValue()}
          </Typography>
        )
      }),
      columnHelper.accessor(row => row.customer_name || row.name || '-', {
        id: 'customer',
        header: 'Customer',
        cell: info => <Typography>{info.getValue()}</Typography>
      }),
      columnHelper.accessor('proposal_date', {
        header: 'Date',
        cell: info => <Typography>{info.getValue() || '-'}</Typography>
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: info => {
          const raw = info.row.original.status
          const approved = info.row.original.is_approved

          let label = 'Pending'
          let color = 'warning'

          if (raw === 1 || approved === true) {
            label = 'Approved'
            color = 'success'
          } else if (raw === 0) {
            label = 'Pending'
          }

          return <Chip label={label} color={color} size='small' variant='tonal' sx={{ fontWeight: 600 }} />
        }
      })
    ],
    [pagination.pageIndex, pagination.pageSize]
  )

  // ---------------- OPTIONS ----------------
  const [filterOptions, setFilterOptions] = useState({
    origins: [],
    customers: [],
    contractTypes: [],
    statuses: [],
    salesPersons: []
  })

  // ---------------- FETCH FILTERS ----------------
  const fetchFilters = async () => {
    try {
      const res = await getProposalFilters()
      console.log('🔍 PROPOSAL FILTERS RAW:', res)

      // ✅ RECURSIVE DATA HUNTER (FIND LISTS ANYWHERE)
      const findList = (obj, targetKey) => {
        if (!obj || typeof obj !== 'object') return null

        // 1. Direct match (e.g. data.companies)
        if (Array.isArray(obj[targetKey])) return obj[targetKey]

        // 2. Nested name (e.g. data.company.name)
        if (obj[targetKey] && Array.isArray(obj[targetKey].name)) return obj[targetKey].name
        if (obj[targetKey] && Array.isArray(obj[targetKey].data)) return obj[targetKey].data

        // 3. Recursive deep search
        for (const key in obj) {
          if (typeof obj[key] === 'object') {
            const found = findList(obj[key], targetKey)
            if (found) return found
          }
        }
        return null
      }

      const body = res?.data || res || {}

      const origins = findList(body, 'company') || findList(body, 'companies') || []
      const customers = findList(body, 'customer') || findList(body, 'customers') || []
      const contractTypes = findList(body, 'proposalContractTypes') || findList(body, 'contract_types') || []
      const statuses = findList(body, 'statuses') || findList(body, 'status') || []
      const salesPersons =
        findList(body, 'sales') || // 🔥 THIS IS THE KEY
        findList(body, 'salesPersons') ||
        findList(body, 'sales_person') ||
        findList(body, 'employees') ||
        []

      const mapToOptions = list => {
        if (!Array.isArray(list)) return []
        return list.map(item => {
          if (typeof item === 'string') return { label: item, value: item }
          return {
            label: String(item.name || item.label || item.company_name || item.customer_name || item).trim(),
            value: item.id || item.value || item
          }
        })
      }

      setFilterOptions({
        origins: mapToOptions(origins),
        customers: mapToOptions(customers),
        contractTypes: mapToOptions(contractTypes),
        statuses: mapToOptions(statuses),
        salesPersons: mapToOptions(salesPersons)
      })
    } catch (err) {
      console.error('❌ Failed to fetch filters:', err)
      showToast('error', 'Failed to load filter options')
    }
  }

  // ---------------- LOAD DATA ----------------
  const loadData = async () => {
    setLoading(true)
    try {
      const sort = sorting[0]

      const params = {
        page: pagination.pageIndex + 1,
        page_size: pagination.pageSize,
        search: filters.search || undefined,
        company_id: filters.origin || undefined,
        proposal_contract_type: filters.contractType || undefined,
        status: filters.status || undefined,
        sales_person: filters.salesperson || undefined,
        customer_id: filters.customer || undefined,

        // 🔥 SORTING PARAMS
        ordering: sort ? `${sort.desc ? '-' : ''}${sort.id}` : undefined
      }

      if (appliedDateFilter && appliedDateRange[0] && appliedDateRange[1]) {
        params.from_date = appliedDateRange[0].toISOString().split('T')[0]
        params.to_date = appliedDateRange[1].toISOString().split('T')[0]
      }

      const res = await getProposalList(params)
      const list = res?.data?.results || res?.results || []

      setRows(
        list.map((row, index) => ({
          ...row,
          sno: pagination.pageIndex * pagination.pageSize + index + 1
        }))
      )

      setRowCount(res?.data?.count || res?.count || list.length)
    } catch (err) {
      showToast('error', 'Failed to load sales quotations')
    } finally {
      setLoading(false)
    }
  }

  // ---------------- EFFECTS ----------------
  useEffect(() => {
    fetchFilters()
  }, [])

  useEffect(() => {
    loadData()
  }, [
    pagination.pageIndex,
    pagination.pageSize,
    appliedDateFilter,
    appliedDateRange,
    filters.origin,
    filters.contractType,
    filters.status,
    filters.salesperson,
    filters.customer
  ])

  const handleRefresh = () => {
    setAppliedDateFilter(uiDateFilter)
    setAppliedDateRange(uiDateRange)
    setPagination(p => ({ ...p, pageIndex: 0 }))
    if (!uiDateFilter) loadData() // Manual trigger if date filter didn't change but refresh was clicked
  }

  const table = useReactTable({
    data: rows,
    columns,
    state: { pagination, sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(), // 🔥 ADD THIS
    manualPagination: true,
    pageCount: Math.ceil(rowCount / pagination.pageSize)
  })

  // Export handlers
  const exportOpen = Boolean(exportAnchorEl)
  const handleExportClose = () => setExportAnchorEl(null)

  return (
    <PermissionGuard permission='Sales Quotation'>
      <StickyListLayout
        header={
          <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 2 }}>
            <Link underline='hover' color='inherit' href='/'>
              Home
            </Link>
            <Typography color='text.secondary'>Sales</Typography>
            <Typography color='text.primary'>Sales Quotation</Typography>
          </Breadcrumbs>
        }
      >
        <Card sx={{ display: 'flex', flexDirection: 'column', maxHeight: '100%', minHeight: 0 }}>
          <CardHeader
            title={
              <Box display='flex' alignItems='center' gap={2}>
                <Typography variant='h5' fontWeight={600}>
                  Sales Quotation
                </Typography>
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

                <Menu anchorEl={exportAnchorEl} open={exportOpen} onClose={handleExportClose}>
                  <MenuItem onClick={handleExportClose}>
                    <PrintIcon fontSize='small' sx={{ mr: 1 }} /> Print
                  </MenuItem>
                  <MenuItem onClick={handleExportClose}>
                    <FileDownloadIcon fontSize='small' sx={{ mr: 1 }} /> CSV
                  </MenuItem>
                  <MenuItem onClick={handleExportClose}>
                    <TableChartIcon fontSize='small' sx={{ mr: 1 }} /> Excel
                  </MenuItem>
                  <MenuItem onClick={handleExportClose}>
                    <PictureAsPdfIcon fontSize='small' sx={{ mr: 1 }} /> PDF
                  </MenuItem>
                  <MenuItem onClick={handleExportClose}>
                    <FileCopyIcon fontSize='small' sx={{ mr: 1 }} /> Copy
                  </MenuItem>
                </Menu>

                <GlobalButton
                  variant='contained'
                  startIcon={<AddIcon />}
                  onClick={() => router.push('/admin/sales-quotation/add')}
                >
                  Add Proposal
                </GlobalButton>
              </Box>
            }
          />

          <Divider />

          <Box sx={{ p: 4, flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* ================= FILTERS ================= */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: 2,
                mb: 3,
                flexWrap: 'wrap'
              }}
            >
              {/* Date Filter */}
              <Box sx={{ width: 220 }}>
                <FormControlLabel
                  sx={{ mb: 0.5 }}
                  control={<Checkbox checked={uiDateFilter} onChange={e => setUiDateFilter(e.target.checked)} />}
                  label='Date Filter'
                />
                <PresetDateRangePicker
                  start={uiDateRange[0]}
                  end={uiDateRange[1]}
                  onSelectRange={({ start, end }) => setUiDateRange([start, end])}
                  disabled={!uiDateFilter}
                />
              </Box>

              {/* Origin */}
              <Box sx={{ width: 220 }}>
                <GlobalAutocomplete
                  label='Origin'
                  placeholder='Select Origin'
                  options={filterOptions.origins}
                  value={filters.origin ? filterOptions.origins.find(o => o.value === filters.origin) || null : null}
                  onChange={val => setFilters({ ...filters, origin: val?.value || '' })}
                />
              </Box>

              {/* Proposal Contract Type */}
              <Box sx={{ width: 220 }}>
                <GlobalAutocomplete
                  label='Proposal Contract Type'
                  placeholder='Select Type'
                  options={filterOptions.contractTypes}
                  value={
                    filters.contractType
                      ? filterOptions.contractTypes.find(t => t.value === filters.contractType) || null
                      : null
                  }
                  onChange={val => setFilters({ ...filters, contractType: val?.value || '' })}
                />
              </Box>

              {/* Proposal Status */}
              <Box sx={{ width: 220 }}>
                <GlobalAutocomplete
                  label='Proposal Status'
                  placeholder='Select Status'
                  options={filterOptions.statuses}
                  value={filters.status ? filterOptions.statuses.find(s => s.value === filters.status) || null : null}
                  onChange={val => setFilters({ ...filters, status: val?.value || '' })}
                />
              </Box>

              {/* Sales Person */}
              <Box sx={{ width: 220 }}>
                <GlobalAutocomplete
                  label='Sales Person'
                  placeholder='Select Sales Person'
                  options={filterOptions.salesPersons}
                  value={
                    filters.salesperson
                      ? filterOptions.salesPersons.find(s => s.value === filters.salesperson) || null
                      : null
                  }
                  onChange={val => setFilters({ ...filters, salesperson: val?.value || '' })}
                />
              </Box>

              {/* Customer */}
              <Box sx={{ width: 240 }}>
                <GlobalAutocomplete
                  label='Customer'
                  placeholder='Select Customer'
                  options={filterOptions.customers}
                  value={
                    filters.customer ? filterOptions.customers.find(c => c.value === filters.customer) || null : null
                  }
                  onChange={val => setFilters({ ...filters, customer: val?.value || '' })}
                />
              </Box>
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
                onClick={handleRefresh}
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </GlobalButton>
            </Box>

            <Divider sx={{ mb: 4 }} />

            {/* ================= TABLE ACTIONS ================= */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 3
              }}
            >
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

              <TextField
                size='small'
                placeholder='Search...'
                value={filters.search}
                onChange={e => setFilters({ ...filters, search: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position='start'>
                      <SearchIcon fontSize='small' />
                    </InputAdornment>
                  )
                }}
              />
            </Box>

            {/* ================= TABLE ================= */}
            <Box sx={{ position: 'relative', flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
              <StickyTableWrapper rowCount={rows.length}>
                <table className={styles.table}>
                  <thead>
                    {table.getHeaderGroups().map(headerGroup => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map(header => (
                          <th key={header.id}>
                            <Box
                              onClick={header.column.getToggleSortingHandler()}
                              sx={{
                                cursor: header.column.getCanSort() ? 'pointer' : 'default',
                                display: 'flex',
                                alignItems: 'center',
                                userSelect: 'none',
                                gap: 1
                              }}
                            >
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              {header.column.getIsSorted() && (
                                <i
                                  className={
                                    header.column.getIsSorted() === 'asc' ? 'tabler-chevron-up' : 'tabler-chevron-down'
                                  }
                                />
                              )}
                            </Box>
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
                        <td colSpan={columns.length} align='center' style={{ padding: '24px' }}>
                          No data available in table
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </StickyTableWrapper>
            </Box>

            {/* Delete Confirmation Dialog */}
            <Dialog
              onClose={() => setDeleteDialog({ open: false, row: null })}
              open={deleteDialog.open}
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
                  Are you sure you want to delete proposal{' '}
                  <strong style={{ color: '#d32f2f' }}>{deleteDialog.row?.proposal_code}</strong>?
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
                  {loading ? 'Deleting...' : 'Delete'}
                </GlobalButton>
              </DialogActions>
            </Dialog>

            {/* ================= PAGINATION ================= */}
            <Box sx={{ mt: 'auto', pt: 2 }}>
              <TablePaginationComponent totalCount={rowCount} pagination={pagination} setPagination={setPagination} />
            </Box>
          </Box>
        </Card>
      </StickyListLayout>
    </PermissionGuard>
  )
}

export default SalesQuotationPage
