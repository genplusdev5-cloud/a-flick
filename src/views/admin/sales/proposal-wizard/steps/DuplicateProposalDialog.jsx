// React Imports
import { useState } from 'react'

// MUI Imports
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import Typography from '@mui/material/Typography'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Grid from '@mui/material/Grid'

// Component Imports
import DialogCloseButton from '@components/dialogs/DialogCloseButton'
import CustomTextField from '@core/components/mui/TextField'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'
import { getContractDates } from '@/api/contract_group/contract/getDates'

const DuplicateProposalDialog = ({ open, handleClose, onGenerate, contractType, frequency }) => {
  // States
  const [startDate, setStartDate] = useState(null)
  const [endDate, setEndDate] = useState(null)
  const [reminderDate, setReminderDate] = useState(null)
  const [loading, setLoading] = useState(false)

  // Helper to parse date strings (handles DD/MM/YYYY and YYYY-MM-DD)
  const parseDateString = dateStr => {
    if (!dateStr) return null
    if (dateStr instanceof Date) return dateStr

    // If it contains '-', assume YYYY-MM-DD
    if (dateStr.includes('-')) {
      const d = new Date(dateStr)
      return isNaN(d.getTime()) ? null : d
    }

    // Otherwise assume DD/MM/YYYY
    const [day, month, year] = dateStr.split('/').map(Number)
    if (!day || !month || !year) return null
    return new Date(year, month - 1, day)
  }

  const handleStartDateChange = async date => {
    setStartDate(date)
    if (date) {
      try {
        setLoading(true)
        const d = new Date(date)
        const year = d.getFullYear()
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')

        const payload = {
          start_date: `${year}-${month}-${day}`,
          contract_type: contractType || '',
          frequency: frequency || ''
        }
        const res = await getContractDates(payload)
        if (res?.data?.status === 'success') {
          const apiData = res.data.data
          setEndDate(parseDateString(apiData.end_date))
          setReminderDate(parseDateString(apiData.reminder_date))
        }
      } catch (e) {
        console.error('Error fetching contract dates:', e)
      } finally {
        setLoading(false)
      }
    }
  }

  const handleGenerate = () => {
    onGenerate({ startDate, endDate, reminderDate })
    handleClose()
  }

  return (
    <Dialog
      onClose={handleClose}
      aria-labelledby='duplicate-proposal-dialog-title'
      open={open}
      closeAfterTransition={false}
      PaperProps={{ sx: { overflow: 'visible' } }}
      maxWidth='sm'
      fullWidth
    >
      <DialogTitle id='duplicate-proposal-dialog-title'>
        <Typography variant='h5' component='span'>
          Duplicate Proposal
        </Typography>
        <DialogCloseButton onClick={handleClose} disableRipple>
          <i className='tabler-x' />
        </DialogCloseButton>
      </DialogTitle>
      <DialogContent>
        <Typography sx={{ mb: 6 }}>Please enter the new dates for the duplicated proposal.</Typography>
        <Grid container spacing={6}>
          <Grid item xs={12} sm={6}>
            <AppReactDatepicker
              selected={startDate}
              onChange={handleStartDateChange}
              dateFormat='dd/MM/yyyy'
              customInput={<CustomTextField fullWidth label='Start Date' placeholder='dd/mm/yyyy' />}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <AppReactDatepicker
              selected={endDate}
              onChange={date => setEndDate(date)}
              dateFormat='dd/MM/yyyy'
              customInput={<CustomTextField fullWidth label='End Date' placeholder='dd/mm/yyyy' />}
            />
          </Grid>
          <Grid item xs={12}>
            <AppReactDatepicker
              selected={reminderDate}
              onChange={date => setReminderDate(date)}
              dateFormat='dd/MM/yyyy'
              customInput={<CustomTextField fullWidth label='Reminder Date' placeholder='dd/mm/yyyy' />}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ pb: 6, px: 6 }}>
        <Button onClick={handleClose} variant='tonal' color='secondary'>
          Cancel
        </Button>
        <Button
          onClick={handleGenerate}
          variant='contained'
          color='primary'
          disabled={!startDate || !endDate || loading}
        >
          Generate
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default DuplicateProposalDialog
