'use client'

import { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Typography,
  IconButton,
  Chip,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material'

import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'

import DialogCloseButton from '@components/dialogs/DialogCloseButton'
import CustomTextFieldWrapper from '@/components/common/CustomTextField'
import GlobalSelect from '@/components/common/GlobalSelect'
import ProgressCircularCustomization from '@/components/common/ProgressCircularCustomization'

import { getChecklistList, addChecklist, updateChecklist, deleteChecklist } from '@/api/checklist'
import { showToast } from '@/components/common/Toasts'
import styles from '@core/styles/table.module.css'
import GlobalButton from '../common/GlobalButton'

export default function ChecklistDrawerContent({ pestId }) {
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

  // Load Checklist
  const loadChecklist = async () => {
    setLoading(true)
    try {
      const res = await getChecklistList(pestId)

      const list = res?.data?.data?.results || res?.data?.results || res?.data || []

      const mapped = list.map((item, index) => ({
        ...item,
        sno: index + 1,
        statusLabel: item.is_active === 1 ? 'Active' : 'Inactive'
      }))

      setRows(mapped)
    } catch {
      showToast('error', 'Failed to load checklist')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (pestId) loadChecklist()
  }, [pestId])

  // Add / Update
  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      showToast('warning', 'Checklist name is required')
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
        res = await updateChecklist({ id: editId, ...payload })
      } else {
        res = await addChecklist(payload)
      }

      if (res.status === 'success') {
        showToast('success', editId ? 'Checklist updated' : 'Checklist added')
        setFormData({ name: '', status: 'Active' })
        setEditId(null)
        loadChecklist()
      } else {
        showToast('error', res.message || 'Failed to save')
      }
    } finally {
      setLoading(false)
    }
  }

  // Edit
  const handleEdit = row => {
    setEditId(row.id)
    setFormData({
      name: row.name,
      status: row.is_active === 1 ? 'Active' : 'Inactive'
    })
  }

  // Delete Confirm
  const confirmDelete = async () => {
    setLoading(true)
    try {
      const res = await deleteChecklist(deleteId)
      if (res.status === 'success') {
        showToast('delete', 'Checklist deleted')
        loadChecklist()
      } else {
        showToast('error', res.message)
      }
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
            label='Checklist Name'
            placeholder='Enter checklist name'
            value={formData.name}
            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
          />
        </Grid>

        {/* Status */}
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
              fullWidth
              color='secondary'
              onClick={() => {
                setEditId(null)
                setFormData({ name: '', status: 'Active' })
              }}
            >
              Cancel
            </GlobalButton>
          )}
          <GlobalButton variant='contained' fullWidth startIcon={<AddIcon />} onClick={handleSubmit}>
            {editId ? 'Update Checklist' : 'Add Checklist'}
          </GlobalButton>
        </Grid>
      </Grid>

      {/* LIST */}
      <Typography variant='subtitle1' mb={1}>
        Checklist List
      </Typography>

      {loading ? (
        <Box textAlign='center' py={2}>
          <ProgressCircularCustomization size={50} />
        </Box>
      ) : (
        <Box sx={{ maxHeight: '60vh', overflowY: 'auto' }}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>S.No</th>
                <th>Actions</th>
                <th>Checklist Name</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {rows.length ? (
                rows.map((row, idx) => (
                  <tr key={row.id}>
                    <td>{idx + 1}</td>

                    <td>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton size='small' color='primary' onClick={() => handleEdit(row)}>
                          <i className='tabler-edit' />
                        </IconButton>

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
                    No items
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Box>
      )}

      {/* DELETE DIALOG (same as Action drawer) */}
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
            gap: 1,
            justifyContent: 'center',
            alignItems: 'center',
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
          />
        </DialogTitle>

        <DialogContent sx={{ px: 5, pt: 1 }}>
          <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>
            Are you sure you want to delete the checklist{' '}
            <strong style={{ color: '#d32f2f' }}>{rows.find(r => r.id === deleteId)?.name || 'this item'}</strong>
            ?
            <br />
            This action cannot be undone.
          </Typography>
        </DialogContent>

        <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 3, pt: 2 }}>
          <GlobalButton variant='tonal' color='secondary' onClick={() => setOpenDelete(false)}>
            Cancel
          </GlobalButton>

          <GlobalButton variant='contained' color='error' onClick={confirmDelete}>
            Delete
          </GlobalButton>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
