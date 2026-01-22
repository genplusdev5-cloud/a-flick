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
  Select,
  FormControl
} from '@mui/material'

import PermissionGuard from '@/components/auth/PermissionGuard'
import { usePermission } from '@/hooks/usePermission'

import AddIcon from '@mui/icons-material/Add'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import CloseIcon from '@mui/icons-material/Close'
import PrintIcon from '@mui/icons-material/Print'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import RefreshIcon from '@mui/icons-material/Refresh'
import TableChartIcon from '@mui/icons-material/TableChart'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import FileCopyIcon from '@mui/icons-material/FileCopy'

import GlobalButton from '@/components/common/GlobalButton'
import DialogCloseButton from '@components/dialogs/DialogCloseButton'
import CustomTextField from '@core/components/mui/TextField'
import TablePaginationComponent from '@/components/TablePaginationComponent'
import StickyTableWrapper from '@/components/common/StickyTableWrapper'
import StickyListLayout from '@/components/common/StickyListLayout'

import { showToast } from '@/components/common/Toasts'
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
import ChevronRight from '@menu/svg/ChevronRight'

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

  /* ---------- LOCAL MOCK DATA ---------- */
  const [allRows, setAllRows] = useState([
    { id: 1, vehicle_name: 'TN09 AB 1234', description: 'Tata Ace', status: 'Active' },
    { id: 2, vehicle_name: 'TN10 XY 5678', description: 'Ashok Leyland', status: 'Inactive' }
  ])

  const [rows, setRows] = useState([])
  const [rowCount, setRowCount] = useState(0)
  const [searchText, setSearchText] = useState('')
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, row: null })
  const [exportAnchorEl, setExportAnchorEl] = useState(null)

  const [formData, setFormData] = useState({
    id: null,
    vehicle_name: '',
    description: '',
    status: 'Active'
  })

  const nameRef = useRef(null)

  /* ---------- LOAD DATA ---------- */
  const loadData = () => {
    let filtered = allRows.filter(
      r =>
        r.vehicle_name.toLowerCase().includes(searchText.toLowerCase()) ||
        r.description.toLowerCase().includes(searchText.toLowerCase())
    )

    const start = pagination.pageIndex * pagination.pageSize
    const end = start + pagination.pageSize

    const pageRows = filtered.slice(start, end).map((r, i) => ({
      ...r,
      sno: start + i + 1
    }))

    setRows(pageRows)
    setRowCount(filtered.length)
  }

  useEffect(() => {
    loadData()
  }, [allRows, pagination, searchText])

  /* ---------- ACTIONS ---------- */
  const handleAdd = () => {
    setIsEdit(false)
    setFormData({ id: null, vehicle_name: '', description: '', status: 'Active' })
    setDrawerOpen(true)
    setTimeout(() => nameRef.current?.focus(), 100)
  }

  const handleEdit = row => {
    setIsEdit(true)
    setFormData(row)
    setDrawerOpen(true)
  }

  const handleDelete = () => {
    setAllRows(prev => prev.filter(r => r.id !== deleteDialog.row.id))
    setDeleteDialog({ open: false, row: null })
    showToast('delete', 'Vehicle deleted')
  }

  const handleSubmit = e => {
    e.preventDefault()

    if (isEdit) {
      setAllRows(prev => prev.map(r => (r.id === formData.id ? formData : r)))
      showToast('success', 'Vehicle updated')
    } else {
      setAllRows(prev => [
        { ...formData, id: Date.now() },
        ...prev
      ])
      showToast('success', 'Vehicle added')
    }

    setDrawerOpen(false)
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
              <IconButton size='small' onClick={() => handleEdit(info.row.original)}>
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
      columnHelper.accessor('vehicle_name', { header: 'Vehicle Name' }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: info => (
          <Chip
            label={info.getValue()}
            size='small'
            color={info.getValue() === 'Active' ? 'success' : 'error'}
          />
        )
      })
    ],
    []
  )

  const table = useReactTable({
    data: rows,
    columns,
    state: { globalFilter: searchText, pagination },
    onGlobalFilterChange: setSearchText,
    onPaginationChange: setPagination,
    globalFilterFn: (row, columnId, value, addMeta) => {
      const itemRank = rankItem(row.getValue(columnId), value)
      addMeta({ itemRank })
      return itemRank.passed
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel()
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
          title='Vehicle'
          action={
            <GlobalButton startIcon={<AddIcon />} onClick={handleAdd}>
              Add Vehicle
            </GlobalButton>
          }
        />
        <Divider />

        <Box p={4}>
          <DebouncedInput
            value={searchText}
            onChange={setSearchText}
            placeholder='Search vehicle...'
            size='small'
            sx={{ mb: 2, width: 300 }}
          />

          <StickyTableWrapper rowCount={rows.length}>
            <table className={styles.table}>
              <thead>
                {table.getHeaderGroups().map(hg => (
                  <tr key={hg.id}>
                    {hg.headers.map(h => (
                      <th key={h.id}>
                        {flexRender(h.column.columnDef.header, h.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map(row => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </StickyTableWrapper>

          <TablePaginationComponent
            totalCount={rowCount}
            pagination={pagination}
            setPagination={setPagination}
          />
        </Box>
      </Card>

      {/* DRAWER */}
      <Drawer anchor='right' open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box p={4} width={400}>
          <Typography variant='h5' mb={3}>
            {isEdit ? 'Edit Vehicle' : 'Add Vehicle'}
          </Typography>

          <form onSubmit={handleSubmit}>
            <CustomTextField
              fullWidth
              label='Vehicle Name'
              value={formData.vehicle_name}
              inputRef={nameRef}
              onChange={e => setFormData({ ...formData, vehicle_name: e.target.value })}
              required
            />

            <CustomTextField
              fullWidth
              multiline
              rows={3}
              label='Description'
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              sx={{ mt: 2 }}
            />

            <CustomTextField
              select
              fullWidth
              label='Status'
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value })}
              sx={{ mt: 2 }}
            >
              <MenuItem value='Active'>Active</MenuItem>
              <MenuItem value='Inactive'>Inactive</MenuItem>
            </CustomTextField>

            <Box mt={3} display='flex' gap={2}>
              <GlobalButton fullWidth color='secondary' onClick={() => setDrawerOpen(false)}>
                Cancel
              </GlobalButton>
              <GlobalButton type='submit' fullWidth>
                Save
              </GlobalButton>
            </Box>
          </form>
        </Box>
      </Drawer>

      {/* DELETE DIALOG */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, row: null })}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Delete <strong>{deleteDialog.row?.vehicle_name}</strong>?
        </DialogContent>
        <DialogActions>
          <GlobalButton onClick={() => setDeleteDialog({ open: false, row: null })}>
            Cancel
          </GlobalButton>
          <GlobalButton color='error' onClick={handleDelete}>
            Delete
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
