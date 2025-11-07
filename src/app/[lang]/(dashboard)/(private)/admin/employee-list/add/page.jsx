'use client'

import { useState, useRef, useCallback } from 'react'
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

import { addEmployee } from '@/api/employee'

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
  const [employeeRole, setEmployeeRole] = useState('')
  const [nickname, setNickname] = useState('')
  const [name, setName] = useState('')
  const [department, setDepartment] = useState('')
  const [designation, setDesignation] = useState('')
  const [userRole, setUserRole] = useState('')
  const [scheduler, setScheduler] = useState('')
  const [supervisor, setSupervisor] = useState('')
  const [lunchTime, setLunchTime] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [targetDay, setTargetDay] = useState('')
  const [targetNight, setTargetNight] = useState('')
  const [targetSaturday, setTargetSaturday] = useState('')
  const [vehicleNumber, setVehicleNumber] = useState('')
  const [description, setDescription] = useState('')
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
    // color field logic is handled separately below due to the 'color' type
    dob: setDob
  }

  // Autocomplete Fields Definition
  const autocompleteFields = [
    {
      name: 'employeeRole',
      options: [
        { id: 1, label: 'Confirmed Sales' },
        { id: 2, label: 'Quotation' }
      ]
    },
    {
      name: 'department',
      options: [
        { id: 1, label: 'GP Industries Pvt Ltd' },
        { id: 2, label: 'Marketing' },
        { id: 3, label: 'IT' }
      ]
    },
    {
      name: 'designation',
      options: [
        { id: 1, label: 'Manager' },
        { id: 2, label: 'Senior Developer' },
        { id: 3, label: 'Sales Executive' }
      ]
    },
    {
      name: 'userRole',
      options: [
        { id: 1, label: 'Admin' },
        { id: 2, label: 'Standard User' },
        { id: 3, label: 'Technician' }
      ]
    },
    {
      name: 'scheduler',
      options: [
        { id: 1, label: 'User A' },
        { id: 2, label: 'User B' }
      ]
    },
    {
      name: 'supervisor',
      options: [
        { id: 1, label: 'Supervisor 1' },
        { id: 2, label: 'Supervisor 2' }
      ]
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

  // ──────────────────────────────────────────────────────────────
  // Toast (Custom Styled, Global, with Icons & Colors)
  // ──────────────────────────────────────────────────────────────
  const showToast = (type, message = '') => {
    const icons = {
      success: 'tabler-circle-check',
      delete: 'tabler-trash',
      error: 'tabler-alert-triangle',
      warning: 'tabler-info-circle',
      info: 'tabler-refresh'
    }

    toast(
      <div className='flex items-center gap-2'>
        <i
          className={icons[type]}
          style={{
            color:
              type === 'success'
                ? '#16a34a'
                : type === 'error'
                  ? '#dc2626'
                  : type === 'delete'
                    ? '#dc2626'
                    : type === 'warning'
                      ? '#f59e0b'
                      : '#2563eb',
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
        closeOnClick: true,
        pauseOnHover: false,
        draggable: false,
        theme: 'light',
        style: {
          borderRadius: '10px',
          padding: '8px 14px',
          boxShadow: '0 4px 10px rgba(0,0,0,0.06)',
          display: 'flex',
          alignItems: 'center'
        }
      }
    )
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
    if (setter) {
      setter(newValue)
    }
    const setStateFunc = setOpenStates[name + 'SetOpen']
    if (setStateFunc) {
      setStateFunc(false)
    }
    focusNextElement(currentInputRef)
  }

  const handleAutocompleteInputChange = (name, options, newValue, reason) => {
    if (reason === 'input' && !options.includes(newValue) && !autocompleteFields.find(f => f.name === name).freeSolo) {
      return
    }
    const setter = stateSetters[name]
    if (setter) {
      setter(newValue)
    }
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
      if (!name || !email || !password) {
        showToast('warning', 'Please fill Name, Email, and Password')
        return
      }

      // ✅ Build the final payload (using backend field names)
      const newEmployee = {
        name,
        email,
        password,
        phone: phone || null,
        // 👉 These fields must send IDs, not labels
        employee_role: employeeRole?.label || '-',
        department_id: department?.id || null,
        designation_id: designation?.id || null,
        user_role_id: userRole?.id || null,
        scheduler_id: scheduler?.id || null,
        supervisor_id: supervisor?.id || null,

        // Optional / numeric fields
        target_day: targetDay || null,
        target_night: targetNight || null,
        target_saturday: targetSaturday || null,

        // Boolean/flag values
        is_scheduler: isScheduler ? 1 : 0,
        is_sales: isSales ? 1 : 0,
        is_technician: isTechnician ? 1 : 0,
        is_active: 1,

        // Extra fields
        lunch_time: lunchTime || null,
        vehicle_no: vehicleNumber || null,
        description: description || null,
        color_code: color || '#000000',
        dob: dob ? new Date(dob).toISOString().split('T')[0] : null
      }

      console.log('🔍 Payload sent to API:', newEmployee)

      const res = await addEmployee(newEmployee)

      if (res?.status === 'success') {
        showToast('success', 'Employee added successfully!')

        // ✅ Let backend commit data and trigger reload flag
        sessionStorage.setItem('reloadAfterAdd', 'true')

        setTimeout(() => {
          router.push('/admin/employee-list')
        }, 1000)
      } else {
        showToast('error', res?.message || 'Failed to add employee')
      }
    } catch (error) {
      console.error('❌ Add Employee Error:', error)
      showToast('error', error.response?.data?.message || 'Validation failed')
    }
  }

  // ----------------------------------------------------------------------
  // Render Helper for Autocomplete (UPDATED TO md=4)
  // ----------------------------------------------------------------------

  const renderAutocomplete = ({ name, label, options, gridProps = { xs: 12, md: 4 } }) => {
    // ⬅️ md: 4 for 3 columns per row
    const ref = refs[name + 'Ref']
    const inputRef = refs[name + 'InputRef']
    const isOpen = openStates[name + 'Open']
    const setIsOpen = setOpenStates[name + 'SetOpen']

    // eslint-disable-next-line
    const value = eval(name)

    return (
      <Grid item {...gridProps} key={name}>
        <Autocomplete
          ref={ref}
          options={options}
          getOptionLabel={option => (typeof option === 'string' ? option : option?.label || '')}
          isOptionEqualToValue={(option, value) => option?.id === value?.id || option?.label === value?.label}
          value={value}
          onChange={(e, newValue) => handleAutocompleteChange(name, newValue, inputRef)}
          onInputChange={(e, newValue) => {
            const setter = stateSetters[name]
            if (setter) setter(newValue)
          }}
          renderInput={params => <CustomTextField {...params} label={label} inputRef={inputRef} />}
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
            <CustomTextField
              fullWidth
              label='Nick name'
              name='nickname'
              value={nickname}
              onChange={handleChange}
              inputRef={nicknameRef}
              onKeyDown={e => handleKeyDown(e, nicknameRef)}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            {' '}
            {/* ⬅️ CHANGED to md={4} */}
            <CustomTextField
              fullWidth
              label='Name'
              name='name'
              value={name}
              onChange={handleChange}
              inputRef={nameRef}
              onKeyDown={e => handleKeyDown(e, nameRef)}
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

          {/* Row 3: Scheduler (4), Supervisor (4), Lunch Time (4) */}
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
            {' '}
            {/* ⬅️ CHANGED to md={4} */}
            <CustomTextField
              type='time'
              fullWidth
              label='Lunch Time'
              name='lunchTime'
              value={lunchTime}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              inputRef={lunchTimeRef}
              onKeyDown={e => handleKeyDown(e, lunchTimeRef)}
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
            <CustomTextField
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
            />
          </Grid>
          <Grid item xs={12} md={4}>
            {' '}
            {/* ⬅️ CHANGED to md={4} */}
            <CustomTextField
              fullWidth
              label='Password'
              name='password'
              value={password || ''}
              onChange={handleChange}
              inputRef={passwordRef}
              onKeyDown={e => handleKeyDown(e, passwordRef)}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            {' '}
            {/* ⬅️ CHANGED to md={4} */}
            <CustomTextField
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
              customInput={<CustomTextField label='DOB' fullWidth inputRef={dobRef} />}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            {' '}
            {/* ⬅️ CHANGED to md={4} */}
            <CustomTextField
              type='text'
              fullWidth
              label='Target Day ($)'
              name='targetDay'
              value={targetDay}
              onChange={handleChange}
              inputRef={targetDayRef}
              onKeyDown={e => handleKeyDown(e, targetDayRef)}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            {' '}
            {/* ⬅️ CHANGED to md={4} */}
            <CustomTextField
              fullWidth
              label='Target Night ($)'
              name='targetNight'
              value={targetNight || ''}
              onChange={handleChange}
              inputRef={targetNightRef}
              onKeyDown={e => handleKeyDown(e, targetNightRef)}
            />
          </Grid>

          {/* Row 7: Target Saturday (4), Vehicle Number (4), Description (4) */}
          <Grid item xs={12} md={4}>
            {' '}
            {/* ⬅️ CHANGED to md={4} */}
            <CustomTextField
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
            <CustomTextField
              fullWidth
              label='Vehile Number'
              name='vehicleNumber'
              value={vehicleNumber}
              onChange={handleChange}
              inputRef={vehicleNumberRef}
              onKeyDown={e => handleKeyDown(e, vehicleNumberRef)}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            {' '}
            {/* ⬅️ ADJUSTED for 3-column layout */}
            <CustomTextField
              multiline
              rows={2}
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
            <CustomTextField
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
            <Button variant='outlined' onClick={() => router.push('/admin/employee-list')} ref={closeButtonRef}>
              Close
            </Button>
            <Button variant='contained' onClick={handleSubmit} ref={saveButtonRef}>
              Save
            </Button>
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
