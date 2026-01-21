'use client'

import { useMemo, useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

import Link from 'next/link'

import {
  Box,
  Card,
  CardHeader,
  Typography,
  Menu,
  MenuItem,
  Divider,
  Breadcrumbs,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  Select,
  InputAdornment,
  FormControlLabel,
  Checkbox
} from '@mui/material'

import StickyListLayout from '@/components/common/StickyListLayout'
import StickyTableWrapper from '@/components/common/StickyTableWrapper'
import TablePaginationComponent from '@/components/TablePaginationComponent'
import { IconButton } from '@mui/material'

import DialogCloseButton from '@components/dialogs/DialogCloseButton'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import { showToast } from '@/components/common/Toasts'

import { getPurchaseReturnList, deletePurchaseReturn, addPurchaseReturn } from '@/api/purchase/purchase_return'
import { getPurchaseFilters } from '@/api/purchase/purchase_inward'
import { getSupplierList } from '@/api/stock/supplier'

import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns'

import GlobalButton from '@/components/common/GlobalButton'
import GlobalTextField from '@/components/common/GlobalTextField'
import GlobalAutocomplete from '@/components/common/GlobalAutocomplete'
import PresetDateRangePicker from '@/components/common/PresetDateRangePicker'

import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import AddIcon from '@mui/icons-material/Add'
import SearchIcon from '@mui/icons-material/Search'
import PrintIcon from '@mui/icons-material/Print'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import RefreshIcon from '@mui/icons-material/Refresh'
import { ChevronRight } from '@mui/icons-material'

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper
} from '@tanstack/react-table'

import PermissionGuard from '@/components/auth/PermissionGuard'
import classnames from 'classnames'
import styles from '@core/styles/table.module.css'

/* ─────────────────────────────
   UI ONLY – DUMMY DATA
───────────────────────────── */
const DUMMY_ROWS = [
  {
    id: 1,
    origin: 'A-Flick Pte Ltd',
    inwardNo: 'INW-001',
    inwardDate: '2026-01-05',
    supplierName: 'Bent Jaz Singapore',
    contactEmail: 'info@bentjaz.com',
    contactPhone: '98765432',
    poDetails: 'PO-1023',
    remarks: 'Stock received',
    status: 'Completed'
  }
]

const statusOptions = [
  { label: 'Pending', value: 'Pending' },
  { label: 'Completed', value: 'Completed' }
]

const PurchaseReturnPage = () => {
  const columnHelper = createColumnHelper()
  const router = useRouter()
  const { lang } = useParams()

  const [originOptions, setOriginOptions] = useState([])
  const [supplierOptions, setSupplierOptions] = useState([])

  // UI STATES (Local to dropdowns)
  const [filterOrigin, setFilterOrigin] = useState(null)
  const [filterSupplier, setFilterSupplier] = useState(null)
  const [filterStatus, setFilterStatus] = useState(null)
  const [filterPiNo, setFilterPiNo] = useState(null)
  const [piNoOptions, setPiNoOptions] = useState([])

  // APPLIED STATES (Used for API calls)
  const [appliedOrigin, setAppliedOrigin] = useState(null)
  const [appliedSupplier, setAppliedSupplier] = useState(null)
  const [appliedStatus, setAppliedStatus] = useState(null)
  const [appliedPiNo, setAppliedPiNo] = useState(null)
  const [appliedDateFilter, setAppliedDateFilter] = useState(false)
  const [appliedDateRange, setAppliedDateRange] = useState([null, null])

  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    row: null
  })

  const [deleteLoading, setDeleteLoading] = useState(false)

  // STATES
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [totalCount, setTotalCount] = useState(0)

  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 })
  const [sorting, setSorting] = useState([])
  const [exportAnchorEl, setExportAnchorEl] = useState(null)

  const [uiDateFilter, setUiDateFilter] = useState(false)
  const [uiDateRange, setUiDateRange] = useState([null, null])

  const [searchQuery, setSearchQuery] = useState('')
  const [appliedSearchQuery, setAppliedSearchQuery] = useState('')

  const fetchPurchaseFilters = async () => {
    try {
      const [filterRes, supplierRes] = await Promise.all([getPurchaseFilters(), getSupplierList()])

      const dropdownData = filterRes?.data?.data || filterRes?.data || filterRes || {}
      const companyList = dropdownData?.company?.name || []
      
      const supplierData = supplierRes?.data
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

      const origins = companyList.map(item => ({
        label: item.name,
        value: item.id,
        id: item.id
      }))

      setOriginOptions(origins)
      setSupplierOptions(
        supplierList.map(item => ({
          label: item.name,
          value: item.id,
          id: item.id
        }))
      )

      // Default Origin: A-Flick Pte Ltd
      const defaultOrigin = origins.find(o => o.label === 'A-Flick Pte Ltd')
      if (defaultOrigin) {
        setFilterOrigin(defaultOrigin)
        setAppliedOrigin(defaultOrigin)
      }
    } catch (err) {
      console.error('Purchase filter error', err)
    }
  }

  const confirmDelete = async () => {
    if (!deleteDialog.row?.id) return

    try {
      setDeleteLoading(true)

      await deletePurchaseReturn({
        id: deleteDialog.row.id,
        type: 'tm'
      })

      showToast('Purchase Return deleted successfully', 'delete')

      setDeleteDialog({ open: false, row: null })
      fetchPurchaseReturnList()
    } catch (error) {
      console.error('Delete failed', error)
      showToast(error?.response?.data?.message || 'Failed to delete purchase return', 'error')
    } finally {
      setDeleteLoading(false)
    }
  }

  useEffect(() => {
    fetchPurchaseFilters()
  }, [])

  useEffect(() => {
    const fetchPiOptions = async () => {
      if (!filterSupplier) {
        setPiNoOptions([])
        setFilterPiNo(null)
        return
      }
      try {
        const { getPurchaseInwardList } = await import('@/api/purchase/purchase_inward')
        const res = await getPurchaseInwardList({
          company: filterOrigin?.id,
          supplier_id: filterSupplier.id,
          page_size: 1000
        })
        const items = res?.data?.results || res?.results || []
        setPiNoOptions(
          items.map(item => ({
            label: item.pi_number || item.inward_number || item.num_series,
            value: item.id,
            id: item.id
          }))
        )
      } catch (err) {
        console.error('PI options fetch failed', err)
      }
    }
    fetchPiOptions()
  }, [filterSupplier, filterOrigin])

  // ✅ FETCH FUNCTION
  const fetchPurchaseReturnList = async (
    origin = appliedOrigin,
    supplier = appliedSupplier,
    statusVal = appliedStatus,
    piNo = appliedPiNo,
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
        company: origin?.id || undefined,
        supplier_id: supplier?.id || undefined,
        status: statusVal?.label || undefined,
        pi_id: piNo?.id || undefined,
        search: search.trim()
      }

      // Backend Date Filtering
      if (dateFilter && dateRange[0]) {
        if (dateRange[0] && dateRange[1]) {
          params.from_date = format(dateRange[0], 'yyyy-MM-dd')
          params.to_date = format(dateRange[1], 'yyyy-MM-dd')
        } else {
          params.date = format(dateRange[0], 'yyyy-MM-dd')
        }
      }

      const res = await getPurchaseReturnList(params)

      setTotalCount(res?.data?.count || 0)

      const formatDateSafe = (dateValue) => {
        if (!dateValue) return '-'
        const date = new Date(dateValue)
        return isNaN(date.getTime()) ? '-' : format(date, 'dd/MM/yyyy')
      }

      const mappedRows =
        res?.data?.results?.map((item, index) => ({
          sno: pagination.pageIndex * pagination.pageSize + (index + 1),
          id: item.id,
          origin: item.company,
          returnNo: item.pr_number || item.num_series || '-',
          returnDate: formatDateSafe(item.pr_date || item.return_date),
          rawDate: item.pr_date || item.return_date, // Raw date for filtering
          inwardNo: item.pi?.pi_number || item.pi_number || item.inward_number || '-',
          inwardDate: formatDateSafe(item.pi?.inward_date || item.pi?.date || item.inward_date),
          supplierName: item.supplier,
          contactEmail: item?.supplier_details?.email || '-',
          contactPhone: item?.supplier_details?.phone || '-',
          noOfItems: (item.return_items || item.items || []).reduce((acc, curr) => acc + Number(curr.quantity || curr.return_quantity || 0), 0),
          remarks: item.remarks || '-',
          status: item.pr_status || item.return_status || 'Pending',
          recordType: 'tm'
        })) || []

      setRows(mappedRows)
    } catch (err) {
      console.error('Purchase inward list error', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPurchaseReturnList()
  }, [pagination.pageIndex, pagination.pageSize, appliedOrigin, appliedSupplier, appliedStatus, appliedPiNo, appliedDateFilter, appliedDateRange, appliedSearchQuery])

  const columns = useMemo(
    () => [
      columnHelper.accessor('sno', {
        header: 'S.No',
        cell: info => info.row.index + 1
      }),

      columnHelper.display({
        id: 'action',
        header: 'Action',
        enableSorting: false,
        cell: info => {
          const rowData = info.row.original

          return (
            <Box sx={{ display: 'flex', gap: 1 }}>
              {/* VIEW (optional – same icon style) */}
              {/* <IconButton size='small' color='primary' onClick={() => console.log('VIEW', rowData.id)}>
                <i className='tabler-eye' />
              </IconButton> */}

              {/* EDIT */}
              <IconButton
                size='small'
                color='primary'
                onClick={() => {
                  router.push(`/${lang}/admin/purchase/purchase-return/update/${btoa(rowData.id)}?type=${rowData.recordType}`)
                }}
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

      columnHelper.accessor('origin', { header: 'Origin' }),
      columnHelper.accessor('returnNo', { header: 'Return No.' }),
      columnHelper.accessor('returnDate', { header: 'Return Date' }),
      columnHelper.accessor('inwardNo', { header: 'Inward No.' }),
      columnHelper.accessor('inwardDate', { header: 'Inward Date' }),
      columnHelper.accessor('supplierName', { header: 'Supplier Name' }),
      columnHelper.accessor('noOfItems', { header: 'No. of Items' }),

      columnHelper.accessor('status', {
        header: 'Status',
        cell: info => (
          <Chip
            label={info.getValue()}
            color={info.getValue() === 'Completed' ? 'success' : 'warning'}
            size='small'
            sx={{ fontWeight: 600, color: '#fff' }}
          />
        )
      })
    ],
    []
  )

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel()
  })

  return (
    <StickyListLayout
      header={
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link href={`/${lang}`} style={{ textDecoration: 'none' }}>
            Dashboard
          </Link>
          <Link href={`/${lang}/admin/purchase/purchase-return`} style={{ textDecoration: 'none' }}>
            Purchase Return
          </Link>
        </Breadcrumbs>
      }
    >
      <Card sx={{ maxHeight: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* HEADER */}
        <CardHeader
          title={
            <Typography variant='h5' fontWeight={600}>
              Purchase Return
            </Typography>
          }
          action={
            <Box display='flex' gap={2}>
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

              <GlobalButton
                variant='contained'
                startIcon={<AddIcon />}
                sx={{ height: 36 }}
                onClick={() => router.push(`/${lang}/admin/purchase/purchase-return/add`)}
              >
                Add Purchase Return
              </GlobalButton>
            </Box>
          }
        />

        <Divider />

        {/* FILTERS */}
        {/* FILTERS – PO STYLE */}
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
          {/* Date Filter */}
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <FormControlLabel
              control={<Checkbox checked={uiDateFilter} onChange={e => setUiDateFilter(e.target.checked)} />}
              label='Date Filter'
              sx={{ mb: 0.5 }}
            />

            <Box sx={{ width: 220 }}>
              <PresetDateRangePicker
                start={uiDateRange[0]}
                end={uiDateRange[1]}
                disabled={!uiDateFilter}
                onSelectRange={({ start, end }) => setUiDateRange([start, end])}
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
              label='Status'
              placeholder='Select Status'
              options={statusOptions}
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
 
          {/* PI No Filter */}
          <Box sx={{ width: 220 }}>
            <GlobalAutocomplete
              label='PI No.'
              placeholder='Select PI No.'
              options={piNoOptions}
              value={filterPiNo}
              onChange={val => setFilterPiNo(val)}
              disabled={!filterSupplier}
            />
          </Box>

          {/* Refresh */}
          <GlobalButton
            variant='contained'
            color='primary'
            startIcon={<RefreshIcon />}
            sx={{ height: 36 }}
            onClick={() => {
              setAppliedOrigin(filterOrigin)
              setAppliedSupplier(filterSupplier)
              setAppliedStatus(filterStatus)
              setAppliedPiNo(filterPiNo)
              setAppliedDateFilter(uiDateFilter)
              setAppliedDateRange(uiDateRange)
              setAppliedSearchQuery(searchQuery)
              setPagination({ pageIndex: 0, pageSize: pagination.pageSize })
              fetchPurchaseReturnList(filterOrigin, filterSupplier, filterStatus, filterPiNo, uiDateFilter, uiDateRange, searchQuery, 0)
            }}
          >
            Refresh
          </GlobalButton>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* PAGE SIZE + SEARCH */}
        <Box sx={{ px: 4, mb: 3, display: 'flex', justifyContent: 'space-between' }}>
          <FormControl size='small' sx={{ width: 140 }}>
            <Select
              value={pagination.pageSize}
              onChange={e => setPagination(p => ({ ...p, pageSize: +e.target.value, pageIndex: 0 }))}
            >
              {[25, 50, 75, 100].map(v => (
                <MenuItem key={v} value={v}>
                  {v} entries
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <GlobalTextField
            size='small'
            placeholder='Search Return No'
            sx={{ width: 320 }}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                setAppliedSearchQuery(searchQuery)
                setPagination({ pageIndex: 0, pageSize: pagination.pageSize })
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
                            'cursor-pointer': h.column.getCanSort()
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
                {loading ? (
                  <tr>
                    <td colSpan={columns.length} style={{ textAlign: 'center', padding: 24 }}>
                      Loading...
                    </td>
                  </tr>
                ) : table.getRowModel().rows.length ? (
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
            {/* ❌ Close Button */}
            <DialogCloseButton onClick={() => setDeleteDialog({ open: false, row: null })} disableRipple>
              <i className='tabler-x' />
            </DialogCloseButton>
          </DialogTitle>

          {/* Centered text */}
          <DialogContent sx={{ px: 5, pt: 1 }}>
            <Typography sx={{ color: 'text.secondary', fontSize: 14, lineHeight: 1.6 }}>
              Are you sure you want to delete{' '}
              <strong style={{ color: '#d32f2f' }}>{deleteDialog.row?.returnNo || 'this purchase return'}</strong>
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
              disabled={deleteLoading}
              sx={{ minWidth: 100, textTransform: 'none', fontWeight: 600 }}
            >
              {deleteLoading ? 'Deleting...' : 'Delete'}
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

export default function PurchaseReturnPageWrapper() {
  return (
    <PermissionGuard permission='Purchase Return'>
      <PurchaseReturnPage />
    </PermissionGuard>
  )
}
