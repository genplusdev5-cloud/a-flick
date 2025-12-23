'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

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
  InputAdornment
} from '@mui/material'

import PermissionGuard from '@/components/auth/PermissionGuard'

import { getAttendanceList, deleteAttendance } from '@/api/attendance'
import { getAttendanceById } from '@/api/attendance/details'

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
import StickyListLayout from '@/components/common/StickyListLayout'
import StickyTableWrapper from '@/components/common/StickyTableWrapper'
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

// ───────────────────────────────────────────
const AttendancePageContent = () => {
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
  const pathname = usePathname()
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

  useEffect(() => {
    const openScheduleId = searchParams.get('openScheduleId')
    if (!openScheduleId) return

    // already injected → skip
    if (rows.some(r => String(r.id) === String(openScheduleId))) return

    const fetchSingle = async () => {
      try {
        const res = await getAttendanceById(openScheduleId)

        // 🔥 inject record manually
        setRows(prev => [res.data || res, ...prev])
      } catch (err) {
        console.error('Single attendance fetch failed', err)
      }
    }

    fetchSingle()
  }, [searchParams])

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
        const response = await getAttendanceDropdowns()

        // SUPER SAFE WAY — works for any nesting level
        let apiData = response
        if (apiData?.data?.data?.data) apiData = apiData.data.data.data
        else if (apiData?.data?.data) apiData = apiData.data.data
        else if (apiData?.data) apiData = apiData.data

        const getObjects = obj =>
          (obj?.name || []).map(x => ({ id: x.id, name: x.name || 'Unnamed' })).filter(x => x.name && x.name !== 'null')

        setDropdowns({
          customers: apiData.customer?.name || [],
          technicians: getObjects(apiData.technician || {}),
          supervisors: getObjects(apiData.supervisor || {}),
          slots: getObjects(apiData.slot || {})
        })
      } catch (err) {
        console.error('Dropdown API Error:', err)
      }
    }

    fetchDropdowns()
  }, [])

  useEffect(() => {
    const openScheduleId = searchParams.get('openScheduleId')
    if (!openScheduleId) return

    // Already opened → skip
    if (autoOpenedRef.current) return

    const openDrawer = async () => {
      try {
        let record = rows.find(r => String(r.id) === String(openScheduleId))

        // 🔥 NOT FOUND IN LIST → FETCH DIRECTLY
        if (!record) {
          const res = await getAttendanceById(openScheduleId)
          record = res?.data || res
          if (!record) return
        }

        setSelectedAttendance(record)
        setDrawerOpen(true)
        autoOpenedRef.current = true

        // ✅ clean URL
        const params = new URLSearchParams(searchParams.toString())
        params.delete('openScheduleId')
        router.replace(`${pathname}?${params.toString()}`, { scroll: false })
      } catch (err) {
        console.error('Auto open schedule failed', err)
      }
    }

    openDrawer()
  }, [searchParams, rows])

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
    <StickyListLayout
      header={
        <Box sx={{ mb: 2 }}>
          <Box sx={{ mb: 2 }}>
            <Link href='/admin/dashboards' className='text-primary'>
              Dashboard
            </Link>{' '}
            / <Typography component='span'>Attendance</Typography>
          </Box>
        </Box>
      }
    >
      <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, position: 'relative' }}>
        <CardHeader
          title={
            <Box display='flex' alignItems='center' gap={2}>
              <Typography variant='h5' fontWeight={600}>
                Attendance
              </Typography>

              <GlobalButton
                variant='contained'
                color='primary'
                startIcon={<RefreshIcon />}
                onClick={fetchAttendances}
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
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 3,
              flexWrap: 'wrap',
              mb: 3,
              flexShrink: 0
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2, flexWrap: 'wrap' }}>
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

              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <FormControlLabel
                  control={<Checkbox checked={dateFilter} onChange={e => setDateFilter(e.target.checked)} />}
                  label='Date Filter'
                  sx={{ mb: -0.5 }}
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

              <Box sx={{ width: 180 }}>
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

              <Box sx={{ width: 180 }}>
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

              <Box sx={{ width: 180 }}>
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
                    fetchAttendances()
                  }}
                />
              </Box>

              <Box sx={{ width: 150 }}>
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

            <TextField
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              placeholder='Search...'
              sx={{ width: 250 }}
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
                  zIndex: 10
                }}
              >
                <ProgressCircularCustomization size={60} thickness={5} />
              </Box>
            )}

            <StickyTableWrapper rowCount={rows.length}>
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
                        <td>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton
                              size='small'
                              color='primary'
                              onClick={() => router.push(`/admin/attendance/attendance/edit/${row.id}`)}
                            >
                              <i className='tabler-edit' />
                            </IconButton>

                            <IconButton
                              size='small'
                              color='secondary'
                              onClick={() => {
                                setSelectedAttendance(row)
                                setDrawerOpen(true)
                              }}
                            >
                              <i className='tabler-calendar-event' />
                            </IconButton>

                            <IconButton size='small' color='error' onClick={() => setDeleteDialog({ open: true, row })}>
                              <i className='tabler-trash text-red-600 text-lg' />
                            </IconButton>
                          </Box>
                        </td>
                        <td>{row.customer_id}</td>
                        <td>{row.service_type || row.service_name || 'General Pest Control'}</td>
                        <td>
                          {row.supervisor_name
                            ? row.supervisor_name
                            : row.supervisor_id
                              ? `ID: ${row.supervisor_id}`
                              : '-'}
                        </td>
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
            </StickyTableWrapper>
          </Box>

          <Box sx={{ flexShrink: 0, mt: 'auto' }}>
            <TablePaginationComponent totalCount={rows.length} pagination={pagination} setPagination={setPagination} />
          </Box>
        </Box>
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
        <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 3, pt: 2 }}>
          <GlobalButton color='secondary' onClick={() => setDeleteDialog({ open: false, row: null })}>
            Cancel
          </GlobalButton>
          <GlobalButton variant='contained' color='error' onClick={confirmDelete}>
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
    </StickyListLayout>
  )
}

// Wrapper for RBAC
export default function AttendancePage() {
  return (
    <PermissionGuard permission='Attendance'>
      <Suspense
        fallback={
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        }
      >
        <AttendancePageContent />
      </Suspense>
    </PermissionGuard>
  )
}
