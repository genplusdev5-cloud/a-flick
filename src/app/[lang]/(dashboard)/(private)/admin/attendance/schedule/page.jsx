'use client'

import { useState, useEffect } from 'react'
import React from 'react'
import Link from 'next/link'
import {
  Box,
  Card,
  CardHeader,
  Typography,
  Divider,
  FormControl,
  Select,
  MenuItem,
  Checkbox,
  Menu,
  FormControlLabel,
  TextField,
  InputAdornment,
  IconButton
} from '@mui/material'

import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'
import GlobalButton from '@/components/common/GlobalButton'
import GlobalDateRange from '@/components/common/GlobalDateRange'
import GlobalAutocomplete from '@/components/common/GlobalAutocomplete'
import { getAttendanceDropdowns } from '@/api/attendance/dropdowns'

import PrintIcon from '@mui/icons-material/Print'
import TableChartIcon from '@mui/icons-material/TableChart'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import FileCopyIcon from '@mui/icons-material/FileCopy'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import FileDownloadIcon from '@mui/icons-material/FileDownload'

import SearchIcon from '@mui/icons-material/Search'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'

import TablePaginationComponent from '@/components/TablePaginationComponent'
import styles from '@core/styles/table.module.css'

import { format, addDays } from 'date-fns'
import CustomTextField from '@core/components/mui/TextField'

import {
  getScheduleList,
  getScheduleDetails,
  updateSchedule,
  deleteSchedule,
  addSchedule
} from '@/api/attendanceSchedule'

// -----------------------------------------------------

export default function AttendanceSchedulePage() {
  const [rows, setRows] = useState([])
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 50 })
  const [searchText, setSearchText] = useState('')
  const [dateFilter, setDateFilter] = useState(true)
  const [dateRange, setDateRange] = useState([new Date(), new Date()])
  const [startDate, setStartDate] = useState(new Date())
  const [endDate, setEndDate] = useState(addDays(new Date(), 7))
  const [exportAnchorEl, setExportAnchorEl] = useState(null)

  const [attendanceList, setAttendanceList] = useState([])
  const [technicianList, setTechnicianList] = useState([])
  const [supervisorList, setSupervisorList] = useState([])
  const [customerList, setCustomerList] = useState([])

  const [selectedAttendance, setSelectedAttendance] = useState(null)
  const [selectedTechnician, setSelectedTechnician] = useState(null)
  const [selectedSupervisor, setSelectedSupervisor] = useState(null)
  const [selectedCustomer, setSelectedCustomer] = useState(null)

  const CustomDateInput = ({ label, start, end, ...rest }, ref) => {
    const startDateFormatted = format(start, 'dd/MM/yyyy')
    const endDateFormatted = end ? ` - ${format(end, 'dd/MM/yyyy')}` : ''

    return (
      <CustomTextField
        {...rest}
        fullWidth
        inputRef={ref}
        label={label}
        value={`${startDateFormatted}${endDateFormatted}`}
      />
    )
  }

  // FETCH FUNCTION
  const loadScheduleList = async () => {
    try {
      const params = {
        page: pagination.pageIndex + 1,
        page_size: pagination.pageSize,
        search: searchText || '',
        start_date: dateFilter ? format(dateRange[0], 'yyyy-MM-dd') : undefined,
        end_date: dateFilter ? format(dateRange[1], 'yyyy-MM-dd') : undefined
      }

      const res = await getScheduleList(params)

      setRows(res.results || [])
    } catch (err) {
      console.error('Attendance Schedule List Failed', err)
    }
  }

  useEffect(() => {
    loadScheduleList()
    loadDropdownData()
  }, [pagination.pageIndex, pagination.pageSize])

  const loadDropdownData = async () => {
    try {
      const res = await getAttendanceDropdowns()

      setAttendanceList(res.attendance || [])
      setTechnicianList(res.technician || [])
      setSupervisorList(res.supervisor || [])
      setCustomerList(res.customer || [])
    } catch (err) {
      console.error('Dropdown Load Failed', err)
    }
  }

  // AUTO LOAD DATA
  useEffect(() => {
    loadScheduleList()
  }, [pagination.pageIndex, pagination.pageSize])

  const ForwardDateInput = React.forwardRef(CustomDateInput)

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'action', label: 'Action' },
    { key: 'attendance_date', label: 'Attendance Date' },
    { key: 'day', label: 'Day' },
    { key: 'time_in', label: 'Appointment Time In' },
    { key: 'time_out', label: 'Appointment Time Out' },
    { key: 'work_hours', label: 'Work Hours' },
    { key: 'lunch', label: 'Lunch (in Min)' },
    { key: 'slot', label: 'Slot' },
    { key: 'technician', label: 'Technician' },
    { key: 'customer', label: 'Customer' },
    { key: 'service_address', label: 'Service Address' },
    { key: 'postal_code', label: 'Postal Code' },
    { key: 'contact_person', label: 'Contact Person' },
    { key: 'phone', label: 'Phone' },
    { key: 'attendance_status', label: 'Attendance Status' },
    { key: 'status', label: 'Status' }
  ]

  return (
    <Box>
      {/* Breadcrumb */}
      <Box sx={{ mb: 2 }}>
        <Link href='/en/admin/dashboards' className='text-primary'>
          Dashboard
        </Link>{' '}
        / <Typography component='span'>Attendance Schedule</Typography>
      </Box>

      {/* MAIN CARD */}
      {/* MAIN CARD – SAME AS ATTENDANCE PAGE */}
      <Card
        sx={{
          p: 3,
          borderRadius: 1,
          boxShadow: 'none',
          border: '1px solid #e0e0e0',
          mt: 1
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Title */}
        <CardHeader
          sx={{
            pb: 1.5,
            pt: 1.5,
            '& .MuiCardHeader-title': { fontWeight: 600, fontSize: '1.125rem' }
          }}
          title='Attendance Schedule'
        />

        <Divider sx={{ my: 3 }} />

        {/* FILTER SECTION */}
        <Box sx={{ mb: 3 }}>
          {/* ---------- ROW 1 ---------- */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: 4,
              flexWrap: 'wrap',
              mb: 2
            }}
          >
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
            {/* Attendance */}
            <Box sx={{ width: 200 }}>
              <GlobalAutocomplete label='Attendance' placeholder='Select' options={[]} />
            </Box>

            {/* Technician */}
            <Box sx={{ width: 200 }}>
              <GlobalAutocomplete label='Technician' placeholder='Select' options={[]} />
            </Box>

            {/* Supervisor */}
            <Box sx={{ width: 200 }}>
              <GlobalAutocomplete label='Supervisor' placeholder='Select' options={[]} />
            </Box>

            {/* Customer (Right-most item) */}
            <Box sx={{ width: 200 }}>
              <GlobalAutocomplete label='Customer' placeholder='Select' options={[]} />
            </Box>

            {/* Approval Status */}
            <Box sx={{ width: 200 }}>
              <GlobalAutocomplete label='Approval Status' placeholder='Select' options={[]} />
            </Box>

            {/* Appointment Status */}
            <Box sx={{ width: 200 }}>
              <GlobalAutocomplete label='Appointment Status' placeholder='Select' options={[]} />
            </Box>

            {/* Refresh Button */}
            <GlobalButton variant='contained' color='primary' sx={{ height: 40 }} onClick={loadScheduleList}>
              Refresh
            </GlobalButton>

            {/* Global Change */}
            <GlobalButton variant='contained' color='secondary' sx={{ height: 40 }}>
              Global Change
            </GlobalButton>
          </Box>

          {/* ---------- ROW 2 ---------- */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: 2,
              mt: 2
            }}
          ></Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* EXPORT + ENTRIES + SEARCH ROW */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between', // ⭐ Left group + Right search
            alignItems: 'flex-end',
            mb: 3,
            flexWrap: 'nowrap'
          }}
        >
          {/* LEFT SIDE: EXPORT + ENTRIES */}
          <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2 }}>
            {/* Export Button */}
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

            {/* Show Entries */}
            <FormControl size='small' sx={{ width: 150 }}>
              <Select
                value={pagination.pageSize}
                onChange={e =>
                  setPagination(prev => ({
                    ...prev,
                    pageSize: Number(e.target.value),
                    pageIndex: 0
                  }))
                }
              >
                {[10, 25, 50, 75, 100].map(num => (
                  <MenuItem key={num} value={num}>
                    {num} entries
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* RIGHT SIDE: SEARCH */}
          <Box>
            <TextField
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              placeholder='Search...'
              sx={{ width: 300 }}
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
                rows.map((row, index) => (
                  <tr key={index}>
                    <td>{row.id}</td>

                    {/* ACTION */}
                    <td>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton size='small' color='primary'>
                          <i className='tabler-edit' />
                        </IconButton>
                        <IconButton size='small' color='error'>
                          <i className='tabler-trash text-red-600 text-lg' />
                        </IconButton>
                      </Box>
                    </td>

                    <td>{row.attendance_date}</td>
                    <td>{row.day}</td>
                    <td>{row.time_in}</td>
                    <td>{row.time_out}</td>
                    <td>{row.work_hours}</td>
                    <td>{row.lunch}</td>
                    <td>{row.slot}</td>
                    <td>{row.technician}</td>
                    <td>{row.customer}</td>
                    <td>{row.service_address}</td>
                    <td>{row.postal_code}</td>
                    <td>{row.contact_person}</td>
                    <td>{row.phone}</td>
                    <td>{row.attendance_status}</td>
                    <td>{row.status}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className='text-center py-4'>
                    No data available in table
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <TablePaginationComponent totalCount={rows.length} pagination={pagination} setPagination={setPagination} />
      </Card>
    </Box>
  )
}
