'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
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
  Autocomplete,
  FormControl,
  Select,
  CircularProgress,
  InputAdornment
} from '@mui/material'

import ActionDrawerContent from '@/components/service-pages/ActionDrawerContent'
import FindingDrawerContent from '@/components/service-pages/FindingDrawerContent'
import RecommendationDrawerContent from '@/components/service-pages/RecommendationDrawerContent'
import ChecklistDrawerContent from '@/components/service-pages/ChecklistDrawerContent'
import PestChemicalsDrawerContent from '@/components/service-pages/PestChemicalsDrawerContent'
import UnitDrawerContent from '@/components/service-pages/UnitDrawerContent'
import GlobalButton from '@/components/common/GlobalButton'

import { getPestList, addPest, updatePest, deletePest, getPestDetails } from '@/api/master/pest'
import { getFindingList, addFinding, updateFinding, deleteFinding } from '@/api/master/findings'
import { getActionList, addAction, updateAction, deleteAction } from '@/api/master/actions'
import {
  getRecommendationList,
  addRecommendation,
  updateRecommendation,
  deleteRecommendation
} from '@/api/master/recommendation'
import { getChecklistList, addChecklist, updateChecklist, deleteChecklist } from '@/api/master/checklist'
import { getPestChemicalsList, addPestChemical, updatePestChemical, deletePestChemical } from '@/api/stock/pestchemicals'
import { getUnitList, addUnit, updateUnit, deleteUnit } from '@/api/master/unit'

// ADD THIS LINE (after other imports)
import CustomTextFieldWrapper from '@/components/common/CustomTextField'
import CustomTextarea from '@/components/common/CustomTextarea'
import CustomSelectField from '@/components/common/CustomSelectField'
import PermissionGuard from '@/components/auth/PermissionGuard'
import { usePermission } from '@/hooks/usePermission'

import TableChartIcon from '@mui/icons-material/TableChart'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import FileCopyIcon from '@mui/icons-material/FileCopy'

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
import StickyTableWrapper from '@/components/common/StickyTableWrapper'
import StickyListLayout from '@/components/common/StickyListLayout'
import ChevronRight from '@menu/svg/ChevronRight'

import { showToast } from '@/components/common/Toasts'

const apiMap = {
  Finding: {
    list: getFindingList,
    add: addFinding,
    update: updateFinding,
    del: deleteFinding
  },
  Action: {
    list: getActionList,
    add: addAction,
    update: updateAction,
    del: deleteAction
  },
  Recommendation: {
    list: getRecommendationList,
    add: addRecommendation,
    update: updateRecommendation,
    del: deleteRecommendation
  },
  Checklist: {
    list: getChecklistList,
    add: addChecklist,
    update: updateChecklist,
    del: deleteChecklist
  },
  Chemicals: {
    list: getPestChemicalsList,
    add: addPestChemical,
    update: updatePestChemical,
    del: deletePestChemical
  },
  'Pest Units': {
    list: getUnitList,
    add: addUnit,
    update: updateUnit,
    del: deleteUnit
  }
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
// ───────────────────────────────────────────
const PestPageContent = () => {
  const { canAccess } = usePermission()
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
  const [subRows, setSubRows] = useState([])
  const router = useRouter()

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

  const loadPestDetails = async () => {
    if (!selectedPestId) return

    setLoading(true)

    try {
      if (drawerType === 'Action') {
        const res = await getActionList(selectedPestId)
        setSubRows(res?.data?.results || [])
        return
      }

      if (drawerType === 'Finding') {
        const res = await getFindingList(selectedPestId)
        setSubRows(res?.data?.data?.results || [])
        return
      }

      if (drawerType === 'Checklist') {
        const res = await getChecklistList(selectedPestId)
        setSubRows(res?.data?.data?.results || [])
        return
      }

      if (drawerType === 'Recommendation') {
        const res = await getRecommendationList(selectedPestId)
        setSubRows(res?.data?.data?.results || [])
        return
      }

      if (drawerType === 'Chemicals') {
        const res = await getPestChemicalsList(selectedPestId)
        setSubRows(res?.data?.data?.results || [])
        return
      }

      if (drawerType === 'Pest Units') {
        const res = await getUnitList(selectedPestId)
        setSubRows(res?.data?.data?.results || [])
        return
      }
    } catch (error) {
      console.log('ERR: ', error)
    } finally {
      setLoading(false)
    }
  }

  // Load data
  const loadData = async () => {
    setLoading(true)

    try {
      const res = await getPestList({
        page: pagination.pageIndex + 1,
        page_size: pagination.pageSize,
        search: searchText || ''
      })

      const results = res?.data?.data?.results || res?.data?.results || []
      const count = res?.data?.data?.count || res?.data?.count || results.length

      const normalized = results.map((item, idx) => ({
        ...item,
        sno: idx + 1 + pagination.pageIndex * pagination.pageSize
      }))

      setRows(normalized)
      setRowCount(count)
    } catch (err) {
      console.error('❌ loadData error:', err)
    } finally {
      setLoading(false)
    }
  }

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
      value: row.pest_value,
      description: row.description,
      status: row.is_active === 1 ? 'Active' : 'Inactive', // ✅ show correct text in dropdown
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
      const payload = {
        pest_code: mainFormData.pest_code,
        parent_code: mainFormData.parent_code,
        name: mainFormData.name,
        pest_value: mainFormData.value,
        description: mainFormData.description,
        is_active: mainFormData.status === 'Active' ? 1 : 0, // ✅ convert status to integer
        status: 1, // ✅ standardized status
        user_role: mainFormData.user_role || 'Admin'
      }

      // ✅ CALL API PROPERLY
      let res
      if (isEdit && editPest?.id) {
        res = await updatePest({ id: editPest.id, ...payload })
      } else {
        res = await addPest(payload)
      }

      if (res.status === 'success') {
        showToast('success', isEdit ? 'Pest updated successfully' : 'Pest added successfully')

        // ✅ Instantly show new pest in table
        if (!isEdit) {
          const newPest = res.data || res.data.data // 🧠 fix here

          if (newPest) {
            setRows(prev => [
              ...prev,
              {
                ...newPest,
                sno: prev.length + 1,
                pest_code: newPest.pest_code || '-',
                parent_code: newPest.parent_code || '-',
                pest_value: newPest.pest_value || '-',
                name: newPest.name || '-',
                status: newPest.status === 1 ? 'Active' : 'Inactive'
              }
            ])
            setRowCount(prev => prev + 1)
          }
        }

        toggleMainDrawer()
        setTimeout(() => loadData(), 300)
      } else {
        showToast('error', res.message || 'Failed to save pest')
      }
    } catch (err) {
      console.error(err)
      showToast('error', 'Something went wrong while saving pest')
    } finally {
      setLoading(false)
    }
  }

  const confirmMainDelete = async () => {
    if (!deleteDialog.row) return

    setLoading(true)
    try {
      const res = await deletePest(deleteDialog.row.id) // calls PATCH

      if (res.status === 'success') {
        showToast('delete', `${deleteDialog.row.name} deleted successfully`)
        await loadData() // refresh list
      } else {
        showToast('error', res.message || 'Failed to delete pest')
      }
    } catch (err) {
      console.error('❌ Delete (patch) error:', err)
      showToast('error', 'Something went wrong while deleting pest')
    } finally {
      setLoading(false)
      setDeleteDialog({ open: false, row: null })
    }
  }

  // --- Sub Drawer ---
  const openSubDrawer = (row, type) => {
    setSelectedPestId(row.id)
    setDrawerType(type)
    setSubFormData({ name: '', status: 'Active' })
    setEditSubRow(null)
    setSubDrawerOpen(true)
  }

  // 🔹 Load Sub-List (Findings, Action, Recommendation, etc.)
  const loadSubList = async () => {
    const apiSet = apiMap[drawerType]
    if (!apiSet || !selectedPestId) return

    const res = await apiSet.list(selectedPestId)

    const list =
      res?.data?.data?.results || // Backend nested format
      res?.data?.results || // Action API fallback
      []

    setSubRows(list)
  }

  useEffect(() => {
    loadData()
  }, [pagination.pageIndex, pagination.pageSize, searchText])

  useEffect(() => {
    if (subDrawerOpen && selectedPestId) {
      loadSubList() // ⭐ THIS fetches actions filtered by pest_id
    }
  }, [subDrawerOpen, drawerType, selectedPestId])

  // 🔹 Add or Update sub-item (Finding, Action, etc.)
  const handleSubSubmit = async () => {
    if (!subFormData.name.trim()) {
      showToast('warning', `${drawerType} name is required`)
      return
    }

    const apiSet = apiMap[drawerType]
    if (!apiSet) return

    setLoading(true)
    try {
      const payload = {
        name: subFormData.name,
        pest_id: selectedPestId, // ✅ correct key name
        is_active: subFormData.status === 'Active' ? 1 : 0,
        status: 1 // ✅ standardized status
      }

      let res
      if (editSubRow && editSubRow.id) {
        res = await apiSet.update({ id: editSubRow.id, ...payload })
      } else {
        res = await apiSet.add(payload)
      }

      if (res.status === 'success') {
        showToast('success', `${drawerType} ${editSubRow ? 'updated' : 'added'} successfully`)
        setSubFormData({ name: '', status: 'Active' })
        setEditSubRow(null)
        await loadSubList() // ✅ refresh list in drawer

        // ✅ Instantly update count in main table (no need to sync)
        if (drawerType === 'Finding') {
          setRows(prev =>
            prev.map(p => (p.id === selectedPestId ? { ...p, finding_count: (p.finding_count || 0) + 1 } : p))
          )
        }

        if (drawerType === 'Action') {
          setRows(prev =>
            prev.map(p => (p.id === selectedPestId ? { ...p, action_count: (p.action_count || 0) + 1 } : p))
          )
        }
      } else {
        showToast('error', res.message || 'Failed to save data')
      }
    } catch (err) {
      console.error(err)
      showToast('error', 'Something went wrong while saving')
    } finally {
      setLoading(false)
    }
  }

  const handleSubEdit = row => {
    setSubFormData({ name: row.name, status: row.status })
    setEditSubRow(row)
  }

  // 🔹 Delete sub-item (Finding, Action, etc.)
  const confirmSubDelete = async () => {
    const apiSet = apiMap[drawerType]
    if (!apiSet || !deleteDialog.subId) return

    setLoading(true)
    try {
      const res = await apiSet.del(deleteDialog.subId)
      if (res.status === 'success') {
        showToast('delete', `${drawerType} deleted successfully`)
        await loadSubList() // ✅ refresh drawer list

        // ✅ Instantly update count in main table (no need to sync)
        if (drawerType === 'Finding') {
          setRows(prev =>
            prev.map(p =>
              p.id === selectedPestId ? { ...p, finding_count: Math.max((p.finding_count || 1) - 1, 0) } : p
            )
          )
        }

        if (drawerType === 'Action') {
          setRows(prev =>
            prev.map(p =>
              p.id === selectedPestId ? { ...p, action_count: Math.max((p.action_count || 1) - 1, 0) } : p
            )
          )
        }
      } else {
        showToast('error', res.message || 'Delete failed')
      }
    } catch (err) {
      console.error(err)
      showToast('error', 'Something went wrong while deleting')
    } finally {
      setLoading(false)
      setDeleteDialog({ open: false, subId: null })
    }
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

      // 🟢 This one controls the edit/delete actions column
      columnHelper.display({
        id: 'table_actions', // ✅ renamed
        header: 'Actions',
        cell: info => (
          <Box sx={{ display: 'flex', gap: 1 }}>
            {canAccess('Service Type (Pest)', 'update') && (
              <IconButton size='small' color='primary' onClick={() => handleEdit(info.row.original)}>
                <i className='tabler-edit' />
              </IconButton>
            )}
            {canAccess('Service Type (Pest)', 'delete') && (
              <IconButton
                size='small'
                color='error'
                onClick={() => setDeleteDialog({ open: true, row: info.row.original, isSub: false })}
              >
                <i className='tabler-trash text-red-600 text-lg' />
              </IconButton>
            )}
          </Box>
        )
      }),

      columnHelper.accessor('pest_code', { header: 'Pest Code' }),
      columnHelper.accessor('parent_code', { header: 'Parent Group' }),
      columnHelper.accessor('name', { header: 'Display Pest Name' }),
      columnHelper.accessor('pest_value', { header: 'Pest Value' }),

      columnHelper.accessor('description', {
        header: 'Description',
        cell: info => (
          <Typography
            sx={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: 200
            }}
          >
            {info.getValue() || '-'}
          </Typography>
        )
      }),

      // 🟢 This is your sub-drawer action button
      columnHelper.display({
        id: 'pest_action', // ✅ unique id
        header: 'Action',
        cell: info => (
          <Button
            variant='outlined'
            size='small'
            onClick={() => openSubDrawer(info.row.original, 'Action')}
            sx={{ borderRadius: '999px', px: 2 }}
          >
            Action({info.row.original.action_count || 0})
          </Button>
        )
      }),

      columnHelper.display({
        id: 'pest_finding',
        header: 'Finding',
        cell: info => (
          <Button
            variant='outlined'
            size='small'
            onClick={() => openSubDrawer(info.row.original, 'Finding')}
            sx={{ borderRadius: '999px', px: 2 }}
          >
            Finding({info.row.original.finding_count || 0})
          </Button>
        )
      }),

      columnHelper.display({
        id: 'pest_recommendation', // ✅ unique id
        header: 'Recommendation',
        cell: info => (
          <Button
            variant='outlined'
            size='small'
            onClick={() => openSubDrawer(info.row.original, 'Recommendation')}
            sx={{ borderRadius: '999px', px: 2 }}
          >
            Recommendation({info.row.original.recommendation_count || 0})
          </Button>
        )
      }),

      columnHelper.display({
        id: 'pest_checklist', // ✅ unique id
        header: 'Checklist',
        cell: info => (
          <Button
            variant='outlined'
            size='small'
            onClick={() => openSubDrawer(info.row.original, 'Checklist')}
            sx={{ borderRadius: '999px', px: 2 }}
          >
            Checklist({info.row.original.checklist_count || 0})
          </Button>
        )
      }),

      columnHelper.display({
        id: 'pest_chemicals', // ✅ unique id
        header: 'Chemicals',
        cell: info => (
          <Button
            variant='outlined'
            size='small'
            onClick={() => openSubDrawer(info.row.original, 'Chemicals')}
            sx={{ borderRadius: '999px', px: 2 }}
          >
            Chemicals({info.row.original.chemical_count || 0})
          </Button>
        )
      }),

      columnHelper.display({
        id: 'pest_units', // ✅ unique id
        header: 'Pest Units',
        cell: info => (
          <Button
            variant='outlined'
            size='small'
            onClick={() => openSubDrawer(info.row.original, 'Pest Units')}
            sx={{ borderRadius: '999px', px: 2 }}
          >
            PestUnits({info.row.original.unit_count || 0})
          </Button>
        )
      }),

      columnHelper.accessor('is_active', {
        header: 'Status',
        cell: info => {
          const isActive = info.getValue()
          const label = isActive === 1 ? 'Active' : 'Inactive'

          return (
            <Chip
              label={label}
              size='small'
              sx={{
                color: '#fff',
                bgcolor: isActive === 1 ? 'success.main' : 'error.main',
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
      'Recommendation',
      'Pest Units',
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
          r.recommendation?.length || 0,
          r.pestUnits?.length || 0,
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
    <StickyListLayout
      header={
        <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 2 }}>
          <Link underline='hover' color='inherit' href='/'>
            Home
          </Link>
          <Typography color='text.primary'>Pest</Typography>
        </Breadcrumbs>
      }
    >
      <Card sx={{ display: 'flex', flexDirection: 'column', maxHeight: '100%', minHeight: 0, position: 'relative' }}>
        <CardHeader
          title={
            <Box display='flex' alignItems='center' gap={2}>
              <Typography variant='h5' sx={{ fontWeight: 600 }}>
                Pest
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
                onClick={loadData}
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
              >
                Export
              </GlobalButton>

              {canAccess('Service Type (Pest)', 'create') && (
                <GlobalButton startIcon={<AddIcon />} onClick={handleAdd}>
                  Add Pest
                </GlobalButton>
              )}
            </Box>
          }
          sx={{
            pb: 1.5,
            pt: 4,
            px: 4,
            '& .MuiCardHeader-action': { m: 0, alignItems: 'center' },
            '& .MuiCardHeader-title': { fontWeight: 600 }
          }}
        />

        <Divider />

        <Box sx={{ p: 4, flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Box
            sx={{
              mb: 3,
              display: 'flex',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 2,
              flexShrink: 0
            }}
          >
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
                        No results found
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
          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={2}>
            {/* Pest Code */}
            <Grid item xs={12}>
              <CustomTextFieldWrapper
                ref={pestCodeRef}
                fullWidth
                label='Service Type Code'
                placeholder='Enter pest code'
                value={mainFormData.pest_code}
                onChange={e => setMainFormData(prev => ({ ...prev, pest_code: e.target.value }))}
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
            <GlobalButton color='secondary' fullWidth onClick={toggleMainDrawer}>
              Cancel
            </GlobalButton>
            <GlobalButton variant='contained' fullWidth onClick={handleMainSubmit} disabled={loading}>
              {loading ? 'Saving...' : isEdit ? 'Update' : 'Save'}
            </GlobalButton>
          </Box>
        </Box>
      </Drawer>

      {/* Sub Drawer */}
      <Drawer anchor='right' open={subDrawerOpen} onClose={() => setSubDrawerOpen(false)}>
        <Box sx={{ p: 5, width: 520, height: '100vh', overflowY: 'auto' }}>
          {/* Drawer Header */}
          <Box display='flex' justifyContent='space-between' alignItems='center' mb={3}>
            <Typography variant='h5' fontWeight={600}>
              Manage {drawerType}
            </Typography>
            <IconButton onClick={() => setSubDrawerOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Action Drawer */}
          {drawerType === 'Action' && (
            <ActionDrawerContent
              pestId={selectedPestId}
              rows={subRows}
              reload={loadSubList}
              onDelete={id =>
                setDeleteDialog({
                  open: true,
                  isSub: true,
                  subId: id
                })
              }
            />
          )}

          {/* Finding Drawer */}
          {drawerType === 'Finding' && <FindingDrawerContent pestId={selectedPestId} />}

          {/* Recommendation Drawer */}
          {drawerType === 'Recommendation' && <RecommendationDrawerContent pestId={selectedPestId} />}

          {/* Checklist Drawer */}
          {drawerType === 'Checklist' && <ChecklistDrawerContent pestId={selectedPestId} />}

          {/* Chemicals Drawer */}
          {drawerType === 'Chemicals' && <PestChemicalsDrawerContent pestId={selectedPestId} />}

          {/* Units  Drawer */}
          {drawerType === 'Pest Units' && <UnitDrawerContent pestId={selectedPestId} />}

          {/* ===================================================
        3️⃣ OTHER MODULES (Recommendation, Checklist, etc.)
        =================================================== */}
          {drawerType !== 'Action' &&
            drawerType !== 'Finding' &&
            drawerType !== 'Recommendation' &&
            drawerType !== 'Checklist' &&
            drawerType !== 'Chemicals' &&
            drawerType !== 'Pest Units' && (
              <>
                <Grid container spacing={2}>
                  {/* Name Field */}
                  <Grid item xs={12}>
                    <CustomTextFieldWrapper
                      fullWidth
                      label={`${drawerType} Name`}
                      placeholder={`Enter ${drawerType.toLowerCase()} name`}
                      value={subFormData.name}
                      onChange={e => setSubFormData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </Grid>

                  {/* Status Field */}
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

                {/* Add / Update Button */}
                {canAccess('Service Type (Pest)', editSubRow ? 'update' : 'create') && (
                  <Button variant='contained' fullWidth sx={{ mt: 2 }} onClick={handleSubSubmit} disabled={loading}>
                    {editSubRow ? 'Update' : 'Add'} {drawerType}
                  </Button>
                )}

                {/* Table Section */}
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
                        {subRows.length ? (
                          subRows.map(row => (
                            <tr key={row.id}>
                              <td>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                  {canAccess('Service Type (Pest)', 'update') && (
                                    <IconButton size='small' onClick={() => handleSubEdit(row)}>
                                      <EditIcon />
                                    </IconButton>
                                  )}
                                  {canAccess('Service Type (Pest)', 'delete') && (
                                    <IconButton
                                      size='small'
                                      color='error'
                                      onClick={() =>
                                        setDeleteDialog({
                                          open: true,
                                          isSub: true,
                                          subId: row.id
                                        })
                                      }
                                    >
                                      <DeleteIcon />
                                    </IconButton>
                                  )}
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
              </>
            )}
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
          <GlobalButton
            onClick={() => setDeleteDialog({ open: false })}
            color='secondary'
            sx={{ minWidth: 100, textTransform: 'none', fontWeight: 500 }}
          >
            Cancel
          </GlobalButton>
          <GlobalButton
            onClick={deleteDialog.isSub ? confirmSubDelete : confirmMainDelete}
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

// Wrapper for RBAC
export default function PestPage() {
  return (
    <PermissionGuard permission='Service Type (Pest)'>
      <PestPageContent />
    </PermissionGuard>
  )
}
