'use client'

import { useState, useEffect } from 'react'
import { Drawer, Box, Typography, IconButton, Divider, Grid, CircularProgress, Chip } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import CustomTextField from '@core/components/mui/TextField'
import GlobalButton from '@/components/common/GlobalButton'
import GlobalAutocomplete from '@/components/common/GlobalAutocomplete'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'
import { showToast } from '@/components/common/Toasts'
import { generateScheduleApi, adjustScheduleDayApi, saveTicketsApi } from '@/api/schedule'
import styles from '@core/styles/table.module.css'

const toApiDate = d => (d ? new Date(d).toISOString().split('T')[0] : null)

export default function ServicePlanDrawer({ open, onClose, contract, pestOptions }) {
  const [startDate, setStartDate] = useState(null)
  const [endDate, setEndDate] = useState(null)
  const [startTime, setStartTime] = useState('09:00')
  const [selectedPests, setSelectedPests] = useState([])
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(false)

  const handleGenerate = async () => {
    if (!contract?.id) return showToast('error', 'Contract not available')
    if (!startDate || !endDate) return showToast('error', 'Please select start and end date')
    if (!selectedPests.length) return showToast('error', 'Please select at least one pest')

    setLoading(true)
    try {
      const payload = {
        start_date: toApiDate(startDate),
        end_date: toApiDate(endDate),
        contract_id: contract.id,
        pest_id: selectedPests.map(p => p.pest_id).join(',')
      }

      const res = await generateScheduleApi(payload)
      console.log('API Response:', res) // ← இத check பண்ணு ஒரு தடவ

      // உன் backend response structure-படி மாத்திக்கோ
      const ticketsList = res?.data?.tickets || res?.data?.data?.tickets || []

      setTickets(ticketsList)

      if (ticketsList.length > 0) {
        showToast('success', `${ticketsList.length} service dates generated successfully!`)
      } else {
        showToast('info', 'No dates generated for selected criteria')
      }
    } catch (err) {
      console.error(err)
      showToast('error', err?.response?.data?.message || 'Failed to generate service plan')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!contract) return

    setStartDate(contract.start_date ? new Date(contract.start_date) : null)
    setEndDate(contract.end_date ? new Date(contract.end_date) : null)
    setStartTime(contract.time || '09:00')

    setSelectedPests([])
    setTickets([])
  }, [contract])

  const handleSave = async () => {
    if (!tickets.length) return showToast('error', 'No tickets to save')

    setLoading(true)

    try {
      const payload = {
        contract_id: contract.id, // 🔥 required by backend
        tickets: tickets.map(t => ({
          ticket_id: t.ticket_id || t.id,
          ticket_date: t.ticket_date,
          ticket_day: t.ticket_day,
          pest_id: t.pest_id
        }))
      }

      console.log('Save payload:', payload)

      const res = await saveTicketsApi(payload)

      console.log('Save response:', res)

      showToast('success', 'Tickets saved successfully!')
      onClose()
    } catch (err) {
      console.error(err)
      showToast('error', err?.response?.data?.message || 'Failed to save tickets')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setStartDate(null)
    setEndDate(null)
    setStartTime('09:00')
    setSelectedPests([])
    setTickets([])
    onClose()
  }

  return (
    <Drawer
      anchor='right'
      open={open}
      onClose={handleCancel}
      PaperProps={{
        sx: {
          width: 600,
          boxShadow: '0px 0px 15px rgba(0,0,0,0.08)'
        }
      }}
    >
      <Box sx={{ p: 5, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box display='flex' justifyContent='space-between' alignItems='center' mb={3}>
          <Typography variant='h5' fontWeight={600}>
            Generate Pre-Booked Service Plan
          </Typography>
          <IconButton onClick={handleCancel} size='small'>
            <CloseIcon />
          </IconButton>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 1 }}>
          <Grid container spacing={4}>
            <Grid item xs={12}>
              <Grid container spacing={2}>
                <Grid item xs={3}>
                  <CustomTextField
                    fullWidth
                    label='Contract Code'
                    value={contract?.contract_code || contract?.contractCode || ''}
                    disabled
                  />
                </Grid>

                <Grid item xs={9}>
                  <GlobalAutocomplete
                    label='Pests *'
                    multiple
                    options={pestOptions || []}
                    value={selectedPests}
                    getOptionLabel={o => o.display || ''}
                    isOptionEqualToValue={(opt, val) => opt.pest_id === val.pest_id}
                    onChange={v => setSelectedPests(v)}
                    required
                  />
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12}>
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <AppReactDatepicker
                    selected={startDate}
                    onChange={setStartDate}
                    customInput={<CustomTextField fullWidth label='Start Date *' required />}
                  />
                </Grid>

                <Grid item xs={4}>
                  <AppReactDatepicker
                    selected={endDate}
                    onChange={setEndDate}
                    customInput={<CustomTextField fullWidth label='End Date *' required />}
                  />
                </Grid>
                <Grid item xs={4}>
                  <CustomTextField
                    label='Preferred Start Time'
                    type='time'
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12}>
              <GlobalButton
                variant='contained'
                fullWidth
                onClick={handleGenerate}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : null}
              >
                {loading ? 'Generating...' : 'Generate Assignment Dates'}
              </GlobalButton>
            </Grid>

            {tickets.length > 0 && (
              <Grid item xs={12} mt={3}>
                <Typography variant='h6' fontWeight={600} mb={1.5}>
                  Service Schedule ({tickets.length})
                </Typography>

                <Box sx={{ maxHeight: '60vh', overflowY: 'auto' }}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th style={{ width: 60, textAlign: 'center' }}>S.No</th>
                        <th>Service Date</th>
                        <th>Day</th>
                        <th>Pest Type</th>
                      </tr>
                    </thead>

                    <tbody>
                      {tickets.map((t, i) => (
                        <tr key={i}>
                          <td style={{ textAlign: 'center', fontWeight: 600 }}>{i + 1}</td>

                          <td style={{ fontWeight: 600 }}>
                            <Box
                              sx={{ cursor: 'pointer' }}
                              onClick={() => document.getElementById(`date-input-${i}`).showPicker()}
                            >
                              {t.ticket_date}
                            </Box>

                            <input
                              id={`date-input-${i}`}
                              type='date'
                              value={t.ticket_date || ''}
                              onChange={async e => {
                                const newDate = e.target.value

                                try {
                                  const res = await adjustScheduleDayApi({
                                    ticket_id: t.ticket_id || t.id, // ID field
                                    ticket_date: newDate // 🔥 correct key required by backend
                                  })

                                  console.log('Schedule-day response:', res)

                                  const updatedDay =
                                    res?.data?.ticket_day || res?.data?.day || res?.ticket_day || res?.day || ''

                                  const finalDate = new Date(newDate).toISOString().split('T')[0]

                                  setTickets(prev => {
                                    const updated = [...prev]
                                    updated[i].ticket_date = finalDate
                                    updated[i].ticket_day = updatedDay
                                    return updated
                                  })

                                  showToast('success', 'Day updated automatically')
                                } catch (err) {
                                  console.error(err)
                                  showToast('error', err?.response?.data?.message || 'Failed to update schedule day')
                                }
                              }}
                              style={{
                                position: 'absolute',
                                opacity: 0,
                                pointerEvents: 'none',
                                width: 0,
                                height: 0
                              }}
                            />
                          </td>

                          <td style={{ textTransform: 'capitalize', fontWeight: 500 }}>{t.ticket_day}</td>

                          <td style={{ color: '#1976d2', fontWeight: 600 }}>{t.pest_name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Box>
              </Grid>
            )}
          </Grid>
        </Box>

        <Box mt={4}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <GlobalButton color='secondary' fullWidth onClick={handleCancel} disabled={loading}>
                Cancel
              </GlobalButton>
            </Grid>
            <Grid item xs={6}>
              <GlobalButton
                variant='contained'
                color='primary'
                fullWidth
                onClick={handleSave}
                disabled={tickets.length === 0}
              >
                Save Tickets
              </GlobalButton>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Drawer>
  )
}
