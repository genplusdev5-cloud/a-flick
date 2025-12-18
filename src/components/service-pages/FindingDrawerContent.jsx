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
import GlobalSelect from '@/components/common/GlobalSelect'
import GlobalButton from '@/components/common/GlobalButton'

import CustomTextFieldWrapper from '@/components/common/CustomTextField'
import CustomSelectField from '@/components/common/CustomSelectField'
import ProgressCircularCustomization from '@/components/common/ProgressCircularCustomization'

import { getFindingList, addFinding, updateFinding, deleteFinding } from '@/api/findings'
import { showToast } from '@/components/common/Toasts'
import DialogCloseButton from '@components/dialogs/DialogCloseButton'

import styles from '@core/styles/table.module.css'
import { Global } from 'recharts'

export default function FindingDrawerContent({ pestId }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [editId, setEditId] = useState(null)
  const [openDelete, setOpenDelete] = useState(false)
  const [deleteId, setDeleteId] = useState(null)

  const [formData, setFormData] = useState({
    name: '',
    status: 'Active'
  })

  const statusOptions = ['Active', 'Inactive']

  // ==============================
  // 🔥 Auto Load on Drawer OPEN
  // ==============================
  useEffect(() => {
    if (pestId) loadFindings()
  }, [pestId])

  // ==============================
  // 🔹 Load Findings
  // ==============================
  const loadFindings = async () => {
    setLoading(true)
    try {
      const res = await getFindingList(pestId)

      const list = res?.data?.data?.results || res?.data?.results || []

      const mapped = list.map((item, index) => ({
        ...item,
        sno: index + 1,
        name: item.name || item.finding || item.finding_name || '',
        statusLabel: item.is_active === 1 ? 'Active' : 'Inactive'
      }))

      setRows(mapped)
    } catch (err) {
      showToast('error', 'Failed to load findings')
    } finally {
      setLoading(false)
    }
  }

  // ==============================
  // 🔹 Add / Update
  // ==============================
  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      showToast('warning', 'Finding name required')
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
        res = await updateFinding({ id: editId, ...payload })
      } else {
        res = await addFinding(payload)
      }

      if (res.status === 'success') {
        showToast('success', editId ? 'Finding updated' : 'Finding added')

        // reset
        setFormData({ name: '', status: 'Active' })
        setEditId(null)
        loadFindings() // refresh
      } else {
        showToast('error', res.message)
      }
    } catch (err) {
      showToast('error', 'Save failed')
    } finally {
      setLoading(false)
    }
  }

  // ==============================
  // 🔹 Edit
  // ==============================
  const handleEdit = row => {
    setEditId(row.id)
    setFormData({
      name: row.name,
      status: row.statusLabel
    })
  }

  // ==============================
  // 🔹 Delete
  // ==============================
  const confirmDelete = async () => {
    setLoading(true)
    try {
      const res = await deleteFinding(deleteId)

      if (res.status === 'success') {
        showToast('delete', 'Finding deleted')
        loadFindings()
      } else {
        showToast('error', res.message)
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
      {/* Form */}
      <Grid container spacing={2} mb={2}>
        <Grid item xs={12}>
          <CustomTextFieldWrapper
            fullWidth
            label='Finding Name'
            placeholder='Enter finding name'
            value={formData.name}
            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
          />
        </Grid>

        {editId && (
          <Grid item xs={12}>
            <GlobalSelect
              label='Status'
              value={formData.status}
              onChange={e =>
                setFormData(prev => ({
                  ...prev,
                  status: e.target.value // ⭐ FIXED: Status will update correctly
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
          <GlobalButton variant='contained' fullWidth onClick={handleSubmit}>
            {editId ? 'Update Finding' : 'Add Finding'}
          </GlobalButton>
        </Grid>
      </Grid>

      {/* List */}
      <Typography variant='subtitle1' mb={1}>
        Finding List
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
                <th>Finding Name</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {rows.length > 0 ? (
                rows.map((row, index) => (
                  <tr key={row.id}>
                    <td>{index + 1}</td>

                    <td>
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
                    </td>

                    <td>{row.name}</td>

                    <td>
                      <Chip
                        label={row.statusLabel}
                        size='small'
                        sx={{
                          color: '#fff',
                          bgcolor: row.statusLabel === 'Active' ? 'success.main' : 'error.main'
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

      {/* Delete Dialog */}
      <Dialog
        onClose={() => setOpenDelete(false)}
        aria-labelledby='delete-dialog-title'
        open={openDelete}
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
        {/* 🔴 Title + Warning Icon */}
        <DialogTitle
          id='delete-dialog-title'
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
          {/* ❌ Close Button */}
          <DialogCloseButton
            onClick={() => setOpenDelete(false)}
            disableRipple
            sx={{ position: 'absolute', right: 1, top: 1 }}
          >
            <i className='tabler-x' />
          </DialogCloseButton>
        </DialogTitle>

        {/* 🧾 Message */}
        <DialogContent sx={{ px: 5, pt: 1 }}>
          <Typography sx={{ color: 'text.secondary', fontSize: 14, lineHeight: 1.6 }}>
            Are you sure you want to delete the finding{' '}
            <strong style={{ color: '#d32f2f' }}>{rows.find(r => r.id === deleteId)?.name || 'this item'}</strong>
            ?
            <br />
            This action cannot be undone.
          </Typography>
        </DialogContent>

        {/* ⚙️ Buttons */}
        <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 3, pt: 2 }}>
          <GlobalButton
            onClick={() => setOpenDelete(false)}
            variant='tonal'
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
    </Box>
  )
}
