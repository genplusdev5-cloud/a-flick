'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import {
  Box,
  Button,
  Card,
  CardHeader,
  Typography,
  Divider,
  InputAdornment,
  Breadcrumbs,
  IconButton,
  TextField,
  MenuItem,
  Pagination,
  FormControl,
  Select,
  Checkbox
} from '@mui/material'
import { getTicketList } from '@/api/ticket'

import RefreshIcon from '@mui/icons-material/Refresh'
import SearchIcon from '@mui/icons-material/Search'
import AddIcon from '@mui/icons-material/Add'

import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'

import ProgressCircularCustomization from '@/components/common/ProgressCircularCustomization'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'
import CustomTextField from '@core/components/mui/TextField'
import CustomAutocomplete from '@core/components/mui/Autocomplete'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { showToast } from '@/components/common/Toasts'

import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  createColumnHelper,
  flexRender
} from '@tanstack/react-table'

import classnames from 'classnames'
import styles from '@core/styles/table.module.css'
import ChevronRight from '@menu/svg/ChevronRight'

// -------------------------
// Service Request Page (full)
// -------------------------
export default function ServiceRequestPage() {
  // state
  const [rows, setRows] = useState([])
  const [rowCount, setRowCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [allTickets, setAllTickets] = useState([])

  // filters
  const [enableDateFilter, setEnableDateFilter] = useState(false)
  const [startDate, setStartDate] = useState(new Date())
  const [endDate, setEndDate] = useState(new Date())
  const [customerFilter, setCustomerFilter] = useState('')
  const [contractFilter, setContractFilter] = useState('')
  const [technicianFilter, setTechnicianFilter] = useState('')
  const [appointmentStatusFilter, setAppointmentStatusFilter] = useState('')
  const [appointmentTypeFilter, setAppointmentTypeFilter] = useState('')

  const [searchText, setSearchText] = useState('')
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })

  // refs
  const customerRef = useRef(null)
  const contractRef = useRef(null)
  const techRef = useRef(null)

  // autocomplete options (dummy)
  const customers = ['GP Industries Pvt Ltd', 'Acme Corp', 'Tech Solutions']
  const contracts = ['CON-2025-001', 'CON-2024-045', 'CON-2023-010']
  const technicians = ['John Doe', 'Priya Sharma', 'A. Kumar']
  const appointmentStatuses = ['Pending', 'Done', 'Cancelled']
  const appointmentTypes = ['Initial', 'Follow-up', 'Emergency']

  // columns
  const columnHelper = createColumnHelper()
  const columns = useMemo(
    () => [
      columnHelper.accessor('sno', {
        header: 'S.No',
        meta: { width: '60px' }
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        meta: { width: '110px', align: 'center' },

        cell: ({ row }) => {
          const item = row.original

          return (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1.2
              }}
            >
              {/* 👁 VIEW */}
              <IconButton size='small' onClick={() => router.push(`/admin/contracts/${item.id}/view`)}>
                <i className='tabler-eye text-gray-600 text-[18px]' />
              </IconButton>

              {/* ✏ EDIT */}
              <IconButton size='small' onClick={() => handleEdit(item)}>
                <i className='tabler-edit text-blue-600 text-[18px]' />
              </IconButton>

              {/* 🗑 DELETE */}
              <IconButton size='small' onClick={() => setDeleteDialog({ open: true, row: item })}>
                <i className='tabler-trash text-red-600 text-[18px]' />
              </IconButton>
            </Box>
          )
        }
      }),
      columnHelper.accessor('scheduleDate', {
        header: 'Schedule Date',
        cell: info => (info.getValue() ? format(new Date(info.getValue()), 'dd/MM/yyyy') : '')
      }),
      columnHelper.accessor('day', { header: 'Day' }),
      columnHelper.accessor('timeIn', { header: 'Appointment time in' }),
      columnHelper.accessor('timeOut', { header: 'Appointment time out' }),
      columnHelper.accessor('pestCode', { header: 'Pest Code' }),
      columnHelper.accessor('technician', { header: 'Technician' }),
      columnHelper.accessor('prodVal', { header: 'Prod.Val', cell: i => Number(i.getValue() || 0).toLocaleString() }),
      columnHelper.accessor('customer', { header: 'Customer' }),
      columnHelper.accessor('serviceAddress', { header: 'Service Address' }),
      columnHelper.accessor('postalCode', { header: 'Postal Code' }),
      columnHelper.accessor('contactPerson', { header: 'Contact person' }),
      columnHelper.accessor('phone', { header: 'Phone' }),
      columnHelper.accessor('contractCode', { header: 'Contract Code' }),
      columnHelper.accessor('appointmentRemarks', { header: 'Appointment Remarks' }),
      columnHelper.accessor('serviceType', { header: 'Service Type' }),
      columnHelper.accessor('scheduleStatus', { header: 'Schedule Status' }),
      columnHelper.accessor('appointmentStatus', {
        header: 'Appointment Status',
        cell: info => {
          const s = info.getValue() || 'Pending'

          const bg =
            s === 'Done'
              ? 'success.main'
              : s === 'Pending'
                ? 'warning.main'
                : s === 'Cancelled'
                  ? 'error.main'
                  : 'info.main'

          return (
            <Box
              component='span'
              sx={{
                bgcolor: bg,
                color: '#fff',
                px: 1.2,
                py: 0.3,
                borderRadius: 1,
                fontWeight: 600,
                fontSize: '0.75rem'
              }}
            >
              {s}
            </Box>
          )
        }
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: info => {
          const s = info.getValue() || 'Pending'

          const bg =
            s === 'Completed'
              ? 'success.main'
              : s === 'Pending'
                ? 'warning.main'
                : s === 'Cancelled'
                  ? 'error.main'
                  : 'info.main'

          return (
            <Box
              component='span'
              sx={{
                bgcolor: bg,
                color: '#fff',
                px: 1.2,
                py: 0.3,
                borderRadius: 1,
                fontWeight: 600,
                fontSize: '0.75rem'
              }}
            >
              {s}
            </Box>
          )
        }
      })
    ],
    []
  )

  const mapTicketToRow = ticket => {
    const scheduleDate = ticket.schedule_date

    const prodVal = (ticket.pest_items || []).reduce((sum, p) => sum + (p.pest_value || 0), 0)

    return {
      id: ticket.id,
      scheduleDate,
      day: scheduleDate ? format(new Date(scheduleDate), 'EEE') : '',
      timeIn: ticket.schedule_start_time,
      timeOut: ticket.schedule_end_time,
      pestCode: ticket.name || '',
      technician: ticket.technician_id || '',
      prodVal,
      customer: ticket.customer_id || '',
      serviceAddress: ticket.service_address || '',
      postalCode: ticket.postal_code || '',
      contactPerson: ticket.contact_person || '',
      phone: ticket.contact_number || '',
      contractCode: ticket.num_series || '',
      appointmentRemarks: ticket.remarks || '',
      serviceType: ticket.ticket_type || '',
      scheduleStatus: ticket.ticket_status || '',
      appointmentStatus: ticket.ticket_status || '',
      status: ticket.ticket_status || ''
    }
  }

  const CONTRACT_ID = 6010

  const fetchTicketsFromApi = async () => {
    try {
      setLoading(true)

      const res = await getTicketList({ contract_id: CONTRACT_ID })

      const list = res?.data?.results || []
      const mapped = list.map(mapTicketToRow)

      setAllTickets(mapped)
    } catch (err) {
      console.log(err)
      showToast('error', 'Failed to fetch ticket list')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTicketsFromApi()
  }, [])

  // filter + load data
  const loadData = async (showToastMsg = false) => {
    setLoading(true)
    try {
      // simulate fetch delay
      await new Promise(r => setTimeout(r, 200))

      // apply filters on dummyData
      const filtered = (allTickets || []).filter(r => {
        const matchSearch =
          !searchText ||
          Object.values({
            ...r,
            prodVal: r.prodVal?.toString() || ''
          })
            .join(' ')
            .toLowerCase()
            .includes(searchText.toLowerCase())

        // date range check
        const matchDate =
          !enableDateFilter ||
          (() => {
            const rowDate = new Date(r.scheduleDate)
            // include entire day by comparing date parts
            const start = new Date(startDate)
            start.setHours(0, 0, 0, 0)
            const end = new Date(endDate)
            end.setHours(23, 59, 59, 999)
            return rowDate >= start && rowDate <= end
          })()

        const matchCustomer = !customerFilter || r.customer === customerFilter
        const matchContract = !contractFilter || r.contractCode === contractFilter
        const matchTech = !technicianFilter || r.technician === technicianFilter
        const matchAppStatus = !appointmentStatusFilter || r.appointmentStatus === appointmentStatusFilter
        const matchAppType = !appointmentTypeFilter || r.serviceType === appointmentTypeFilter

        return matchSearch && matchDate && matchCustomer && matchContract && matchTech && matchAppStatus && matchAppType
      })

      // sort desc by id
      const sorted = filtered.sort((a, b) => (b.id || 0) - (a.id || 0))

      // pagination
      const start = pagination.pageIndex * pagination.pageSize
      const end = start + pagination.pageSize
      const paginated = sorted.slice(start, end)

      const normalized = paginated.map((item, idx) => ({ ...item, sno: start + idx + 1 }))
      setRows(normalized)
      setRowCount(filtered.length)

      if (showToastMsg) showToast('info', 'Service Requests refreshed')
    } catch (err) {
      console.error(err)
      showToast('error', 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData(false)
  }, [
    allTickets,
    pagination.pageIndex,
    pagination.pageSize,
    searchText,
    enableDateFilter,
    startDate,
    endDate,
    customerFilter,
    contractFilter,
    technicianFilter,
    appointmentStatusFilter,
    appointmentTypeFilter
  ])

  // react-table
  const table = useReactTable({
    data: rows,
    columns,
    manualPagination: true,
    pageCount: Math.ceil(rowCount / pagination.pageSize),
    state: { globalFilter: searchText, pagination },
    onGlobalFilterChange: setSearchText,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel()
  })

  // export CSV
  const exportCSV = () => {
    const headers = columns.map(c => c.header).filter(Boolean)
    const csv = [
      headers.join(','),
      ...rows.map(r =>
        columns
          .map(col => {
            const key = col.accessorKey || ''
            const val = key ? (r[key] ?? '') : ''
            return `"${String(val).replace(/"/g, '""')}"`
          })
          .join(',')
      )
    ].join('\n')
    const link = document.createElement('a')
    link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    link.download = 'service_requests.csv'
    link.click()
    showToast('success', 'CSV downloaded')
  }

  const exportPrint = () => {
    const w = window.open('', '_blank')
    const html = `
      <html><head><title>Service Requests</title><style>
      body{font-family:Arial;padding:24px;}
      table{border-collapse:collapse;width:100%;font-size:12px;}
      th,td{border:1px solid #ccc;padding:6px;text-align:left;}
      th{background:#f4f4f4}
      </style></head><body>
      <h2>Service Requests</h2>
      <table><thead><tr>${columns.map(c => `<th>${c.header}</th>`).join('')}</tr></thead><tbody>
      ${rows
        .map(
          r =>
            `<tr>${columns
              .map(col => {
                const key = col.accessorKey || ''
                const val = key ? (r[key] ?? '') : ''
                return `<td>${String(val)}</td>`
              })
              .join('')}</tr>`
        )
        .join('')}
      </tbody></table></body></html>`
    w.document.write(html)
    w.document.close()
    w.print()
  }

  // UI render
  return (
    <Box>
      <Box role='presentation' sx={{ mb: 2 }}>
        <Breadcrumbs aria-label='breadcrumb'>
          <Link underline='hover' color='inherit' href='/'>
            Home
          </Link>
          <Typography color='text.primary'>Service Request</Typography>
        </Breadcrumbs>
      </Box>

      <Card sx={{ p: 3 }}>
        {/* Header */}
        <CardHeader
          title={
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant='h5' sx={{ fontWeight: 600 }}>
                  Service Request
                </Typography>

                <Button
                  variant='contained'
                  startIcon={<RefreshIcon />}
                  onClick={async () => {
                    await fetchTicketsFromApi()
                    showToast('success', 'Refreshed')
                  }}
                  sx={{ textTransform: 'none' }}
                >
                  Refresh
                </Button>
              </Box>

              <Button variant='contained' startIcon={<AddIcon />} sx={{ textTransform: 'none' }}>
                Add Request
              </Button>
            </Box>
          }
          sx={{ pb: 1.5, pt: 1.5 }}
          action={null}
        />

        <Divider sx={{ mb: 2 }} />

        {/* Filters (single horizontal row) */}
        <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', mb: 3, flexWrap: 'wrap' }}>
          {/* Date range */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Checkbox checked={enableDateFilter} onChange={e => setEnableDateFilter(e.target.checked)} size='small' />
              <Typography variant='body2' sx={{ fontWeight: 500 }}>
                Date
              </Typography>
            </Box>
            <AppReactDatepicker
              selectsRange
              startDate={startDate}
              endDate={endDate}
              onChange={dates => {
                if (dates && dates.length === 2) {
                  setStartDate(dates[0])
                  setEndDate(dates[1])
                }
              }}
              shouldCloseOnSelect={false}
              disabled={!enableDateFilter}
              customInput={
                <CustomTextField
                  size='small'
                  sx={{ width: 220 }}
                  value={`${format(startDate, 'dd/MM/yyyy')} - ${format(endDate, 'dd/MM/yyyy')}`}
                />
              }
            />
          </Box>

          {/* Customer */}
          <CustomAutocomplete
            options={customers}
            value={customerFilter || null}
            onChange={(e, v) => setCustomerFilter(v || '')}
            renderInput={params => <CustomTextField {...params} label='Customer' size='small' sx={{ width: 220 }} />}
          />

          {/* Contract */}
          <CustomAutocomplete
            options={contracts}
            value={contractFilter || null}
            onChange={(e, v) => setContractFilter(v || '')}
            renderInput={params => <CustomTextField {...params} label='Contract' size='small' sx={{ width: 180 }} />}
          />

          {/* Technician */}
          <CustomAutocomplete
            options={technicians}
            value={technicianFilter || null}
            onChange={(e, v) => setTechnicianFilter(v || '')}
            renderInput={params => <CustomTextField {...params} label='Technician' size='small' sx={{ width: 180 }} />}
          />

          {/* Appointment Status */}
          <CustomAutocomplete
            options={appointmentStatuses}
            value={appointmentStatusFilter || null}
            onChange={(e, v) => setAppointmentStatusFilter(v || '')}
            renderInput={params => (
              <CustomTextField {...params} label='Appointment Status' size='small' sx={{ width: 180 }} />
            )}
          />

          {/* Appointment Type */}
          <CustomAutocomplete
            options={appointmentTypes}
            value={appointmentTypeFilter || null}
            onChange={(e, v) => setAppointmentTypeFilter(v || '')}
            renderInput={params => (
              <CustomTextField {...params} label='Appointment Type' size='small' sx={{ width: 180 }} />
            )}
          />
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Toolbar: entries + export + search */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
            mb: 2,
            flexWrap: 'wrap'
          }}
        >
          {/* left: entries + export */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FormControl size='small' sx={{ width: 120 }}>
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

            <Box sx={{ display: 'flex', gap: 1 }}>
              {['Copy', 'CSV', 'Excel', 'PDF', 'Print'].map(b => (
                <Button
                  key={b}
                  variant='contained'
                  size='small'
                  onClick={
                    b === 'CSV' ? exportCSV : b === 'Print' ? exportPrint : () => showToast('info', `${b} coming soon`)
                  }
                  sx={{ bgcolor: '#6c757d', color: '#fff', textTransform: 'none' }}
                >
                  {b}
                </Button>
              ))}
            </Box>
          </Box>

          {/* right: search */}
          <TextField
            size='small'
            placeholder='Search any field...'
            value={searchText}
            onChange={e => {
              setSearchText(e.target.value)
              setPagination(p => ({ ...p, pageIndex: 0 }))
            }}
            sx={{ width: 360 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <SearchIcon />
                </InputAdornment>
              )
            }}
          />
        </Box>

        {/* Loading overlay */}
        {loading && (
          <Box
            sx={{
              position: 'fixed',
              inset: 0,
              zIndex: 2000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(2px)',
              backgroundColor: 'rgba(255,255,255,0.7)'
            }}
          >
            <Box textAlign='center'>
              <ProgressCircularCustomization size={60} thickness={5} />
              <Typography mt={2} fontWeight={600}>
                Loading...
              </Typography>
            </Box>
          </Box>
        )}

        {/* Table */}
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
                        {h.column.getIsSorted() === 'asc' && <ChevronRight className='-rotate-90' fontSize='small' />}
                        {h.column.getIsSorted() === 'desc' && <ChevronRight className='rotate-90' fontSize='small' />}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>

            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className='text-center py-4'>
                    {loading ? 'Loading...' : 'No data available'}
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map(row => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <Box
          sx={{
            mt: 2,
            px: 3,
            py: 1.5,
            borderTop: '1px solid #e0e0e0',
            display: 'flex',
            justifyContent: 'space-between', // 👈 Left text + Right pagination
            alignItems: 'center',
            flexWrap: 'wrap'
          }}
        >
          {/* Left text */}
          <Typography color='text.disabled'>
            {`Showing ${rowCount === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1} to ${Math.min(
              (pagination.pageIndex + 1) * pagination.pageSize,
              rowCount
            )} of ${rowCount} entries`}
          </Typography>

          {/* Right Pagination */}
          <Pagination
            shape='rounded'
            color='primary'
            variant='tonal'
            count={Math.ceil(rowCount / pagination.pageSize) || 1}
            page={pagination.pageIndex + 1}
            onChange={(_, page) => setPagination(p => ({ ...p, pageIndex: page - 1 }))}
            showFirstButton
            showLastButton
          />
        </Box>
      </Card>

      <ToastContainer />
    </Box>
  )
}
