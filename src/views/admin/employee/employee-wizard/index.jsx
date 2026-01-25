'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, Stepper, Step, StepLabel, Typography, Button, Box, CircularProgress } from '@mui/material'
import { styled } from '@mui/material/styles'
import classnames from 'classnames'
import CustomAvatar from '@core/components/mui/Avatar'
import StepperWrapper from '@core/styles/stepper'
import { showToast } from '@/components/common/Toasts'
import DirectionalIcon from '@components/DirectionalIcon'
import { format } from 'date-fns'

// Steps
import Step1Personal from './steps/Step1Personal'
import Step2Professional from './steps/Step2Professional'
import Step3Operations from './steps/Step3Operations'
import Step4Permissions from './steps/Step4Permissions'
import Step5Review from './steps/Step5Review'

// API
import { addEmployee, updateEmployee, getEmployeeDetails } from '@/api/employee'
// Note: Dropdown APIs are fetched in parent or here
import { getDepartmentList } from '@/api/employee/departments/list'
import { getDesignationList } from '@/api/employee/designations/list'
import { getUserRoleList } from '@/api/userRole/list'
import { getSchedulerList, getSupervisorList } from '@/api/employee'
import { getVehicleList } from '@/api/purchase/vehicle'


const steps = [
  { icon: 'tabler-user', title: 'Personal Info', subtitle: 'Name, Email & Contact' },
  { icon: 'tabler-briefcase', title: 'Professional', subtitle: 'Role, Dept & Designation' },
  { icon: 'tabler-settings', title: 'Operations', subtitle: 'Targets & Schedule' },
  { icon: 'tabler-lock', title: 'Permissions', subtitle: 'Access & Signature' },
  { icon: 'tabler-check', title: 'Review', subtitle: 'Verify & Submit' }
]

const StyledStep = styled(Step)(({ theme }) => ({
  '&.Mui-completed .step-title , &.Mui-completed .step-subtitle': {
    color: 'var(--mui-palette-text-disabled)'
  }
}))

export default function EmployeeWizard({ mode = 'add', id = null }) {
  const router = useRouter()
  const { lang } = useParams()
  const [activeStep, setActiveStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  
  // Data State
   const [dropdowns, setDropdowns] = useState({
    departments: [],
    designations: [],
    roles: [],
    schedulers: [],
    supervisors: [],
    vehicles: []
  })

  const initialForm = {
    employeeRole: null,
    nickname: '',
    name: '',
    department: null,
    designation: null,
    userRole: null,
    supervisor: null,
    scheduler: null,
    lunchTime: new Date(new Date().setHours(12, 0, 0, 0)),
    email: '',
    password: '',
    phone: '',
    targetDay: '',
    targetNight: '',
    targetSaturday: '',
    vehicleNumber: null,
    description: '',
    color: '#000000',
    dob: null,
    joinDate: new Date(),
    resignDate: null,
    fingerPrintId: '',
    employeeCode: '',
    nationality: '',

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

   // Helper
  const setField = (name, value) => setForm(prev => ({ ...prev, [name]: value }))
  
  const handlePhoneChange = e => {
    let value = e.target.value.replace(/\D/g, '')
    if (value.length > 10) value = value.slice(0, 10)
    if (value.length > 5) {
      value = value.slice(0, 5) + ' ' + value.slice(5)
    }
    setField('phone', value)
  }

  // Load Data
  useEffect(() => {
      const init = async () => {
          setLoading(true)
          try {
             // 1. Load Dropdowns
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
             
             const dd = {
                 departments: sanitize(extract(deptRes)),
                 designations: sanitize(extract(desigRes)),
                 roles: sanitize(extract(roleRes)),
                 schedulers: extract(schedRes).map(x => ({ id: x.id, label: x.name })),
                 supervisors: extract(superRes).map(x => ({ id: x.id, label: x.name })),
                 vehicles: (vehicleRes?.data?.results || vehicleRes?.results || []).map(x => ({ id: x.id, label: x.vehicle_name || x.vehicle_number || x.name }))
             }
             setDropdowns(dd)

             // 2. If Edit, load details
             if (mode === 'edit' && id) {
                 const res = await getEmployeeDetails(id)
                 const d = res?.data || {}
                 const match = (list, val) => list.find(x => Number(x.id) === Number(val)) || null
                 
                 setForm(prev => ({
                     ...prev,
                     employeeRole: [
                        { id: 1, label: 'Admin' },
                        { id: 2, label: 'Sales' },
                        { id: 3, label: 'Technician' },
                        { id: 4, label: 'Confirmed Sales' },
                        { id: 5, label: 'Quotation' }
                     ].find(x => x.label === d.employee_role) || null,
                     nickname: d.nick_name || '',
                     name: d.name || '',
                     department: match(dd.departments, d.department_id),
                     designation: match(dd.designations, d.designation_id),
                     userRole: match(dd.roles, d.user_role_id),
                     scheduler: match(dd.schedulers, d.scheduler_id),
                     supervisor: match(dd.supervisors, d.supervisor_id),
                     lunchTime: d.lunch_time ? (() => {
                        const [h, m, s] = d.lunch_time.split(':')
                        const dt = new Date()
                        dt.setHours(h, m, s || 0)
                        return dt
                     })() : new Date(new Date().setHours(12, 0, 0, 0)),
                     email: d.email || '',
                     phone: d.phone || '',
                     targetDay: d.target_day || '',
                     targetNight: d.target_night || '',
                     targetSaturday: d.target_saturday || '',
                     vehicleNumber: dd.vehicles.find(v => v.label === d.vehicle_no) || (d.vehicle_no ? { label: d.vehicle_no, id: null } : null),
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
                     existingSignature: d.signature || null
                 }))
             }
          } catch(err) {
              console.error(err)
              showToast('error', 'Failed to load data')
          } finally {
              setLoading(false)
          }
      }
      init()
  }, [mode, id])


  const validateStep = (step) => {
      if (step === 0) {
          if(!form.name || !form.email) {
              showToast('warning', 'Name and Email are required')
              return false
          }
          if(mode === 'add' && !form.password) {
               showToast('warning', 'Password is required')
               return false
          }
           if (emailError) return false
      }
      return true
  }

  const handleNext = () => {
    if (!validateStep(activeStep)) return
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1)
    } else {
      handleSubmit()
    }
  }

  const handlePrev = () => {
    if (activeStep > 0) setActiveStep(activeStep - 1)
  }
  
  const handleSubmit = async () => {
      setSubmitLoading(true)
      try {
           const fd = new FormData()
           if (mode === 'edit') fd.append('id', id)
           
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

            if (form.signature) {
                fd.append('signature', form.signature)
                fd.append('is_sign', 1)
            } else {
                fd.append('is_sign', form.isSign ? 1 : 0)
            }

            fd.append('is_active', 1)
            fd.append('status', 1)
            fd.append('created_by', 23)
            fd.append('updated_by', 23)
            
            const res = mode === 'add' ? await addEmployee(fd) : await updateEmployee(fd)
            
             if (res?.status === 'success') {
                showToast('success', `Employee ${mode === 'add' ? 'added' : 'updated'} successfully!`)
                sessionStorage.setItem('reloadAfterAdd', 'true') // Signal to reload list
                router.push(`/${lang}/admin/employee-list`)
             } else {
                 showToast('error', res?.message || 'Operation failed')
             }

      } catch(error) {
           console.error('Submit Error', error)
           showToast('error', error.response?.data?.message || 'Something went wrong')
      } finally {
          setSubmitLoading(false)
      }
  }

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return <Step1Personal form={form} setField={setField} handlePhoneChange={handlePhoneChange} emailError={emailError} mode={mode} />
      case 1:
        return <Step2Professional form={form} setField={setField} dropdowns={dropdowns} />
      case 2:
        return <Step3Operations form={form} setField={setField} dropdowns={dropdowns} />
       case 3:
        return <Step4Permissions form={form} setField={setField} />
       case 4:
        return <Step5Review form={form} />
      default:
        return 'Unknown Step'
    }
  }
  
 return (
    <Card className='flex flex-col md:flex-row'>
      <CardContent className='max-md:border-be md:border-ie md:min-is-[300px]'>
        <StepperWrapper>
          <Stepper
            activeStep={activeStep}
            orientation='vertical'
            connector={<></>}
            className='flex flex-col gap-4 min-is-[220px]'
          >
            {steps.map((label, index) => {
              return (
                <StyledStep key={index} completed={index < activeStep}>
                  <StepLabel icon={<></>} className='p-1 cursor-pointer' onClick={() => setActiveStep(index)}>
                    <div className='step-label'>
                      <CustomAvatar
                        variant='rounded'
                        skin={activeStep === index ? 'filled' : 'light'}
                        color={activeStep >= index ? 'primary' : 'secondary'}
                        className={classnames({ 'shadow-primarySm': activeStep === index })}
                        size={38}
                      >
                        <i className={classnames(label.icon, '!text-[22px]')} />
                      </CustomAvatar>
                      <div className='flex flex-col'>
                        <Typography color='text.primary' className='step-title'>
                          {label.title}
                        </Typography>
                        <Typography className='step-subtitle'>{label.subtitle}</Typography>
                      </div>
                    </div>
                  </StepLabel>
                </StyledStep>
              )
            })}
          </Stepper>
        </StepperWrapper>
      </CardContent>

      <CardContent className='flex-1 p-6'>
          {loading ? (
               <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
                   <CircularProgress />
               </Box>
          ) : getStepContent(activeStep)}
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button
                disabled={activeStep === 0}
                onClick={handlePrev}
                startIcon={<DirectionalIcon ltrIconClass='tabler-arrow-left' rtlIconClass='tabler-arrow-right' />}
              >
                Previous
              </Button>
              <Button
                variant='contained'
                onClick={handleNext}
                disabled={submitLoading}
                endIcon={activeStep === steps.length - 1 ? <i className='tabler-check' /> : <DirectionalIcon ltrIconClass='tabler-arrow-right' rtlIconClass='tabler-arrow-left' />}
              >
                {activeStep === steps.length - 1 ? (submitLoading ? <CircularProgress size={20} /> : 'Submit') : 'Next'}
              </Button>
          </Box>
      </CardContent>
    </Card>
  )
}
