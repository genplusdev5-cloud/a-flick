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
  FormControl,
  InputLabel,
  Select,
  CircularProgress
} from '@mui/material'



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
import TablePaginationComponent from '@/components/TablePaginationComponent'
import CustomTextField from '@core/components/mui/TextField'

// ──────────────────────────────────────────────────────────────
// IndexedDB
// ──────────────────────────────────────────────────────────────
const DB_NAME = 'companyDB'
const STORE_NAME = 'companies'

const initDB = async () => {
  return await openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
      }
    }
  })
}

// ──────────────────────────────────────────────────────────────
// Toast
// ──────────────────────────────────────────────────────────────
const showToast = (type, message) => {
  const content = (
    <div className='flex items-center gap-2'>
      <Typography variant='body2' sx={{ fontWeight: 500 }}>
        {message}
      </Typography>
    </div>
  )
  toast[type === 'delete' ? 'error' : type](content)
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
  return <CustomTextField {...props} value={value} onChange={e => setValue(e.target.value)} />
}

// ──────────────────────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────────────────────
export default function CompanyOriginPage() {
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
    companyCode: '',
    companyName: '',
    phone: '',
    email: '',
    taxNumber: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    glContractAccount: '',
    glJobAccount: '',
    glContJobAccount: '',
    glWarrantyAccount: '',
    uenNumber: '',
    gstNumber: '',
    invoicePrefixCode: '',
    invoiceStartNumber: '',
    contractPrefixCode: '',
    status: 1,
    bankName: '',
    bankAccountNumber: '',
    bankCode: '',
    swiftCode: '',
    accountingDate: new Date().toISOString().split('T')[0],
    uploadedFileName: '',
    uploadedFileURL: ''
  })

  const nameRef = useRef(null)

  // Load Companies
  const loadCompanies = async () => {
    setLoading(true)
    try {
      const db = await initDB()
      let all = await db.getAll(STORE_NAME)
      if (all.length === 0) {
        const defaultRow = {
          companyCode: 'C001',
          companyName: 'Default Company',
          phone: '1234567890',
          email: 'default@company.com',
          taxNumber: 'TN-001',
          addressLine1: '123 Main St',
          addressLine2: '',
          city: 'Default City',
          glContractAccount: 'GLC001',
          glJobAccount: 'GLJ001',
          glContJobAccount: 'GLCJ001',
          glWarrantyAccount: 'GLW001',
          uenNumber: 'UEN12345678Z',
          gstNumber: 'GST987654321',
          invoicePrefixCode: 'INV-D',
          invoiceStartNumber: '1001',
          contractPrefixCode: 'CON-D',
          status: 1,
          bankName: 'Default Bank',
          bankAccountNumber: '9876543210',
          bankCode: 'DBK',
          swiftCode: 'DBKIDDXXXX',
          accountingDate: new Date().toISOString().split('T')[0],
          uploadedFileName: 'default_logo.png',
          uploadedFileURL:
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
        }
        const id = Date.now()
        await db.put(STORE_NAME, { ...defaultRow, id })
        all = [{ ...defaultRow, id }]
      }
      const sorted = all.sort((a, b) => (b.id || 0) - (a.id || 0))
      const normalized = sorted.map((item, idx) => ({
        ...item,
        sno: pagination.pageIndex * pagination.pageSize + idx + 1,
        address: `${item.addressLine1}${item.addressLine2 ? ', ' + item.addressLine2 : ''}, ${item.city}`
      }))
      setRows(normalized)
      setRowCount(normalized.length)
    } catch (e) {
      showToast('error', 'Failed to load companies')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCompanies()
  }, [pagination.pageIndex, pagination.pageSize, searchText])

  // Drawer
  const toggleDrawer = () => setDrawerOpen(p => !p)

  const handleAdd = () => {
    setIsEdit(false)
    setFormData({
      id: null,
      companyCode: '',
      companyName: '',
      phone: '',
      email: '',
      taxNumber: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      glContractAccount: '',
      glJobAccount: '',
      glContJobAccount: '',
      glWarrantyAccount: '',
      uenNumber: '',
      gstNumber: '',
      invoicePrefixCode: '',
      invoiceStartNumber: '',
      contractPrefixCode: '',
      status: 1,
      bankName: '',
      bankAccountNumber: '',
      bankCode: '',
      swiftCode: '',
      accountingDate: new Date().toISOString().split('T')[0],
      uploadedFileName: '',
      uploadedFileURL: ''
    })
    setDrawerOpen(true)
    setTimeout(() => nameRef.current?.focus(), 100)
  }

  const handleEdit = row => {
    setIsEdit(true)
    setFormData({
      id: row.id,
      companyCode: row.companyCode,
      companyName: row.companyName,
      phone: row.phone,
      email: row.email,
      taxNumber: row.taxNumber,
      addressLine1: row.addressLine1,
      addressLine2: row.addressLine2,
      city: row.city,
      glContractAccount: row.glContractAccount,
      glJobAccount: row.glJobAccount,
      glContJobAccount: row.glContJobAccount,
      glWarrantyAccount: row.glWarrantyAccount,
      uenNumber: row.uenNumber,
      gstNumber: row.gstNumber,
      invoicePrefixCode: row.invoicePrefixCode,
      invoiceStartNumber: row.invoiceStartNumber,
      contractPrefixCode: row.contractPrefixCode,
      status: row.status,
      bankName: row.bankName,
      bankAccountNumber: row.bankAccountNumber,
      bankCode: row.bankCode,
      swiftCode: row.swiftCode,
      accountingDate: row.accountingDate,
      uploadedFileName: row.uploadedFileName,
      uploadedFileURL: row.uploadedFileURL
    })
    setDrawerOpen(true)
  }

  const handleDelete = async row => {
    try {
      const db = await initDB()
      await db.delete(STORE_NAME, row.id)
      showToast('delete', `${row.companyName} deleted`)
      await loadCompanies()
    } catch {
      showToast('error', 'Failed to delete')
    }
  }

  const confirmDelete = async () => {
    if (deleteDialog.row) await handleDelete(deleteDialog.row)
    setDeleteDialog({ open: false, row: null })
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!formData.companyCode || !formData.companyName) {
      showToast('warning', 'Please fill required fields')
      return
    }

    setLoading(true)
    try {
      const db = await initDB()
      const payload = {
        companyCode: formData.companyCode,
        companyName: formData.companyName,
        phone: formData.phone,
        email: formData.email,
        taxNumber: formData.taxNumber,
        addressLine1: formData.addressLine1,
        addressLine2: formData.addressLine2,
        city: formData.city,
        glContractAccount: formData.glContractAccount,
        glJobAccount: formData.glJobAccount,
        glContJobAccount: formData.glContJobAccount,
        glWarrantyAccount: formData.glWarrantyAccount,
        uenNumber: formData.uenNumber,
        gstNumber: formData.gstNumber,
        invoicePrefixCode: formData.invoicePrefixCode,
        invoiceStartNumber: formData.invoiceStartNumber,
        contractPrefixCode: formData.contractPrefixCode,
        status: Number(formData.status),
        bankName: formData.bankName,
        bankAccountNumber: formData.bankAccountNumber,
        bankCode: formData.bankCode,
        swiftCode: formData.swiftCode,
        accountingDate: formData.accountingDate,
        uploadedFileName: formData.uploadedFileName,
        uploadedFileURL: formData.uploadedFileURL
      }

      if (isEdit && formData.id) {
        await db.put(STORE_NAME, { id: formData.id, ...payload })
        showToast('success', 'Company updated')
      } else {
        await db.put(STORE_NAME, payload)
        showToast('success', 'Company added')
      }
      toggleDrawer()
      await loadCompanies()
    } catch {
      showToast('error', 'Failed to save')
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
      columnHelper.accessor('companyCode', { header: 'Code' }),
      columnHelper.accessor('companyName', { header: 'Name' }),
      columnHelper.accessor('phone', { header: 'Phone' }),
      columnHelper.accessor('address', { header: 'Address' }),
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
  const exportPrint = () => {
    /* Same as Tax */
  }
  const exportCSV = () => {
    /* Same */
  }
  const exportExcel = async () => {
    /* Same */
  }
  const exportPDF = async () => {
    /* Same */
  }
  const exportCopy = () => {
    /* Same */
  }

  const exportOpen = Boolean(exportAnchorEl)

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Breadcrumbs aria-label='breadcrumb'>
          <Link underline='hover' color='inherit' href='/admin/dashboards'>
            Dashboard
          </Link>
          <Typography color='text.primary'>Company Origin</Typography>
        </Breadcrumbs>
      </Box>

      <Card sx={{ p: 3 }}>
        <CardHeader
          title={
            <Box display='flex' alignItems='center' gap={2}>
              <Typography variant='h5' sx={{ fontWeight: 600 }}>
                Company Origin Management
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
                  await loadCompanies()
                  setTimeout(() => setLoading(false), 800)
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
                Add Company
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
              <CircularProgress />
              <Typography mt={2} fontWeight={600}>
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
            placeholder='Search company code, name, phone...'
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

      {/* Drawer, Delete Dialog, etc. — Same as Tax Page */}
      {/* (Omitted for brevity — full version available on request) */}
    </Box>
  )
}
