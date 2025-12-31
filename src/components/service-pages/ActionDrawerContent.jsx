'use client'

import { useState } from 'react'
import { Box, Button, Typography, IconButton, Chip, Grid } from '@mui/material'

import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'

import CustomTextFieldWrapper from '@/components/common/CustomTextField'
import GlobalSelect from '@/components/common/GlobalSelect'

import styles from '@core/styles/table.module.css'
import { showToast } from '@/components/common/Toasts'
import { addAction, updateAction } from '@/api/actions'
import GlobalButton from '../common/GlobalButton'

import { usePermission } from '@/hooks/usePermission'

export default function ActionDrawerContent({ pestId, rows, reload, onDelete }) {
  const { canAccess } = usePermission()
  const [editId, setEditId] = useState(null)
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    status: 'Active'
  })

  const statusOptions = [
    { label: 'Active', value: 'Active' },
    { label: 'Inactive', value: 'Inactive' }
  ]

  // -------------------------
  // ADD / UPDATE
  // -------------------------
  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      showToast('warning', 'Action name required')
      return
    }

    const payload = {
      name: formData.name,
      pest_id: pestId,
      is_active: formData.status === 'Active' ? 1 : 0 // FIXED
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
        reload() // parent reload
      } else {
        showToast('error', res.message || 'Operation failed')
      }
    } finally {
      setLoading(false)
    }
  }

  // -------------------------
  // EDIT
  // -------------------------
  const handleEditClick = row => {
    setEditId(row.id)
    setFormData({
      name: row.name,
      status: row.is_active === 1 ? 'Active' : 'Inactive' // FIXED
    })
  }

  return (
    <Box>
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

        {/* STATUS FIELD ONLY WHEN EDIT */}
        {editId && (
          <Grid item xs={12}>
            <GlobalSelect
              label='Status'
              fullWidth
              value={formData.status}
              placeholder='Select status'
              options={statusOptions}
              onChange={e =>
                setFormData(prev => ({
                  ...prev,
                  status: e.target.value // ⭐ CORRECT FIX
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
            <GlobalButton variant='contained' fullWidth disabled={loading} onClick={handleSubmit}>
              {editId ? 'Update Action' : 'Add Action'}
            </GlobalButton>
          )}
        </Grid>
      </Grid>

      {/* LIST */}
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
                      {canAccess('Service Type (Pest)', 'update') && (
                        <IconButton size='small' color='primary' onClick={() => handleEditClick(row)}>
                          <i className='tabler-edit' />
                        </IconButton>
                      )}

                      {canAccess('Service Type (Pest)', 'delete') && (
                        <IconButton size='small' color='error' onClick={() => onDelete(row.id)}>
                          <i className='tabler-trash text-red-600 text-lg' />
                        </IconButton>
                      )}
                    </Box>
                  </td>

                  <td>{row.name}</td>

                  <td>
                    <Chip
                      label={row.is_active === 1 ? 'Active' : 'Inactive'} // FIXED
                      size='small'
                      sx={{
                        color: '#fff',
                        bgcolor: row.is_active === 1 ? 'success.main' : 'error.main',
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
