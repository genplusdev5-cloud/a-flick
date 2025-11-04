'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { openDB } from 'idb'
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
  CircularProgress,
  InputAdornment
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import PrintIcon from '@mui/icons-material/Print'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import RefreshIcon from '@mui/icons-material/Refresh'
import SearchIcon from '@mui/icons-material/Search'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn'
import GroupIcon from '@mui/icons-material/Group'
import BarChartIcon from '@mui/icons-material/BarChart'
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
// IndexedDB
// ───────────────────────────────────────────
const getCustomerDB = async () => {
  return await openDB('mainCustomerDB', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('customers')) {
        db.createObjectStore('customers', { keyPath: 'id', autoIncrement: true })
      }
    }
  })
}

// Toast helper
const showToast = (type, message) => {
  const content = <Typography variant='body2' sx={{ fontWeight: 500 }}>{message}</Typography>
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
export default function CustomersPage() {
  const router = useRouter()
  const [rows, setRows] = useState([])
  const [rowCount, setRowCount] = useState(0)
  const [searchText, setSearchText] = useState('')
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 })
  const [loading, setLoading] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, row: null })
  const [exportAnchorEl, setExportAnchorEl] = useState(null)

  // Load data
  const loadData = async () => {
    setLoading(true)
    try {
      const db = await getCustomerDB()
      const all = await db.getAll('customers')
      const valid = (all || [])
        .filter(c => c && typeof c === 'object')
        .map(c => ({
          id: c.id,
          name: c.customerName || c.name || '',
          email: c.loginEmail || c.email || '',
          phone: c.picPhone || c.billingPhone || '',
          address: c.billingAddress || '',
          commenceDate: c.commenceDate || '',
          origin: c.origin || '',
          projectStatus: c.projectStatus || 'Active'
        }))
        .reverse()

      const filtered = searchText
        ? valid.filter(r =>
            ['name', 'email', 'phone', 'address', 'origin'].some(key =>
              (r[key] || '').toString().toLowerCase().includes(searchText.toLowerCase())
            )
          )
        : valid

      const start = pagination.pageIndex * pagination.pageSize
      const pageSlice = filtered.slice(start, start + pagination.pageSize)
      const normalized = pageSlice.map((item, i) => ({
        ...item,
        sno: start + i + 1
      }))
      setRows(normalized)
      setRowCount(filtered.length)
    } catch (err) {
      showToast('error', 'Failed to load customers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [pagination.pageIndex, pagination.pageSize, searchText])

  const handleEdit = id => router.push(`/admin/customers/${id}/edit`)
  const confirmDelete = async () => {
    if (deleteDialog.row) {
      const db = await getCustomerDB()
      await db.delete('customers', deleteDialog.row.id)
      showToast('delete', `${deleteDialog.row.name} deleted`)
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
        header: 'Action',
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
      columnHelper.accessor('origin', { header: 'Origin' }),
      columnHelper.accessor('email', { header: 'Contact Email' }),
      columnHelper.accessor('address', { header: 'Billing Address' }),
      columnHelper.accessor('name', { header: 'Customer Name' }),
      columnHelper.accessor('commenceDate', {
        header: 'Commence Date',
        cell: info => {
          const date = info.getValue()
          return date ? new Date(date).toLocaleDateString('en-GB') : '-'
        }
      }),
      columnHelper.accessor('phone', { header: 'Contact Phone' }),
      columnHelper.display({
        id: 'contracts',
        header: 'Contract',
        cell: () => (
          <Button
            size='small'
            variant='outlined'
            color='success'
            sx={{ borderRadius: '5px', textTransform: 'none', fontWeight: 500, py: 0.5 }}
            onClick={() => router.push('/en/admin/contracts')}
          >
            Contracts
          </Button>
        )
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
    const headers = ['S.No', 'Origin', 'Email', 'Address', 'Name', 'Commence Date', 'Phone']
    const csv = [
      headers.join(','),
      ...rows.map(r => [
        r.sno,
        `"${r.origin}"`,
        `"${r.email}"`,
        `"${r.address}"`,
        `"${r.name}"`,
        r.commenceDate ? new Date(r.commenceDate).toLocaleDateString('en-GB') : '',
        r.phone
      ].join(','))
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
      <th>S.No</th><th>Origin</th><th>Email</th><th>Address</th><th>Name</th><th>Commence Date</th><th>Phone</th>
      </tr></thead><tbody>
      ${rows
        .map(r => `<tr>
          <td>${r.sno}</td>
          <td>${r.origin}</td>
          <td>${r.email}</td>
          <td>${r.address}</td>
          <td>${r.name}</td>
          <td>${r.commenceDate ? new Date(r.commenceDate).toLocaleDateString('en-GB') : ''}</td>
          <td>${r.phone}</td>
        </tr>`)
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
        <Typography color='text.primary'>Customer List</Typography>
      </Breadcrumbs>

      {/* Stats Cards */}
      <Card elevation={0} sx={{ mb: 4, boxShadow: 'none' }} variant='outlined'>
        <CardContent>
          <Box display='flex' justifyContent='space-between' alignItems='center' mb={3}>
            <Typography variant='h6'>All Customers</Typography>
            <Typography variant='body2' color='text.secondary'>
              Updated 1 month ago
            </Typography>
          </Box>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Box display='flex' alignItems='center' gap={2}>
                <BarChartIcon color='primary' fontSize='large' />
                <Box>
                  <Typography variant='h6'>230k</Typography>
                  <Typography variant='body2'>Sales</Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box display='flex' alignItems='center' gap={2}>
                <GroupIcon color='info' fontSize='large' />
                <Box>
                  <Typography variant='h6'>8.549k</Typography>
                  <Typography variant='body2'>Renewed</Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box display='flex' alignItems='center' gap={2}>
                <ShoppingCartIcon color='error' fontSize='large' />
                <Box>
                  <Typography variant='h6'>1.423k</Typography>
                  <Typography variant='body2'>Rejected</Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box display='flex' alignItems='center' gap={2}>
                <MonetizationOnIcon color='success' fontSize='large' />
                <Box>
                  <Typography variant='h6'>$9745</Typography>
                  <Typography variant='body2'>Current</Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

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
                Customer List
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
                onClick={() => router.push('/admin/customers/add')}
                sx={{ textTransform: 'none', fontWeight: 500, px: 2.5, height: 36 }}
              >
                Add Customer
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
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2000
            }}
          >
            <CircularProgress />
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
                    No results found
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
            Delete customer "<strong>{deleteDialog.row?.name}</strong>"?
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
