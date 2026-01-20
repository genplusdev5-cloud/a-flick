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
  Select,
  FormControl,
  CircularProgress,
  InputAdornment
} from '@mui/material'

import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { serviceFrequencySchema } from '@/validations/serviceFrequency.schema'

import {
  getServiceFrequencyList,
  addServiceFrequency,
  updateServiceFrequency,
  deleteServiceFrequency
} from '@/api/master/serviceFrequency'

import DialogCloseButton from '@components/dialogs/DialogCloseButton'
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
import CustomTextField from '@core/components/mui/TextField'
import { toast } from 'react-toastify'
import TablePaginationComponent from '@/components/TablePaginationComponent'
import classnames from 'classnames'

import TableChartIcon from '@mui/icons-material/TableChart'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import FileCopyIcon from '@mui/icons-material/FileCopy'

// 🔥 Global UI Components
import GlobalButton from '@/components/common/GlobalButton'
import GlobalTextField from '@/components/common/GlobalTextField'
import GlobalTextarea from '@/components/common/GlobalTextarea'
import GlobalSelect from '@/components/common/GlobalSelect'
import PermissionGuard from '@/components/auth/PermissionGuard'
import { usePermission } from '@/hooks/usePermission'
import { showToast } from '@/components/common/Toasts'

import { rankItem } from '@tanstack/match-sorter-utils'
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
import StickyTableWrapper from '@/components/common/StickyTableWrapper'
import StickyListLayout from '@/components/common/StickyListLayout'
import GlobalAutocomplete from '@/components/common/GlobalAutocomplete'

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
const ServiceFrequencyPageContent = () => {
  const [rows, setRows] = useState([])
  const { canAccess } = usePermission()
  const [rowCount, setRowCount] = useState(0)
  const [searchText, setSearchText] = useState('')
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 })
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, row: null })
  const [exportAnchorEl, setExportAnchorEl] = useState(null)

  const [editId, setEditId] = useState(null)

  // Draft State
  const [unsavedAddData, setUnsavedAddData] = useState(null)
  const [closeReason, setCloseReason] = useState(null)

  // React Hook Form
  const {
    control,
    handleSubmit: hookSubmit,
    reset,
    formState: { errors },
    setValue,
    getValues
  } = useForm({
    resolver: zodResolver(serviceFrequencySchema),
    defaultValues: {
      serviceFrequency: '',
      incrementType: '',
      noOfIncrements: '',
      backlogAge: '',
      frequencyCode: '',
      displayFrequency: '',
      sortOrder: '',
      description: '',
      status: 1
    }
  })

  // 🔹 Effect: Handle Drawer Closing Logic
  useEffect(() => {
    if (!drawerOpen) {
      if (closeReason === 'save' || closeReason === 'cancel') {
        // Explicitly cleared → Clear draft
        setUnsavedAddData(null)
        // Reset form to default (clean state)
        reset({
          serviceFrequency: '',
          incrementType: '',
          noOfIncrements: '',
          backlogAge: '',
          frequencyCode: '',
          displayFrequency: '',
          sortOrder: '',
          description: '',
          status: 1
        })
      } else if (!isEdit) {
        // Manual Close in Add Mode → Save Draft
        const currentValues = getValues()
        setUnsavedAddData(currentValues)
      }
    }
  }, [drawerOpen])

  // Load rows
  const loadData = async () => {
    setLoading(true)
    try {
      const res = await getServiceFrequencyList()
      // Safely handle backend structure
      const results = res?.data?.data?.results || res?.data?.results || res?.results || []

      if (Array.isArray(results)) {
        const formatted = results.map((item, index) => ({
          sno: index + 1,
          id: item.id,
          serviceFrequency: item.name || '',
          displayFrequency: item.name || '', // Mapping name to displayFrequency as fallback usually
          frequencyCode: item.frequency_code || '-',
          incrementType: item.frequency || '-',
          noOfIncrements: item.times || '-',
          backlogAge: item.backlog_age || '-',
          sortOrder: item.sort_order || '-',
          description: item.description || '',
          is_active: item.is_active,
          status: item.is_active === 1 ? 'Active' : 'Inactive'
        }))

        setRows(formatted)
        setRowCount(formatted.length)
      } else {
        setRows([])
        setRowCount(0)
      }
    } catch (err) {
      console.error('❌ Error loading service frequency list:', err)
      showToast('error', 'Something went wrong while loading data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [pagination.pageIndex, pagination.pageSize, searchText])

  // Drawer
  const toggleDrawer = () => {
    setCloseReason('manual')
    setDrawerOpen(p => !p)
  }

  const handleAdd = () => {
    setIsEdit(false)
    setEditId(null)

    if (unsavedAddData) {
      reset(unsavedAddData)
    } else {
      reset({
        serviceFrequency: '',
        incrementType: '',
        noOfIncrements: '',
        backlogAge: '',
        frequencyCode: '',
        displayFrequency: '',
        sortOrder: '',
        description: '',
        status: 1
      })
    }
    setCloseReason(null)
    setDrawerOpen(true)
  }

  const handleEdit = async row => {
    setIsEdit(true)
    setEditId(row.id)
    setLoading(true)

    try {
      // Try to fetch details if available, else fallback to row data
      // Assuming getServiceFrequencyDetails exists and works
      const res = await getServiceFrequencyDetails(row.id)
      if (res?.data) {
        const data = res.data
        reset({
          serviceFrequency: data.name || '',
          incrementType: data.frequency || '',
          noOfIncrements: String(data.times || ''),
          backlogAge: String(data.backlog_age || ''),
          frequencyCode: data.frequency_code || '',
          displayFrequency: data.name || '', // usually name
          sortOrder: String(data.sort_order || ''),
          description: data.description || '',
          status: data.is_active ?? 1
        })
      } else {
        // Fallback
        reset({
          serviceFrequency: row.serviceFrequency,
          incrementType: row.incrementType !== '-' ? row.incrementType : '',
          noOfIncrements: row.noOfIncrements !== '-' ? String(row.noOfIncrements) : '',
          backlogAge: row.backlogAge !== '-' ? String(row.backlogAge) : '',
          frequencyCode: row.frequencyCode !== '-' ? row.frequencyCode : '',
          displayFrequency: row.displayFrequency !== '-' ? row.displayFrequency : '',
          sortOrder: row.sortOrder !== '-' ? String(row.sortOrder) : '',
          description: row.description,
          status: row.is_active
        })
      }
      setCloseReason(null)
      setDrawerOpen(true)
    } catch (err) {
      console.error('❌ Fetch details error:', err)
      showToast('error', 'Failed to fetch details')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setCloseReason('cancel')
    setDrawerOpen(false)
  }

  const onSubmit = async data => {
    // DUPLICATE CHECK
    const duplicate = rows.find(
      r => r.serviceFrequency.trim().toLowerCase() === data.serviceFrequency.trim().toLowerCase() && r.id !== editId
    )

    if (duplicate) {
      showToast('warning', 'This record already exists')
      return
    }

    setLoading(true)
    try {
      const payload = {
        id: editId,
        name: data.serviceFrequency,
        frequency: data.incrementType,
        times: data.noOfIncrements,
        backlog_age: data.backlogAge,
        frequency_code: data.frequencyCode,
        sort_order: data.sortOrder,
        description: data.description,
        is_active: data.status,
        status: 1
      }

      // If displayFrequency is separate, include it, but usually mapped to name
      // payload.displayFrequency = data.displayFrequency

      const res = isEdit ? await updateServiceFrequency(payload) : await addServiceFrequency(payload)

      if (res?.status === 'success') {
        showToast('success', isEdit ? 'Frequency updated successfully' : 'Frequency added successfully')
        setCloseReason('save')
        setDrawerOpen(false)
        await loadData()
      } else {
        showToast('error', 'Operation failed')
      }
    } catch (err) {
      console.error('❌ Error saving frequency:', err)
      showToast('error', 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteDialog.row?.id) return
    setLoading(true)
    try {
      const res = await deleteServiceFrequency(deleteDialog.row.id)
      if (res?.status === 'success') showToast('delete', 'Frequency deleted successfully')
      else showToast('error', 'Failed to delete')
      await loadData()
    } catch (err) {
      console.error('❌ Delete error:', err)
      showToast('error', 'Something went wrong')
    } finally {
      setLoading(false)
      setDeleteDialog({ open: false, row: null })
    }
  }

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
            {canAccess('Service Frequency', 'update') && (
              <IconButton size='small' color='primary' onClick={() => handleEdit(info.row.original)}>
                <i className='tabler-edit' />
              </IconButton>
            )}
            {canAccess('Service Frequency', 'delete') && (
              <IconButton
                size='small'
                color='error'
                onClick={() => setDeleteDialog({ open: true, row: info.row.original })}
              >
                <i className='tabler-trash text-red-600 text-lg' />
              </IconButton>
            )}
          </Box>
        )
      }),
      columnHelper.accessor('displayFrequency', { header: 'Display Frequency' }),
      columnHelper.accessor('frequencyCode', { header: 'Frequency Code' }),
      columnHelper.accessor('incrementType', { header: 'Increment Type' }),
      columnHelper.accessor('noOfIncrements', { header: 'No of Increments' }),
      columnHelper.accessor('backlogAge', { header: 'Backlog Age' }),
      columnHelper.accessor('sortOrder', { header: 'Sort Order' }),
      columnHelper.accessor('description', { header: 'Description' }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: info => (
          <Chip
            label={info.getValue() === 'Active' ? 'Active' : 'Inactive'}
            size='small'
            sx={{
              color: '#fff',
              bgcolor: info.getValue() === 'Active' ? 'success.main' : 'error.main',
              fontWeight: 600,
              borderRadius: '6px',
              px: 1.5
            }}
          />
        )
      })
    ],
    []
  )

  const fuzzyFilter = (row, columnId, value, addMeta) => {
    const itemRank = rankItem(row.getValue(columnId), value)
    addMeta({ itemRank })
    return itemRank.passed
  }

  const paginatedRows = useMemo(() => {
    const start = pagination.pageIndex * pagination.pageSize
    const end = start + pagination.pageSize
    return rows.slice(start, end)
  }, [rows, pagination])

  const table = useReactTable({
    data: paginatedRows,
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
  // ... export functions kept same logic ...
  const exportCSV = () => {
    const headers = [
      'S.No',
      'Service Frequency',
      'Frequency Code',
      'Increment Type',
      'No of Increments',
      'Backlog Age',
      'Sort Order',
      'Status'
    ]
    const csv = [
      headers.join(','),
      ...rows.map(r =>
        [
          r.sno,
          r.serviceFrequency,
          r.frequencyCode,
          r.incrementType,
          r.noOfIncrements,
          r.backlogAge,
          r.sortOrder,
          r.status
        ].join(',')
      )
    ].join('\n')
    const link = document.createElement('a')
    link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    link.download = 'Service_Frequencies.csv'
    link.click()
    showToast('success', 'CSV downloaded')
  }

  const exportPrint = () => {
    const w = window.open('', '_blank')
    const html = `<html><body><table><thead><tr><th>S.No</th><th>Name</th><th>Status</th></tr></thead><tbody>${rows.map(r => `<tr><td>${r.sno}</td><td>${r.serviceFrequency}</td><td>${r.status}</td></tr>`).join('')}</tbody></table></body></html>`
    w.document.write(html)
    w.document.close()
    w.print()
  }

  return (
    <StickyListLayout
      header={
        <Box sx={{ mb: 2 }}>
          <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 2 }}>
            <Link underline='hover' color='inherit' href='/'>
              Home
            </Link>
            <Typography color='text.primary'>Service Frequency</Typography>
          </Breadcrumbs>
        </Box>
      }
    >
      <Card sx={{ display: 'flex', flexDirection: 'column', maxHeight: '100%', minHeight: 0, position: 'relative' }}>
        <CardHeader
          title={
            <Box display='flex' alignItems='center' gap={2}>
              <Typography variant='h5' sx={{ fontWeight: 600 }}>
                Service Frequency
              </Typography>
              <GlobalButton
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
                  setPagination(prev => ({ ...prev, pageSize: 25, pageIndex: 0 }))
                  await loadData()
                  setTimeout(() => setLoading(false), 500)
                }}
                sx={{ textTransform: 'none', fontWeight: 500, px: 2.5, height: 36 }}
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
                <MenuItem onClick={exportCSV}>
                  <FileDownloadIcon fontSize='small' sx={{ mr: 1 }} /> CSV
                </MenuItem>
                <MenuItem onClick={exportPrint}>
                  <PrintIcon fontSize='small' sx={{ mr: 1 }} /> Print
                </MenuItem>
              </Menu>

              {canAccess('Service Frequency', 'create') && (
                <GlobalButton
                  variant='contained'
                  startIcon={<AddIcon />}
                  onClick={handleAdd}
                  sx={{ textTransform: 'none', fontWeight: 500, px: 2.5, height: 36 }}
                >
                  Add Frequency
                </GlobalButton>
              )}
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
          {/* Filter & Search */}
          <Box
            sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, flexShrink: 0 }}
          >
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
              placeholder='Search frequency...'
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

          {/* Table */}
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
                        No data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </StickyTableWrapper>
          </Box>
          <Box sx={{ mt: 'auto', flexShrink: 0 }}>
            <TablePaginationComponent totalCount={rowCount} pagination={pagination} setPagination={setPagination} />
          </Box>
        </Box>
      </Card>

      {/* DRAWER */}
      <Drawer
        anchor='right'
        open={drawerOpen}
        onClose={toggleDrawer}
        PaperProps={{ sx: { width: 420, boxShadow: '0px 0px 15px rgba(0,0,0,0.08)' } }}
      >
        <Box sx={{ p: 5, display: 'flex', flexDirection: 'column', maxHeight: '100%' }}>
          <Box display='flex' justifyContent='space-between' alignItems='center' mb={3}>
            <Typography variant='h5' fontWeight={600}>
              {isEdit ? 'Update Frequency' : 'Add Frequency'}
            </Typography>
            <IconButton onClick={toggleDrawer} size='small'>
              <CloseIcon />
            </IconButton>
          </Box>
          <Divider sx={{ mb: 3 }} />

          <form onSubmit={hookSubmit(onSubmit)} style={{ flexGrow: 1, overflowY: 'auto' }}>
            <Grid container spacing={3}>
              {/* Service Frequency */}
              <Grid item xs={12}>
                <Controller
                  name='serviceFrequency'
                  control={control}
                  render={({ field }) => (
                    <GlobalTextField
                      {...field}
                      label='Name'
                      placeholder='Enter Service Frequency Name'
                      fullWidth
                      required
                      error={!!errors.serviceFrequency}
                      helperText={errors.serviceFrequency?.message}
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
                  )}
                />
              </Grid>

              {/* Increment Type */}
              <Grid item xs={12}>
                <Controller
                  name='incrementType'
                  control={control}
                  render={({ field }) => (
                    <GlobalAutocomplete
                      label='Increment Type'
                      {...field}
                      value={field.value}
                      onChange={val => field.onChange(val?.value || val)}
                      options={[
                        { value: 'Year', label: 'Year' },
                        { value: 'Month', label: 'Month' },
                        { value: 'Week', label: 'Week' },
                        { value: 'Day', label: 'Day' },
                        { value: 'Others', label: 'Others' }
                      ]}
                      fullWidth
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
                  )}
                />
              </Grid>

              {/* No Of Increments */}
              <Grid item xs={12}>
                <Controller
                  name='noOfIncrements'
                  control={control}
                  render={({ field }) => (
                    <GlobalTextField
                      {...field}
                      label='No Of Increments'
                      placeholder='Enter No Of Increments'
                      required
                      fullWidth
                      error={!!errors.noOfIncrements}
                      helperText={errors.noOfIncrements?.message}
                      onChange={e => field.onChange(e.target.value.replace(/\D/g, ''))} // Ensure numeric only input
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
                  )}
                />
              </Grid>

              {/* Backlog Age */}
              <Grid item xs={12}>
                <Controller
                  name='backlogAge'
                  control={control}
                  render={({ field }) => (
                    <GlobalTextField
                      {...field}
                      label='Backlog Age'
                      placeholder='Enter Backlog Age'
                      required
                      fullWidth
                      error={!!errors.backlogAge}
                      helperText={errors.backlogAge?.message}
                      onChange={e => field.onChange(e.target.value.replace(/\D/g, ''))} // 🔥 ONLY INT
                      inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
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
                  )}
                />
              </Grid>

              {/* Frequency Code */}
              <Grid item xs={12}>
                <Controller
                  name='frequencyCode'
                  control={control}
                  render={({ field }) => (
                    <GlobalTextField
                      {...field}
                      label='Frequency Code'
                      required
                      placeholder='Enter Frequency Code'
                      fullWidth
                      error={!!errors.frequencyCode}
                      helperText={errors.frequencyCode?.message}
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
                  )}
                />
              </Grid>

              {/* Display Frequency */}
              <Grid item xs={12}>
                <Controller
                  name='displayFrequency'
                  control={control}
                  render={({ field }) => (
                    <GlobalTextField
                      {...field}
                      label='Display Frequency'
                      required
                      placeholder='Enter Display Frequency'
                      fullWidth
                      error={!!errors.displayFrequency}
                      helperText={errors.displayFrequency?.message}
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
                  )}
                />
              </Grid>

              {/* Sort Order */}
              <Grid item xs={12}>
                <Controller
                  name='sortOrder'
                  control={control}
                  render={({ field }) => (
                    <GlobalTextField
                      {...field}
                      label='Sort Order'
                      placeholder='Enter Sort Order'
                      required
                      fullWidth
                      error={!!errors.sortOrder}
                      helperText={errors.sortOrder?.message}
                      onChange={e => field.onChange(e.target.value.replace(/\D/g, ''))}
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
                  )}
                />
              </Grid>

              {/* Description */}
              <Grid item xs={12}>
                <Controller
                  name='description'
                  control={control}
                  render={({ field }) => (
                    <GlobalTextarea
                      {...field}
                      label='Description' // passed as prop to GlobalTextarea usually
                      placeholder='Description'
                      minRows={3}
                    />
                  )}
                />
              </Grid>

              {/* Status */}
              {isEdit && (
                <Grid item xs={12}>
                  <Controller
                    name='status'
                    control={control}
                    render={({ field }) => (
                      <GlobalSelect
                        label='Status'
                        value={field.value === 1 ? 'Active' : 'Inactive'}
                        onChange={e => field.onChange(e.target.value === 'Active' ? 1 : 0)}
                        options={[
                          { value: 'Active', label: 'Active' },
                          { value: 'Inactive', label: 'Inactive' }
                        ]}
                      />
                    )}
                  />
                </Grid>
              )}
            </Grid>

            {/* Footer */}
            <Box mt={4} display='flex' gap={2}>
              <GlobalButton color='secondary' fullWidth onClick={handleCancel} disabled={loading}>
                Cancel
              </GlobalButton>
              <GlobalButton type='submit' variant='contained' fullWidth disabled={loading}>
                {loading ? (isEdit ? 'Updating...' : 'Saving...') : isEdit ? 'Update' : 'Save'}
              </GlobalButton>
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
            <strong style={{ color: '#d32f2f' }}>{deleteDialog.row?.serviceFrequency || 'this item'}</strong>?
            <br />
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 3, pt: 2 }}>
          <GlobalButton
            onClick={() => setDeleteDialog({ open: false, row: null })}
            color='secondary'
            sx={{ minWidth: 100, textTransform: 'none', fontWeight: 500 }}
          >
            Cancel
          </GlobalButton>
          <GlobalButton
            onClick={confirmDelete}
            variant='contained'
            color='error'
            sx={{ minWidth: 100, textTransform: 'none', fontWeight: 600 }}
          >
            Delete
          </GlobalButton>
        </DialogActions>
      </Dialog>
    </StickyListLayout>
  )
}

export default function ServiceFrequencyListPage() {
  return (
    <PermissionGuard permission='Service Frequency'>
      <ServiceFrequencyPageContent />
    </PermissionGuard>
  )
}
