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

const getEmployees = async () => {
  const db = await openDBInstance()
  return db.getAll(STORE_NAME)
}

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
    const res = await getEmployeeList()
    const results = res?.results || []

    console.log('✅ API Full Response:', res)
    console.log('✅ Extracted Results:', results)

    // ✅ Correct mapping — match backend field names
    const formatted = results.map((item, index) => ({
      sno: index + 1,
      id: item.id,
      name: item.name || '-',               // ✅ backend key: name
      email: item.email || '-',             // ✅ backend key: email
      phone: item.phone || '-',             // ✅ backend key: phone
      department: item.department || '-',   // ✅ backend key: department
      designation: item.designation || '-', // ✅ backend key: designation
      user_role: item.user_role || '-',     // ✅ backend key: user_role
      scheduler: item.scheduler || '-',     // ✅ backend key: scheduler
      supervisor: item.supervisor || '-',   // ✅ backend key: supervisor
      vehicle_no: item.vehicle_no || '-',   // ✅ backend key: vehicle_no
      lunch_time: item.lunch_time || '-',   // ✅ backend key: lunch_time
      target_day: item.target_day || '-',   // ✅ backend key: target_day
      target_night: item.target_night || '-', // ✅ backend key: target_night
      target_saturday: item.target_saturday || '-', // ✅ backend key: target_saturday
      description: item.description || '-', // ✅ backend key: description
      is_scheduler: item.is_scheduler === 1 ? 'Yes' : 'No',
      is_sales: item.is_sales === 1 ? 'Yes' : 'No',
      is_technician: item.is_technician === 1 ? 'Yes' : 'No',
      created_on: item.created_on || '-',
      status: item.is_active === 1 ? 'Active' : 'Inactive'
    }))

    console.log('✅ Formatted Data for Table:', formatted)

    setRows(formatted)
    setRowCount(formatted.length)
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
    const handleFocus = () => loadData()
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [pagination.pageIndex, pagination.pageSize, searchText])

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
      columnHelper.accessor('name', { header: 'Full Name' }),
      columnHelper.accessor('email', { header: 'Email' }),
      columnHelper.accessor('phone', { header: 'Phone' }),
      columnHelper.accessor('department', { header: 'Department' }),
      columnHelper.accessor('designation', { header: 'Designation' }),
      columnHelper.accessor('user_role', { header: 'User Role' }),
      columnHelper.accessor('scheduler', { header: 'Scheduler' }),
      columnHelper.accessor('supervisor', { header: 'Supervisor' }),
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
                  await loadData()
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
                disabled={!rows.length}
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
                onClick={() => router.push('/admin/employee-list/add')}
                sx={{ textTransform: 'none', fontWeight: 500, px: 2.5, height: 36 }}
              >
                Add Employee
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
          <Button
            onClick={() => setDeleteDialog({ open: false })}
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
