'use client'

import { useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
  Checkbox,
  IconButton
} from '@mui/material'

import StickyListLayout from '@/components/common/StickyListLayout'
import StickyTableWrapper from '@/components/common/StickyTableWrapper'
import TablePaginationComponent from '@/components/TablePaginationComponent'

import DialogCloseButton from '@components/dialogs/DialogCloseButton'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import { showToast } from '@/components/common/Toasts'

import { getMaterialReceiveList, deleteMaterialReceive } from '@/api/transfer/material_receive'
import { getMaterialRequestDropdowns } from '@/api/transfer/materialRequest/dropdown'
import { getPurchaseFilters } from '@/api/purchase/purchase_order'

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

const MaterialRequestReceivedPage = () => {
  const columnHelper = createColumnHelper()
  const router = useRouter()

  // FILTER OPTIONS
  const [originOptions, setOriginOptions] = useState([])
  const [technicianOptions, setTechnicianOptions] = useState([])
  const [supplierOptions, setSupplierOptions] = useState([])

  // FILTER VALUES
  const [selectedOrigin, setSelectedOrigin] = useState(null)
  const [selectedSupplier, setSelectedSupplier] = useState(null)

  // STATE
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [totalCount, setTotalCount] = useState(0)

  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 })
  const [sorting, setSorting] = useState([])
  const [exportAnchorEl, setExportAnchorEl] = useState(null)

  const [uiDateFilter, setUiDateFilter] = useState(false)
  const [uiDateRange, setUiDateRange] = useState([null, null])

  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    row: null
  })

  const [deleteLoading, setDeleteLoading] = useState(false)

  /* ───────── FETCH FILTERS ───────── */
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [purchaseRes, materialRes] = await Promise.all([
          getPurchaseFilters(),
          getMaterialRequestDropdowns()
        ])

        const purchaseData = purchaseRes?.data?.data || purchaseRes?.data || {}
        const materialData = materialRes?.data || materialRes

        const companyList = purchaseData?.company?.name || []
        const supplierList = purchaseData?.supplier?.name || []
        const techList = materialData?.employee?.name || []

        setOriginOptions(companyList.map(c => ({ label: c.name, value: c.id })))
        setSupplierOptions(supplierList.map(s => ({ label: s.name, value: s.id })))
        setTechnicianOptions(techList.map(e => ({ label: e.name, value: e.id })))
      } catch (e) {
        console.error('Filter fetch failed', e)
      }
    }

    fetchFilters()
  }, [])

  const confirmDelete = async () => {
    if (!deleteDialog.row?.id) return

    try {
      setDeleteLoading(true)

      await deleteMaterialReceive(deleteDialog.row.id)

      showToast('Material Received deleted successfully', 'delete')

      setDeleteDialog({ open: false, row: null })
      fetchList()
    } catch (error) {
      console.error('Delete failed', error)
      showToast(error?.response?.data?.message || 'Failed to delete record', 'error')
    } finally {
      setDeleteLoading(false)
    }
  }

  /* ───────── FETCH LIST ───────── */
  const fetchList = async () => {
    try {
      setLoading(true)

      const res = await getMaterialReceiveList({
        page: pagination.pageIndex + 1,
        page_size: pagination.pageSize,
        company_id: selectedOrigin?.value
      })

      const data = res?.data?.data || res?.data || res
      setTotalCount(data?.count || 0)

      const mapped =
        (data?.results || []).map((item, index) => {
          const originLabel = originOptions.find(o => o.value === item.company_id)?.label || item.company_name || '-'
          const technicianLabel = technicianOptions.find(t => t.value === item.technician_id)?.label || item.technician_name || '-'

          return {
            sno: pagination.pageIndex * pagination.pageSize + (index + 1),
            id: item.id,
            origin: originLabel,
            transferInNo: item.num_series || item.receive_number || '-',
            transferInDate: item.receive_date ? format(new Date(item.receive_date), 'dd/MM/yyyy') : '-',
            rawDate: item.receive_date,
            technicianName: technicianLabel,
            contactEmail: item?.technician_details?.email || '-',
            contactPhone: item?.technician_details?.phone || '-',
            remarks: item.remarks || '-',
            status: item.receive_status || item.status || 'Pending',
            recordType: item.record_type || 'tm'
          }
        })

      // Frontend Date Filtering
      let filteredRows = mapped

      if (uiDateFilter && uiDateRange[0] && uiDateRange[1]) {
        const startDate = startOfDay(uiDateRange[0])
        const endDate = endOfDay(uiDateRange[1])

        filteredRows = mapped.filter(row => {
          if (!row.rawDate) return false
          const rowDate = parseISO(row.rawDate)
          return isWithinInterval(rowDate, { start: startDate, end: endDate })
        })
      }

      setRows(filteredRows)
    } catch (e) {
      console.error('List fetch failed', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchList()
  }, [pagination.pageIndex, pagination.pageSize, selectedOrigin, selectedSupplier, uiDateFilter, uiDateRange])

  /* ───────── COLUMNS ───────── */
  const columns = useMemo(
    () => [
      columnHelper.accessor('sno', { header: 'S.No' }),

      columnHelper.display({
        id: 'action',
        header: 'Action',
        enableSorting: false,
        cell: info => {
          const r = info.row.original
          return (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton
                size='small'
                color='primary'
                onClick={() => router.push(`/admin/transfer/material-received/update/${btoa(String(r.id))}?type=${r.recordType}`)}
              >
                <i className='tabler-edit' />
              </IconButton>

              <IconButton
                size='small'
                color='error'
                onClick={() =>
                  setDeleteDialog({
                    open: true,
                    row: r
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
      columnHelper.accessor('transferInNo', { header: 'TR No.' }),
      columnHelper.accessor('transferInDate', { header: 'TR Date' }),
      columnHelper.accessor('technicianName', { header: 'Technician' }),
      columnHelper.accessor('contactEmail', { header: 'Contact Email' }),
      columnHelper.accessor('contactPhone', { header: 'Contact Phone' }),
      columnHelper.accessor('remarks', { header: 'Remarks' }),

      columnHelper.accessor('status', {
        header: 'Status',
        cell: info => (
          <Chip
            label={info.getValue()}
            color={info.getValue() === 'Completed' ? 'success' : 'warning'}
            size='small'
            sx={{ color: '#fff', fontWeight: 600 }}
          />
        )
      })
    ],
    [router]
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
          <Link href='/'>Dashboard</Link>
          <Typography>Material Received</Typography>
        </Breadcrumbs>
      }
    >
      <Card sx={{ display: 'flex', flexDirection: 'column', maxHeight: '100%' }}>
        <CardHeader
          title={<Typography variant='h5'>Material Received</Typography>}
          action={
            <Box display='flex' gap={2}>
              <GlobalButton
                color='secondary'
                endIcon={<ArrowDropDownIcon />}
                onClick={e => setExportAnchorEl(e.currentTarget)}
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
                onClick={() => router.push('/admin/transfer/material-received/add')}
              >
                Add Material Received
              </GlobalButton>
            </Box>
          }
        />

        <Divider />

        {/* FILTERS */}
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
          {/* DATE FILTER */}
          <Box sx={{ width: 220 }}>
            <FormControlLabel
              control={<Checkbox checked={uiDateFilter} onChange={e => setUiDateFilter(e.target.checked)} />}
              label='Date Filter'
              sx={{ mb: 0.5 }}
            />

            <PresetDateRangePicker
              start={uiDateRange[0]}
              end={uiDateRange[1]}
              disabled={!uiDateFilter}
              onSelectRange={({ start, end }) => setUiDateRange([start, end])}
            />
          </Box>

          {/* FROM COMPANY */}
          <Box sx={{ width: 220 }}>
            <GlobalAutocomplete
              label='From Company'
              placeholder='Select From Company'
              options={originOptions}
              value={selectedOrigin}
              onChange={(_, val) => {
                setSelectedOrigin(val)
                setPagination(p => ({ ...p, pageIndex: 0 }))
              }}
            />
          </Box>

          {/* TO COMPANY */}
          <Box sx={{ width: 220 }}>
            <GlobalAutocomplete
              label='To Company'
              placeholder='Select To Company'
              options={supplierOptions}
              value={selectedSupplier}
              onChange={(_, val) => {
                setSelectedSupplier(val)
                setPagination(p => ({ ...p, pageIndex: 0 }))
              }}
            />
          </Box>

          {/* REFRESH */}
          <GlobalButton
            variant='contained'
            color='primary'
            startIcon={<RefreshIcon />}
            sx={{ height: 36 }}
            onClick={() => {
              setSelectedOrigin(null)
              setSelectedSupplier(null)
              setUiDateFilter(false)
              setUiDateRange([null, null])
              setPagination(p => ({ ...p, pageIndex: 0 }))
            }}
          >
            Refresh
          </GlobalButton>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* SEARCH + PAGE SIZE */}
        <Box px={4} mb={3} display='flex' justifyContent='space-between'>
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
            placeholder='Search TR No'
            sx={{ width: 320 }}
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
        <Box px={4} flexGrow={1}>
          <StickyTableWrapper rowCount={rows.length}>
            <table className={styles.table}>
              <thead>
                {table.getHeaderGroups().map(hg => (
                  <tr key={hg.id}>
                    {hg.headers.map(h => (
                      <th key={h.id}>
                        <div
                          className={classnames('flex items-center gap-1', {
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
                    <td colSpan={columns.length} align='center'>
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
                    <td colSpan={columns.length} align='center'>
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

          <DialogContent sx={{ px: 5, pt: 1 }}>
            <Typography sx={{ color: 'text.secondary', fontSize: 14, lineHeight: 1.6 }}>
              Are you sure you want to delete{' '}
              <strong style={{ color: '#d32f2f' }}>{deleteDialog.row?.transferInNo || 'this record'}</strong>
              ?
              <br />
              This action cannot be undone.
            </Typography>
          </DialogContent>

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

        <Box px={4} py={2}>
          <TablePaginationComponent totalCount={totalCount} pagination={pagination} setPagination={setPagination} />
        </Box>
      </Card>
    </StickyListLayout>
  )
}

export default function MaterialRequestReceivedPageWrapper() {
  return (
    <PermissionGuard permission='Material Request Received'>
      <MaterialRequestReceivedPage />
    </PermissionGuard>
  )
}
