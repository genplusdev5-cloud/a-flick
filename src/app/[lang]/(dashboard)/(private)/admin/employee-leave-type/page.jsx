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

import { addLeaveType, getLeaveTypeList, updateLeaveType, deleteLeaveType } from '@/api/leaveType'

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

import TableChartIcon from '@mui/icons-material/TableChart'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import FileCopyIcon from '@mui/icons-material/FileCopy'

// ✅ Custom reusable form components
import CustomTextFieldWrapper from '@/components/common/CustomTextField'
import CustomTextarea from '@/components/common/CustomTextarea'
import CustomSelectField from '@/components/common/CustomSelectField'
import DialogCloseButton from '@components/dialogs/DialogCloseButton'
import PermissionGuard from '@/components/auth/PermissionGuard'
import { usePermission } from '@/hooks/usePermission'

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
import ChevronRight from '@menu/svg/ChevronRight'

import StickyTableWrapper from '@/components/common/StickyTableWrapper'
import StickyListLayout from '@/components/common/StickyListLayout'

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
import { employeeLeaveTypeSchema } from '@/validations/employeeLeaveType.schema'

// ... existing imports ...

// ───────────────────────────────────────────
// Component
// ───────────────────────────────────────────
// ───────────────────────────────────────────
const EmployeeLeaveTypePageContent = () => {
  const [rows, setRows] = useState([])
  const { canAccess } = usePermission()
  const [rowCount, setRowCount] = useState(0)
  const [searchText, setSearchText] = useState('')
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 })
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, row: null })
  const [exportAnchorEl, setExportAnchorEl] = useState(null)
  
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
    resolver: zodResolver(employeeLeaveTypeSchema),
    defaultValues: {
      leaveCode: '',
      name: '',
      description: '',
      status: 1
    }
  })

  // Load rows
  const loadData = async () => {
    setLoading(true)
    try {
      const res = await getLeaveTypeList(pagination.pageIndex + 1, pagination.pageSize, searchText)

      // FIXED MAPPING
      const results = res?.data?.results || []
      const count = res?.data?.count || results.length

      const normalized = results.map((item, idx) => ({
        sno: pagination.pageIndex * pagination.pageSize + idx + 1,
        id: item.id,
        leaveCode: item.leave_code || '',
        name: item.name || '',
        is_active: item.is_active === 1 ? 1 : 0
      }))

      setRows(normalized)
      setRowCount(count)
    } catch (err) {
      console.error(err)
      showToast('error', 'Failed to load data')
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
           leaveCode: '',
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
    setDrawerOpen(false)
  }

  // 🔹 Updated Add handler with unsaved data restore
  const handleAdd = () => {
    setIsEdit(false)
    if (unsavedAddData) {
      reset(unsavedAddData)
    } else {
      reset({
        leaveCode: '',
        name: '',
        description: '',
        status: 1
      })
    }
    setCloseReason(null)
    setDrawerOpen(true)
  }

  // 🔹 Edit Handler
  const handleEdit = row => {
    setIsEdit(true)
    reset({
      id: row.id,
      leaveCode: row.leaveCode || '',
      name: row.name || '',
      status: row.is_active // 1 or 0
    })
    setCloseReason(null)
    setDrawerOpen(true)
  }

  const handleDelete = async row => {
    try {
      await deleteLeaveType(row.id)
      showToast('delete', `${row.name} deleted successfully`)
      await loadData() // Refresh table
    } catch (err) {
      console.error(err)
      showToast('error', 'Failed to delete leave type')
    }
  }

  const confirmDelete = async () => {
    if (!deleteDialog.row) return

    try {
      setLoading(true)
      await deleteLeaveType(deleteDialog.row.id)
      showToast('delete', `${deleteDialog.row.name} deleted successfully`)
      await loadData() // refresh table after delete
    } catch (err) {
      console.error(err)
      showToast('error', 'Failed to delete leave type')
    } finally {
      setLoading(false)
      setDeleteDialog({ open: false, row: null })
    }
  }

  const onSubmit = async (data) => {
    // 🔍 Duplicate Check (Name)
    const isDuplicate = rows.some(r =>
      r.name.toLowerCase() === data.name.trim().toLowerCase() &&
      r.id !== (isEdit ? data.id : -1)
    )

    if (isDuplicate) {
      showToast('error', 'Leave Type name already exists')
      return
    }
    
    // 🔍 Duplicate Check (Code)
    const isDuplicateCode = rows.some(r =>
      r.leaveCode.toLowerCase() === data.leaveCode.trim().toLowerCase() &&
      r.id !== (isEdit ? data.id : -1)
    )

    if (isDuplicateCode) {
      showToast('error', 'Leave Type code already exists')
      return
    }

    setLoading(true)
    try {
      const payload = {
        id: isEdit ? data.id : undefined,
        leave_code: data.leaveCode,
        name: data.name,
        is_active: data.status === 'Active' || data.status === 1 ? 1 : 0,
        status: 1
      }

      console.log('🛰️ Payload Sent:', payload)

      if (isEdit) {
        await updateLeaveType(payload)
        showToast('success', 'Leave Type updated successfully!')
      } else {
        await addLeaveType(payload)
        showToast('success', 'Leave Type added successfully!')
      }
      
      setCloseReason('save')
      setDrawerOpen(false)
      await loadData()
    } catch (err) {
      console.error('❌ Error while saving:', err)
      showToast('error', err.response?.data?.message || err.message)
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
            {canAccess('Employee Leave Type', 'update') && (
              <IconButton size='small' color='primary' onClick={() => handleEdit(info.row.original)}>
                <i className='tabler-edit' />
              </IconButton>
            )}
            {canAccess('Employee Leave Type', 'delete') && (
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
      columnHelper.accessor('leaveCode', { header: 'Leave Code' }),
      columnHelper.accessor('name', { header: 'Name' }),
      columnHelper.accessor('is_active', {
        header: 'Status',
        cell: info => {
          const value = info.getValue()
          const label = value === 1 ? 'Active' : 'Inactive'
          const color = value === 1 ? 'success.main' : 'error.main'

          return (
            <Chip
              label={label}
              size='small'
              sx={{
                color: '#fff',
                bgcolor: color,
                fontWeight: 600,
                borderRadius: '6px',
                px: 1.5,
                textTransform: 'capitalize'
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

  // Export Functions
  const exportOpen = Boolean(exportAnchorEl)
  const exportCSV = () => {
    const headers = ['S.No', 'Leave Code', 'Name', 'Status']
    const csv = [
      headers.join(','),
      ...rows.map(r =>
        [r.sno, `"${r.leaveCode.replace(/"/g, '""')}"`, `"${r.name.replace(/"/g, '""')}"`, r.status].join(',')
      )
    ].join('\n')
    const link = document.createElement('a')
    link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    link.download = 'leave_types.csv'
    link.click()
    showToast('success', 'CSV downloaded')
  }

  const exportPrint = () => {
    const w = window.open('', '_blank')
    const html = `
      <html><head><title>Leave Types</title><style>
      body{font-family:Arial;padding:24px;}
      table{width:100%;border-collapse:collapse;}
      th,td{border:1px solid #ccc;padding:8px;text-align:left;}
      th{background:#f4f4f4;}
      </style></head><body>
      <h2>Employee Leave Types</h2>
      <table><thead><tr>
      <th>S.No</th><th>Leave Code</th><th>Name</th><th>Status</th>
      </tr></thead><tbody>
      ${rows
        .map(r => `<tr><td>${r.sno}</td><td>${r.leaveCode}</td><td>${r.name}</td><td>${r.status}</td></tr>`)
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
            <Typography color='text.primary'>Leave Types</Typography>
          </Breadcrumbs>
        </Box>
      }
    >
      <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, position: 'relative' }}>
        <CardHeader
          sx={{
            pb: 1.5,
            pt: 5,
            px: 10,
            '& .MuiCardHeader-action': { m: 0, alignItems: 'center' },
            '& .MuiCardHeader-title': { fontWeight: 600, fontSize: '1.125rem' }
          }}
          title={
            <Box display='flex' alignItems='center' gap={2}>
              <Typography variant='h5' sx={{ fontWeight: 600 }}>
                Leave Type
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

              {canAccess('Employee Leave Type', 'create') && (
                <GlobalButton
                  variant='contained'
                  startIcon={<AddIcon />}
                  onClick={handleAdd}
                  sx={{ textTransform: 'none', fontWeight: 500, px: 2.5, height: 36 }}
                >
                  Add Leave Type
                </GlobalButton>
              )}
            </Box>
          }
        />
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
            <ProgressCircularCustomization size={60} thickness={5} />
          </Box>
        )}

        <Divider />
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
              placeholder='Search code, name...'
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
        <Box sx={{ p: 5, display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Box display='flex' justifyContent='space-between' alignItems='center' mb={3}>
            <Typography variant='h5' fontWeight={600}>
              {isEdit ? 'Edit Leave Type' : 'Add Leave Type'}
            </Typography>
            <IconButton onClick={toggleDrawer} size='small'>
              <CloseIcon />
            </IconButton>
          </Box>

          <Divider sx={{ mb: 3 }} />

          <form onSubmit={hookSubmit(onSubmit)} style={{ flexGrow: 1 }}>
            <Grid container spacing={3}>
              {/* Leave Code */}
              <Grid item xs={12}>
                <Controller
                  name="leaveCode"
                  control={control}
                  render={({ field }) => (
                    <GlobalTextField
                      {...field}
                      fullWidth
                      required
                      label='Leave Code'
                      placeholder='Enter leave code'
                      error={!!errors.leaveCode}
                      helperText={errors.leaveCode?.message}
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

              {/* Leave Name */}
              <Grid item xs={12}>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <GlobalTextField
                      {...field}
                      fullWidth
                      required
                      label='Name'
                      placeholder='Enter leave type name'
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

              {/* Optional: Add Description */}
              <Grid item xs={12}>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <GlobalTextarea
                      {...field}
                      label='Description'
                      placeholder='Enter a short note or purpose for this leave type...'
                      rows={3}
                    />
                  )}
                />
              </Grid>

              {/* Status (Only for Edit Mode) */}
              {isEdit && (
                <Grid item xs={12}>
                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                       <GlobalSelect
                         {...field}
                         label='Status'
                         options={[
                           { value: 1, label: 'Active' },
                           { value: 0, label: 'Inactive' }
                         ]}
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

        {/* Centered Text */}
        <DialogContent sx={{ px: 5, pt: 1 }}>
          <Typography sx={{ color: 'text.secondary', fontSize: 14, lineHeight: 1.6 }}>
            Are you sure you want to delete{' '}
            <strong style={{ color: '#d32f2f' }}>{deleteDialog.row?.name || 'this leave type'}</strong>?
            <br />
            This action cannot be undone.
          </Typography>
        </DialogContent>

        {/* Centered Buttons */}
        <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 3, pt: 2 }}>
          <GlobalButton
            onClick={() => setDeleteDialog({ open: false, row: null })}
            variant='tonal'
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
export default function EmployeeLeaveTypePage() {
  return (
    <PermissionGuard permission="Employee Leave Type">
      <EmployeeLeaveTypePageContent />
    </PermissionGuard>
  )
}
