'use client'

import { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Grid,
  Card,
  Checkbox,
  FormControlLabel,
  Autocomplete,
  Dialog,
  DialogContent,
  Typography
} from '@mui/material'

import { useRouter, useSearchParams } from 'next/navigation'
import { decryptId } from '@/utils/encryption'
import { toast } from 'react-toastify'

import { showToast } from '@/components/common/Toasts'

// 🔥 Global UI Components (use everywhere)
import GlobalButton from '@/components/common/GlobalButton'
import GlobalTextField from '@/components/common/GlobalTextField'
import GlobalTextarea from '@/components/common/GlobalTextarea'
import GlobalSelect from '@/components/common/GlobalSelect'
import GlobalAutocomplete from '@/components/common/GlobalAutocomplete'

// API
import { getEmployeeDetails, updateEmployee, getSchedulerList, getSupervisorList } from '@/api/employee'

import { getDepartmentList } from '@/api/departments/list'
import { getDesignationList } from '@/api/designations/list'
import { getUserRoleList } from '@/api/userRole/list'

// UI
import ContentLayout from '@/components/layout/ContentLayout'
import CustomTextField from '@core/components/mui/TextField'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'

export default function EditEmployeePage() {
  const router = useRouter()
  const params = useSearchParams()

  const encodedId = params.get('id')
  const id = decryptId(encodedId)

  console.log('Encoded ID =', encodedId)
  console.log('Decrypted ID =', id)

  // ⬇️ State
  const [loading, setLoading] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  const [uploadedFileURL, setUploadedFileURL] = useState('')
  const [emailError, setEmailError] = useState(false)

  // ⬇️ Dropdown lists
  const [departmentList, setDepartmentList] = useState([])
  const [designationList, setDesignationList] = useState([])
  const [userRoleList, setUserRoleList] = useState([])
  const [schedulerList, setSchedulerList] = useState([])
  const [supervisorList, setSupervisorList] = useState([])

  const findOption = (list, id) => list.find(item => item.id === id) || null

  // ⬇️ Employee data
  const [form, setForm] = useState({
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
    phone: '',
    targetDay: '',
    targetNight: '',
    targetSaturday: '',
    vehicleNumber: '',
    description: '',
    color: '#000000',
    dob: new Date(),

    // flags
    isScheduler: false,
    isSupervisorFlag: false,
    isSales: false,
    isTechnician: false,
    isForeigner: false,
    isGps: false,
    isPhoto: false,
    isQr: false,
    isSign: false
  })

  // -----------------------------------------------------
  // FETCH DROPDOWNS (Same as Add Page)
  // -----------------------------------------------------
  const extractResults = res => {
    if (res?.data?.data?.results) return res.data.data.results
    if (res?.data?.results) return res.data.results
    if (Array.isArray(res?.data)) return res.data
    return []
  }

  const sanitizeOptions = list =>
    list.map(item => ({
      id: item.id,
      label: item.name || '-'
    }))

  useEffect(() => {
    const loadDropdowns = async () => {
      try {
        const [deptRes, desigRes, roleRes, schedRes, superRes] = await Promise.all([
          getDepartmentList(),
          getDesignationList(),
          getUserRoleList(),
          getSchedulerList(),
          getSupervisorList()
        ])

        setDepartmentList(sanitizeOptions(extractResults(deptRes)))
        setDesignationList(sanitizeOptions(extractResults(desigRes)))
        setUserRoleList(sanitizeOptions(extractResults(roleRes)))

        // scheduler & supervisor special format
        setSchedulerList(schedRes?.data?.results?.map(x => ({ id: x.id, label: x.name })) || [])
        setSupervisorList(superRes?.data?.results?.map(x => ({ id: x.id, label: x.name })) || [])
      } catch (error) {
        console.error(error)
        toast.error('Dropdown loading failed')
      }
    }

    loadDropdowns()
  }, [])

  // -----------------------------------------------------
  // FETCH EMPLOYEE DETAILS (FINAL WORKING VERSION)
  // -----------------------------------------------------
  useEffect(() => {
    if (!id) return

    // Wait until REQUIRED lists are loaded
    if (departmentList.length === 0 || designationList.length === 0 || userRoleList.length === 0) {
      return
    }

    const loadDetails = async () => {
      setLoading(true)
      try {
        const res = await getEmployeeDetails(id)
        const d = res?.data || {}

        const match = (list, id) => list.find(x => Number(x.id) === Number(id)) || null

        setForm(prev => ({
          ...prev,

          employeeRole:
            [
              { id: 1, label: 'Confirmed Sales' },
              { id: 2, label: 'Quotation' }
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
          phone: d.phone || '',
          targetDay: d.target_day || '',
          targetNight: d.target_night || '',
          targetSaturday: d.target_saturday || '',
          vehicleNumber: d.vehicle_no || '',
          description: d.description || '',
          color: d.color_code || '#000000',
          dob: d.dob && d.dob !== '0000-00-00' ? new Date(d.dob) : null,

          isScheduler: d.is_scheduler == 1,
          isSupervisorFlag: d.is_supervisor == 1,
          isSales: d.is_sales == 1,
          isTechnician: d.is_technician == 1,
          isForeigner: d.is_foreigner == 1,
          isGps: d.is_gps == 1,
          isPhoto: d.is_photo == 1,
          isQr: d.is_qr == 1,
          isSign: d.is_sign == 1
        }))
      } catch (err) {
        console.error(err)
        toast.error('Failed to load employee details')
      } finally {
        setLoading(false)
      }
    }

    loadDetails()
  }, [id, departmentList, designationList, userRoleList, schedulerList, supervisorList])

  // -----------------------------------------------------
  // HANDLE INPUTS
  // -----------------------------------------------------
  const setField = (name, value) => setForm(prev => ({ ...prev, [name]: value }))

  // -----------------------------------------------------
  // SUBMIT UPDATE
  const handleSave = async () => {
    try {
      setLoading(true)

      const fd = new FormData()

      fd.append('id', id)
      fd.append('name', form.name || '')
      fd.append('nick_name', form.nickname || '')
      fd.append('email', form.email || '')
      fd.append('phone', form.phone || '')

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

      const res = await updateEmployee(fd)

      if (res?.status === 'success') {
        showToast('success', 'Employee updated successfully!')
        router.push('/admin/employee-list')
      } else {
        showToast('error', res?.message || 'Update failed')
      }
    } catch (error) {
      console.error(error)
      showToast('error', 'Update failed')
    } finally {
      setLoading(false)
    }
  }

  // -----------------------------------------------------
  // RENDER AUTOCOMPLETE
  // -----------------------------------------------------
  const renderAC = (name, label, list) => (
    <Grid item xs={12} md={4} key={name}>
      <GlobalAutocomplete
        options={list}
        getOptionLabel={o => o?.label || ''}
        isOptionEqualToValue={(a, b) => a?.id === b?.id}
        value={form[name] || null}
        onChange={v => setField(name, v)} // ✅ FIXED
        renderInput={params => <GlobalTextField {...params} label={label} fullWidth />}
      />
    </Grid>
  )

  // -----------------------------------------------------
  // UI
  // -----------------------------------------------------
  return (
    <ContentLayout
      title={<Box sx={{ m: 2 }}>Edit Employee</Box>}
      breadcrumbs={[
        { label: 'Dashboard', href: '/admin/dashboards' },
        { label: 'Employee', href: '/admin/employee-list' },
        { label: 'Edit Employee' }
      ]}
    >
      <Card sx={{ p: 4 }}>
        <Grid container spacing={6}>
          {/* Employee Role */}
          {renderAC('employeeRole', 'Employee Role', [
            { id: 1, label: 'Confirmed Sales' },
            { id: 2, label: 'Quotation' }
          ])}

          {/* Basic Fields */}
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

          {/* Dynamic Dropdowns */}
          {renderAC('department', 'Department', departmentList)}
          {renderAC('designation', 'Designation', designationList)}
          {renderAC('userRole', 'User Role', userRoleList)}
          {renderAC('scheduler', 'Scheduler', schedulerList)}
          {renderAC('supervisor', 'Supervisor', supervisorList)}

          {/* Lunch */}
          <Grid item xs={12} md={4}>
            <GlobalTextField
              type='time'
              label='Lunch Time'
              value={form.lunchTime}
              onChange={e => setField('lunchTime', e.target.value)}
              fullWidth
            />
          </Grid>

          {/* Flags */}
          {[
            ['isScheduler', 'Scheduler'],
            ['isSupervisorFlag', 'Is Supervisor'],
            ['isSales', 'Is Sales'],
            ['isTechnician', 'Is Technician'],
            ['isForeigner', 'Is Foreigner'],
            ['isGps', 'GPS'],
            ['isPhoto', 'Photo'],
            ['isQr', 'QR'],
            ['isSign', 'Signature']
          ].map(([key, label]) => (
            <Grid item xs={12} md={4} key={key}>
              <FormControlLabel
                control={<Checkbox checked={form[key]} onChange={e => setField(key, e.target.checked)} />}
                label={label}
              />
            </Grid>
          ))}

          {/* Email */}
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
            />
          </Grid>

          {/* Phone */}
          <Grid item xs={12} md={4}>
            <GlobalTextField
              label='Phone'
              value={form.phone}
              onChange={e => setField('phone', e.target.value)}
              fullWidth
            />
          </Grid>

          {/* DOB */}
          <Grid item xs={12} md={4}>
            <AppReactDatepicker
              selected={form.dob}
              onChange={date => setField('dob', date)}
              customInput={<GlobalTextField label='DOB' fullWidth />}
            />
          </Grid>

          {/* Target fields */}
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

          {/* Vehicle Number */}
          <Grid item xs={12} md={4}>
            <GlobalTextField
              label='Vehicle Number'
              value={form.vehicleNumber}
              onChange={e => setField('vehicleNumber', e.target.value)}
              fullWidth
            />
          </Grid>

          {/* Color */}
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

          {/* Description */}
          <Grid item xs={12} md={4}>
            <GlobalTextarea
              label='Description'
              value={form.description}
              onChange={e => setField('description', e.target.value)}
              multiline
              rows={3}
              fullWidth
            />
          </Grid>

          {/* Buttons */}
          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
            <GlobalButton color='secondary' onClick={() => router.back()}>
              Cancel
            </GlobalButton>

            <GlobalButton variant='contained' onClick={handleSave} disabled={loading}>
              {loading ? 'Saving...' : 'Update'}
            </GlobalButton>
          </Grid>
        </Grid>
      </Card>

      {/* Image Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth='md' fullWidth>
        <DialogContent>
          {uploadedFileURL && (
            <img src={uploadedFileURL} alt='File Preview' style={{ width: '100%', height: 'auto' }} />
          )}
        </DialogContent>
      </Dialog>
    </ContentLayout>
  )
}
