'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
  CircularProgress,
  FormControlLabel,
  Checkbox,
  InputAdornment // 👈 Added now
} from '@mui/material'

import { getAttendanceList, deleteAttendance } from '@/api/attendance'
import { getAttendanceDropdowns } from '@/api/attendance/dropdowns'
import ProgressCircularCustomization from '@/components/common/ProgressCircularCustomization'

import GlobalButton from '@/components/common/GlobalButton'
import GlobalAutocomplete from '@/components/common/GlobalAutocomplete'
import GlobalDateRange from '@/components/common/GlobalDateRange'

import PrintIcon from '@mui/icons-material/Print'
import TableChartIcon from '@mui/icons-material/TableChart'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import FileCopyIcon from '@mui/icons-material/FileCopy'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'

import RefreshIcon from '@mui/icons-material/Refresh'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import DialogCloseButton from '@components/dialogs/DialogCloseButton'

import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import SearchIcon from '@mui/icons-material/Search'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import AttendanceScheduleDrawer from './service-plan/AttendanceScheduleDrawer'

import TablePaginationComponent from '@/components/TablePaginationComponent'
import styles from '@core/styles/table.module.css'
import CustomTextField from '@core/components/mui/TextField'
import { format } from 'date-fns'
import { showToast } from '@/components/common/Toasts' // ← Idhu add pannu (exact path unakku theriyum)

// ----------------------------------------------------------

const initialDropdowns = {
  customers: ['Customer 1', 'Customer 2'],
  supervisors: ['Supervisor 1', 'Supervisor 2'],
  technicians: ['Technician A', 'Technician B'],
  slots: ['Morning Slot', 'Evening Slot']
}

export default function AttendancePage() {
  const [rows, setRows] = useState([])
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 50 })
  const [searchText, setSearchText] = useState('')
  const [startDate, setStartDate] = useState(new Date())
  const [endDate, setEndDate] = useState(new Date())
  const [dateFilter, setDateFilter] = useState(true)
  const [dateRange, setDateRange] = useState([null, null])
  const [loading, setLoading] = useState(false)
  const [exportAnchorEl, setExportAnchorEl] = useState(null)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, row: null })
  const customerOptions = ['Customer 1', 'Customer 2']
  const serviceAddressOptions = ['Address 1', 'Address 2']
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedAttendance, setSelectedAttendance] = useState(null)
  const autoOpenedRef = useRef(false)

  const searchParams = useSearchParams()

  const router = useRouter()

  const confirmDelete = async () => {
    try {
      const id = deleteDialog.row?.id
      await deleteAttendance(id)
      showToast('success', 'Attendance deleted successfully')
      setDeleteDialog({ open: false, row: null })
      fetchAttendances()
    } catch (error) {
      const msg = error?.response?.data?.message || error?.message || 'Failed to delete'
      showToast('error', msg)
    }
  }

  // Inside your component — replace fetchAttendances
  const fetchAttendances = async (overrideParams = {}) => {
    try {
      setLoading(true)

      const params = {
        page: pagination.pageIndex + 1,
        page_size: pagination.pageSize,
        search: searchText || undefined,
        customer_id: selectedCustomer?.value || undefined,
        technician_id: selectedTechnician?.value || undefined,
        supervisor_id: selectedSupervisor?.value || undefined,
        slot_id: selectedSlot?.value || undefined,
        start_date: dateFilter && dateRange[0] ? format(dateRange[0], 'yyyy-MM-dd') : undefined,
        end_date: dateFilter && dateRange[1] ? format(dateRange[1], 'yyyy-MM-dd') : undefined,
        ...overrideParams // 🔥 ADD THIS
      }

      Object.keys(params).forEach(k => params[k] === undefined && delete params[k])

      const res = await getAttendanceList(params)
      setRows(res?.data?.results || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async id => {
    if (!window.confirm('Are you sure you want to delete this attendance record?')) {
      return
    }

    try {
      await deleteAttendance(id) // idha un API function
      showToast('success', 'Attendance deleted successfully')
      fetchAttendances() // Refresh the list
    } catch (error) {
      const msg = error?.response?.data?.message || error?.message || 'Failed to delete'
      showToast('error', msg)
    }
  }

  // 🔽 Add this
  const [dropdowns, setDropdowns] = useState({
    customers: [],
    technicians: [],
    supervisors: [],
    slots: []
  })

  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [selectedTechnician, setSelectedTechnician] = useState(null)
  const [selectedSupervisor, setSelectedSupervisor] = useState(null)
  const [selectedSlot, setSelectedSlot] = useState(null)

  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const res = await getAttendanceDropdowns()

        setDropdowns({
          customers: res?.data?.data?.customer?.name || [],
          technicians: res?.data?.data?.technician?.name || [],
          supervisors: res?.data?.data?.supervisor?.name || [],
          slots: res?.data?.data?.slot?.name || []
        })
      } catch (err) {
        console.error('Dropdown API Error:', err)
      }
    }

    fetchDropdowns()
  }, [])

  // AUTO-OPEN DRAWER LOGIC
  useEffect(() => {
    // 1. Check if already opened to prevent re-loops
    if (autoOpenedRef.current) return

    // 2. DEPENDENCIES CHECK:
    //    - Rows must be loaded (length > 0)
    //    - Dropdowns (technicians/slots) must be available for the drawer to render correctly
    if (!rows || rows.length === 0) return
    if (!dropdowns.technicians?.length || !dropdowns.slots?.length) return

    // 3. READ PARAMS
    const params = new URLSearchParams(window.location.search)
    const targetId = params.get('openScheduleId')

    if (!targetId) return

    // 4. FIND ROW
    //    Convert both key and target to strings to match safely
    const matchedRow = rows.find(r => String(r.id) === String(targetId))

    if (matchedRow) {
      // 5. OPEN DRAWER
      //    Use a small timeout to ensure the render cycle is settled (matching "Contract" stability)
      setTimeout(() => {
        // Prevent double opening
        if (autoOpenedRef.current) return
        
        autoOpenedRef.current = true
        setSelectedAttendance(matchedRow)
        setDrawerOpen(true)

        // 6. CLEANUP URL
        //    Remove the param so refresh doesn't trigger again
        const newUrl = new URL(window.location.href)
        newUrl.searchParams.delete('openScheduleId')
        window.history.replaceState({}, '', newUrl)
      }, 500)
    } else {
      // Optional: If row not found (e.g. pagination), we simply do nothing.
      // The user requirement is to "Find matching row -> Open". 
      // If strict finding fails, we can't open.
      console.warn(`[AutoOpen] Row with ID ${targetId} not found in loaded list.`)
    }
  }, [rows, dropdowns]) // Runs whenever list or dropdowns update

  useEffect(() => {
    console.log('Dropdown Data:', dropdowns) // ← IDHU MUST!
  }, [dropdowns])

  useEffect(() => {
    fetchAttendances()
  }, [
    pagination.pageIndex,
    pagination.pageSize,
    searchText,
    dateRange,
    selectedCustomer,
    selectedTechnician,
    selectedSupervisor,
    selectedSlot
  ])

  // Update your columns array like this (exact match with table)
  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'action', label: 'ACTION' },
    { key: 'customer_id', label: 'CUSTOMER ID' },
    // { key: 'covered_location', label: 'COVERED LOCATION' }  ← REMOVED
    { key: 'service', label: 'SERVICE' }, // NEW
    { key: 'supervisor', label: 'SUPERVISOR' }, // NEW
    { key: 'service_address', label: 'SERVICE ADDRESS' },
    { key: 'postal_code', label: 'POSTAL CODE' },
    { key: 'start_date', label: 'START DATE' },
    { key: 'end_date', label: 'END DATE' },
    { key: 'contact_person_name', label: 'CONTACT PERSON NAME' },
    { key: 'phone', label: 'CONTACT PERSON PHONE' },
    { key: 'mobile', label: 'MOBILE' },
    { key: 'attendance_code', label: 'ATTENDANCE CODE' }
  ]

  return (
    <Box>
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

      {/* Breadcrumb */}
      <Box sx={{ mb: 2 }}>
        <Link href='/admin/dashboards' className='text-primary'>
          Dashboard
        </Link>{' '}
        / <Typography component='span'>Attendance</Typography>
      </Box>

      {/* MAIN CARD */}
      <Card sx={{ p: 3 }}>
        {/* TOP TITLE + ADD BUTTON */}
        <CardHeader
          sx={{
            pb: 1.5,
            pt: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            '& .MuiCardHeader-title': { fontWeight: 600, fontSize: '1.125rem' }
          }}
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography sx={{ fontWeight: 600, fontSize: '1.125rem' }}>Attendance</Typography>

              {/* LEFT SIDE REFRESH */}
              <GlobalButton
                variant='contained'
                color='primary'
                startIcon={<RefreshIcon />}
                onClick={fetchAttendances} // 🔥 Auto reload list
                sx={{
                  textTransform: 'none',
                  fontWeight: 500,
                  px: 2.5,
                  height: 36
                }}
              >
                Refresh
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

              {/* ADD */}
              <GlobalButton
                variant='contained'
                startIcon={<AddIcon />}
                sx={{ textTransform: 'none', fontWeight: 500, px: 2.5, height: 36 }}
                onClick={() => router.push('/admin/attendance/attendance/add')}
              >
                Add Attendance
              </GlobalButton>
            </Box>
          }
        />

        <Divider sx={{ my: 3 }} />

        {/* FILTER SECTION */}
        {/* FILTER SECTION */}
        <Box sx={{ mb: 3 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: 3,
              flexWrap: 'wrap',
              mb: 3
            }}
          >
            {/* LEFT GROUP */}
            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2, flexWrap: 'wrap' }}>
              {/* Entries */}
              <FormControl size='small' sx={{ width: 130 }}>
                <Select
                  value={pagination.pageSize}
                  onChange={e => setPagination(p => ({ ...p, pageSize: Number(e.target.value), pageIndex: 0 }))}
                >
                  {[10, 25, 50, 75, 100].map(s => (
                    <MenuItem key={s} value={s}>
                      Show {s}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Date Filter */}
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <FormControlLabel
                  control={<Checkbox checked={dateFilter} onChange={e => setDateFilter(e.target.checked)} />}
                  label='Date Filter'
                />
                <Box sx={{ width: 220 }}>
                  <GlobalDateRange
                    start={dateRange[0]}
                    end={dateRange[1]}
                    onSelectRange={({ start, end }) => setDateRange([start, end])}
                    disabled={!dateFilter}
                  />
                </Box>
              </Box>

              {/* Customer */}
              {/* Customer */}
              <Box sx={{ width: 200 }}>
                <GlobalAutocomplete
                  label='Customer'
                  options={dropdowns.customers.map(c => ({
                    label: String(c.name ?? '').trim() || `Customer ${c.id}`,
                    value: c.id
                  }))}
                  value={selectedCustomer}
                  onChange={value => {
                    setSelectedCustomer(value)
                    setPagination(p => ({ ...p, pageIndex: 0 }))
                  }}
                  placeholder='Select Customer'
                />
              </Box>

              {/* Technician */}
              <Box sx={{ width: 200 }}>
                <GlobalAutocomplete
                  label='Technician'
                  options={dropdowns.technicians.map(t => ({
                    label: String(t.name ?? '').trim() || `Technician ${t.id}`,
                    value: t.id
                  }))}
                  value={selectedTechnician}
                  onChange={value => {
                    setSelectedTechnician(value)
                    setPagination(p => ({ ...p, pageIndex: 0 }))
                  }}
                />
              </Box>

              {/* Supervisor */}
              <Box sx={{ width: 200 }}>
                <GlobalAutocomplete
                  label='Supervisor'
                  options={dropdowns.supervisors.map(s => ({
                    label: String(s.name ?? '').trim() || `Supervisor ${s.id}`,
                    value: s.id
                  }))}
                  value={selectedSupervisor}
                  onChange={value => {
                    setSelectedSupervisor(value)
                    setPagination(p => ({ ...p, pageIndex: 0 }))
                    fetchAttendances() // 🔥 Add this
                  }}
                />
              </Box>

              {/* Slot */}
              <Box sx={{ width: 180 }}>
                <GlobalAutocomplete
                  label='Slot'
                  options={dropdowns.slots.map(s => ({
                    label: String(s.name ?? '').trim() || `Slot ${s.id}`,
                    value: s.id
                  }))}
                  value={selectedSlot}
                  onChange={value => {
                    setSelectedSlot(value)
                    setPagination(p => ({ ...p, pageIndex: 0 }))
                  }}
                />
              </Box>
            </Box>

            {/* Search */}
            <TextField
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              placeholder='Search...'
              sx={{ width: 280 }}
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
        </Box>

        {/* TABLE */}
        <div className='overflow-x-auto'>
          <table className={styles.table}>
            <thead>
              <tr>
                {columns.map(col => (
                  <th key={col.key}>
                    <div className='flex items-center cursor-default'>{col.label}</div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {rows.length ? (
                rows.map((row, i) => (
                  <tr key={row.id}>
                    <td>{i + 1}</td>

                    {/* Action */}
                    {/* Action */}
                    <td>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {/* Edit */}
                        <IconButton
                          size='small'
                          color='primary'
                          onClick={() => router.push(`/admin/attendance/attendance/edit/${row.id}`)}
                        >
                          <i className='tabler-edit' />
                        </IconButton>

                        {/* 🔥 NEW → Schedule */}
                        <IconButton
                          size='small'
                          color='secondary'
                          onClick={() => {
                            setSelectedAttendance(row) // 👈 store selected row
                            setDrawerOpen(true) // 👈 open Drawer
                          }}
                        >
                          <i className='tabler-calendar-event' />
                        </IconButton>

                        {/* Delete */}
                        <IconButton size='small' color='error' onClick={() => setDeleteDialog({ open: true, row })}>
                          <i className='tabler-trash text-red-600 text-lg' />
                        </IconButton>
                      </Box>
                    </td>

                    {/* Customer ID */}
                    <td>{row.customer_id}</td>

                    {/* SERVICE - You can link from contract or service_type later */}
                    <td>
                      {row.service_type || row.service_name || 'General Pest Control'}
                      {/* fallback text - change as per your data */}
                    </td>

                    {/* SUPERVISOR - Show name if available, else ID or '-' */}
                    <td>
                      {row.supervisor_name ? row.supervisor_name : row.supervisor_id ? `ID: ${row.supervisor_id}` : '-'}
                    </td>

                    {/* Rest of the columns */}
                    <td>{row.service_address || '-'}</td>
                    <td>{row.postal_code || '-'}</td>
                    <td>{row.start_date || '-'}</td>
                    <td>{row.end_date || '-'}</td>
                    <td>{row.contact_person_name || '-'}</td>
                    <td>{row.phone || '-'}</td>
                    <td>{row.mobile || '-'}</td>
                    <td>{row.attendance_code || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className='text-center py-8 text-gray-500'>
                    No attendance records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <TablePaginationComponent totalCount={rows.length} pagination={pagination} setPagination={setPagination} />
      </Card>

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
            <strong style={{ color: '#d32f2f' }}>
              {deleteDialog.row?.displayFrequency || 'this billing frequency'}
            </strong>
            ?
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
            variant='contained'
            color='error'
            onClick={confirmDelete} // ✅ FIXED
          >
            Delete
          </GlobalButton>
        </DialogActions>
      </Dialog>

      <AttendanceScheduleDrawer
        open={drawerOpen && !!selectedAttendance && dropdowns.technicians.length > 0 && dropdowns.slots.length > 0}
        onClose={() => {
          setDrawerOpen(false)
          setSelectedAttendance(null)
        }}
        attendance={selectedAttendance}
        technicians={dropdowns.technicians}
        slots={dropdowns.slots}
      />
    </Box>
  )
}
