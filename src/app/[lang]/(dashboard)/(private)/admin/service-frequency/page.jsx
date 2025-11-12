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
  InputLabel,
  CircularProgress
} from '@mui/material'

import {
  addServiceFrequency,
  getServiceFrequencyList,
  updateServiceFrequency,
  deleteServiceFrequency
} from '@/api/serviceFrequency'

import ProgressCircularCustomization from '@/components/common/ProgressCircularCustomization'
import AddIcon from '@mui/icons-material/Add'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import CloseIcon from '@mui/icons-material/Close'
import PrintIcon from '@mui/icons-material/Print'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import TableChartIcon from '@mui/icons-material/TableChart'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import FileCopyIcon from '@mui/icons-material/FileCopy'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import RefreshIcon from '@mui/icons-material/Refresh'
import Autocomplete from '@mui/material/Autocomplete'

import CustomTextFieldWrapper from '@/components/common/CustomTextField'
import CustomTextarea from '@/components/common/CustomTextarea'
import CustomSelectField from '@/components/common/CustomSelectField'
import DialogCloseButton from '@components/dialogs/DialogCloseButton'

import CustomTextField from '@core/components/mui/TextField'
import CustomAutocomplete from '@core/components/mui/Autocomplete'
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
export default function ServiceFrequencyPage() {
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
    incrementType: '',
    noOfIncrements: '',
    backlogAge: '',
    frequencyCode: '',
    displayFrequency: '',
    serviceFrequency: '', // ✅ new field added
    sortOrder: '',
    description: '',
    status: 'Active'
  })

  const incrementTypeRef = useRef(null)

  const handleFieldChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value }
      if (!isEdit) setUnsavedAddData(updated) // cache unsaved Add Drawer data
      return updated
    })
  }

  const handleCancel = () => {
    setFormData({
      id: null,
      incrementType: '',
      noOfIncrements: '',
      backlogAge: '',
      frequencyCode: '',
      displayFrequency: '',
      serviceFrequency: '', // ✅ add this line here too
      sortOrder: '',
      description: '',
      status: 'Active'
    })

    setUnsavedAddData(null)
    setDrawerOpen(false)
  }

  // Load rows
  const loadData = async () => {
    setLoading(true)
    try {
      const res = await getServiceFrequencyList()
      console.log('📥 Full Service Frequency Response:', res)

      // ✅ Safely handle your backend structure
      const results = res?.data?.data?.results || res?.data?.results || res?.results || []

      console.log('📦 Extracted Results:', results)

      if (Array.isArray(results) && results.length > 0) {
        const formatted = results.map((item, index) => ({
          sno: index + 1,
          id: item.id,
          serviceFrequency: item.name || '—',
          displayFrequency: item.name || '—',
          frequencyCode: item.frequency_code || '—',
          incrementType: item.frequency || '—',
          noOfIncrements: item.times || '—',
          backlogAge: item.backlog_age || '—',
          sortOrder: item.sort_order || '—',
          description: item.description || '—',
          is_active: item.is_active,
          status: item.is_active === 1 ? 'Active' : 'Inactive'
        }))

        console.log('✅ Formatted Table Data:', formatted)

        setRows(formatted)
        setRowCount(formatted.length)
      } else {
        console.warn('⚠️ No results found in API response')
        setRows([])
        setRowCount(0)
      }
    } catch (err) {
      console.error('❌ Error loading service frequency list:', err)
      showToast('error', 'Something went wrong while loading data')
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
        incrementType: '',
        noOfIncrements: '',
        backlogAge: '',
        frequencyCode: '',
        displayFrequency: '',
        serviceFrequency: '', // ✅ add this line here too
        sortOrder: '',
        description: '',
        status: 'Active'
      })
    }
    setDrawerOpen(true)
    setTimeout(() => incrementTypeRef.current?.focus(), 100)
  }

  const handleEdit = row => {
    setIsEdit(true)

    // ✅ Prevent null values & fix uncontrolled input warning
    setFormData({
      id: row.id || null,
      serviceFrequency: row.serviceFrequency || row.name || '',
      incrementType: row.incrementType || '',
      noOfIncrements: row.noOfIncrements || '',
      backlogAge: row.backlogAge || '',
      frequencyCode: row.frequencyCode || '',
      displayFrequency: row.displayFrequency || '',
      sortOrder: row.sortOrder || '',
      description: row.description || '',
      status: row.status || 'Active'
    })

    setDrawerOpen(true)
  }

  const handleDelete = async row => {
    const db = await initDB()
    await db.delete(STORE_NAME, row.id)
    showToast('delete', `${row.displayFrequency} deleted`)
    loadData()
  }

  const confirmDelete = async () => {
    if (!deleteDialog.row?.id) return
    setLoading(true)
    try {
      const res = await deleteServiceFrequency(deleteDialog.row.id)
      if (res?.status === 'success') showToast('delete', 'Frequency deleted successfully')
      else showToast('error', 'Failed to delete')
      await loadData()
    } catch (err) {
      console.error('❌ Delete error:', err)
      showToast('error', 'Something went wrong')
    } finally {
      setLoading(false)
      setDeleteDialog({ open: false, row: null })
    }
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!formData.displayFrequency || !formData.frequencyCode) {
      showToast('warning', 'Please fill all required fields')
      return
    }

    setLoading(true)
    try {
      const payload = {
        ...formData,
        serviceFrequency: formData.serviceFrequency || formData.displayFrequency // ✅ ensure value
      }

      const res = isEdit ? await updateServiceFrequency(payload) : await addServiceFrequency(payload)

      if (res?.status === 'success') {
        showToast('success', isEdit ? 'Frequency updated successfully' : 'Frequency added successfully')
        setDrawerOpen(false)
        await loadData()
      } else {
        showToast('error', 'Operation failed')
      }
    } catch (err) {
      console.error('❌ Error saving frequency:', err)
      showToast('error', 'Something went wrong')
    } finally {
      setLoading(false)
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
      columnHelper.accessor('displayFrequency', { header: 'Display Frequency' }),
      columnHelper.accessor('frequencyCode', { header: 'Frequency Code' }),
      columnHelper.accessor('incrementType', { header: 'Increment Type' }),
      columnHelper.accessor('noOfIncrements', { header: 'No of Increments' }),
      columnHelper.accessor('backlogAge', { header: 'Backlog Age' }),
      columnHelper.accessor('sortOrder', { header: 'Sort Order' }),
      columnHelper.accessor('description', { header: 'Description' }),
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
    const headers = [
      'S.No',
      'Display Frequency',
      'Frequency Code',
      'Increment Type',
      'No of Increments',
      'Backlog Age',
      'Sort Order',
      'Description',
      'Status'
    ]
    const csv = [
      headers.join(','),
      ...rows.map(r =>
        [
          r.sno,
          r.displayFrequency,
          r.frequencyCode,
          r.incrementType,
          r.noOfIncrements,
          r.backlogAge,
          r.sortOrder,
          r.description,
          r.status
        ].join(',')
      )
    ].join('\n')
    const link = document.createElement('a')
    link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    link.download = 'Service_Frequencies.csv'
    link.click()
    showToast('success', 'CSV downloaded')
  }

  const exportPrint = () => {
    const w = window.open('', '_blank')
    const html = `
      <html><head><title>Service Frequency</title><style>
      body{font-family:Arial;padding:24px;}
      table{width:100%;border-collapse:collapse;}
      th,td{border:1px solid #ccc;padding:8px;text-align:left;}
      th{background:#f4f4f4;}
      </style></head><body>
      <h2>Service Frequency List</h2>
      <table><thead><tr>
      <th>S.No</th><th>Display Frequency</th><th>Code</th><th>Increment</th><th>No</th><th>Backlog</th><th>Sort</th><th>Status</th>
      </tr></thead><tbody>
      ${rows
        .map(
          r =>
            `<tr><td>${r.sno}</td><td>${r.displayFrequency}</td><td>${r.frequencyCode}</td><td>${r.incrementType}</td><td>${r.noOfIncrements}</td><td>${r.backlogAge}</td><td>${r.sortOrder}</td><td>${r.status}</td></tr>`
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
        <Typography color='text.primary'>Service Frequency</Typography>
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
                Service Frequency Management
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

                  // FIRST reset pageSize to 25
                  setPagination(prev => ({
                    ...prev,
                    pageSize: 25,
                    pageIndex: 0
                  }))

                  // THEN reload AFTER resetting pagination
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
                Add Frequency
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
            placeholder='Search display frequency, code...'
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
              {isEdit ? 'Edit Frequency' : 'Add Frequency'}
            </Typography>
            <IconButton onClick={toggleDrawer} size='small'>
              <CloseIcon />
            </IconButton>
          </Box>

          <Divider sx={{ mb: 3 }} />

          <form onSubmit={handleSubmit} style={{ flexGrow: 1 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <CustomTextFieldWrapper
                  fullWidth
                  required
                  label='Service Frequency Name'
                  placeholder='Enter service frequency name'
                  value={formData.serviceFrequency || ''} // ✅ ensures it never becomes undefined
                  onChange={e => handleFieldChange('serviceFrequency', e.target.value)}
                />
              </Grid>

              <Grid item xs={12}>
                <CustomSelectField
                  label='Increment Type'
                  value={formData.incrementType}
                  onChange={e => handleFieldChange('incrementType', e.target.value)}
                  options={[
                    { value: 'Year', label: 'Year' },
                    { value: 'Month', label: 'Month' },
                    { value: 'Week', label: 'Week' },
                    { value: 'Day', label: 'Day' },
                    { value: 'Others', label: 'Others' }
                  ]}
                />
              </Grid>

              <Grid item xs={12}>
                <CustomTextFieldWrapper
                  fullWidth
                  label='No of Increments'
                  placeholder='Enter number of increments'
                  value={formData.noOfIncrements}
                  onChange={e => handleFieldChange('noOfIncrements', e.target.value)}
                />
              </Grid>

              <Grid item xs={12}>
                <CustomTextFieldWrapper
                  fullWidth
                  label='Backlog Age'
                  placeholder='Enter backlog age'
                  value={formData.backlogAge}
                  onChange={e => handleFieldChange('backlogAge', e.target.value)}
                />
              </Grid>

              <Grid item xs={12}>
                <CustomTextFieldWrapper
                  fullWidth
                  required
                  label='Frequency Code'
                  placeholder='Enter frequency code'
                  value={formData.frequencyCode}
                  onChange={e => handleFieldChange('frequencyCode', e.target.value)}
                />
              </Grid>

              <Grid item xs={12}>
                <CustomTextFieldWrapper
                  fullWidth
                  required
                  label='Display Frequency'
                  placeholder='Enter display frequency'
                  value={formData.displayFrequency}
                  onChange={e => handleFieldChange('displayFrequency', e.target.value)}
                />
              </Grid>

              <Grid item xs={12}>
                <CustomTextFieldWrapper
                  fullWidth
                  label='Sort Order'
                  placeholder='Enter sort order'
                  value={formData.sortOrder}
                  onChange={e => handleFieldChange('sortOrder', e.target.value)}
                />
              </Grid>

              <Grid item xs={12}>
                <CustomTextarea
                  label='Description'
                  placeholder='Enter description...'
                  value={formData.description}
                  onChange={e => handleFieldChange('description', e.target.value)}
                  rows={3}
                />
              </Grid>

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
            <strong style={{ color: '#d32f2f' }}>{deleteDialog.row?.displayFrequency || 'this frequency'}</strong>?
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
