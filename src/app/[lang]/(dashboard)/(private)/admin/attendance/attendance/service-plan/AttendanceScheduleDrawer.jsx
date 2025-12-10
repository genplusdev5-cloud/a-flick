'use client'

import { useState, useEffect } from 'react'
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  Grid,
  Checkbox,
  FormControlLabel,
  CircularProgress
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import CustomTextField from '@core/components/mui/TextField'
import GlobalButton from '@/components/common/GlobalButton'
import GlobalAutocomplete from '@/components/common/GlobalAutocomplete'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'

export default function AttendancePlanDrawer({ open, onClose, attendance, slots = [], technicians = [] }) {
  const [startDate, setStartDate] = useState(null)
  const [endDate, setEndDate] = useState(null)
  const [selectedSlot, setSelectedSlot] = useState([])
  const [selectedTechnicians, setSelectedTechnicians] = useState([])
  const [weekDays, setWeekDays] = useState({
    Monday: true,
    Tuesday: true,
    Wednesday: true,
    Thursday: true,
    Friday: true,
    Saturday: false,
    Sunday: false
  })

  const [loading, setLoading] = useState(false)
  const [scheduleRows, setScheduleRows] = useState([])

  useEffect(() => {
    if (open) {
      setWeekDays({
        Monday: true,
        Tuesday: true,
        Wednesday: true,
        Thursday: true,
        Friday: true,
        Saturday: false,
        Sunday: false
      })
    }
  }, [open])

  useEffect(() => {
    if (!attendance) return

    // Pre-select assigned slot
    const assignedSlot = (attendance?.slot || []).map(s => ({
      label: s.slot_name,
      value: s.slot_id // backend linked slot id
    }))
    setSelectedSlot(assignedSlot)

    // Pre-select assigned technician
    if (attendance?.technician && attendance?.technician !== '-') {
      setSelectedTechnicians([
        {
          label: attendance.technician,
          value: attendance.technician_id
        }
      ])
    } else {
      setSelectedTechnicians([])
    }
  }, [attendance])

  // Autofill when opening
  useEffect(() => {
    if (!attendance) return
    setScheduleRows([]) // reset
  }, [attendance])

  const toggleDay = day =>
    setWeekDays(prev => ({
      ...prev,
      [day]: !prev[day]
    }))

  const handleAssignDates = () => {
    setLoading(true)
    setTimeout(() => {
      // Example temp rows
      setScheduleRows([
        { date: '10-12-2025', day: 'Wednesday' },
        { date: '17-12-2025', day: 'Wednesday' }
      ])
      setLoading(false)
    }, 1200)
  }

  const handleSave = () => {
    alert('Saving later bro 🚀')
  }

  return (
    <Drawer anchor='right' open={open} onClose={onClose} PaperProps={{ sx: { width: 600 } }}>
      <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <Box display='flex' justifyContent='space-between' alignItems='center'>
          <Typography variant='h6' fontWeight={600}>
            Generate Pre-Schedule Attendance
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Form */}
        <Grid container spacing={3}>
          {/* Code */}
          <Grid item xs={4}>
            <CustomTextField label='Code' fullWidth value={attendance?.attendance_code || ''} disabled />
          </Grid>

          {/* Slot */}
          <Grid item xs={8}>
            {/* Slot Dropdown */}
            <GlobalAutocomplete
              label='Slots'
              multiple
              value={selectedSlot}
              options={(attendance?.slot || []).map(s => ({
                label: s.slot_name,
                value: s.slot_id ?? s.id // backend internal slot id
              }))}
              onChange={setSelectedSlot}
            />
          </Grid>

          {/* Checkboxes */}
          <Grid item xs={12}>
            <Box display='flex' gap={4}>
              <FormControlLabel control={<Checkbox />} label='Include PH' />
              <FormControlLabel control={<Checkbox />} label='Only Public Holidays' />
            </Box>
          </Grid>

          {/* Technicians */}
          <Grid item xs={12}>
            <GlobalAutocomplete
              label='Technicians'
              multiple
              value={selectedTechnicians}
              options={
                attendance?.technician && attendance?.technician !== '-'
                  ? [
                      {
                        label: attendance?.technician,
                        value: attendance?.technician_id
                      }
                    ]
                  : []
              }
              onChange={setSelectedTechnicians}
            />
          </Grid>

          {/* Week Days */}
          <Grid item xs={12}>
            <Box display='flex' flexWrap='wrap' gap={2}>
              {Object.keys(weekDays).map(day => (
                <FormControlLabel
                  key={day}
                  control={<Checkbox checked={weekDays[day]} onChange={() => toggleDay(day)} />}
                  label={day}
                />
              ))}
            </Box>
          </Grid>

          {/* Date Range */}
          <Grid item xs={6}>
            <AppReactDatepicker
              selected={startDate}
              onChange={setStartDate}
              customInput={<CustomTextField label='Start Date' fullWidth />}
            />
          </Grid>

          <Grid item xs={6}>
            <AppReactDatepicker
              selected={endDate}
              onChange={setEndDate}
              customInput={<CustomTextField label='End Date' fullWidth />}
            />
          </Grid>

          {/* Button */}
          <Grid item xs={12}>
            <GlobalButton
              variant='contained'
              fullWidth
              onClick={handleAssignDates}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={18} /> : null}
            >
              Assign Dates
            </GlobalButton>
          </Grid>

          {/* Table */}
          {scheduleRows.length > 0 && (
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant='subtitle1' fontWeight={600}>
                Generated Schedule ({scheduleRows.length})
              </Typography>

              <Box mt={2}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th>S.No</th>
                      <th>Date</th>
                      <th>Day</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scheduleRows.map((row, i) => (
                      <tr key={i}>
                        <td>{i + 1}</td>
                        <td>{row.date}</td>
                        <td>{row.day}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            </Grid>
          )}
        </Grid>

        {/* Footer */}
        <Box mt='auto'>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <GlobalButton fullWidth color='secondary' onClick={onClose}>
                Close
              </GlobalButton>
            </Grid>
            <Grid item xs={6}>
              <GlobalButton
                variant='contained'
                color='primary'
                fullWidth
                disabled={!scheduleRows.length}
                onClick={handleSave}
              >
                Save
              </GlobalButton>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Drawer>
  )
}
