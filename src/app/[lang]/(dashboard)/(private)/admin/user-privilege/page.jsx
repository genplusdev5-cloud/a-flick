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
  Checkbox,
  FormControlLabel,
  FormGroup,
  TextField,
  FormControl,
  Select, // ADD THIS LINE
  CircularProgress,
  InputAdornment
} from '@mui/material'

// 🔹 Imports (add these to the top of your file)
import {
  addUserRole,
  getUserRoleList,
  getUserRoleDetails,
  updateUserRole,
  deleteUserRole,
  duplicateUserRole,
  refreshUserRole
} from '@/api/userRole'

import {
  getUserPrivilegeList,
  getUserPrivilegeDetails,
  updateUserPrivilege,
  getUserModuleList
} from '@/api/userPrivilege'

import { getPaginationRowModel } from '@tanstack/react-table'

import FileCopyIcon from '@mui/icons-material/FileCopy'
import CustomTextFieldWrapper from '@/components/common/CustomTextField'
import DialogCloseButton from '@components/dialogs/DialogCloseButton'
import ProgressCircularCustomization from '@/components/common/ProgressCircularCustomization'
import AddIcon from '@mui/icons-material/Add'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import DoneIcon from '@mui/icons-material/Done'

// Component Imports

import CustomAutocomplete from '@core/components/mui/Autocomplete'
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
import PermissionGuard from '@/components/auth/PermissionGuard'
import DebugPermissions from '@/components/DebugPermissions'
import { usePermission } from '@/hooks/usePermission'
import { showToast } from '@/components/common/Toasts'

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
const UserPrivilegePageContent = () => {
  const [modules, setModules] = useState([])
  const [privileges, setPrivileges] = useState([])
  const [searchText, setSearchText] = useState('')
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 })
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, row: null })
  const [exportAnchorEl, setExportAnchorEl] = useState(null)

  const [roles, setRoles] = useState([])
  const [selectedRole, setSelectedRole] = useState('')
  const [selectedRoleId, setSelectedRoleId] = useState(null)

  const [formData, setFormData] = useState({
    id: null,
    module: '',
    description: '', // ✅ add this to prevent undefined issue
    create: false,
    view: false,
    update: false,
    delete: false
  })

  const moduleRef = useRef(null)

  const { triggerPrivilegeUpdate, canAccess } = usePermission() // Destructure new helper

  const mergedRows = useMemo(() => {
    return modules.map((mod, index) => {
      const priv = privileges.find(p => p.module_id === mod.id)
      return {
        sno: index + 1,
        module: mod.name || mod.module_name,
        module_id: mod.id,
        id: priv?.id || null,
        create: !!priv?.create,
        view: !!priv?.view,
        update: !!priv?.update,
        delete: !!priv?.delete
      }
    })
  }, [modules, privileges])

  const handleUpdatePrivileges = async () => {
    if (!selectedRole) {
      showToast('warning', 'Select a role first')
      return
    }

    setLoading(true)
    try {
      const payload = mergedRows.map(p => ({
        module_id: p.module_id,
        create: p.create ? 1 : 0,
        read: p.view ? 1 : 0,
        update: p.update ? 1 : 0,
        delete: p.delete ? 1 : 0
      }))

      console.log('🚀 Final payload sending to backend:', {
        role_id: selectedRole,
        privileges: payload
      })

      await updateUserPrivilege(selectedRole, payload)
      showToast('success', 'Privileges updated successfully')

      // Creating a check to see if the updated role is the CURRENT user's role
      const storedUser = localStorage.getItem('user_info')
      if (storedUser) {
        const userInfo = JSON.parse(storedUser)
        const currentRoleId = userInfo.role_id || userInfo.role?.id

        // If the updated role is ANY role (or specifically the current one), we can trigger refresh.
        // Even if we updated another role, it doesn't hurt to refresh, but it's critical if it's OUR role.
        if (String(currentRoleId) === String(selectedRole)) {
          console.log('🔄 Triggering immediate role refresh for current user')
          triggerPrivilegeUpdate()
        }
      }
    } catch (err) {
      console.error('❌ Update error:', err)
      showToast('error', 'Failed to update privileges')
    } finally {
      setLoading(false)
    }
  }

  // Load rows
  const loadRoles = async () => {
    setLoading(true)
    try {
      const res = await getUserRoleList()
      setRoles(res?.data?.results || [])
    } catch (err) {
      console.error(err)
      showToast('error', 'Failed to fetch roles')
    } finally {
      setLoading(false)
    }
  }

  const loadPrivileges = async roleId => {
    if (!roleId) {
      console.warn('⚠️ No roleId provided to loadPrivileges')
      return
    }

    setLoading(true)
    try {
      console.log('🔹 Fetching privileges for Role ID:', roleId)
      const res = await getUserPrivilegeList(roleId)

      console.log('🔹 API response:', res?.data)
      const data = res?.data?.results || res?.data || []

      if (data.length === 0) {
        console.warn('⚠️ No privileges returned from API')
      }

      // ✅ Convert integer values to boolean for checkboxes
      const formatted = data.map(item => ({
        module: item.module_name,
        id: item.id,
        module_id: item.module_id,
        create: item.is_create === 1,
        view: item.is_read === 1,
        update: item.is_update === 1,
        delete: item.is_delete === 1
      }))

      setPrivileges(formatted)
    } catch (err) {
      console.error('❌ Error loading privileges:', err)
      showToast('error', 'Failed to load privileges')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    console.log('Privilege list:', privileges)
  }, [privileges])

  // 🔹 New: Load base module list
  const loadModules = async () => {
    setLoading(true)
    try {
      const res = await getUserModuleList()
      const list = res.data?.results || res.data || []

      // Format for table
      const formatted = list.map((item, idx) => ({
        sno: idx + 1,
        module: item.name, // Assuming 'name' is the module name field from module list API
        id: null, // No privilege ID yet if we just load pure modules
        module_id: item.id,
        create: false,
        view: false,
        update: false,
        delete: false
      }))

      setModules(list)
    } catch (err) {
      console.error('❌ Error loading modules:', err)
      showToast('error', 'Failed to load module list')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRoles()
    loadModules() // 🟢 Load modules initially so table isn't empty
  }, [])

  useEffect(() => {
    if (selectedRole) loadPrivileges(selectedRole)
  }, [selectedRole])

  const toggleDrawer = () => setDrawerOpen(p => !p)
  const handleAdd = () => {
    setIsEdit(false)
    setFormData({
      id: null,
      module: '', // start blank for Add
      description: '',
      create: false,
      view: false,
      update: false,
      delete: false
    })
    setDrawerOpen(true)

    // Optional: Focus on input
    setTimeout(() => {
      moduleRef.current?.querySelector('input')?.focus()
    }, 100)
  }

  // ───────────────────────────────────────────
  // Select All Logic
  // ───────────────────────────────────────────
  const handleColumnSelectAll = (key, checked) => {
    if (!selectedRole) {
      showToast('warning', 'Please select a role first')
      return
    }

    setPrivileges(prev => {
      // Create a map of existing privileges for fast lookup
      const privMap = new Map(prev.map(p => [p.module_id, p]))

      return modules.map(mod => {
        const existing = privMap.get(mod.id)
        if (existing) {
          return { ...existing, [key]: checked }
        } else {
          // If no privilege exists yet for this module, create one
          return {
            module_id: mod.id,
            module: mod.name || mod.module_name, // fallback
            id: null,
            create: key === 'create' ? checked : false,
            view: key === 'view' ? checked : false,
            update: key === 'update' ? checked : false,
            delete: key === 'delete' ? checked : false
          }
        }
      })
    })
  }

  const getColumnState = key => {
    if (!mergedRows.length) return { checked: false, indeterminate: false }
    const allChecked = mergedRows.every(r => r[key])
    const someChecked = mergedRows.some(r => r[key])
    return {
      checked: allChecked,
      indeterminate: someChecked && !allChecked
    }
  }

  const handlePrivilegeChange = (moduleId, key, value) => {
    setPrivileges(prev => {
      const existing = prev.find(p => p.module_id === moduleId)
      if (existing) {
        return prev.map(p => (p.module_id === moduleId ? { ...p, [key]: value } : p))
      } else {
        const mod = modules.find(m => m.id === moduleId)
        return [
          ...prev,
          {
            module_id: moduleId,
            module: mod?.name || '',
            id: null,
            create: key === 'create' ? value : false,
            view: key === 'view' ? value : false,
            update: key === 'update' ? value : false,
            delete: key === 'delete' ? value : false
          }
        ]
      }
    })
  }

  const handleEdit = row => {
    setIsEdit(true)
    setFormData(row)
    setDrawerOpen(true)

    setTimeout(() => {
      moduleRef.current?.querySelector('input')?.focus()
    }, 100)
  }
  // ───────────────────────────────────────────
  // Delete Role
  const handleDeleteRole = async id => {
    try {
      if (!id) {
        toast.error('No role selected for deletion.')
        return
      }

      const result = await deleteUserRole(id)

      if (result.status === 'success') {
        showToast('delete', result.message || 'UserRole deleted successfully')
        await loadRoles()
      } else {
        showToast('error', result.message || 'Failed to delete user role')
      }
    } catch (error) {
      console.error('❌ Delete error:', error)
      toast.error('Something went wrong while deleting.')
    }
  }

  // 🔴 Delete Handlers
  const handleDelete = async row => {
    try {
      // you can call your delete API here (if backend delete endpoint exists)
      showToast('delete', `${row.module} deleted successfully`)
      // If we need to filter modules or privileges, we should do it here
      // But usually deleting a module should happen via a dedicated API and then reload modules
    } catch (err) {
      console.error(err)
      showToast('error', 'Failed to delete')
    }
  }

  // Confirm delete from dialog
  const confirmDelete = async () => {
    if (deleteDialog.row) {
      await handleDelete(deleteDialog.row)
    }
    setDeleteDialog({ open: false, row: null })
  }

  // ───────────────────────────────────────────
  // Duplicate Role
  const handleDuplicateRole = async roleId => {
    try {
      if (!roleId) {
        showToast('warning', 'Please select a role to duplicate.')
        return
      }

      // 1️⃣ Fetch role details
      const res = await getUserRoleDetails(roleId)
      const originalRole = res?.data

      if (!originalRole) {
        showToast('error', 'Failed to fetch role details.')
        return
      }

      // 2️⃣ Pre-fill drawer with role data for editing
      setIsEdit(false) // This will trigger save (not update)
      setFormData({
        id: null, // because it's a new one
        module: `${originalRole.name} Copy`,
        description: originalRole.description || ''
      })

      // 3️⃣ Store reference of the original role for privileges
      setSelectedRoleId(roleId) // keep old ID temporarily

      setDrawerOpen(true) // ✅ open drawer only
      showToast('info', `Editing duplicate of "${originalRole.name}"`)
    } catch (error) {
      console.error('❌ Duplicate setup error:', error)
      showToast('error', 'Failed to open duplicate role drawer.')
    }
  }

  // ───────────────────────────────────────────
  const handleSubmit = async e => {
    e.preventDefault()

    if (!formData.module.trim()) {
      showToast('warning', 'Role name is required')
      return
    }

    setLoading(true)
    try {
      if (isEdit && formData.id) {
        // 🟢 Normal update
        const payload = {
          name: formData.module,
          description: formData.description || ''
        }
        await updateUserRole(formData.id, payload)
        showToast('success', 'Role updated successfully')
      } else {
        // 🟢 Duplicate mode or new role add
        const payload = {
          name: formData.module,
          description: formData.description || ''
        }

        // 1️⃣ Create the new role
        const newRole = await addUserRole(payload)
        const newRoleId = newRole?.data?.id

        if (!newRoleId) {
          showToast('error', 'Failed to create role.')
          return
        }

        // 2️⃣ If it’s a duplicate, copy privileges
        if (selectedRoleId) {
          const privRes = await getUserPrivilegeList(selectedRoleId)
          const oldPrivileges = privRes?.data?.results || []

          const duplicatedPrivileges = oldPrivileges.map(p => ({
            module_id: p.module_id,
            create: p.is_create,
            read: p.is_read,
            update: p.is_update,
            delete: p.is_delete
          }))

          await updateUserPrivilege(newRoleId, duplicatedPrivileges)
          showToast('success', `Privileges duplicated from "${roles.find(r => r.id === selectedRoleId)?.name}"`)
        } else {
          showToast('success', 'New role added successfully')
        }
      }

      toggleDrawer()
      await loadRoles()
    } catch (err) {
      console.error('❌ Role save error:', err)
      showToast('error', 'Failed to save role')
    } finally {
      setLoading(false)
    }
  }

  // Table setup
  const columnHelper = createColumnHelper()
  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'sno',
        header: 'S.No',
        cell: info => pagination.pageIndex * pagination.pageSize + info.row.index + 1
      }),

      columnHelper.accessor('module', { header: 'Module' }),

      columnHelper.accessor('create', {
        enableSorting: false, // 🔥 IMPORTANT
        header: () => {
          const { checked, indeterminate } = getColumnState('create')
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Checkbox
                checked={checked}
                indeterminate={indeterminate}
                onClick={e => e.stopPropagation()} // 🔥 STOP SORT
                onChange={e => handleColumnSelectAll('create', e.target.checked)}
                disabled={!selectedRole || !mergedRows.length}
                size='small'
              />
              <span>Create</span>
            </Box>
          )
        },
        cell: info => {
          const row = info.row.original
          return (
            <Checkbox
              checked={!!row.create}
              onClick={e => e.stopPropagation()} // 🔥 STOP SORT
              onChange={e => handlePrivilegeChange(row.module_id, 'create', e.target.checked)}
              disabled={!selectedRole}
            />
          )
        }
      }),

      columnHelper.accessor('view', {
        enableSorting: false, // 🔥 IMPORTANT
        header: () => {
          const { checked, indeterminate } = getColumnState('view')
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Checkbox
                checked={checked}
                indeterminate={indeterminate}
                onClick={e => e.stopPropagation()} // 🔥 STOP SORT
                onChange={e => handleColumnSelectAll('view', e.target.checked)}
                disabled={!selectedRole || !mergedRows.length}
                size='small'
              />
              <span>View</span>
            </Box>
          )
        },
        cell: info => {
          const row = info.row.original
          return (
            <Checkbox
              checked={!!row.view}
              onClick={e => e.stopPropagation()} // 🔥 STOP SORT
              onChange={e => handlePrivilegeChange(row.module_id, 'view', e.target.checked)}
              disabled={!selectedRole}
            />
          )
        }
      }),
      columnHelper.accessor('update', {
        enableSorting: false, // 🔥 IMPORTANT
        header: () => {
          const { checked, indeterminate } = getColumnState('update')
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Checkbox
                checked={checked}
                indeterminate={indeterminate}
                onClick={e => e.stopPropagation()} // 🔥 STOP SORT
                onChange={e => handleColumnSelectAll('update', e.target.checked)}
                disabled={!selectedRole || !mergedRows.length}
                size='small'
              />
              <span>Add/Edit</span>
            </Box>
          )
        },
        cell: info => {
          const row = info.row.original
          return (
            <Checkbox
              checked={!!row.update}
              onClick={e => e.stopPropagation()} // 🔥 STOP SORT
              onChange={e => handlePrivilegeChange(row.module_id, 'update', e.target.checked)}
              disabled={!selectedRole}
            />
          )
        }
      }),

      columnHelper.accessor('delete', {
        enableSorting: false, // 🔥 IMPORTANT
        header: () => {
          const { checked, indeterminate } = getColumnState('delete')
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Checkbox
                checked={checked}
                indeterminate={indeterminate}
                onClick={e => e.stopPropagation()} // 🔥 STOP SORT
                onChange={e => handleColumnSelectAll('delete', e.target.checked)}
                disabled={!selectedRole || !mergedRows.length}
                size='small'
              />
              <span>Delete</span>
            </Box>
          )
        },
        cell: info => {
          const row = info.row.original
          return (
            <Checkbox
              checked={!!row.delete}
              onClick={e => e.stopPropagation()} // 🔥 STOP SORT
              onChange={e => handlePrivilegeChange(row.module_id, 'delete', e.target.checked)}
              disabled={!selectedRole}
            />
          )
        }
      })
    ],
    [selectedRole, mergedRows] // ✅ Added mergedRows dependency to ensuring headers update
  )

  const fuzzyFilter = (row, columnId, value, addMeta) => {
    const itemRank = rankItem(row.getValue(columnId), value)
    addMeta({ itemRank })
    return itemRank.passed
  }

  const table = useReactTable({
    data: mergedRows, // ✅ FULL DATA (50 modules)
    columns,
    state: { globalFilter: searchText, pagination },
    onGlobalFilterChange: setSearchText,
    onPaginationChange: setPagination,
    globalFilterFn: fuzzyFilter,

    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(), // ✅ IMPORTANT
    autoResetPageIndex: false // ✅ Prevent reset on data update
  })

  // Export Functions
  const exportOpen = Boolean(exportAnchorEl)
  const exportCSV = () => {
    const headers = ['S.No', 'Module', 'Create', 'View', 'Edit/Update', 'Delete']
    const csv = [
      headers.join(','),
      ...mergedRows.map(r =>
        [
          r.sno,
          `"${r.module}"`,
          r.create ? 'Yes' : 'No',
          r.view ? 'Yes' : 'No',
          r.update ? 'Yes' : 'No',
          r.delete ? 'Yes' : 'No'
        ].join(',')
      )
    ].join('\n')
    const link = document.createElement('a')
    link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    link.download = 'user_privileges.csv'
    link.click()
    showToast('success', 'CSV downloaded')
  }

  const exportPrint = () => {
    const w = window.open('', '_blank')
    const html = `
      <html><head><title>User Privileges</title><style>
      body{font-family:Arial;padding:24px;}
      table{width:100%;border-collapse:collapse;}
      th,td{border:1px solid #ccc;padding:8px;text-align:left;}
      th{background:#f4f4f4;}
      input[type=checkbox]{transform:scale(1.2);}
      </style></head><body>
      <h2>User Privilege List</h2>
      <table><thead><tr>
      <th>S.No</th><th>Module</th><th>Create</th><th>View</th><th>Edit/Update</th><th>Delete</th>
      </tr></thead><tbody>
      ${mergedRows
        .map(
          r => `<tr>
          <td>${r.sno}</td>
          <td>${r.module}</td>
          <td><input type="checkbox" ${r.create ? 'checked' : ''} disabled></td>
          <td><input type="checkbox" ${r.view ? 'checked' : ''} disabled></td>
          <td><input type="checkbox" ${r.update ? 'checked' : ''} disabled></td>
          <td><input type="checkbox" ${r.delete ? 'checked' : ''} disabled></td>
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
    <PermissionGuard permission='User Privilege'>
      <StickyListLayout
        header={
          <Box sx={{ mb: 2 }}>
            {loading && (
              <Box
                sx={{
                  position: 'fixed',
                  inset: 0,
                  bgcolor: 'rgba(255,255,255,0.8)',
                  backdropFilter: 'blur(2px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 9999
                }}
              >
                <ProgressCircularCustomization size={60} thickness={5} />
              </Box>
            )}

            <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 2 }}>
              <Link underline='hover' color='inherit' href='/'>
                Home
              </Link>
              <Typography color='text.primary'>User Privilege</Typography>
            </Breadcrumbs>
          </Box>
        }
      >
        <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, position: 'relative' }}>
          <Box sx={{ p: 4, flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Box display='flex' alignItems='center' gap={2} mb={4}>
              <Typography variant='h5' sx={{ fontWeight: 600 }}>
                User Privilege Management
              </Typography>
            </Box>

            <Divider sx={{ mb: 4 }} />

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                mb: 4,
                gap: 2,
                flexWrap: 'nowrap',
                flexShrink: 0
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: 2,
                  flexWrap: 'nowrap'
                }}
              >
                {/* User Role Dropdown */}
                <Box sx={{ minWidth: 250 }}>
                  <CustomAutocomplete
                    fullWidth
                    options={roles}
                    value={roles.find(r => r.id === selectedRole) || null}
                    getOptionLabel={option => option.name || ''}
                    onChange={(e, newValue) => {
                      if (newValue) {
                        setSelectedRole(newValue.id)
                        loadPrivileges(newValue.id) // This fetches actual privileges
                        setPagination(p => ({ ...p, pageIndex: 0 }))
                      } else {
                        setSelectedRole('')
                        setPrivileges([]) // clear privileges
                        setPagination(p => ({ ...p, pageIndex: 0 }))
                      }
                    }}
                    renderInput={params => (
                      <CustomTextField {...params} label='User Role' placeholder='Choose a role...' />
                    )}
                  />
                </Box>

                {/* Buttons inline with dropdown */}
                {canAccess('User Privilege', 'create') && (
                  <Button variant='contained' startIcon={<AddIcon />} onClick={handleAdd}>
                    Add
                  </Button>
                )}

                <Button
                  variant='outlined'
                  startIcon={<EditIcon />}
                  disabled={!selectedRole}
                  onClick={async () => {
                    const res = await getUserRoleDetails(selectedRole)
                    setIsEdit(true)
                    setFormData({
                      id: res?.data?.id,
                      module: res?.data?.name,
                      description: res?.data?.description || ''
                    })
                    setDrawerOpen(true)
                  }}
                >
                  Edit
                </Button>

                <Button
                  variant='outlined'
                  color='error'
                  startIcon={<DeleteIcon />}
                  disabled={!selectedRole}
                  onClick={() => handleDeleteRole(selectedRole)}
                >
                  Delete
                </Button>

                <Button
                  variant='outlined'
                  color='secondary'
                  startIcon={<FileCopyIcon />}
                  disabled={!selectedRole}
                  onClick={() => handleDuplicateRole(selectedRole)}
                >
                  Duplicate
                </Button>

                <Button
                  variant='outlined'
                  color='info'
                  startIcon={<RefreshIcon />}
                  disabled={!selectedRole}
                  onClick={() => loadPrivileges(selectedRole)}
                >
                  Refresh
                </Button>
              </Box>

              <Button
                variant='contained'
                color='success'
                startIcon={<DoneIcon />}
                onClick={handleUpdatePrivileges}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 3,
                  whiteSpace: 'nowrap'
                }}
              >
                Update Privileges
              </Button>
            </Box>

            <Divider sx={{ mb: 2 }} />
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
                placeholder='Search module...'
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
              <StickyTableWrapper rowCount={mergedRows.length}>
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
                    {mergedRows.length ? (
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
              <TablePaginationComponent
                totalCount={mergedRows.length}
                pagination={pagination}
                setPagination={setPagination}
              />
            </Box>
          </Box>
        </Card>

        {/* Drawer */}
        {/* Drawer */}
        <Drawer anchor='right' open={drawerOpen} onClose={toggleDrawer}>
          <Box sx={{ p: 5, width: 420 }}>
            <Box display='flex' justifyContent='space-between' alignItems='center' mb={3}>
              <Typography variant='h5' fontWeight={600}>
                {isEdit ? 'Edit Module' : 'Add New Module'}
              </Typography>
              <IconButton onClick={toggleDrawer}>
                <CloseIcon />
              </IconButton>
            </Box>

            <form onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <CustomTextFieldWrapper
                    ref={moduleRef}
                    fullWidth
                    label='Module Name'
                    placeholder='Enter module name'
                    value={formData.module}
                    onChange={e => setFormData(prev => ({ ...prev, module: e.target.value }))}
                  />
                </Grid>

                {/* 🔹 Description field replaces checkboxes */}
                <Grid item xs={12}>
                  <CustomTextFieldWrapper
                    fullWidth
                    multiline
                    rows={3}
                    label='Description'
                    placeholder='Enter description'
                    value={formData.description}
                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </Grid>
              </Grid>

              <Box mt={4} display='flex' gap={2}>
                <Button type='submit' variant='contained' fullWidth disabled={loading}>
                  {loading ? 'Saving...' : isEdit ? 'Update' : 'Save'}
                </Button>
                <Button variant='outlined' fullWidth onClick={toggleDrawer}>
                  Cancel
                </Button>
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
              onClick={() => setDeleteDialog({ open: false, row: null })}
              disableRipple
              sx={{ position: 'absolute', right: 1, top: 1 }}
            >
              <i className='tabler-x' />
            </DialogCloseButton>
          </DialogTitle>

          {/* Centered Text */}
          <DialogContent sx={{ px: 5, pt: 1 }}>
            <Typography sx={{ color: 'text.secondary', fontSize: 14, lineHeight: 1.6 }}>
              Are you sure you want to delete the module{' '}
              <strong style={{ color: '#d32f2f' }}>{deleteDialog.row?.module || 'this module'}</strong>?
              <br />
              This action cannot be undone.
            </Typography>
          </DialogContent>

          {/* Centered Buttons */}
          <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 3, pt: 2 }}>
            <Button
              onClick={() => setDeleteDialog({ open: false, row: null })}
              variant='tonal'
              color='secondary'
              sx={{ minWidth: 100, textTransform: 'none', fontWeight: 500 }}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              variant='contained'
              color='error'
              sx={{ minWidth: 100, textTransform: 'none', fontWeight: 600 }}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </StickyListLayout>
    </PermissionGuard>
  )
}

export default UserPrivilegePageContent
