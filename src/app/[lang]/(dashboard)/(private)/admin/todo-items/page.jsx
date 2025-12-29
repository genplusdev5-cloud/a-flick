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

import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { todoItemsSchema } from '@/validations/todoItems.schema'

import { addTodo, getTodoList, getTodoDetails, updateTodo, deleteTodo } from '@/api/todo'

import DialogCloseButton from '@components/dialogs/DialogCloseButton'
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

import TableChartIcon from '@mui/icons-material/TableChart'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import FileCopyIcon from '@mui/icons-material/FileCopy'

// 🔥 Global UI Components (use everywhere)
import GlobalButton from '@/components/common/GlobalButton'
import GlobalTextField from '@/components/common/GlobalTextField'
import GlobalTextarea from '@/components/common/GlobalTextarea'
import GlobalSelect from '@/components/common/GlobalSelect'
import GlobalAutocomplete from '@/components/common/GlobalAutocomplete'
import PermissionGuard from '@/components/auth/PermissionGuard'
import { usePermission } from '@/hooks/usePermission'
import { showToast } from '@/components/common/Toasts'

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
const TodoItemsPageContent = () => {
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

  // Edit ID state
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
    setValue,
    getValues
  } = useForm({
    resolver: zodResolver(todoItemsSchema),
    defaultValues: {
      title: '',
      status: 1 // Default Active
    }
  })

  // 🔹 Effect: Handle Drawer Closing Logic
  useEffect(() => {
    if (!drawerOpen) {
      if (closeReason === 'save' || closeReason === 'cancel') {
        // Explicitly cleared → Clear draft
        setUnsavedAddData(null)
        // Reset form to default (clean state)
        reset({
          title: '',
          status: 1
        })
      } else if (!isEdit) {
        // Manual Close in Add Mode → Save Draft
        const currentValues = getValues()
        setUnsavedAddData(currentValues)
      }
    }
  }, [drawerOpen])

  // Load rows
  const loadData = async () => {
    setLoading(true)
    try {
      const result = await getTodoList()

      if (result.success) {
        const all = result.data || []
        const filtered = searchText
          ? all.filter(r =>
              ['name', 'status'].some(key => (r[key] || '').toString().toLowerCase().includes(searchText.toLowerCase()))
            )
          : all

        const sorted = filtered.sort((a, b) => (b.id || 0) - (a.id || 0))
        const start = pagination.pageIndex * pagination.pageSize
        const end = start + pagination.pageSize
        const paginated = sorted.slice(start, end)

        const normalized = paginated.map((item, idx) => ({
          ...item,
          sno: start + idx + 1,
          title: item.name, // 🧩 backend field mapping
          status: item.is_active ?? 1 // default to 1 if missing
        }))

        setRows(normalized)
        setRowCount(filtered.length)
      } else {
        showToast('error', result.message)
      }
    } catch (err) {
      console.error('❌ Load Data Error:', err)
      showToast('error', 'Failed to load todos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [pagination.pageIndex, pagination.pageSize, searchText])

  // Drawer
  const toggleDrawer = () => {
    setCloseReason('manual')
    setDrawerOpen(p => !p)
  }

  const handleAdd = () => {
    setIsEdit(false)
    setEditId(null)

    if (unsavedAddData) {
      reset(unsavedAddData)
    } else {
      reset({
        title: '',
        status: 1
      })
    }
    setCloseReason(null)
    setDrawerOpen(true)
  }

  const handleEdit = async row => {
    setIsEdit(true)
    setEditId(row.id)
    setLoading(true)

    try {
      const result = await getTodoDetails(row.id)

      if (result.success && result.data) {
        const data = result.data
        reset({
          title: data.name || '',
          status: data.is_active ?? 1
        })
      } else {
        // Fallback
        reset({
          title: row.title || '',
          status: row.status
        })
      }
      setCloseReason(null)
      setDrawerOpen(true)
    } catch (err) {
      console.error('❌ Fetch details error:', err)
      showToast('error', 'Failed to fetch details')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setCloseReason('cancel')
    setDrawerOpen(false)
  }

  const onSubmit = async data => {
    // DUPLICATE CHECK
    const duplicate = rows.find(
      r => r.title.trim().toLowerCase() === data.title.trim().toLowerCase() && r.id !== editId
    )

    if (duplicate) {
      showToast('warning', 'This record already exists')
      return
    }

    setLoading(true)
    try {
      const payload = {
        id: editId,
        name: data.title,
        description: '', // Optional in schema/payload?
        is_active: data.status,
        status: data.status
      }

      const result = isEdit ? await updateTodo(payload) : await addTodo(payload)

      if (result.success) {
        showToast('success', result.message)
        setCloseReason('save')
        setDrawerOpen(false)
        await loadData()
      } else {
        showToast('error', result.message)
      }
    } catch (err) {
      console.error('❌ Submit Error:', err)
      showToast('error', 'Something went wrong while saving')
    } finally {
      setLoading(false)
    }
  }

  const confirmDelete = async () => {
    try {
      if (!deleteDialog.row?.id) return
      const result = await deleteTodo(deleteDialog.row.id)
      if (result.success) {
        showToast('delete', result.message)
        await loadData()
      } else {
        showToast('error', result.message)
      }
    } catch (err) {
      console.error('❌ Delete error:', err)
      showToast('error', 'Failed to delete Todo')
    } finally {
      setDeleteDialog({ open: false, row: null })
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
            {canAccess('Todo Items', 'update') && (
              <IconButton size='small' color='primary' onClick={() => handleEdit(info.row.original)}>
                <i className='tabler-edit ' />
              </IconButton>
            )}
            {canAccess('Todo Items', 'delete') && (
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
      columnHelper.accessor('title', { header: 'Todo Title' }),
      columnHelper.accessor('status', {
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
    /* ... keep existing ... */
    const headers = ['S.No', 'Todo Title', 'Status']
    const csv = [
      headers.join(','),
      ...rows.map(r => [r.sno, `"${r.title.replace(/"/g, '""')}"`, r.status].join(','))
    ].join('\n')
    const link = document.createElement('a')
    link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    link.download = 'todo_items.csv'
    link.click()
    showToast('success', 'CSV downloaded')
  }

  const exportPrint = () => {
    /* ... keep existing ... */
    const w = window.open('', '_blank')
    const html = `
        <html><head><title>Todo Items</title><style>
        body{font-family:Arial;padding:24px;}
        table{width:100%;border-collapse:collapse;}
        th,td{border:1px solid #ccc;padding:8px;text-align:left;}
        th{background:#f4f4f4;}
        </style></head><body>
        <h2>Todo Items List</h2>
        <table><thead><tr>
        <th>S.No</th><th>Title</th><th>Status</th>
        </tr></thead><tbody>
        ${rows.map(r => `<tr><td>${r.sno}</td><td>${r.title}</td><td>${r.status}</td></tr>`).join('')}
        </tbody></table></body></html>`
    w.document.write(html)
    w.document.close()
    w.print()
  }

  const exportExcel = async () => {
    /* ... */
  }
  const exportPDF = async () => {
    /* ... */
  }
  const exportCopy = () => {
    /* ... */
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
            <Typography color='text.primary'>Todos</Typography>
          </Breadcrumbs>
        </Box>
      }
    >
      <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, position: 'relative' }}>
        <CardHeader
          title={
            <Box display='flex' alignItems='center' gap={2}>
              <Typography variant='h5' sx={{ fontWeight: 600 }}>
                Todo
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
                  setPagination(prev => ({ ...prev, pageSize: 25, pageIndex: 0 }))
                  await loadData()
                  setTimeout(() => setLoading(false), 500)
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
                <MenuItem onClick={exportCSV}>
                  <FileDownloadIcon fontSize='small' sx={{ mr: 1 }} /> CSV
                </MenuItem>
                <MenuItem onClick={exportPrint}>
                  <PrintIcon fontSize='small' sx={{ mr: 1 }} /> Print
                </MenuItem>
                {/* Add others if needed */}
              </Menu>

              {canAccess('Todo Items', 'create') && (
                <GlobalButton
                  variant='contained'
                  startIcon={<AddIcon />}
                  onClick={handleAdd}
                  sx={{ textTransform: 'none', fontWeight: 500, px: 2.5, height: 36 }}
                >
                  Add Todo
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
          <Divider sx={{ mb: 2 }} />
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
              placeholder='Search title, status...'
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
              {isEdit ? 'Edit Todo' : 'Add Todo'}
            </Typography>
            <IconButton onClick={toggleDrawer} size='small'>
              <CloseIcon />
            </IconButton>
          </Box>

          <Divider sx={{ mb: 3 }} />

          <form onSubmit={hookSubmit(onSubmit)} style={{ flexGrow: 1 }}>
            <Grid container spacing={3}>
              {/* Todo Title */}
              <Grid item xs={12}>
                <Controller
                  name='title'
                  control={control}
                  render={({ field }) => (
                    <GlobalTextField
                      {...field}
                      label='Todo Title'
                      fullWidth
                      required
                      placeholder='Enter ToDo Title'
                      error={!!errors.title}
                      helperText={errors.title?.message}
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

              {/* Status — only in edit mode */}
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
                        options={[
                          { value: 'Active', label: 'Active' },
                          { value: 'Inactive', label: 'Inactive' }
                        ]}
                      />
                    )}
                  />
                </Grid>
              )}
            </Grid>

            {/* Footer buttons */}
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
            <strong style={{ color: '#d32f2f' }}>{deleteDialog.row?.title || 'this todo'}</strong>?
            <br />
            This action cannot be undone.
          </Typography>
        </DialogContent>

        {/* Centered Buttons */}
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
export default function TodoItemsListPage() {
  return (
    <PermissionGuard permission='Todo Items'>
      <TodoItemsPageContent />
    </PermissionGuard>
  )
}
