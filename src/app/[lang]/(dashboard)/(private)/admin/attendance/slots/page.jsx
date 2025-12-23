'use client'

import { useState, useEffect, useMemo } from 'react'
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
  Menu,
  FormControl,
  InputAdornment,
  TextField,
  Divider
} from '@mui/material'

import PermissionGuard from '@/components/auth/PermissionGuard'

import GlobalTextField from '@/components/common/GlobalTextField'
import { showToast } from '@/components/common/Toasts'
import GlobalSelect from '@/components/common/GlobalSelect'
import CustomTextField from '@core/components/mui/TextField'
import ProgressCircularCustomization from '@/components/common/ProgressCircularCustomization'
import StickyTableWrapper from '@/components/common/StickyTableWrapper'
import StickyListLayout from '@/components/common/StickyListLayout'

import TableChartIcon from '@mui/icons-material/TableChart'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import FileCopyIcon from '@mui/icons-material/FileCopy'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'

import { addSlot, getSlotList, getSlotDetails, updateSlot, deleteSlot } from '@/api/slot'
import RefreshIcon from '@mui/icons-material/Refresh'
import FileDownloadIcon from '@mui/icons-material/FileDownload'

import GlobalButton from '@/components/common/GlobalButton'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import CloseIcon from '@mui/icons-material/Close'
import DeleteIcon from '@mui/icons-material/Delete'
import SearchIcon from '@mui/icons-material/Search'
import PrintIcon from '@mui/icons-material/Print'
import TablePaginationComponent from '@/components/TablePaginationComponent'

import styles from '@core/styles/table.module.css'
import classnames from 'classnames'
import ChevronRight from '@menu/svg/ChevronRight'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper
} from '@tanstack/react-table'

// ------------------------------------------------------------------------------------------------

// ───────────────────────────────────────────
const SlotsPageContent = () => {
  const [rows, setRows] = useState([])
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 })
  const [searchText, setSearchText] = useState('')

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [exportAnchorEl, setExportAnchorEl] = useState(null)
  const [loading, setLoading] = useState(false)

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
    setLoading(true)
    try {
      const res = await getSlotList(pagination.pageIndex + 1, pagination.pageSize, searchText)

      const slots = res?.data?.data?.results || []
      const total = res?.data?.data?.count || 0

      // ✅ ADD S.NO HERE (JUST LIKE CONTRACT STATUS)
      const normalized = slots.map((item, index) => ({
        ...item,
        sno: index + 1 + pagination.pageIndex * pagination.pageSize
      }))

      setRows(normalized)
      setPagination(prev => ({
        ...prev,
        totalCount: total
      }))
    } catch (error) {
      showToast('error', 'Failed to load slots')
    } finally {
      setLoading(false)
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

  const handleDelete = async id => {
    if (!window.confirm('Are you sure you want to delete this slot?')) return

    setLoading(true)
    try {
      await deleteSlot(id)
      showToast('success', 'Slot deleted successfully')
      fetchSlots()
    } catch (error) {
      showToast('error', 'Failed to delete')
    } finally {
      setLoading(false)
    }
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
        await updateSlot(formData.id, {
          name: formData.name,
          is_ot: formData.is_ot ? 1 : 0,
          is_default: formData.is_default ? 1 : 0,
          ot_value: formData.ot_value,
          start_time: formData.start_time,
          end_time: formData.end_time,
          work_hours: formData.work_hours,
          lunch: formData.lunch,
          is_active: formData.is_active
        })

        showToast('success', 'Slot updated successfully')
      } else {
        await addSlot({
          name: formData.name,
          is_ot: formData.is_ot ? 1 : 0,
          is_default: formData.is_default ? 1 : 0,
          ot_value: formData.ot_value,
          start_time: formData.start_time,
          end_time: formData.end_time,
          work_hours: formData.work_hours,
          lunch: formData.lunch,
          is_active: formData.is_active
        })

        showToast('success', 'Slot added successfully')
      }

      setPagination(prev => ({ ...prev, pageIndex: 0 })) // 🔥🔥
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

  const columnHelper = createColumnHelper()

  const columns = useMemo(
    () => [
      columnHelper.accessor('sno', {
        header: 'S.No',
        enableSorting: true
      }),

      columnHelper.display({
        id: 'actions',
        header: 'Action',
        cell: ({ row }) => (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton size='small' color='primary' onClick={() => handleEdit(row.original)}>
              <i className='tabler-edit' />
            </IconButton>
            <IconButton size='small' color='error' onClick={() => handleDelete(row.original.id)}>
              <i className='tabler-trash text-red-600 text-lg' />
            </IconButton>
          </Box>
        )
      }),

      columnHelper.accessor('name', { header: 'Name', enableSorting: true }),
      columnHelper.accessor('start_time', { header: 'Start Time', enableSorting: true }),
      columnHelper.accessor('end_time', { header: 'End Time', enableSorting: true }),
      columnHelper.accessor('work_hours', { header: 'Work Hours', enableSorting: true }),
      columnHelper.accessor('lunch_deduction', { header: 'Lunch Deduction' }),
      columnHelper.accessor('is_ot', {
        header: 'Is OT',
        cell: i => (i.getValue() ? 'Yes' : 'No')
      }),
      columnHelper.accessor('ot_value', { header: 'OT Value' }),
      columnHelper.accessor('is_default', {
        header: 'Is Default',
        cell: i => (i.getValue() ? 'Yes' : 'No')
      }),
      columnHelper.accessor('is_active', {
        header: 'Status',
        cell: i =>
          i.getValue() === 1 ? (
            <Chip label='Active' color='success' size='small' />
          ) : (
            <Chip label='Inactive' color='error' size='small' />
          )
      })
    ],
    []
  )

  const table = useReactTable({
    data: rows,
    columns,
    state: { pagination },
    manualPagination: true,
    pageCount: Math.ceil((pagination.totalCount || 0) / pagination.pageSize),
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel()
  })

  return (
    <>
      <StickyListLayout
        header={
          <Box sx={{ mb: 2 }}>
            <Box sx={{ mb: 2 }}>
              <Link href='/admin/dashboards' className='text-primary'>
                Dashboard
              </Link>{' '}
              / <Typography component='span'>Slots</Typography>
            </Box>
          </Box>
        }
      >
        <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, position: 'relative' }}>
          <CardHeader
            title={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant='h5' sx={{ fontWeight: 600 }}>
                  Slots
                </Typography>

                <GlobalButton
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
                    setPagination({ pageIndex: 0, pageSize: 25 })
                    await fetchSlots() // ✅ FIX HERE
                    setTimeout(() => setLoading(false), 800)
                  }}
                >
                  {loading ? 'Refreshing...' : 'Refresh'}
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
            sx={{
              pb: 1.5,
              pt: 5,
              px: 10,
              '& .MuiCardHeader-action': { m: 0, alignItems: 'center' },
              '& .MuiCardHeader-title': { fontWeight: 600, fontSize: '1.125rem' }
            }}
          />

          <Divider />
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

          <Box sx={{ p: 4, flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Box
              sx={{
                mb: 4,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'nowrap',
                gap: 2,
                flexShrink: 0
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2 }}>
                <FormControl size='small' sx={{ width: 150 }}>
                  <Select
                    value={pagination.pageSize}
                    onChange={e => setPagination(p => ({ ...p, pageSize: Number(e.target.value), pageIndex: 0 }))}
                  >
                    {[25, 50, 75, 100].map(s => (
                      <MenuItem key={s} value={s}>
                        {s} entries
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <TextField
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                placeholder='Search...'
                sx={{ width: 300 }}
                size='small'
                InputProps={{
                  startAdornment: (
                    <InputAdornment position='start'>
                      <SearchIcon />
                    </InputAdornment>
                  )
                }}
              />
            </Box>

            <Box sx={{ position: 'relative', flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
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
                    {table.getRowModel().rows.length ? (
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
                          No data available in the table.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </StickyTableWrapper>
            </Box>

            <Box sx={{ mt: 'auto', flexShrink: 0, pt: 4 }}>
              <TablePaginationComponent
                totalCount={pagination.totalCount}
                pagination={pagination}
                setPagination={setPagination}
              />
            </Box>
          </Box>
        </Card>
      </StickyListLayout>

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
                  label='Name'
                  placeholder='Enter slot name'
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                  sx={{
                    '& .MuiFormLabel-asterisk': {
                      color: '#e91e63 !important',
                      fontWeight: 700
                    },
                    '& .MuiInputLabel-root.Mui-required': {
                      color: 'inherit'
                    }
                  }}
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
                  required
                  sx={{
                    '& .MuiFormLabel-asterisk': {
                      color: '#e91e63 !important',
                      fontWeight: 700
                    },
                    '& .MuiInputLabel-root.Mui-required': {
                      color: 'inherit'
                    }
                  }}
                />
              </Grid>

              {/* TIME PICKERS */}
              <Grid item xs={12}>
                <GlobalTextField
                  label='Start Time'
                  type='time'
                  value={formData.start_time}
                  onChange={e => setFormData({ ...formData, start_time: e.target.value })}
                  required
                  sx={{
                    '& .MuiFormLabel-asterisk': {
                      color: '#e91e63 !important',
                      fontWeight: 700
                    },
                    '& .MuiInputLabel-root.Mui-required': {
                      color: 'inherit'
                    }
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <GlobalTextField
                  label='End Time'
                  type='time'
                  value={formData.end_time}
                  onChange={e => setFormData({ ...formData, end_time: e.target.value })}
                  required
                  sx={{
                    '& .MuiFormLabel-asterisk': {
                      color: '#e91e63 !important',
                      fontWeight: 700
                    },
                    '& .MuiInputLabel-root.Mui-required': {
                      color: 'inherit'
                    }
                  }}
                />
              </Grid>

              {/* HOURS + LUNCH */}
              <Grid item xs={12}>
                <GlobalTextField
                  label='Work Hours (in Hrs)'
                  placeholder='e.g. 8'
                  value={formData.work_hours}
                  onChange={e => setFormData({ ...formData, work_hours: e.target.value })}
                  required
                  sx={{
                    '& .MuiFormLabel-asterisk': {
                      color: '#e91e63 !important',
                      fontWeight: 700
                    },
                    '& .MuiInputLabel-root.Mui-required': {
                      color: 'inherit'
                    }
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <GlobalTextField
                  label='Lunch (in min)'
                  placeholder='e.g. 30'
                  value={formData.lunch}
                  onChange={e => setFormData({ ...formData, lunch: e.target.value })}
                  required
                  sx={{
                    '& .MuiFormLabel-asterisk': {
                      color: '#e91e63 !important',
                      fontWeight: 700
                    },
                    '& .MuiInputLabel-root.Mui-required': {
                      color: 'inherit'
                    }
                  }}
                />
              </Grid>

              {/* STATUS - ONLY IN EDIT MODE */}
              {isEdit && (
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
                    menuItems={[
                      { value: 'Active', label: 'Active' },
                      { value: 'Inactive', label: 'Inactive' }
                    ]}
                  />
                </Grid>
              )}
            </Grid>

            {/* BUTTONS */}
            <Box mt={4} display='flex' gap={2}>
              <GlobalButton color='secondary' fullWidth onClick={handleCancel}>
                Cancel
              </GlobalButton>
              <GlobalButton type='submit' fullWidth>
                {isEdit ? 'Update ' : 'Save '}
              </GlobalButton>
            </Box>
          </form>
        </Box>
      </Drawer>
    </>
  )
}

// Wrapper for RBAC
export default function SlotsPage() {
  return (
    <PermissionGuard permission='Slots'>
      <SlotsPageContent />
    </PermissionGuard>
  )
}
