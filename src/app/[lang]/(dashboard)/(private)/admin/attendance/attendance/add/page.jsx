'use client'

import { useRef, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

import {
  Box,
  Card,
  Grid,
  Typography,
  IconButton,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Divider
} from '@mui/material'

import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'

import ContentLayout from '@/components/layout/ContentLayout'
import GlobalButton from '@/components/common/GlobalButton'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'
import CustomTextField from '@core/components/mui/TextField'
import { Autocomplete } from '@mui/material'
import { showToast } from '@/components/common/Toasts'
import { format } from 'date-fns'

// IMPORT FROM ATTENDANCE API (CORRECT WAY)
import { getAttendanceDropdowns, addAttendance } from '@/api/attendance'

export default function AddAttendancePage() {
  const router = useRouter()

  const [dropdowns, setDropdowns] = useState({
    customers: [],
    supervisors: [],
    technicians: [],
    slots: []
  })

  const [formData, setFormData] = useState({
    customer_id: '', // <-- ADD THIS LINE
    supervisor_id: '', // ADD
    technician_id: '',
    customer: '',
    coveredLocation: '',
    serviceAddress: '',
    postalCode: '',
    floorPlanFile: null,
    floorPlanFileName: '',
    siteContactPerson: '',
    serviceReportEmail: '',
    siteInchargePhone: '',
    mobile: '',
    supervisor: '',
    startDate: null,
    endDate: null,
    reminderDate: null,
    technicians: '',
    latitude: '',
    longitude: '',
    radius: '',
    remarksTechnician: '',
    remarksOffice: ''
  })

  const [slotForm, setSlotForm] = useState({
    slot: '',
    startTime: '',
    endTime: '',
    lunchMinutes: '',
    slotValue: ''
  })

  const [slots, setSlots] = useState([])
  const fileInputRef = useRef(null)

  // Refs for Enter key navigation
  const coveredLocationRef = useRef()
  const postalRef = useRef()
  const supervisorRef = useRef()
  const serviceAddressRef = useRef()
  const siteContactRef = useRef()
  const reportEmailRef = useRef()
  const inchargePhoneRef = useRef()
  const mobileRef = useRef()
  const latRef = useRef()
  const lonRef = useRef()
  const radiusRef = useRef()

  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const response = await getAttendanceDropdowns()

        // SUPER SAFE WAY — works for any nesting level
        let apiData = response

        // Try different possible paths
        if (apiData?.data?.data?.data) apiData = apiData.data.data.data
        else if (apiData?.data?.data) apiData = apiData.data.data
        else if (apiData?.data) apiData = apiData.data
        // if still no data → apiData remains response

        if (!apiData || typeof apiData !== 'object') {
          throw new Error('No valid data received')
        }

        console.log('Raw API Response:', response)
        console.log('Final parsed data:', apiData)

        // Extract everything safely
        const customers = (apiData.customer?.name || []).map(x => ({
          id: x.id,
          name: x.name
        }))

        const getObjects = obj =>
          (obj?.name || []).map(x => ({ id: x.id, name: x.name || 'Unnamed' })).filter(x => x.name && x.name !== 'null')

        const supervisors = getObjects(apiData.supervisor || {})
        const technicians = getObjects(apiData.technician || {})
        const slots = getObjects(apiData.slot || {})

        setDropdowns({
          customers,
          supervisors,
          technicians,
          slots
        })
      } catch (error) {
        console.error('Dropdown fetch failed:', error)
        showToast('error', 'Failed to load dropdowns')
      }
    }

    fetchDropdowns()
  }, [])

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSlotChange = (field, value) => {
    setSlotForm(prev => ({ ...prev, [field]: value }))
  }

  const handleEnter = (e, nextRef) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      nextRef?.current?.focus()
    }
  }

  const handleSelectFile = () => fileInputRef.current?.click()

  const handleFileChange = e => {
    const file = e.target.files?.[0]
    if (!file) return
    setFormData(prev => ({
      ...prev,
      floorPlanFile: file,
      floorPlanFileName: file.name
    }))
  }

  const handleAddSlot = () => {
    if (!slotForm.slot || !slotForm.startTime || !slotForm.endTime) {
      showToast('warning', 'Please fill Slot, Start Time and End Time')
      return
    }

    setSlots(prev => [...prev, { id: Date.now(), ...slotForm }])

    setSlotForm({
      slot: '',
      startTime: '',
      endTime: '',
      lunchMinutes: '',
      slotValue: ''
    })
  }

  const handleDeleteSlot = id => {
    setSlots(prev => prev.filter(s => s.id !== id))
  }

  const handleSave = async () => {
    try {
      if (!formData.customer_id) return showToast('warning', 'Customer is required')
      if (!formData.startDate) return showToast('warning', 'Start date is required')

      const payload = {
        customer_id: formData.customer_id,
        covered_location: formData.coveredLocation || '',
        service_address: formData.serviceAddress || '',
        postal_code: formData.postalCode || '',
        contact_person_name: formData.siteContactPerson || '',
        report_email: formData.serviceReportEmail || '',
        phone: formData.siteInchargePhone || '',
        mobile: formData.mobile || '',
        supervisor_id: formData.supervisor_id || '',
        start_date: format(formData.startDate, 'yyyy-MM-dd'),
        end_date: formData.endDate ? format(formData.endDate, 'yyyy-MM-dd') : '',
        reminder_date: formData.reminderDate ? format(formData.reminderDate, 'yyyy-MM-dd') : '',
        technician_id: formData.technician_id || '',
        latitude: formData.latitude || '',
        longitude: formData.longitude || '',
        radius: formData.radius || '',
        technician_remarks: formData.remarksTechnician || '',
        attendance_remarks: formData.remarksOffice || '',
        slot: slots.map(s => ({
          slot_id: dropdowns.slots.find(x => x.name === s.slot)?.id,
          frequency_id: 1,
          start_time: s.startTime + ':00',
          end_time: s.endTime + ':00',
          lunch: Number(s.lunchMinutes) || 0,
          work_time: String(s.slotValue || '1'),
          slot_value: Number(s.slotValue) || 0
        }))
      }

      console.log('FINAL JSON Payload:', payload)
      await addAttendance(payload)
      showToast('success', 'Attendance added successfully')
      router.push('/admin/attendance/attendance')

      if (slots.length > 0) {
        payload.append(
          'slot',
          JSON.stringify(
            slots.map(s => ({
              slot_id: dropdowns.slots.find(x => x.name === s.slot)?.id || null,
              frequency_id: 1, // 🔥 Ask backend if dynamic later
              start_time: s.startTime || '00:00:00',
              end_time: s.endTime || '00:00:00',
              lunch: Number(s.lunchMinutes) || 0,
              work_time: s.slotValue || '1',
              slot_value: Number(s.slotValue) || 0
            }))
          )
        )
      }

      console.log('Sending payload:', Object.fromEntries(payload))

      await addAttendance(payload)
      showToast('success', 'Attendance created successfully')
      router.push('/admin/attendance/attendance')
    } catch (error) {
      console.error('Save error:', error)
      showToast('error', error?.response?.data?.message || 'Failed to save attendance')
    }
  }

  const handleClose = () => router.push('/admin/attendance')

  return (
    <ContentLayout
      title={<Box sx={{ m: 2 }}>Add Attendance</Box>}
      breadcrumbs={[
        { label: 'Dashboard', href: '/admin/dashboards' },
        { label: 'Attendance', href: '/admin/attendance/attendance' },
        { label: 'Add Attendance' }
      ]}
    >
      <Card sx={{ p: 4, boxShadow: 'none' }} elevation={0}>
        <Grid container spacing={6}>
          {/* Customer */}
          <Grid item xs={12} md={3}>
            <Autocomplete
              options={dropdowns.customers}
              value={dropdowns.customers.find(c => c.id === formData.customer_id) || null}
              onChange={(_, v) => handleChange('customer_id', v?.id || '')}
              getOptionLabel={option => option?.name || ''}
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  {option.name}
                </li>
              )}
              renderInput={params => <CustomTextField {...params} label='Customer *' />}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <CustomTextField
              fullWidth
              label='Covered Location'
              inputRef={coveredLocationRef}
              value={formData.coveredLocation}
              onChange={e => handleChange('coveredLocation', e.target.value)}
              onKeyDown={e => handleEnter(e, postalRef)}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <CustomTextField
              fullWidth
              label='Postal Code'
              inputRef={postalRef}
              value={formData.postalCode}
              onChange={e => handleChange('postalCode', e.target.value)}
              onKeyDown={e => handleEnter(e, supervisorRef)}
            />
          </Grid>

          {/* Supervisor */}
          <Grid item xs={12} md={3}>
            <Autocomplete
              options={dropdowns.supervisors}
              value={dropdowns.supervisors.find(s => s.id === formData.supervisor_id) || null}
              onChange={(_, v) => {
                handleChange('supervisor', v?.name || '')
                setFormData(prev => ({ ...prev, supervisor_id: v?.id || '' }))
              }}
              getOptionLabel={option => option?.name || ''} // ADD THIS LINE
              renderInput={params => <CustomTextField {...params} label='Supervisor' />}
            />
          </Grid>

          {/* Service Address + Floor Plan */}
          <Grid item xs={12} md={6}>
            <CustomTextField
              fullWidth
              inputRef={serviceAddressRef}
              label='Service Address'
              value={formData.serviceAddress}
              onChange={e => handleChange('serviceAddress', e.target.value)}
              onKeyDown={e => handleEnter(e, siteContactRef)}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Box>
              <Typography variant='body2' sx={{ mb: 1, fontWeight: 500 }}>
                Upload Floor Plan
              </Typography>
              <input ref={fileInputRef} hidden type='file' onChange={handleFileChange} />
              <GlobalButton variant='outlined' onClick={handleSelectFile} fullWidth>
                {formData.floorPlanFileName || 'Choose File'}
              </GlobalButton>
            </Box>
          </Grid>

          {/* Contact Info */}

          <Grid item xs={12} md={3}>
            <CustomTextField
              fullWidth
              inputRef={siteContactRef}
              label='Site Contact Person'
              value={formData.siteContactPerson}
              onChange={e => handleChange('siteContactPerson', e.target.value)}
              onKeyDown={e => handleEnter(e, reportEmailRef)}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <CustomTextField
              fullWidth
              inputRef={reportEmailRef}
              label='Service Report Email'
              value={formData.serviceReportEmail}
              onChange={e => handleChange('serviceReportEmail', e.target.value)}
              onKeyDown={e => handleEnter(e, inchargePhoneRef)}
            />
          </Grid>

          {/* Incharge Phone + Mobile - Side by Side */}
          <Grid item xs={12} md={3}>
            <CustomTextField
              fullWidth
              inputRef={inchargePhoneRef}
              label='Incharge Phone'
              value={formData.siteInchargePhone}
              onChange={e => handleChange('siteInchargePhone', e.target.value)}
              onKeyDown={e => handleEnter(e, mobileRef)}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <CustomTextField
              fullWidth
              inputRef={mobileRef}
              label='Mobile'
              value={formData.mobile}
              onChange={e => handleChange('mobile', e.target.value)}
              // Enter key → next field (Latitude) or just stay
            />
          </Grid>
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
          </Grid>

          {/* Dates */}
          <Grid item xs={12} md={4}>
            <AppReactDatepicker
              selected={formData.startDate}
              onChange={d => handleChange('startDate', d)}
              customInput={<CustomTextField label='Start Date *' fullWidth />}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <AppReactDatepicker
              selected={formData.endDate}
              onChange={d => handleChange('endDate', d)}
              customInput={<CustomTextField label='End Date' fullWidth />}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <AppReactDatepicker
              selected={formData.reminderDate}
              onChange={d => handleChange('reminderDate', d)}
              customInput={<CustomTextField label='Reminder Date' fullWidth />}
            />
          </Grid>

          {/* Technician + Geo */}
          <Grid item xs={12} md={3}>
            <Autocomplete
              options={dropdowns.technicians}
              value={dropdowns.technicians.find(t => t.id === formData.technician_id) || null}
              onChange={(_, v) => {
                handleChange('technicians', v?.name || '')
                setFormData(prev => ({ ...prev, technician_id: v?.id || '' }))
              }}
              getOptionLabel={option => option?.name || ''} // ADD THIS LINE
              renderInput={params => <CustomTextField {...params} label='Technician' />}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <CustomTextField
              fullWidth
              inputRef={latRef}
              label='Latitude'
              value={formData.latitude}
              onChange={e => handleChange('latitude', e.target.value)}
              onKeyDown={e => handleEnter(e, lonRef)}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <CustomTextField
              fullWidth
              inputRef={lonRef}
              label='Longitude'
              value={formData.longitude}
              onChange={e => handleChange('longitude', e.target.value)}
              onKeyDown={e => handleEnter(e, radiusRef)}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <CustomTextField
              fullWidth
              inputRef={radiusRef}
              label='Radius'
              value={formData.radius}
              onChange={e => handleChange('radius', e.target.value)}
            />
          </Grid>

          {/* Slots Section */}
          <Grid item xs={12}>
            <Typography variant='h6'>Slots</Typography>
            <Divider sx={{ my: 2 }} />
          </Grid>

          <Grid item xs={12} md={2}>
            <Autocomplete
              options={dropdowns.slots}
              value={dropdowns.slots.find(s => s.name === slotForm.slot) || null}
              onChange={(_, v) => handleSlotChange('slot', v?.name || '')}
              getOptionLabel={option => option?.name || ''}
              renderOption={(props, option, state) => (
                <li {...props} key={option.id || state.index}>
                  {option.name}
                </li>
              )}
              renderInput={params => <CustomTextField {...params} label='Slot' />}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <CustomTextField
              type='time'
              fullWidth
              label='Start Time'
              value={slotForm.startTime}
              onChange={e => handleSlotChange('startTime', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <CustomTextField
              type='time'
              fullWidth
              label='End Time'
              value={slotForm.endTime}
              onChange={e => handleSlotChange('endTime', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <CustomTextField
              fullWidth
              label='Lunch (Min)'
              value={slotForm.lunchMinutes}
              onChange={e => handleSlotChange('lunchMinutes', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <CustomTextField
              fullWidth
              label='Slot Value'
              value={slotForm.slotValue}
              onChange={e => handleSlotChange('slotValue', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={2} sx={{ display: 'flex', alignItems: 'flex-end' }}>
            <GlobalButton variant='contained' fullWidth startIcon={<AddIcon />} onClick={handleAddSlot}>
              Add Slot
            </GlobalButton>
          </Grid>

          {/* Slots Table */}
          <Grid item xs={12}>
            <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, overflowX: 'auto' }}>
              <Table sx={{ minWidth: 800 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell>Slot</TableCell>
                    <TableCell>Slot Value</TableCell>
                    <TableCell>Start</TableCell>
                    <TableCell>End</TableCell>
                    <TableCell>Lunch</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {slots.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align='center'>
                        No slot added
                      </TableCell>
                    </TableRow>
                  ) : (
                    slots.map((s, i) => (
                      <TableRow key={s.id}>
                        <TableCell>{i + 1}</TableCell>
                        <TableCell>
                          <IconButton color='error' size='small' onClick={() => handleDeleteSlot(s.id)}>
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                        <TableCell>{s.slot}</TableCell>
                        <TableCell>{s.slotValue}</TableCell>
                        <TableCell>{s.startTime}</TableCell>
                        <TableCell>{s.endTime}</TableCell>
                        <TableCell>{s.lunchMinutes}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Box>
          </Grid>

          {/* Remarks */}
          <Grid item xs={12} md={6}>
            <CustomTextField
              multiline
              rows={3}
              fullWidth
              label='Remarks for Technician'
              value={formData.remarksTechnician}
              onChange={e => handleChange('remarksTechnician', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <CustomTextField
              multiline
              rows={3}
              fullWidth
              label='Remarks for Office'
              value={formData.remarksOffice}
              onChange={e => handleChange('remarksOffice', e.target.value)}
            />
          </Grid>

          {/* Buttons */}
          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <GlobalButton color='secondary' onClick={handleClose}>
              Close
            </GlobalButton>
            <GlobalButton variant='contained' onClick={handleSave}>
              Save
            </GlobalButton>
          </Grid>
        </Grid>
      </Card>
    </ContentLayout>
  )
}
