'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { openDB } from 'idb'
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
  InputAdornment,
  CircularProgress
} from '@mui/material'

import ProgressCircularCustomization from '@/components/common/ProgressCircularCustomization'
import AddIcon from '@mui/icons-material/Add'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import CloseIcon from '@mui/icons-material/Close'
import PrintIcon from '@mui/icons-material/Print'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import RefreshIcon from '@mui/icons-material/Refresh'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import CustomTextField from '@core/components/mui/TextField'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'
import { toast } from 'react-toastify'
import TablePaginationComponent from '@/components/TablePaginationComponent'
import classnames from 'classnames'

// ✅ Custom reusable form components
import CustomTextFieldWrapper from '@/components/common/CustomTextField'
import CustomTextarea from '@/components/common/CustomTextarea'
import CustomSelectField from '@/components/common/CustomSelectField'

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
const DB_NAME = 'HolidayDB'
const STORE_NAME = 'holidays'
const initDB = async () => {
  return await openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
      }
    }
  })
}

// Toast helper
const showToast = (type, message) => {
  const content = (
    <div className='flex items-center gap-2'>
      <Typography variant='body2' sx={{ fontWeight: 500 }}>
        {message}
      </Typography>
    </div>
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
export default function HolidayPage() {
  const [rows, setRows] = useState([])
  const [rowCount, setRowCount] = useState(0)
  const [searchText, setSearchText] = useState('')
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 })
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, row: null })
  const [exportAnchorEl, setExportAnchorEl] = useState(null)
  const [unsavedAddData, setUnsavedAddData] = useState(null)
  const [formData, setFormData] = useState({
    id: null,
    name: '',
    date: '',
    year: '',
    status: 'Active'
  })
  const nameRef = useRef(null)
  const dateRef = useRef(null)
  const statusRef = useRef(null)

  // Load rows
  const loadData = async () => {
    setLoading(true)
    try {
      const db = await initDB()
      const all = await db.getAll(STORE_NAME)

      // 🔍 Apply search filter
      const filtered = searchText
        ? all.filter(r =>
            ['name', 'date', 'year'].some(key =>
              (r[key] || '').toString().toLowerCase().includes(searchText.toLowerCase())
            )
          )
        : all

      // 🔢 Sort newest first
      const sorted = filtered.sort((a, b) => (b.id || 0) - (a.id || 0))

      // 📄 Apply pagination
      const start = pagination.pageIndex * pagination.pageSize
      const end = start + pagination.pageSize
      const paginated = sorted.slice(start, end)

      // 🧾 Add serial numbers
      const normalized = paginated.map((item, idx) => ({
        ...item,
        sno: start + idx + 1
      }))

      setRows(normalized)
      setRowCount(filtered.length)
    } catch (err) {
      console.error(err)
      showToast('error', 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [pagination.pageIndex, pagination.pageSize, searchText])

  // Drawer
  const toggleDrawer = () => setDrawerOpen(p => !p)
  const handleAdd = () => {
    setIsEdit(false)
    if (unsavedAddData) {
      setFormData(unsavedAddData)
    } else {
      setFormData({
        id: null,
        name: '',
        date: '',
        year: '',
        status: 'Active'
      })
    }
    setDrawerOpen(true)
    setTimeout(() => nameRef.current?.focus(), 100)
  }

  // 🔹 Cancel drawer + reset form
  const handleCancel = () => {
    setFormData({
      id: null,
      name: '',
      date: '',
      year: '',
      status: 'Active'
    })
    setUnsavedAddData(null)
    setDrawerOpen(false)
  }

  // 🔹 Handle field change + cache unsaved data
  const handleFieldChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value }
      if (!isEdit) setUnsavedAddData(updated)
      return updated
    })
  }

  const handleEdit = row => {
    setIsEdit(true)
    setFormData(row)
    setDrawerOpen(true)
    setTimeout(() => nameRef.current?.focus(), 100)
  }
  const handleDelete = async row => {
    const db = await initDB()
    await db.delete(STORE_NAME, row.id)
    showToast('delete', `${row.name} deleted`)
    loadData()
  }
  const confirmDelete = async () => {
    if (deleteDialog.row) await handleDelete(deleteDialog.row)
    setDeleteDialog({ open: false, row: null })
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!formData.name || !formData.date) {
      showToast('warning', 'Holiday name and date are required')
      return
    }

    setLoading(true)
    try {
      const db = await initDB()
      const payload = {
        ...formData,
        year: formData.date.split('/')[2] || ''
      }

      if (isEdit && formData.id) {
        await db.put(STORE_NAME, payload)
        showToast('success', 'Holiday updated')
      } else {
        delete payload.id
        await db.add(STORE_NAME, payload)
        showToast('success', 'Holiday added')
      }

      // ✅ Clear unsaved draft + reset
      setUnsavedAddData(null)
      setFormData({ id: null, name: '', date: '', year: '', status: 'Active' })

      // ✅ Close drawer after save
      setDrawerOpen(false)

      // 🔄 Reload data
      await loadData()
    } catch {
      showToast('error', 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async e => {
    const newStatus = e.target.value
    setFormData(prev => ({ ...prev, status: newStatus }))
    if (isEdit && formData.id) {
      const updatedRow = { ...formData, status: newStatus, id: formData.id }
      setRows(prev => prev.map(r => (r.id === formData.id ? updatedRow : r)))
      const db = await initDB()
      await db.put(STORE_NAME, updatedRow)
      showToast('success', 'Status updated')
    }
  }

  // Table setup
  const columnHelper = createColumnHelper()
  const columns = useMemo(
    () => [
      columnHelper.accessor('sno', { header: 'S.No' }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: info => (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton size='small' color='primary' onClick={() => handleEdit(info.row.original)}>
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
      columnHelper.accessor('name', { header: 'Holiday Name' }),
      columnHelper.accessor('date', { header: 'Date' }),
      columnHelper.accessor('year', { header: 'Year' }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: info => (
          <Chip
            label={info.getValue() === 'Active' ? 'Active' : 'Inactive'}
            size='small'
            sx={{
              color: '#fff',
              bgcolor: info.getValue() === 'Active' ? 'success.main' : 'error.main',
              fontWeight: 600,
              borderRadius: '6px',
              px: 1.5
            }}
          />
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

  // Export Functions
  const exportOpen = Boolean(exportAnchorEl)
  const exportCSV = () => {
    const headers = ['S.No', 'Holiday Name', 'Date', 'Year', 'Status']
    const csv = [
      headers.join(','),
      ...rows.map(r => [r.sno, `"${r.name.replace(/"/g, '""')}"`, r.date, r.year, r.status].join(','))
    ].join('\n')
    const link = document.createElement('a')
    link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    link.download = 'holidays.csv'
    link.click()
    showToast('success', 'CSV downloaded')
  }

  const exportPrint = () => {
    const w = window.open('', '_blank')
    const html = `
      <html><head><title>Holiday List</title><style>
      body{font-family:Arial;padding:24px;}
      table{width:100%;border-collapse:collapse;}
      th,td{border:1px solid #ccc;padding:8px;text-align:left;}
      th{background:#f4f4f4;}
      </style></head><body>
      <h2>Holiday List</h2>
      <table><thead><tr>
      <th>S.No</th><th>Name</th><th>Date</th><th>Year</th><th>Status</th>
      </tr></thead><tbody>
      ${rows
        .map(
          r => `<tr><td>${r.sno}</td><td>${r.name}</td><td>${r.date}</td><td>${r.year}</td><td>${r.status}</td></tr>`
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
          Home
        </Link>
        <Typography color='text.primary'>Holidays</Typography>
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
                Holiday Management
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
                onClick={handleAdd}
                sx={{ textTransform: 'none', fontWeight: 500, px: 2.5, height: 36 }}
              >
                Add Holiday
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
              {[5, 10, 25, 50].map(s => (
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
            placeholder='Search name, date, year...'
            sx={{ width: 360 }}
            variant='outlined'
            size='small'
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
                    No data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <TablePaginationComponent totalCount={rowCount} pagination={pagination} setPagination={setPagination} />
      </Card>

      {/* Drawer */}
      <Drawer
        anchor='right'
        open={drawerOpen}
        onClose={toggleDrawer}
        PaperProps={{ sx: { width: 420, boxShadow: '0px 0px 15px rgba(0,0,0,0.08)' } }}
      >
        <Box sx={{ p: 5, display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Box display='flex' justifyContent='space-between' alignItems='center' mb={3}>
            <Typography variant='h5' fontWeight={600}>
              {isEdit ? 'Edit Holiday' : 'Add Holiday'}
            </Typography>
            <IconButton onClick={toggleDrawer} size='small'>
              <CloseIcon />
            </IconButton>
          </Box>

          <Divider sx={{ mb: 3 }} />

          <form onSubmit={handleSubmit} style={{ flexGrow: 1 }}>
            <Grid container spacing={3}>
              {/* Holiday Name */}
              <Grid item xs={12}>
                <CustomTextFieldWrapper
                  fullWidth
                  required
                  label='Holiday Name'
                  placeholder='Enter holiday name'
                  value={formData.name}
                  inputRef={nameRef}
                  onChange={e => handleFieldChange('name', e.target.value.replace(/[^a-zA-Z\s]/g, ''))}
                />
              </Grid>

              {/* Date Picker */}
              <Grid item xs={12}>
                <AppReactDatepicker
                  selected={formData.date ? parseDateString(formData.date) : null}
                  onChange={date => {
                    let formatted = ''
                    if (date) {
                      const d = String(date.getUTCDate()).padStart(2, '0')
                      const m = String(date.getUTCMonth() + 1).padStart(2, '0')
                      const y = date.getUTCFullYear()
                      formatted = `${d}/${m}/${y}`
                    }
                    handleFieldChange('date', formatted)
                  }}
                  dateFormat='dd/MM/yyyy'
                  placeholderText='DD/MM/YYYY'
                  customInput={
                    <CustomTextFieldWrapper
                      fullWidth
                      required
                      label='Date'
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position='start'>
                            <CalendarTodayIcon />
                          </InputAdornment>
                        )
                      }}
                    />
                  }
                />
              </Grid>

              {/* Status — only on edit */}
              {isEdit && (
                <Grid item xs={12}>
                  <CustomSelectField
                    label='Status'
                    value={formData.status}
                    onChange={e => handleFieldChange('status', e.target.value)}
                    options={[
                      { value: 'Active', label: 'Active' },
                      { value: 'Inactive', label: 'Inactive' }
                    ]}
                  />
                </Grid>
              )}
            </Grid>

            {/* Footer buttons */}
            <Box mt={4} display='flex' gap={2}>
              <Button type='submit' variant='contained' fullWidth disabled={loading}>
                {loading ? (isEdit ? 'Updating...' : 'Saving...') : isEdit ? 'Update' : 'Save'}
              </Button>
              <Button variant='outlined' color='secondary' fullWidth onClick={handleCancel} disabled={loading}>
                Cancel
              </Button>
            </Box>
          </form>
        </Box>
      </Drawer>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, row: null })}>
        <DialogTitle sx={{ textAlign: 'center', color: 'error.main', fontWeight: 600 }}>
          <WarningAmberIcon sx={{ verticalAlign: 'middle', mr: 1 }} /> Confirm Delete
        </DialogTitle>
        <DialogContent>
          <Typography textAlign='center'>
            Are you sure you want to delete <strong style={{ color: '#d32f2f' }}>{deleteDialog.row?.name}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button onClick={() => setDeleteDialog({ open: false, row: null })}>Cancel</Button>
          <Button color='error' variant='contained' onClick={confirmDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

// Helper: Parse DD/MM/YYYY to Date
const parseDateString = dateString => {
  if (!dateString) return null
  const [d, m, y] = dateString.split('/').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}
