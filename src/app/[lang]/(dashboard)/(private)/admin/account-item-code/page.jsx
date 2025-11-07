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

import { addAccount, getAccountList, updateAccount, deleteAccount } from '@/api/account'

import DialogCloseButton from '@components/dialogs/DialogCloseButton'
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

import CustomTextFieldWrapper from '@/components/common/CustomTextField'
import CustomTextarea from '@/components/common/CustomTextarea'
import CustomSelectField from '@/components/common/CustomSelectField'

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

// ──────────────────────────────────────────────────────────────
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
// ──────────────────────────────────────────────────────────────
// Debounced Input
// ──────────────────────────────────────────────────────────────
const DebouncedInput = ({ value: initialValue, onChange, debounce = 500, ...props }) => {
  const [value, setValue] = useState(initialValue)
  useEffect(() => setValue(initialValue), [initialValue])
  useEffect(() => {
    const timeout = setTimeout(() => onChange(value), debounce)
    return () => clearTimeout(timeout)
  }, [value])
  return <TextField {...props} value={value} onChange={e => setValue(e.target.value)} />
}

// ──────────────────────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────────────────────
export default function AccountItemCodePage() {
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
    itemNumber: '',
    description: '',
    status: 'Active'
  })

  const nameRef = useRef(null)

  // ──────────────────────────────────────────────────────────────
  const loadItems = async () => {
    setLoading(true)
    try {
      const res = await getAccountList()
      if (res?.status === 'success') {
        const results = res.data?.results || []

        // 🧮 Add serial numbers for table
        const formatted = results.map((item, index) => ({
          sno: index + 1,
          id: item.id,
          name: item.name,
          itemNumber: item.item_number,
          description: item.description || '',
          status: item.status === 1 ? 'Active' : 'Inactive',
          is_active: item.is_active
        }))

        setRows(formatted)
        setRowCount(formatted.length)
      } else {
        showToast('error', 'Failed to load account list')
      }
    } catch (err) {
      console.error('❌ Error loading list:', err)
      showToast('error', 'Something went wrong while fetching data')
    } finally {
      setLoading(false)
    }
  }

  const handleFieldChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value }
      if (!isEdit) setUnsavedAddData(updated) // ✅ only for Add mode
      return updated
    })
  }

  useEffect(() => {
    // reload when pagination or searchText changes
    loadItems()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.pageIndex, pagination.pageSize, searchText])

  // ──────────────────────────────────────────────────────────────
  // Drawer Logic
  // ──────────────────────────────────────────────────────────────
  const toggleDrawer = () => setDrawerOpen(p => !p)

  const handleAdd = () => {
    setIsEdit(false)
    if (unsavedAddData) {
      setFormData(unsavedAddData)
    } else {
      setFormData({ id: null, name: '', itemNumber: '', description: '', status: 'Active' })
    }
    setDrawerOpen(true)
    setTimeout(() => nameRef.current?.focus(), 100)
  }

  const handleCancel = () => {
    setFormData({ id: null, name: '', itemNumber: '', description: '', status: 'Active' })
    setUnsavedAddData(null) // ✅ clear saved draft
    setDrawerOpen(false)
  }

  const handleEdit = row => {
    setIsEdit(true)
    setFormData({
      id: row.id,
      name: row.name || '',
      itemNumber: row.itemNumber || '',
      description: row.description || '',
      status: row.status || 'Active'
    })
    setDrawerOpen(true)
    setTimeout(() => nameRef.current?.focus(), 100)
  }

  const handleDelete = async row => {
    try {
      const db = await initDB()
      await db.delete(STORE_NAME, row.id)
      showToast('delete', `${row.name} deleted`)
      // reload current page - adjust if last item removed on page
      const remainingAll = await (await initDB()).getAll(STORE_NAME)
      const filtered = searchText
        ? remainingAll.filter(
            r =>
              (r.name || '').toString().toLowerCase().includes(searchText.toLowerCase()) ||
              (r.itemNumber || '').toString().toLowerCase().includes(searchText.toLowerCase()) ||
              (r.description || '').toString().toLowerCase().includes(searchText.toLowerCase())
          )
        : remainingAll
      const newRowCount = filtered.length
      const currentPageIndex = pagination.pageIndex
      const lastPageIndex = Math.max(0, Math.ceil(newRowCount / pagination.pageSize) - 1)
      if (currentPageIndex > lastPageIndex) setPagination(p => ({ ...p, pageIndex: lastPageIndex }))
      else await loadItems()
    } catch (err) {
      console.error(err)
      showToast('error', 'Failed to delete')
    }
  }

  const confirmDelete = async () => {
    if (!deleteDialog.row?.id) return
    setLoading(true)
    try {
      const res = await deleteAccount(deleteDialog.row.id)
      if (res.status === 'success') showToast('delete', 'Account deleted successfully')
      else showToast('error', 'Failed to delete account')
      await loadItems()
    } catch (err) {
      console.error('❌ Delete error:', err)
      showToast('error', 'Something went wrong during delete')
    } finally {
      setLoading(false)
      setDeleteDialog({ open: false, row: null })
    }
  }

  // 💾 Add / Update Account
  // ─────────────────────────────────────────────
  const handleSubmit = async e => {
    e.preventDefault()
    if (!formData.name || !formData.itemNumber) {
      showToast('warning', 'Please fill all required fields')
      return
    }

    setLoading(true)
    try {
      const payload = {
        id: formData.id,
        name: formData.name,
        itemNumber: formData.itemNumber,
        description: formData.description,
        status: formData.status
      }

      if (isEdit) {
        const res = await updateAccount(payload)
        if (res.status === 'success') showToast('success', 'Account updated successfully')
      } else {
        const res = await addAccount(payload)
        if (res.status === 'success') showToast('success', 'Account added successfully')
      }

      setDrawerOpen(false)
      await loadItems()
    } catch (err) {
      console.error('❌ Error saving account:', err)
      showToast('error', 'Failed to save account')
    } finally {
      setLoading(false)
    }
  }

  // ──────────────────────────────────────────────────────────────
  // Table Setup (TanStack)
  // ──────────────────────────────────────────────────────────────
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
      columnHelper.accessor('name', { header: 'Name' }),
      columnHelper.accessor('itemNumber', { header: 'Item Number' }),
      columnHelper.accessor('description', { header: 'Description' }),
      columnHelper.display({
        id: 'status',
        header: 'Status',
        cell: info => {
          const row = info.row.original
          const isActive = row.is_active === 1
          return (
            <Chip
              label={isActive ? 'Active' : 'Inactive'}
              size='small'
              sx={{
                color: '#fff',
                bgcolor: isActive ? 'success.main' : 'error.main',
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
    pageCount: Math.ceil(rowCount / pagination.pageSize) || 0,
    state: { globalFilter: searchText, pagination },
    onGlobalFilterChange: setSearchText,
    onPaginationChange: setPagination,
    globalFilterFn: fuzzyFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel()
  })

  // ──────────────────────────────────────────────────────────────
  // Export Functions
  // ──────────────────────────────────────────────────────────────
  const exportOpen = Boolean(exportAnchorEl)

  const exportPrint = () => {
    const w = window.open('', '_blank')
    const html = `
      <html><head><title>Account Items</title><style>
        body{font-family:Arial;padding:24px;}
        table{width:100%;border-collapse:collapse;}
        th,td{border:1px solid #ccc;padding:8px;text-align:left;}
        th{background:#f4f4f4;}
      </style></head><body>
      <h2>Account Item List</h2>
      <table><thead><tr>
        <th>S.No</th><th>Name</th><th>Item Number</th><th>Description</th><th>Status</th>
      </tr></thead><tbody>
      ${rows
        .map(
          r =>
            `<tr><td>${r.sno}</td><td>${r.name}</td><td>${r.itemNumber}</td><td>${(r.description || '')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')}</td><td>${r.status}</td></tr>`
        )
        .join('')}
      </tbody></table></body></html>`
    w?.document.write(html)
    w?.document.close()
    w?.print()
  }

  const exportCSV = () => {
    const headers = ['S.No', 'Name', 'Item Number', 'Description', 'Status']
    const csv = [
      headers.join(','),
      ...rows.map(r => [r.sno, r.name, r.itemNumber, (r.description || '').replace(/,/g, ' '), r.status].join(','))
    ].join('\n')
    const link = document.createElement('a')
    link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    link.download = 'Account_Items.csv'
    link.click()
    showToast('success', 'CSV downloaded')
  }

  const exportExcel = async () => {
    const XLSX = await import('xlsx')
    const ws = XLSX.utils.json_to_sheet(
      rows.map(r => ({
        'S.No': r.sno,
        Name: r.name,
        'Item Number': r.itemNumber,
        Description: r.description,
        Status: r.status
      }))
    )
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Account Items')
    XLSX.writeFile(wb, 'Account_Items.xlsx')
    showToast('success', 'Excel downloaded')
  }

  const exportPDF = async () => {
    const { jsPDF } = await import('jspdf')
    const autoTable = (await import('jspdf-autotable')).default
    const doc = new jsPDF()
    doc.text('Account Items', 14, 15)
    autoTable(doc, {
      startY: 25,
      head: [['S.No', 'Name', 'Item Number', 'Description', 'Status']],
      body: rows.map(r => [r.sno, r.name, r.itemNumber, r.description, r.status])
    })
    doc.save('Account_Items.pdf')
    showToast('success', 'PDF exported')
  }

  const exportCopy = () => {
    const text = rows.map(r => `${r.sno}. ${r.name} | ${r.itemNumber} | ${r.status}`).join('\n')
    navigator.clipboard.writeText(text)
    showToast('info', 'Copied to clipboard')
  }

  // ──────────────────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────────────────
  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Breadcrumbs aria-label='breadcrumb'>
          <Link underline='hover' color='inherit' href='/'>
            Home
          </Link>
          <Typography color='text.primary'>Account Item Code</Typography>
        </Breadcrumbs>
      </Box>

      <Card sx={{ p: 3 }}>
        <CardHeader
          title={
            <Box display='flex' alignItems='center' gap={2}>
              <Typography variant='h5' sx={{ fontWeight: 600 }}>
                Account Item Code Management
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
                  await loadItems()
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

              <Button
                variant='contained'
                startIcon={<AddIcon />}
                onClick={handleAdd}
                sx={{ textTransform: 'none', fontWeight: 500, px: 2.5, height: 36 }}
              >
                Add Item
              </Button>
            </Box>
          }
          sx={{
            pb: 1.5,
            pt: 1.5,
            '& .MuiCardHeader-action': { m: 0, alignItems: 'center' },
            '& .MuiCardHeader-title': { fontWeight: 600, fontSize: '1.125rem' }
          }}
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

        <Box
          sx={{
            mb: 3,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant='body2' color='text.secondary'>
              Show
            </Typography>
            <FormControl size='small' sx={{ width: 140 }}>
              <Select
                value={pagination.pageSize}
                onChange={e => setPagination(p => ({ ...p, pageSize: Number(e.target.value), pageIndex: 0 }))}
              >
                {[5, 10, 25, 50, 100].map(s => (
                  <MenuItem key={s} value={s}>
                    {s} entries
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <DebouncedInput
            value={searchText}
            onChange={v => {
              setSearchText(String(v))
              setPagination(p => ({ ...p, pageIndex: 0 }))
            }}
            placeholder='Search name, item number or description...'
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

            {rows.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={columns.length} className='text-center py-4'>
                    No data available
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody>
                {table.getRowModel().rows.map(row => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </div>

        <TablePaginationComponent totalCount={rowCount} pagination={pagination} setPagination={setPagination} />
      </Card>

      <Drawer
        anchor='right'
        open={drawerOpen}
        onClose={toggleDrawer}
        PaperProps={{ sx: { width: 420, boxShadow: '0px 0px 15px rgba(0,0,0,0.08)' } }}
      >
        <Box sx={{ p: 5, display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Box display='flex' justifyContent='space-between' alignItems='center' mb={3}>
            <Typography variant='h5' fontWeight={600}>
              {isEdit ? 'Edit Item' : 'Add Item'}
            </Typography>
            <IconButton onClick={toggleDrawer} size='small'>
              <CloseIcon />
            </IconButton>
          </Box>
          <Divider sx={{ mb: 3 }} />

          <form onSubmit={handleSubmit} style={{ flexGrow: 1 }}>
            <Grid container spacing={4}>
              <Grid item xs={12}>
                <CustomTextFieldWrapper
                  fullWidth
                  required
                  label='Name'
                  placeholder='Enter name'
                  value={formData.name}
                  inputRef={nameRef}
                  onChange={e => handleFieldChange('name', e.target.value)}
                />
              </Grid>

              <Grid item xs={12}>
                <CustomTextFieldWrapper
                  fullWidth
                  required
                  label='Item Number'
                  placeholder='Enter item number'
                  value={formData.itemNumber}
                  onChange={e => handleFieldChange('itemNumber', e.target.value)}
                />
              </Grid>

              <Grid item xs={12}>
                <CustomTextarea
                  label='Description '
                  placeholder='Enter item details or remarks...'
                  value={formData.description || ''}
                  onChange={e => handleFieldChange('description', e.target.value)}
                  rows={3}
                />
              </Grid>

              {isEdit && (
                <Grid item xs={12}>
                  <CustomSelectField
                    label='Status'
                    value={formData.status}
                    onChange={e => setFormData(p => ({ ...p, status: e.target.value }))}
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
            <strong style={{ color: '#d32f2f' }}>{deleteDialog.row?.name || 'this item'}</strong>?
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

      {/* NO TOASTCONTAINER HERE — keep it in your layout (as in Tax page) */}
    </Box>
  )
}
