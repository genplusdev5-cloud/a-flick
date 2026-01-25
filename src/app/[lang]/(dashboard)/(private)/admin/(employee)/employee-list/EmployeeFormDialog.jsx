'use client'

import { useEffect, useState, useCallback } from 'react'

// MUI Imports
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Grid,
  Button,
  Checkbox,
  FormControlLabel,
  Box,
  IconButton
} from '@mui/material'

// Components
import DialogCloseButton from '@components/dialogs/DialogCloseButton'
import GlobalButton from '@/components/common/GlobalButton'
import GlobalTextField from '@/components/common/GlobalTextField'
import GlobalTextarea from '@/components/common/GlobalTextarea'
import GlobalAutocomplete from '@/components/common/GlobalAutocomplete'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'
import { showToast } from '@/components/common/Toasts'

// API
import { getEmployeeDetails, addEmployee, updateEmployee, getSchedulerList, getSupervisorList } from '@/api/employee'
import { getDepartmentList } from '@/api/employee/departments/list'
import { getDesignationList } from '@/api/employee/designations/list'
import { getUserRoleList } from '@/api/userRole/list'
import { getVehicleList } from '@/api/purchase/vehicle'
import { format } from 'date-fns'

const requiredStyle = {
  '& .MuiFormLabel-asterisk': {
    color: '#e91e63 !important',
    fontWeight: 700
  },
  '& .MuiInputLabel-root.Mui-required': {
    color: 'inherit'
  }
}

const EmployeeFormDialog = ({ open, mode, employeeId, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [signaturePreview, setSignaturePreview] = useState(null)

  // Dropdown lists
  const [departmentList, setDepartmentList] = useState([])
  const [designationList, setDesignationList] = useState([])
  const [userRoleList, setUserRoleList] = useState([])
  const [schedulerList, setSchedulerList] = useState([])
  const [supervisorList, setSupervisorList] = useState([])
  const [vehicleList, setVehicleList] = useState([])

  const initialForm = {
    employeeRole: null,
    nickname: '',
    name: '',
    department: null,
    designation: null,
    userRole: null,
    supervisor: null,
    lunchTime: new Date(new Date().setHours(12, 0, 0, 0)),
    email: '',
    password: '', // only for Add
    phone: '',
    targetDay: '',
    targetNight: '',
    targetSaturday: '',
    vehicleNumber: null,
    description: '',
    color: '#000000',
    dob: new Date(),
    joinDate: new Date(),
    resignDate: null,
    fingerPrintId: '',
    employeeCode: '',
    nationality: '',

    // flags
    isScheduler: false,
    isSupervisorFlag: false,
    isSales: false,
    isTechnician: false,
    isForeigner: false,
    isGps: false,
    isPhoto: false,
    isQr: false,
    isSign: false,
    signature: null,
    existingSignature: null
  }

  const [form, setForm] = useState(initialForm)
  const [emailError, setEmailError] = useState(false)

  const setField = (name, value) => setForm(prev => ({ ...prev, [name]: value }))

  const handlePhoneChange = e => {
    let value = e.target.value.replace(/\D/g, '')
    if (value.length > 10) value = value.slice(0, 10)
    if (value.length > 5) {
      value = value.slice(0, 5) + ' ' + value.slice(5)
    }
    setField('phone', value)
  }

  // Load Dropdowns
  useEffect(() => {
    if (!open) return

    const loadDropdowns = async () => {
      try {
        const [deptRes, desigRes, roleRes, schedRes, superRes, vehicleRes] = await Promise.all([
          getDepartmentList(),
          getDesignationList(),
          getUserRoleList(),
          getSchedulerList(),
          getSupervisorList(),
          getVehicleList({ page_size: 1000 })
        ])

        const extract = res => {
          if (res?.data?.data?.results) return res.data.data.results
          if (res?.data?.results) return res.data.results
          if (Array.isArray(res?.data)) return res.data
          return []
        }

        const sanitize = list => list.map(item => ({ id: item.id, label: item.name || '-' }))

        const departments = sanitize(extract(deptRes))
        const designations = sanitize(extract(desigRes))
        const roles = sanitize(extract(roleRes))
        const schedulers = extract(schedRes).map(x => ({ id: x.id, label: x.name }))
        const supervisors = extract(superRes).map(x => ({ id: x.id, label: x.name }))
        const vehicles = (vehicleRes?.data?.results || vehicleRes?.results || []).map(x => ({ id: x.id, label: x.vehicle_name || x.vehicle_number || x.name }))

        setDepartmentList(departments)
        setDesignationList(designations)
        setUserRoleList(roles)
        setSchedulerList(schedulers)
        setSupervisorList(supervisors)
        setVehicleList(vehicles)

        // If edit mode, trigger details fetch AFTER lists are ready
        if (mode === 'edit' && employeeId) {
          fetchDetails(employeeId, { departments, designations, roles, schedulers, supervisors, vehicles })
        }
      } catch (error) {
        console.error('❌ Dropdown fetch failed:', error)
      }
    }

    loadDropdowns()
  }, [open, mode, employeeId])

  const fetchDetails = async (id, lists) => {
    setFetching(true)
    try {
      const res = await getEmployeeDetails(id)
      const d = res?.data || {}

      const match = (list, val) => list.find(x => Number(x.id) === Number(val)) || null

      setForm({
        employeeRole:
          [
            { id: 1, label: 'Admin' },
            { id: 2, label: 'Sales' },
            { id: 3, label: 'Technician' },
            { id: 4, label: 'Confirmed Sales' },
            { id: 5, label: 'Quotation' }
          ].find(x => x.label === d.employee_role) || null,
        nickname: d.nick_name || '',
        name: d.name || '',
        department: match(lists.departments, d.department_id),
        designation: match(lists.designations, d.designation_id),
        userRole: match(lists.roles, d.user_role_id),
        scheduler: match(lists.schedulers, d.scheduler_id),
        supervisor: match(lists.supervisors, d.supervisor_id),
        lunchTime: d.lunch_time
          ? (() => {
              const [h, m, s] = d.lunch_time.split(':')
              const dt = new Date()
              dt.setHours(h, m, s || 0)
              return dt
            })()
          : new Date(new Date().setHours(12, 0, 0, 0)),
        email: d.email || '',
        password: '',
        phone: d.phone || '',
        targetDay: d.target_day || '',
        targetNight: d.target_night || '',
        targetSaturday: d.target_saturday || '',
        vehicleNumber: lists.vehicles.find(v => v.label === d.vehicle_no) || (d.vehicle_no ? { label: d.vehicle_no, id: null } : null),
        description: d.description || '',
        color: d.color_code || '#000000',
        dob: d.dob && d.dob !== '0000-00-00' ? new Date(d.dob) : null,
        joinDate: d.join_date && d.join_date !== '0000-00-00' ? new Date(d.join_date) : null,
        resignDate: d.resign_date && d.resign_date !== '0000-00-00' ? new Date(d.resign_date) : null,
        fingerPrintId: d.finger_print_id || '',
        employeeCode: d.employee_code || '',
        nationality: d.nationality || '',

        isScheduler: d.is_scheduler == 1,
        isSupervisorFlag: d.is_supervisor == 1,
        isSales: d.is_sales == 1,
        isTechnician: d.is_technician == 1,
        isForeigner: d.is_foreigner == 1,
        isGps: d.is_gps == 1,
        isPhoto: d.is_photo == 1,
        isQr: d.is_qr == 1,
        isSign: d.is_sign == 1,
        signature: null,
        existingSignature: d.signature || null
      })
    } catch (error) {
      console.error('❌ Fetch Employee Error:', error)
      showToast('error', 'Failed to load employee details')
    } finally {
      setFetching(false)
    }
  }

  // Reset form when opening/closing
  useEffect(() => {
    if (!open) {
      setForm(initialForm)
      setSignaturePreview(null)
      setEmailError(false)
    }
  }, [open])

  const handleSave = async () => {
    if (!form.name || !form.email || (mode === 'add' && !form.password)) {
      showToast('warning', 'Please fill Name, Email, and Password')
      return
    }

    setLoading(true)
    try {
      const fd = new FormData()
      if (mode === 'edit') fd.append('id', employeeId)

      fd.append('name', form.name)
      fd.append('nick_name', form.nickname)
      fd.append('email', form.email)
      fd.append('phone', form.phone.replace(/\s/g, ''))
      if (mode === 'add') fd.append('password', form.password)

      if (form.department?.id) fd.append('department_id', form.department.id)
      if (form.designation?.id) fd.append('designation_id', form.designation.id)
      if (form.userRole?.id) fd.append('user_role_id', form.userRole.id)
      if (form.scheduler?.id) fd.append('scheduler_id', form.scheduler.id)
      if (form.supervisor?.id) fd.append('supervisor_id', form.supervisor.id)
      if (form.employeeRole?.label) fd.append('employee_role', form.employeeRole.label)

      if (form.lunchTime) {
        fd.append('lunch_time', format(form.lunchTime, 'HH:mm:ss'))
      }
      fd.append('target_day', form.targetDay || '')
      fd.append('target_night', form.targetNight || '')
      fd.append('target_saturday', form.targetSaturday || '')
      fd.append('vehicle_no', form.vehicleNumber?.label || '')
      fd.append('description', form.description || '')
      fd.append('color_code', form.color || '')
      fd.append('finger_print_id', form.fingerPrintId || '')
      fd.append('employee_code', form.employeeCode || '')
      fd.append('nationality', form.nationality || '')

      fd.append('is_scheduler', form.isScheduler ? 1 : 0)
      fd.append('is_supervisor', form.isSupervisorFlag ? 1 : 0)
      fd.append('is_sales', form.isSales ? 1 : 0)
      fd.append('is_technician', form.isTechnician ? 1 : 0)
      fd.append('is_foreigner', form.isForeigner ? 1 : 0)
      fd.append('is_gps', form.isGps ? 1 : 0)
      fd.append('is_photo', form.isPhoto ? 1 : 0)
      fd.append('is_qr', form.isQr ? 1 : 0)

      const fmtDate = d => (d ? format(d, 'yyyy-MM-dd') : '')

      if (form.dob) fd.append('dob', fmtDate(form.dob))
      if (form.joinDate) fd.append('join_date', fmtDate(form.joinDate))
      if (form.resignDate) fd.append('resign_date', fmtDate(form.resignDate))

      // ✅ FIX: Send raw file object
      if (form.signature) {
        fd.append('signature', form.signature)
        fd.append('is_sign', 1)
      } else {
        fd.append('is_sign', form.isSign ? 1 : 0)
      }

      fd.append('is_active', 1)
      fd.append('status', 1)
      fd.append('created_by', 23) // Standardized to 23 as seen in logs
      fd.append('updated_by', 23)

      const res = mode === 'add' ? await addEmployee(fd) : await updateEmployee(fd)

      if (res?.status === 'success') {
        showToast('success', `Employee ${mode === 'add' ? 'added' : 'updated'} successfully!`)
        onSuccess()
        onClose()
      } else {
        showToast('error', res?.message || 'Operation failed')
      }
    } catch (error) {
      console.error('❌ Save Error:', error)
      showToast('error', error.response?.data?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = e => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png']
    if (!validTypes.includes(file.type)) {
      showToast('error', 'Only JPG and PNG files are allowed')
      e.target.value = '' // reset input
      return
    }

    // Validate file size (500KB = 512,000 bytes)
    if (file.size > 500 * 1024) {
      showToast('error', 'File size must be less than 500KB')
      e.target.value = '' // reset input
      return
    }

    setField('signature', file)
    const url = URL.createObjectURL(file)
    setSignaturePreview(url)
  }

  const renderAC = (name, label, list, required = false) => (
    <Grid item xs={12} md={4}>
      <GlobalAutocomplete
        options={list}
        getOptionLabel={o => o?.label || ''}
        isOptionEqualToValue={(a, b) => a?.id === b?.id}
        value={form[name] || null}
        onChange={v => setField(name, v)}
        renderInput={params => (
          <GlobalTextField {...params} label={label} fullWidth required={required} sx={required ? requiredStyle : {}} />
        )}
      />
    </Grid>
  )

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth='xl'
      scroll='paper'
      closeAfterTransition={false}
      PaperProps={{ sx: { overflow: 'visible' } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant='h5' component='span' fontWeight={600}>
          {mode === 'add' ? 'Add Employee' : 'Update Employee'}
        </Typography>
        <DialogCloseButton onClick={onClose} disableRipple>
          <i className='tabler-x' />
        </DialogCloseButton>
      </DialogTitle>

      <DialogContent sx={{ p: 6, pb: 4 }}>
        {fetching ? null : (
          <Grid container spacing={6}>
            {/* Row 1 */}
            {renderAC(
              'employeeRole',
              'Employee Role',
              [
                { id: 1, label: 'Admin' },
                { id: 2, label: 'Sales' },
                { id: 3, label: 'Technician' },
                { id: 4, label: 'Confirmed Sales' },
                { id: 5, label: 'Quotation' }
              ],
              true
            )}
            <Grid item xs={12} md={4}>
              <GlobalTextField
                label='Nick Name'
                value={form.nickname}
                onChange={e => setField('nickname', e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <GlobalTextField
                label='Name'
                value={form.name}
                onChange={e => setField('name', e.target.value)}
                fullWidth
                required
                sx={requiredStyle}
              />
            </Grid>

            {/* Row 2 */}
            {renderAC('department', 'Department', departmentList)}
            {renderAC('designation', 'Designation', designationList)}
            {renderAC('userRole', 'User Role', userRoleList, true)}

            {/* Row 3 */}
            <Grid item xs={12} md={4}>
              <GlobalTextField
                label='Finger Print ID'
                value={form.fingerPrintId}
                onChange={e => setField('fingerPrintId', e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <GlobalTextField
                label='Employee Code'
                value={form.employeeCode}
                onChange={e => setField('employeeCode', e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <GlobalTextField
                label='Nationality'
                value={form.nationality}
                onChange={e => setField('nationality', e.target.value)}
                fullWidth
              />
            </Grid>

            {/* Row 4 */}
            {renderAC('scheduler', 'Scheduler', schedulerList)}
            {renderAC('supervisor', 'Supervisor', supervisorList)}
            <Grid item xs={12} md={4}>
              <AppReactDatepicker
                selected={form.lunchTime}
                onChange={date => setField('lunchTime', date)}
                showTimeSelect
                showTimeSelectOnly
                timeIntervals={15}
                timeCaption='Time'
                dateFormat='h:mm aa'
                placeholderText='Select Lunch Time'
                customInput={<GlobalTextField label='Lunch Time' fullWidth />}
              />
            </Grid>

            {/* Flags */}
            <Grid item xs={12}>
              <Grid container spacing={4}>
                {[
                  ['isScheduler', 'Scheduler'],
                  ['isSupervisorFlag', 'Is Supervisor'],
                  ['isForeigner', 'Is Foreigner'],
                  ['isGps', 'GPS'],
                  ['isPhoto', 'Photo'],
                  ['isQr', 'QR'],
                  ['isSign', 'Signature'],
                  ['isSales', 'Is Sales'],
                  ['isTechnician', 'Is Technician']
                ].map(([key, label]) => (
                  <Grid item key={key}>
                    <FormControlLabel
                      control={<Checkbox checked={form[key]} onChange={e => setField(key, e.target.checked)} />}
                      label={label}
                    />
                  </Grid>
                ))}
              </Grid>
            </Grid>

            {/* Row 5 */}
            <Grid item xs={12} md={4}>
              <GlobalTextField
                label='Email'
                value={form.email}
                onChange={e => {
                  const val = e.target.value
                  setField('email', val)
                  setEmailError(val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val))
                }}
                error={emailError}
                helperText={emailError ? 'Invalid Email!' : ''}
                fullWidth
                required
                sx={requiredStyle}
              />
            </Grid>
            {mode === 'add' && (
              <Grid item xs={12} md={4}>
                <GlobalTextField
                  label='Password'
                  type='password'
                  value={form.password}
                  onChange={e => setField('password', e.target.value)}
                  fullWidth
                  required
                />
              </Grid>
            )}
            <Grid item xs={12} md={4}>
              <GlobalTextField label='Phone' value={form.phone} onChange={handlePhoneChange} fullWidth />
            </Grid>

            {/* Row 6 */}
            <Grid item xs={12} md={4}>
              <AppReactDatepicker
                selected={form.dob}
                onChange={date => setField('dob', date)}
                dateFormat='dd/MM/yyyy'
                customInput={<GlobalTextField label='DOB' fullWidth />}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <AppReactDatepicker
                selected={form.joinDate}
                onChange={date => setField('joinDate', date)}
                dateFormat='dd/MM/yyyy'
                customInput={<GlobalTextField label='Join Date' fullWidth />}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <AppReactDatepicker
                selected={form.resignDate}
                onChange={date => setField('resignDate', date)}
                dateFormat='dd/MM/yyyy'
                placeholderText='Select Resign Date'
                customInput={<GlobalTextField label='Resign Date' fullWidth />}
              />
            </Grid>

            {/* Row 7 */}
            <Grid item xs={12} md={4}>
              <GlobalTextField
                label='Target Day'
                value={form.targetDay}
                onChange={e => setField('targetDay', e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <GlobalTextField
                label='Target Night'
                value={form.targetNight}
                onChange={e => setField('targetNight', e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <GlobalTextField
                label='Target Saturday'
                value={form.targetSaturday}
                onChange={e => setField('targetSaturday', e.target.value)}
                fullWidth
              />
            </Grid>

            {/* Row 8 */}
            {renderAC('vehicleNumber', 'Vehicle Number', vehicleList)}
            <Grid item xs={12} md={4}>
              <GlobalTextField
                type='color'
                label='Color'
                value={form.color}
                InputLabelProps={{ shrink: true }}
                onChange={e => setField('color', e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Button variant='outlined' component='label' fullWidth sx={{ height: 56 }}>
                  {form.signature ? form.signature.name : 'Upload Signature'}
                  <input type='file' hidden onChange={handleFileChange} accept='.jpg,.jpeg,.png' />
                </Button>
                {(form.signature || (form.existingSignature && form.existingSignature !== '')) && (
                  <IconButton
                    color='info'
                    onClick={() => setPreviewOpen(true)}
                    sx={{
                      bgcolor: 'info.lighter',
                      '&:hover': { bgcolor: 'info.light' }
                    }}
                  >
                    <i className='tabler-eye' />
                  </IconButton>
                )}
              </Box>
            </Grid>

            {/* Description */}
            <Grid item xs={12}>
              <GlobalTextarea
                label='Description'
                value={form.description}
                onChange={e => setField('description', e.target.value)}
                multiline
                rows={3}
                fullWidth
              />
            </Grid>
          </Grid>
        )}
      </DialogContent>

      <Box
        sx={{
          borderTop: '1px solid #e0e0e0',
          mx: 6,
          my: 3
        }}
      />

      <DialogActions sx={{ p: 6 }}>
        <GlobalButton onClick={onClose} color='secondary' disabled={loading}>
          Close
        </GlobalButton>
        <GlobalButton variant='contained' onClick={handleSave} disabled={loading || fetching}>
          {mode === 'add' ? 'Save Changes' : 'Update'}
        </GlobalButton>
      </DialogActions>

      {/* Signature Preview Dialog */}
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth='md'>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Signature Preview
          <IconButton onClick={() => setPreviewOpen(false)} size='small'>
            <i className='tabler-x' />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', p: 4 }}>
          <img
            src={
              signaturePreview ||
              (form.existingSignature?.startsWith('http')
                ? form.existingSignature
                : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/', '')}${form.existingSignature}`)
            }
            alt='Signature'
            style={{ maxWidth: '100%', maxHeight: '70vh', border: '1px solid #ddd', borderRadius: '4px' }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  )
}

export default EmployeeFormDialog
