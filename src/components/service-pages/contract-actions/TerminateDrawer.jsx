'use client'

import { useState } from 'react'
import { Box, Grid, Typography, IconButton, Divider, Button } from '@mui/material'
import CustomTextFieldWrapper from '@/components/common/CustomTextField'
import GlobalTextarea from '@/components/common/GlobalTextarea'
import { terminateContract } from '@/api/contract/icons/terminate'
import { showToast } from '@/components/common/Toasts'
import CloseIcon from '@mui/icons-material/Close'

import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'
import CustomTextField from '@core/components/mui/TextField'

export default function TerminateDrawer({ contractId, onClose, reload }) {
  const [loading, setLoading] = useState(false)

  const formatDate = date => {
    if (!date) return ''
    const d = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    return d.toISOString().split('T')[0]
  }

  const [form, setForm] = useState({
    termination_date: '',
    remarks: ''
  })

  const handleSubmit = async () => {
    if (!form.termination_date) {
      showToast('warning', 'Termination date is required')
      return
    }

    if (!form.remarks.trim()) {
      showToast('warning', 'Termination remark is required')
      return
    }

 const payload = {
  contract_id: contractId,
  termination_date: form.termination_date,
  termination_remarks: form.remarks.trim()
}


    console.log('Terminating contract with payload:', payload) // Debug line

    setLoading(true)

    try {
      const res = await terminateContract(payload)

      if (res.status === 'success') {
        showToast('success', 'Contract terminated successfully')
        reload()
        onClose()
      } else {
        showToast('error', res.message || 'Failed to terminate contract')
      }
    } catch (err) {
      console.error('Terminate error:', err.response?.data || err)
      showToast('error', err.response?.data?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* ---------- HEADER ---------- */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant='h6' fontWeight={600}>
          Terminate Contract
        </Typography>

        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* ---------- FORM BODY ---------- */}
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant='body2' fontWeight={500} mb={0.5}>
              Termination Date
            </Typography>

            <AppReactDatepicker
              selected={form.termination_date ? new Date(form.termination_date) : null}
              onChange={date => {
                const formatted = formatDate(date)
                setForm(prev => ({ ...prev, termination_date: formatted }))
              }}
              placeholderText='Select termination date'
              customInput={<CustomTextField fullWidth />}
            />
          </Grid>

          <Grid item xs={12}>
            <GlobalTextarea
              label='Termination Remarks'
              minRows={4}
              value={form.remarks}
              onChange={e => setForm(prev => ({ ...prev, remarks: e.target.value }))}
            />
          </Grid>
        </Grid>

        {/* ---------- FOOTER BUTTONS ---------- */}
        <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
          <Button variant='contained' fullWidth color='primary' disabled={loading} onClick={handleSubmit}>
            Terminate
          </Button>

          <Button variant='outlined' fullWidth color='primary' onClick={onClose}>
            Cancel
          </Button>
        </Box>
      </Box>
    </Box>
  )
}
