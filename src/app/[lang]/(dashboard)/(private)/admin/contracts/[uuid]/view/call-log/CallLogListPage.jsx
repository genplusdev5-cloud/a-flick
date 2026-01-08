'use client'

import { useEffect, useState } from 'react'
import {
  Box,
  Card,
  Typography,
  IconButton,
  TextField,
  InputAdornment,
  Divider,
  FormControl,
  Select,
  MenuItem,
  Drawer,
  Grid
} from '@mui/material'

import StickyTableWrapper from '@/components/common/StickyTableWrapper'
import { useParams } from 'next/navigation'
import SearchIcon from '@mui/icons-material/Search'
import VisibilityIcon from '@mui/icons-material/Visibility'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import PrintIcon from '@mui/icons-material/Print'
import RefreshIcon from '@mui/icons-material/Refresh'
import CloseIcon from '@mui/icons-material/Close'

import GlobalButton from '@/components/common/GlobalButton'
import GlobalTextarea from '@/components/common/GlobalTextarea'
import GlobalTextField from '@/components/common/GlobalTextField'
import { showToast } from '@/components/common/Toasts'

import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'
import CustomTextField from '@core/components/mui/TextField'

import TablePaginationComponent from '@/components/TablePaginationComponent'
import styles from '@core/styles/table.module.css'

import {
  listCallLogs,
  addCallLog,
  updateCallLog,
  deleteCallLog,
  getCallLogDetails
} from '@/api/contract/details/call_log'

export default function CallLogListPage() {
  const [rows, setRows] = useState([])
  const [searchText, setSearchText] = useState('')
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const params = useParams()
  const contractId = params?.uuid || params?.id

  const [formData, setFormData] = useState({
    reminder: '',
    entryDate: '',
    reminderDate: null,
    reminderTime: null,
    remarks: ''
  })

  const loadCallLogs = async () => {
    try {
      const res = await listCallLogs({ contract_id: contractId })
      const data = res?.data?.data?.results || []
      const formatted = data.map(item => ({
        id: item.id,
        reminder: item.reminder,
        entryDate: item.entry_date,
        reminderDate: item.reminder_date,
        reminderTime: item.reminder_time,
        remarks: item.remarks
      }))
      setRows(formatted)
    } catch (err) {
      console.error(err)
      showToast('error', 'Failed to load call logs')
    }
  }

  useEffect(() => {
    if (contractId) loadCallLogs()
  }, [contractId])

  const handleAdd = () => {
    setIsEdit(false)
    setFormData({
      reminder: '',
      entryDate: new Date().toISOString().split('T')[0],
      reminderDate: new Date(),
      reminderTime: new Date(),
      remarks: ''
    })
    setDrawerOpen(true)
  }

  const handleEdit = async row => {
    try {
      const res = await getCallLogDetails(row.id)
      const d = res?.data?.data || {}
      setIsEdit(true)
      setFormData({
        id: d.id,
        reminder: d.reminder,
        entryDate: d.entry_date,
        reminderDate: d.reminder_date ? new Date(d.reminder_date) : null,
        reminderTime: d.reminder_time ? new Date(`2024-01-01 ${d.reminder_time}`) : null,
        remarks: d.remarks
      })
      setDrawerOpen(true)
    } catch (err) {
      console.error(err)
      showToast('error', 'Failed to load details')
    }
  }

  const handleSubmit = async () => {
    if (!formData.reminder || !formData.reminderDate || !formData.reminderTime) {
      showToast('warning', 'Please fill the required fields')
      return
    }
    const formattedDate = formData.reminderDate.toISOString().split('T')[0]
    const formattedTime = formData.reminderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
    const payload = {
      contract_id: contractId,
      reminder: formData.reminder,
      entry_date: formData.entryDate,
      reminder_date: formattedDate,
      reminder_time: formattedTime,
      remarks: formData.remarks
    }
    try {
      if (isEdit) {
        await updateCallLog(formData.id, payload)
        showToast('success', 'Call Log Updated!')
      } else {
        await addCallLog(payload)
        showToast('success', 'Call Log Added!')
      }
      setDrawerOpen(false)
      await loadCallLogs()
    } catch (err) {
      console.error(err)
      showToast('error', 'Request failed')
    }
  }

  const handleDelete = async id => {
    if (!confirm('Are you sure you want to delete this log?')) return
    try {
      await deleteCallLog(id)
      showToast('success', 'Call Log Deleted!')
      await loadCallLogs()
    } catch (err) {
      console.error(err)
      showToast('error', 'Delete failed')
    }
  }

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
          maxHeight: '100%',
          minHeight: 0,
          position: 'relative'
        }}
      >
        <Box sx={{ mb: 2, flexShrink: 0 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant='h5' fontWeight={600}>Call Log</Typography>
              <GlobalButton variant='contained' color='primary' startIcon={<RefreshIcon />} onClick={loadCallLogs}>Refresh</GlobalButton>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <GlobalButton variant='outlined' color='secondary' endIcon={<PrintIcon />}>Export</GlobalButton>
              <GlobalButton variant='contained' startIcon={<AddIcon />} onClick={handleAdd}>Add Call Log</GlobalButton>
            </Box>
          </Box>
          <Divider sx={{ mb: 3 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography>Show</Typography>
              <FormControl size='small' sx={{ width: 120 }}>
                <Select
                  value={pagination.pageSize}
                  onChange={e => setPagination(prev => ({ ...prev, pageSize: Number(e.target.value), pageIndex: 0 }))}
                >
                  {[10, 25, 50, 100].map(size => (<MenuItem key={size} value={size}>{size} entries</MenuItem>))}
                </Select>
              </FormControl>
            </Box>
            <TextField
              size='small'
              placeholder='Search reminder...'
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
                <tr>{['#', 'Action', 'Reminder', 'Entry Date', 'Reminder Date', 'Reminder Time', 'Remarks'].map(h => (<th key={h}>{h}</th>))}</tr>
              </thead>
              <tbody>
                {paginated.length ? (
                  paginated.map(row => (
                    <tr key={row.id}>
                      <td>{row.id}</td>
                      <td>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton size='small' color='info'><VisibilityIcon /></IconButton>
                          <IconButton size='small' color='primary' onClick={() => handleEdit(row)}><EditIcon /></IconButton>
                          <IconButton size='small' color='error' onClick={() => handleDelete(row.id)}><DeleteIcon /></IconButton>
                        </Box>
                      </td>
                      <td>{row.reminder}</td>
                      <td>{row.entryDate}</td>
                      <td>{row.reminderDate}</td>
                      <td>{row.reminderTime}</td>
                      <td>{row.remarks}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={7} className='text-center py-4'>No results found</td></tr>
                )}
              </tbody>
            </table>
          </StickyTableWrapper>
        </Box>

        <Box sx={{ mt: 'auto', flexShrink: 0, pt: 4 }}>
          <TablePaginationComponent totalCount={filtered.length} pagination={pagination} setPagination={setPagination} />
        </Box>
      </Card>

      <Drawer anchor='right' open={drawerOpen} onClose={() => setDrawerOpen(false)} PaperProps={{ sx: { width: 420, p: 4 } }}>
        <Box display='flex' alignItems='center' justifyContent='space-between'>
          <Typography variant='h5'>{isEdit ? 'Edit Call Log' : 'Add Call Log'}</Typography>
          <IconButton onClick={() => setDrawerOpen(false)}><CloseIcon /></IconButton>
        </Box>
        <Divider sx={{ my: 2 }} />
        <Grid container spacing={3}>
          <Grid item xs={12}><GlobalTextField label='Reminder' placeholder='Enter reminder title' value={formData.reminder} onChange={e => setFormData(prev => ({ ...prev, reminder: e.target.value }))} /></Grid>
          <Grid item xs={12}><AppReactDatepicker selected={formData.reminderDate} onChange={date => setFormData(prev => ({ ...prev, reminderDate: date }))} customInput={<CustomTextField label='Reminder Date' fullWidth />} /></Grid>
          <Grid item xs={12}><AppReactDatepicker showTimeSelect showTimeSelectOnly timeIntervals={15} selected={formData.reminderTime} dateFormat='HH:mm' onChange={date => setFormData(prev => ({ ...prev, reminderTime: date }))} customInput={<CustomTextField label='Reminder Time' fullWidth />} /></Grid>
          <Grid item xs={12}><GlobalTextarea label='Remarks' rows={4} placeholder='Enter remarks...' value={formData.remarks} onChange={e => setFormData(prev => ({ ...prev, remarks: e.target.value }))} /></Grid>
        </Grid>
        <Box mt={4} display='flex' gap={2}>
          <GlobalButton fullWidth onClick={handleSubmit}>{isEdit ? 'Update' : 'Set Reminder'}</GlobalButton>
          <GlobalButton variant='outlined' color='secondary' fullWidth onClick={() => setDrawerOpen(false)}>Cancel</GlobalButton>
        </Box>
      </Drawer>
    </Box>
  )
}
