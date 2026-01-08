'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import {
  Box,
  Card,
  CardHeader,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Grid,
  TextField,
  MenuItem,
  InputAdornment,
  Divider,
  Breadcrumbs,
  Menu,
  FormControl,
  Chip,
  Select,
  IconButton
} from '@mui/material'

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table'

import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import DialogCloseButton from '@components/dialogs/DialogCloseButton'

import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import AddIcon from '@mui/icons-material/Add'
import PrintIcon from '@mui/icons-material/Print'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import TableChartIcon from '@mui/icons-material/TableChart'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import FileCopyIcon from '@mui/icons-material/FileCopy'
import SearchIcon from '@mui/icons-material/Search'
import RefreshIcon from '@mui/icons-material/Refresh'

import styles from '@core/styles/table.module.css'
import PermissionGuard from '@/components/auth/PermissionGuard'
import ChevronRight from '@menu/svg/ChevronRight'
import StickyListLayout from '@/components/common/StickyListLayout'
import StickyTableWrapper from '@/components/common/StickyTableWrapper'
import TablePaginationComponent from '@/components/TablePaginationComponent'
import GlobalButton from '@/components/common/GlobalButton'
import ProgressCircularCustomization from '@/components/common/ProgressCircularCustomization'
import GlobalAutocomplete from '@/components/common/GlobalAutocomplete'
import { showToast } from '@/components/common/Toasts'

// ✅ API
import { getProposalItemList, getPestList } from '@/api/proposal_item'
import { encodeId } from '@/utils/urlEncoder'

const ProposalItemPage = () => {
  // ---------------- STATE ----------------
  const [filters, setFilters] = useState({
    type: '',
    pest: '',
    search: ''
  })

  const [rows, setRows] = useState([])
  const [rowCount, setRowCount] = useState(0)
  const [sorting, setSorting] = useState([])
  const columnHelper = createColumnHelper()
  const router = useRouter()

  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    row: null
  })

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 50
  })

  const confirmDelete = async () => {
    try {
      const id = deleteDialog.row?.id
      if (!id) return

      // 🔥 call your delete API here
      // await deleteProposalItem(id)

      showToast('success', 'Proposal item deleted successfully')

      setDeleteDialog({ open: false, row: null })
      loadData() // refresh table
    } catch (error) {
      showToast('error', 'Failed to delete proposal item')
    }
  }

  // ---------------- COLUMNS ----------------
  const columns = useMemo(
    () => [
      columnHelper.accessor('sno', {
        header: 'S.No',
        cell: info => <Typography color='text.primary'>{info.row.original.sno}</Typography>
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        size: 100,
        enableSorting: false,
        cell: ({ row }) => {
          const encodedId = encodeId(row.original.id)

          return (
            <Box sx={{ display: 'flex', gap: 1 }}>
              {/* EDIT */}
              <IconButton
                size='small'
                color='primary'
                onClick={() => router.push(`/admin/proposal-item/${encodedId}/edit`)}
              >
                <i className='tabler-edit' />
              </IconButton>

              {/* DELETE */}
              <IconButton size='small' color='error' onClick={() => setDeleteDialog({ open: true, row: row.original })}>
                <i className='tabler-trash text-red-600 text-lg' />
              </IconButton>
            </Box>
          )
        }
      }),
      columnHelper.accessor('pest', {
        header: 'Pest',
        cell: info => <Typography>{info.getValue() || '-'}</Typography>
      }),
      columnHelper.accessor('name', {
        header: 'Title',
        cell: info => <Typography>{info.getValue() || '-'}</Typography>
      }),
      columnHelper.accessor('content_position', {
        header: 'Position',
        cell: info => <Typography sx={{ textTransform: 'capitalize' }}>{info.getValue() || '-'}</Typography>
      }),
      columnHelper.accessor('is_default', {
        header: 'Is Default',
        cell: info => <Typography>{info.getValue() ? 'Yes' : 'No'}</Typography>
      }),
      columnHelper.accessor('sort_order', {
        header: 'Sort Order',
        cell: info => <Typography>{info.getValue()}</Typography>
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: info => {
          const isActive = info.getValue() === 1

          return (
            <Chip
              label={isActive ? 'Active' : 'Inactive'}
              color={isActive ? 'success' : 'error'}
              size='small'
              variant='filled' // or 'outlined' if you want
            />
          )
        }
      })
    ],
    [pagination.pageIndex, pagination.pageSize]
  )

  const [loading, setLoading] = useState(false)
  const [exportAnchorEl, setExportAnchorEl] = useState(null)
  const [pestOptions, setPestOptions] = useState([])
  const [pestLoading, setPestLoading] = useState(false)

  const loadPestOptions = async () => {
    setPestLoading(true)
    try {
      const res = await getPestList()

      // ✅ EXACT API PATH (IMPORTANT)
      const list = res?.data?.data?.pest?.name || []

      const mapped = list.map(p => ({
        label: p.name, // 👈 UI show
        value: p.id // 👈 backend filter
      }))

      setPestOptions(mapped)
    } catch (err) {
      console.error(err)
      showToast('error', 'Failed to load pest list')
    } finally {
      setPestLoading(false)
    }
  }

  useEffect(() => {
    loadPestOptions()
  }, [])

  // ---------------- API CALL ----------------
  const loadData = async () => {
    setLoading(true)
    try {
      const params = {
        page: pagination.pageIndex + 1,
        page_size: pagination.pageSize,
        search: filters.search || undefined,
        type: filters.type || undefined,
        pest: filters.pest || undefined
      }

      const res = await getProposalItemList(params)

      // 🔥 Extract list from res.data.results (per screenshot)
      const list = res?.data?.results || res?.results || res?.data || []
      const safeList = Array.isArray(list) ? list : []

      // Add S.No
      const dataWithSno = safeList.map((row, index) => ({
        ...row,
        sno: pagination.pageIndex * pagination.pageSize + index + 1
      }))

      setRows(dataWithSno)
      setRowCount(res?.data?.count || res?.count || safeList.length)
    } catch (err) {
      showToast('error', 'Failed to load Proposal Items')
    } finally {
      setLoading(false)
    }
  }

  // ---------------- EFFECT ----------------
  // 1. When filters change, reset back to page 1
  useEffect(() => {
    setPagination(p => ({ ...p, pageIndex: 0 }))
  }, [filters.type, filters.pest, filters.search])

  // Helper to trigger effects only when pagination or filters change
  const appliedFiltersSync = `${filters.type}-${filters.pest}-${filters.search}`

  // 2. Load data when page or filters change
  useEffect(() => {
    loadData()
  }, [pagination.pageIndex, pagination.pageSize, appliedFiltersSync])

  const table = useReactTable({
    data: rows,
    columns,
    state: {
      pagination,
      sorting
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(), // ✅ needed for UI state
    manualPagination: true,
    pageCount: Math.ceil(rowCount / pagination.pageSize)
  })

  // ---------------- HANDLERS ----------------
  const handleRefresh = () => {
    setPagination(p => ({ ...p, pageIndex: 0 }))
    loadData()
  }

  const exportOpen = Boolean(exportAnchorEl)

  // ---------------- RENDER ----------------
  return (
    <PermissionGuard permission='Proposal Item'>
      <StickyListLayout
        header={
          <Breadcrumbs sx={{ mb: 2 }}>
            <Link href='/'>Home</Link>
            <Typography color='text.secondary'>Sales</Typography>
            <Typography color='text.primary'>Proposal Item</Typography>
          </Breadcrumbs>
        }
      >
        <Card sx={{ display: 'flex', flexDirection: 'column', maxHeight: '100%' }}>
          {/* ================= HEADER ================= */}
          <CardHeader
            title={
              <Box display='flex' alignItems='center' gap={2}>
                <Typography variant='h5' fontWeight={600}>
                  Proposal Item
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
                  onClick={handleRefresh}
                  disabled={loading}
                >
                  Refresh
                </GlobalButton>
              </Box>
            }
            action={
              <Box display='flex' gap={2}>
                <GlobalButton
                  color='secondary'
                  endIcon={<ArrowDropDownIcon />}
                  onClick={e => setExportAnchorEl(e.currentTarget)}
                >
                  Export
                </GlobalButton>

                <Menu anchorEl={exportAnchorEl} open={exportOpen} onClose={() => setExportAnchorEl(null)}>
                  <MenuItem>
                    <PrintIcon sx={{ mr: 1 }} /> Print
                  </MenuItem>
                  <MenuItem>
                    <FileDownloadIcon sx={{ mr: 1 }} /> CSV
                  </MenuItem>
                  <MenuItem>
                    <TableChartIcon sx={{ mr: 1 }} /> Excel
                  </MenuItem>
                  <MenuItem>
                    <PictureAsPdfIcon sx={{ mr: 1 }} /> PDF
                  </MenuItem>
                  <MenuItem>
                    <FileCopyIcon sx={{ mr: 1 }} /> Copy
                  </MenuItem>
                </Menu>

                <GlobalButton
                  variant='contained'
                  startIcon={<AddIcon />}
                  onClick={() => router.push('/admin/proposal-item/add')}
                >
                  Add Proposal Content
                </GlobalButton>
              </Box>
            }
          />

          <Divider />

          {/* ================= BODY ================= */}
          <Box sx={{ p: 4, flexGrow: 1, position: 'relative' }}>
            {loading && (
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  bgcolor: 'rgba(255,255,255,0.7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10
                }}
              >
                <ProgressCircularCustomization size={60} />
              </Box>
            )}

            {/* ---------- FILTERS ---------- */}
            <Grid container spacing={3} mb={4}>
              <Grid item xs={12} md={3}>
                <GlobalAutocomplete
                  label='Type'
                  placeholder='Select Type'
                  options={[
                    { label: 'MASTER', value: 'MASTER' },
                    { label: 'PEST', value: 'PEST' }
                  ]}
                  value={filters.type ? { label: filters.type, value: filters.type } : null}
                  isOptionEqualToValue={(a, b) => a?.value === b?.value}
                  getOptionLabel={opt => opt?.label || ''}
                  onChange={val =>
                    setFilters(f => ({
                      ...f,
                      type: val?.value || '',
                      pest: '' // 🔥 reset pest when type changes
                    }))
                  }
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <GlobalAutocomplete
                  label='Pest'
                  placeholder='Select Pest'
                  options={pestOptions}
                  loading={pestLoading}
                  value={filters.pest ? pestOptions.find(p => p.value === filters.pest) || null : null}
                  isOptionEqualToValue={(a, b) => a?.value === b?.value}
                  getOptionLabel={o => o?.label || ''}
                  onChange={v =>
                    setFilters(f => ({
                      ...f,
                      pest: v?.value || ''
                    }))
                  }
                  disabled={filters.type !== 'PEST'} // 🔥 UX best practice
                />
              </Grid>
            </Grid>

            <Divider sx={{ mb: 3 }} />

            {/* ---------- TABLE ACTIONS ---------- */}
            <Box display='flex' justifyContent='space-between' mb={2}>
              <FormControl size='small' sx={{ width: 140 }}>
                <Select
                  value={pagination.pageSize}
                  onChange={e =>
                    setPagination(p => ({
                      ...p,
                      pageSize: Number(e.target.value),
                      pageIndex: 0
                    }))
                  }
                >
                  {[25, 50, 75, 100].map(v => (
                    <MenuItem key={v} value={v}>
                      {v} entries
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                size='small'
                placeholder='Search...'
                value={filters.search}
                onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position='start'>
                      <SearchIcon />
                    </InputAdornment>
                  )
                }}
              />
            </Box>

            {/* ---------- TABLE ---------- */}
            <Box sx={{ position: 'relative', flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
              <StickyTableWrapper rowCount={rows.length}>
                <table className={styles.table}>
                  <thead>
                    {table.getHeaderGroups().map(headerGroup => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map(header => (
                          <th key={header.id}>
                            <Box
                              onClick={header.column.getToggleSortingHandler()}
                              sx={{
                                cursor: header.column.getCanSort() ? 'pointer' : 'default',
                                display: 'flex',
                                alignItems: 'center',
                                userSelect: 'none',
                                gap: 1
                              }}
                            >
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              {header.column.getIsSorted() && (
                                <i
                                  className={
                                    header.column.getIsSorted() === 'asc' ? 'tabler-chevron-up' : 'tabler-chevron-down'
                                  }
                                />
                              )}
                            </Box>
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
                        <td colSpan={columns.length} align='center'>
                          No data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </StickyTableWrapper>
            </Box>

            {/* Delete Confirmation Dialog */}
            {/* Delete Confirmation Dialog */}
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
                {/* Close button (top right) */}
                <DialogCloseButton
                  onClick={() => setDeleteDialog({ open: false, row: null })}
                  disableRipple
                  sx={{ position: 'absolute', right: 3, top: 2 }}
                >
                  <i className='tabler-x' />
                </DialogCloseButton>
              </DialogTitle>

              <DialogContent sx={{ px: 5, pt: 1 }}>
                <Typography sx={{ color: 'text.secondary', fontSize: 14, lineHeight: 1.6 }}>
                  Are you sure you want to delete{' '}
                  <strong style={{ color: '#d32f2f' }}>{deleteDialog.row?.name || 'this proposal item'}</strong>
                  ?
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

            {/* ---------- PAGINATION ---------- */}
            <Box mt={2}>
              <TablePaginationComponent totalCount={rowCount} pagination={pagination} setPagination={setPagination} />
            </Box>
          </Box>
        </Card>
      </StickyListLayout>
    </PermissionGuard>
  )
}

export default ProposalItemPage
