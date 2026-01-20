'use client'

import { useState, useEffect } from 'react'
import { Box, Grid, Typography, IconButton, Divider, Button } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'

import GlobalTextField from '@/components/common/GlobalTextField'
import { showToast } from '@/components/common/Toasts'
import { updateContractValueApi } from '@/api/contract_group/contract/icons/contractValueUpdate'

export default function ContractValueDrawerContent({
  contractId,
  initialValue,
  onClose, // ← MUST HAVE
  onValueUpdate // ← BETTER THAN reload()
}) {
  const [value, setValue] = useState(initialValue || '')
  const [loading, setLoading] = useState(false)

  // Sync value when drawer reopens
  useEffect(() => {
    setValue(initialValue || '')
  }, [initialValue])

  const handleSubmit = async () => {
    if (!value || Number(value) <= 0) {
      showToast('warning', 'Please enter a valid amount')
      return
    }

    const numValue = Number(value).toFixed(2)

    setLoading(true)
    try {
      const res = await updateContractValueApi({
        contractId,
        contractLevelId: 1,
        value: numValue
      })

      if (res.status === 'success') {
        showToast('success', 'Contract value updated successfully!')
        onValueUpdate?.(numValue) // ← Update parent instantly
        onClose() // ← Close drawer
      } else {
        showToast('error', res.message || 'Failed to update')
      }
    } catch (err) {
      showToast('error', 'Something went wrong')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ width: 420, p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant='h6' fontWeight={600}>
          Update Contract Value
        </Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Divider sx={{ mb: 3 }} />

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant='body2' fontWeight={500} gutterBottom>
            Contract Value ($)
          </Typography>
          <GlobalTextField
            fullWidth
            type='number'
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder='0.00'
            inputProps={{ step: '0.01' }}
          />
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
        <Button fullWidth variant='contained' onClick={handleSubmit} disabled={loading}>
          {loading ? 'Saving...' : 'Update'}
        </Button>
        <Button fullWidth variant='outlined' onClick={onClose}>
          Cancel
        </Button>
      </Box>
    </Box>
  )
}
