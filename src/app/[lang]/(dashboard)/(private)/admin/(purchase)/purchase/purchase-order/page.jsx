'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useEffect } from 'react'

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
  Drawer,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Breadcrumbs,
  Chip,
  TextField,
  Select,
  FormControl,
  InputLabel,
  FormControlLabel, // ✅ ADD
  Checkbox, // ✅ ADD
  InputAdornment // ✅ ALSO REQUIRED (you use it in Search)
} from '@mui/material'

import StickyListLayout from '@/components/common/StickyListLayout'
import { useRouter, useParams } from 'next/navigation'
import classnames from 'classnames'
import { ChevronRight } from '@mui/icons-material'
import { showToast } from '@/components/common/Toasts'

import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns'
import DialogCloseButton from '@components/dialogs/DialogCloseButton'
import StickyTableWrapper from '@/components/common/StickyTableWrapper'
import TablePaginationComponent from '@/components/TablePaginationComponent'
import RefreshIcon from '@mui/icons-material/Refresh'
import GlobalAutocomplete from '@/components/common/GlobalAutocomplete'

import GlobalButton from '@/components/common/GlobalButton'
import GlobalTextField from '@/components/common/GlobalTextField'

import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import AddIcon from '@mui/icons-material/Add'
import SearchIcon from '@mui/icons-material/Search'
import PrintIcon from '@mui/icons-material/Print'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import PresetDateRangePicker from '@/components/common/PresetDateRangePicker'

import WarningAmberIcon from '@mui/icons-material/WarningAmber'

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper
} from '@tanstack/react-table'

import PermissionGuard from '@/components/auth/PermissionGuard'

import styles from '@core/styles/table.module.css'

import {
  addPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,
  getPurchaseFilters,
  getPurchaseOrderList
} from '@/api/purchase/purchase_order'
import { getSupplierList } from '@/api/stock/supplier'

const poStatusOptions = [
  { id: 1, label: 'Pending', value: 'Pending' },
  { id: 2, label: 'Approved', value: 'Approved' },
  { id: 3, label: 'Completed', value: 'Completed' },
  { id: 4, label: 'Canceled', value: 'Canceled' }
]

const poStatusColorMap = {
  Pending: 'warning',
  Approved: 'info',
  Completed: 'success',
  Canceled: 'error'
}

/* ─────────────────────────────
   Component
───────────────────────────── */
const PurchaseOrderPage = () => {
  const columnHelper = createColumnHelper()

  const router = useRouter()
  const { lang } = useParams()

  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 })
  const [exportAnchorEl, setExportAnchorEl] = useState(null)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [sorting, setSorting] = useState([])

  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    row: null
  })

  const [deleteLoading, setDeleteLoading] = useState(false)

  // UI Date Filter
  const [uiDateFilter, setUiDateFilter] = useState(false)

  // Date Range (start, end)
  const [uiDateRange, setUiDateRange] = useState([null, null])

  // Filter dropdown options
  const [originOptions, setOriginOptions] = useState([])
  const [supplierOptions, setSupplierOptions] = useState([])

  // Selected filter values (UI State)
  const [filterOrigin, setFilterOrigin] = useState(null)
  const [filterSupplier, setFilterSupplier] = useState(null)
  const [filterStatus, setFilterStatus] = useState(null)

  // Applied filter values (Actual filter used for fetching)
  const [appliedFilterOrigin, setAppliedFilterOrigin] = useState(null)
  const [appliedFilterSupplier, setAppliedFilterSupplier] = useState(null)
  const [appliedFilterStatus, setAppliedFilterStatus] = useState(null)
  const [filterPoNo, setFilterPoNo] = useState(null)
  const [appliedFilterPoNo, setAppliedFilterPoNo] = useState(null)
  const [poNoOptions, setPoNoOptions] = useState([])

  const [appliedDateFilter, setAppliedDateFilter] = useState(false)
  const [appliedDateRange, setAppliedDateRange] = useState([null, null])

  const [searchQuery, setSearchQuery] = useState('')
  const [appliedSearchQuery, setAppliedSearchQuery] = useState('')

  const fetchFilterOptions = async () => {
    try {
      const [filterRes, supplierRes] = await Promise.all([getPurchaseFilters(), getSupplierList()])

      // Fix: Check if data is nested or direct
      // Robust fallback: filterRes.data.data -> filterRes.data -> filterRes
      const dropdownData = filterRes?.data?.data || filterRes?.data || filterRes || {}

      // ✅ Origin (company)
      const origins =
        dropdownData?.company?.name?.map(item => ({
          label: item.name,
          value: item.name,
          id: item.id
        })) || []

      // ✅ Supplier (from Master)
      // Fix: supplierRes might be { count: ..., results: ... }, { data: { results: ... } }, or direct array
      // supplierRes is the Axios response, so we look at supplierRes.data
      const supplierData = supplierRes?.data
      console.log('Supplier Filter Debug:', supplierData) // DEBUG

      let supplierList = []
      if (Array.isArray(supplierData?.data?.results)) {
        supplierList = supplierData.data.results
      } else if (Array.isArray(supplierData?.data)) {
        supplierList = supplierData.data
      } else if (Array.isArray(supplierData?.results)) {
        supplierList = supplierData.results
      } else if (Array.isArray(supplierData)) {
        supplierList = supplierData
      }

      const suppliers = supplierList.map(item => ({
        label: item.name,
        value: item.name,
        id: item.id
      }))

      setOriginOptions(origins)
      setSupplierOptions(suppliers)

      // Default Origin: A-Flick Pte Ltd
      const defaultOrigin = origins.find(o => o.label === 'A-Flick Pte Ltd')
      if (defaultOrigin) {
        setFilterOrigin(defaultOrigin)
        // setAppliedFilterOrigin(defaultOrigin)  // ❌ REMOVED: Don't filter on mount
      }
    } catch (err) {
      console.error('Filter fetch failed', err)
    }
  }

  useEffect(() => {
    fetchFilterOptions()
  }, [])

  useEffect(() => {
    const fetchPoOptions = async () => {
      if (!filterSupplier) {
        setPoNoOptions([])
        setFilterPoNo(null)
        return
      }
      try {
        const res = await getPurchaseOrderList({
          company: filterOrigin?.id,
          supplier_id: filterSupplier.id,
          page_size: 1000
        })
        const items = res?.data?.results || res?.results || []
        setPoNoOptions(
          items.map(item => ({
            label: item.po_number || item.num_series,
            value: item.id,
            id: item.id
          }))
        )
      } catch (err) {
        console.error('PO options fetch failed', err)
      }
    }
    fetchPoOptions()
  }, [filterSupplier, filterOrigin])

  const columns = useMemo(
    () => [
      columnHelper.accessor('sno', {
        header: 'S.No',
        enableSorting: true
      }),

      columnHelper.display({
        id: 'actions',
        header: 'Action',
        enableSorting: false,
        cell: info => {
          const rowData = info.row.original

          return (
            <Box sx={{ display: 'flex', gap: 1 }}>
              {/* <IconButton size='small' color='primary'>
                <i className='tabler-eye' />
              </IconButton> */}

              <IconButton
                size='small'
                color='primary'
                onClick={() =>
                  router.push(
                    `/${lang}/admin/purchase/purchase-order/update/${btoa(rowData.id)}?type=${rowData.recordType || 'tm'}`
                  )
                }
              >
                <i className='tabler-edit' />
              </IconButton>

              <IconButton
                size='small'
                color='error'
                onClick={() =>
                  setDeleteDialog({
                    open: true,
                    row: rowData
                  })
                }
              >
                <i className='tabler-trash' />
              </IconButton>
            </Box>
          )
        }
      }),

      columnHelper.accessor('origin', {
        header: 'Origin'
      }),

      columnHelper.accessor('poNo', {
        header: 'PO No.'
      }),

      columnHelper.accessor('poDate', {
        header: 'PO Date',
        cell: info => (info.getValue() ? format(new Date(info.getValue()), 'dd/MM/yyyy') : '-')
      }),

      columnHelper.accessor('supplierName', {
        header: 'Supplier Name'
      }),

      columnHelper.accessor('totalAmount', {
        header: () => <div style={{ textAlign: 'right', width: '100%' }}>Total Amount</div>,
        cell: info => <div style={{ textAlign: 'right' }}>{info.getValue() || '0.00'}</div>
      }),

      columnHelper.accessor('noOfItems', {
        header: () => <div style={{ textAlign: 'right', width: '100%' }}>No. of Items</div>,
        cell: info => <div style={{ textAlign: 'right' }}>{info.getValue() || 0}</div>
      }),

      columnHelper.accessor('remarks', {
        header: 'Remarks'
      }),

      columnHelper.accessor('status', {
        header: 'Status',
        cell: info => (
          <Chip
            label={info.getValue() || '-'}
            color={poStatusColorMap[info.getValue()] || 'default'}
            size='small'
            sx={{
              fontWeight: 600,
              color: '#fff',
              borderRadius: '6px',
              minWidth: 90,
              textAlign: 'center'
            }}
          />
        )
      })
    ],
    [router, lang]
  )

  const table = useReactTable({
    data: rows,
    columns,
    state: {
      sorting
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel()
  })

  useEffect(() => {
    fetchPurchaseOrders()
  }, [
    pagination.pageIndex,
    pagination.pageSize,
    appliedFilterOrigin,
    appliedFilterSupplier,
    appliedFilterStatus,
    appliedFilterPoNo,
    appliedDateFilter,
    appliedDateRange,
    appliedSearchQuery
  ])

  const confirmDelete = async () => {
    if (!deleteDialog.row?.id) return

    try {
      setDeleteLoading(true)

      await deletePurchaseOrder({
        id: deleteDialog.row.id,
        type: deleteDialog.row.recordType || 'tm'
      })

      // ✅ SUCCESS TOAST (CORRECT FORMAT)
      showToast('Purchase Order deleted successfully', 'delete')

      setDeleteDialog({ open: false, row: null })
      fetchPurchaseOrders()
    } catch (error) {
      console.error('Delete failed', error)

      // ❌ ERROR TOAST
      showToast(error?.response?.data?.message || 'Failed to delete purchase order. Please try again.', 'error')
    } finally {
      setDeleteLoading(false)
    }
  }

  const fetchPurchaseOrders = async (
    origin = appliedFilterOrigin,
    supplier = appliedFilterSupplier,
    status = appliedFilterStatus,
    poNo = appliedFilterPoNo,
    dateFilter = appliedDateFilter,
    dateRange = appliedDateRange,
    search = appliedSearchQuery,
    pageIdx = pagination.pageIndex
  ) => {
    try {
      setLoading(true)

      const params = {
        page: pageIdx + 1,
        page_size: pagination.pageSize,
        company: origin?.id,
        company_id: origin?.id, // Fallback
        supplier_id: supplier?.id,
        status: status?.label,
        po_status: status?.label, // Fallback
        id: poNo?.id,
        po_id: poNo?.id, // Fallback
        search: search.trim()
      }

      // Backend Date Filtering
      if (dateFilter && dateRange[0]) {
        if (dateRange[0] && dateRange[1]) {
          const from = format(dateRange[0], 'yyyy-MM-dd')
          const to = format(dateRange[1], 'yyyy-MM-dd')
          params.from_date = from
          params.to_date = to
          params.start_date = from // Fallback
          params.end_date = to // Fallback
          params.po_from_date = from // Fallback
          params.po_to_date = to // Fallback
        } else {
          const d = format(dateRange[0], 'yyyy-MM-dd')
          params.date = d
          params.po_date = d // Fallback
        }
      }

      const res = await getPurchaseOrderList(params)

      let rawResults = res?.data?.results || []

      const mappedRows = rawResults.map((item, index) => ({
        sno: pagination.pageIndex * pagination.pageSize + (index + 1),
        id: item.id,

        origin: item.company,
        supplierName: item.supplier,

        poNo: item.po_number || item.num_series,
        poDate: item.po_date,
        rawDate: item.po_date, // Store raw date
        totalAmount: item.total_amount,
        remarks: item.remarks,
        noOfItems: item.no_of_items || item.order_items?.length || 0,
        status: item.po_status,
        recordType: item.record_type || 'tm' // Capture type
      }))

      setRows(mappedRows)
      setTotalCount(res?.count || 0)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setAppliedFilterOrigin(filterOrigin)
    setAppliedFilterSupplier(filterSupplier)
    setAppliedFilterStatus(filterStatus)
    setAppliedFilterPoNo(filterPoNo)
    setAppliedDateFilter(uiDateFilter)
    setAppliedDateRange(uiDateRange)
    setAppliedSearchQuery(searchQuery)

    setPagination({ pageIndex: 0, pageSize: pagination.pageSize })

    // Force fetch with current UI values to override useEffect's state check
    // fetchPurchaseOrders(
    //   filterOrigin,
    //   filterSupplier,
    //   filterStatus,
    //   filterPoNo,
    //   uiDateFilter,
    //   uiDateRange,
    //   searchQuery,
    //   0
    // )
  }

  return (
    <StickyListLayout
      header={
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link href='/' style={{ textDecoration: 'none' }}>
            Dashboard
          </Link>
          <Typography color='text.primary'>Purchase Order</Typography>
        </Breadcrumbs>
      }
    >
      <Card sx={{ maxHeight: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* HEADER */}
        <CardHeader
          title={
            <Typography variant='h5' fontWeight={600}>
              Purchase Order
            </Typography>
          }
          action={
            <Box display='flex' gap={2}>
              {/* Export */}
              <GlobalButton
                color='secondary'
                endIcon={<ArrowDropDownIcon />}
                onClick={e => setExportAnchorEl(e.currentTarget)}
                sx={{ height: 36 }}
              >
                Export
              </GlobalButton>

              <Menu anchorEl={exportAnchorEl} open={Boolean(exportAnchorEl)} onClose={() => setExportAnchorEl(null)}>
                <MenuItem>
                  <PrintIcon fontSize='small' sx={{ mr: 1 }} /> Print
                </MenuItem>
                <MenuItem>
                  <FileDownloadIcon fontSize='small' sx={{ mr: 1 }} /> CSV
                </MenuItem>
              </Menu>

              {/* ADD */}
              <GlobalButton
                variant='contained'
                startIcon={<AddIcon />}
                sx={{ height: 36 }}
                onClick={() => router.push(`/${lang}/admin/purchase/purchase-order/add`)}
              >
                Add Purchase Order
              </GlobalButton>
            </Box>
          }
        />

        <Divider />

        {/* FILTERS (Customer style) */}
        <Box
          sx={{
            px: 4,
            py: 3,
            display: 'flex',
            alignItems: 'flex-end',
            gap: 2,
            flexWrap: 'wrap'
          }}
        >
          {/* --- Row 2: Filters --- */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-end',
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
                options={originOptions}
                value={filterOrigin}
                onChange={val => setFilterOrigin(val)}
              />
            </Box>

            {/* Status */}
            <Box sx={{ width: 220 }}>
              <GlobalAutocomplete
                label='PO Status'
                placeholder='Select'
                options={poStatusOptions}
                value={filterStatus}
                onChange={val => setFilterStatus(val)}
              />
            </Box>

            {/* Supplier */}
            <Box sx={{ width: 220 }}>
              <GlobalAutocomplete
                label='Supplier'
                placeholder='Select Supplier'
                options={supplierOptions}
                value={filterSupplier}
                onChange={val => setFilterSupplier(val)}
              />
            </Box>

            {/* PO No Filter */}
            <Box sx={{ width: 220 }}>
              <GlobalAutocomplete
                label='PO No.'
                placeholder='Select PO No.'
                options={poNoOptions}
                value={filterPoNo}
                onChange={val => setFilterPoNo(val)}
                disabled={!filterSupplier}
              />
            </Box>

            {/* Refresh */}
            <GlobalButton
              variant='contained'
              color='primary'
              startIcon={<RefreshIcon />}
              sx={{ height: 36 }}
              onClick={handleRefresh}
            >
              Refresh
            </GlobalButton>
          </Box>
        </Box>

        <Divider sx={{ mb: 4 }} />

        {/* PAGE SIZE + SEARCH (Customer style) */}
        <Box
          sx={{
            px: 4,
            mb: 3,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
            flexWrap: 'wrap'
          }}
        >
          {/* LEFT — Page entries */}
          <FormControl size='small' sx={{ width: 140 }}>
            <Select
              value={pagination.pageSize}
              onChange={e =>
                setPagination(p => ({
                  ...p,
                  pageSize: Number(e.target.value),
                  pageIndex: 0
                }))
              }
            >
              {[25, 50, 75, 100].map(s => (
                <MenuItem key={s} value={s}>
                  {s} entries
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <GlobalTextField
            size='small'
            placeholder='Search PO No'
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleRefresh()
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <SearchIcon fontSize='small' />
                </InputAdornment>
              )
            }}
            sx={{ width: 320 }}
          />
        </Box>

        {/* TABLE */}
        <Box sx={{ flexGrow: 1, px: 4 }}>
          <StickyTableWrapper rowCount={rows.length}>
            <table className={styles.table}>
              <thead>
                {table.getHeaderGroups().map(hg => (
                  <tr key={hg.id}>
                    {hg.headers.map(h => (
                      <th key={h.id}>
                        <div
                          className={classnames({
                            'flex items-center gap-1': true,
                            'cursor-pointer select-none': h.column.getCanSort()
                          })}
                          onClick={h.column.getToggleSortingHandler()}
                        >
                          {flexRender(h.column.columnDef.header, h.getContext())}

                          {{
                            asc: <ChevronRight className='-rotate-90 text-sm' />,
                            desc: <ChevronRight className='rotate-90 text-sm' />
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
                    <td colSpan={columns.length} className='text-center'>
                      No data found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </StickyTableWrapper>
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
            <DialogCloseButton onClick={() => setDeleteDialog({ open: false, row: null })} disableRipple>
              <i className='tabler-x' />
            </DialogCloseButton>
          </DialogTitle>

          {/* Centered text */}
          <DialogContent sx={{ px: 5, pt: 1 }}>
            <Typography sx={{ color: 'text.secondary', fontSize: 14, lineHeight: 1.6 }}>
              Are you sure you want to delete{' '}
              <strong style={{ color: '#d32f2f' }}>{deleteDialog.row?.poNo || 'this purchase order'}</strong>
              ?
              <br />
              This action cannot be undone.
            </Typography>
          </DialogContent>

          {/* Centered buttons */}
          <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 3, pt: 2 }}>
            <GlobalButton
              color='secondary'
              onClick={() => setDeleteDialog({ open: false, row: null })}
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

        {/* PAGINATION */}
        <Box sx={{ px: 4, py: 2 }}>
          <TablePaginationComponent totalCount={totalCount} pagination={pagination} setPagination={setPagination} />
        </Box>
      </Card>
    </StickyListLayout>
  )
}

export default function PurchaseOrderPageWrapper() {
  return (
    <PermissionGuard permission='Purchase Order'>
      <PurchaseOrderPage />
    </PermissionGuard>
  )
}
