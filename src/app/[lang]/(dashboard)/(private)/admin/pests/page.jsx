'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { openDB } from 'idb'
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
  Autocomplete,
  FormControl,
  Select,
  CircularProgress,
  InputAdornment
} from '@mui/material'

// ADD THIS LINE (after other imports)
import CustomTextFieldWrapper from '@/components/common/CustomTextField'
import CustomTextarea from '@/components/common/CustomTextarea'
import CustomSelectField from '@/components/common/CustomSelectField'



import DialogCloseButton from '@components/dialogs/DialogCloseButton'
import ProgressCircularCustomization from '@/components/common/ProgressCircularCustomization'
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

// ───────────────────────────────────────────
// IndexedDB
// ───────────────────────────────────────────
const DB_NAME = 'PestDB'
const STORE_NAME = 'pests'
const initDB = async () => {
  return await openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
      }
    }
  })
}

// Toast helper
// ──────────────────────────────────────────────────────────────
// Toast (Custom Styled, Global, with Icons & Colors)
// ──────────────────────────────────────────────────────────────
const showToast = (type, message = '') => {
  const icons = {
    success: 'tabler-circle-check',
    delete: 'tabler-trash',
    error: 'tabler-alert-triangle',
    warning: 'tabler-info-circle',
    info: 'tabler-refresh'
  }

  toast(
    <div className='flex items-center gap-2'>
      <i
        className={icons[type]}
        style={{
          color:
            type === 'success'
              ? '#16a34a'
              : type === 'error'
                ? '#dc2626'
                : type === 'delete'
                  ? '#dc2626'
                  : type === 'warning'
                    ? '#f59e0b'
                    : '#2563eb',
          fontSize: '22px'
        }}
      />
      <Typography variant='body2' sx={{ fontSize: '0.9rem', color: '#111' }}>
        {message}
      </Typography>
    </div>,
    {
      position: 'top-right',
      autoClose: 2000,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: false,
      draggable: false,
      theme: 'light',
      style: {
        borderRadius: '10px',
        padding: '8px 14px',
        boxShadow: '0 4px 10px rgba(0,0,0,0.06)',
        display: 'flex',
        alignItems: 'center'
      }
    }
  )
}

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
export default function PestPage() {
  const [rows, setRows] = useState([])
  const [rowCount, setRowCount] = useState(0)
  const [searchText, setSearchText] = useState('')
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 })
  const [mainDrawerOpen, setMainDrawerOpen] = useState(false)
  const [subDrawerOpen, setSubDrawerOpen] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [editPest, setEditPest] = useState(null)
  const [selectedPestId, setSelectedPestId] = useState(null)
  const [drawerType, setDrawerType] = useState('Finding')
  const [loading, setLoading] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, row: null, isSub: false, subId: null })
  const [exportAnchorEl, setExportAnchorEl] = useState(null)

  const [mainFormData, setMainFormData] = useState({
    pest_code: '',
    parent_code: '',
    name: '',
    value: '',
    description: '',
    status: 'Active',
    user_role: 'Admin'
  })

  const [subFormData, setSubFormData] = useState({ name: '', status: 'Active' })
  const [editSubRow, setEditSubRow] = useState(null)

  const statusOptions = ['Active', 'Inactive']

  const pestCodeRef = useRef(null)
  const parentCodeRef = useRef(null)
  const nameRef = useRef(null)
  const valueRef = useRef(null)
  const descRef = useRef(null)
  const statusRef = useRef(null)

  // Load data
  const loadData = async () => {
    setLoading(true)
    try {
      const db = await initDB()
      const all = await db.getAll(STORE_NAME)

      // 🔍 Filter by search input
      const filtered = searchText
        ? all.filter(r =>
            ['pest_code', 'parent_code', 'name'].some(key =>
              (r[key] || '').toString().toLowerCase().includes(searchText.toLowerCase())
            )
          )
        : all

      // 🔢 Sort newest first
      const sorted = filtered.sort((a, b) => (b.id || 0) - (a.id || 0))

      // 📄 Pagination
      const start = pagination.pageIndex * pagination.pageSize
      const end = start + pagination.pageSize
      const paginated = sorted.slice(start, end)

      // 🧾 Add serial number
      const normalized = paginated.map((item, idx) => ({
        ...item,
        sno: start + idx + 1
      }))

      setRows(normalized)
      setRowCount(filtered.length)
    } catch (err) {
      console.error(err)
      showToast('error', 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [pagination.pageIndex, pagination.pageSize, searchText])

  // --- Main Drawer ---
  const toggleMainDrawer = () => setMainDrawerOpen(p => !p)
  const handleAdd = () => {
    setIsEdit(false)
    setEditPest(null)
    setMainFormData({
      pest_code: '',
      parent_code: '',
      name: '',
      value: '',
      description: '',
      status: 'Active',
      user_role: 'Admin'
    })
    setMainDrawerOpen(true)
    setTimeout(() => {
      pestCodeRef.current?.querySelector('input')?.focus()
    }, 100)
  }

  const handleEdit = row => {
    setIsEdit(true)
    setEditPest(row)
    setMainFormData({
      pest_code: row.pest_code,
      parent_code: row.parent_code,
      name: row.name,
      value: row.value,
      description: row.description,
      status: row.status,
      user_role: row.user_role
    })
    setMainDrawerOpen(true)
    setTimeout(() => {
      pestCodeRef.current?.querySelector('input')?.focus()
    }, 100)
  }
  const handleMainSubmit = async () => {
    if (!mainFormData.pest_code.trim() || !mainFormData.name.trim()) {
      showToast('warning', 'Pest Code and Name are required')
      return
    }
    setLoading(true)
    try {
      const db = await initDB()
      const payload = {
        ...mainFormData,
        finding: editPest?.finding || [],
        action: editPest?.action || [],
        chemicals: editPest?.chemicals || [],
        checklist: editPest?.checklist || [],
        addDesc: editPest?.addDesc || []
      }
      if (isEdit && editPest?.id) {
        await db.put(STORE_NAME, { ...payload, id: editPest.id })
        showToast('success', 'Pest updated')
      } else {
        const id = await db.add(STORE_NAME, payload)
        payload.id = id
        showToast('success', 'Pest added')
      }
      toggleMainDrawer()
      loadData()
    } catch {
      showToast('error', 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  const confirmMainDelete = async () => {
    if (deleteDialog.row) {
      const db = await initDB()
      await db.delete(STORE_NAME, deleteDialog.row.id)
      showToast('delete', `${deleteDialog.row.name} deleted`)
      loadData()
    }
    setDeleteDialog({ open: false, row: null })
  }

  // --- Sub Drawer ---
  const openSubDrawer = (row, type) => {
    setSelectedPestId(row.id)
    setDrawerType(type)
    setSubFormData({ name: '', status: 'Active' })
    setEditSubRow(null)
    setSubDrawerOpen(true)
  }

  const handleSubSubmit = async () => {
    if (!subFormData.name.trim()) {
      showToast('warning', `${drawerType} name is required`)
      return
    }
    setLoading(true)
    try {
      const db = await initDB()
      const keyMap = {
        Finding: 'finding',
        Action: 'action',
        Chemicals: 'chemicals',
        Checklist: 'checklist',
        'Add Description': 'addDesc'
      }
      const key = keyMap[drawerType]
      const pest = rows.find(r => r.id === selectedPestId) || (await db.get(STORE_NAME, selectedPestId))
      let updatedList = pest[key] || []

      if (editSubRow) {
        updatedList = updatedList.map(f => (f.id === editSubRow.id ? { ...f, ...subFormData } : f))
      } else {
        const newId = updatedList.length ? Math.max(...updatedList.map(f => f.id)) + 1 : 1
        updatedList = [...updatedList, { id: newId, ...subFormData }]
      }

      const updatedPest = { ...pest, [key]: updatedList }
      await db.put(STORE_NAME, updatedPest)
      showToast('success', `${drawerType} ${editSubRow ? 'updated' : 'added'}`)
      setSubFormData({ name: '', status: 'Active' })
      setEditSubRow(null)
      loadData()
    } catch {
      showToast('error', 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  const handleSubEdit = row => {
    setSubFormData({ name: row.name, status: row.status })
    setEditSubRow(row)
  }

  const confirmSubDelete = async () => {
    if (deleteDialog.subId) {
      const keyMap = {
        Finding: 'finding',
        Action: 'action',
        Chemicals: 'chemicals',
        Checklist: 'checklist',
        'Add Description': 'addDesc'
      }
      const key = keyMap[drawerType]
      const db = await initDB()
      const pest = await db.get(STORE_NAME, selectedPestId)
      const updatedList = (pest[key] || []).filter(f => f.id !== deleteDialog.subId)
      const updatedPest = { ...pest, [key]: updatedList }
      await db.put(STORE_NAME, updatedPest)
      showToast('delete', `${drawerType} deleted`)
      loadData()
    }
    setDeleteDialog({ open: false, subId: null })
  }

  const getSubRows = () => {
    if (!selectedPestId) return []
    const pest = rows.find(r => r.id === selectedPestId)
    if (!pest) return []
    const keyMap = {
      Finding: 'finding',
      Action: 'action',
      Chemicals: 'chemicals',
      Checklist: 'checklist',
      'Add Description': 'addDesc'
    }
    return pest[keyMap[drawerType]] || []
  }

  // --- Table ---
  const columnHelper = createColumnHelper()
  const columns = useMemo(
    () => [
      columnHelper.accessor('sno', { header: 'S.No' }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: info => (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton size='small' color='primary' onClick={() => handleEdit(info.row.original)}>
              <EditIcon />
            </IconButton>
            <IconButton
              size='small'
              color='error'
              onClick={() => setDeleteDialog({ open: true, row: info.row.original })}
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        )
      }),
      columnHelper.accessor('pest_code', { header: 'Pest Code' }),
      columnHelper.accessor('parent_code', { header: 'Parent Group' }),
      columnHelper.accessor('name', { header: 'Display Pest Name' }),
      columnHelper.accessor('value', { header: 'Value' }),
      columnHelper.display({
        id: 'finding',
        header: 'Finding',
        cell: info => (
          <Button
            variant='outlined'
            size='small'
            onClick={() => openSubDrawer(info.row.original, 'Finding')}
            sx={{ borderRadius: '999px', px: 2 }}
          >
            Finding({info.row.original.finding?.length || 0})
          </Button>
        )
      }),
      columnHelper.display({
        id: 'action',
        header: 'Action',
        cell: info => (
          <Button
            variant='outlined'
            size='small'
            onClick={() => openSubDrawer(info.row.original, 'Action')}
            sx={{ borderRadius: '999px', px: 2 }}
          >
            Action({info.row.original.action?.length || 0})
          </Button>
        )
      }),
      columnHelper.display({
        id: 'chemicals',
        header: 'Chemicals',
        cell: info => (
          <Button
            variant='outlined'
            size='small'
            onClick={() => openSubDrawer(info.row.original, 'Chemicals')}
            sx={{ borderRadius: '999px', px: 2 }}
          >
            Chemicals({info.row.original.chemicals?.length || 0})
          </Button>
        )
      }),
      columnHelper.display({
        id: 'checklist',
        header: 'Checklist',
        cell: info => (
          <Button
            variant='outlined'
            size='small'
            onClick={() => openSubDrawer(info.row.original, 'Checklist')}
            sx={{ borderRadius: '999px', px: 2 }}
          >
            Checklist({info.row.original.checklist?.length || 0})
          </Button>
        )
      }),
      columnHelper.display({
        id: 'addDesc',
        header: 'Add Description',
        cell: info => (
          <Button
            variant='outlined'
            size='small'
            onClick={() => openSubDrawer(info.row.original, 'Add Description')}
            sx={{ borderRadius: '999px', px: 2 }}
          >
            AddDesc({info.row.original.addDesc?.length || 0})
          </Button>
        )
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: info => {
          const status = info.getValue()
          return (
            <Chip
              label={status}
              size='small'
              sx={{
                color: '#fff',
                bgcolor: status === 'Active' ? 'success.main' : 'error.main',
                fontWeight: 600,
                borderRadius: '6px',
                px: 1.5
              }}
            />
          )
        }
      })
    ],
    []
  )

  const fuzzyFilter = (row, columnId, value, addMeta) => {
    const itemRank = rankItem(row.getValue(columnId), value)
    addMeta({ itemRank })
    return itemRank.passed
  }

  const table = useReactTable({
    data: rows,
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

  // --- Export ---
  const exportOpen = Boolean(exportAnchorEl)
  const exportCSV = () => {
    const headers = [
      'S.No',
      'Pest Code',
      'Parent Group',
      'Name',
      'Value',
      'Finding',
      'Action',
      'Chemicals',
      'Checklist',
      'AddDesc',
      'Status'
    ]
    const csv = [
      headers.join(','),
      ...rows.map(r =>
        [
          r.sno,
          `"${r.pest_code}"`,
          `"${r.parent_code}"`,
          `"${r.name}"`,
          r.value,
          r.finding?.length || 0,
          r.action?.length || 0,
          r.chemicals?.length || 0,
          r.checklist?.length || 0,
          r.addDesc?.length || 0,
          r.status
        ].join(',')
      )
    ].join('\n')
    const link = document.createElement('a')
    link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    link.download = 'pests.csv'
    link.click()
    showToast('success', 'CSV downloaded')
  }

  const exportPrint = () => {
    const w = window.open('', '_blank')
    const html = `
      <html><head><title>Pest List</title><style>
      body{font-family:Arial;padding:24px;}
      table{width:100%;border-collapse:collapse;}
      th,td{border:1px solid #ccc;padding:8px;text-align:left;}
      th{background:#f4f4f4;}
      </style></head><body>
      <h2>Pest List</h2>
      <table><thead><tr>
      <th>S.No</th><th>Pest Code</th><th>Parent Group</th><th>Name</th><th>Value</th>
      <th>Finding</th><th>Action</th><th>Chemicals</th><th>Checklist</th><th>AddDesc</th><th>Status</th>
      </tr></thead><tbody>
      ${rows
        .map(
          r => `<tr>
          <td>${r.sno}</td>
          <td>${r.pest_code}</td>
          <td>${r.parent_code}</td>
          <td>${r.name}</td>
          <td>${r.value}</td>
          <td>${r.finding?.length || 0}</td>
          <td>${r.action?.length || 0}</td>
          <td>${r.chemicals?.length || 0}</td>
          <td>${r.checklist?.length || 0}</td>
          <td>${r.addDesc?.length || 0}</td>
          <td>${r.status}</td>
        </tr>`
        )
        .join('')}
      </tbody></table></body></html>`
    w.document.write(html)
    w.document.close()
    w.print()
  }

  // ───────────────────────────────────────────
  // Render
  // ───────────────────────────────────────────
  return (
    <Box>
      <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 2 }}>
        <Link underline='hover' color='inherit' href='/'>
          Home
        </Link>
        <Typography color='text.primary'>Pest</Typography>
      </Breadcrumbs>
      <Card sx={{ p: 3 }}>
        <CardHeader
          sx={{
            pb: 1.5,
            pt: 1.5,
            '& .MuiCardHeader-action': { m: 0, alignItems: 'center' },
            '& .MuiCardHeader-title': { fontWeight: 600, fontSize: '1.125rem' }
          }}
          title={
            <Box display='flex' alignItems='center' gap={2}>
              <Typography variant='h5' sx={{ fontWeight: 600 }}>
                Pest Management
              </Typography>
              <Button
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
                  await loadData()
                  setTimeout(() => setLoading(false), 600)
                }}
                sx={{ textTransform: 'none', fontWeight: 500, px: 2.5, height: 36 }}
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </Button>
            </Box>
          }
          action={
            <Box display='flex' alignItems='center' gap={2}>
              <Button
                variant='outlined'
                color='secondary'
                endIcon={<ArrowDropDownIcon />}
                onClick={e => setExportAnchorEl(e.currentTarget)}
                sx={{ textTransform: 'none', fontWeight: 500, px: 2.5, height: 36 }}
              >
                Export
              </Button>
              <Menu anchorEl={exportAnchorEl} open={exportOpen} onClose={() => setExportAnchorEl(null)}>
                <MenuItem onClick={exportPrint}>
                  <PrintIcon fontSize='small' sx={{ mr: 1 }} /> Print
                </MenuItem>
                <MenuItem onClick={exportCSV}>
                  <FileDownloadIcon fontSize='small' sx={{ mr: 1 }} /> CSV
                </MenuItem>
              </Menu>
              <Button
                variant='contained'
                startIcon={<AddIcon />}
                onClick={handleAdd}
                sx={{ textTransform: 'none', fontWeight: 500, px: 2.5, height: 36 }}
              >
                Add Pest
              </Button>
            </Box>
          }
        />
        {loading && (
          <Box
            sx={{
              position: 'fixed',
              inset: 0,
              bgcolor: 'rgba(255,255,255,0.7)',
              backdropFilter: 'blur(2px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2000
            }}
          >
            <Box textAlign='center'>
              <ProgressCircularCustomization size={60} thickness={5} />
              <Typography mt={2} fontWeight={600} color='primary'>
                Loading...
              </Typography>
            </Box>
          </Box>
        )}

        <Divider sx={{ mb: 2 }} />
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
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
            placeholder='Search code or name...'
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
                    No results found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <TablePaginationComponent totalCount={rowCount} pagination={pagination} setPagination={setPagination} />
      </Card>

      {/* Main Drawer */}
      <Drawer anchor='right' open={mainDrawerOpen} onClose={toggleMainDrawer}>
        <Box sx={{ p: 5, width: 440 }}>
          <Box display='flex' justifyContent='space-between' alignItems='center' mb={3}>
            <Typography variant='h5' fontWeight={600}>
              {isEdit ? 'Edit Pest' : 'Add New Pest'}
            </Typography>
            <IconButton onClick={toggleMainDrawer}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Grid container spacing={2}>
            {/* Pest Code */}
            {/* Pest Code */}
            <Grid item xs={12}>
              <CustomTextFieldWrapper
                ref={pestCodeRef}
                fullWidth
                label='Service Type Code'
                placeholder='Enter pest code'
                value={mainFormData.pest_code}
                onChange={e => setMainFormData(prev => ({ ...prev, pest_code: e.target.value }))}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    parentCodeRef.current?.querySelector('input')?.focus()
                  }
                }}
              />
            </Grid>

            {/* Parent Code */}
            <Grid item xs={12}>
              <CustomTextFieldWrapper
                ref={parentCodeRef}
                fullWidth
                label='Parent Pest Group Code'
                placeholder='Enter parent code'
                value={mainFormData.parent_code}
                onChange={e => setMainFormData(prev => ({ ...prev, parent_code: e.target.value }))}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    nameRef.current?.querySelector('input')?.focus()
                  }
                }}
              />
            </Grid>

            {/* Name */}
            <Grid item xs={12}>
              <CustomTextFieldWrapper
                ref={nameRef}
                fullWidth
                label='Display Pest Name'
                placeholder='Enter display name'
                value={mainFormData.name}
                onChange={e => setMainFormData(prev => ({ ...prev, name: e.target.value }))}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    valueRef.current?.querySelector('input')?.focus()
                  }
                }}
              />
            </Grid>

            {/* Value (Numeric) */}
            <Grid item xs={12}>
              <CustomTextFieldWrapper
                ref={valueRef}
                fullWidth
                label='Pest Value'
                placeholder='Enter numeric value'
                value={mainFormData.value}
                onChange={e => {
                  const val = e.target.value
                  if (/^-?\d*\.?\d*$/.test(val)) {
                    setMainFormData(prev => ({ ...prev, value: val }))
                  }
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    descRef.current?.querySelector('textarea')?.focus()
                  }
                }}
              />
            </Grid>

            {/* Description */}
            <Grid item xs={12}>
              <CustomTextarea
                ref={descRef}
                fullWidth
                label='Description'
                placeholder='Enter description'
                rows={3}
                value={mainFormData.description}
                onChange={e => setMainFormData(prev => ({ ...prev, description: e.target.value }))}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    statusRef.current?.querySelector('input')?.focus()
                  }
                }}
              />
            </Grid>

            {/* Status (Only in Edit Mode) */}
            {isEdit && (
              <Grid item xs={12}>
                <CustomSelectField
                  ref={statusRef}
                  fullWidth
                  label='Status'
                  value={mainFormData.status}
                  onChange={e => setMainFormData(prev => ({ ...prev, status: e.target.value }))}
                  options={statusOptions.map(opt => ({ value: opt, label: opt }))}
                />
              </Grid>
            )}
          </Grid>
          <Box mt={4} display='flex' gap={2}>
            <Button variant='contained' fullWidth onClick={handleMainSubmit} disabled={loading}>
              {loading ? 'Saving...' : isEdit ? 'Update' : 'Save'}
            </Button>
            <Button variant='outlined' fullWidth onClick={toggleMainDrawer}>
              Cancel
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* Sub Drawer */}
      <Drawer anchor='right' open={subDrawerOpen} onClose={() => setSubDrawerOpen(false)}>
        <Box sx={{ p: 5, width: 520 }}>
          <Box display='flex' justifyContent='space-between' alignItems='center' mb={3}>
            <Typography variant='h5' fontWeight={600}>
              Manage {drawerType}
            </Typography>
            <IconButton onClick={() => setSubDrawerOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <CustomTextFieldWrapper
                fullWidth
                label={`${drawerType} Name`}
                placeholder={`Enter ${drawerType.toLowerCase()} name`}
                value={subFormData.name}
                onChange={e => setSubFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </Grid>

            <Grid item xs={12}>
              <CustomSelectField
                fullWidth
                label='Status'
                value={subFormData.status}
                onChange={e => setSubFormData(prev => ({ ...prev, status: e.target.value }))}
                options={[
                  { value: 'Active', label: 'Active' },
                  { value: 'Inactive', label: 'Inactive' }
                ]}
              />
            </Grid>
          </Grid>
          <Button variant='contained' fullWidth sx={{ mt: 2 }} onClick={handleSubSubmit} disabled={loading}>
            {editSubRow ? 'Update' : 'Add'} {drawerType}
          </Button>

          <Box mt={4}>
            <Typography variant='subtitle1' mb={1}>
              {drawerType} List
            </Typography>
            <div className='overflow-x-auto'>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Actions</th>
                    <th>{drawerType} Name</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {getSubRows().length ? (
                    getSubRows().map(row => (
                      <tr key={row.id}>
                        <td>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton size='small' onClick={() => handleSubEdit(row)}>
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              size='small'
                              color='error'
                              onClick={() => setDeleteDialog({ open: true, isSub: true, subId: row.id })}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </td>
                        <td>{row.name}</td>
                        <td>
                          <Chip
                            label={row.status}
                            size='small'
                            sx={{
                              color: '#fff',
                              bgcolor: row.status === 'Active' ? 'success.main' : 'error.main',
                              fontWeight: 600
                            }}
                          />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className='text-center py-4'>
                        No items
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Box>
        </Box>
      </Drawer>

      <Dialog
        onClose={() => setDeleteDialog({ open: false })}
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
        {/* 🔴 Title with Warning Icon */}
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
            onClick={() => setDeleteDialog({ open: false })}
            disableRipple
            sx={{ position: 'absolute', right: 1, top: 1 }}
          >
            <i className='tabler-x' />
          </DialogCloseButton>
        </DialogTitle>

        {/* 🧾 Message */}
        <DialogContent sx={{ px: 5, pt: 1 }}>
          <Typography sx={{ color: 'text.secondary', fontSize: 14, lineHeight: 1.6 }}>
            {deleteDialog.isSub ? (
              <>
                Are you sure you want to delete this{' '}
                <strong style={{ color: '#d32f2f' }}>{drawerType.toLowerCase()}</strong>?
              </>
            ) : (
              <>
                Are you sure you want to delete the pest{' '}
                <strong style={{ color: '#d32f2f' }}>{deleteDialog.row?.name || 'this pest'}</strong>?
              </>
            )}
            <br />
            This action cannot be undone.
          </Typography>
        </DialogContent>

        {/* ⚙️ Buttons */}
        <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 3, pt: 2 }}>
          <Button
            onClick={() => setDeleteDialog({ open: false })}
            variant='tonal'
            color='secondary'
            sx={{ minWidth: 100, textTransform: 'none', fontWeight: 500 }}
          >
            Cancel
          </Button>
          <Button
            onClick={deleteDialog.isSub ? confirmSubDelete : confirmMainDelete}
            variant='contained'
            color='error'
            sx={{ minWidth: 100, textTransform: 'none', fontWeight: 600 }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
