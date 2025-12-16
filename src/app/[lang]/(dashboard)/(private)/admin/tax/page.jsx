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

import GlobalTextField from '@/components/common/GlobalTextField'
import GlobalTextarea from '@/components/common/GlobalTextarea'
import GlobalSelect from '@/components/common/GlobalSelect'
import GlobalAutocomplete from '@/components/common/GlobalAutocomplete'
import GlobalDateRange from '@/components/common/GlobalDateRange'
import GlobalButton from '@/components/common/GlobalButton'

//import custom
import CustomTextFieldWrapper from '@/components/common/CustomTextField'
import CustomTextarea from '@/components/common/CustomTextarea'
import CustomSelectField from '@/components/common/CustomSelectField'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'

import classnames from 'classnames'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper
} from '@tanstack/react-table'
import { rankItem } from '@tanstack/match-sorter-utils'
import styles from '@core/styles/table.module.css'
import ChevronRight from '@menu/svg/ChevronRight'

import { toast } from 'react-toastify'
import { showToast } from '@/components/common/Toasts'
import TablePaginationComponent from '@/components/TablePaginationComponent'

// ✅ Paste your API imports here 👇
import { addTax, getTaxList, updateTax, deleteTax } from '@/api/tax'

// ✅ Utility to format numbers
const formatTax = v => {
  const n = parseFloat(v)
  return isNaN(n) ? '' : n.toFixed(2)
}

// ──────────────────────────────────────────────────────────────
// Debounced Input
// ──────────────────────────────────────────────────────────────
const DebouncedInput = ({ value: initialValue, onChange, debounce = 500, ...props }) => {
  const [value, setValue] = useState(initialValue)
  useEffect(() => setValue(initialValue), [initialValue])
  useEffect(() => {
    const t = setTimeout(() => onChange(value), debounce)
    return () => clearTimeout(t)
  }, [value])
  return <TextField {...props} value={value} onChange={e => setValue(e.target.value)} />
}

// ──────────────────────────────────────────────────────────────
import PermissionGuard from '@/components/auth/PermissionGuard'
import { usePermission } from '@/hooks/usePermission'

// ──────────────────────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────────────────────
const TaxPageContent = () => {
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

  const [originalData, setOriginalData] = useState(null) // for validation

  const [formData, setFormData] = useState({
    id: null,
    name: '',
    tax_value: '',
    status: 1
  })

  const filteredRows = useMemo(() => {
    if (!searchText) return rows

    return rows.filter(
      r => r.name?.toLowerCase().includes(searchText.toLowerCase()) || String(r.tax).includes(searchText)
    )
  }, [rows, searchText])

  const paginatedRows = useMemo(() => {
    const start = pagination.pageIndex * pagination.pageSize
    const end = start + pagination.pageSize
    return filteredRows.slice(start, end)
  }, [filteredRows, pagination])

  const nameRef = useRef(null)

  const loadTaxes = async () => {
    setLoading(true)
    try {
      const res = await getTaxList()
      console.log('🧾 TAX LIST RAW RESPONSE:', res)

      // ✅ Handle nested response correctly
      const data = res?.data?.results || res?.data?.data?.results || res?.results || []

      if (!Array.isArray(data)) {
        showToast('error', 'Invalid response format')
        return
      }

      const normalized = data.map((item, index) => ({
        sno: index + 1,
        id: item.id,
        name: item.name,
        tax: Number(item.percent ?? 0),
        description: item.description ?? '',
        is_active: item.is_active ?? 1 // idhu mattum use pannu
        // status: item.status remove pannu or ignore pannu
      }))

      setRows(normalized)
      setRowCount(normalized.length)
    } catch (err) {
      console.error('❌ TAX LIST ERROR:', err.response?.data || err.message)
      showToast('error', err.response?.data?.message || 'Failed to load taxes')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({ id: null, name: '', tax_value: '', description: '', status: 1 })
    setUnsavedAddData(null) // clear cached data
    setDrawerOpen(false)
  }

  useEffect(() => {
    loadTaxes()
  }, [pagination.pageIndex, pagination.pageSize, searchText])

  // Drawer
  const toggleDrawer = () => setDrawerOpen(p => !p)

  const handleAdd = () => {
    setIsEdit(false)

    // reopen – restore unsaved data
    if (unsavedAddData) {
      setFormData(unsavedAddData)
    } else {
      setFormData({ id: null, name: '', tax_value: '', description: '', status: 1 })
    }

    setDrawerOpen(true)
    setTimeout(() => nameRef.current?.focus(), 100)
  }
  const handleFieldChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value }

      // only cache for Add, not Edit
      if (!isEdit) {
        setUnsavedAddData(updated)
      }

      return updated
    })
  }

  const handleEdit = row => {
    setIsEdit(true)
    setFormData({
      id: row.id,
      name: row.name,
      tax_value: row.tax,
      description: row.description,
      status: row.is_active // idhu correct dhaan
    })

    setDrawerOpen(true)
  }

  const handleDelete = async row => {
    try {
      const db = await initDB()
      await db.delete(STORE_NAME, row.id)
      showToast('delete', `${row.name} deleted`)
      await loadTaxes()
    } catch {
      showToast('error', 'Failed to delete')
    }
  }

  const confirmDelete = async () => {
    if (!deleteDialog.row) return
    try {
      const res = await deleteTax(deleteDialog.row.id)
      if (res.status === 'success') {
        showToast('delete', `${deleteDialog.row.name} deleted`)
        await loadTaxes()
      } else {
        showToast('error', res.message || 'Failed to delete tax')
      }
    } catch (err) {
      console.error('❌ DELETE ERROR:', err.response?.data || err.message)
      showToast('error', err.response?.data?.message || 'Delete failed')
    } finally {
      setDeleteDialog({ open: false, row: null })
    }
  }

  const handleSubmit = async e => {
    e.preventDefault()

    // 🔥 Duplicate validation (SAFE here)
    const duplicate = rows.find(
      r =>
        r.name.trim().toLowerCase() === formData.name.trim().toLowerCase() &&
        Number(r.tax) === Number(formData.tax_value)
    )

    if (!isEdit && duplicate) {
      showToast('warning', 'This tax already exists')
      return
    }

    // Required validation
    if (!formData.name || !formData.tax_value) {
      showToast('warning', 'Please fill all fields')
      return
    }

    setLoading(true)

    try {
      const payload = {
        id: formData.id,
        name: formData.name.trim(),
        percent: Number(formData.tax_value),
        description: formData.description?.trim() || '',
        status: Number(formData.status), // ADD THIS
        is_active: Number(formData.status) // KEEP THIS
      }

      let res
      if (isEdit) {
        res = await updateTax(payload)
      } else {
        res = await addTax(payload)
      }

      if (res.status === 'success') {
        showToast('success', isEdit ? 'Tax updated successfully' : 'Tax added successfully')

        setUnsavedAddData(null)
        setOriginalData(null)
        setDrawerOpen(false)

        setRows([]) // 👈 CLEAR OLD DATA
        setRowCount(0) // 👈 RESET COUNT

        await loadTaxes() // 👈 RELOAD FRESH
      }
    } catch (err) {
      console.error('❌ TAX SAVE ERROR:', err.response?.data || err.message)
      showToast('error', err.response?.data?.message || 'Error saving tax')
    } finally {
      setLoading(false)
    }
  }

  // Table
  const columnHelper = createColumnHelper()

  const columns = useMemo(
    () => [
      columnHelper.accessor('sno', { header: 'S.No' }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: info => (
          <Box sx={{ display: 'flex', gap: 1 }}>
            {canAccess('Tax', 'update') && (
              <IconButton size='small' color='primary' onClick={() => handleEdit(info.row.original)}>
                <i className='tabler-edit ' />
              </IconButton>
            )}
            {canAccess('Tax', 'delete') && (
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
      columnHelper.accessor('name', { header: 'Tax Name' }),
      columnHelper.accessor('tax', { header: 'Tax (%)' }),
      columnHelper.accessor('is_active', {
        // <-- status illa, is_active
        header: 'Status',
        cell: info => {
          const val = info.row.original.is_active // <-- idhuvum change pannu
          return (
            <Chip
              label={val == 1 ? 'Active' : 'Inactive'}
              size='small'
              sx={{
                color: '#fff',
                bgcolor: val == 1 ? 'success.main' : 'error.main',
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
    data: paginatedRows,
    columns,
    manualPagination: true,
    pageCount: Math.ceil(filteredRows.length / pagination.pageSize),

    state: { globalFilter: searchText, pagination },
    onGlobalFilterChange: setSearchText,
    onPaginationChange: setPagination,

    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel()
  })

  // Export
  const exportOpen = Boolean(exportAnchorEl)

  const exportPrint = () => {
    const w = window.open('', '_blank')
    const html = `
      <html><head><title>Tax List</title><style>
        body{font-family:Arial;padding:24px;}
        table{width:100%;border-collapse:collapse;}
        th,td{border:1px solid #ccc;padding:8px;text-align:left;}
        th{background:#f4f4f4;}
      </style></head><body>
      <h2>Tax List</h2>
      <table><thead><tr>
        <th>S.No</th><th>Tax Name</th><th>Tax (%)</th><th>Status</th>
      </tr></thead><tbody>
      ${rows
        .map(
          r =>
            `<tr><td>${r.sno}</td><td>${r.name}</td><td>${r.tax}</td><td>${r.is_active === 1 ? 'Active' : 'Inactive'
            }</td></tr>`
        )
        .join('')}
      </tbody></table></body></html>`
    w?.document.write(html)
    w?.document.close()
    w?.print()
  }

  const exportCSV = () => {
    const headers = ['S.No', 'Tax Name', 'Tax (%)', 'Status']
    const csv = [
      headers.join(','),
      ...rows.map(r => [r.sno, r.name, r.tax, r.is_active === 1 ? 'Active' : 'Inactive'].join(','))
    ].join('\n')
    const link = document.createElement('a')
    link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    link.download = 'Tax_List.csv'
    link.click()
    showToast('success', 'CSV downloaded')
  }

  const exportExcel = async () => {
    const XLSX = await import('xlsx')
    const ws = XLSX.utils.json_to_sheet(
      rows.map(r => ({
        'S.No': r.sno,
        'Tax Name': r.name,
        'Tax (%)': r.tax,
        Status: r.is_active === 1 ? 'Active' : 'Inactive'
      }))
    )
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Taxes')
    XLSX.writeFile(wb, 'Tax_List.xlsx')
    showToast('success', 'Excel downloaded')
  }

  const exportPDF = async () => {
    const { jsPDF } = await import('jspdf')
    const autoTable = (await import('jspdf-autotable')).default
    const doc = new jsPDF()
    doc.text('Tax List', 14, 15)
    autoTable(doc, {
      startY: 25,
      head: [['S.No', 'Tax Name', 'Tax (%)', 'Status']],
      body: rows.map(r => [r.sno, r.name, r.tax, r.is_active === 1 ? 'Active' : 'Inactive'])
    })
    doc.save('Tax_List.pdf')
    showToast('success', 'PDF exported')
  }

  const exportCopy = () => {
    const text = rows
      .map(r => `${r.sno}. ${r.name} | ${r.tax}% | ${r.is_active === 1 ? 'Active' : 'Inactive'}`)
      .join('\n')
    navigator.clipboard.writeText(text)
    showToast('info', 'Copied to clipboard')
  }

  return (
    <PermissionGuard permission="Tax">
      <Box>
        <Box sx={{ mb: 2 }}>
          <Breadcrumbs aria-label='breadcrumb'>
            <Link underline='hover' color='inherit' href='/'>
              Home
            </Link>
            <Typography color='text.primary'>Tax</Typography>
          </Breadcrumbs>
        </Box>

        <Card sx={{ p: 3 }}>
          <CardHeader
            title={
              <Box display='flex' alignItems='center' gap={2}>
                <Typography variant='h5' sx={{ fontWeight: 600 }}>
                  Tax
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
                    setPagination({ pageIndex: 0, pageSize: 25 })
                    await loadTaxes()
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

                {canAccess('Tax', 'create') && (
                  <GlobalButton startIcon={<AddIcon />} onClick={handleAdd}>
                    Add Tax
                  </GlobalButton>
                )}
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
              <ProgressCircularCustomization size={60} thickness={5} />
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
                  onChange={e => setPagination(p => ({ ...p, pageSize: Number(e.target.value) }))}
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
              onChange={v => setSearchText(String(v))}
              placeholder='Search tax name or value...'
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
              {paginatedRows.length === 0 ? (
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

          <TablePaginationComponent
            totalCount={filteredRows.length}
            pagination={pagination}
            setPagination={setPagination}
          />
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
                {isEdit ? 'Edit Tax' : 'Add Tax'}
              </Typography>
              <IconButton onClick={toggleDrawer} size='small'>
                <CloseIcon />
              </IconButton>
            </Box>
            <Divider sx={{ mb: 3 }} />

            <form onSubmit={handleSubmit} style={{ flexGrow: 1 }}>
              <Grid container spacing={4}>
                <Grid item xs={12}>
                  <GlobalTextField
                    label='Tax Name'
                    placeholder='Enter tax name'
                    value={formData.name}
                    inputRef={nameRef}
                    required
                    onChange={e => handleFieldChange('name', e.target.value)}
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
                </Grid>

                <Grid item xs={12}>
                  <GlobalTextField
                    label='Tax Value (%)'
                    placeholder='e.g. 5.00'
                    value={formData.tax_value}
                    required
                    onChange={e => handleFieldChange('tax_value', e.target.value.replace(/[^0-9.]/g, ''))}
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
                </Grid>

                <Grid item xs={12}>
                  <GlobalTextarea
                    label='Description'
                    placeholder='Enter additional details...'
                    rows={3}
                    value={formData.description}
                    onChange={e => handleFieldChange('description', e.target.value)}
                  />
                </Grid>

                {isEdit && (
                  <Grid item xs={12}>
                    <GlobalSelect
                      label='Status'
                      value={formData.status === 1 ? 'Active' : 'Inactive'}
                      onChange={e =>
                        setFormData(p => ({
                          ...p,
                          status: e.target.value === 'Active' ? 1 : 0
                        }))
                      }
                    />
                  </Grid>
                )}
              </Grid>

              <Box mt={4} display='flex' gap={2}>
                <GlobalButton color='secondary' fullWidth onClick={handleCancel} disabled={loading}>
                  Cancel
                </GlobalButton>

                <GlobalButton type='submit' fullWidth disabled={loading}>
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
            <DialogCloseButton onClick={() => setDeleteDialog({ open: false, row: null })} disableRipple>
              <i className='tabler-x' />
            </DialogCloseButton>
          </DialogTitle>

          {/* Centered text */}
          <DialogContent sx={{ px: 5, pt: 1 }}>
            <Typography sx={{ color: 'text.secondary', fontSize: 14, lineHeight: 1.6 }}>
              Are you sure you want to delete{' '}
              <strong style={{ color: '#d32f2f' }}>{deleteDialog.row?.name || 'this tax'}</strong>?
              <br />
              This action cannot be undone.
            </Typography>
          </DialogContent>

          {/* Centered buttons */}
          <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 3, pt: 2 }}>
            <GlobalButton color='secondary' onClick={() => setDeleteDialog({ open: false, row: null })}>
              Cancel
            </GlobalButton>
            <GlobalButton
              onClick={confirmDelete}
              variant='contained'
              color='error'
              disabled={loading}
            >
              {loading ? 'Deleting...' : 'Delete'}
            </GlobalButton>
          </DialogActions>
        </Dialog>
      </Box>
    </PermissionGuard>
  )
}

export default TaxPageContent
