'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Typography,
  Checkbox,
  FormControlLabel,
  IconButton,
  MenuItem,
  Grid,
  Drawer,
  Chip,
  Select,
  FormControl,
  InputAdornment,
  TextField,
  Divider
} from '@mui/material'

import GlobalTextField from '@/components/common/GlobalTextField'
import { showToast } from '@/components/common/Toasts'
import GlobalSelect from '@/components/common/GlobalSelect'
import CustomTextField from '@core/components/mui/TextField'

import { addSlot, getSlotList, getSlotDetails, updateSlot, deleteSlot } from '@/api/slot'
import RefreshIcon from '@mui/icons-material/Refresh'
import FileDownloadIcon from '@mui/icons-material/FileDownload'

import GlobalButton from '@/components/common/GlobalButton'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import CloseIcon from '@mui/icons-material/Close'
import DeleteIcon from '@mui/icons-material/Delete'
import SearchIcon from '@mui/icons-material/Search'
import TablePaginationComponent from '@/components/TablePaginationComponent'

import styles from '@core/styles/table.module.css'
import classnames from 'classnames'
import ChevronRight from '@menu/svg/ChevronRight'

// ------------------------------------------------------------------------------------------------

export default function SlotsPage() {
  const [rows, setRows] = useState([])
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 50 })
  const [searchText, setSearchText] = useState('')

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [isEdit, setIsEdit] = useState(false)

  const [formData, setFormData] = useState({
    id: null,
    name: '',
    is_ot: false,
    is_default: false,
    ot_value: '',
    start_time: '',
    end_time: '',
    work_hours: '',
    lunch: ''
  })

  const fetchSlots = async () => {
    try {
      const res = await getSlotList(pagination.pageIndex + 1, pagination.pageSize, searchText)

      setRows(res?.data?.results || []) // FIXED
    } catch (error) {
      showToast('error', 'Failed to load slots')
    }
  }

  const toggleDrawer = () => setDrawerOpen(p => !p)

  const handleAdd = () => {
    setIsEdit(false)
    setFormData({
      id: null,
      name: '',
      is_ot: false,
      is_default: false,
      ot_value: '',
      start_time: '',
      end_time: '',
      work_hours: '',
      lunch: '',
      is_active: 1 // ✅ ADD THIS
    })

    setDrawerOpen(true)
  }

  const handleEdit = row => {
    setIsEdit(true)
    setFormData({
      id: row.id,
      name: row.name,
      is_ot: row.is_ot == 1,
      is_default: row.is_default == 1,
      ot_value: row.ot_value || '',
      start_time: row.start_time || '',
      end_time: row.end_time || '',
      work_hours: row.work_hours || '',
      lunch: row.lunch_deduction || '',
      is_active: row.is_active ?? 1 // ✅ FIX — never undefined/NaN
    })

    setDrawerOpen(true)
  }

  const handleRefresh = () => {
    fetchSlots()
    showToast('info', 'Slots refreshed')
  }

  const handleExport = () => {
    showToast('info', 'Export feature coming soon...')
    // or future: export as Excel, CSV, PDF etc.
  }

  useEffect(() => {
    fetchSlots()
  }, [pagination.pageIndex, pagination.pageSize, searchText])

  const handleSubmit = async e => {
    e.preventDefault()

    if (!formData.name.trim()) {
      showToast('warning', 'Please enter Slot Name')
      return
    }

    if (!formData.start_time || !formData.end_time) {
      showToast('warning', 'Start Time and End Time are required')
      return
    }

    try {
      if (isEdit) {
        // UPDATE
        await updateSlot(formData.id, {
          name: formData.name,
          is_ot: formData.is_ot ? 1 : 0,
          is_default: formData.is_default ? 1 : 0,
          ot_value: formData.ot_value,
          start_time: formData.start_time,
          end_time: formData.end_time,
          work_hours: formData.work_hours,
          lunch: formData.lunch,
          is_active: formData.is_active // ✅ FIXED
        })

        showToast('success', 'Slot updated successfully')
      } else {
        // ADD
        await addSlot({
          name: formData.name,
          is_ot: formData.is_ot ? 1 : 0,
          is_default: formData.is_default ? 1 : 0,
          ot_value: formData.ot_value,
          start_time: formData.start_time,
          end_time: formData.end_time,
          work_hours: formData.work_hours,
          lunch: formData.lunch,
          is_active: formData.is_active // ✅ FIXED
        })

        showToast('success', 'Slot added successfully')
      }

      toggleDrawer()
      fetchSlots()
    } catch (error) {
      showToast('error', error?.message || 'Something went wrong')
    }
  }

  const handleCancel = () => {
    showToast('info', 'Changes discarded')
    toggleDrawer()
  }

  const columns = [
    { key: 'sno', label: 'S.No' },
    { key: 'action', label: 'Action' },
    { key: 'name', label: 'Name' },
    { key: 'start_time', label: 'Start Time' },
    { key: 'end_time', label: 'End Time' },
    { key: 'work_hours', label: 'Work Hours' },
    { key: 'lunch_deduction', label: 'Lunch Deduction' },
    { key: 'is_ot', label: 'Is OT' },
    { key: 'ot_value', label: 'OT Value' },
    { key: 'is_default', label: 'Is Default' },
    { key: 'status', label: 'Status' }
  ]

  return (
    <Box>
      {/* Breadcrumb */}
      <Box sx={{ mb: 2 }}>
        <Link href='/admin/dashboards' className='text-primary'>
          Dashboard
        </Link>{' '}
        / <Typography component='span'>Slots</Typography>
      </Box>

      {/* PAGE TITLE + ADD BUTTON */}
      <Card sx={{ p: 2, mb: 3 }}>
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
              {/* SLOT TITLE */}
              <Typography sx={{ fontWeight: 600, fontSize: '1.125rem' }}>Slots</Typography>

              {/* LEFT SIDE REFRESH BUTTON */}
              <GlobalButton
                variant='contained'
                color='primary'
                startIcon={<RefreshIcon />}
                onClick={handleRefresh}
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
              {/* EXPORT BUTTON */}
              <GlobalButton
                variant='outlined'
                color='secondary'
                startIcon={<FileDownloadIcon />}
                onClick={handleExport}
                sx={{
                  textTransform: 'none',
                  fontWeight: 500,
                  px: 2.5,
                  height: 36
                }}
              >
                Export
              </GlobalButton>

              {/* ADD BUTTON */}
              <GlobalButton
                variant='contained'
                startIcon={<AddIcon />}
                onClick={handleAdd}
                sx={{
                  textTransform: 'none',
                  fontWeight: 500,
                  px: 2.5,
                  height: 36
                }}
              >
                Add Slots
              </GlobalButton>
            </Box>
          }
        />

        <Divider sx={{ my: 2 }} />

        {/* FILTERS */}
        <Box
          sx={{
            mb: 3,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'nowrap',
            gap: 2
          }}
        >
          {/* Left Filters */}
          <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2 }}>
            {/* Show Entries */}
            <FormControl size='small' sx={{ width: 150 }}>
              <Select
                value={pagination.pageSize}
                onChange={e => setPagination(p => ({ ...p, pageSize: Number(e.target.value), pageIndex: 0 }))}
              >
                {[10, 25, 50, 75, 100].map(s => (
                  <MenuItem key={s} value={s}>
                    Show {s} entries
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Search */}
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

        {/* Table */}
        <div className='overflow-x-auto'>
          <table className={styles.table}>
            <thead>
              <tr>
                {columns.map(col => (
                  <th key={col.key}>
                    <div className='flex items-center cursor-default select-none'>{col.label}</div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {rows.length ? (
                rows.map((row, index) => (
                  <tr key={index}>
                    <td>{pagination.pageIndex * pagination.pageSize + (index + 1)}</td>

                    {/* ACTION BUTTONS */}
                    <td>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          size='small'
                          color='primary'
                          onClick={() => handleEdit(row)} // <-- ADD THIS
                        >
                          <EditIcon />
                        </IconButton>

                        <IconButton size='small' color='error' onClick={() => handleDelete(row.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </td>

                    <td>{row.name}</td>
                    <td>{row.start_time}</td>
                    <td>{row.end_time}</td>
                    <td>{row.work_hours}</td>
                    <td>{row.lunch_deduction}</td>
                    <td>{row.is_ot ? 'Yes' : 'No'}</td>
                    <td>{row.ot_value}</td>
                    <td>{row.is_default ? 'Yes' : 'No'}</td>
                    <td>
                      {row.is_active == 1 ? (
                        <Chip label='Active' color='success' size='small' />
                      ) : (
                        <Chip label='Inactive' color='error' size='small' />
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className='text-center py-4'>
                    No data available in the table.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <TablePaginationComponent totalCount={rows.length} pagination={pagination} setPagination={setPagination} />
      </Card>

      <Drawer
        anchor='right'
        open={drawerOpen}
        onClose={toggleDrawer}
        PaperProps={{ sx: { width: 420, boxShadow: '0px 0px 15px rgba(0,0,0,0.08)' } }}
      >
        <Box sx={{ p: 5, display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* TITLE */}
          <Box display='flex' justifyContent='space-between' alignItems='center' mb={3}>
            <Typography variant='h5' fontWeight={600}>
              {isEdit ? 'Edit Slot' : 'Add Slot'}
            </Typography>
            <IconButton onClick={toggleDrawer} size='small'>
              <CloseIcon />
            </IconButton>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* FORM */}
          <form onSubmit={handleSubmit} style={{ flexGrow: 1 }}>
            <Grid container spacing={4}>
              <Grid item xs={12}>
                <GlobalTextField
                  label='Slot Name'
                  placeholder='Enter slot name'
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </Grid>

              {/* CHECKBOX ROW */}
              <Grid item xs={12}>
                <Box display='flex' gap={3}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.is_ot}
                        onChange={e => setFormData({ ...formData, is_ot: e.target.checked })}
                      />
                    }
                    label='Is OT'
                  />

                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.is_default}
                        onChange={e => setFormData({ ...formData, is_default: e.target.checked })}
                      />
                    }
                    label='Is Default'
                  />
                </Box>
              </Grid>

              {/* OT VALUE */}
              <Grid item xs={12}>
                <GlobalTextField
                  label='OT Value'
                  placeholder='Enter OT value'
                  value={formData.ot_value}
                  onChange={e => setFormData({ ...formData, ot_value: e.target.value })}
                />
              </Grid>

              {/* TIME PICKERS */}
              <Grid item xs={12}>
                <GlobalTextField
                  label='Start Time'
                  type='time'
                  value={formData.start_time}
                  onChange={e => setFormData({ ...formData, start_time: e.target.value })}
                />
              </Grid>

              <Grid item xs={12}>
                <GlobalTextField
                  label='End Time'
                  type='time'
                  value={formData.end_time}
                  onChange={e => setFormData({ ...formData, end_time: e.target.value })}
                />
              </Grid>

              {/* HOURS + LUNCH */}
              <Grid item xs={12}>
                <GlobalTextField
                  label='Work Hours (in Hrs)'
                  placeholder='e.g. 8'
                  value={formData.work_hours}
                  onChange={e => setFormData({ ...formData, work_hours: e.target.value })}
                />
              </Grid>

              <Grid item xs={12}>
                <GlobalTextField
                  label='Lunch (in min)'
                  placeholder='e.g. 30'
                  value={formData.lunch}
                  onChange={e => setFormData({ ...formData, lunch: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <GlobalSelect
                  label='Status'
                  value={formData.is_active === 1 ? 'Active' : 'Inactive'}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      is_active: e.target.value === 'Active' ? 1 : 0
                    })
                  }
                />
              </Grid>
            </Grid>

            {/* BUTTONS */}
            <Box mt={4} display='flex' gap={2}>
              <GlobalButton type='submit' fullWidth>
                {isEdit ? 'Update Slot' : 'Save Slot'}
              </GlobalButton>

              <GlobalButton variant='outlined' color='secondary' fullWidth onClick={handleCancel}>
                Cancel
              </GlobalButton>
            </Box>
          </form>
        </Box>
      </Drawer>
    </Box>
  )
}
