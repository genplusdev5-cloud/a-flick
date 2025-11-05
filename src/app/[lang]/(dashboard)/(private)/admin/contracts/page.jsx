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

// ───────────────────────────────────────────
// IndexedDB Helpers
// ───────────────────────────────────────────
const DB_NAME = 'ContractDB'
const STORE_NAME = 'contracts'

const openDB = () => {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) return reject(new Error('IndexedDB not supported'))
    const request = indexedDB.open(DB_NAME, 1)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = e => {
      const db = e.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
  })
}

const getContracts = async () => {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readonly')
  const store = tx.objectStore(STORE_NAME)
  const request = store.getAll()
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result.reverse())
    request.onerror = () => reject(request.error)
  })
}

const deleteContract = async id => {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  const store = tx.objectStore(STORE_NAME)
  const request = store.delete(id)
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

// Toast helper
const showToast = (type, message) => {
  const content = (
    <Typography variant='body2' sx={{ fontWeight: 500 }}>
      {message}
    </Typography>
  )
  if (type === 'success') toast.success(content)
  else if (type === 'error' || type === 'delete') toast.error(content)
  else if (type === 'warning') toast.warn(content)
  else toast.info(content)
}

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
export default function ContractsPage() {
  const router = useRouter()
  const [rows, setRows] = useState([])
  const [rowCount, setRowCount] = useState(0)
  const [searchText, setSearchText] = useState('')
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 })
  const [loading, setLoading] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, row: null })
  const [exportAnchorEl, setExportAnchorEl] = useState(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const all = await getContracts()

      // 🔍 Filter contracts by search input
      const filtered = searchText
        ? all.filter(
            r =>
              ['customer', 'contractCode', 'serviceAddress', 'contractType'].some(key =>
                (r[key] || '').toString().toLowerCase().includes(searchText.toLowerCase())
              ) || (r.pestItems || []).some(p => (p.pest || '').toLowerCase().includes(searchText.toLowerCase()))
          )
        : all

      // 🔢 Sort newest first
      const sorted = filtered.sort((a, b) => (b.id || 0) - (a.id || 0))

      // 📄 Pagination logic
      const start = pagination.pageIndex * pagination.pageSize
      const end = start + pagination.pageSize
      const paginated = sorted.slice(start, end)

      // 🧾 Normalize and add serial numbers
      const normalized = paginated.map((item, idx) => ({
        ...item,
        sno: start + idx + 1,
        pestList: item.pestItems?.map(p => p.pest).join(', ') || 'N/A',
        date: item.startDate ? new Date(item.startDate).toLocaleDateString('en-GB') : ''
      }))

      setRows(normalized)
      setRowCount(filtered.length)
    } catch (err) {
      console.error(err)
      showToast('error', 'Failed to load contracts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    const handleFocus = () => loadData()
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [pagination.pageIndex, pagination.pageSize, searchText])

  const handleEdit = id => router.push(`/admin/contracts/${id}/edit`)
  const confirmDelete = async () => {
    if (deleteDialog.row) {
      await deleteContract(deleteDialog.row.id)
      showToast('delete', `Contract ${deleteDialog.row.contractCode} deleted`)
      loadData()
    }
    setDeleteDialog({ open: false, row: null })
  }

  // --- Table ---
  const columnHelper = createColumnHelper()
  const columns = useMemo(
    () => [
      columnHelper.accessor('sno', { header: 'S.No' }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: info => (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton size='small' color='primary' onClick={() => handleEdit(info.row.original.id)}>
              <EditIcon />
            </IconButton>
            <IconButton
              size='small'
              color='error'
              onClick={() => setDeleteDialog({ open: true, row: info.row.original })}
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        )
      }),
      columnHelper.accessor('customer', { header: 'Customer' }),
      columnHelper.accessor('contractCode', { header: 'Code' }),
      columnHelper.accessor('serviceAddress', { header: 'Address' }),
      columnHelper.accessor('contractType', { header: 'Type' }),
      columnHelper.accessor('date', { header: 'Date' }),
      columnHelper.accessor('pestList', { header: 'Pests' }),
      columnHelper.display({
        id: 'services',
        header: 'Services',
        cell: () => (
          <Button
            size='small'
            variant='outlined'
            color='info'
            sx={{ borderRadius: '5px', textTransform: 'none', fontWeight: 500, p: '4px 8px' }}
          >
            Services
          </Button>
        )
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: info => {
          const status = info.getValue() || 'Active'
          return (
            <Chip
              label={status}
              size='small'
              sx={{
                color: '#fff',
                bgcolor: status === 'Active' ? 'success.main' : 'error.main',
                fontWeight: 600,
                borderRadius: '6px',
                px: 1.5
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
              <Button
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
              </Button>
            </Box>
          }
          action={
            <Box display='flex' alignItems='center' gap={2}>
              <Button
                variant='outlined'
                color='secondary'
                endIcon={<ArrowDropDownIcon />}
                onClick={e => setExportAnchorEl(e.currentTarget)}
                disabled={!rows.length}
                sx={{ textTransform: 'none', fontWeight: 500, px: 2.5, height: 36 }}
              >
                Export
              </Button>
              <Menu anchorEl={exportAnchorEl} open={exportOpen} onClose={() => setExportAnchorEl(null)}>
                <MenuItem onClick={exportPrint}>
                  <PrintIcon fontSize='small' sx={{ mr: 1 }} /> Print
                </MenuItem>
                <MenuItem onClick={exportCSV}>
                  <FileDownloadIcon fontSize='small' sx={{ mr: 1 }} /> CSV
                </MenuItem>
              </Menu>
              <Button
                variant='contained'
                startIcon={<AddIcon />}
                onClick={() => router.push('/admin/contracts/add')}
                sx={{ textTransform: 'none', fontWeight: 500, px: 2.5, height: 36 }}
              >
                Add Contract
              </Button>
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

        <Divider sx={{ mb: 2 }} />
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <FormControl size='small' sx={{ width: 140 }}>
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
          <DebouncedInput
            value={searchText}
            onChange={v => {
              setSearchText(String(v))
              setPagination(p => ({ ...p, pageIndex: 0 }))
            }}
            placeholder='Search customer, code, address, pests...'
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
                      <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
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

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false })}>
        <DialogTitle sx={{ textAlign: 'center', color: 'error.main', fontWeight: 600 }}>
          <WarningAmberIcon sx={{ verticalAlign: 'middle', mr: 1 }} /> Confirm Delete
        </DialogTitle>
        <DialogContent>
          <Typography textAlign='center'>
            Delete contract "<strong>{deleteDialog.row?.contractCode}</strong>"?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button onClick={() => setDeleteDialog({ open: false })}>Cancel</Button>
          <Button color='error' variant='contained' onClick={confirmDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
