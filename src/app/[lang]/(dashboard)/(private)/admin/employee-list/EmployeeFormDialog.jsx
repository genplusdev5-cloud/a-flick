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
  CircularProgress,
  Box
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
import { getDepartmentList } from '@/api/departments/list'
import { getDesignationList } from '@/api/designations/list'
import { getUserRoleList } from '@/api/userRole/list'

const EmployeeFormDialog = ({ open, mode, employeeId, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)

  // Dropdown lists
  const [departmentList, setDepartmentList] = useState([])
  const [designationList, setDesignationList] = useState([])
  const [userRoleList, setUserRoleList] = useState([])
  const [schedulerList, setSchedulerList] = useState([])
  const [supervisorList, setSupervisorList] = useState([])

  const initialForm = {
    employeeRole: null,
    nickname: '',
    name: '',
    department: null,
    designation: null,
    userRole: null,
    scheduler: null,
    supervisor: null,
    lunchTime: '',
    email: '',
    password: '', // only for Add
    phone: '',
    targetDay: '',
    targetNight: '',
    targetSaturday: '',
    vehicleNumber: '',
    description: '',
    color: '#000000',
    dob: new Date(),
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
    signature: null
  }

  const [form, setForm] = useState(initialForm)
  const [emailError, setEmailError] = useState(false)

  const setField = (name, value) => setForm(prev => ({ ...prev, [name]: value }))

  const handlePhoneChange = e => {
    let value = e.target.value.replace(/\D/g, '')
    if (value.length > 5) value = value.slice(0, 5) + ' ' + value.slice(5, 10)
    setField('phone', value)
  }

  // Load Dropdowns
  useEffect(() => {
    if (!open) return

    const loadDropdowns = async () => {
      try {
        const [deptRes, desigRes, roleRes, schedRes, superRes] = await Promise.all([
          getDepartmentList(),
          getDesignationList(),
          getUserRoleList(),
          getSchedulerList(),
          getSupervisorList()
        ])

        const extract = res => {
          if (res?.data?.data?.results) return res.data.data.results
          if (res?.data?.results) return res.data.results
          if (Array.isArray(res?.data)) return res.data
          return []
        }

        const sanitize = list => list.map(item => ({ id: item.id, label: item.name || '-' }))

        setDepartmentList(sanitize(extract(deptRes)))
        setDesignationList(sanitize(extract(desigRes)))
        setUserRoleList(sanitize(extract(roleRes)))

        const schedData = extract(schedRes)
        const superData = extract(superRes)

        setSchedulerList(schedData.map(x => ({ id: x.id, label: x.name })))
        setSupervisorList(superData.map(x => ({ id: x.id, label: x.name })))
      } catch (error) {
        console.error('❌ Dropdown fetch failed:', error)
      }
    }

    loadDropdowns()
  }, [open])

  // Reset or Fetch Data
  useEffect(() => {
    if (!open) {
      setForm(initialForm)
      return
    }

    if (mode === 'edit' && employeeId) {
      const fetchDetails = async () => {
        setFetching(true)
        try {
          // Wait for dropdowns to load before matching
          const res = await getEmployeeDetails(employeeId)
          const d = res?.data || {}

          const match = (list, id) => list.find(x => Number(x.id) === Number(id)) || null

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
            department: match(departmentList, d.department_id),
            designation: match(designationList, d.designation_id),
            userRole: match(userRoleList, d.user_role_id),
            scheduler: match(schedulerList, d.scheduler_id),
            supervisor: match(supervisorList, d.supervisor_id),
            lunchTime: d.lunch_time || '',
            email: d.email || '',
            password: '', // Usually not fetched for edit
            phone: d.phone || '',
            targetDay: d.target_day || '',
            targetNight: d.target_night || '',
            targetSaturday: d.target_saturday || '',
            vehicleNumber: d.vehicle_no || '',
            description: d.description || '',
            color: d.color_code || '#000000',
            dob: d.dob && d.dob !== '0000-00-00' ? new Date(d.dob) : null,
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
            signature: null
          })
        } catch (error) {
          console.error('❌ Fetch Employee Error:', error)
          showToast('error', 'Failed to load employee details')
        } finally {
          setFetching(false)
        }
      }

      // Small delay to ensure lists are populated
      if (departmentList.length > 0) {
        fetchDetails()
      }
    } else {
      setForm(initialForm)
    }
  }, [open, mode, employeeId, departmentList])

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
      fd.append('phone', form.phone)
      if (mode === 'add') fd.append('password', form.password)

      if (form.department?.id) fd.append('department_id', form.department.id)
      if (form.designation?.id) fd.append('designation_id', form.designation.id)
      if (form.userRole?.id) fd.append('user_role_id', form.userRole.id)
      if (form.scheduler?.id) fd.append('scheduler_id', form.scheduler.id)
      if (form.supervisor?.id) fd.append('supervisor_id', form.supervisor.id)

      fd.append('lunch_time', form.lunchTime || '')
      fd.append('target_day', form.targetDay || '')
      fd.append('target_night', form.targetNight || '')
      fd.append('target_saturday', form.targetSaturday || '')
      fd.append('vehicle_no', form.vehicleNumber || '')
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
      fd.append('is_sign', form.isSign ? 1 : 0)

      if (form.dob) {
        fd.append('dob', new Date(form.dob).toISOString().slice(0, 10))
      }

      if (form.signature) {
        fd.append('signature', form.signature)
      }

      fd.append('is_active', 1)
      fd.append('created_by', 1)
      fd.append('updated_by', 1)

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

  const renderAC = (name, label, list) => (
    <Grid item xs={12} md={4}>
      <GlobalAutocomplete
        options={list}
        getOptionLabel={o => o?.label || ''}
        isOptionEqualToValue={(a, b) => a?.id === b?.id}
        value={form[name] || null}
        onChange={v => setField(name, v)}
        renderInput={params => <GlobalTextField {...params} label={label} fullWidth />}
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
          {mode === 'add' ? 'Add Employee' : 'Edit Employee'}
        </Typography>
        <DialogCloseButton onClick={onClose} disableRipple>
          <i className='tabler-x' />
        </DialogCloseButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 6 }}>
        {fetching ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={6}>
            {/* Row 1 */}
            {renderAC('employeeRole', 'Employee Role', [
              { id: 1, label: 'Admin' },
              { id: 2, label: 'Sales' },
              { id: 3, label: 'Technician' },
              { id: 4, label: 'Confirmed Sales' },
              { id: 5, label: 'Quotation' }
            ])}
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
              />
            </Grid>

            {/* Row 2 */}
            {renderAC('department', 'Department', departmentList)}
            {renderAC('designation', 'Designation', designationList)}
            {renderAC('userRole', 'User Role', userRoleList)}

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
              <GlobalTextField
                type='time'
                label='Lunch Time'
                value={form.lunchTime}
                onChange={e => setField('lunchTime', e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
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
                customInput={<GlobalTextField label='DOB' fullWidth />}
              />
            </Grid>
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

            {/* Row 7 */}
            <Grid item xs={12} md={4}>
              <GlobalTextField
                label='Target Saturday'
                value={form.targetSaturday}
                onChange={e => setField('targetSaturday', e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <GlobalTextField
                label='Vehicle Number'
                value={form.vehicleNumber}
                onChange={e => setField('vehicleNumber', e.target.value)}
                fullWidth
              />
            </Grid>
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

            {/* Row 8: Signature Upload */}
            <Grid item xs={12} md={4}>
              <Button variant='outlined' component='label' fullWidth sx={{ height: 56 }}>
                {form.signature ? form.signature.name : 'Upload Signature'}
                <input type='file' hidden onChange={e => setField('signature', e.target.files[0])} accept='image/*' />
              </Button>
            </Grid>

            {/* Description */}
            <Grid item xs={12} md={8}>
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

      <DialogActions sx={{ p: 6 }}>
        <Button onClick={onClose} variant='tonal' color='secondary' disabled={loading}>
          Close
        </Button>
        <GlobalButton variant='contained' onClick={handleSave} disabled={loading || fetching}>
          {loading ? 'Saving...' : mode === 'add' ? 'Save Changes' : 'Update'}
        </GlobalButton>
      </DialogActions>
    </Dialog>
  )
}

export default EmployeeFormDialog
