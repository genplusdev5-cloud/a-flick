'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

import {
  Box,
  Button,
  Grid,
  Card,
  Dialog,
  DialogContent,
  Autocomplete,
  // 👇 ADDED IMPORTS FOR CHECKBOX COMPONENTS
  Checkbox,
  FormControlLabel
} from '@mui/material'

// 🔥 Global UI Components (use everywhere)
import GlobalButton from '@/components/common/GlobalButton'
import GlobalTextField from '@/components/common/GlobalTextField'
import GlobalTextarea from '@/components/common/GlobalTextarea'
import GlobalSelect from '@/components/common/GlobalSelect'
import GlobalAutocomplete from '@/components/common/GlobalAutocomplete'

import { getDepartmentList } from '../../../../../../../api/departments/list'
import { getDesignationList } from '../../../../../../../api/designations/list'
import { getUserRoleList } from '../../../../../../../api/userRole/list'
import { getSchedulerList, getSupervisorList } from '@/api/employee'

import { addEmployee } from '@/api/employee'
import { showToast } from '@/components/common/Toasts'
import { useRouter } from 'next/navigation'

import { toast } from 'react-toastify'
import { Typography } from '@mui/material'

// Layout + Inputs (Assuming these paths are correct)
import ContentLayout from '@/components/layout/ContentLayout'
import CustomTextField from '@core/components/mui/TextField'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'

// ----------------------------------------------------------------------
// MAIN COMPONENT
// ----------------------------------------------------------------------

export default function AddEmployeePage() {
  const router = useRouter()

  // ----------------------------------------------------------------------
  // State and Options (Individual State Variables)
  // ----------------------------------------------------------------------

  // Autocomplete/Text Fields

  const [nickname, setNickname] = useState('')
  const [name, setName] = useState('')
  const [department, setDepartment] = useState(null)
  const [designation, setDesignation] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [scheduler, setScheduler] = useState(null)
  const [supervisor, setSupervisor] = useState(null)
  const [employeeRole, setEmployeeRole] = useState(null)
  const [lunchTime, setLunchTime] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [targetDay, setTargetDay] = useState('')
  const [targetNight, setTargetNight] = useState('')
  const [targetSaturday, setTargetSaturday] = useState('')
  const [vehicleNumber, setVehicleNumber] = useState('')
  const [description, setDescription] = useState('')

  const [departmentList, setDepartmentList] = useState([])
  const [designationList, setDesignationList] = useState([])
  const [userRoleList, setUserRoleList] = useState([])

  // 👇 CHANGED INITIAL COLOR STATE TO A DEFAULT HEX VALUE
  const [color, setColor] = useState('#000000')

  // Date Field
  const [dob, setDob] = useState(new Date())

  // File Upload State (Kept together)
  const [file, setFile] = useState(null)
  const [uploadedFileName, setUploadedFileName] = useState('')
  const [uploadedFileURL, setUploadedFileURL] = useState('')

  const [emailError, setEmailError] = useState(false)
  const [selectedFile, setSelectedFile] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)

  // Checkbox States
  const [isScheduler, setIsScheduler] = useState(false)
  const [isSales, setIsSales] = useState(false)
  const [isTechnician, setIsTechnician] = useState(false)

  const [schedulerList, setSchedulerList] = useState([])
  const [supervisorList, setSupervisorList] = useState([])

  const [fingerPrintId, setFingerPrintId] = useState('')
  const [employeeCode, setEmployeeCode] = useState('')
  const [nationality, setNationality] = useState('')
  const [signatureFile, setSignatureFile] = useState(null)

  const [isSupervisorFlag, setIsSupervisorFlag] = useState(false)
  const [isForeigner, setIsForeigner] = useState(false)
  const [isGps, setIsGps] = useState(false)
  const [isPhoto, setIsPhoto] = useState(false)
  const [isQr, setIsQr] = useState(false)
  const [isSign, setIsSign] = useState(false)

  // Map state keys to their setter functions
  const stateSetters = {
    employeeRole: setEmployeeRole,
    nickname: setNickname,
    name: setName,
    department: setDepartment,
    designation: setDesignation,
    userRole: setUserRole,
    scheduler: setScheduler,
    supervisor: setSupervisor,
    lunchTime: setLunchTime,
    email: setEmail,
    password: setPassword,
    phone: setPhone,
    targetDay: setTargetDay,
    targetNight: setTargetNight,
    targetSaturday: setTargetSaturday,
    vehicleNumber: setVehicleNumber,
    description: setDescription,
    color: setColor, // <-- ADD THIS
    dob: setDob
  }

  // Autocomplete Fields Definition
  const autocompleteFields = [
    {
      name: 'employeeRole',
      options: [
        { id: 1, label: 'Admin' },
        { id: 2, label: 'Sales' },
        { id: 2, label: 'Technician' }
      ]
    },
    {
      name: 'department',
      options: departmentList
    },
    {
      name: 'designation',
      options: designationList
    },
    {
      name: 'userRole',
      options: userRoleList
    },
    {
      name: 'scheduler',
      options: schedulerList // ⭐ FIXED
    },
    {
      name: 'supervisor',
      options: supervisorList // ⭐ FIXED
    }
  ]

  // Dynamic Refs and Open States for Autocomplete
  const refs = {}
  const openStates = {}
  const setOpenStates = {}

  autocompleteFields.forEach(({ name }) => {
    refs[name + 'Ref'] = useRef(null)
    refs[name + 'InputRef'] = useRef(null)
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [isOpen, setIsOpen] = useState(false)
    openStates[name + 'Open'] = isOpen
    setOpenStates[name + 'SetOpen'] = setIsOpen
  })

  // Explicit Refs
  const nicknameRef = useRef(null),
    nameRef = useRef(null),
    lunchTimeRef = useRef(null)
  const emailRef = useRef(null),
    passwordRef = useRef(null),
    phoneRef = useRef(null)
  const dobRef = useRef(null)
  const targetDayRef = useRef(null),
    targetNightRef = useRef(null),
    targetSaturdayRef = useRef(null)
  const vehicleNumberRef = useRef(null),
    descriptionRef = useRef(null),
    colorRef = useRef(null) // Color field ref is kept
  const fileUploadButtonRef = useRef(null)
  const closeButtonRef = useRef(null)
  const saveButtonRef = useRef(null)

  // Focusable Element Refs
  const focusableElementRefs = [
    refs.employeeRoleInputRef,
    nicknameRef,
    nameRef,
    refs.departmentInputRef,
    refs.designationInputRef,
    refs.userRoleInputRef,
    refs.schedulerInputRef,
    refs.supervisorInputRef,
    lunchTimeRef,
    emailRef,
    passwordRef,
    phoneRef,
    dobRef,
    targetDayRef,
    targetNightRef,
    targetSaturdayRef,
    vehicleNumberRef,
    descriptionRef,
    colorRef, // Included
    fileUploadButtonRef,
    closeButtonRef,
    saveButtonRef
  ].filter(ref => ref)

  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const [deptRes, desigRes, roleRes] = await Promise.all([
          getDepartmentList(),
          getDesignationList(),
          getUserRoleList()
        ])

        // Extract backend results correctly
        const extractResults = res => {
          if (res?.data?.data?.results) return res.data.data.results
          if (res?.data?.results) return res.data.results
          if (Array.isArray(res?.data)) return res.data
          return []
        }

        const departmentData = extractResults(deptRes)
        const designationData = extractResults(desigRes)
        const userRoleData = extractResults(roleRes)

        console.log('Dept Data:', departmentData)
        console.log('Desig Data:', designationData)
        console.log('User Role Data:', userRoleData)

        // Convert to dropdown format
        const sanitizeOptions = list =>
          list.map(item => ({
            id: item.id,
            label: item.name || '-'
          }))

        setDepartmentList(sanitizeOptions(departmentData))
        setDesignationList(sanitizeOptions(designationData))
        setUserRoleList(sanitizeOptions(userRoleData))
      } catch (error) {
        console.error('❌ Dropdown fetch failed:', error)
        showToast('error', 'Failed to load dropdown data')
      }
    }

    fetchDropdowns()
  }, [])

  useEffect(() => {
    const loadFlags = async () => {
      try {
        const schedulers = await getSchedulerList()
        const supervisors = await getSupervisorList()

        setSchedulerList(
          schedulers?.data?.map(x => ({
            id: x.id,
            label: x.name
          })) || []
        )

        setSupervisorList(
          supervisors?.data?.map(x => ({
            id: x.id,
            label: x.name
          })) || []
        )

        console.log('Scheduler List:', schedulers?.data)
        console.log('Supervisor List:', supervisors?.data)
      } catch (error) {
        console.error('Error loading scheduler/supervisor:', error)
      }
    }

    loadFlags()
  }, [])

  // ----------------------------------------------------------------------
  // Handlers
  // ----------------------------------------------------------------------

  const handleChange = e => {
    const { name, value } = e.target
    const setter = stateSetters[name]
    if (setter) {
      setter(value)
    }
  }

  const focusNextElement = useCallback(
    currentRef => {
      const currentElement = currentRef.current
      if (!currentElement) return

      const currentIndex = focusableElementRefs.findIndex(ref => ref === currentRef)

      if (currentIndex !== -1) {
        for (let i = currentIndex + 1; i < focusableElementRefs.length; i++) {
          const nextRef = focusableElementRefs[i]
          const nextElement = nextRef.current

          if (nextElement) {
            const nextAutocompleteField = autocompleteFields.find(field => refs[field.name + 'InputRef'] === nextRef)

            if (nextAutocompleteField) {
              nextElement.focus()
              const setStateFunc = setOpenStates[nextAutocompleteField.name + 'SetOpen']
              if (setStateFunc) {
                setStateFunc(true)
              }
            } else {
              nextElement.focus()
            }
            return
          }
        }
        saveButtonRef.current?.focus()
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [...Object.values(refs), ...Object.values(setOpenStates), focusableElementRefs]
  )

  const handleKeyDown = (e, currentRef, isMultiline = false) => {
    if (e.key === 'Enter') {
      if (isMultiline && e.shiftKey) {
        return
      }
      e.preventDefault()
      focusNextElement(currentRef)
    }
  }

  const handleAutocompleteChange = (name, newValue, currentInputRef) => {
    const setter = stateSetters[name]
    if (setter) setter(newValue ?? null) // store object
    const setStateFunc = setOpenStates[name + 'SetOpen']
    if (setStateFunc) setStateFunc(false)
    focusNextElement(currentInputRef)
  }

  const handleDateChange = (name, date, currentInputRef) => {
    const setter = stateSetters[name]
    if (setter) {
      setter(date)
    }
    focusNextElement(currentInputRef)
  }

  const handleViewFile = () => {
    if (uploadedFileURL) setOpenDialog(true)
    else alert('No file available to view.')
  }

  const handleCloseDialog = () => setOpenDialog(false)

  const handleSubmit = async () => {
    try {
      console.log('CHECK_SELECTED_VALUES >>>', {
        department,
        designation,
        userRole,
        scheduler,
        supervisor,
        employeeRole
      })

      if (!name || !email || !password) {
        showToast('warning', 'Please fill Name, Email, and Password')
        return
      }

      // -------------------------------
      // ✅ FORMAT VALUES
      // -------------------------------
      const formatLunch = lunchTime ? (lunchTime.length === 5 ? `${lunchTime}:00` : lunchTime) : ''

      const formatDob = dob ? new Date(dob).toISOString().slice(0, 10) : ''

      // -------------------------------
      // ✅ INIT FORMDATA
      // -------------------------------
      const formData = new FormData()

      // Basic Fields
      formData.append('name', name || '')
      formData.append('email', email || '')
      formData.append('password', password || '')
      formData.append('phone', phone || '')
      formData.append('nick_name', nickname || '')
      formData.append('description', description || '')

      // -------------------------------
      // 🔥 Foreign Key IDs (ONLY append if selected)
      // -------------------------------
      if (department?.id) formData.append('department_id', Number(department.id))
      if (designation?.id) formData.append('designation_id', Number(designation.id))
      if (userRole?.id) formData.append('user_role_id', Number(userRole.id))
      if (scheduler?.id) formData.append('scheduler_id', Number(scheduler.id))
      if (supervisor?.id) formData.append('supervisor_id', Number(supervisor.id))

      // Extra Fields
      formData.append('finger_print_id', fingerPrintId || '')
      formData.append('employee_code', employeeCode || '')
      formData.append('nationality', nationality || '')

      // Signature file
      if (signatureFile) {
        formData.append('signature', signatureFile)
      }

      // Flags
      formData.append('is_supervisor', isSupervisorFlag ? 1 : 0)
      formData.append('is_foreigner', isForeigner ? 1 : 0)
      formData.append('is_gps', isGps ? 1 : 0)
      formData.append('is_photo', isPhoto ? 1 : 0)
      formData.append('is_qr', isQr ? 1 : 0)
      formData.append('is_sign', isSign ? 1 : 0)

      formData.append('is_sales', isSales ? 1 : 0)
      formData.append('is_scheduler', isScheduler ? 1 : 0)
      formData.append('is_technician', isTechnician ? 1 : 0)

      // Lunch, Targets, DOB
      formData.append('lunch_time', formatLunch)
      formData.append('target_day', targetDay || '')
      formData.append('target_night', targetNight || '')
      formData.append('target_saturday', targetSaturday || '')
      formData.append('vehicle_no', vehicleNumber || '')
      formData.append('color_code', color || '')
      formData.append('dob', formatDob)

      // Meta
      formData.append('created_by', 1)
      formData.append('updated_by', 1)
      formData.append('is_active', 1)

      // -------------------------------
      // 🔥 API CALL
      // -------------------------------
      const res = await addEmployee(formData)

      if (res?.status === 'success') {
        showToast('success', 'Employee added successfully!')
        sessionStorage.setItem('reloadAfterAdd', 'true')
        setTimeout(() => router.push('/admin/employee-list'), 1000)
      } else {
        showToast('error', res?.message || 'Failed to add employee')
      }
    } catch (error) {
      console.error('❌ Add Employee Error:', error)
      showToast('error', error.response?.data?.message || 'Validation failed')
    }
  }

  const stateValues = {
    employeeRole,
    department,
    designation,
    userRole,
    scheduler,
    supervisor
  }

  const renderAutocomplete = ({ name, label, options, gridProps = { xs: 12, md: 4 } }) => {
    const ref = refs[name + 'Ref']
    const inputRef = refs[name + 'InputRef']
    const isOpen = openStates[name + 'Open']
    const setIsOpen = setOpenStates[name + 'SetOpen']

    return (
      <Grid item {...gridProps} key={name}>
        <GlobalAutocomplete
          options={options}
          getOptionLabel={o => (typeof o === 'string' ? o : (o?.label ?? ''))}
          isOptionEqualToValue={(o, v) => o?.id === v?.id}
          value={stateValues[name] || null} // ✅ Correct mapping
          onChange={newValue => handleAutocompleteChange(name, newValue, inputRef)}
          renderInput={params => <GlobalTextField {...params} label={label} inputRef={inputRef} />}
        />
      </Grid>
    )
  }

  // ----------------------------------------------------------------------
  // Form Structure (UPDATED Grid items to md=4)
  // ----------------------------------------------------------------------

  return (
    <ContentLayout
      title={<Box sx={{ m: 2 }}>{'Add Employee'}</Box>}
      breadcrumbs={[
        { label: 'Dashboard', href: '/' },
        { label: 'Employee', href: '/admin/employee-list' },
        { label: 'Add Employee' }
      ]}
    >
      <Card sx={{ p: 4, boxShadow: 'none' }} elevation={0}>
        <Grid container spacing={6}>
          {/* Row 1: Employee Role (4), Nickname (4), Name (4) */}
          {renderAutocomplete({
            name: 'employeeRole',
            label: 'Employee Role',
            options: autocompleteFields.find(f => f.name === 'employeeRole').options
          })}
          <Grid item xs={12} md={4}>
            {' '}
            {/* ⬅️ CHANGED to md={4} */}
            <GlobalTextField
              fullWidth
              label='Nick name'
              name='nickname'
              value={nickname}
              placeholder='Nick name'
              onChange={handleChange}
              required
              sx={{
                '& .MuiFormLabel-asterisk': {
                  color: '#e91e63 !important',
                  fontWeight: 700
                },
                '& .MuiInputLabel-root.Mui-required': {
                  color: 'inherit'
                }
              }}
              inputRef={nicknameRef}
              onKeyDown={e => handleKeyDown(e, nicknameRef)}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            {' '}
            {/* ⬅️ CHANGED to md={4} */}
            <GlobalTextField
              fullWidth
              label='Name'
              name='name'
              value={name}
              onChange={handleChange}
              inputRef={nameRef}
              onKeyDown={e => handleKeyDown(e, nameRef)}
              required
              sx={{
                '& .MuiFormLabel-asterisk': {
                  color: '#e91e63 !important',
                  fontWeight: 700
                },
                '& .MuiInputLabel-root.Mui-required': {
                  color: 'inherit'
                }
              }}
            />
          </Grid>
          {/* Row 2: Department (4), Designation (4), User Role (4) */}
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

          <Grid item xs={12} md={4}>
            <GlobalTextField
              fullWidth
              label='Finger Print ID'
              name='finger_print_id'
              value={fingerPrintId}
              onChange={e => setFingerPrintId(e.target.value)}
              required
              sx={{
                '& .MuiFormLabel-asterisk': {
                  color: '#e91e63 !important',
                  fontWeight: 700
                },
                '& .MuiInputLabel-root.Mui-required': {
                  color: 'inherit'
                }
              }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <GlobalTextField
              fullWidth
              label='Employee Code'
              name='employee_code'
              value={employeeCode}
              onChange={e => setEmployeeCode(e.target.value)}
              required
              sx={{
                '& .MuiFormLabel-asterisk': {
                  color: '#e91e63 !important',
                  fontWeight: 700
                },
                '& .MuiInputLabel-root.Mui-required': {
                  color: 'inherit'
                }
              }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <GlobalTextField
              fullWidth
              label='Nationality'
              name='nationality'
              value={nationality}
              onChange={e => setNationality(e.target.value)}
              required
              sx={{
                '& .MuiFormLabel-asterisk': {
                  color: '#e91e63 !important',
                  fontWeight: 700
                },
                '& .MuiInputLabel-root.Mui-required': {
                  color: 'inherit'
                }
              }}
            />
          </Grid>

          {/* Row 3: Scheduler (4), Supervisor (4), Lunch Time (4) */}
          {renderAutocomplete({
            name: 'scheduler',
            label: 'Scheduler',
            options: schedulerList
          })}
          {renderAutocomplete({
            name: 'supervisor',
            label: 'Supervisor',
            options: supervisorList
          })}
          <Grid item xs={12} md={4}>
            {' '}
            {/* ⬅️ CHANGED to md={4} */}
            <GlobalTextField
              type='time'
              fullWidth
              label='Lunch Time'
              name='lunchTime'
              value={lunchTime}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              inputRef={lunchTimeRef}
              onKeyDown={e => handleKeyDown(e, lunchTimeRef)}
              required
              sx={{
                '& .MuiFormLabel-asterisk': {
                  color: '#e91e63 !important',
                  fontWeight: 700
                },
                '& .MuiInputLabel-root.Mui-required': {
                  color: 'inherit'
                }
              }}
            />
          </Grid>

          {/* 👇 START NEW CHECKBOX ROW (Row 4) */}
          <Grid item xs={12} md={4}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={isScheduler}
                  onChange={e => setIsScheduler(e.target.checked)}
                  name='isScheduler'
                  color='primary'
                />
              }
              label='Scheduler'
              sx={{ mt: 1 }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControlLabel
              control={<Checkbox checked={isSupervisorFlag} onChange={e => setIsSupervisorFlag(e.target.checked)} />}
              label='Is Supervisor'
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControlLabel
              control={<Checkbox checked={isForeigner} onChange={e => setIsForeigner(e.target.checked)} />}
              label='Is Foreigner'
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControlLabel
              control={<Checkbox checked={isGps} onChange={e => setIsGps(e.target.checked)} />}
              label='GPS'
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControlLabel
              control={<Checkbox checked={isPhoto} onChange={e => setIsPhoto(e.target.checked)} />}
              label='Photo'
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControlLabel
              control={<Checkbox checked={isQr} onChange={e => setIsQr(e.target.checked)} />}
              label='QR'
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControlLabel
              control={<Checkbox checked={isSign} onChange={e => setIsSign(e.target.checked)} />}
              label='Signature'
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={isSales}
                  onChange={e => setIsSales(e.target.checked)}
                  name='isSales'
                  color='primary'
                />
              }
              label='Is Sales'
              sx={{ mt: 1 }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={isTechnician}
                  onChange={e => setIsTechnician(e.target.checked)}
                  name='isTechnician'
                  color='primary'
                />
              }
              label='Is Technician'
              sx={{ mt: 1 }}
            />
          </Grid>
          {/* 👆 END NEW CHECKBOX ROW */}

          {/* Row 5: Email (4), Password (4), Phone (4) */}
          <Grid item xs={12} md={4}>
            {' '}
            {/* ⬅️ CHANGED to md={4} */}
            <GlobalTextField
              fullWidth
              label='Email'
              name='email'
              value={email}
              onChange={e => {
                const value = e.target.value
                setEmail(value)
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                setEmailError(value && !emailRegex.test(value))
              }}
              error={emailError}
              helperText={emailError ? 'Please enter a valid email address' : ''}
              inputRef={emailRef}
              onKeyDown={e => handleKeyDown(e, emailRef)}
              required
              sx={{
                '& .MuiFormLabel-asterisk': {
                  color: '#e91e63 !important',
                  fontWeight: 700
                },
                '& .MuiInputLabel-root.Mui-required': {
                  color: 'inherit'
                }
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            {' '}
            {/* ⬅️ CHANGED to md={4} */}
            <GlobalTextField
              fullWidth
              label='Password'
              name='password'
              value={password || ''}
              onChange={handleChange}
              inputRef={passwordRef}
              onKeyDown={e => handleKeyDown(e, passwordRef)}
              required
              sx={{
                '& .MuiFormLabel-asterisk': {
                  color: '#e91e63 !important',
                  fontWeight: 700
                },
                '& .MuiInputLabel-root.Mui-required': {
                  color: 'inherit'
                }
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            {' '}
            {/* ⬅️ CHANGED to md={4} */}
            <GlobalTextField
              fullWidth
              label='Phone'
              name='phone'
              value={phone}
              onChange={e => {
                let value = e.target.value.replace(/\D/g, '')
                if (value.length > 5) value = value.slice(0, 5) + ' ' + value.slice(5, 10)
                setPhone(value)
              }}
              inputRef={phoneRef}
              onKeyDown={e => handleKeyDown(e, phoneRef)}
              required
              sx={{
                '& .MuiFormLabel-asterisk': {
                  color: '#e91e63 !important',
                  fontWeight: 700
                },
                '& .MuiInputLabel-root.Mui-required': {
                  color: 'inherit'
                }
              }}
            />
          </Grid>

          {/* Row 6: DOB (4), Target Day (4), Target Night (4) */}
          <Grid item xs={12} md={4}>
            {' '}
            {/* ⬅️ CHANGED to md={4} */}
            <AppReactDatepicker
              selected={dob}
              id='dob-date'
              onChange={date => handleDateChange('dob', date, dobRef)}
              placeholderText='Select DOB'
              dateFormat='dd/MM/yyyy'
              customInput={<GlobalTextField label='DOB' fullWidth inputRef={dobRef} />}
              required
              sx={{
                '& .MuiFormLabel-asterisk': {
                  color: '#e91e63 !important',
                  fontWeight: 700
                },
                '& .MuiInputLabel-root.Mui-required': {
                  color: 'inherit'
                }
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            {' '}
            {/* ⬅️ CHANGED to md={4} */}
            <GlobalTextField
              type='text'
              fullWidth
              label='Target Day ($)'
              name='targetDay'
              value={targetDay}
              onChange={handleChange}
              inputRef={targetDayRef}
              onKeyDown={e => handleKeyDown(e, targetDayRef)}
              required
              sx={{
                '& .MuiFormLabel-asterisk': {
                  color: '#e91e63 !important',
                  fontWeight: 700
                },
                '& .MuiInputLabel-root.Mui-required': {
                  color: 'inherit'
                }
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            {' '}
            {/* ⬅️ CHANGED to md={4} */}
            <GlobalTextField
              fullWidth
              label='Target Night ($)'
              name='targetNight'
              value={targetNight || ''}
              onChange={handleChange}
              inputRef={targetNightRef}
              onKeyDown={e => handleKeyDown(e, targetNightRef)}
              required
              sx={{
                '& .MuiFormLabel-asterisk': {
                  color: '#e91e63 !important',
                  fontWeight: 700
                },
                '& .MuiInputLabel-root.Mui-required': {
                  color: 'inherit'
                }
              }}
            />
          </Grid>

          {/* Row 7: Target Saturday (4), Vehicle Number (4), Description (4) */}
          <Grid item xs={12} md={4}>
            {' '}
            {/* ⬅️ CHANGED to md={4} */}
            <GlobalTextField
              fullWidth
              label='Target Saturday ($)'
              name='targetSaturday'
              value={targetSaturday}
              onChange={handleChange}
              inputRef={targetSaturdayRef}
              onKeyDown={e => handleKeyDown(e, targetSaturdayRef)}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            {' '}
            {/* ⬅️ CHANGED to md={4} */}
            <GlobalTextField
              fullWidth
              label='Vehile Number'
              name='vehicleNumber'
              value={vehicleNumber}
              onChange={handleChange}
              inputRef={vehicleNumberRef}
              onKeyDown={e => handleKeyDown(e, vehicleNumberRef)}
              required
              sx={{
                '& .MuiFormLabel-asterisk': {
                  color: '#e91e63 !important',
                  fontWeight: 700
                },
                '& .MuiInputLabel-root.Mui-required': {
                  color: 'inherit'
                }
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            {' '}
            {/* ⬅️ ADJUSTED for 3-column layout */}
            <GlobalTextarea
              multiline
              rows={3}
              fullWidth
              label='Description'
              name='description'
              value={description}
              onChange={handleChange}
              inputRef={descriptionRef}
              onKeyDown={e => handleKeyDown(e, descriptionRef, true)}
            />
          </Grid>

          {/* Row 8: Color (4) - MODIFIED FOR COLOR PICKER */}
          <Grid item xs={12} md={4}>
            {' '}
            {/* ⬅️ ADJUSTED for 3-column layout */}
            <GlobalTextField
              // 👇 SET TYPE TO 'COLOR'
              type='color'
              // Removed multiline/rows as it's not applicable for type='color'
              fullWidth
              label='Color'
              name='color'
              value={color}
              onChange={e => setColor(e.target.value)} // Direct setter usage is fine
              InputLabelProps={{ shrink: true }} // Ensures label stays up for color picker
              inputRef={colorRef}
              onKeyDown={e => handleKeyDown(e, colorRef)} // Kept for flow
              sx={{
                // Optional: Style to make the color input larger/more visible
                '& .MuiInputBase-input': {
                  height: '40px',
                  padding: '5px 8px',
                  cursor: 'pointer'
                }
              }}
            />
          </Grid>

          {/* Actions */}
          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 4, pt: 8 }}>
            <GlobalButton color='secondary' onClick={() => router.push('/admin/employee-list')} ref={closeButtonRef}>
              Close
            </GlobalButton>
            <GlobalButton variant='contained' onClick={handleSubmit} ref={saveButtonRef}>
              Save
            </GlobalButton>
          </Grid>
        </Grid>
      </Card>

      {/* Image Dialog (Uses uploadedFileURL state) */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth='md' fullWidth>
        <DialogContent sx={{ p: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {uploadedFileURL && (
            <img
              src={uploadedFileURL}
              alt='Uploaded File Preview'
              style={{ width: '100%', height: 'auto', objectFit: 'contain' }}
            />
          )}
        </DialogContent>
      </Dialog>
    </ContentLayout>
  )
}
