'use client'

import { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
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

import { getEmployeeList, deleteEmployee } from '@/api/employee'

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
import { loadRowOrder, saveRowOrder } from '@/utils/tableUtils'
import StickyListLayout from '@/components/common/StickyListLayout'
import StickyTableWrapper from '@/components/common/StickyTableWrapper'
import EmployeeFormDialog from './EmployeeFormDialog'

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

import PermissionGuard from '@/components/auth/PermissionGuard'
import { usePermission } from '@/hooks/usePermission'

const departmentOptions = [
  { id: 'hr', label: 'HR' },
  { id: 'sales', label: 'Sales' },
  { id: 'tech', label: 'Technical' },
  { id: 'accounts', label: 'Accounts' }
]

const designationOptions = [
  { id: 'manager', label: 'Manager' },
  { id: 'executive', label: 'Executive' },
  { id: 'technician', label: 'Technician' }
]

const userRoleOptions = [
  { id: 'admin', label: 'Admin' },
  { id: 'employee', label: 'Employee' },
  { id: 'supervisor', label: 'Supervisor' }
]

const supervisorOptions = [
  { id: 1, label: 'Ravi' },
  { id: 2, label: 'Kumar' },
  { id: 3, label: 'John' }
]

// ───────────────────────────────────────────
// Component
// ───────────────────────────────────────────
// ───────────────────────────────────────────
// Component
// ───────────────────────────────────────────
const EmployeePageContent = () => {
  const { canAccess } = usePermission()
  const searchParams = useSearchParams()

  const [department, setDepartment] = useState(null)
  const [designation, setDesignation] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [supervisor, setSupervisor] = useState(null)

  // Initialize pagination from URL search params
  const initialPageIndex = searchParams.get('pageIndex') ? Number(searchParams.get('pageIndex')) : 0
  const initialPageSize = searchParams.get('pageSize') ? Number(searchParams.get('pageSize')) : 25

  const [rows, setRows] = useState([])
  const [rowCount, setRowCount] = useState(0)
  const [searchText, setSearchText] = useState('')
  const [pagination, setPagination] = useState({ pageIndex: initialPageIndex, pageSize: initialPageSize })
  const [loading, setLoading] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, row: null })
  const [exportAnchorEl, setExportAnchorEl] = useState(null)

  const [openEmployeeDialog, setOpenEmployeeDialog] = useState(false)
  const [dialogMode, setDialogMode] = useState('add')
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      // ✅ API returns { message, status, count, data: { results: [...] } }
      const res = await getEmployeeList(pagination.pageSize, pagination.pageIndex + 1, searchText, {
        department: department?.id,
        designation: designation?.id,
        user_role: userRole?.id,
        supervisor: supervisor?.id
      })

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

      setRowCount(res.count) // ✔ backend count — correct pagination

      // Restore order if exists
      const savedOrder = loadRowOrder('employee-list')
      if (savedOrder && savedOrder.length > 0) {
        const sorted = [...formatted].sort((a, b) => {
          const idxA = savedOrder.indexOf(a.id)
          const idxB = savedOrder.indexOf(b.id)
          if (idxA === -1 && idxB === -1) return 0
          if (idxA === -1) return 1
          if (idxB === -1) return -1
          return idxA - idxB
        })
        setRows(sorted)
      } else {
        setRows(formatted)
      }
    } catch (error) {
      console.error('❌ Employee List Error:', error)
      showToast('error', 'Failed to load employees')
    } finally {
      setLoading(false)
    }
  }, [pagination.pageIndex, pagination.pageSize, searchText, department, designation, userRole, supervisor])

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

  const handleEdit = id => {
    setDialogMode('edit')
    setSelectedEmployeeId(id)
    setOpenEmployeeDialog(true)
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
            {canAccess('Employee List', 'update') && (
              <IconButton size='small' color='primary' onClick={() => handleEdit(info.row.original.id)}>
                <i className='tabler-edit' />
              </IconButton>
            )}
            {canAccess('Employee List', 'delete') && (
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
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
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
    <StickyListLayout
      header={
        <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 2 }}>
          <Link underline='hover' color='inherit' href='/admin/dashboards'>
            Dashboard
          </Link>
          <Typography color='text.primary'>Employee</Typography>
        </Breadcrumbs>
      }
    >
      <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
        <CardHeader
          title={
            <Box display='flex' alignItems='center' gap={2}>
              <Typography variant='h5' fontWeight={600}>
                Employee List
              </Typography>
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

              {canAccess('Employee List', 'create') && (
                <GlobalButton
                  variant='contained'
                  startIcon={<AddIcon />}
                  onClick={() => {
                    setDialogMode('add')
                    setSelectedEmployeeId(null)
                    setOpenEmployeeDialog(true)
                  }}
                  sx={{ textTransform: 'none', fontWeight: 500, px: 2.5, height: 36 }}
                >
                  Add Employee
                </GlobalButton>
              )}
            </Box>
          }
        />

        <Divider />

        <Box
          sx={{
            px: 4,
            py: 2,
            display: 'flex',
            gap: 2,
            flexWrap: 'wrap',
            alignItems: 'center',
            borderBottom: '1px solid',
            borderColor: 'divider'
          }}
        >
          {/* Department */}
          <GlobalAutocomplete
            size='small'
            sx={{ width: 220 }}
            placeholder='Department'
            options={departmentOptions}
            value={department}
            onChange={(_, value) => {
              setDepartment(value)
              setPagination(p => ({ ...p, pageIndex: 0 }))
            }}
          />

          {/* Designation */}
          <GlobalAutocomplete
            size='small'
            sx={{ width: 220 }}
            placeholder='Designation'
            options={designationOptions}
            value={designation}
            onChange={(_, value) => {
              setDesignation(value)
              setPagination(p => ({ ...p, pageIndex: 0 }))
            }}
          />

          {/* User Role */}
          <GlobalAutocomplete
            size='small'
            sx={{ width: 220 }}
            placeholder='User Role'
            options={userRoleOptions}
            value={userRole}
            onChange={(_, value) => {
              setUserRole(value)
              setPagination(p => ({ ...p, pageIndex: 0 }))
            }}
          />

          {/* Supervisor */}
          <GlobalAutocomplete
            size='small'
            sx={{ width: 240 }}
            placeholder='Supervisor'
            options={supervisorOptions}
            value={supervisor}
            onChange={(_, value) => {
              setSupervisor(value)
              setPagination(p => ({ ...p, pageIndex: 0 }))
            }}
          />

          {/* ✅ Refresh – EXACTLY NEXT TO FILTERS */}
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
            onClick={() => {
              setPagination(p => ({ ...p, pageIndex: 0 }))
              loadData()
            }}
            sx={{ height: 36, textTransform: 'none' }}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </GlobalButton>
        </Box>

        <Box sx={{ p: 4, flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Box
            sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, flexShrink: 0 }}
          >
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
              size='small'
              sx={{
                width: 300, // 🔥 OLD WIDTH
                '& .MuiInputBase-root': {
                  height: 36, // 🔥 OLD HEIGHT
                  fontSize: '0.875rem'
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <SearchIcon fontSize='small' />
                  </InputAdornment>
                )
              }}
            />
          </Box>

          <Box sx={{ position: 'relative', flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
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
                  zIndex: 20
                }}
              >
                <ProgressCircularCustomization size={60} thickness={5} />
              </Box>
            )}

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
                        {loading ? 'Loading employees...' : 'No results found'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </StickyTableWrapper>
          </Box>

          <Box sx={{ flexShrink: 0, mt: 'auto' }}>
            <TablePaginationComponent totalCount={rowCount} pagination={pagination} setPagination={setPagination} />
          </Box>
        </Box>
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
          <Typography>
            Are you sure you want to delete <b>{deleteDialog.row?.name}</b>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 3, pt: 2 }}>
          <GlobalButton onClick={() => setDeleteDialog({ open: false, row: null })} color='secondary' variant='tonal'>
            Cancel
          </GlobalButton>
          <GlobalButton onClick={confirmDelete} color='error' variant='contained'>
            Delete
          </GlobalButton>
        </DialogActions>
      </Dialog>

      <EmployeeFormDialog
        open={openEmployeeDialog}
        mode={dialogMode}
        employeeId={selectedEmployeeId}
        onClose={() => setOpenEmployeeDialog(false)}
        onSuccess={() => loadData()}
      />
    </StickyListLayout>
  )
}

const EmployeeListPage = () => (
  <PermissionGuard permission='Employee List'>
    <EmployeePageContent />
  </PermissionGuard>
)

export default EmployeeListPage
