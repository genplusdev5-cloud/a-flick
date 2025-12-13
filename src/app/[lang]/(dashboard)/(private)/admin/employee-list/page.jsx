'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Breadcrumbs,
  Chip,
  TextField,
  FormControl,
  Select,
  CircularProgress,
  InputAdornment
} from '@mui/material'

import { getEmployeeList, addEmployee, updateEmployee, deleteEmployee, getEmployeeDetails } from '@/api/employee'

// 🔥 Global UI Components (use everywhere)
import GlobalButton from '@/components/common/GlobalButton'
import GlobalTextField from '@/components/common/GlobalTextField'
import GlobalTextarea from '@/components/common/GlobalTextarea'
import GlobalSelect from '@/components/common/GlobalSelect'
import GlobalAutocomplete from '@/components/common/GlobalAutocomplete'

import TableChartIcon from '@mui/icons-material/TableChart'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import FileCopyIcon from '@mui/icons-material/FileCopy'

import { showToast } from '@/components/common/Toasts'
import { encryptId } from '@/utils/encryption'
import DialogCloseButton from '@components/dialogs/DialogCloseButton'
import ProgressCircularCustomization from '@/components/common/ProgressCircularCustomization'
import AddIcon from '@mui/icons-material/Add'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import PrintIcon from '@mui/icons-material/Print'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import RefreshIcon from '@mui/icons-material/Refresh'
import SearchIcon from '@mui/icons-material/Search'
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

const getEmployees = async () => {
  const db = await openDBInstance()
  return db.getAll(STORE_NAME)
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
export default function EmployeePage() {
  const router = useRouter()
  const [rows, setRows] = useState([])
  const [rowCount, setRowCount] = useState(0)
  const [searchText, setSearchText] = useState('')
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 })
  const [loading, setLoading] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, row: null })
  const [exportAnchorEl, setExportAnchorEl] = useState(null)

  const loadData = async () => {
    setLoading(true)
    try {
      // ✅ API returns { message, status, count, data: { results: [...] } }
      const res = await getEmployeeList(
        pagination.pageSize,
        pagination.pageIndex + 1, // page number
        searchText
      )

      const results = res?.results || []

      console.log('✅ API Full Response:', res)
      console.log('✅ Extracted Results:', results)

      // ✅ Correct mapping — match backend field names
      const formatted = results.map((item, index) => ({
        sno: pagination.pageIndex * pagination.pageSize + index + 1, // <-- FIXED
        id: item.id,

        name: item.name ?? '-',
        email: item.email ?? '-',
        phone: item.phone ?? '-',

        department: item.department ?? item.department_name ?? '-',
        designation: item.designation ?? item.designation_name ?? '-',
        user_role: item.user_role ?? item.user_role_name ?? '-',
        supervisor: item.supervisor ?? item.supervisor_name ?? '-',
        scheduler: item.scheduler ?? item.scheduler_name ?? '-',

        vehicle_no: item.vehicle_no ?? '-',
        lunch_time: item.lunch_time ?? '-',
        target_day: item.target_day ?? '-',
        target_night: item.target_night ?? '-',
        target_saturday: item.target_saturday ?? '-',
        description: item.description ?? '-',

        finger_print_id: item.finger_print_id ?? '-',
        employee_code: item.employee_code ?? '-',
        nationality: item.nationality ?? '-',

        is_supervisor: item.is_supervisor ? 'Yes' : 'No',
        is_foreigner: item.is_foreigner ? 'Yes' : 'No',
        is_gps: item.is_gps ? 'Yes' : 'No',
        is_photo: item.is_photo ? 'Yes' : 'No',
        is_qr: item.is_qr ? 'Yes' : 'No',
        is_sign: item.is_sign ? 'Yes' : 'No',

        is_scheduler: item.is_scheduler ? 'Yes' : 'No',
        is_sales: item.is_sales ? 'Yes' : 'No',
        is_technician: item.is_technician ? 'Yes' : 'No',

        status: item.is_active ? 'Active' : 'Inactive'
      }))

      console.log('✅ Formatted Data for Table:', formatted)

      setRows(formatted)
      setRowCount(res.count) // ✔ backend count — correct pagination
    } catch (error) {
      console.error('❌ Employee List Error:', error)
      showToast('error', 'Failed to load employees')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // ✅ Auto refresh after adding new employee
    if (sessionStorage.getItem('reloadAfterAdd') === 'true') {
      loadData()
      sessionStorage.removeItem('reloadAfterAdd')
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [pagination.pageIndex, pagination.pageSize, searchText])

  useEffect(() => {
    const handleFocus = () => loadData()
    window.addEventListener('focus', handleFocus)

    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  const handleEdit = id => {
    const encodedId = encryptId(id)
    router.push(`/en/admin/employee-list/edit?id=${encodedId}`)
  }
  const confirmDelete = async () => {
    if (deleteDialog.row) {
      try {
        const res = await deleteEmployee(deleteDialog.row.id)

        if (res?.status === 'success') {
          showToast('delete', `Employee ${deleteDialog.row.name} deleted successfully`)
          await loadData() // refresh list
        } else {
          showToast('error', res?.message || 'Failed to delete employee')
        }
      } catch (error) {
        console.error('❌ Delete Employee Error:', error)
        showToast('error', error.response?.data?.message || 'Something went wrong')
      } finally {
        setDeleteDialog({ open: false, row: null })
      }
    }
  }

  // --- Table Columns ---
  const columnHelper = createColumnHelper()
  const columns = useMemo(
    () => [
      columnHelper.accessor('sno', { header: 'S.No' }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: info => (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton size='small' color='primary' onClick={() => handleEdit(info.row.original.id)}>
              <i className='tabler-edit' />
            </IconButton>
            <IconButton
              size='small'
              color='error'
              onClick={() => setDeleteDialog({ open: true, row: info.row.original })}
            >
              <i className='tabler-trash text-red-600 text-lg' />
            </IconButton>
          </Box>
        )
      }),
      columnHelper.accessor('name', { header: 'Full Name' }),
      columnHelper.accessor('email', { header: 'Email' }),
      columnHelper.accessor('phone', { header: 'Phone' }),
      columnHelper.accessor('department', { header: 'Department' }),
      columnHelper.accessor('designation', { header: 'Designation' }),
      columnHelper.accessor('user_role', { header: 'User Role' }),
      columnHelper.accessor('scheduler', { header: 'Scheduler' }),
      columnHelper.accessor('supervisor', { header: 'Supervisor' }),
      columnHelper.accessor('finger_print_id', { header: 'Fingerprint ID' }),
      columnHelper.accessor('employee_code', { header: 'Employee Code' }),
      columnHelper.accessor('nationality', { header: 'Nationality' }),
      columnHelper.accessor('vehicle_no', { header: 'Vehicle No' }),
      columnHelper.accessor('lunch_time', { header: 'Lunch Time' }),
      columnHelper.accessor('target_day', { header: 'Target Day' }),
      columnHelper.accessor('target_night', { header: 'Target Night' }),
      columnHelper.accessor('target_saturday', { header: 'Target Saturday' }),
      columnHelper.accessor('description', { header: 'Description' }),
      columnHelper.accessor('is_scheduler', {
        header: 'Scheduler',
        cell: info => (
          <Chip
            label={info.getValue()}
            size='small'
            sx={{
              color: '#fff',
              bgcolor: info.getValue() === 'Yes' ? 'success.main' : 'error.main',
              fontWeight: 600,
              borderRadius: '6px'
            }}
          />
        )
      }),
      columnHelper.accessor('is_sales', {
        header: 'Sales',
        cell: info => (
          <Chip
            label={info.getValue()}
            size='small'
            sx={{
              color: '#fff',
              bgcolor: info.getValue() === 'Yes' ? 'success.main' : 'error.main',
              fontWeight: 600,
              borderRadius: '6px'
            }}
          />
        )
      }),
      columnHelper.accessor('is_technician', {
        header: 'Technician',
        cell: info => (
          <Chip
            label={info.getValue()}
            size='small'
            sx={{
              color: '#fff',
              bgcolor: info.getValue() === 'Yes' ? 'success.main' : 'error.main',
              fontWeight: 600,
              borderRadius: '6px'
            }}
          />
        )
      }),

      columnHelper.accessor('is_supervisor', {
        header: 'Supervisor Flag',
        cell: info => (
          <Chip
            label={info.getValue()}
            size='small'
            sx={{
              color: '#fff',
              bgcolor: info.getValue() === 'Yes' ? 'success.main' : 'error.main',
              fontWeight: 600,
              borderRadius: '6px'
            }}
          />
        )
      }),

      columnHelper.accessor('is_foreigner', {
        header: 'Foreigner',
        cell: info => (
          <Chip
            label={info.getValue()}
            size='small'
            sx={{
              color: '#fff',
              bgcolor: info.getValue() === 'Yes' ? 'success.main' : 'error.main',
              fontWeight: 600,
              borderRadius: '6px'
            }}
          />
        )
      }),

      columnHelper.accessor('is_gps', {
        header: 'GPS',
        cell: info => (
          <Chip
            label={info.getValue()}
            size='small'
            sx={{
              color: '#fff',
              bgcolor: info.getValue() === 'Yes' ? 'success.main' : 'error.main',
              fontWeight: 600,
              borderRadius: '6px'
            }}
          />
        )
      }),

      columnHelper.accessor('is_photo', {
        header: 'Photo',
        cell: info => (
          <Chip
            label={info.getValue()}
            size='small'
            sx={{
              color: '#fff',
              bgcolor: info.getValue() === 'Yes' ? 'success.main' : 'error.main',
              fontWeight: 600,
              borderRadius: '6px'
            }}
          />
        )
      }),

      columnHelper.accessor('is_qr', {
        header: 'QR',
        cell: info => (
          <Chip
            label={info.getValue()}
            size='small'
            sx={{
              color: '#fff',
              bgcolor: info.getValue() === 'Yes' ? 'success.main' : 'error.main',
              fontWeight: 600,
              borderRadius: '6px'
            }}
          />
        )
      }),

      columnHelper.accessor('is_sign', {
        header: 'Sign',
        cell: info => (
          <Chip
            label={info.getValue()}
            size='small'
            sx={{
              color: '#fff',
              bgcolor: info.getValue() === 'Yes' ? 'success.main' : 'error.main',
              fontWeight: 600,
              borderRadius: '6px'
            }}
          />
        )
      }),

      // ✅ Status same as your old setup
      columnHelper.accessor('status', {
        header: 'Status',
        cell: info => {
          const status = info.getValue() || 'Active'
          return (
            <Chip
              label={status}
              size='small'
              sx={{
                color: '#fff',
                bgcolor: status === 'Active' ? 'success.main' : 'error.main',
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
    pageCount: Math.ceil(rowCount / pagination.pageSize),
    state: { globalFilter: searchText, pagination },
    onGlobalFilterChange: setSearchText,
    onPaginationChange: setPagination,
    globalFilterFn: fuzzyFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel()
  })

  // --- Export ---
  const exportOpen = Boolean(exportAnchorEl)
  const exportCSV = () => {
    const headers = ['S.No', 'Name', 'Email', 'Phone', 'Department', 'Supervisor', 'Status']
    const csv = [
      headers.join(','),
      ...rows.map(r =>
        [r.sno, `"${r.name}"`, r.email, r.phone, `"${r.department}"`, `"${r.supervisor}"`, r.status].join(',')
      )
    ].join('\n')

    const link = document.createElement('a')
    link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    link.download = 'employees.csv'
    link.click()
    showToast('success', 'CSV downloaded')
  }

  const exportPrint = () => {
    const w = window.open('', '_blank')
    const html = `
      <html><head><title>Employee List</title><style>
      body{font-family:Arial;padding:24px;}
      table{width:100%;border-collapse:collapse;}
      th,td{border:1px solid #ccc;padding:8px;text-align:left;}
      th{background:#f4f4f4;}
      </style></head><body>
      <h2>Employee List</h2>
      <table><thead><tr>
      <th>S.No</th><th>Name</th><th>Email</th><th>Phone</th><th>Department</th><th>Supervisor</th><th>Status</th>
      </tr></thead><tbody>
      ${rows
        .map(
          r => `<tr>
        <td>${r.sno}</td>
        <td>${r.name}</td>
        <td>${r.email}</td>
        <td>${r.phone}</td>
        <td>${r.department}</td>
        <td>${r.supervisor}</td>
        <td>${r.status}</td>
      </tr>`
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
        <Link underline='hover' color='inherit' href='/admin/dashboards'>
          Dashboard
        </Link>
        <Typography color='text.primary'>Employee</Typography>
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
                Employee List
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
                  setPagination(p => ({ ...p, pageIndex: 0 })) // Reset to page 1
                  await loadData()
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
                disabled={!rows.length}
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

              <GlobalButton
                variant='contained'
                startIcon={<AddIcon />}
                onClick={() => router.push('/admin/employee-list/add')}
                sx={{ textTransform: 'none', fontWeight: 500, px: 2.5, height: 36 }}
              >
                Add Employee
              </GlobalButton>
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

        <Divider sx={{ mb: 2 }} />

        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <FormControl size='small' sx={{ width: 140 }}>
            <Select
              value={pagination.pageSize}
              onChange={e => setPagination(p => ({ ...p, pageSize: Number(e.target.value), pageIndex: 0 }))}
            >
              {[10, 25, 50, 100].map(s => (
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
            placeholder='Search name, email, phone, department...'
            sx={{ width: 420 }}
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
                    {loading ? 'Loading employees...' : 'No results found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <TablePaginationComponent totalCount={rowCount} pagination={pagination} setPagination={setPagination} />
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false })}
        PaperProps={{ sx: { overflow: 'visible', width: 420, borderRadius: 1, textAlign: 'center' } }}
      >
        <DialogTitle
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
            onClick={() => setDeleteDialog({ open: false })}
            disableRipple
            sx={{ position: 'absolute', right: 1, top: 1 }}
          >
            <i className='tabler-x' />
          </DialogCloseButton>
        </DialogTitle>
        <DialogContent sx={{ px: 5, pt: 1 }}>
          <Typography sx={{ color: 'text.secondary', fontSize: 14, lineHeight: 1.6 }}>
            Are you sure you want to delete employee{' '}
            <strong style={{ color: '#d32f2f' }}>{deleteDialog.row?.name}</strong>?
            <br />
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 3, pt: 2 }}>
          <GlobalButton
            onClick={() => setDeleteDialog({ open: false })}
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
