'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import {
  Box,
  Button,
  Grid,
  Card,
  Dialog,
  DialogContent,
  Checkbox,
  FormControlLabel,
  Autocomplete,
  Typography
} from '@mui/material'
import { useRouter, useSearchParams } from 'next/navigation'
import { decryptId } from '@/utils/encryption'

import { toast } from 'react-toastify'

import { getEmployeeDetails, updateEmployee } from '@/api/employee'
import ContentLayout from '@/components/layout/ContentLayout'
import CustomTextField from '@core/components/mui/TextField'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'

// ----------------------------------------------------------------------
// MAIN COMPONENT
// ----------------------------------------------------------------------

export default function EditEmployeePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const encodedId = searchParams.get('id')
  const id = decryptId(encodedId)

  // ✅ States
  const [loading, setLoading] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  const [uploadedFileURL, setUploadedFileURL] = useState('')
  const [emailError, setEmailError] = useState(false)

  // Core data states
  const [employeeData, setEmployeeData] = useState({
    employeeRole: '',
    nickname: '',
    name: '',
    department: '',
    designation: '',
    userRole: '',
    scheduler: '',
    supervisor: '',
    lunchTime: '',
    email: '',
    password: '',
    phone: '',
    targetDay: '',
    targetNight: '',
    targetSaturday: '',
    vehicleNumber: '',
    description: '',
    color: '#000000',
    dob: new Date(),
    isScheduler: false,
    isSales: false,
    isTechnician: false
  })

  // Autocomplete field options
  const autocompleteFields = [
    { name: 'employeeRole', options: ['Confirmed Sales', 'Quotation'] },
    { name: 'department', options: ['GP Industries Pvt Ltd', 'Marketing', 'IT'] },
    { name: 'designation', options: ['Manager', 'Senior Developer', 'Sales Executive'] },
    { name: 'userRole', options: ['Admin', 'Standard User', 'Technician'] },
    { name: 'scheduler', options: ['User A', 'User B'] },
    { name: 'supervisor', options: ['Supervisor 1', 'Supervisor 2'] }
  ]

  // Fetch employee details
  useEffect(() => {
    if (!id) return
    const fetchEmployee = async () => {
      setLoading(true)
      try {
        const res = await getEmployeeDetails(id)
        const data = res?.data || {}
        setEmployeeData({
          employeeRole: data.employee_role || '',
          nickname: data.nick_name || '',
          name: data.name || '',
          department: data.department || '',
          designation: data.designation || '',
          userRole: data.user_role || '',
          scheduler: data.scheduler || '',
          supervisor: data.supervisor || '',
          lunchTime: data.lunch_time || '',
          email: data.email || '',
          password: '',
          phone: data.phone || '',
          targetDay: data.target_day || '',
          targetNight: data.target_night || '',
          targetSaturday: data.target_saturday || '',
          vehicleNumber: data.vehicle_no || '',
          description: data.description || '',
          color: data.color_code || '#000000',
          dob: data.dob ? new Date(data.dob) : new Date(),
          isScheduler: data.is_scheduler === 1,
          isSales: data.is_sales === 1,
          isTechnician: data.is_technician === 1
        })
      } catch (error) {
        console.error('❌ Fetch Employee Error:', error)
        toast.error('Failed to load employee details')
      } finally {
        setLoading(false)
      }
    }
    fetchEmployee()
  }, [id])

  // Input change handler
  const handleChange = e => {
    const { name, value } = e.target
    setEmployeeData(prev => ({ ...prev, [name]: value }))
  }

  // Toast helper
  const showToast = (type, message = '') => {
    const icons = {
      success: 'tabler-circle-check',
      error: 'tabler-alert-triangle',
      warning: 'tabler-info-circle'
    }

    toast(
      <div className='flex items-center gap-2'>
        <i
          className={icons[type]}
          style={{
            color: type === 'success' ? '#16a34a' : type === 'error' ? '#dc2626' : '#f59e0b',
            fontSize: '22px'
          }}
        />
        <Typography variant='body2' sx={{ fontSize: '0.9rem', color: '#111' }}>
          {message}
        </Typography>
      </div>,
      {
        position: 'top-right',
        autoClose: 2000,
        hideProgressBar: true,
        theme: 'light',
        style: {
          borderRadius: '10px',
          padding: '8px 14px',
          boxShadow: '0 4px 10px rgba(0,0,0,0.06)'
        }
      }
    )
  }

  // Handle submit (update employee)
  const handleSubmit = async () => {
    try {
      setLoading(true)
      if (!employeeData.name || !employeeData.email) {
        showToast('warning', 'Please fill required fields')
        return
      }

      const payload = {
        id,
        name: employeeData.name,
        email: employeeData.email,
        phone: employeeData.phone,
        department: employeeData.department,
        designation: employeeData.designation,
        user_role: employeeData.userRole,
        scheduler: employeeData.scheduler,
        supervisor: employeeData.supervisor,
        lunch_time: employeeData.lunchTime,
        description: employeeData.description,
        target_day: employeeData.targetDay,
        target_night: employeeData.targetNight,
        target_saturday: employeeData.targetSaturday,
        vehicle_no: employeeData.vehicleNumber,
        color_code: employeeData.color,
        is_scheduler: employeeData.isScheduler ? 1 : 0,
        is_sales: employeeData.isSales ? 1 : 0,
        is_technician: employeeData.isTechnician ? 1 : 0,
        dob: employeeData.dob ? new Date(employeeData.dob).toISOString().split('T')[0] : null
      }

      const res = await updateEmployee(payload)
      if (res?.status === 'success') {
        showToast('success', 'Employee updated successfully!')
        router.push('/admin/employee-list')
      } else {
        showToast('error', res?.message || 'Failed to update employee')
      }
    } catch (error) {
      console.error('❌ Update Error:', error)
      showToast('error', 'Error updating employee')
    } finally {
      setLoading(false)
    }
  }

  // Autocomplete renderer
  const renderAutocomplete = ({ name, label, options }) => (
    <Grid item xs={12} md={4} key={name}>
      <Autocomplete
        options={options.map(o => ({ label: o }))}
        getOptionLabel={option => option.label || ''}
        value={options.includes(employeeData[name]) ? { label: employeeData[name] } : null}
        onChange={(e, newValue) => setEmployeeData(prev => ({ ...prev, [name]: newValue ? newValue.label : '' }))}
        renderInput={params => <CustomTextField {...params} label={label} fullWidth />}
      />
    </Grid>
  )

  return (
    <ContentLayout
      title={<Box sx={{ m: 2 }}>{'Edit Employee'}</Box>}
      breadcrumbs={[
        { label: 'Dashboard', href: '/admin/dashboards' },
        { label: 'Employee', href: '/admin/employee-list' },
        { label: 'Edit Employee' }
      ]}
    >
      <Card sx={{ p: 4, boxShadow: 'none' }} elevation={0}>
        <Grid container spacing={6}>
          {/* Row 1 */}
          {renderAutocomplete({
            name: 'employeeRole',
            label: 'Employee Role',
            options: autocompleteFields.find(f => f.name === 'employeeRole').options
          })}
          <Grid item xs={12} md={4}>
            <CustomTextField
              label='Nick name'
              name='nickname'
              value={employeeData.nickname}
              onChange={handleChange}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <CustomTextField label='Name' name='name' value={employeeData.name} onChange={handleChange} fullWidth />
          </Grid>

          {/* Row 2 */}
          {renderAutocomplete({
            name: 'department',
            label: 'Department',
            options: autocompleteFields.find(f => f.name === 'department').options
          })}
          {renderAutocomplete({
            name: 'designation',
            label: 'Designation',
            options: autocompleteFields.find(f => f.name === 'designation').options
          })}
          {renderAutocomplete({
            name: 'userRole',
            label: 'User Role',
            options: autocompleteFields.find(f => f.name === 'userRole').options
          })}

          {/* Row 3 */}
          {renderAutocomplete({
            name: 'scheduler',
            label: 'Scheduler',
            options: autocompleteFields.find(f => f.name === 'scheduler').options
          })}
          {renderAutocomplete({
            name: 'supervisor',
            label: 'Supervisor',
            options: autocompleteFields.find(f => f.name === 'supervisor').options
          })}
          <Grid item xs={12} md={4}>
            <CustomTextField
              label='Lunch Time'
              name='lunchTime'
              type='time'
              value={employeeData.lunchTime}
              onChange={handleChange}
              fullWidth
            />
          </Grid>

          {/* Checkboxes */}
          <Grid item xs={12} md={4}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={employeeData.isScheduler}
                  onChange={e => setEmployeeData(prev => ({ ...prev, isScheduler: e.target.checked }))}
                />
              }
              label='Scheduler'
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={employeeData.isSales}
                  onChange={e => setEmployeeData(prev => ({ ...prev, isSales: e.target.checked }))}
                />
              }
              label='Is Sales'
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={employeeData.isTechnician}
                  onChange={e => setEmployeeData(prev => ({ ...prev, isTechnician: e.target.checked }))}
                />
              }
              label='Is Technician'
            />
          </Grid>

          {/* Row 4 */}
          <Grid item xs={12} md={4}>
            <CustomTextField
              label='Email'
              name='email'
              value={employeeData.email}
              onChange={e => {
                const val = e.target.value
                setEmployeeData(prev => ({ ...prev, email: val }))
                setEmailError(val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val))
              }}
              error={emailError}
              helperText={emailError ? 'Invalid email' : ''}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <CustomTextField label='Phone' name='phone' value={employeeData.phone} onChange={handleChange} fullWidth />
          </Grid>
          <Grid item xs={12} md={4}>
            <AppReactDatepicker
              selected={employeeData.dob}
              onChange={date => setEmployeeData(prev => ({ ...prev, dob: date }))}
              customInput={<CustomTextField label='DOB' fullWidth />}
            />
          </Grid>

          {/* Row 5 */}
          <Grid item xs={12} md={4}>
            <CustomTextField
              label='Target Day ($)'
              name='targetDay'
              value={employeeData.targetDay}
              onChange={handleChange}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <CustomTextField
              label='Target Night ($)'
              name='targetNight'
              value={employeeData.targetNight}
              onChange={handleChange}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <CustomTextField
              label='Target Saturday ($)'
              name='targetSaturday'
              value={employeeData.targetSaturday}
              onChange={handleChange}
              fullWidth
            />
          </Grid>

          {/* Row 6 */}
          <Grid item xs={12} md={4}>
            <CustomTextField
              label='Vehicle Number'
              name='vehicleNumber'
              value={employeeData.vehicleNumber}
              onChange={handleChange}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <CustomTextField
              type='color'
              label='Color'
              name='color'
              value={employeeData.color}
              onChange={e => setEmployeeData(prev => ({ ...prev, color: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <CustomTextField
              label='Description'
              name='description'
              value={employeeData.description}
              onChange={handleChange}
              multiline
              rows={2}
              fullWidth
            />
          </Grid>

          {/* Actions */}
          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 4, pt: 8 }}>
            <Button variant='outlined' onClick={() => router.push('/admin/employee-list')}>
              Cancel
            </Button>
            <Button variant='contained' onClick={handleSubmit} disabled={loading}>
              {loading ? 'Updating...' : 'Update'}
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* Image Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth='md' fullWidth>
        <DialogContent sx={{ p: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {uploadedFileURL && (
            <img src={uploadedFileURL} alt='Uploaded Preview' style={{ width: '100%', height: 'auto' }} />
          )}
        </DialogContent>
      </Dialog>
    </ContentLayout>
  )
}
