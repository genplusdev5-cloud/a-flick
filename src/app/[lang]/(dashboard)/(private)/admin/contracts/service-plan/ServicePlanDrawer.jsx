'use client'
import { useState } from 'react'
import { Drawer, Box, Typography } from '@mui/material'

import CustomTextField from '@core/components/mui/TextField'
import GlobalButton from '@/components/common/GlobalButton'
import GlobalAutocomplete from '@/components/common/GlobalAutocomplete'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'
import { generateScheduleApi, addTicketsApi } from '@/api/contract'
import { showToast } from '@/components/common/Toasts'

const toApiDate = d => (d ? new Date(d).toISOString().split('T')[0] : null)

export default function ServicePlanDrawer({ open, onClose, contract, pestOptions }) {
  const [startDate, setStartDate] = useState(null)
  const [endDate, setEndDate] = useState(null)
  const [startTime, setStartTime] = useState('09:00')
  const [selectedPests, setSelectedPests] = useState([])
  const [tickets, setTickets] = useState([])

  const handleGenerate = async () => {
    if (!contract?.id) {
      showToast('error', 'Contract not available')
      return
    }

    if (!startDate || !endDate) {
      showToast('error', 'Please select start and end date')
      return
    }

    if (!selectedPests.length) {
      showToast('error', 'Please select at least one pest')
      return
    }

    try {
      const payload = {
        start_date: toApiDate(startDate),
        end_date: toApiDate(endDate),
        contract_id: contract.id,
        pest_id: selectedPests.map(p => p.pest_id || p.id).join(',') // support both shapes
      }

      const res = await generateScheduleApi(payload)
      setTickets(res?.data?.tickets || [])
    } catch (err) {
      console.error(err)
      showToast('error', 'Failed to generate service plan')
    }
  }

  const handleSave = async () => {
    if (!contract?.id) {
      showToast('error', 'Contract not available')
      return
    }

    if (!tickets.length) {
      showToast('error', 'Please generate assignment dates first')
      return
    }

    try {
      const payload = {
        ticket_common: {
          contract_id: contract.id,
          ticket_type: 'AMC',
          start_time: startTime,
          is_alloted: 1,
          is_completed: 0,
          is_checklist: 1
        },
        pest_items: selectedPests.map(p => ({
          pest_id: p.pest_id || p.id,
          pest_name: p.pest_name || p.name || p.pest || '',
          frequency: p.frequency || p.frequency_name || '',
          frequency_id: p.frequency_id || null
        })),
        tickets
      }

      await addTicketsApi(payload)
      showToast('success', 'Tickets Saved Successfully!')
      onClose()
    } catch (err) {
      console.error(err)
      showToast('error', 'Failed to save tickets')
    }
  }

  return (
    <Drawer anchor='right' open={open} onClose={onClose} PaperProps={{ sx: { width: 450 } }}>
      <Box sx={{ p: 4 }}>
        <Typography variant='h6' gutterBottom>
          Generate a Pre-Booked Service Plan
        </Typography>

        <CustomTextField
          fullWidth
          label='Contract Code'
          value={contract?.contract_code || contract?.contractCode || ''}
          sx={{ mb: 3 }}
          disabled
        />

        <GlobalAutocomplete
          label='Pests'
          multiple
          options={pestOptions || []}
          value={selectedPests}
          getOptionLabel={o => o.pest_name || o.name || o.pest || ''}
          onChange={v => setSelectedPests(v)}
        />

        <Box sx={{ mt: 3 }}>
          <AppReactDatepicker
            selected={startDate}
            onChange={setStartDate}
            customInput={<CustomTextField fullWidth label='Start Date' />}
          />

          <AppReactDatepicker
            selected={endDate}
            onChange={setEndDate}
            customInput={<CustomTextField fullWidth label='End Date' sx={{ mt: 3 }} />}
          />
        </Box>

        <CustomTextField
          label='Start Time'
          type='time'
          value={startTime}
          onChange={e => setStartTime(e.target.value)}
          fullWidth
          sx={{ mt: 3 }}
        />

        <GlobalButton variant='contained' fullWidth sx={{ mt: 3 }} onClick={handleGenerate}>
          Assignment Date
        </GlobalButton>

        {/* Generated Dates */}
        <Box sx={{ mt: 3, maxHeight: 300, overflowY: 'auto' }}>
          {tickets.map((t, i) => (
            <Box key={i} sx={{ py: 1, borderBottom: '1px solid #eee' }}>
              <Typography>{t.ticket_date}</Typography>
              <Typography sx={{ fontSize: 12, opacity: 0.7 }}>{t.ticket_day}</Typography>
            </Box>
          ))}
        </Box>

        <GlobalButton variant='contained' color='success' fullWidth sx={{ mt: 3 }} onClick={handleSave}>
          Save Tickets
        </GlobalButton>
      </Box>
    </Drawer>
  )
}
