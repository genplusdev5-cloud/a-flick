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
  CircularProgress
} from '@mui/material'

import { getCallTypeList, addCallType, updateCallType, deleteCallType } from '@/api/calltype'

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
import CustomTextField from '@core/components/mui/TextField'
import { toast } from 'react-toastify'
import TablePaginationComponent from '@/components/TablePaginationComponent'
import classnames from 'classnames'
import { rankItem } from '@tanstack/match-sorter-utils'

import GlobalButton from '@/components/common/GlobalButton'
import GlobalTextField from '@/components/common/GlobalTextField'
import GlobalTextarea from '@/components/common/GlobalTextarea'
import GlobalSelect from '@/components/common/GlobalSelect'
import { showToast } from '@/components/common/Toasts'

import CustomTextFieldWrapper from '@/components/common/CustomTextField'
import CustomTextarea from '@/components/common/CustomTextarea'
import CustomSelectField from '@/components/common/CustomSelectField'
import DialogCloseButton from '@components/dialogs/DialogCloseButton'

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
export default function CallTypePage() {
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
    sortOrder: '',
    description: '',
    status: 'Active'
  })
  const nameRef = useRef(null)

  const handleFieldChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value }

      if (!isEdit) {
        setUnsavedAddData(updated) // 🔥 store unsaved Add Mode data
      }

      return updated
    })
  }

  // 🧩 Reset handler
  const handleCancel = () => {
    setFormData({
      id: null,
      name: '',
      sortOrder: '',
      description: '',
      status: 'Active'
    })

    setUnsavedAddData(null) // 🔥 remove cached data
    setDrawerOpen(false)
  }

  // Load rows
  const loadData = async () => {
    setLoading(true)
    try {
      const result = await getCallTypeList()

      if (result.success) {
        const all = result.data || []

        // 🔍 Apply search filter
        const filtered = searchText
          ? all.filter(r =>
              ['name', 'description', 'sort_order'].some(key =>
                (r[key] || '').toString().toLowerCase().includes(searchText.toLowerCase())
              )
            )
          : all

        // 🧾 Normalize data for UI
        const normalized = filtered.map((item, idx) => ({
          id: item.id,
          sno: idx + 1,
          name: item.name || '-',
          description: item.description || '-',
          sortOrder: item.sort_order || 0,
          status: item.is_active === 1 ? 'Active' : 'Inactive'
        }))

        setRows(normalized)
        setRowCount(normalized.length)
      } else {
        showToast('error', result.message)
      }
    } catch (err) {
      console.error(err)
      showToast('error', 'Failed to load call types')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [pagination.pageIndex, pagination.pageSize, searchText])

  // Drawer
  const toggleDrawer = () => {
    setDrawerOpen(prev => {
      if (prev && isEdit) {
        // 🔴 Edit close → clear
        setFormData({
          id: null,
          name: '',
          sortOrder: '',
          description: '',
          status: 'Active'
        })
        setIsEdit(false)
      }
      return !prev
    })
  }

  const handleAdd = () => {
    setIsEdit(false)

    // 🔥 Restore unsaved add data if exists
    if (unsavedAddData) {
      setFormData(unsavedAddData)
    } else {
      setFormData({
        id: null,
        name: '',
        sortOrder: '',
        description: '',
        status: 'Active'
      })
    }

    setDrawerOpen(true)
    setTimeout(() => nameRef.current?.focus(), 100)
  }

  const handleEdit = row => {
    setIsEdit(true)
    setFormData({
      id: row.id,
      name: row.name,
      description: row.description,
      sortOrder: row.sortOrder,
      status: row.status
    })
    setDrawerOpen(true)
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
      const result = await deleteCallType(deleteDialog.row.id)
      if (result.success) {
        showToast('success', result.message)

        setUnsavedAddData(null) // 🔥 REMOVE old cached add data

        setDrawerOpen(false)
        loadData()

        setFormData({
          id: null,
          name: '',
          sortOrder: '',
          description: '',
          status: 'Active'
        })
        setIsEdit(false)
      } else {
        showToast('error', result.message)
      }
    } catch (err) {
      console.error(err)
      showToast('error', 'Failed to delete Call Type')
    } finally {
      setDeleteDialog({ open: false, row: null })
      setLoading(false)
    }
  }

  const handleSubmit = async e => {
    e.preventDefault()

    if (!formData.name) {
      showToast('warning', 'Please enter Call Type name')
      return
    }

    setLoading(true)
    try {
      const payload = {
        id: formData.id,
        name: formData.name,
        description: formData.description || null,
        sort_order: formData.sortOrder || 0,
        is_active: formData.status === 'Active' ? 1 : 0
      }

      const result = isEdit ? await updateCallType(payload) : await addCallType(payload)

      if (result.success) {
        showToast('success', result.message)

        setUnsavedAddData(null) // 🔥🔥 FIX: clear previous add cache

        setDrawerOpen(false)
        loadData()

        setFormData({
          id: null,
          name: '',
          description: '',
          sortOrder: '',
          status: 'Active'
        })
        setIsEdit(false)
      } else {
        showToast('error', result.message)
      }
    } catch (err) {
      console.error(err)
      showToast('error', 'Failed to save Call Type')
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
      columnHelper.accessor('name', { header: 'Call Type Name' }),
      columnHelper.accessor('sortOrder', {
        header: 'Sort Order',
        cell: info => <Box sx={{ fontFamily: 'monospace' }}>{info.getValue()}</Box>
      }),
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
    getSortedRowModel: getSortedRowModel(),
    // Custom sorting for sortOrder using BigInt
    sortingFns: {
      bigint: (rowA, rowB, columnId) => {
        const a = rowA.getValue(columnId) || '0'
        const b = rowB.getValue(columnId) || '0'
        try {
          const aBig = BigInt(a)
          const bBig = BigInt(b)
          return aBig < bBig ? -1 : aBig > bBig ? 1 : 0
        } catch {
          return 0
        }
      }
    }
  })

  // Export Functions
  const exportOpen = Boolean(exportAnchorEl)
  const exportCSV = () => {
    const headers = ['S.No', 'Call Type Name', 'Sort Order', 'Description', 'Status']
    const csv = [
      headers.join(','),
      ...rows.map(r => [r.sno, r.name, r.sortOrder, r.description, r.status].join(','))
    ].join('\n')
    const link = document.createElement('a')
    link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    link.download = 'Call_Types.csv'
    link.click()
    showToast('success', 'CSV downloaded')
  }

  const exportPrint = () => {
    const w = window.open('', '_blank')
    const html = `
      <html><head><title>Call Type</title><style>
      body{font-family:Arial;padding:24px;}
      table{width:100%;border-collapse:collapse;}
      th,td{border:1px solid #ccc;padding:8px;text-align:left;}
      th{background:#f4f4f4;}
      </style></head><body>
      <h2>Call Type List</h2>
      <table><thead><tr>
      <th>S.No</th><th>Name</th><th>Sort Order</th><th>Description</th><th>Status</th>
      </tr></thead><tbody>
      ${rows
        .map(
          r =>
            `<tr><td>${r.sno}</td><td>${r.name}</td><td>${r.sortOrder}</td><td>${r.description}</td><td>${r.status}</td></tr>`
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
        <Typography color='text.primary'>Call Type</Typography>
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
                Call Type Management
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
              </GlobalButton>
            </Box>
          }
          action={
            <Box display='flex' alignItems='center' gap={2}>
              <GlobalButton
                variant='outlined'
                color='secondary'
                endIcon={<ArrowDropDownIcon />}
                onClick={e => setExportAnchorEl(e.currentTarget)}
                sx={{ textTransform: 'none', fontWeight: 500, px: 2.5, height: 36 }}
              >
                Export
              </GlobalButton>
              <Menu anchorEl={exportAnchorEl} open={exportOpen} onClose={() => setExportAnchorEl(null)}>
                <MenuItem onClick={exportPrint}>
                  <PrintIcon fontSize='small' sx={{ mr: 1 }} /> Print
                </MenuItem>
                <MenuItem onClick={exportCSV}>
                  <FileDownloadIcon fontSize='small' sx={{ mr: 1 }} /> CSV
                </MenuItem>
              </Menu>
              <GlobalButton
                variant='contained'
                startIcon={<AddIcon />}
                onClick={handleAdd}
                sx={{ textTransform: 'none', fontWeight: 500, px: 2.5, height: 36 }}
              >
                Add Call Type
              </GlobalButton>
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
            placeholder='Search name, sort order, description...'
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
              {isEdit ? 'Edit Call Type' : 'Add Call Type'}
            </Typography>
            <IconButton onClick={toggleDrawer} size='small'>
              <CloseIcon />
            </IconButton>
          </Box>

          <Divider sx={{ mb: 3 }} />

          <form onSubmit={handleSubmit} style={{ flexGrow: 1 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <GlobalTextField
                  fullWidth
                  required
                  label='Call Type Name'
                  placeholder='Enter call type name'
                  value={formData.name}
                  inputRef={nameRef}
                  onChange={e => handleFieldChange('name', e.target.value)}
                />
              </Grid>

              <Grid item xs={12}>
                <GlobalTextField
                  fullWidth
                  required
                  label='Sort Order'
                  placeholder='Enter sort order'
                  type='number'
                  value={formData.sortOrder}
                  onChange={e => handleFieldChange('sortOrder', e.target.value.replace(/\D/g, ''))}
                />
              </Grid>

              <Grid item xs={12}>
                <GlobalTextarea
                  label='Description'
                  placeholder='Enter description...'
                  rows={3}
                  value={formData.description}
                  onChange={e => handleFieldChange('description', e.target.value)}
                />
              </Grid>

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
            <strong style={{ color: '#d32f2f' }}>{deleteDialog.row?.name || 'this Call Type'}</strong>?
            <br />
            This action cannot be undone.
          </Typography>
        </DialogContent>

        {/* Centered buttons */}
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
    </Box>
  )
}
