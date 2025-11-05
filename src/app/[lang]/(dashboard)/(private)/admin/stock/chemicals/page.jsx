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
  Autocomplete,
  FormControl,
  Select,
  CircularProgress,
  InputAdornment
} from '@mui/material'

import ProgressCircularCustomization from '@/components/common/ProgressCircularCustomization'
import AddIcon from '@mui/icons-material/Add'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import DialogCloseButton from '@components/dialogs/DialogCloseButton'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import CloseIcon from '@mui/icons-material/Close'
import PrintIcon from '@mui/icons-material/Print'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import RefreshIcon from '@mui/icons-material/Refresh'
import SearchIcon from '@mui/icons-material/Search'
import CustomTextField from '@core/components/mui/TextField'
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
const DB_NAME = 'chemicals_db'
const STORE_NAME = 'chemicals'
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
// ──────────────────────────────────────────────────────────────
// Toast (Custom Styled, Global, with Icons & Colors)
// ──────────────────────────────────────────────────────────────
const showToast = (type, message = '') => {
  const icons = {
    success: 'tabler-circle-check',
    delete: 'tabler-trash',
    error: 'tabler-alert-triangle',
    warning: 'tabler-info-circle',
    info: 'tabler-refresh'
  }

  toast(
    <div className='flex items-center gap-2'>
      <i
        className={icons[type]}
        style={{
          color:
            type === 'success'
              ? '#16a34a'
              : type === 'error'
                ? '#dc2626'
                : type === 'delete'
                  ? '#dc2626'
                  : type === 'warning'
                    ? '#f59e0b'
                    : '#2563eb',
          fontSize: '22px'
        }}
      />
      <Typography variant='body2' sx={{ fontSize: '0.9rem', color: '#111' }}>
        {message}
      </Typography>
    </div>,
    {
      position: 'top-right',
      autoClose: 2000,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: false,
      draggable: false,
      theme: 'light',
      style: {
        borderRadius: '10px',
        padding: '8px 14px',
        boxShadow: '0 4px 10px rgba(0,0,0,0.06)',
        display: 'flex',
        alignItems: 'center'
      }
    }
  )
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
export default function ChemicalsPage() {
  const [rows, setRows] = useState([])
  const [rowCount, setRowCount] = useState(0)
  const [searchText, setSearchText] = useState('')
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 })
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [loading, setLoading] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, row: null })
  const [exportAnchorEl, setExportAnchorEl] = useState(null)

  const [formData, setFormData] = useState({
    name: '',
    unit: '',
    dosage: '',
    ingredients: '',
    status: 'Active',
    file: ''
  })

  const [selectedFile, setSelectedFile] = useState('')
  const [unitOpen, setUnitOpen] = useState(false)

  const unitOptions = ['kg', 'litre', 'bottle', 'pkt', 'box']

  const fileInputRef = useRef(null)
  const nameRef = useRef(null)
  const unitRef = useRef(null)
  const dosageRef = useRef(null)
  const ingredientsRef = useRef(null)
  const statusRef = useRef(null)

  // Load data
  const loadData = async () => {
    setLoading(true)
    try {
      const db = await initDB()
      const all = await db.getAll(STORE_NAME)

      // 🔍 Filter by search input
      const filtered = searchText
        ? all.filter(r =>
            ['name', 'unit', 'ingredients'].some(key =>
              (r[key] || '').toString().toLowerCase().includes(searchText.toLowerCase())
            )
          )
        : all

      // 🔢 Sort latest first
      const sorted = filtered.sort((a, b) => (b.id || 0) - (a.id || 0))

      // 📄 Pagination logic
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

  // --- Drawer ---
  const toggleDrawer = () => setDrawerOpen(p => !p)
  const handleAdd = () => {
    setIsEdit(false)
    setEditRow(null)
    setFormData({ name: '', unit: '', dosage: '', ingredients: '', status: 'Active', file: '' })
    setSelectedFile('')
    setDrawerOpen(true)
    setTimeout(() => nameRef.current?.focus(), 100)
  }
  const handleEdit = row => {
    setIsEdit(true)
    setEditRow(row)
    setFormData(row)
    setSelectedFile(row.file || '')
    setDrawerOpen(true)
    setTimeout(() => nameRef.current?.focus(), 100)
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!formData.name.trim()) {
      showToast('warning', 'Chemical name is required')
      return
    }
    setLoading(true)
    try {
      const db = await initDB()
      const payload = { ...formData, file: selectedFile }
      if (isEdit && editRow?.id) {
        await db.put(STORE_NAME, { ...payload, id: editRow.id })
        showToast('success', 'Chemical updated')
      } else {
        const id = await db.add(STORE_NAME, payload)
        payload.id = id
        showToast('success', 'Chemical added')
      }
      toggleDrawer()
      loadData()
    } catch {
      showToast('error', 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async e => {
    const newStatus = e.target.value
    setFormData(prev => ({ ...prev, status: newStatus }))

    if (isEdit && editRow) {
      const updatedRow = { ...editRow, status: newStatus }
      setRows(prev => prev.map(r => (r.id === editRow.id ? updatedRow : r)))
      const db = await initDB()
      await db.put(STORE_NAME, updatedRow)
      showToast('success', 'Status updated')
    }
  }

  const confirmDelete = async () => {
    if (deleteDialog.row) {
      const db = await initDB()
      await db.delete(STORE_NAME, deleteDialog.row.id)
      showToast('delete', `${deleteDialog.row.name} deleted`)
      loadData()
    }
    setDeleteDialog({ open: false, row: null })
  }

  // --- File Upload ---
  const handleFileChange = e => {
    const file = e.target.files[0]
    if (file) {
      setSelectedFile(file.name)
      setFormData(prev => ({ ...prev, file: file.name }))
    }
  }

  const handleFileDrop = e => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) {
      setSelectedFile(file.name)
      setFormData(prev => ({ ...prev, file: file.name }))
    }
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
      columnHelper.accessor('name', { header: 'Chemical Name' }),
      columnHelper.accessor('unit', { header: 'Unit' }),
      columnHelper.accessor('dosage', { header: 'Dosage' }),
      columnHelper.accessor('ingredients', { header: 'Ingredients' }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: info => {
          const status = info.getValue()
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
    const headers = ['S.No', 'Chemical Name', 'Unit', 'Dosage', 'Ingredients', 'Status']
    const csv = [
      headers.join(','),
      ...rows.map(r => [r.sno, `"${r.name}"`, r.unit, r.dosage, `"${r.ingredients}"`, r.status].join(','))
    ].join('\n')
    const link = document.createElement('a')
    link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    link.download = 'chemicals.csv'
    link.click()
    showToast('success', 'CSV downloaded')
  }

  const exportPrint = () => {
    const w = window.open('', '_blank')
    const html = `
      <html><head><title>Chemicals List</title><style>
      body{font-family:Arial;padding:24px;}
      table{width:100%;border-collapse:collapse;}
      th,td{border:1px solid #ccc;padding:8px;text-align:left;}
      th{background:#f4f4f4;}
      </style></head><body>
      <h2>Chemicals List</h2>
      <table><thead><tr>
      <th>S.No</th><th>Chemical Name</th><th>Unit</th><th>Dosage</th><th>Ingredients</th><th>Status</th>
      </tr></thead><tbody>
      ${rows
        .map(
          r => `<tr>
          <td>${r.sno}</td>
          <td>${r.name}</td>
          <td>${r.unit}</td>
          <td>${r.dosage}</td>
          <td>${r.ingredients}</td>
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
          Home
        </Link>
        <Typography color='text.primary'>Chemicals</Typography>
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
                Chemicals Management
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
                Add Chemical
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
                Loading Chemicals...
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
            placeholder='Search name, unit, ingredients...'
            sx={{ width: 360 }}
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

      {/* Drawer */}
      <Drawer anchor='right' open={drawerOpen} onClose={toggleDrawer}>
        <Box sx={{ p: 5, width: 420 }}>
          <Box display='flex' justifyContent='space-between' alignItems='center' mb={3}>
            <Typography variant='h5' fontWeight={600}>
              {isEdit ? 'Edit Chemical' : 'Add New Chemical'}
            </Typography>
            <IconButton onClick={toggleDrawer}>
              <CloseIcon />
            </IconButton>
          </Box>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <CustomTextField
                  fullWidth
                  label='Chemical Name'
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  inputRef={nameRef}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      setTimeout(() => {
                        unitRef.current?.querySelector('input')?.focus()
                        setUnitOpen(true)
                      }, 100)
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <Autocomplete
                  ref={unitRef}
                  freeSolo={false}
                  options={unitOptions}
                  value={formData.unit}
                  open={unitOpen}
                  onOpen={() => setUnitOpen(true)}
                  onClose={() => setUnitOpen(false)}
                  onFocus={() => setUnitOpen(true)}
                  onChange={(e, v) => setFormData({ ...formData, unit: v })}
                  renderInput={params => (
                    <CustomTextField
                      {...params}
                      label='Unit'
                      onKeyDown={e => {
                        if (e.key === 'Enter' && unitOptions.includes(formData.unit)) {
                          e.preventDefault()
                          dosageRef.current?.focus()
                        }
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ mt: 2 }}>
                  <input type='file' ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />
                  <Button
                    variant='outlined'
                    fullWidth
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={e => e.preventDefault()}
                    onDrop={handleFileDrop}
                    sx={{
                      borderColor: 'divider',
                      justifyContent: 'space-between',
                      py: 1.5
                    }}
                  >
                    <Typography sx={{ color: selectedFile ? 'text.primary' : 'text.disabled' }}>
                      {selectedFile || 'Choose File or Drag & Drop'}
                    </Typography>
                    <Typography variant='body2' color='primary'>
                      Browse
                    </Typography>
                  </Button>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <CustomTextField
                  fullWidth
                  label='Dosage'
                  value={formData.dosage}
                  onChange={e => /^\d*$/.test(e.target.value) && setFormData({ ...formData, dosage: e.target.value })}
                  inputRef={dosageRef}
                  inputProps={{ inputMode: 'numeric' }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      ingredientsRef.current?.focus()
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <CustomTextField
                  fullWidth
                  label='Ingredients'
                  multiline
                  rows={3}
                  value={formData.ingredients}
                  onChange={e => setFormData({ ...formData, ingredients: e.target.value })}
                  inputRef={ingredientsRef}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      if (isEdit) statusRef.current?.focus()
                    }
                  }}
                />
              </Grid>
              {isEdit && (
                <Grid item xs={12}>
                  <CustomTextField
                    select
                    fullWidth
                    label='Status'
                    value={formData.status}
                    onChange={handleStatusChange}
                    inputRef={statusRef}
                  >
                    <MenuItem value='Active'>Active</MenuItem>
                    <MenuItem value='Inactive'>Inactive</MenuItem>
                  </CustomTextField>
                </Grid>
              )}
            </Grid>
            <Box mt={4} display='flex' gap={2}>
              <Button type='submit' variant='contained' fullWidth disabled={loading}>
                {loading ? 'Saving...' : isEdit ? 'Update' : 'Save'}
              </Button>
              <Button variant='outlined' fullWidth onClick={toggleDrawer}>
                Cancel
              </Button>
            </Box>
          </form>
        </Box>
      </Drawer>

     <Dialog
  onClose={() => setDeleteDialog({ open: false })}
  aria-labelledby='delete-chemical-dialog'
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
  {/* 🔴 Header with Close Button */}
  <DialogTitle
    id='delete-chemical-dialog'
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
      Are you sure you want to delete chemical{' '}
      <strong style={{ color: '#d32f2f' }}>{deleteDialog.row?.name || 'this chemical'}</strong>?
      <br />
      This action cannot be undone.
    </Typography>
  </DialogContent>

  {/* ⚙️ Buttons */}
  <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 3, pt: 2 }}>
    <Button
      onClick={() => setDeleteDialog({ open: false })}
      variant='tonal'
      color='secondary'
      sx={{ minWidth: 100, textTransform: 'none', fontWeight: 500 }}
    >
      Cancel
    </Button>
    <Button
      onClick={confirmDelete}
      variant='contained'
      color='error'
      sx={{ minWidth: 100, textTransform: 'none', fontWeight: 600 }}
    >
      Delete
    </Button>
  </DialogActions>
</Dialog>

    </Box>
  )
}
