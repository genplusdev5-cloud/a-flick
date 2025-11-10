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
import CustomSelectField from '@/components/common/CustomSelectField'
import ProgressCircularCustomization from '@/components/common/ProgressCircularCustomization'

import { getActionList, addAction, updateAction, deleteAction } from '@/api/actions'
import styles from '@core/styles/table.module.css'

// ⭐ GLOBAL TOAST IMPORT
import { showToast } from '@/components/common/Toasts'

export default function ActionDrawerContent({ pestId }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [editId, setEditId] = useState(null)

  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null })

  const [formData, setFormData] = useState({
    name: '',
    status: 'Active'
  })

  const statusOptions = ['Active', 'Inactive']

  // 🔹 Load Actions
  const loadActions = async () => {
    setLoading(true)
    try {
      const res = await getActionList(pestId)
      const list = res?.data?.data?.results || res?.data?.results || []

      setRows(
        list.map((item, index) => ({
          ...item,
          sno: index + 1,
          statusLabel: item.status === 1 ? 'Active' : 'Inactive'
        }))
      )
    } catch (err) {
      showToast('error', 'Failed to load actions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (pestId) loadActions()
  }, [pestId])

  // 🔹 Add / Update
  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      showToast('warning', 'Action name required')
      return
    }

    const payload = {
      name: formData.name,
      pest_id: pestId,
      status: formData.status === 'Active' ? 1 : 0
    }

    setLoading(true)
    try {
      let res

      if (editId) {
        res = await updateAction({ id: editId, ...payload })
      } else {
        res = await addAction(payload)
      }

      if (res.status === 'success') {
        showToast('success', editId ? 'Action updated successfully' : 'Action added successfully')

        setFormData({ name: '', status: 'Active' })
        setEditId(null)
        loadActions()
      } else {
        showToast('error', res.message || 'Failed to save action')
      }
    } catch (err) {
      showToast('error', 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  // 🔹 Edit
  const handleEdit = row => {
    setEditId(row.id)
    setFormData({
      name: row.name,
      status: row.status === 1 ? 'Active' : 'Inactive'
    })
  }

  // 🔹 Open Delete Dialog
  const openDeleteDialog = id => {
    setDeleteDialog({ open: true, id })
  }

  // 🔹 Confirm Delete
  const confirmDelete = async () => {
    setLoading(true)
    try {
      const res = await deleteAction(deleteDialog.id)
      if (res.status === 'success') {
        showToast('delete', 'Action deleted successfully')
        loadActions()
      } else {
        showToast('error', res.message)
      }
    } catch {
      showToast('error', 'Delete failed')
    } finally {
      setLoading(false)
      setDeleteDialog({ open: false, id: null })
    }
  }

  return (
    <Box>
      {/* Input Fields */}
      <Grid container spacing={2} mb={2}>
        <Grid item xs={12}>
          <CustomTextFieldWrapper
            fullWidth
            label='Action Name'
            placeholder='Enter action name'
            value={formData.name}
            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
          />
        </Grid>

        {editId && (
          <Grid item xs={12}>
            <CustomSelectField
              fullWidth
              label='Status'
              value={formData.status}
              options={statusOptions.map(s => ({ value: s, label: s }))}
              onChange={e => setFormData(prev => ({ ...prev, status: e.target.value }))}
            />
          </Grid>
        )}

        <Grid item xs={12} display='flex' gap={2}>
          <Button variant='contained' fullWidth startIcon={<AddIcon />} onClick={handleSubmit}>
            {editId ? 'Update Action' : 'Add Action'}
          </Button>

          {editId && (
            <Button
              variant='outlined'
              fullWidth
              onClick={() => {
                setEditId(null)
                setFormData({ name: '', status: 'Active' })
              }}
            >
              Cancel
            </Button>
          )}
        </Grid>
      </Grid>

      {/* Table Title */}
      <Typography variant='subtitle1' mb={1}>
        Action List
      </Typography>

      {/* TABLE */}
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
                <th>Action Name</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {rows.length > 0 ? (
                rows.map((row, index) => (
                  <tr key={row.id}>
                    <td>{index + 1}</td>

                    <td>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton size='small' color='primary' onClick={() => handleEdit(row)}>
                          <EditIcon fontSize='small' />
                        </IconButton>
                        <IconButton size='small' color='error' onClick={() => openDeleteDialog(row.id)}>
                          <DeleteIcon fontSize='small' />
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
                          bgcolor: row.status === 1 ? 'success.main' : 'error.main',
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

      {/* DELETE DIALOG */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, id: null })}
        PaperProps={{
          sx: { width: 420, borderRadius: 1, textAlign: 'center', overflow: 'visible' }
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'center',
            gap: 1,
            color: 'error.main',
            fontWeight: 700,
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
            Are you sure you want to delete this <strong>Action</strong>?
            <br />
            This action cannot be undone.
          </Typography>
        </DialogContent>

        <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 3 }}>
          <Button variant='tonal' color='secondary' onClick={() => setDeleteDialog({ open: false, id: null })}>
            Cancel
          </Button>

          <Button variant='contained' color='error' onClick={confirmDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
