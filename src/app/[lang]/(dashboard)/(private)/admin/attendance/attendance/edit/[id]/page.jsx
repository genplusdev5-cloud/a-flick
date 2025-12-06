// src/app/admin/attendance/attendance/edit/[id]/page.jsx

'use client'

import { useRef, useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { format } from 'date-fns'

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

import { getAttendanceDropdowns, getAttendanceDetails, updateAttendance } from '@/api/attendance'

export default function EditAttendancePage() {
  const router = useRouter()
  const { id } = useParams()

  const [dropdowns, setDropdowns] = useState({
    customers: [],
    supervisors: [],
    technicians: [],
    slots: []
  })

  const [formData, setFormData] = useState({
    customer_id: '',
    supervisor_id: '',
    technician_id: '',
    coveredLocation: '',
    serviceAddress: '',
    postalCode: '',
    floorPlanFile: null,
    floorPlanFileName: '',
    existingFloorPlan: '',
    siteContactPerson: '',
    serviceReportEmail: '',
    siteInchargePhone: '',
    mobile: '',
    startDate: null,
    endDate: null,
    reminderDate: null,
    latitude: '',
    longitude: '',
    radius: '',
    remarksTechnician: '',
    remarksOffice: ''
  })

  const [slots, setSlots] = useState([])
  const [slotForm, setSlotForm] = useState({
    slot: '',
    startTime: '',
    endTime: '',
    lunchMinutes: '',
    slotValue: ''
  })

  const fileInputRef = useRef(null)

  // Exact same refs as Add page
  const coveredLocationRef = useRef()
  const postalRef = useRef()
  const serviceAddressRef = useRef()
  const siteContactRef = useRef()
  const reportEmailRef = useRef()
  const inchargePhoneRef = useRef()
  const mobileRef = useRef()
  const latRef = useRef()
  const lonRef = useRef()
  const radiusRef = useRef()

  const handleEnter = (e, nextRef) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      nextRef?.current?.focus()
    }
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        const [dropdownRes, detailRes] = await Promise.all([getAttendanceDropdowns(), getAttendanceDetails(id)])

        // Parse dropdowns (same as Add page)
        let apiData = dropdownRes?.data?.data?.data || dropdownRes?.data?.data || dropdownRes?.data || dropdownRes
        const getObjects = obj =>
          (obj?.name || []).map(x => ({ id: x.id, name: x.name || 'Unnamed' })).filter(x => x.name && x.name !== 'null')

        const customers = (apiData.customer?.name || []).map(x => ({ id: x.id, name: x.name }))
        const supervisors = getObjects(apiData.supervisor || {})
        const technicians = getObjects(apiData.technician || {})
        const slotsList = getObjects(apiData.slot || {})

        setDropdowns({ customers, supervisors, technicians, slots: slotsList })

        // Parse attendance details
        const att = detailRes?.data || detailRes

        setFormData({
          customer_id: att.customer_id || '',
          supervisor_id: att.supervisor_id || '',
          technician_id: att.technician_id || '',
          coveredLocation: att.covered_location || '',
          serviceAddress: att.service_address || '',
          postalCode: att.postal_code || '',
          floorPlanFile: null,
          floorPlanFileName: '',
          existingFloorPlan: att.floor_plan || '',
          siteContactPerson: att.contact_person_name || '',
          serviceReportEmail: att.report_email || '',
          siteInchargePhone: att.phone || '',
          mobile: att.mobile || '',
          startDate: att.start_date ? new Date(att.start_date) : null,
          endDate: att.end_date ? new Date(att.end_date) : null,
          reminderDate: att.reminder_date ? new Date(att.reminder_date) : null,
          latitude: att.latitude || '',
          longitude: att.longitude || '',
          radius: att.radius || '',
          remarksTechnician: att.technician_remarks || '',
          remarksOffice: att.attendance_remarks || ''
        })

        // Parse slots
        try {
          const parsed = att.slots ? JSON.parse(att.slots) : []
          setSlots(parsed.map((s, i) => ({ ...s, id: s.id || Date.now() + i })))
        } catch {
          setSlots([])
        }
      } catch (err) {
        showToast('error', 'Failed to load attendance data')
      }
    }

    if (id) loadData()
  }, [id])

  const handleChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }))
  const handleSlotChange = (field, value) => setSlotForm(prev => ({ ...prev, [field]: value }))

  const handleFileChange = e => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData(prev => ({ ...prev, floorPlanFile: file, floorPlanFileName: file.name }))
    }
  }

  const handleAddSlot = () => {
    if (!slotForm.slot || !slotForm.startTime || !slotForm.endTime) {
      showToast('warning', 'Please fill Slot, Start Time and End Time')
      return
    }
    setSlots(prev => [...prev, { id: Date.now(), ...slotForm }])
    setSlotForm({ slot: '', startTime: '', endTime: '', lunchMinutes: '', slotValue: '' })
  }

  const handleDeleteSlot = id => setSlots(prev => prev.filter(s => s.id !== id))

  const handleSave = async () => {
    try {
      const payload = new FormData()

      payload.append('customer_id', formData.customer_id)
      payload.append('covered_location', formData.coveredLocation || '')
      payload.append('service_address', formData.serviceAddress || '')
      payload.append('postal_code', formData.postalCode || '')
      payload.append('contact_person_name', formData.siteContactPerson || '')
      payload.append('report_email', formData.serviceReportEmail || '')
      payload.append('phone', formData.siteInchargePhone || '')
      payload.append('mobile', formData.mobile || '')
      payload.append('supervisor_id', formData.supervisor_id || '')
      payload.append('technician_id', formData.technician_id || '')
      payload.append('latitude', formData.latitude || '')
      payload.append('longitude', formData.longitude || '')
      payload.append('radius', formData.radius || '')
      payload.append('technician_remarks', formData.remarksTechnician || '')
      payload.append('attendance_remarks', formData.remarksOffice || '')

      if (formData.startDate) payload.append('start_date', format(formData.startDate, 'yyyy-MM-dd'))
      if (formData.endDate) payload.append('end_date', format(formData.endDate, 'yyyy-MM-dd'))
      if (formData.reminderDate) payload.append('reminder_date', format(formData.reminderDate, 'yyyy-MM-dd'))

      if (formData.floorPlanFile) payload.append('floor_plan', formData.floorPlanFile)

      if (slots.length > 0) {
        payload.append(
          'slots',
          JSON.stringify(
            slots.map(s => ({
              slot: s.slot,
              slot_value: s.slotValue,
              start_time: s.startTime,
              end_time: s.endTime,
              lunch_minutes: s.lunchMinutes || 0
            }))
          )
        )
      }

      await updateAttendance(id, payload)
      showToast('success', 'Attendance updated successfully!')
      router.push('/admin/attendance/attendance')
    } catch (error) {
      showToast('error', error?.response?.data?.message || 'Update failed')
    }
  }

  return (
    <ContentLayout
      title={<Box sx={{ m: 2 }}>Edit Attendance</Box>}
      breadcrumbs={[
        { label: 'Dashboard', href: '/admin/dashboards' },
        { label: 'Attendance', href: '/admin/attendance/attendance' },
        { label: 'Edit Attendance' }
      ]}
    >
      <Card sx={{ p: 4, boxShadow: 'none' }} elevation={0}>
        <Grid container spacing={6}>
          {/* EXACT SAME AS ADD PAGE — 100% COPY */}

          {/* Customer */}
          <Grid item xs={12} md={3}>
            <Autocomplete
              options={dropdowns.customers}
              value={dropdowns.customers.find(c => c.id === formData.customer_id) || null}
              onChange={(_, v) => handleChange('customer_id', v?.id || '')}
              getOptionLabel={option => option?.name || ''}
              isOptionEqualToValue={(option, value) => option.id === value.id} // இது முக்கியம்!
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  {' '}
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
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Autocomplete
              options={dropdowns.supervisors}
              value={dropdowns.supervisors.find(s => s.id === formData.supervisor_id) || null}
              onChange={(_, v) => handleChange('supervisor_id', v?.id || '')}
              getOptionLabel={o => o?.name || ''}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  {option.name}
                </li>
              )}
              renderInput={p => <CustomTextField {...p} label='Supervisor' />}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <CustomTextField
              fullWidth
              label='Service Address'
              inputRef={serviceAddressRef}
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
              {formData.existingFloorPlan && !formData.floorPlanFile && (
                <Typography variant='caption' color='primary' sx={{ mb: 1, display: 'block' }}>
                  Current: {formData.existingFloorPlan.split('/').pop()}
                </Typography>
              )}
              <input ref={fileInputRef} hidden type='file' onChange={handleFileChange} />
              <GlobalButton variant='outlined' onClick={() => fileInputRef.current?.click()} fullWidth>
                {formData.floorPlanFileName || 'Choose File'}
              </GlobalButton>
            </Box>
          </Grid>

          <Grid item xs={12} md={3}>
            <CustomTextField
              fullWidth
              label='Site Contact Person'
              inputRef={siteContactRef}
              value={formData.siteContactPerson}
              onChange={e => handleChange('siteContactPerson', e.target.value)}
              onKeyDown={e => handleEnter(e, reportEmailRef)}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <CustomTextField
              fullWidth
              label='Service Report Email'
              inputRef={reportEmailRef}
              value={formData.serviceReportEmail}
              onChange={e => handleChange('serviceReportEmail', e.target.value)}
              onKeyDown={e => handleEnter(e, inchargePhoneRef)}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <CustomTextField
              fullWidth
              label='Incharge Phone'
              inputRef={inchargePhoneRef}
              value={formData.siteInchargePhone}
              onChange={e => handleChange('siteInchargePhone', e.target.value)}
              onKeyDown={e => handleEnter(e, mobileRef)}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <CustomTextField
              fullWidth
              label='Mobile'
              inputRef={mobileRef}
              value={formData.mobile}
              onChange={e => handleChange('mobile', e.target.value)}
            />
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

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

          <Grid item xs={12} md={3}>
            <Autocomplete
              options={dropdowns.technicians}
              value={dropdowns.technicians.find(t => t.id === formData.technician_id) || null}
              onChange={(_, v) => handleChange('technician_id', v?.id || '')}
              getOptionLabel={o => o?.name || ''}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  {option.name}
                </li>
              )}
              renderInput={p => <CustomTextField {...p} label='Technician' />}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <CustomTextField
              fullWidth
              label='Latitude'
              inputRef={latRef}
              value={formData.latitude}
              onChange={e => handleChange('latitude', e.target.value)}
              onKeyDown={e => handleEnter(e, lonRef)}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <CustomTextField
              fullWidth
              label='Longitude'
              inputRef={lonRef}
              value={formData.longitude}
              onChange={e => handleChange('longitude', e.target.value)}
              onKeyDown={e => handleEnter(e, radiusRef)}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <CustomTextField
              fullWidth
              label='Radius'
              inputRef={radiusRef}
              value={formData.radius}
              onChange={e => handleChange('radius', e.target.value)}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant='h6'>Slots</Typography>
            <Divider sx={{ my: 2 }} />
          </Grid>

          <Grid item xs={12} md={2}>
            <Autocomplete
              options={dropdowns.slots}
              value={dropdowns.slots.find(s => s.name === slotForm.slot) || null}
              onChange={(_, v) => handleSlotChange('slot', v?.name || '')}
              getOptionLabel={o => o?.name || ''}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  {option.name}
                </li>
              )}
              renderInput={p => <CustomTextField {...p} label='Slot' />}
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

          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <GlobalButton
              color='secondary'
              onClick={() => router.push('/admin/attendance/attendance')}
            >
              Close
            </GlobalButton>
            <GlobalButton variant='contained' onClick={handleSave}>
              Update Attendance
            </GlobalButton>
          </Grid>
        </Grid>
      </Card>
    </ContentLayout>
  )
}
