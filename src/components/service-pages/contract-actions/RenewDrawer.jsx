'use client'

import { useState } from 'react'
import { Box, Grid, Typography, IconButton, Divider, Button } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'

import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'
import CustomTextField from '@core/components/mui/TextField'
import GlobalTextarea from '@/components/common/GlobalTextarea'

import { renewContract } from '@/api/contract/icons/renew'
import { showToast } from '@/components/common/Toasts'

export default function RenewDrawer({ contractId, onClose, reload }) {
  const [loading, setLoading] = useState(false)

  const formatDate = date => {
    if (!date) return ''
    const d = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    return d.toISOString().split('T')[0]
  }

  const [form, setForm] = useState({
    start_date: '',
    end_date: '',
    reminder_date: ''
  })

  const handleSubmit = async () => {
    if (!form.start_date) {
      showToast('warning', 'Start date is required')
      return
    }
    if (!form.end_date) {
      showToast('warning', 'End date is required')
      return
    }
    if (!form.reminder_date) {
      showToast('warning', 'Reminder date is required')
      return
    }

    const payload = {
      contract_id: contractId,
      start_date: form.start_date,
      end_date: form.end_date,
      reminder_date: form.reminder_date
    }

    console.log('RENEW PAYLOAD:', payload)

    setLoading(true)

    try {
      const res = await renewContract(payload)

      if (res.status === 'success') {
        showToast('success', 'Contract renewed successfully!')
        reload()
        onClose()
      } else {
        showToast('error', res.message || 'Failed to renew contract')
      }
    } catch (err) {
      console.error('Renew error:', err.response?.data || err)
      showToast('error', err.response?.data?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* HEADER */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant='h6' fontWeight={600}>
          Renew Contract
        </Typography>

        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* BODY */}
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        <Grid container spacing={2}>
          {/* START DATE */}
          <Grid item xs={12}>
            <Typography variant='body2' fontWeight={500} mb={0.5}>
              Start Date
            </Typography>

            <AppReactDatepicker
              selected={form.start_date ? new Date(form.start_date) : null}
              onChange={date => {
                setForm(prev => ({ ...prev, start_date: formatDate(date) }))
              }}
              placeholderText='Select start date'
              customInput={<CustomTextField fullWidth />}
            />
          </Grid>

          {/* END DATE */}
          <Grid item xs={12}>
            <Typography variant='body2' fontWeight={500} mb={0.5}>
              End Date
            </Typography>

            <AppReactDatepicker
              selected={form.end_date ? new Date(form.end_date) : null}
              onChange={date => {
                setForm(prev => ({ ...prev, end_date: formatDate(date) }))
              }}
              placeholderText='Select end date'
              customInput={<CustomTextField fullWidth />}
            />
          </Grid>

          {/* REMINDER DATE */}
          <Grid item xs={12}>
            <Typography variant='body2' fontWeight={500} mb={0.5}>
              Reminder Date
            </Typography>

            <AppReactDatepicker
              selected={form.reminder_date ? new Date(form.reminder_date) : null}
              onChange={date => {
                setForm(prev => ({ ...prev, reminder_date: formatDate(date) }))
              }}
              placeholderText='Select reminder date'
              customInput={<CustomTextField fullWidth />}
            />
          </Grid>
        </Grid>

        {/* BUTTONS */}
        <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
          <Button variant='contained' fullWidth color='primary' disabled={loading} onClick={handleSubmit}>
            Renew
          </Button>

          <Button variant='outlined' fullWidth color='primary' onClick={onClose}>
            Cancel
          </Button>
        </Box>
      </Box>
    </Box>
  )
}
