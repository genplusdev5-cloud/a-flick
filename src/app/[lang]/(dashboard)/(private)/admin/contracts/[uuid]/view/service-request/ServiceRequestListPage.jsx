'use client'

import { useEffect, useState } from 'react'
import {
  Box,
  Card,
  Typography,
  IconButton,
  TextField,
  InputAdornment,
  Chip,
  Divider,
  Select,
  MenuItem,
  FormControl,
  Drawer
} from '@mui/material'

import StickyTableWrapper from '@/components/common/StickyTableWrapper'
import { listTickets, addTicket, updateTicket, deleteTicket, getTicketDetails } from '@/api/contract/details/ticket'

import SearchIcon from '@mui/icons-material/Search'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import RefreshIcon from '@mui/icons-material/Refresh'
import { useParams } from 'next/navigation'

import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'
import CustomTextField from '@core/components/mui/TextField'

import GlobalButton from '@/components/common/GlobalButton'
import TablePaginationComponent from '@/components/TablePaginationComponent'
import styles from '@core/styles/table.module.css'
import { showToast } from '@/components/common/Toasts'

export default function ServiceRequestListPage({ contractId }) {
  const [rows, setRows] = useState([])
  const [searchText, setSearchText] = useState('')
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [formData, setFormData] = useState({ requestDate: '' })
  // const params = useParams()
  // const contractId = params?.uuid || params?.id

  const loadTickets = async () => {
    try {
      const res = await listTickets({ contract_id: contractId })
      const data = res?.data?.data?.results || []

      const formatted = data.map((item, index) => ({
        id: item.id,
        sno: index + 1,
        ticketNo: item.ticket_no,
        scheduleDate: item.schedule_date,
        day: item.ticket_date,
        appointmentIn: item.schedule_start_time,
        appointmentOut: item.schedule_end_time,
        pestCode: item.name,
        technician: item.technician_id,
        prodVal: item.pest_items?.reduce((sum, p) => sum + (p?.pest_value || 0), 0) || 0,
        customer: item.customer_id,
        serviceAddress: item.address || '',
        postalCode: item.postal_code || '',
        contactPerson: item.client_name || '',
        phone: item.phone || '',
        contractCode: item.contract_id,
        remarks: item.remarks || '',
        serviceType: item.ticket_type,
        scheduleStatus: item.ticket_status,
        appointmentStatus: item.is_completed ? 'Done' : 'Pending',
        status: item.is_active ? 'Active' : 'Inactive'
      }))

      setRows(formatted)
    } catch (err) {
      console.log(err)
      showToast('error', 'Failed to load service requests')
    }
  }

  useEffect(() => {
    if (contractId) loadTickets()
  }, [contractId])

  const handleOpenAdd = () => {
    setIsEdit(false)
    setFormData({ requestDate: '' })
    setDrawerOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.requestDate) {
      showToast('warning', 'Please select a request date')
      return
    }

    const payload = {
      contract_id: contractId,
      schedule_date: formData.requestDate
    }

    try {
      if (isEdit) {
        await updateTicket(formData.id, payload)
        showToast('success', 'Service Request Updated!')
      } else {
        await addTicket(payload)
        showToast('success', 'Service Request Added!')
      }
      setDrawerOpen(false)
      await loadTickets()
    } catch (err) {
      console.error(err)
      showToast('error', err?.response?.data?.message || 'Failed to save')
    }
  }

  const handleDelete = async id => {
    if (!confirm('Are you sure you want to delete?')) return
    try {
      await deleteTicket(id)
      showToast('success', 'Service Request deleted')
      await loadTickets()
    } catch (err) {
      console.log(err)
      showToast('error', 'Delete failed')
    }
  }

  const handleOpenEdit = async row => {
    try {
      const res = await getTicketDetails(row.id)
      const d = res?.data?.data || {}
      setIsEdit(true)
      setFormData({ id: d.id, requestDate: d.schedule_date })
      setDrawerOpen(true)
    } catch (err) {
      console.log(err)
      showToast('error', 'Failed to load details')
    }
  }

  const columns = [
    { id: 'sno', header: 'ID' },
    {
      id: 'actions',
      header: 'Action',
      cell: row => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton size='small' color='info'><i className='tabler-eye text-lg' /></IconButton>
          <IconButton size='small' color='primary' onClick={() => handleOpenEdit(row)}><i className='tabler-edit text-lg' /></IconButton>
          <IconButton size='small' color='error' onClick={() => handleDelete(row.id)}><i className='tabler-trash text-lg' /></IconButton>
        </Box>
      )
    },
    { id: 'ticketNo', header: 'Ticket No' },
    { id: 'scheduleDate', header: 'Schedule Date' },
    { id: 'day', header: 'Day' },
    { id: 'appointmentIn', header: 'Appointment In' },
    { id: 'appointmentOut', header: 'Appointment Out' },
    { id: 'pestCode', header: 'Pest Code' },
    { id: 'technician', header: 'Technician' },
    { id: 'prodVal', header: 'Prod. Val', cell: r => `₹ ${r.prodVal}` },
    { id: 'customer', header: 'Customer ID' },
    { id: 'serviceAddress', header: 'Service Address' },
    { id: 'postalCode', header: 'Postal Code' },
    { id: 'contactPerson', header: 'Contact Person' },
    { id: 'phone', header: 'Phone' },
    { id: 'contractCode', header: 'Contract Code' },
    { id: 'remarks', header: 'Remarks' },
    { id: 'serviceType', header: 'Service Type' },
    {
      id: 'scheduleStatus',
      header: 'Schedule Status',
      cell: row => <Chip label={row.scheduleStatus} size='small' color={row.scheduleStatus === 'Pending' ? 'warning' : 'success'} />
    },
    {
      id: 'appointmentStatus',
      header: 'Appointment Status',
      cell: row => <Chip label={row.appointmentStatus} size='small' color={row.appointmentStatus === 'Done' ? 'success' : 'warning'} />
    },
    {
      id: 'status',
      header: 'Status',
      cell: row => <Chip label={row.status} size='small' color={row.status === 'Active' ? 'success' : 'default'} />
    }
  ]

  const filtered = rows.filter(r => JSON.stringify(r).toLowerCase().includes(searchText.toLowerCase()))
  const paginated = filtered.slice(
    pagination.pageIndex * pagination.pageSize,
    pagination.pageIndex * pagination.pageSize + pagination.pageSize
  )

  return (
    <Box className='mt-2'>
      <Card
        sx={{
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          minHeight: 0,
          position: 'relative'
        }}
      >
        <Box sx={{ mb: 2, flexShrink: 0 }}>
          <Box display='flex' justifyContent='space-between' alignItems='center'>
            <Box display='flex' alignItems='center' gap={2}>
              <Typography variant='h5' fontWeight={600}>Service Request List</Typography>
              <GlobalButton startIcon={<RefreshIcon />} onClick={loadTickets}>Refresh</GlobalButton>
            </Box>
            <Box display='flex' alignItems='center' gap={2}>
              <GlobalButton variant='outlined'>Export</GlobalButton>
              <GlobalButton variant='contained' startIcon={<AddIcon />} onClick={handleOpenAdd}>Add Service Request</GlobalButton>
            </Box>
          </Box>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant='body2' fontWeight={500}>Show</Typography>
              <FormControl size='small' sx={{ width: 120 }}>
                <Select
                  value={pagination.pageSize}
                  onChange={e => setPagination({ ...pagination, pageSize: Number(e.target.value), pageIndex: 0 })}
                >
                  {[10, 25, 50, 100].map(size => (<MenuItem key={size} value={size}>{size} entries</MenuItem>))}
                </Select>
              </FormControl>
            </Box>
            <TextField
              size='small'
              placeholder='Search service request...'
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              sx={{ width: 350 }}
              InputProps={{ startAdornment: (<InputAdornment position='start'><SearchIcon /></InputAdornment>) }}
            />
          </Box>
        </Box>

        <Box sx={{ position: 'relative', flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <StickyTableWrapper rowCount={rows.length}>
            <table className={styles.table}>
              <thead>
                <tr>{columns.map(col => (<th key={col.id}>{col.header}</th>))}</tr>
              </thead>
              <tbody>
                {paginated.length ? (
                  paginated.map(row => (
                    <tr key={row.id}>
                      {columns.map(col => (<td key={col.id}>{col.cell ? col.cell(row) : row[col.id]}</td>))}
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={columns.length} className='text-center py-4'>No results found</td></tr>
                )}
              </tbody>
            </table>
          </StickyTableWrapper>
        </Box>

        <Box sx={{ mt: 'auto', flexShrink: 0, pt: 4 }}>
          <TablePaginationComponent totalCount={filtered.length} pagination={pagination} setPagination={setPagination} />
        </Box>
      </Card>

      <Drawer anchor='right' open={drawerOpen} onClose={() => setDrawerOpen(false)} PaperProps={{ sx: { width: 380, p: 4 } }}>
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant='h5' fontWeight={600}>{isEdit ? 'Edit Request Date' : 'Add Request Date'}</Typography>
            <IconButton onClick={() => setDrawerOpen(false)}><CloseIcon /></IconButton>
          </Box>
          <Divider sx={{ mb: 3 }} />
          <AppReactDatepicker
            selected={formData.requestDate ? new Date(formData.requestDate) : null}
            onChange={date => setFormData(prev => ({ ...prev, requestDate: date ? date.toISOString().split('T')[0] : '' }))}
            customInput={<CustomTextField label='Request Date' fullWidth />}
          />
          <Box mt={4} display='flex' gap={2}>
            <GlobalButton fullWidth variant='contained' onClick={handleSubmit}>{isEdit ? 'Update' : 'Save'}</GlobalButton>
            <GlobalButton fullWidth variant='outlined' color='secondary' onClick={() => setDrawerOpen(false)}>Cancel</GlobalButton>
          </Box>
        </Box>
      </Drawer>
    </Box>
  )
}
