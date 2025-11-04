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
  CircularProgress,
  Autocomplete
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import CloseIcon from '@mui/icons-material/Close'
import PrintIcon from '@mui/icons-material/Print'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import RefreshIcon from '@mui/icons-material/Refresh'
import UploadFileIcon from '@mui/icons-material/UploadFile'
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
export default function ChemicalsPage() {
  const [rows, setRows] = useState([])
  const [rowCount, setRowCount] = useState(0)
  const [searchText, setSearchText] = useState('')
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 })
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, row: null })
  const [exportAnchorEl, setExportAnchorEl] = useState(null)
  const [formData, setFormData] = useState({
    id: null,
    name: '',
    unit: '',
    dosage: '',
    ingredients: '',
    status: 'Active',
    file: ''
  })
  const [selectedFile, setSelectedFile] = useState('')
  const [unitOpen, setUnitOpen] = useState(false)
  const fileInputRef = useRef(null)
  const nameRef = useRef(null)
  const unitRef = useRef(null)
  const dosageRef = useRef(null)
  const ingredientsRef = useRef(null)
  const statusRef = useRef(null)

  const unitOptions = ['kg', 'litre', 'bottle', 'pkt', 'box']

  // Load rows
  const loadData = async () => {
    setLoading(true)
    try {
      const db = await initDB()
      const all = await db.getAll(STORE_NAME)
      const filtered = searchText
        ? all.filter(r =>
            ['name', 'unit', 'ingredients'].some(key =>
              (r[key] || '').toString().toLowerCase().includes(searchText.toLowerCase())
            )
          )
        : all
      const sorted = filtered.sort((a, b) => (b.id || 0) - (a.id || 0))
      const start = pagination.pageIndex * pagination.pageSize
      const pageSlice = sorted.slice(start, start + pagination.pageSize)
      const normalized = pageSlice.map((item, i) => ({
        ...item,
        sno: start + i + 1
      }))
      setRows(normalized)
      setRowCount(filtered.length)
    } catch (err) {
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
    setFormData({
      id: null,
      name: '',
      unit: '',
      dosage: '',
      ingredients: '',
      status: 'Active',
      file: ''
    })
    setSelectedFile('')
    setDrawerOpen(true)
    setTimeout(() => nameRef.current?.focus(), 100)
  }
  const handleEdit = row => {
    setIsEdit(true)
    setFormData(row)
    setSelectedFile(row.file || '')
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
    if (!formData.name || !formData.unit || !formData.dosage) {
      showToast('warning', 'Please fill name, unit, and dosage')
      return
    }
    setLoading(true)
    try {
      const db = await initDB()
      const payload = { ...formData, file: selectedFile }
      if (isEdit && formData.id) {
        await db.put(STORE_NAME, payload)
        showToast('success', 'Chemical updated')
      } else {
        delete payload.id
        await db.add(STORE_NAME, payload)
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
    if (isEdit && formData.id) {
      const updatedRow = { ...formData, status: newStatus, id: formData.id }
      setRows(prev => prev.map(r => (r.id === formData.id ? updatedRow : r)))
      const db = await initDB()
      await db.put(STORE_NAME, updatedRow)
      showToast('success', 'Status updated')
    }
  }

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
      columnHelper.accessor('name', { header: 'Chemical Name' }),
      columnHelper.accessor('unit', { header: 'Unit' }),
      columnHelper.accessor('dosage', { header: 'Dosage' }),
      columnHelper.accessor('ingredients', { header: 'Ingredients' }),
      columnHelper.accessor('file', {
        header: 'File',
        cell: info => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <UploadFileIcon fontSize='small' color='action' />
            <Typography variant='body2' noWrap>
              {info.getValue() || '—'}
            </Typography>
          </Box>
        )
      }),
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
    const headers = ['S.No', 'Name', 'Unit', 'Dosage', 'Ingredients', 'File', 'Status']
    const csv = [
      headers.join(','),
      ...rows.map(r => [r.sno, r.name, r.unit, r.dosage, r.ingredients, r.file, r.status].join(','))
    ].join('\n')
    const link = document.createElement('a')
    link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    link.download = 'Chemicals.csv'
    link.click()
    showToast('success', 'CSV downloaded')
  }

  const exportPrint = () => {
    const w = window.open('', '_blank')
    const html = `
      <html><head><title>Chemicals</title><style>
      body{font-family:Arial;padding:24px;}
      table{width:100%;border-collapse:collapse;}
      th,td{border:1px solid #ccc;padding:8px;text-align:left;}
      th{background:#f4f4f4;}
      </style></head><body>
      <h2>Chemicals List</h2>
      <table><thead><tr>
      <th>S.No</th><th>Name</th><th>Unit</th><th>Dosage</th><th>Ingredients</th><th>File</th><th>Status</th>
      </tr></thead><tbody>
      ${rows
        .map(
          r =>
            `<tr><td>${r.sno}</td><td>${r.name}</td><td>${r.unit}</td><td>${r.dosage}</td><td>${r.ingredients}</td><td>${r.file || '—'}</td><td>${r.status}</td></tr>`
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
      <Drawer anchor='right' open={drawerOpen} onClose={toggleDrawer}>
        <Box sx={{ p: 5, width: 420 }}>
          <Box display='flex' justifyContent='space-between' alignItems='center' mb={3}>
            <Typography variant='h5' fontWeight={600}>
              {isEdit ? 'Edit Chemical' : 'Add Chemical'}
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
                  label='Chemical Name *'
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
                  onInputChange={(e, newValue) => setFormData(prev => ({ ...prev, unit: newValue }))}
                  onChange={(e, newValue) => setFormData(prev => ({ ...prev, unit: newValue }))}
                  renderInput={params => (
                    <CustomTextField
                      {...params}
                      label='Unit *'
                      inputProps={{
                        ...params.inputProps,
                        onKeyDown: e => {
                          if (e.key === 'Enter' && unitOptions.includes(formData.unit)) {
                            e.preventDefault()
                            dosageRef.current?.focus()
                          }
                        }
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Box
                  sx={{
                    border: '1px dashed',
                    borderColor: 'divider',
                    borderRadius: 1,
                    p: 2,
                    textAlign: 'center',
                    cursor: 'pointer',
                    bgcolor: 'background.paper',
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={handleFileDrop}
                >
                  <UploadFileIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                  <Typography variant='body2' color={selectedFile ? 'text.primary' : 'text.disabled'}>
                    {selectedFile || 'Choose File or Drag & Drop Here'}
                  </Typography>
                  <Typography variant='caption' color='primary'>
                    Browse
                  </Typography>
                </Box>
                <input type='file' ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />
              </Grid>
              <Grid item xs={12}>
                <CustomTextField
                  fullWidth
                  label='Dosage *'
                  value={formData.dosage}
                  onChange={e => /^\d*$/.test(e.target.value) && setFormData({ ...formData, dosage: e.target.value })}
                  inputProps={{ inputMode: 'numeric' }}
                  inputRef={dosageRef}
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
                  multiline
                  rows={3}
                  label='Ingredients'
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

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, row: null })}>
        <DialogTitle sx={{ textAlign: 'center', color: 'error.main', fontWeight: 600 }}>
          <WarningAmberIcon sx={{ verticalAlign: 'middle', mr: 1 }} /> Confirm Delete
        </DialogTitle>
        <DialogContent>
          <Typography textAlign='center'>
            Are you sure you want to delete{' '}
            <strong style={{ color: '#d32f2f' }}>{deleteDialog.row?.name}</strong>?
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
