'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Box,
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
  FormControl,
  Select,
  InputAdornment
} from '@mui/material'

import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { chemicalsSchema } from '@/validations/chemicals.schema'
import DialogCloseButton from '@components/dialogs/DialogCloseButton'

import { getChemicalsList, addChemical, updateChemical, deleteChemical, getChemicalDetails } from '@/api/master/chemicals'
import { getUomList } from '@/api/master/uom'

import { showToast } from '@/components/common/Toasts'
import ProgressCircularCustomization from '@/components/common/ProgressCircularCustomization'
import AddIcon from '@mui/icons-material/Add'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import CloseIcon from '@mui/icons-material/Close'
import PrintIcon from '@mui/icons-material/Print'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import RefreshIcon from '@mui/icons-material/Refresh'
import SearchIcon from '@mui/icons-material/Search'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import TableChartIcon from '@mui/icons-material/TableChart'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import FileCopyIcon from '@mui/icons-material/FileCopy'

import GlobalButton from '@/components/common/GlobalButton'
import GlobalTextField from '@/components/common/GlobalTextField'
import GlobalTextarea from '@/components/common/GlobalTextarea'
import GlobalSelect from '@/components/common/GlobalSelect'
import GlobalAutocomplete from '@/components/common/GlobalAutocomplete'
import PermissionGuard from '@/components/auth/PermissionGuard'
import { usePermission } from '@/hooks/usePermission'
import TablePaginationComponent from '@/components/TablePaginationComponent'
import classnames from 'classnames'
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
import StickyTableWrapper from '@/components/common/StickyTableWrapper'
import StickyListLayout from '@/components/common/StickyListLayout'
import ChevronRight from '@menu/svg/ChevronRight'
import { objectToFormData } from '@/utils/formUtils'

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

const ChemicalsPageContent = () => {
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
  const [selectedFile, setSelectedFile] = useState(null)
  const fileInputRef = useRef(null)

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
    watch,
    getValues
  } = useForm({
    resolver: zodResolver(chemicalsSchema),
    defaultValues: {
      name: '',
      unit: '',
      dosage: '',
      ingredients: '',
      status: 1
    }
  })

  // Image Dialog State
  const [imgDialogOpen, setImgDialogOpen] = useState(false)
  const [imgUrl, setImgUrl] = useState('')

  const [uoms, setUoms] = useState([])

  // 🔹 Effect: Handle Drawer Closing Logic
  useEffect(() => {
    if (!drawerOpen) {
      if (closeReason === 'save' || closeReason === 'cancel') {
        // Explicitly cleared → Clear draft
        setUnsavedAddData(null)
        // Reset form to default (clean state)
        reset({
          name: '',
          unit: '',
          dosage: '',
          ingredients: '',
          status: 1
        })
        setSelectedFile(null)
      } else if (!isEdit) {
        // Manual Close in Add Mode → Save Draft
        const currentValues = getValues()
        setUnsavedAddData(currentValues)
      }
    }
  }, [drawerOpen])

  const loadUoms = async () => {
    try {
      const res = await getUomList()
      if (res?.success) {
        const uomData = res.data?.results || (Array.isArray(res.data) ? res.data : [])
        setUoms(uomData)
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Load Data
  const loadData = async () => {
    setLoading(true)
    try {
      const result = await getChemicalsList()
      const dataArray = result?.data || []

      if (result.success || Array.isArray(dataArray)) {
        const formatted = dataArray
          .map((item, idx) => ({
            sno: idx + 1,
            id: item.id,
            name: item.name || '-',
            unit: item.uom || '-',
            unit_id: item.uom_id || item.uom, // Store ID if available
            dosage: item.unit_value || '-',
            ingredients: item.description || '-',
            file: item.file_name || '-',
            is_active: item.is_active,
            status: item.is_active === 1 ? 'Active' : 'Inactive'
          }))
          .sort((a, b) => b.id - a.id)

        setRows(formatted)
        setRowCount(formatted.length)
      } else {
        showToast('error', result.message || 'Failed to load chemicals')
        setRows([])
      }
    } catch (err) {
      console.error(err)
      showToast('error', 'Failed to load chemicals')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    loadUoms()
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
      if (unsavedAddData.file && unsavedAddData.file instanceof File) {
        setSelectedFile(unsavedAddData.file.name)
      }
    } else {
      setSelectedFile(null)
      reset({
        name: '',
        unit: '',
        dosage: '',
        ingredients: '',
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
    setSelectedFile(null)
    try {
      const result = await getChemicalDetails(row.id)
      if (result.success && result.data) {
        const data = result.data
        reset({
          name: data.name || '',
          unit: data.uom_id || '',
          dosage: String(data.unit_value || ''),
          ingredients: data.description || '',
          status: data.is_active ?? 1
        })
        setSelectedFile(data.file_name || null) // Just for display if it's a string, or reset if we want new upload
      } else {
        // Fallback to row data
        reset({
          name: row.name !== '-' ? row.name : '',
          unit: row.unit_id || '',
          dosage: row.dosage !== '-' ? String(row.dosage) : '',
          ingredients: row.ingredients !== '-' ? row.ingredients : '',
          status: row.is_active
        })
        setSelectedFile(row.file !== '-' ? row.file : null)
      }
      setCloseReason(null)
      setDrawerOpen(true)
    } catch (err) {
      console.error(err)
      showToast('error', 'Failed to fetch details')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setCloseReason('cancel')
    setDrawerOpen(false)
  }

  const handleFileChange = e => {
    const file = e.target.files[0]
    if (file) {
      setSelectedFile(file.name)
      setValue('file', file) // Register into react-hook-form if needed, or just keep in state?
      // Schema has file: z.any().optional(). So we can use setValue.
    }
  }

  const onSubmit = async data => {
    // Duplicate Check
    const duplicate = rows.find(r => r.name.trim().toLowerCase() === data.name.trim().toLowerCase() && r.id !== editId)
    if (duplicate) {
      showToast('warning', 'This record already exists')
      return
    }

    setLoading(true)
    try {
      // Construction of FormData
      const payload = {
        name: data.name,
        description: data.ingredients,
        uom: data.unit,
        unit_value: data.dosage,
        is_active: data.status,
        status: 1
      }

      // Handle file
      // If we have a file object in data.file (set via handleFileChange), use it.
      // If editing and no new file, backend preserves old one usually?

      // We'll use the API which likely expects a FormData object or objectToFormData wrapper
      // Based on previous code: `objectToFormData(payload)` + manual file handling

      const formData = new FormData()
      Object.keys(payload).forEach(key => formData.append(key, payload[key]))

      // The `data.file` from useForm might be undefined if we didn't use `register` on the input directly
      // but used `setValue` manually in handleFileChange.
      // Let's check if we have a file in the data object (if we setValue'd it) OR handle it manually.
      // previous implementation: `if (formData.file instanceof File) { payload.file_name = formData.file }`

      // Let's grab the file input element reference to be sure, or just rely on what we set.
      if (data.file instanceof File) {
        formData.append('file_name', data.file)
      }

      let result
      if (isEdit) {
        result = await updateChemical(editId, formData)
      } else {
        result = await addChemical(formData)
      }

      if (result.success) {
        showToast('success', result.message)
        setCloseReason('save')
        setDrawerOpen(false)
        await loadData()
      } else {
        showToast('error', result.message)
      }
    } catch (err) {
      console.error(err)
      showToast('error', 'Failed to save Chemical')
    } finally {
      setLoading(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteDialog.row?.id) return
    setLoading(true)
    try {
      const result = await deleteChemical(deleteDialog.row.id)
      if (result.success) {
        showToast('success', result.message)
        await loadData()
      } else {
        showToast('error', result.message)
      }
    } catch (err) {
      console.error(err)
      showToast('error', 'Failed to delete Chemical')
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
            {canAccess('Chemicals', 'update') && (
              <IconButton size='small' color='primary' onClick={() => handleEdit(info.row.original)}>
                <i className='tabler-edit ' />
              </IconButton>
            )}
            {canAccess('Chemicals', 'delete') && (
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
      columnHelper.accessor('name', { header: 'Chemical Name' }),
      columnHelper.accessor('unit', {
        header: 'Unit',
        cell: info => {
          const val = info.getValue()
          const matched = uoms.find(u => u.id === val || u.name === val)
          return matched?.name || val || '-'
        }
      }),
      columnHelper.accessor('dosage', { header: 'Dosage' }),
      columnHelper.accessor('ingredients', { header: 'Ingredients' }),
      columnHelper.accessor('file', {
        header: 'File',
        cell: info => {
          const val = info.getValue()
          if (val && val !== '-') {
            return (
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '4px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  border: '1px solid #eee'
                }}
                onClick={() => {
                  setImgUrl(val)
                  setImgDialogOpen(true)
                }}
              >
                <img
                  src={val}
                  alt='chemical'
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={e => {
                    e.target.style.display = 'none'
                  }}
                />
              </Box>
            )
          }
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <UploadFileIcon fontSize='small' color='disabled' />
              <Typography variant='body2' color='text.disabled'>
                —
              </Typography>
            </Box>
          )
        }
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: info => (
          <Chip
            label={info.getValue() === 'Active' ? 'Active' : 'Inactive'}
            size='small'
            color={info.getValue() === 'Active' ? 'success' : 'error'}
            sx={{
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

  // Export
  const exportOpen = Boolean(exportAnchorEl)
  const exportCSV = () => {
    const headers = ['S.No', 'Name', 'Unit', 'Dosage', 'Ingredients', 'File', 'Status']
    const csv = [
      headers.join(','),
      ...rows.map(r => [r.sno, r.name, r.unit, r.dosage, r.ingredients, r.file, r.status].join(','))
    ].join('\n')
    const link = document.createElement('a')
    link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    link.download = 'Chemicals.csv'
    link.click()
    showToast('success', 'CSV downloaded')
  }

  const exportPrint = () => {
    const w = window.open('', '_blank')
    const html = `<html><body><table><thead><tr><th>S.No</th><th>Name</th><th>Unit</th><th>Dosage</th><th>Status</th></tr></thead><tbody>${rows.map(r => `<tr><td>${r.sno}</td><td>${r.name}</td><td>${r.unit}</td><td>${r.dosage}</td><td>${r.status}</td></tr>`).join('')}</tbody></table></body></html>`
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
            <Typography color='text.primary'>Chemicals</Typography>
          </Breadcrumbs>
        </Box>
      }
    >
      <Card sx={{ display: 'flex', flexDirection: 'column', maxHeight: '100%', minHeight: 0, position: 'relative' }}>
        <CardHeader
          title={
            <Box display='flex' alignItems='center' gap={2}>
              <Typography variant='h5' sx={{ fontWeight: 600 }}>
                Chemicals
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
              {canAccess('Chemicals', 'create') && (
                <GlobalButton
                  variant='contained'
                  startIcon={<AddIcon />}
                  onClick={handleAdd}
                  sx={{ textTransform: 'none', fontWeight: 500, px: 2.5, height: 36 }}
                >
                  Add Chemical
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
            sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, flexShrink: 0 }}
          >
            <FormControl size='small' sx={{ width: 140 }}>
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
            <DebouncedInput
              value={searchText}
              onChange={v => {
                setSearchText(String(v))
                setPagination(p => ({ ...p, pageIndex: 0 }))
              }}
              placeholder='Search name, unit...'
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

      {/* Drawer */}
      <Drawer
        anchor='right'
        open={drawerOpen}
        onClose={toggleDrawer}
        PaperProps={{ sx: { width: 420, boxShadow: '0px 0px 15px rgba(0,0,0,0.08)' } }}
      >
        <Box sx={{ p: 5, display: 'flex', flexDirection: 'column', maxHeight: '100%' }}>
          <Box display='flex' justifyContent='space-between' alignItems='center' mb={3}>
            <Typography variant='h5' fontWeight={600}>
              {isEdit ? 'Edit Chemical' : 'Add Chemical'}
            </Typography>
            <IconButton onClick={toggleDrawer} size='small'>
              <CloseIcon />
            </IconButton>
          </Box>
          <Divider sx={{ mb: 3 }} />

          <form
            onSubmit={hookSubmit(onSubmit, err => {
              console.error('Validation Errors:', err)
            })}
            style={{ flexGrow: 1 }}
          >
            <Grid container spacing={3}>
              {/* Name */}
              <Grid item xs={12}>
                <Controller
                  name='name'
                  control={control}
                  render={({ field }) => (
                    <GlobalTextField
                      {...field}
                      label='Name'
                      fullWidth
                      placeholder='Enter Chemical Name'
                      required
                      error={!!errors.name}
                      helperText={errors.name?.message}
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

              {/* Unit */}
              <Grid item xs={12}>
                <Controller
                  name='unit'
                  control={control}
                  shouldUnregister={false}
                  render={({ field }) => {
                    // 🔥 Convert ID → normalized object expected by GlobalAutocomplete
                    const selectedUnit =
                      Array.isArray(uoms) && field.value ? uoms.find(u => String(u.id) === String(field.value)) : null

                    return (
                      <GlobalAutocomplete
                        label='Unit'
                        options={uoms}
                        value={
                          selectedUnit
                            ? {
                                ...selectedUnit,
                                label: selectedUnit.name,
                                value: selectedUnit.id
                              }
                            : null
                        }
                        onChange={val => field.onChange(val?.value ? String(val.value) : '')}
                        disableClearable
                        onBlur={field.onBlur}
                        error={!!errors.unit}
                        helperText={errors.unit?.message}
                        fullWidth
                      />
                    )
                  }}
                />
              </Grid>

              {/* Dosage */}
              <Grid item xs={12}>
                <Controller
                  name='dosage'
                  control={control}
                  render={({ field }) => (
                    <GlobalTextField
                      {...field}
                      value={field.value ?? ''}
                      onChange={e => field.onChange(String(e.target.value).replace(/\D/g, ''))}
                      label='Dosage'
                      fullWidth
                      required
                      placeholder='Enter The Dosage'
                      error={!!errors.dosage}
                      helperText={errors.dosage?.message}
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

              {/* Ingredients */}
              <Grid item xs={12}>
                <Controller
                  name='ingredients'
                  control={control}
                  render={({ field }) => (
                    <GlobalTextarea
                      {...field}
                      label='Ingredients'
                      required
                      placeholder='Ingredients'
                      minRows={3}
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

              {/* File Upload */}
              <Grid item xs={12}>
                <Grid item xs={12}>
                  <Box
                    sx={{
                      border: '1px dashed #ccc',
                      borderRadius: '8px',
                      p: 3,
                      textAlign: 'center',
                      bgcolor: '#fafafa',
                      transition: '0.2s',
                      '&:hover': { borderColor: 'primary.main' }
                    }}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => {
                      e.preventDefault()
                      const file = e.dataTransfer.files[0]
                      if (file) {
                        setSelectedFile(file.name)
                        setValue('file', file)
                      }
                    }}
                  >
                    <UploadFileIcon sx={{ fontSize: 45, color: 'primary.main', mb: 1 }} />

                    <Typography sx={{ fontWeight: 600, color: '#5e5873', mb: 1 }}>
                      Drag & Drop your file here
                    </Typography>

                    <Typography sx={{ fontSize: '0.85rem', color: '#6e6b7b', mb: 2 }}>or</Typography>

                    <GlobalButton
                      variant='contained'
                      sx={{
                        textTransform: 'none',
                        backgroundColor: 'primary.main',
                        borderRadius: '6px',
                        px: 3,
                        py: 1,
                        '&:hover': { backgroundColor: 'primary.dark' }
                      }}
                      onClick={() => {
                        fileInputRef.current?.click()
                      }}
                    >
                      Browse
                    </GlobalButton>

                    {selectedFile && (
                      <Typography
                        sx={{
                          mt: 2,
                          fontSize: '0.85rem',
                          fontWeight: 500,
                          color: 'primary.main'
                        }}
                      >
                        {selectedFile}
                      </Typography>
                    )}
                  </Box>
                </Grid>

                <input
                  type='file'
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={e => {
                    const file = e.target.files[0]
                    if (file) {
                      setSelectedFile(file.name)
                      setValue('file', file)
                    }
                  }}
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
                        fullWidth
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
        {/* 🔴 Title with Warning Icon + Close Button */}
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
          {/* ❌ TOP-RIGHT CLOSE ICON */}
          <DialogCloseButton onClick={() => setDeleteDialog({ open: false, row: null })} disableRipple>
            <i className='tabler-x' />
          </DialogCloseButton>
        </DialogTitle>

        {/* Content */}
        <DialogContent sx={{ px: 5, pt: 1 }}>
          <Typography sx={{ color: 'text.secondary', fontSize: 14, lineHeight: 1.6 }}>
            Are you sure you want to delete{' '}
            <strong style={{ color: '#d32f2f' }}>{deleteDialog.row?.name || 'this Chemical'}</strong>
            ?
            <br />
            This action cannot be undone.
          </Typography>
        </DialogContent>

        {/* Footer */}
        <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 3, pt: 2 }}>
          <GlobalButton
            color='secondary'
            onClick={() => setDeleteDialog({ open: false, row: null })}
            sx={{ minWidth: 100, textTransform: 'none', fontWeight: 500 }}
          >
            Cancel
          </GlobalButton>

          <GlobalButton
            onClick={confirmDelete}
            variant='contained'
            color='error'
            disabled={loading}
            sx={{ minWidth: 100, textTransform: 'none', fontWeight: 600 }}
          >
            {loading ? 'Deleting...' : 'Delete'}
          </GlobalButton>
        </DialogActions>
      </Dialog>

      {/* 🖼️ Image View Dialog */}
      <Dialog
        onClose={() => setImgDialogOpen(false)}
        aria-labelledby='image-view-title'
        open={imgDialogOpen}
        closeAfterTransition={false}
        maxWidth='md'
        PaperProps={{ sx: { overflow: 'visible' } }}
      >
        <DialogTitle id='image-view-title'>
          <Typography variant='h5' component='span'>
            Chemical Image
          </Typography>
          <DialogCloseButton onClick={() => setImgDialogOpen(false)} disableRipple>
            <i className='tabler-x' />
          </DialogCloseButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, display: 'flex', justifyContent: 'center', bgcolor: '#f8f8f8' }}>
          {imgUrl ? (
            <img
              src={imgUrl}
              alt='Chemical Full View'
              style={{ maxWidth: '100%', maxHeight: '70vh', display: 'block' }}
            />
          ) : (
            <Typography sx={{ p: 10 }}>No image available</Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 4 }}>
          <GlobalButton onClick={() => setImgDialogOpen(false)} variant='tonal' color='secondary'>
            Close
          </GlobalButton>
        </DialogActions>
      </Dialog>
    </StickyListLayout>
  )
}

export default function ChemicalsListPage() {
  return (
    <PermissionGuard permission='Chemicals'>
      <ChemicalsPageContent />
    </PermissionGuard>
  )
}
