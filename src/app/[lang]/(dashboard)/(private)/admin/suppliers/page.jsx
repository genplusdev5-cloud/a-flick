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

import PermissionGuard from '@/components/auth/PermissionGuard'
import { usePermission } from '@/hooks/usePermission'

import { getSupplierList, addSupplier, updateSupplier, getSupplierDetails, deleteSupplier } from '@/api/supplier'

import AddIcon from '@mui/icons-material/Add'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import CloseIcon from '@mui/icons-material/Close'
import PrintIcon from '@mui/icons-material/Print'
import GlobalButton from '@/components/common/GlobalButton'
import DialogCloseButton from '@components/dialogs/DialogCloseButton'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import RefreshIcon from '@mui/icons-material/Refresh'
import CustomTextField from '@core/components/mui/TextField'
import { toast } from 'react-toastify'
import TablePaginationComponent from '@/components/TablePaginationComponent'
import classnames from 'classnames'
import { rankItem } from '@tanstack/match-sorter-utils'
import { showToast } from '@/components/common/Toasts'
import TableChartIcon from '@mui/icons-material/TableChart'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import FileCopyIcon from '@mui/icons-material/FileCopy'
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
const SupplierPageContent = () => {
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

  const [unsavedAddData, setUnsavedAddData] = useState(null)
  const [originalEditData, setOriginalEditData] = useState(null)

  const [formData, setFormData] = useState({
    id: null,
    type: '',
    name: '',
    address: '', // make sure no null here
    status: 'Active'
  })

  const typeRef = useRef(null)
  const nameRef = useRef(null)
  const addressRef = useRef(null)
  const statusRef = useRef(null)

  const supplierTypes = ['Stock', 'Supplier', 'Vehicle', 'Adjustment', 'Opening Stock']

  const clearForm = () => {
    setFormData({
      id: null,
      type: '',
      name: '',
      address: '',
      status: 'Active'
    })
  }

  // Load rows
  const loadData = async () => {
    setLoading(true)
    try {
      const response = await getSupplierList()

      const list = response?.data?.data?.results || []

      const normalizedList = list.map(item => ({
        ...item,
        name: item.name || '',
        type: item.is_pest === '1' ? 'Pest Supplier' : 'General Supplier',
        address: item.billing_address || '', // FIXED
        status: item.is_active === 1 ? 'Active' : 'Inactive'
      }))

      const sorted = normalizedList.sort((a, b) => b.id - a.id)

      const start = pagination.pageIndex * pagination.pageSize
      const end = start + pagination.pageSize
      const paginated = sorted.slice(start, end)

      const finalRows = paginated.map((item, i) => ({
        ...item,
        sno: start + i + 1
      }))

      setRows(finalRows)
      setRowCount(sorted.length)
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
    setIsEdit(false) // add mode

    // Restore previously typed values when reopening Add drawer
    if (unsavedAddData) {
      setFormData(unsavedAddData)
    } else {
      // default empty form
      setFormData({
        id: null,
        type: '',
        name: '',
        address: '',
        status: 'Active'
      })
    }

    setDrawerOpen(true)

    setTimeout(() => typeRef.current?.focus(), 100)
  }

  const handleFieldChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value }

      // Only store cache during ADD mode
      if (!isEdit) {
        setUnsavedAddData(updated)
      }

      return updated
    })
  }

  const handleEdit = async row => {
    setIsEdit(true)
    setLoading(true)

    try {
      const response = await getSupplierDetails(row.id)
      const data = response?.data?.data

      const clean = {
        id: data.id,
        name: data.name || '',
        type: data.is_pest === '1' ? 'Pest Supplier' : 'General Supplier',
        address: data.billing_address || '',
        status: data.is_active === 1 ? 'Active' : 'Inactive',

        business_name: data.business_name || '',
        billing_contact_name: data.billing_contact_name || '',
        billing_email: data.billing_email || '',
        billing_phone: data.billing_phone || '',
        pic_contact_name: data.pic_contact_name || '',
        pic_email: data.pic_email || '',
        pic_phone: data.pic_phone || '',
        postal_code: data.postal_code || '',
        payment_term: data.payment_term || '',
        city: data.city || '',
        state: data.state || '',
        account_details: data.account_details || '',
        short_description: data.short_description || '',
        description: data.description || ''
      }

      // keep original edit values
      setOriginalEditData(clean)

      setFormData(clean)
      setDrawerOpen(true)
    } catch (err) {
      showToast('error', 'Failed to fetch supplier details')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async row => {
    try {
      await deleteSupplier(row.id)
      showToast('delete', `${row.name} deleted`)
      loadData()
    } catch (err) {
      console.error(err)
      showToast('error', 'Failed to delete')
    }
  }

  const confirmDelete = async () => {
    if (deleteDialog.row) await handleDelete(deleteDialog.row)
    setDeleteDialog({ open: false, row: null })
  }

  const handleSubmit = async e => {
    e.preventDefault()

    const payload = {
      name: formData.name,
      business_name: formData.business_name,
      billing_address: formData.address,
      billing_contact_name: formData.billing_contact_name,
      billing_email: formData.billing_email,
      billing_phone: formData.billing_phone,
      pic_contact_name: formData.pic_contact_name,
      pic_email: formData.pic_email,
      pic_phone: formData.pic_phone,
      city: formData.city,
      state: formData.state,
      postal_code: formData.postal_code,
      payment_term: formData.payment_term,
      account_details: formData.account_details,
      description: formData.description,
      short_description: formData.short_description,
      is_pest: formData.type === 'Pest Supplier' ? 1 : 0,
      is_active: formData.status === 'Active' ? 1 : 0,
      status: 1
    }

    try {
      if (isEdit) {
        payload.id = formData.id
        await updateSupplier(payload)
      } else {
        await addSupplier(payload)
        showToast('success', 'Supplier added successfully')
      }

      setDrawerOpen(false) // ✔ Close only
      clearForm() // ✔ Clear only after save
      setUnsavedAddData(null) // 🔥 VERY IMPORTANT
      loadData()
    } catch (err) {
      console.error(err)
      showToast('error', 'Failed to save supplier')
    }
  }

  const handleCancel = () => {
    clearForm()
    setUnsavedAddData(null)
    setOriginalEditData(null)
    setDrawerOpen(false)
  }

  const handleDrawerClose = (event, reason) => {
    if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
      setDrawerOpen(false) // DO NOT CLEAR ADD DATA
      return
    }
    setDrawerOpen(false)
  }

  const handleStatusChange = e => {
    setFormData(prev => ({
      ...prev,
      status: e.target.value
    }))
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
            {canAccess('Suppliers', 'update') && (
              <IconButton size='small' color='primary' onClick={() => handleEdit(info.row.original)}>
                <i className='tabler-edit ' />
              </IconButton>
            )}
            {canAccess('Suppliers', 'delete') && (
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
      columnHelper.accessor('name', { header: 'Supplier Name' }),
      columnHelper.accessor('type', { header: 'Supplier Type' }),
      // columnHelper.accessor('address', { header: 'Billing Address' }),
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
    const headers = ['S.No', 'Supplier Name', 'Type', 'Address', 'Status']
    const csv = [
      headers.join(','),
      ...rows.map(r => [r.sno, `"${r.name}"`, r.type, `"${r.address}"`, r.status].join(','))
    ].join('\n')
    const link = document.createElement('a')
    link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    link.download = 'Suppliers.csv'
    link.click()
    showToast('success', 'CSV downloaded')
  }

  const exportPrint = () => {
    const w = window.open('', '_blank')
    const html = `
      <html><head><title>Supplier List</title><style>
      body{font-family:Arial;padding:24px;}
      table{width:100%;border-collapse:collapse;}
      th,td{border:1px solid #ccc;padding:8px;text-align:left;}
      th{background:#f4f4f4;}
      </style></head><body>
      <h2>Supplier List</h2>
      <table><thead><tr>
      <th>S.No</th><th>Name</th><th>Type</th><th>Address</th><th>Status</th>
      </tr></thead><tbody>
      ${rows
        .map(
          r => `<tr><td>${r.sno}</td><td>${r.name}</td><td>${r.type}</td><td>${r.address}</td><td>${r.status}</td></tr>`
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
    <StickyListLayout
      header={
        <Box sx={{ mb: 2 }}>
          <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 2 }}>
            <Link underline='hover' color='inherit' href='/'>
              Home
            </Link>
            <Typography color='text.primary'>Suppliers</Typography>
          </Breadcrumbs>
        </Box>
      }
    >
      <Card sx={{ display: 'flex', flexDirection: 'column', maxHeight: '100%', minHeight: 0, position: 'relative' }}>
        <CardHeader
          title={
            <Box display='flex' alignItems='center' gap={2}>
              <Typography variant='h5' sx={{ fontWeight: 600 }}>
                Supplier
              </Typography>

              <GlobalButton
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
                  setPagination({ pageIndex: 0, pageSize: pagination.pageSize })
                  await loadData()
                  setTimeout(() => setLoading(false), 800)
                }}
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
                  onClick={() => {
                    setExportAnchorEl(null)
                    exportExcel()
                  }}
                >
                  <TableChartIcon fontSize='small' sx={{ mr: 1 }} /> Excel
                </MenuItem>

                <MenuItem
                  onClick={() => {
                    setExportAnchorEl(null)
                    exportPDF()
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

              {canAccess('Suppliers', 'create') && (
                <GlobalButton startIcon={<AddIcon />} onClick={handleAdd}>
                  Add Supplier
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
                setSearchText(v)
                setPagination(p => ({ ...p, pageIndex: 0 }))
              }}
              placeholder='Search name, type, address...'
              sx={{ width: 360 }}
              variant='outlined'
              size='small'
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
        onClose={handleDrawerClose}
        ModalProps={{ keepMounted: true }}
        SlideProps={{ mountOnEnter: true, unmountOnExit: false }} // 🔥 REAL FIX HERE
      >
        <Box sx={{ p: 5, width: 420 }}>
          <Box display='flex' justifyContent='space-between' alignItems='center' mb={3}>
            <Typography variant='h5' fontWeight={600}>
              {isEdit ? 'Edit Supplier' : 'Add Supplier'}
            </Typography>
            <IconButton onClick={() => setDrawerOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>

          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Autocomplete
                  freeSolo={false}
                  options={supplierTypes}
                  value={formData.type}
                  onChange={(_, v) => setFormData({ ...formData, type: v || '' })}
                  renderInput={params => (
                    <CustomTextField
                      {...params}
                      fullWidth
                      label='Supplier Type'
                      inputRef={typeRef}
                      required
                      sx={{
                        '& .MuiFormLabel-asterisk': {
                          color: '#e91e63 !important',
                          fontWeight: 700
                        },
                        '& .MuiInputLabel-root.Mui-required': {
                          color: 'inherit'
                        }
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          nameRef.current?.focus()
                        }
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <CustomTextField
                  fullWidth
                  label='Supplier Name '
                  value={formData.name}
                  onChange={e => handleFieldChange('name', e.target.value)}
                  inputRef={nameRef}
                  required
                  sx={{
                    '& .MuiFormLabel-asterisk': {
                      color: '#e91e63 !important',
                      fontWeight: 700
                    },
                    '& .MuiInputLabel-root.Mui-required': {
                      color: 'inherit'
                    }
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addressRef.current?.focus()
                    }
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <CustomTextField
                  fullWidth
                  multiline
                  rows={3}
                  label='Billing Address'
                  value={formData.address}
                  onChange={e => handleFieldChange('address', e.target.value)}
                  inputRef={addressRef}
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
              <GlobalButton color='secondary' fullWidth onClick={handleCancel}>
                Cancel
              </GlobalButton>

              <GlobalButton type='submit' variant='contained' fullWidth disabled={loading}>
                {loading ? 'Saving...' : isEdit ? 'Update' : 'Save'}
              </GlobalButton>
            </Box>
          </form>
        </Box>
      </Drawer>

      {/* Delete Confirmation Dialog */}
      <Dialog
        onClose={() => setDeleteDialog({ open: false, row: null })}
        aria-labelledby='delete-supplier-dialog'
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
          id='delete-supplier-dialog'
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
            onClick={() => setDeleteDialog({ open: false, row: null })}
            disableRipple
            sx={{ position: 'absolute', right: 1, top: 1 }}
          >
            <i className='tabler-x' />
          </DialogCloseButton>
        </DialogTitle>

        {/* 🧾 Message */}
        <DialogContent sx={{ px: 5, pt: 1 }}>
          <Typography sx={{ color: 'text.secondary', fontSize: 14, lineHeight: 1.6 }}>
            Are you sure you want to delete supplier{' '}
            <strong style={{ color: '#d32f2f' }}>{deleteDialog.row?.name || 'this supplier'}</strong>
            ?
            <br />
            This action cannot be undone.
          </Typography>
        </DialogContent>

        {/* ⚙️ Buttons */}
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
export default function SupplierPage() {
  return (
    <PermissionGuard permission='Suppliers'>
      <SupplierPageContent />
    </PermissionGuard>
  )
}
