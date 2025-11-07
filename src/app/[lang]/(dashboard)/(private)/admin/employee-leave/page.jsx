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
  Autocomplete,
  FormControl,
  Select, // ADD THIS LINE
  CircularProgress,
  InputAdornment
} from '@mui/material'

import { addEmployeeLeave, getEmployeeLeaveList, updateEmployeeLeave, deleteEmployeeLeave } from '@/api/employeeLeave'

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
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import CustomTextField from '@core/components/mui/TextField'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'
import { toast } from 'react-toastify'
import TablePaginationComponent from '@/components/TablePaginationComponent'
import classnames from 'classnames'
import { rankItem } from '@tanstack/match-sorter-utils'

// ✅ Custom reusable form components
import CustomTextFieldWrapper from '@/components/common/CustomTextField'
import CustomTextarea from '@/components/common/CustomTextarea'
import CustomSelectField from '@/components/common/CustomSelectField'

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

// Temporary static list — replace later with API list if needed
const employeeOptions = [
  { id: 1, name: 'Admin' },
  { id: 2, name: 'Technician' }
]

// Default Leave Types
const DEFAULT_LEAVE_OPTIONS = ['Annual Leave', 'Sick Leave', 'Casual Leave', 'Maternity Leave', 'Paternity Leave']

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
export default function EmployeeLeavePage() {
  const [rows, setRows] = useState([])
  const [rowCount, setRowCount] = useState(0)
  const [searchText, setSearchText] = useState('')
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 })
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, row: null })
  const [exportAnchorEl, setExportAnchorEl] = useState(null)
  const [dateError, setDateError] = useState('')
  const [unsavedAddData, setUnsavedAddData] = useState(null)

  const [formData, setFormData] = useState({
    id: null,
    employee_id: '', // ✅ backend needs id
    name: '', // label for UI only
    supervisor: '',
    leaveType: '',
    fromDate: new Date(),
    toDate: new Date(),
    status: 'Pending',
    description: ''
  })

  const employeeRef = useRef(null)
  const supervisorRef = useRef(null)
  const leaveTypeRef = useRef(null)
  const fromDateRef = useRef(null)
  const toDateRef = useRef(null)
  const statusRef = useRef(null)

  // Load rows
  const loadData = async () => {
    setLoading(true)
    try {
      const res = await getEmployeeLeaveList()
      const results = res?.data?.results || []

      const formatted = results.map((item, idx) => ({
        sno: idx + 1,
        id: item.id,
        employee: item.name || '-', // 👈 from API
        supervisor: item.supervisor || '-', // 👈 from API
        leaveType: item.leave_type || '-', // 👈 from API
        fromDate: item.leave_date ? new Date(item.leave_date) : '-',
        toDate: item.to_date ? new Date(item.to_date) : '-',
        status: item.is_approved === 1 ? 'Approved' : item.is_approved === 0 ? 'Rejected' : 'Pending',
        is_active: item.is_active
      }))

      setRows(formatted)
      setRowCount(formatted.length)
    } catch (err) {
      console.error(err)
      showToast('error', 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  // ✅ Date formatter function
  const formatDate = date => {
    if (!date) return null
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // ✅ Final working submit handler
  const handleSubmit = async e => {
    e.preventDefault()

    if (!formData.employee_id || !formData.leaveType) {
      showToast('warning', 'Employee and Leave Type are required')
      return
    }

    setLoading(true)
    try {
      const formatDate = d => {
        if (!d) return null
        const x = new Date(d)
        return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`
      }

      // 🧩 FIXED PAYLOAD
      const payload = {
        id: formData.id,
        employee_id: Number(formData.employee_id), // FK integer
        supervisor: String(formData.supervisor || '-').trim(), // text field
        leave_type: String(formData.leaveType || '-').trim(), // text field
        leave_date: formatDate(formData.fromDate),
        to_date: formatDate(formData.toDate),
        is_approved: formData.status === 'Approved' ? 1 : formData.status === 'Rejected' ? 0 : null,
        is_active: 1,
        status: 1,
        created_by: 1,
        updated_by: 1
      }

      console.log('🧾 Submitting payload:', payload)

      if (isEdit && formData.id) {
        await updateEmployeeLeave(payload)
        showToast('success', 'Leave updated successfully')
      } else {
        await addEmployeeLeave(payload)
        showToast('success', 'Leave added successfully')
      }

      setDrawerOpen(false)
      await loadData()
    } catch (err) {
      console.error('❌ Error:', err)
      showToast('error', 'Failed to save leave')
    } finally {
      setLoading(false)
    }
  }

  const handleDateChange = (date, field) => {
    if (field === 'fromDate' && formData.toDate && date > formData.toDate) {
      setDateError('Start date cannot be after end date')
    } else if (field === 'toDate' && formData.fromDate && date < formData.fromDate) {
      setDateError('End date cannot be before start date')
    } else {
      setDateError('')
    }

    // ✅ Update date fields properly
    setFormData(prev => ({
      ...prev,
      [field]: date
    }))
  }

  const handleDelete = async row => {
    try {
      await deleteEmployeeLeave(row.id)
      showToast('delete', `${row.employee}'s leave deleted successfully`)
      await loadData()
    } catch (err) {
      console.error(err)
      showToast('error', 'Failed to delete leave')
    }
  }

  // ADD THIS — MISSING FUNCTION
  const confirmDelete = async () => {
    if (deleteDialog.row) {
      await handleDelete(deleteDialog.row)
    }
    setDeleteDialog({ open: false, row: null })
  }

  useEffect(() => {
    loadData()
  }, [pagination.pageIndex, pagination.pageSize, searchText])

  // Drawer
  const toggleDrawer = () => setDrawerOpen(p => !p)
  // 🔹 Cancel drawer + reset form
  const handleCancel = () => {
    setFormData({
      id: data.id || row.id,
      name: data.employee_name || '', // ✅ consistent key + fallback
      supervisor: data.supervisor || '',
      leaveType: data.leave_type || '',
      fromDate: data.leave_date ? new Date(data.leave_date) : new Date(),
      toDate: data.to_date ? new Date(data.to_date) : new Date(),
      status: data.is_approved === 1 ? 'Approved' : data.is_approved === 0 ? 'Rejected' : 'Pending',
      description: data.description || ''
    })

    setUnsavedAddData(null)
    setDrawerOpen(false)
  }

  // 🔹 Handle field change + store unsaved add data
  const handleFieldChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value ?? ''
    }))
  }

  // 🔹 Updated Add handler with unsaved data restore
  const handleAdd = () => {
    setIsEdit(false)
    // in handleAdd / handleCancel resets
    setFormData({
      id: null,
      employee_id: '', // ✅
      name: '', // ✅
      supervisor: '',
      leaveType: '',
      fromDate: new Date(),
      toDate: new Date(),
      status: 'Pending',
      description: ''
    })

    setDateError('')
    setDrawerOpen(true)

    // Focus the employee input field
    setTimeout(() => {
      employeeRef.current?.querySelector('input')?.focus()
    }, 100)
  }

  const handleEdit = async row => {
    try {
      setLoading(true)
      const res = await getEmployeeLeaveDetails(row.id)
      const data = res?.data || {}

      setIsEdit(true)
      setFormData({
        id: data.id || row.id,
        employee_name: data.employee_name ?? '',
        leaveType: data.leave_type ?? '',
        fromDate: data.leave_date ? new Date(data.leave_date) : new Date(),
        toDate: data.to_date ? new Date(data.to_date) : new Date(),
        status: data.is_approved === 1 ? 'Approved' : data.is_approved === 0 ? 'Rejected' : 'Pending',
        description: data.description ?? '',
        supervisor: data.supervisor ?? ''
      })

      setDrawerOpen(true)

      setTimeout(() => {
        employeeRef.current?.querySelector('input')?.focus()
      }, 150)
    } catch (err) {
      console.error(err)
      showToast('error', 'Failed to load leave details')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async e => {
    const newStatus = e.target.value
    setFormData(prev => ({ ...prev, status: newStatus }))
    if (isEdit && formData.id) {
      const updatedRow = { ...formData, status: newStatus }
      setRows(prev => prev.map(r => (r.id === formData.id ? updatedRow : r)))
      const db = await initDB()
      await db.put(STORE_NAME, {
        ...updatedRow,
        fromDate: updatedRow.fromDate.getTime(),
        toDate: updatedRow.toDate.getTime()
      })
      showToast('success', 'Status updated')
    }
  }

  // Dynamic Leave Type Options
  const existingLeaveTypes = rows.map(r => r.leaveType).filter(Boolean)
  const leaveTypeOptions = Array.from(new Set([...DEFAULT_LEAVE_OPTIONS, ...existingLeaveTypes]))

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
      columnHelper.accessor('employee', { header: 'Employee' }),
      columnHelper.accessor('supervisor', { header: 'Supervisor' }),
      columnHelper.accessor('leaveType', { header: 'Leave Type' }),
      columnHelper.accessor('fromDate', {
        header: 'From Date & Time',
        cell: info => info.getValue().toLocaleString()
      }),
      columnHelper.accessor('toDate', {
        header: 'To Date & Time',
        cell: info => info.getValue().toLocaleString()
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: info => {
          const status = info.getValue()
          const color = status === 'Approved' ? 'success' : status === 'Pending' ? 'warning' : 'error'
          return (
            <Chip
              label={status}
              size='small'
              sx={{
                color: '#fff',
                bgcolor: `${color}.main`,
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

  // Export Functions
  const exportOpen = Boolean(exportAnchorEl)
  const exportCSV = () => {
    const headers = ['S.No', 'Employee', 'Supervisor', 'Leave Type', 'From', 'To', 'Status']
    const csv = [
      headers.join(','),
      ...rows.map(r =>
        [
          r.sno,
          `"${r.employee}"`,
          `"${r.supervisor}"`,
          `"${r.leaveType}"`,
          `"${r.fromDate.toLocaleString()}"`,
          `"${r.toDate.toLocaleString()}"`,
          r.status
        ].join(',')
      )
    ].join('\n')
    const link = document.createElement('a')
    link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    link.download = 'employee_leaves.csv'
    link.click()
    showToast('success', 'CSV downloaded')
  }

  const exportPrint = () => {
    const w = window.open('', '_blank')
    const html = `
      <html><head><title>Employee Leaves</title><style>
      body{font-family:Arial;padding:24px;}
      table{width:100%;border-collapse:collapse;}
      th,td{border:1px solid #ccc;padding:8px;text-align:left;}
      th{background:#f4f4f4;}
      </style></head><body>
      <h2>Employee Leave Requests</h2>
      <table><thead><tr>
      <th>S.No</th><th>Employee</th><th>Supervisor</th><th>Leave Type</th><th>From</th><th>To</th><th>Status</th>
      </tr></thead><tbody>
      ${rows
        .map(
          r => `<tr>
          <td>${r.sno}</td>
          <td>${r.employee}</td>
          <td>${r.supervisor}</td>
          <td>${r.leaveType}</td>
          <td>${r.fromDate.toLocaleString()}</td>
          <td>${r.toDate.toLocaleString()}</td>
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
        <Link underline='hover' color='inherit' href='/'>
          Home
        </Link>
        <Typography color='text.primary'>Leaves</Typography>
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
                Leave Management
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
                onClick={handleAdd}
                sx={{ textTransform: 'none', fontWeight: 500, px: 2.5, height: 36 }}
              >
                Add Leave
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
            placeholder='Search employee, supervisor...'
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
                    No leave requests found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <TablePaginationComponent totalCount={rowCount} pagination={pagination} setPagination={setPagination} />
      </Card>

      {/* Drawer */}
      {/* Drawer */}
      <Drawer
        anchor='right'
        open={drawerOpen}
        onClose={toggleDrawer}
        PaperProps={{ sx: { width: 460, boxShadow: '0px 0px 15px rgba(0,0,0,0.08)' } }}
      >
        <Box sx={{ p: 5, display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Box display='flex' justifyContent='space-between' alignItems='center' mb={3}>
            <Typography variant='h5' fontWeight={600}>
              {isEdit ? 'Edit Leave Request' : 'Add Leave Request'}
            </Typography>
            <IconButton onClick={toggleDrawer} size='small'>
              <CloseIcon />
            </IconButton>
          </Box>

          <Divider sx={{ mb: 3 }} />

          <form onSubmit={handleSubmit} style={{ flexGrow: 1 }}>
            <Grid container spacing={3}>
              {/* Employee (Dropdown sends ID, shows name) */}
              <Grid item xs={12}>
                <CustomSelectField
                  ref={employeeRef}
                  fullWidth
                  required
                  label='Employee'
                  value={formData.employee_id ?? ''} // keep controlled
                  onChange={e => {
                    const selectedId = Number(e.target.value) || '' // keep types stable
                    const selected = employeeOptions.find(emp => emp.id === selectedId)
                    setFormData(prev => ({
                      ...prev,
                      employee_id: selectedId,
                      name: selected ? selected.name : ''
                    }))
                  }}
                  options={employeeOptions.map(emp => ({
                    value: emp.id,
                    label: emp.name
                  }))}
                />
              </Grid>

              {/* Supervisor */}
              {/* Supervisor */}
              <Grid item xs={12}>
                <CustomTextFieldWrapper
                  ref={supervisorRef}
                  fullWidth
                  label='Supervisor'
                  placeholder='Enter supervisor name'
                  value={formData.supervisor || ''} // ✅ Fallback to empty string
                  onChange={e => handleFieldChange('supervisor', e.target.value.replace(/[^a-zA-Z\s]/g, '') || '')}
                />
              </Grid>

              {/* Leave Type */}
              <Grid item xs={12}>
                <CustomSelectField
                  ref={leaveTypeRef}
                  fullWidth
                  required
                  label='Leave Type'
                  value={formData.leaveType || ''} // ✅ never undefined
                  onChange={e => handleFieldChange('leaveType', e.target.value || '')}
                  options={leaveTypeOptions.map(type => ({ value: type, label: type }))}
                />
              </Grid>

              {/* From Date */}
              <Grid item xs={12}>
                <AppReactDatepicker
                  showTimeSelect
                  timeIntervals={15}
                  selected={formData.fromDate}
                  onChange={date => handleDateChange(date, 'fromDate')}
                  dateFormat='dd/MM/yyyy h:mm aa'
                  customInput={
                    <CustomTextFieldWrapper
                      ref={fromDateRef}
                      fullWidth
                      required
                      label='From Date & Time'
                      placeholder='Select from date'
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position='start'>
                            <CalendarTodayIcon />
                          </InputAdornment>
                        )
                      }}
                    />
                  }
                />
              </Grid>

              {/* To Date */}
              <Grid item xs={12}>
                <AppReactDatepicker
                  showTimeSelect
                  timeIntervals={15}
                  selected={formData.toDate}
                  onChange={date => handleDateChange(date, 'toDate')}
                  dateFormat='dd/MM/yyyy h:mm aa'
                  customInput={
                    <CustomTextFieldWrapper
                      fullWidth
                      required
                      label='To Date & Time'
                      placeholder='Select to date'
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position='start'>
                            <CalendarTodayIcon />
                          </InputAdornment>
                        )
                      }}
                      inputRef={toDateRef}
                    />
                  }
                />
              </Grid>

              {/* Date Error */}
              {dateError && (
                <Grid item xs={12}>
                  <Typography color='error' variant='body2'>
                    {dateError}
                  </Typography>
                </Grid>
              )}

              {/* Description */}
              <Grid item xs={12}>
                <CustomTextarea
                  label='Description'
                  placeholder='Add remarks or leave reason...'
                  rows={3}
                  value={formData.description || ''}
                  onChange={e => handleFieldChange('description', e.target.value)}
                />
              </Grid>

              {/* Status (Edit Mode Only) */}
              {isEdit && (
                <Grid item xs={12}>
                  <CustomSelectField
                    fullWidth
                    label='Status'
                    value={formData.status}
                    onChange={e => handleFieldChange('status', e.target.value)}
                    options={[
                      { value: 'Pending', label: 'Pending' },
                      { value: 'Approved', label: 'Approved' },
                      { value: 'Rejected', label: 'Rejected' }
                    ]}
                  />
                </Grid>
              )}
            </Grid>

            {/* Footer Buttons */}
            <Box mt={4} display='flex' gap={2}>
              <Button type='submit' variant='contained' fullWidth disabled={loading || !!dateError}>
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
        {/* Title with Warning Icon */}
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

        {/* Message */}
        <DialogContent sx={{ px: 5, pt: 1 }}>
          <Typography sx={{ color: 'text.secondary', fontSize: 14, lineHeight: 1.6 }}>
            Are you sure you want to delete the leave request for{' '}
            <strong style={{ color: '#d32f2f' }}>{deleteDialog.row?.employee || 'this employee'}</strong>?
            <br />
            This action cannot be undone.
          </Typography>
        </DialogContent>

        {/* Buttons */}
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
    </Box>
  )
}
