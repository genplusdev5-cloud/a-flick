'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import {
  Box,
  Card,
  CardHeader,
  Typography,
  Select,
  MenuItem,
  FormControl,
  Divider,
  TextField,
  InputAdornment,
  FormControlLabel,
  Checkbox,
  IconButton
} from '@mui/material'

import { getAttendanceList, deleteAttendance } from '@/api/attendance'

import GlobalButton from '@/components/common/GlobalButton'
import GlobalAutocomplete from '@/components/common/GlobalAutocomplete'
import GlobalDateRange from '@/components/common/GlobalDateRange'

import RefreshIcon from '@mui/icons-material/Refresh'
import FileDownloadIcon from '@mui/icons-material/FileDownload'

import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import SearchIcon from '@mui/icons-material/Search'

import TablePaginationComponent from '@/components/TablePaginationComponent'
import styles from '@core/styles/table.module.css'
import CustomTextField from '@core/components/mui/TextField'
import { format } from 'date-fns'

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

  const customerOptions = ['Customer 1', 'Customer 2']
  const serviceAddressOptions = ['Address 1', 'Address 2']

  const router = useRouter()

  // Inside your component — replace fetchAttendances
  const fetchAttendances = async () => {
    try {
      setLoading(true)

      const params = {
        page: pagination.pageIndex + 1,
        page_size: pagination.pageSize,
        search: searchText.trim() || undefined,
        start_date: dateFilter && dateRange[0] ? format(dateRange[0], 'yyyy-MM-dd') : undefined,
        end_date: dateFilter && dateRange[1] ? format(dateRange[1], 'yyyy-MM-dd') : undefined
      }

      // Remove undefined fields
      Object.keys(params).forEach(key => params[key] === undefined && delete params[key])

      const res = await getAttendanceList(params)
      setRows(res?.data?.results || [])
    } catch (error) {
      console.error('Failed to fetch attendance:', error.response?.data || error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAttendances()
  }, [pagination.pageIndex, pagination.pageSize, searchText, dateRange])

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
            <Box sx={{ display: 'flex', gap: 2 }}>
              {/* EXPORT */}
              <GlobalButton
                variant='outlined'
                color='secondary'
                startIcon={<FileDownloadIcon />}
                onClick={() => showToast('info', 'Export coming soon...')}
                sx={{
                  textTransform: 'none',
                  fontWeight: 500,
                  px: 2.5,
                  height: 36
                }}
              >
                Export
              </GlobalButton>

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
            <Box
              sx={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: 2,
                flexWrap: 'wrap'
              }}
            >
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

              {/* Date Filter + Range */}
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <FormControlLabel
                  control={<Checkbox checked={dateFilter} onChange={e => setDateFilter(e.target.checked)} />}
                  label='Date Filter'
                />

                <Box sx={{ width: 220 }}>
                  <GlobalDateRange
                    label=''
                    start={dateRange[0]}
                    end={dateRange[1]}
                    onSelectRange={({ start, end }) => setDateRange([start, end])}
                    disabled={!dateFilter}
                  />
                </Box>
              </Box>

              {/* Customer Filter */}
              <Box sx={{ width: 230 }}>
                <GlobalAutocomplete
                  label='Customer'
                  options={customerOptions}
                  placeholder='Select'
                  value={null}
                  onChange={() => {}}
                />
              </Box>

              {/* Service Address Filter */}
              <Box sx={{ width: 230 }}>
                <GlobalAutocomplete
                  label='Service Address'
                  options={serviceAddressOptions}
                  placeholder='Select'
                  value={null}
                  onChange={() => {}}
                />
              </Box>
            </Box>

            {/* Search Right */}
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
                rows.map(row => (
                  <tr key={row.id}>
                    <td>{row.id}</td>

                    {/* Action */}
                    <td>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          size='small'
                          color='primary'
                          onClick={() => router.push(`/admin/attendance/attendance/edit/${row.id}`)}
                        >
                          <i className='tabler-edit text-blue-600 text-lg' />
                        </IconButton>
                        <IconButton size='small' color='error' onClick={() => handleDelete(row.id)}>
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
    </Box>
  )
}
