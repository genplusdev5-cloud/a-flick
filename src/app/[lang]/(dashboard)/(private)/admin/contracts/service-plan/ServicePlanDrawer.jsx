'use client'

import { useState, useEffect } from 'react'
import { Drawer, Box, Typography, IconButton, Divider, Grid, CircularProgress } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import CustomTextField from '@core/components/mui/TextField'
import GlobalButton from '@/components/common/GlobalButton'
import GlobalAutocomplete from '@/components/common/GlobalAutocomplete'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'
import { showToast } from '@/components/common/Toasts'
import { generateScheduleApi } from '@/api/schedule'

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
      const ticketsList = res?.data?.data?.tickets || []
      setTickets(ticketsList)

      showToast('success', 'Assignment dates generated successfully!')
    } catch (err) {
      console.error(err)
      showToast('error', 'Failed to generate service plan')
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

  const handleSave = () => {
    showToast('success', 'Tickets generated successfully!')
    onClose()
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
              <Grid item xs={12}>
                <Typography variant='subtitle2' gutterBottom>
                  Generated Service Dates ({tickets.length})
                </Typography>

                <Box
                  sx={{
                    maxHeight: 350,
                    overflowY: 'auto',
                    border: '1px solid #ddd',
                    borderRadius: 1
                  }}
                >
                  <Grid container sx={{ bgcolor: '#f6f6f6', p: 1, borderBottom: '1px solid #ddd' }}>
                    <Grid item xs={4}>
                      <Typography fontWeight={600} fontSize='0.8rem'>
                        Date
                      </Typography>
                    </Grid>
                    <Grid item xs={3}>
                      <Typography fontWeight={600} fontSize='0.8rem'>
                        Day
                      </Typography>
                    </Grid>
                    <Grid item xs={5}>
                      <Typography fontWeight={600} fontSize='0.8rem'>
                        Service
                      </Typography>
                    </Grid>
                  </Grid>

                  {tickets.map((t, index) => (
                    <Grid
                      container
                      key={index}
                      sx={{
                        p: 1.2,
                        alignItems: 'center',
                        borderBottom: index !== tickets.length - 1 ? '1px solid #eee' : 'none',
                        '&:hover': { bgcolor: '#fafafa' }
                      }}
                    >
                      <Grid item xs={4}>
                        <Typography fontSize='0.8rem'>{t.ticket_date}</Typography>
                      </Grid>
                      <Grid item xs={3}>
                        <Typography fontSize='0.8rem' sx={{ textTransform: 'capitalize' }}>
                          {t.ticket_day}
                        </Typography>
                      </Grid>
                      <Grid item xs={5}>
                        <Typography fontSize='0.8rem'>
                          {t.pest_name} — {t.frequency}
                        </Typography>
                      </Grid>
                    </Grid>
                  ))}
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
                color='success'
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
