'use client'

import { useState } from 'react'
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
import styles from '@core/styles/table.module.css'
import { showToast } from '@/components/common/Toasts'
import { addAction, updateAction, deleteAction } from '@/api/actions'

export default function ActionDrawerContent({ pestId, rows, reload, onEdit, onDelete }) {
  const [editId, setEditId] = useState(null)
  const [formData, setFormData] = useState({ name: '', status: 'Active' })
  const [loading, setLoading] = useState(false)

  const statusOptions = ['Active', 'Inactive']

  // Add / Update
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
        showToast('success', editId ? 'Action updated' : 'Action added')
        setEditId(null)
        setFormData({ name: '', status: 'Active' })
        reload()     // 🔥 reload parent list
      }
    } finally {
      setLoading(false)
    }
  }

  const handleEditClick = row => {
    setEditId(row.id)
    setFormData({
      name: row.name,
      status: row.status === 1 ? 'Active' : 'Inactive'
    })
    onEdit(row)
  }

  return (
    <Box>
      <Grid container spacing={2} mb={2}>
        <Grid item xs={12}>
          <CustomTextFieldWrapper
            fullWidth
            label='Action Name'
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
          />
        </Grid>

        {editId && (
          <Grid item xs={12}>
            <CustomSelectField
              fullWidth
              label='Status'
              value={formData.status}
              options={statusOptions.map(s => ({ value: s, label: s }))}
              onChange={e => setFormData({ ...formData, status: e.target.value })}
            />
          </Grid>
        )}

        <Grid item xs={12} display='flex' gap={2}>
          <Button variant='contained' fullWidth onClick={handleSubmit}>
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

      <Typography variant='subtitle1' mb={1}>
        Action List
      </Typography>

      <Box sx={{ maxHeight: '60vh', overflowY: 'auto' }}>
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
            {rows?.length ? (
              rows.map((row, index) => (
                <tr key={row.id}>
                  <td>{index + 1}</td>

                  <td>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton size='small' onClick={() => handleEditClick(row)}>
                        <EditIcon fontSize='small' />
                      </IconButton>

                      <IconButton size='small' color='error' onClick={() => onDelete(row.id)}>
                        <DeleteIcon fontSize='small' />
                      </IconButton>
                    </Box>
                  </td>

                  <td>{row.name}</td>

                  <td>
                    <Chip
                      label={row.status === 1 ? 'Active' : 'Inactive'}
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
    </Box>
  )
}
