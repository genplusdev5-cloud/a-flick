'use client'

import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  Box,
  Card,
  CardHeader,
  Typography,
  IconButton,
  Divider,
  Drawer,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Breadcrumbs,
  Chip,
  TextField,
  MenuItem,
  Menu,
  Select,
  FormControl
} from '@mui/material'

import PermissionGuard from '@/components/auth/PermissionGuard'
import { usePermission } from '@/hooks/usePermission'

import AddIcon from '@mui/icons-material/Add'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import RefreshIcon from '@mui/icons-material/Refresh'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import PrintIcon from '@mui/icons-material/Print'

import GlobalButton from '@/components/common/GlobalButton'
import DialogCloseButton from '@components/dialogs/DialogCloseButton'
import CustomTextField from '@core/components/mui/TextField'
import TablePaginationComponent from '@/components/TablePaginationComponent'
import StickyTableWrapper from '@/components/common/StickyTableWrapper'
import StickyListLayout from '@/components/common/StickyListLayout'

import { showToast } from '@/components/common/Toasts'
import classnames from 'classnames'
import { useReactTable, getCoreRowModel, flexRender, createColumnHelper } from '@tanstack/react-table'
import styles from '@core/styles/table.module.css'

import { getVehicleList, addVehicle, updateVehicle, deleteVehicle } from '@/api/purchase/vehicle'

/* ---------------- Debounced Search ---------------- */
const DebouncedInput = ({ value: initialValue, onChange, debounce = 500, ...props }) => {
  const [value, setValue] = useState(initialValue)
  useEffect(() => setValue(initialValue), [initialValue])
  useEffect(() => {
    const t = setTimeout(() => onChange(value), debounce)
    return () => clearTimeout(t)
  }, [value])
  return <TextField {...props} value={value} onChange={e => setValue(e.target.value)} />
}

/* ================== MAIN COMPONENT ================== */
const VehiclePageContent = () => {
  const { canAccess } = usePermission()

  /* ---------- STATE ---------- */
  const [rows, setRows] = useState([])
  const [rowCount, setRowCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 })

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, row: null })
  const [exportAnchorEl, setExportAnchorEl] = useState(null)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const [formData, setFormData] = useState({
    id: null,
    vehicle_name: '',
    description: '',
    is_active: 1
  })

  const nameRef = useRef(null)

  /* ---------- LOAD DATA ---------- */
  const fetchVehicles = useCallback(async () => {
    try {
      setLoading(true)
      const res = await getVehicleList({
        page: pagination.pageIndex + 1,
        page_size: pagination.pageSize,
        search: searchText
      })

      const data = res?.data || res
      const results = data?.results || []

      setRows(
        results.map((r, i) => ({
          ...r,
          sno: pagination.pageIndex * pagination.pageSize + i + 1,
          is_active: r.is_active ?? (r.status === 'Active' ? 1 : 0) // Compatibility
        }))
      )
      setRowCount(data?.count || 0)
    } catch (err) {
      showToast('error', 'Failed to fetch vehicles')
    } finally {
      setLoading(false)
    }
  }, [pagination, searchText])

  useEffect(() => {
    fetchVehicles()
  }, [fetchVehicles])

  /* ---------- ACTIONS ---------- */
  const handleAdd = () => {
    setIsEdit(false)
    setFormData({ id: null, vehicle_name: '', description: '', is_active: 1 })
    setDrawerOpen(true)
    setTimeout(() => nameRef.current?.focus(), 100)
  }

  const handleEdit = row => {
    setIsEdit(true)
    setFormData({
      id: row.id,
      vehicle_name: row.vehicle_name || row.name || '',
      description: row.description || '',
      is_active: row.is_active ?? (row.status === 'Inactive' ? 0 : 1)
    })
    setDrawerOpen(true)
  }

  const confirmDelete = async () => {
    if (!deleteDialog.row?.id) return
    try {
      setDeleteLoading(true)
      await deleteVehicle(deleteDialog.row.id)
      showToast('success', 'Vehicle deleted successfully')
      setDeleteDialog({ open: false, row: null })
      fetchVehicles()
    } catch (err) {
      showToast('error', err?.response?.data?.message || 'Delete failed')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleSubmit = async e => {
    e.preventDefault()

    // Validate
    const vName = formData.vehicle_name?.trim()
    if (!vName) {
      showToast('warning', 'Please enter vehicle name')
      return
    }

    try {
      setSubmitLoading(true)

      // ✅ Payload standardization: send both 'vehicle_name' and 'name'
      // Many backend modules expecting one or the other, sending both avoids "missing" errors.
      const payload = {
        name: vName,
        vehicle_name: vName,
        description: formData.description?.trim() || '',
        is_active: Number(formData.is_active),
        status: 1 // 🔥 THIS FIXES THE DELETE ISSUE
      }

      if (isEdit) {
        await updateVehicle({ ...payload, id: formData.id })
        showToast('success', 'Vehicle updated successfully')
      } else {
        const res = await addVehicle(payload)

        // Secondary check for cases where status 200 is returned with an error message
        if (res?.status === 'missing' || res?.status === 'failed') {
          showToast('error', res.message || 'Validation failed')
          return
        }

        showToast('success', 'Vehicle added successfully')
      }

      setDrawerOpen(false)
      fetchVehicles()
    } catch (err) {
      showToast('error', err?.response?.data?.message || 'Save failed')
    } finally {
      setSubmitLoading(false)
    }
  }

  /* ---------- EXPORT ---------- */
  const exportCSV = () => {
    const headers = ['S.No', 'Vehicle Name', 'Description', 'Status']
    const csv = [
      headers.join(','),
      ...rows.map(r =>
        [r.sno, r.vehicle_name || r.name, `"${r.description || ''}"`, r.is_active === 1 ? 'Active' : 'Inactive'].join(
          ','
        )
      )
    ].join('\n')
    const link = document.createElement('a')
    link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    link.download = 'Vehicles.csv'
    link.click()
    setExportAnchorEl(null)
    showToast('success', 'CSV downloaded')
  }

  const exportPrint = () => {
    const w = window.open('', '_blank')
    const html = `<html><body><table><thead><tr><th>S.No</th><th>Vehicle Name</th><th>Description</th><th>Status</th></tr></thead><tbody>${rows.map(r => `<tr><td>${r.sno}</td><td>${r.vehicle_name || r.name}</td><td>${r.description || ''}</td><td>${r.is_active === 1 ? 'Active' : 'Inactive'}</td></tr>`).join('')}</tbody></table></body></html>`
    w.document.write(html)
    w.document.close()
    w.print()
    setExportAnchorEl(null)
  }

  /* ---------- TABLE ---------- */
  const columnHelper = createColumnHelper()

  const columns = useMemo(
    () => [
      columnHelper.accessor('sno', { header: 'S.No' }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: info => (
          <Box sx={{ display: 'flex', gap: 1 }}>
            {canAccess('Vehicle', 'update') && (
              <IconButton size='small' color='primary' onClick={() => handleEdit(info.row.original)}>
                <i className='tabler-edit' />
              </IconButton>
            )}
            {canAccess('Vehicle', 'delete') && (
              <IconButton
                size='small'
                color='error'
                onClick={() => setDeleteDialog({ open: true, row: info.row.original })}
              >
                <i className='tabler-trash' />
              </IconButton>
            )}
          </Box>
        )
      }),
      columnHelper.accessor('vehicle_name', {
        header: 'Vehicle Name',
        cell: info => info.getValue() || info.row.original.name || '-'
      }),
      columnHelper.accessor('description', { header: 'Description' }),
      columnHelper.accessor('is_active', {
        header: 'Status',
        cell: info => {
          const val = info.getValue()
          const isActive = val === 1 || val === true || val === '1'
          return <Chip label={isActive ? 'Active' : 'Inactive'} size='small' color={isActive ? 'success' : 'error'} />
        }
      })
    ],
    [canAccess]
  )

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel()
  })

  /* ================== RENDER ================== */
  return (
    <StickyListLayout
      header={
        <Breadcrumbs>
          <Link href='/'>Home</Link>
          <Typography>Vehicle</Typography>
        </Breadcrumbs>
      }
    >
      <Card>
        <CardHeader
          title={
            <Box display='flex' alignItems='center' gap={2}>
              <Typography variant='h5' sx={{ fontWeight: 600 }}>
                Vehicle List
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
                  await fetchVehicles()
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
                <MenuItem onClick={exportCSV}>
                  <FileDownloadIcon fontSize='small' sx={{ mr: 1 }} /> CSV
                </MenuItem>
                <MenuItem onClick={exportPrint}>
                  <PrintIcon fontSize='small' sx={{ mr: 1 }} /> Print
                </MenuItem>
              </Menu>
              <GlobalButton startIcon={<AddIcon />} onClick={handleAdd}>
                Add Vehicle
              </GlobalButton>
            </Box>
          }
        />
        <Divider />

        <Box p={4}>
          <Box
            sx={{
              mb: 3,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 2,
              flexShrink: 0
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant='body2' color='text.secondary'>
                Show
              </Typography>
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
            </Box>

            <DebouncedInput
              value={searchText}
              onChange={val => {
                setSearchText(val)
                setPagination(prev => ({ ...prev, pageIndex: 0 }))
              }}
              placeholder='Search vehicle...'
              sx={{ width: 360 }}
              variant='outlined'
              size='small'
            />
          </Box>

          <StickyTableWrapper rowCount={rows.length}>
            <table className={styles.table}>
              <thead>
                {table.getHeaderGroups().map(hg => (
                  <tr key={hg.id}>
                    {hg.headers.map(h => (
                      <th key={h.id}>{flexRender(h.column.columnDef.header, h.getContext())}</th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} align='center' style={{ padding: '24px' }}>
                      No vehicles found.
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
          </StickyTableWrapper>

          <TablePaginationComponent totalCount={rowCount} pagination={pagination} setPagination={setPagination} />
        </Box>
      </Card>

      {/* DRAWER */}
      <Drawer anchor='right' open={drawerOpen} onClose={() => !submitLoading && setDrawerOpen(false)}>
        <Box p={4} width={420} position='relative'>
          <IconButton
            size='small'
            onClick={() => setDrawerOpen(false)}
            sx={{ position: 'absolute', top: 16, right: 16 }}
            disabled={submitLoading}
          >
            <i className='tabler-x' />
          </IconButton>

          <Typography variant='h5' mb={3} sx={{ fontWeight: 600 }}>
            {isEdit ? 'Edit Vehicle' : 'Add Vehicle'}
          </Typography>

          <form onSubmit={handleSubmit}>
            <CustomTextField
              fullWidth
              label=' Name'
              placeholder='Enter vehicle name'
              value={formData.vehicle_name}
              inputRef={nameRef}
              onChange={e => setFormData({ ...formData, vehicle_name: e.target.value })}
              required
              disabled={submitLoading}
              sx={{ mb: 4 }}
            />

            <CustomTextField
              fullWidth
              multiline
              rows={3}
              label='Description'
              placeholder='Enter description'
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              sx={{ mb: 4 }}
              disabled={submitLoading}
            />

            {isEdit && (
              <CustomTextField
                select
                fullWidth
                label='Status'
                value={formData.is_active}
                onChange={e => setFormData({ ...formData, is_active: Number(e.target.value) })}
                sx={{ mb: 4 }}
                disabled={submitLoading}
              >
                <MenuItem value={1}>Active</MenuItem>
                <MenuItem value={0}>Inactive</MenuItem>
              </CustomTextField>
            )}

            <Box mt={4} display='flex' gap={2}>
              <GlobalButton fullWidth color='secondary' onClick={() => setDrawerOpen(false)} disabled={submitLoading}>
                Cancel
              </GlobalButton>
              <GlobalButton type='submit' fullWidth variant='contained' disabled={submitLoading}>
                {isEdit ? 'Update' : 'Save'}
              </GlobalButton>
            </Box>
          </form>
        </Box>
      </Drawer>

      {/* DELETE DIALOG */}
      <Dialog
        onClose={() => !deleteLoading && setDeleteDialog({ open: false, row: null })}
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
            onClick={() => !deleteLoading && setDeleteDialog({ open: false, row: null })}
            disableRipple
          >
            <i className='tabler-x' />
          </DialogCloseButton>
        </DialogTitle>
        <DialogContent sx={{ px: 5, pt: 1 }}>
          <Typography sx={{ color: 'text.secondary', fontSize: 14, lineHeight: 1.6 }}>
            Are you sure you want to delete{' '}
            <strong style={{ color: '#d32f2f' }}>{deleteDialog.row?.vehicle_name || deleteDialog.row?.name}</strong>?
            <br />
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 3, pt: 2 }}>
          <GlobalButton
            color='secondary'
            onClick={() => setDeleteDialog({ open: false, row: null })}
            sx={{ minWidth: 100, textTransform: 'none', fontWeight: 500 }}
            disabled={deleteLoading}
          >
            Cancel
          </GlobalButton>
          <GlobalButton
            color='error'
            variant='contained'
            onClick={confirmDelete}
            disabled={deleteLoading}
            sx={{ minWidth: 100, textTransform: 'none', fontWeight: 500 }}
          >
            {deleteLoading ? 'Deleting...' : 'Delete'}
          </GlobalButton>
        </DialogActions>
      </Dialog>
    </StickyListLayout>
  )
}

/* ================== RBAC WRAPPER ================== */
export default function VehiclePage() {
  return (
    <PermissionGuard permission='Vehicle'>
      <VehiclePageContent />
    </PermissionGuard>
  )
}
