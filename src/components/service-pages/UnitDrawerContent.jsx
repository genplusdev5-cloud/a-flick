'use client'

import { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Chip,
  Grid,
  IconButton,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material'

import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'

import CustomTextFieldWrapper from '@/components/common/CustomTextField'
import GlobalSelect from '@/components/common/GlobalSelect'
import ProgressCircularCustomization from '@/components/common/ProgressCircularCustomization'
import DialogCloseButton from '@/components/dialogs/DialogCloseButton'

import { showToast } from '@/components/common/Toasts'

import { getUnitList, addUnit, updateUnit, deleteUnit } from '@/api/master/unit'

import styles from '@core/styles/table.module.css'
import GlobalButton from '../common/GlobalButton'
import { usePermission } from '@/hooks/usePermission'

export default function UnitDrawerContent({ pestId }) {
  const { canAccess } = usePermission()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [editId, setEditId] = useState(null)
  const [openDelete, setOpenDelete] = useState(false)
  const [deleteId, setDeleteId] = useState(null)

  const [formData, setFormData] = useState({
    name: '',
    status: 'Active'
  })

  const statusOptions = [
    { label: 'Active', value: 'Active' },
    { label: 'Inactive', value: 'Inactive' }
  ]

  // LOAD UNITS
  const loadUnits = async () => {
    if (!pestId) return
    setLoading(true)
    try {
      const res = await getUnitList(pestId)

      const list = res?.data?.data?.results || res?.data?.results || res?.data?.data || res?.data || []

      const mapped = list.map((item, index) => ({
        ...item,
        sno: index + 1,
        statusLabel: item.is_active === 1 ? 'Active' : 'Inactive'
      }))

      setRows(mapped)
    } catch (err) {
      showToast('error', 'Failed to load units')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUnits()
  }, [pestId])

  // SUBMIT
  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      showToast('warning', 'Unit name is required')
      return
    }

    const payload = {
      name: formData.name,
      pest_id: pestId,
      is_active: formData.status === 'Active' ? 1 : 0
    }

    setLoading(true)
    try {
      let res
      if (editId) {
        res = await updateUnit({ id: editId, ...payload })
      } else {
        res = await addUnit(payload)
      }

      if (res.status === 'success') {
        showToast('success', editId ? 'Unit updated successfully' : 'Unit added successfully')

        setFormData({ name: '', status: 'Active' })
        setEditId(null)
        loadUnits()
      } else {
        showToast('error', res.message || 'Failed to save unit')
      }
    } catch {
      showToast('error', 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  // EDIT
  const handleEdit = row => {
    setEditId(row.id)
    setFormData({
      name: row.name,
      status: row.is_active === 1 ? 'Active' : 'Inactive'
    })
  }

  // DELETE
  const confirmDelete = async () => {
    setLoading(true)
    try {
      const res = await deleteUnit(deleteId)
      if (res.status === 'success') {
        showToast('delete', 'Unit deleted successfully')
        loadUnits()
      } else {
        showToast('error', res.message || 'Delete failed')
      }
    } catch {
      showToast('error', 'Delete failed')
    } finally {
      setLoading(false)
      setOpenDelete(false)
      setDeleteId(null)
    }
  }

  return (
    <Box>
      {/* FORM */}
      <Grid container spacing={2} mb={2}>
        <Grid item xs={12}>
          <CustomTextFieldWrapper
            fullWidth
            label='Unit Name'
            placeholder='Enter unit name'
            value={formData.name}
            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
          />
        </Grid>

        {/* Status in Edit Mode */}
        {editId && (
          <Grid item xs={12}>
            <GlobalSelect
              label='Status'
              value={formData.status}
              onChange={e =>
                setFormData(prev => ({
                  ...prev,
                  status: e.target.value
                }))
              }
            />
          </Grid>
        )}

        <Grid item xs={12} display='flex' gap={2}>
          {editId && (
            <GlobalButton
              color='secondary'
              fullWidth
              onClick={() => {
                setEditId(null)
                setFormData({ name: '', status: 'Active' })
              }}
            >
              Cancel
            </GlobalButton>
          )}
          {canAccess('Service Type (Pest)', editId ? 'update' : 'create') && (
            <GlobalButton variant='contained' fullWidth onClick={handleSubmit} disabled={loading}>
              {editId ? 'Update Unit' : 'Add Unit'}
            </GlobalButton>
          )}
        </Grid>
      </Grid>

      {/* LIST */}
      <Typography variant='subtitle1' mb={1}>
        Unit List
      </Typography>

      {loading ? (
        <Box textAlign='center' py={2}>
          <ProgressCircularCustomization size={50} />
        </Box>
      ) : (
        <Box sx={{ maxHeight: '60vh', overflowY: 'auto', pr: 1 }}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>S.No</th>
                <th>Actions</th>
                <th>Unit Name</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {rows.length ? (
                rows.map(row => (
                  <tr key={row.id}>
                    <td>{row.sno}</td>

                    <td>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {canAccess('Service Type (Pest)', 'update') && (
                          <IconButton size='small' color='primary' onClick={() => handleEdit(row)}>
                            <i className='tabler-edit' />
                          </IconButton>
                        )}

                        {canAccess('Service Type (Pest)', 'delete') && (
                          <IconButton
                            size='small'
                            color='error'
                            onClick={() => {
                              setDeleteId(row.id)
                              setOpenDelete(true)
                            }}
                          >
                            <i className='tabler-trash text-red-600 text-lg' />
                          </IconButton>
                        )}
                      </Box>
                    </td>

                    <td>{row.name}</td>

                    <td>
                      <Chip
                        label={row.statusLabel}
                        size='small'
                        sx={{
                          color: '#fff',
                          bgcolor: row.statusLabel === 'Active' ? 'success.main' : 'error.main',
                          fontWeight: 600
                        }}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className='text-center py-4'>
                    No units found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Box>
      )}

      {/* DELETE POPUP */}
      <Dialog
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        PaperProps={{
          sx: { width: 420, borderRadius: 1, textAlign: 'center', overflow: 'visible' }
        }}
      >
        <DialogTitle
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
            onClick={() => setOpenDelete(false)}
            disableRipple
            sx={{ position: 'absolute', right: 1, top: 1 }}
          >
            <i className='tabler-x' />
          </DialogCloseButton>
        </DialogTitle>

        <DialogContent sx={{ px: 5, pt: 1 }}>
          <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>
            Are you sure you want to delete the unit{' '}
            <strong style={{ color: '#d32f2f' }}>{rows.find(r => r.id === deleteId)?.name || 'this item'}</strong>
            ?
            <br />
            This action cannot be undone.
          </Typography>
        </DialogContent>

        <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 3 }}>
          <GlobalButton
            color='secondary'
            onClick={() => setOpenDelete(false)}
            sx={{ minWidth: 100, textTransform: 'none', fontWeight: 500 }}
          >
            Cancel
          </GlobalButton>

          <GlobalButton
            variant='contained'
            color='error'
            onClick={confirmDelete}
            sx={{ minWidth: 100, textTransform: 'none', fontWeight: 600 }}
          >
            Delete
          </GlobalButton>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
