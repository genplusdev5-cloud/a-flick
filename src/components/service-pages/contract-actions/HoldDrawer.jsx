'use client'

import { useState } from 'react'
import { Box, Grid, Typography, IconButton, Divider, Button } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'

import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'
import CustomTextField from '@core/components/mui/TextField'
import GlobalTextarea from '@/components/common/GlobalTextarea'
import { holdContract } from '@/api/contract/icons/hold'
import { showToast } from '@/components/common/Toasts'

export default function HoldDrawer({ contractId, onClose, reload }) {
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    hold_date: '',
    hold_remark: ''
  })

  const handleSubmit = async () => {
    if (!form.hold_date) {
      showToast('warning', 'Hold date is required')
      return
    }

    if (!form.hold_remark) {
      showToast('warning', 'Hold remark is required')
      return
    }

    const payload = {
      contract_id: contractId,
      hold_date: form.hold_date,
      hold_remarks: form.hold_remark
    }

    setLoading(true)

    try {
      const res = await holdContract(payload)

      if (res.status === 'success') {
        showToast('success', 'Contract moved to Hold successfully')
        reload()
        onClose()
      } else {
        showToast('error', res.message || 'Failed to update contract')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* HEADER */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant='h6' fontWeight={600}>
          Hold Contract
        </Typography>

        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* BODY */}
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        <Grid container spacing={2}>
          {/* HOLD DATE */}
          <Grid item xs={12}>
            <Typography variant='body2' fontWeight={500} mb={0.5}>
              Hold Date
            </Typography>

            <AppReactDatepicker
              selected={form.hold_date ? new Date(form.hold_date) : null}
              onChange={date => {
                const formatted = date ? date.toISOString().split('T')[0] : ''
                setForm(prev => ({ ...prev, hold_date: formatted }))
              }}
              placeholderText='Select hold date'
              customInput={<CustomTextField fullWidth />}
            />
          </Grid>

          {/* HOLD REMARKS */}
          <Grid item xs={12}>
            <GlobalTextarea
              label='Hold Remarks'
              minRows={4}
              value={form.hold_remark}
              onChange={e => setForm(prev => ({ ...prev, hold_remark: e.target.value }))}
            />
          </Grid>
        </Grid>

        {/* BUTTONS */}
        <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
          <Button fullWidth variant='contained' color='primary' disabled={loading} onClick={handleSubmit}>
            Hold
          </Button>

          <Button fullWidth variant='outlined' color='primary' onClick={onClose}>
            Cancel
          </Button>
        </Box>
      </Box>
    </Box>
  )
}
