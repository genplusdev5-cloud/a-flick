'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Box,
  Card,
  CardHeader,
  Typography,
  Menu,
  MenuItem,
  IconButton,
  Divider,
  Chip,
  TextField,
  Select,
  FormControl,
  MenuItem as MuiMenuItem,
  Breadcrumbs,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import PrintIcon from '@mui/icons-material/Print'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import TableChartIcon from '@mui/icons-material/TableChart'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import FileCopyIcon from '@mui/icons-material/FileCopy'
import RefreshIcon from '@mui/icons-material/Refresh'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'

import GlobalButton from '@/components/common/GlobalButton'
import DialogCloseButton from '@components/dialogs/DialogCloseButton'
import TablePaginationComponent from '@/components/TablePaginationComponent'
import ProgressCircularCustomization from '@/components/common/ProgressCircularCustomization'
import { showToast } from '@/components/common/Toasts'

import classnames from 'classnames'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper
} from '@tanstack/react-table'

import ChevronRight from '@menu/svg/ChevronRight'
import { getCompanyList, deleteCompany } from '@/api/company'
import styles from '@core/styles/table.module.css'

// ──────────────────────────────────────────────────────────────
// Debounced Input – Pure JavaScript (no TypeScript syntax)
// ──────────────────────────────────────────────────────────────
const DebouncedInput = ({ value: initialValue, onChange, debounce = 500, ...props }) => {
  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  useEffect(() => {
    const timer = setTimeout(() => onChange(value), debounce)
    return () => clearTimeout(timer)
  }, [value, debounce, onChange])

  return <TextField {...props} value={value} onChange={e => setValue(e.target.value)} />
}

// ──────────────────────────────────────────────────────────────
// Main Page Component
// ──────────────────────────────────────────────────────────────
export default function CompanyOriginListPage() {
  const router = useRouter()

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState('')
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 })
  const [exportAnchorEl, setExportAnchorEl] = useState(null)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, row: null })

  // ───── Load Data ─────────────────────────────────────
  const loadData = async () => {
    setLoading(true)
    try {
      const res = await getCompanyList()
      const data = res?.data?.results || res?.results || res || []

      const normalized = data.map((item, i) => ({
        sno: i + 1,
        id: item.id,
        company_code: item.company_code || '-',
        name: item.name || '-',
        phone: item.phone || '-',
        email: item.email || '-',
        city: item.city || '-',
        is_active: item.is_active ?? 1
      }))

      setRows(normalized)
    } catch (err) {
      console.error(err)
      showToast('error', 'Failed to load company list')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // ───── Filtering & Pagination ─────────────────────────────
  const filteredRows = useMemo(() => {
    if (!searchText) return rows
    const term = searchText.toLowerCase()
    return rows.filter(
      r =>
        r.company_code?.toLowerCase().includes(term) ||
        r.name?.toLowerCase().includes(term) ||
        r.email?.toLowerCase().includes(term) ||
        r.phone?.includes(term)
    )
  }, [rows, searchText])

  const paginatedRows = useMemo(() => {
    const start = pagination.pageIndex * pagination.pageSize
    const end = start + pagination.pageSize
    return filteredRows.slice(start, end)
  }, [filteredRows, pagination])

  // ───── Export Functions (same as before) ─────────────────────
  const exportPrint = () => {
    /* ... same as your code ... */
  }
  const exportCSV = () => {
    /* ... same as your code ... */
  }
  const exportExcel = async () => {
    /* ... same as your code ... */
  }
  const exportPDF = async () => {
    /* ... same as your code ... */
  }
  const exportCopy = () => {
    /* ... same as your code ... */
  }

  // ───── Delete Handler ───────────────────────────────────────
  const confirmDelete = async () => {
    if (!deleteDialog.row) return

    try {
      await deleteCompany(deleteDialog.row.id)
      showToast('success', `"${deleteDialog.row.name}" deleted successfully`)
      setRows(prev => prev.filter(r => r.id !== deleteDialog.row.id))
    } catch (err) {
      console.error(err)
      showToast('error', 'Failed to delete company')
    } finally {
      setDeleteDialog({ open: false, row: null })
    }
  }

  // ───── Table Columns ─────────────────────────────────────────
  const columnHelper = createColumnHelper()
  const columns = useMemo(
    () => [
      columnHelper.accessor('sno', { header: 'S.No' }),

      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: info => (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton
              size='small'
              color='primary'
              onClick={() => router.push(`/admin/company-origin/edit/${info.row.original.id}`)}
            >
              <i className='tabler-edit text-blue-600 text-lg' />
            </IconButton>

            <IconButton
              size='small'
              color='error'
              onClick={() => setDeleteDialog({ open: true, row: info.row.original })}
            >
              <i className='tabler-trash text-red-600 text-lg' />
            </IconButton>
          </Box>
        )
      }),
      columnHelper.accessor('company_code', { header: 'Company Code' }),
      columnHelper.accessor('name', { header: 'Name' }),
      columnHelper.accessor('phone', { header: 'Phone' }),
      columnHelper.accessor('email', { header: 'Email' }),
      columnHelper.accessor('city', { header: 'City' }),
      columnHelper.accessor('is_active', {
        header: 'Status',
        cell: info => (
          <Chip
            label={info.getValue() === 1 ? 'Active' : 'Inactive'}
            size='small'
            sx={{
              color: '#fff',
              bgcolor: info.getValue() === 1 ? 'success.main' : 'error.main',
              fontWeight: 600,
              borderRadius: '6px',
              px: 1.5
            }}
          />
        )
      })
    ],
    [router]
  )

  const table = useReactTable({
    data: paginatedRows,
    columns,
    manualPagination: true,
    pageCount: Math.ceil(filteredRows.length / pagination.pageSize),
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel()
  })

  return (
    <Box>
      {/* Breadcrumb */}
      <Box sx={{ mb: 2 }}>
        <Breadcrumbs>
          <Link href='/admin/dashboard'>Home</Link>
          <Typography color='text.primary'>Company Origin</Typography>
        </Breadcrumbs>
      </Box>

      <Card sx={{ p: 3, position: 'relative' }}>
        {/* Header with Refresh & Export & Add */}
        <CardHeader
          title={
            <Box display='flex' alignItems='center' gap={2}>
              <Typography variant='h5' sx={{ fontWeight: 600 }}>
                Company Origin
              </Typography>
              <GlobalButton
                startIcon={<RefreshIcon sx={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />}
                disabled={loading}
                onClick={loadData}
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
                  onClick={() => {
                    setExportAnchorEl(null)
                    exportExcel()
                  }}
                >
                  <TableChartIcon fontSize='small' sx={{ mr: 1 }} /> Excel
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    setExportAnchorEl(null)
                    exportPDF()
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

              <GlobalButton startIcon={<AddIcon />} onClick={() => router.push('/admin/company-origin/add')}>
                Add Company
              </GlobalButton>
            </Box>
          }
          sx={{ pb: 1.5, pt: 1.5, '& .MuiCardHeader-action': { m: 0 } }}
        />

        {/* Loading Overlay */}
        {loading && (
          <Box
            sx={{
              position: 'fixed',
              inset: 0,
              bgcolor: 'rgba(255,255,255,0.8)',
              backdropFilter: 'blur(2px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999
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

        <Divider sx={{ my: 2 }} />

        {/* Show Entries + Search */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant='body2' color='text.secondary'>
              Show
            </Typography>
            <FormControl size='small' sx={{ width: 140 }}>
              <Select
                value={pagination.pageSize}
                onChange={e => setPagination(p => ({ ...p, pageSize: Number(e.target.value), pageIndex: 0 }))}
              >
                {[10, 25, 50, 100].map(s => (
                  <MuiMenuItem key={s} value={s}>
                    {s} entries
                  </MuiMenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <DebouncedInput
            placeholder='Search company...'
            value={searchText}
            onChange={val => setSearchText(val)}
            size='small'
            variant='outlined'
            sx={{ width: 360 }}
          />
        </Box>

        {/* Table */}
        <div className='overflow-x-auto -mx-3'>
          <table className={styles.table}>
            <thead>
              {table.getHeaderGroups().map(hg => (
                <tr key={hg.id}>
                  {hg.headers.map(header => (
                    <th key={header.id}>
                      <div
                        className={classnames({
                          'flex items-center gap-1': true,
                          'cursor-pointer select-none': header.column.getCanSort()
                        })}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{
                          asc: <ChevronRight className='-rotate-90' />,
                          desc: <ChevronRight className='rotate-90' />
                        }[header.column.getIsSorted()] ?? null}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className='text-center py-8 text-gray-500'>
                    No companies found
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

        <TablePaginationComponent
          totalCount={filteredRows.length}
          pagination={pagination}
          setPagination={setPagination}
        />
      </Card>

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, row: null })}
        PaperProps={{
          sx: { width: 420, borderRadius: 1, textAlign: 'center', overflow: 'visible' }
        }}
      >
        <DialogTitle sx={{ color: 'error.main', fontWeight: 700, position: 'relative', textAlign: 'center' }}>
          <WarningAmberIcon color='error' sx={{ fontSize: 26, verticalAlign: 'middle', mr: 1 }} />
          Confirm Delete
          <DialogCloseButton
            onClick={() => setDeleteDialog({ open: false, row: null })}
            sx={{ position: 'absolute', right: 1, top: 1 }}
          >
            <i className='tabler-x' />
          </DialogCloseButton>
        </DialogTitle>

        <DialogContent sx={{ px: 5, pt: 2 }}>
          <Typography>
            Are you sure you want to delete{' '}
            <strong style={{ color: '#d32f2f' }}>{deleteDialog.row?.name || 'this company'}</strong>?<br />
            This action cannot be undone.
          </Typography>
        </DialogContent>

        <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 3 }}>
          <GlobalButton color='secondary' onClick={() => setDeleteDialog({ open: false, row: null })}>
            Cancel
          </GlobalButton>
          <GlobalButton variant='contained' color='error' onClick={confirmDelete}>
            Delete
          </GlobalButton>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
