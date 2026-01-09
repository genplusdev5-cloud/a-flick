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
  InputAdornment
} from '@mui/material'

import {
  addDesignation,
  getDesignationList,
  getDesignationDetails,
  updateDesignation,
  deleteDesignation
} from '@/api/designations'

import TableChartIcon from '@mui/icons-material/TableChart'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import FileCopyIcon from '@mui/icons-material/FileCopy'

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
import SearchIcon from '@mui/icons-material/Search'
import CustomTextField from '@core/components/mui/TextField'
import { toast } from 'react-toastify'
import TablePaginationComponent from '@/components/TablePaginationComponent'
import classnames from 'classnames'
import { rankItem } from '@tanstack/match-sorter-utils'
import DialogCloseButton from '@components/dialogs/DialogCloseButton'
import PermissionGuard from '@/components/auth/PermissionGuard'
import { usePermission } from '@/hooks/usePermission'

// ✅ Custom reusable form components
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

import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper
} from '@tanstack/react-table'
import styles from '@core/styles/table.module.css'
import StickyTableWrapper from '@/components/common/StickyTableWrapper'
import StickyListLayout from '@/components/common/StickyListLayout'
import ChevronRight from '@menu/svg/ChevronRight'

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
// ───────────────────────────────────────────
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { designationSchema } from '@/validations/designation.schema'

// ... existing imports ...

// ───────────────────────────────────────────
// Component
// ───────────────────────────────────────────
// ───────────────────────────────────────────
const DesignationPageContent = () => {
  const { canAccess } = usePermission()
  const [rows, setRows] = useState([])
  const [rowCount, setRowCount] = useState(0)
  const [searchText, setSearchText] = useState('')
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 })
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, row: null })
  const [exportAnchorEl, setExportAnchorEl] = useState(null)
  const [editId, setEditId] = useState(null)

  // Draft State
  const [unsavedAddData, setUnsavedAddData] = useState(null)
  const [closeReason, setCloseReason] = useState(null)

  // React Hook Form
  const {
    control,
    handleSubmit: hookSubmit,
    reset,
    formState: { errors },
    getValues
  } = useForm({
    resolver: zodResolver(designationSchema),
    defaultValues: {
      name: '',
      description: '',
      status: 1
    }
  })

  // Load rows
  const loadData = async () => {
    setLoading(true)
    try {
      const result = await getDesignationList()

      if (result.success) {
        const all = result.data || []

        // 🔍 Filter + Sort + Paginate
        const filtered = searchText
          ? all.filter(r =>
              ['name', 'description'].some(key =>
                (r[key] || '').toString().toLowerCase().includes(searchText.toLowerCase())
              )
            )
          : all

        const sorted = filtered.sort((a, b) => (b.id || 0) - (a.id || 0))
        const start = pagination.pageIndex * pagination.pageSize
        const end = start + pagination.pageSize
        const paginated = sorted.slice(start, end)

        const normalized = paginated.map((item, idx) => ({
          ...item,
          sno: start + idx + 1,
          status: item.is_active === 1 ? 'Active' : 'Inactive'
        }))

        setRows(normalized)
        setRowCount(filtered.length)
      } else {
        showToast('error', result.message)
      }
    } catch (err) {
      console.error('❌ Load Designations Error:', err)
      showToast('error', 'Failed to load designations')
    } finally {
      setLoading(false)
    }
  }

  // 🔹 Effect: Handle Drawer Closing Logic
  useEffect(() => {
    if (!drawerOpen) {
      if (closeReason === 'save' || closeReason === 'cancel') {
        // Explicitly cleared → Clear draft
        setUnsavedAddData(null)
        // Reset form to default (clean state)
        reset({
          name: '',
          description: '',
          status: 1
        })
      } else if (!isEdit) {
        // Manual Close in Add Mode → Save Draft
        const currentValues = getValues()
        setUnsavedAddData(currentValues)
      }
    }
  }, [drawerOpen])

  useEffect(() => {
    loadData()
  }, [pagination.pageIndex, pagination.pageSize, searchText])

  // Drawer
  const toggleDrawer = () => {
    setCloseReason('manual') // outside click / X button
    setDrawerOpen(p => !p)
  }

  // 🔹 Cancel drawer + reset form
  const handleCancel = () => {
    setCloseReason('cancel')
    setEditId(null)
    setDrawerOpen(false)
  }

  // 🔹 Updated Add handler with unsaved data restore
  const handleAdd = () => {
    setIsEdit(false)
    setEditId(null)
    if (unsavedAddData) {
      reset(unsavedAddData)
    } else {
      reset({
        name: '',
        description: '',
        status: 1
      })
    }
    setCloseReason(null)
    setDrawerOpen(true)
  }

  const handleEdit = async row => {
    try {
      setIsEdit(true)
      setEditId(row.id)
      setLoading(true)

      const result = await getDesignationDetails(row.id)

      if (result.success && result.data) {
        const data = result.data
        reset({
          id: data.id,
          name: data.name || '',
          description: data.description || '',
          status: data.is_active // 1 or 0
        })
        setCloseReason(null)
        setDrawerOpen(true)
      } else {
        showToast('error', result.message)
      }
    } catch (err) {
      console.error('❌ Designation Details Error:', err)
      showToast('error', 'Failed to fetch designation details')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async row => {
    setDeleteDialog({ open: true, row })
  }
  const confirmDelete = async () => {
    try {
      if (!deleteDialog.row?.id) return
      const result = await deleteDesignation(deleteDialog.row.id)
      if (result.success) {
        showToast('success', result.message)

        // No need to set closeReason here as delete is separate dialog
        await loadData()
      } else {
        showToast('error', result.message)
      }
    } catch (err) {
      console.error('❌ Delete Designation Error:', err)
      showToast('error', 'Failed to delete designation')
    } finally {
      setDeleteDialog({ open: false, row: null })
    }
  }

  const onSubmit = async data => {
    // 🔍 Duplicate Check (Client-Side)
    const isDuplicate = rows.some(r => r.name.toLowerCase() === data.name.trim().toLowerCase() && r.id !== editId)

    if (isDuplicate) {
      showToast('error', 'Designation name already exists')
      return
    }

    setLoading(true)
    try {
      const payload = {
        id: isEdit ? editId : undefined,
        name: data.name,
        description: data.description,
        is_active: data.status === 'Active' || data.status === 1 ? 1 : 0,
        status: 1
      }

      const result = isEdit ? await updateDesignation(payload) : await addDesignation(payload)

      if (result.success) {
        showToast('success', result.message)
        setCloseReason('save')
        setDrawerOpen(false)
        await loadData()
      } else {
        showToast('error', result.message)
      }
    } catch (err) {
      console.error('❌ Save Designation Error:', err)
      showToast('error', 'Something went wrong while saving designation')
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
            {canAccess('Designation', 'update') && (
              <IconButton size='small' color='primary' onClick={() => handleEdit(info.row.original)}>
                <i className='tabler-edit ' />
              </IconButton>
            )}
            {canAccess('Designation', 'delete') && (
              <IconButton
                size='small'
                color='error'
                onClick={() => setDeleteDialog({ open: true, row: info.row.original })}
              >
                <i className='tabler-trash text-red-600 text-lg' />
              </IconButton>
            )}
          </Box>
        )
      }),
      columnHelper.accessor('name', { header: 'Designation Name' }),
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
    const headers = ['S.No', 'Designation Name', 'Description', 'Status']
    const csv = [
      headers.join(','),
      ...rows.map(r =>
        [r.sno, `"${r.name.replace(/"/g, '""')}"`, `"${r.description.replace(/"/g, '""')}"`, r.status].join(',')
      )
    ].join('\n')
    const link = document.createElement('a')
    link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    link.download = 'designations.csv'
    link.click()
    showToast('success', 'CSV downloaded')
  }

  const exportPrint = () => {
    const w = window.open('', '_blank')
    const html = `
      <html><head><title>Designations</title><style>
      body{font-family:Arial;padding:24px;}
      table{width:100%;border-collapse:collapse;}
      th,td{border:1px solid #ccc;padding:8px;text-align:left;}
      th{background:#f4f4f4;}
      </style></head><body>
      <h2>Designation List</h2>
      <table><thead><tr>
      <th>S.No</th><th>Name</th><th>Description</th><th>Status</th>
      </tr></thead><tbody>
      ${rows
        .map(r => `<tr><td>${r.sno}</td><td>${r.name}</td><td>${r.description}</td><td>${r.status}</td></tr>`)
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
    <StickyListLayout
      header={
        <Box sx={{ mb: 2 }}>
          <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 2 }}>
            <Link underline='hover' color='inherit' href='/'>
              Home
            </Link>
            <Typography color='text.primary'>Designations</Typography>
          </Breadcrumbs>
        </Box>
      }
    >
      <Card sx={{ display: 'flex', flexDirection: 'column', maxHeight: '100%', minHeight: 0, position: 'relative' }}>
        <CardHeader
          title={
            <Box display='flex' alignItems='center' gap={2}>
              <Typography variant='h5' sx={{ fontWeight: 600 }}>
                Designation
              </Typography>
              <GlobalButton
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
              </GlobalButton>
            </Box>
          }
          action={
            <Box display='flex' alignItems='center' gap={2}>
              <GlobalButton
                color='secondary'
                endIcon={<ArrowDropDownIcon />}
                onClick={e => setExportAnchorEl(e.currentTarget)}
                sx={{ textTransform: 'none', fontWeight: 500, px: 2.5, height: 36 }}
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
                  onClick={async () => {
                    setExportAnchorEl(null)
                    await exportExcel()
                  }}
                >
                  <TableChartIcon fontSize='small' sx={{ mr: 1 }} /> Excel
                </MenuItem>

                <MenuItem
                  onClick={async () => {
                    setExportAnchorEl(null)
                    await exportPDF()
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

              {canAccess('Designation', 'create') && (
                <GlobalButton
                  variant='contained'
                  startIcon={<AddIcon />}
                  onClick={handleAdd}
                  sx={{ textTransform: 'none', fontWeight: 500, px: 2.5, height: 36 }}
                >
                  Add Designation
                </GlobalButton>
              )}
            </Box>
          }
          sx={{
            pb: 1.5,
            pt: 5,
            px: 10,
            '& .MuiCardHeader-action': { m: 0, alignItems: 'center' },
            '& .MuiCardHeader-title': { fontWeight: 600, fontSize: '1.125rem' }
          }}
        />
        <Divider />
        {loading && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              bgcolor: 'rgba(255,255,255,0.8)',
              backdropFilter: 'blur(2px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10
            }}
          >
            <ProgressCircularCustomization size={60} thickness={5} />
          </Box>
        )}

        <Box sx={{ p: 4, flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Box
            sx={{
              mb: 3,
              display: 'flex',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 2,
              flexShrink: 0
            }}
          >
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
              placeholder='Search name, description...'
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

          <Box sx={{ position: 'relative', flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <StickyTableWrapper rowCount={rows.length}>
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
            </StickyTableWrapper>
          </Box>

          <Box sx={{ mt: 'auto', flexShrink: 0 }}>
            <TablePaginationComponent totalCount={rowCount} pagination={pagination} setPagination={setPagination} />
          </Box>
        </Box>
      </Card>

      {/* Drawer */}
      <Drawer
        anchor='right'
        open={drawerOpen}
        onClose={toggleDrawer}
        PaperProps={{ sx: { width: 420, boxShadow: '0px 0px 15px rgba(0,0,0,0.08)' } }}
      >
        <Box sx={{ p: 5, display: 'flex', flexDirection: 'column', maxHeight: '100%' }}>
          <Box display='flex' justifyContent='space-between' alignItems='center' mb={3}>
            <Typography variant='h5' fontWeight={600}>
              {isEdit ? 'Update Designation' : 'Add Designation'}
            </Typography>
            <IconButton onClick={toggleDrawer} size='small'>
              <CloseIcon />
            </IconButton>
          </Box>

          <Divider sx={{ mb: 3 }} />

          <form onSubmit={hookSubmit(onSubmit)} style={{ flexGrow: 1 }}>
            <Grid container spacing={3}>
              {/* Designation Name */}
              <Grid item xs={12}>
                <Controller
                  name='name'
                  control={control}
                  render={({ field }) => (
                    <GlobalTextField
                      {...field}
                      fullWidth
                      required
                      label='Name'
                      placeholder='Enter designation name'
                      error={!!errors.name}
                      helperText={errors.name?.message}
                      sx={{
                        '& .MuiFormLabel-asterisk': {
                          color: '#e91e63 !important',
                          fontWeight: 700
                        },
                        '& .MuiInputLabel-root.Mui-required': {
                          color: 'inherit'
                        }
                      }}
                    />
                  )}
                />
              </Grid>

              {/* Description */}
              <Grid item xs={12}>
                <Controller
                  name='description'
                  control={control}
                  render={({ field }) => (
                    <GlobalTextarea
                      {...field}
                      label='Description'
                      placeholder='Enter designation description...'
                      rows={3}
                    />
                  )}
                />
              </Grid>

              {/* Status (Edit only) */}
              {isEdit && (
                <Grid item xs={12}>
                  <Controller
                    name='status'
                    control={control}
                    render={({ field }) => (
                      <GlobalSelect
                        label='Status'
                        value={field.value === 1 ? 'Active' : 'Inactive'}
                        onChange={e => field.onChange(e.target.value === 'Active' ? 1 : 0)}
                      />
                    )}
                  />
                </Grid>
              )}
            </Grid>

            {/* Footer Buttons */}
            <Box mt={4} display='flex' gap={2}>
              <GlobalButton color='secondary' fullWidth onClick={handleCancel} disabled={loading}>
                Cancel
              </GlobalButton>

              <GlobalButton type='submit' variant='contained' fullWidth disabled={loading}>
                {loading ? (isEdit ? 'Updating...' : 'Saving...') : isEdit ? 'Update' : 'Save'}
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
        <DialogContent sx={{ px: 5, pt: 1 }}>
          <Typography sx={{ color: 'text.secondary', fontSize: 14, lineHeight: 1.6 }}>
            Are you sure you want to delete{' '}
            <strong style={{ color: '#d32f2f' }}>{deleteDialog.row?.name || 'this designation'}</strong>?
            <br />
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 3, pt: 2 }}>
          <GlobalButton
            onClick={() => setDeleteDialog({ open: false, row: null })}
            color='secondary'
            sx={{ minWidth: 100, textTransform: 'none', fontWeight: 500 }}
          >
            Cancel
          </GlobalButton>
          <GlobalButton
            onClick={confirmDelete}
            variant='contained'
            color='error'
            sx={{ minWidth: 100, textTransform: 'none', fontWeight: 600 }}
          >
            Delete
          </GlobalButton>
        </DialogActions>
      </Dialog>
    </StickyListLayout>
  )
}

// Wrapper for RBAC
export default function DesignationPage() {
  return (
    <PermissionGuard permission='Designation'>
      <DesignationPageContent />
    </PermissionGuard>
  )
}
