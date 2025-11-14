'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
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

import { getChemicalsList, addChemical, updateChemical, deleteChemical, getChemicalDetails } from '@/api/chemicals'

import ProgressCircularCustomization from '@/components/common/ProgressCircularCustomization'
import AddIcon from '@mui/icons-material/Add'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import CloseIcon from '@mui/icons-material/Close'
import PrintIcon from '@mui/icons-material/Print'
import DialogCloseButton from '@components/dialogs/DialogCloseButton'
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

// ✅ Custom common form components
import CustomTextFieldWrapper from '@/components/common/CustomTextField'
import CustomTextarea from '@/components/common/CustomTextarea'
import CustomSelectField from '@/components/common/CustomSelectField'

// 🔥 Global UI Components (use everywhere)
import GlobalButton from '@/components/common/GlobalButton'
import GlobalTextField from '@/components/common/GlobalTextField'
import GlobalTextarea from '@/components/common/GlobalTextarea'
import GlobalSelect from '@/components/common/GlobalSelect'
import GlobalAutocomplete from '@/components/common/GlobalAutocomplete'
import { showToast } from '@/components/common/Toasts'

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
  const [unsavedAddData, setUnsavedAddData] = useState(null)
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
      const result = await getChemicalsList()

      if (result.success) {
        const all = result.data || []

        const filtered = searchText
          ? all.filter(r => (r.name || '').toLowerCase().includes(searchText.toLowerCase()))
          : all

        const normalized = filtered.map((item, idx) => ({
          id: item.id,
          sno: idx + 1,
          name: item.name || '-',
          unit: item.uom || '-',
          dosage: item.unit_value || '-',
          ingredients: item.description || '-',
          file: item.file_name || '-',
          status: item.is_active === 1 ? 'Active' : 'Inactive'
        }))

        setRows(normalized)
        setRowCount(normalized.length)
      } else {
        showToast('error', result.message)
      }
    } catch (err) {
      console.error(err)
      showToast('error', 'Failed to load chemicals')
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
        unit: '',
        dosage: '',
        ingredients: '',
        status: 'Active',
        file: ''
      })
    }
    setSelectedFile('')
    setDrawerOpen(true)
    setTimeout(() => nameRef.current?.focus(), 100)
  }

  const handleCancel = () => {
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
    setUnsavedAddData(null)
    setDrawerOpen(false)
  }

  const handleFieldChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value }
      if (!isEdit) setUnsavedAddData(updated)
      return updated
    })
  }

  const handleEdit = async row => {
    try {
      setLoading(true)
      setIsEdit(true)

      const result = await getChemicalDetails(row.id)
      if (result.success && result.data) {
        const data = result.data

        setFormData({
          id: data.id,
          name: data.name || '',
          unit: data.uom || '',
          dosage: data.unit_value || '',
          ingredients: data.description || '',
          file: data.file_name || '',
          status: data.is_active === 1 ? 'Active' : 'Inactive'
        })

        console.log('🔥 AFTER EDIT → FORMDATA:', {
          id: data.id,
          name: data.name,
          unit: data.uom,
          dosage: data.unit_value,
          ingredients: data.description,
          file: data.file_name,
          status: data.is_active === 1 ? 'Active' : 'Inactive'
        })

        setSelectedFile(data.file_name || '')
        setDrawerOpen(true)
        setTimeout(() => nameRef.current?.focus(), 100)
      } else {
        showToast('error', result.message)
      }
    } catch (err) {
      console.error('❌ Edit Chemical Error:', err)
      showToast('error', 'Something went wrong while fetching chemical details')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async row => {
    const db = await initDB()
    await db.delete(STORE_NAME, row.id)
    showToast('delete', `${row.name} deleted`)
    loadData()
  }
  const confirmDelete = async () => {
    if (!deleteDialog.row) return
    setLoading(true)
    try {
      const result = await deleteChemical(deleteDialog.row.id)
      if (result.success) {
        showToast('delete', result.message)
        loadData()
      } else {
        showToast('error', result.message)
      }
    } catch (err) {
      console.error(err)
      showToast('error', 'Failed to delete chemical')
    } finally {
      setDeleteDialog({ open: false, row: null })
      setLoading(false)
    }
  }

  const handleSubmit = async e => {
    e.preventDefault()

    if (!formData.name) {
      showToast('warning', 'Please enter chemical name')
      return
    }

    const form = new FormData()
    form.append('name', formData.name)
    form.append('description', formData.ingredients || '')
    form.append('uom', formData.unit || '')
    form.append('unit_value', formData.dosage || '')
    form.append('is_active', formData.status === 'Active' ? 1 : 0)

    if (formData.file instanceof File) {
      form.append('file_name', formData.file)
    }

    setLoading(true)

    try {
      let result
      if (isEdit) {
        console.log('🚨 BEFORE UPDATE API → ID:', formData.id)
        console.log('🚨 FULL FORMDATA BEFORE UPDATE:', JSON.stringify(formData, null, 2))

        result = await updateChemical(formData.id, form)
      } else {
        result = await addChemical(form)
      }

      if (result.success) {
        showToast('success', result.message)
        setDrawerOpen(false)
        loadData()

        // Clear unsaved add data
        setUnsavedAddData(null)
      } else {
        showToast('error', result.message)
      }
    } catch (err) {
      console.error(err)
      showToast('error', 'Failed to save chemical')
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
    const f = e.target.files[0]
    console.log('🔥 FILE SELECTED:', f)
    if (!f) {
      console.log('❌ File is undefined')
      return
    }
    setSelectedFile(f.name)
    setFormData(prev => ({ ...prev, file: f }))
  }

  const handleFileDrop = e => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) {
      setSelectedFile(file.name)
      setFormData(prev => ({ ...prev, file }))
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

  const paginatedRows = useMemo(() => {
    const start = pagination.pageIndex * pagination.pageSize
    const end = start + pagination.pageSize
    return rows.slice(start, end)
  }, [rows, pagination])

  const table = useReactTable({
    data: paginatedRows,

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

                  // Reset page size to 25 BEFORE refresh
                  setPagination(prev => ({
                    ...prev,
                    pageSize: 25,
                    pageIndex: 0
                  }))

                  // Load data after pagination updates
                  setTimeout(async () => {
                    await loadData()
                    setLoading(false)
                  }, 50)
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
      <Drawer
        anchor='right'
        open={drawerOpen}
        onClose={toggleDrawer}
        PaperProps={{ sx: { width: 420, boxShadow: '0px 0px 15px rgba(0,0,0,0.08)' } }}
      >
        <Box sx={{ p: 5, display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Box display='flex' justifyContent='space-between' alignItems='center' mb={3}>
            <Typography variant='h5' fontWeight={600}>
              {isEdit ? 'Edit Chemical' : 'Add Chemical'}
            </Typography>
            <IconButton onClick={toggleDrawer} size='small'>
              <CloseIcon />
            </IconButton>
          </Box>

          <Divider sx={{ mb: 3 }} />

          <form onSubmit={handleSubmit} style={{ flexGrow: 1 }}>
            <Grid container spacing={3}>
              {/* Chemical Name */}
              <Grid item xs={12}>
                <GlobalTextField
                  fullWidth
                  required
                  label='Chemical Name'
                  placeholder='Enter chemical name'
                  value={formData.name}
                  inputRef={nameRef}
                  onChange={e => handleFieldChange('name', e.target.value)}
                />
              </Grid>

              {/* Unit */}
              <Grid item xs={12}>
                <GlobalAutocomplete
                  label='Unit'
                  value={formData.unit}
                  onChange={(event, newValue) => {
                    setFormData(prev => ({
                      ...prev,
                      unit: newValue?.value || prev.unit
                    }))
                  }}
                  options={[
                    { value: 'kg', label: 'Kg' },
                    { value: 'litre', label: 'Litre' },
                    { value: 'bottle', label: 'Bottle' },
                    { value: 'pkt', label: 'Packet' },
                    { value: 'box', label: 'Box' }
                  ]}
                />
              </Grid>

              {/* Dosage */}
              <Grid item xs={12}>
                <GlobalTextField
                  fullWidth
                  required
                  label='Dosage'
                  placeholder='Enter dosage value'
                  value={formData.dosage}
                  onChange={e => handleFieldChange('dosage', e.target.value.replace(/[^0-9.]/g, ''))}
                />
              </Grid>

              {/* Ingredients */}
              <Grid item xs={12}>
                <GlobalTextarea
                  label='Ingredients'
                  placeholder='Enter ingredients or remarks...'
                  rows={3}
                  value={formData.ingredients}
                  onChange={e => handleFieldChange('ingredients', e.target.value)}
                />
              </Grid>

              {/* File Upload */}
              <Grid item xs={12}>
                <Grid item xs={12}>
                  <Box
                    sx={{
                      border: '1px dashed #ccc',
                      borderRadius: '8px',
                      p: 3,
                      textAlign: 'center',
                      bgcolor: '#fafafa',
                      transition: '0.2s',
                      '&:hover': { borderColor: 'primary.main' }
                    }}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => {
                      e.preventDefault()
                      const file = e.dataTransfer.files[0]
                      if (file) {
                        setSelectedFile(file.name)
                        setFormData(prev => ({ ...prev, file })) // REAL FILE
                      }
                    }}
                  >
                    <UploadFileIcon sx={{ fontSize: 45, color: 'primary.main', mb: 1 }} />

                    <Typography sx={{ fontWeight: 600, color: '#5e5873', mb: 1 }}>
                      Drag & Drop your file here
                    </Typography>

                    <Typography sx={{ fontSize: '0.85rem', color: '#6e6b7b', mb: 2 }}>or</Typography>

                    {/* CLICKABLE BROWSE BUTTON — SAME LOGIC AS OLD WORKING CODE */}
                    <GlobalButton
                      variant='contained'
                      sx={{
                        textTransform: 'none',
                        backgroundColor: 'primary.main',
                        borderRadius: '6px',
                        px: 3,
                        py: 1,
                        '&:hover': { backgroundColor: 'primary.dark' }
                      }}
                      onClick={() => {
                        console.log('🔥 BROWSE CLICKED')
                        fileInputRef.current?.click()
                      }}
                    >
                      Browse
                    </GlobalButton>

                    {/* SHOW SELECTED FILE */}
                    {selectedFile && (
                      <Typography
                        sx={{
                          mt: 2,
                          fontSize: '0.85rem',
                          fontWeight: 500,
                          color: 'primary.main'
                        }}
                      >
                        {selectedFile}
                      </Typography>
                    )}

                    {/* HIDDEN INPUT (DO NOT TOUCH) */}
                  </Box>
                </Grid>

                <input
                  type='file'
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={e => {
                    const file = e.target.files[0]
                    if (file) {
                      setSelectedFile(file.name)
                      setFormData(prev => ({ ...prev, file })) // REAL FILE OBJECT
                    }
                  }}
                />
              </Grid>

              {/* Status (only on edit) */}
              {isEdit && (
                <Grid item xs={12}>
                  <GlobalSelect
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

            {/* Footer Buttons */}
            <Box mt={4} display='flex' gap={2}>
              <GlobalButton type='submit' variant='contained' fullWidth disabled={loading}>
                {loading ? (isEdit ? 'Updating...' : 'Saving...') : isEdit ? 'Update' : 'Save'}
              </GlobalButton>
              <GlobalButton variant='outlined' color='secondary' fullWidth onClick={handleCancel} disabled={loading}>
                Cancel
              </GlobalButton>
            </Box>
          </form>
        </Box>
      </Drawer>

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
          <DialogCloseButton
            onClick={() => setDeleteDialog({ open: false, row: null })}
            disableRipple
            sx={{ position: 'absolute', right: 1, top: 1 }}
          >
            <i className='tabler-x' />
          </DialogCloseButton>
        </DialogTitle>

        {/* Centered text */}
        <DialogContent sx={{ px: 5, pt: 1 }}>
          <Typography sx={{ color: 'text.secondary', fontSize: 14, lineHeight: 1.6 }}>
            Are you sure you want to delete{' '}
            <strong style={{ color: '#d32f2f' }}>{deleteDialog.row?.name || 'this chemical'}</strong>?
            <br />
            This action cannot be undone.
          </Typography>
        </DialogContent>

        {/* Centered buttons */}
        <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 3, pt: 2 }}>
          <Button
            onClick={() => setDeleteDialog({ open: false, row: null })}
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
