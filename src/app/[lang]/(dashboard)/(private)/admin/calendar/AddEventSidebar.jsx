// React Imports
import { useState, useEffect, forwardRef, useCallback } from 'react'

// MUI Imports
import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import Grid from '@mui/material/Grid'
import MenuItem from '@mui/material/MenuItem'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'

// Third-party Imports
import { useForm, Controller } from 'react-hook-form'
import PerfectScrollbar from 'react-perfect-scrollbar'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'

// API Imports
import { getScheduleDetail } from '@/api/calendar/schedule/detail'
import { updateScheduleDetails } from '@/api/calendar/schedule/detailUpdate'
import { loadTechnicians } from '@/api/employee/loadTechnician'

// Slice Imports
import { selectedEvent, filterEvents } from '@/redux-store/slices/calendar'
import { toast } from 'react-toastify'

const AddEventSidebar = props => {
  // Props
  const { calendarStore, dispatch, addEventSidebarOpen, handleAddEventSidebarToggle } = props

  // States
  const [loading, setLoading] = useState(false)
  const [details, setDetails] = useState(null)
  const [technicians, setTechnicians] = useState([])

  // Hooks
  const isBelowSmScreen = useMediaQuery(theme => theme.breakpoints.down('sm'))

  const { control, setValue, handleSubmit, reset } = useForm()

  // Load Technicians
  useEffect(() => {
    loadTechnicians().then(res => setTechnicians(res || []))
  }, [])

  // Load Details on Event Select
  useEffect(() => {
    if (addEventSidebarOpen && calendarStore.selectedEvent) {
      fetchDetails(calendarStore.selectedEvent.id)
    } else {
      setDetails(null)
      reset({})
    }
  }, [addEventSidebarOpen, calendarStore.selectedEvent])

  const fetchDetails = async ticketId => {
    setLoading(true)
    try {
      const res = await getScheduleDetail(ticketId)
      const data = res?.data || {} // Adjust based on actual response structure
      setDetails(data)

      // Pre-fill form
      reset({
        schedule_date: data.schedule_date ? new Date(data.schedule_date) : null,
        schedule_start_time: data.schedule_start_time ? new Date(`1970-01-01T${data.schedule_start_time}`) : null,
        schedule_end_time: data.schedule_end_time ? new Date(`1970-01-01T${data.schedule_end_time}`) : null,
        appointment_date: data.appointment_date ? new Date(data.appointment_date) : null,
        start_time: data.start_time ? new Date(`1970-01-01T${data.start_time}`) : null,
        end_time: data.end_time ? new Date(`1970-01-01T${data.end_time}`) : null,
        from_technician: data.from_technician_id,
        to_technician: data.to_technician_id,
        is_confirmed: data.is_confirmed === 1
      })
    } catch (err) {
      console.error(err)
      toast.error('Failed to load schedule details')
    } finally {
      setLoading(false)
    }
  }

  const handleSidebarClose = () => {
    dispatch(selectedEvent(null))
    handleAddEventSidebarToggle()
    setDetails(null)
    reset()
  }

  const onSubmit = async data => {
    if (!details) return

    const formatTime = date => {
      if (!date) return null
      return date.toTimeString().split(' ')[0].substring(0, 5) // HH:mm
    }

    const formatDate = date => {
      if (!date) return null
      return date.toISOString().split('T')[0]
    }

    const payload = {
      ticket_id: details.id, // Assuming ID is ticket_id
      schedule_date: formatDate(data.schedule_date),
      schedule_start_time: formatTime(data.schedule_start_time),
      schedule_end_time: formatTime(data.schedule_end_time),
      appointment_date: formatDate(data.appointment_date),
      start_time: formatTime(data.start_time),
      end_time: formatTime(data.end_time),
      from_technician_id: data.from_technician,
      to_technician_id: data.to_technician,
      is_confirmed: data.is_confirmed ? 1 : 0
    }

    try {
      await updateScheduleDetails(payload)
      toast.success('Schedule updated successfully')
      dispatch(filterEvents()) // Refresh calendar
      handleSidebarClose()
    } catch (err) {
      console.error(err)
      toast.error('Failed to update schedule')
    }
  }

  const PickersComponent = forwardRef(({ ...props }, ref) => {
    return (
      <CustomTextField
        inputRef={ref}
        fullWidth
        {...props}
        label={props.label || ''}
        className='is-full'
        error={props.error}
      />
    )
  })

  // ScrollWrapper
  const ScrollWrapper = isBelowSmScreen ? 'div' : PerfectScrollbar

  if (!details && loading) {
    return (
      <Drawer anchor='right' open={addEventSidebarOpen} onClose={handleSidebarClose}>
        <Box p={5}>Loading...</Box>
      </Drawer>
    )
  }

  return (
    <Drawer
      anchor='right'
      open={addEventSidebarOpen}
      onClose={handleSidebarClose}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: ['100%', 600] } }} // Wider drawer
    >
      <Box className='flex justify-between items-center sidebar-header plb-5 pli-6 border-be'>
        <Typography variant='h5'>Service Details</Typography>
        <IconButton size='small' onClick={handleSidebarClose}>
          <i className='tabler-x text-2xl text-textPrimary' />
        </IconButton>
      </Box>

      <ScrollWrapper
        {...(isBelowSmScreen
          ? { className: 'bs-full overflow-y-auto overflow-x-hidden' }
          : { options: { wheelPropagation: false, suppressScrollX: true } })}
      >
        <Box className='sidebar-body plb-5 pli-6'>
          <form onSubmit={handleSubmit(onSubmit)} autoComplete='off'>
            <Grid container spacing={3}>
              {/* Row 1: Schedule Date/Time */}
              <Grid item xs={4}>
                <Controller
                  name='schedule_date'
                  control={control}
                  render={({ field }) => (
                    <AppReactDatepicker
                      selected={field.value}
                      onChange={field.onChange}
                      customInput={<PickersComponent label='Schedule Date' fullWidth />}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={4}>
                <Controller
                  name='schedule_start_time'
                  control={control}
                  render={({ field }) => (
                    <AppReactDatepicker
                      selected={field.value}
                      showTimeSelect
                      showTimeSelectOnly
                      timeIntervals={15}
                      dateFormat='HH:mm'
                      onChange={field.onChange}
                      customInput={<PickersComponent label='Schedule Start Time' fullWidth />}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={4}>
                <Controller
                  name='schedule_end_time'
                  control={control}
                  render={({ field }) => (
                    <AppReactDatepicker
                      selected={field.value}
                      showTimeSelect
                      showTimeSelectOnly
                      timeIntervals={15}
                      dateFormat='HH:mm'
                      onChange={field.onChange}
                      customInput={<PickersComponent label='Schedule End Time' fullWidth />}
                    />
                  )}
                />
              </Grid>

              {/* Row 2: Appointment Date/Time */}
              <Grid item xs={4}>
                <Controller
                  name='appointment_date'
                  control={control}
                  render={({ field }) => (
                    <AppReactDatepicker
                      selected={field.value}
                      onChange={field.onChange}
                      customInput={<PickersComponent label='Appointment Date' fullWidth />}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={4}>
                <Controller
                  name='start_time'
                  control={control}
                  render={({ field }) => (
                    <AppReactDatepicker
                      selected={field.value}
                      showTimeSelect
                      showTimeSelectOnly
                      timeIntervals={15}
                      dateFormat='HH:mm'
                      onChange={field.onChange}
                      customInput={<PickersComponent label='Start Time' fullWidth />}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={4}>
                <Controller
                  name='end_time'
                  control={control}
                  render={({ field }) => (
                    <AppReactDatepicker
                      selected={field.value}
                      showTimeSelect
                      showTimeSelectOnly
                      timeIntervals={15}
                      dateFormat='HH:mm'
                      onChange={field.onChange}
                      customInput={<PickersComponent label='End Time' fullWidth />}
                    />
                  )}
                />
              </Grid>

              {/* Row 3: Technicians & Business */}
              <Grid item xs={4}>
                 <Controller
                  name='from_technician'
                  control={control}
                  render={({ field }) => (
                    <CustomTextField select fullWidth label='From Technicians' {...field}>
                      {technicians.map(tech => (
                        <MenuItem key={tech.id} value={tech.id}>
                          {tech.username}
                        </MenuItem>
                      ))}
                    </CustomTextField>
                  )}
                />
              </Grid>
              <Grid item xs={4}>
                 <Controller
                  name='to_technician'
                  control={control}
                  render={({ field }) => (
                    <CustomTextField select fullWidth label='To Technicians' {...field}>
                      {technicians.map(tech => (
                        <MenuItem key={tech.id} value={tech.id}>
                          {tech.username}
                        </MenuItem>
                      ))}
                    </CustomTextField>
                  )}
                />
              </Grid>
              <Grid item xs={4}>
                <CustomTextField
                  fullWidth
                  label='Business Name'
                  value={details?.business_name || ''}
                  disabled
                />
              </Grid>

               {/* Row 4: Address */}
               <Grid item xs={4}>
                <CustomTextField
                  fullWidth
                  label='Service Address'
                  value={details?.service_address || ''}
                  disabled
                />
              </Grid>
              <Grid item xs={4}>
                <CustomTextField
                  fullWidth
                  label='Postal code'
                  value={details?.postal_code || ''}
                  disabled
                />
              </Grid>
               <Grid item xs={4}>
                <CustomTextField
                  fullWidth
                  label='Pest Code'
                  value={details?.pest_code || ''}
                  disabled
                />
              </Grid>

              {/* Row 5: Contact */}
              <Grid item xs={4}>
                <CustomTextField
                  fullWidth
                  label='Contact Person'
                  value={details?.contact_person || ''}
                  disabled
                />
              </Grid>
               <Grid item xs={4}>
                <CustomTextField
                  fullWidth
                  label='Phone'
                  value={details?.phone || ''}
                  disabled
                />
              </Grid>
              <Grid item xs={4}>
                <CustomTextField
                  fullWidth
                  label='Mobile'
                  value={details?.mobile || ''}
                  disabled
                />
              </Grid>


              {/* Row 6: Remarks 1 */}
              <Grid item xs={6}>
                 <CustomTextField
                  fullWidth
                  multiline
                  rows={3}
                  label='Appointment Remarks (From Contract)'
                  value={details?.contract_appt_remarks || ''}
                  disabled
                />
              </Grid>
              <Grid item xs={6}>
                 <CustomTextField
                  fullWidth
                  multiline
                  rows={3}
                  label='Technician Remarks (From Contract)'
                  value={details?.contract_tech_remarks || ''}
                  disabled
                />
              </Grid>

              {/* Row 7: Confirm & Call Type */}
              <Grid item xs={6} display='flex' alignItems='center'>
                  <Controller
                  name='is_confirmed'
                  control={control}
                  render={({ field }) => (
                     <FormControlLabel
                        control={<Checkbox checked={field.value} onChange={field.onChange} />}
                        label='Confirm?'
                      />
                  )}
                />
              </Grid>
              <Grid item xs={6}>
                 <CustomTextField
                  fullWidth
                  label='Call Type'
                  value={details?.schedule_type || 'Call & Fix'} // Assuming default
                  disabled
                />
              </Grid>

              {/* Row 8: Remarks 2 (Non-editable as per strict instruction) */}
               <Grid item xs={6}>
                 <CustomTextField
                  fullWidth
                  multiline
                  rows={3}
                  label='Appointment Remarks (this service)'
                  value={details?.service_appt_remarks || ''}
                  disabled
                />
              </Grid>
              <Grid item xs={6}>
                 <CustomTextField
                  fullWidth
                  multiline
                  rows={3}
                  label='Special note for Technician (this service)'
                  value={details?.service_tech_remarks || ''}
                  disabled
                />
              </Grid>
            </Grid>

            {/* Footer */}
            <Box mt={4} display='flex' justifyContent='flex-end' gap={2}>
              <Button variant='contained' color='warning'>Edit</Button>
              <Button variant='contained' color='secondary' onClick={handleSidebarClose}>Close</Button>
               <Button type='submit' variant='contained' color='primary'>
                Save
              </Button>
            </Box>
          </form>
        </Box>
      </ScrollWrapper>
    </Drawer>
  )
}

export default AddEventSidebar
