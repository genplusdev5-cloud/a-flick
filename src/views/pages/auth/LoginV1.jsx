'use client'

// ✅ React Imports
import { useState } from 'react'

// ✅ Next Imports
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'

// ✅ Next Auth Imports
// ✅ API Import
import { loginUser } from '@/api/auth/login'

// ✅ MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'

// ✅ Form Imports
import { useForm, Controller } from 'react-hook-form'

// ✅ Component Imports
import Logo from '@components/layout/shared/Logo'
import CustomTextField from '@core/components/mui/TextField'

// ✅ Config Imports
import themeConfig from '@configs/themeConfig'

// ✅ Custom Utils
// ✅ Custom Utils
import { showToast } from '@/components/common/Toasts'

const LoginV1 = () => {
  const router = useRouter()
  const { lang: locale } = useParams()

  // ✅ States
  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // ✅ React Hook Form Setup
  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues: {
      email: '',
      password: ''
    }
  })

  // ✅ Toggle Password Visibility
  const handleClickShowPassword = () => setIsPasswordShown(!isPasswordShown)

  // ✅ Handle Login
  const onSubmit = async data => {
    setLoading(true)
    setErrorMsg('')

    try {
      // ✅ Direct API Call
      await loginUser(data.email, data.password)

      showToast('success', 'Login successful! Welcome back.')

      // ✅ Redirect
      setTimeout(() => {
        const redirectUrl = `/${locale}/admin/dashboards`
        router.push(redirectUrl)
      }, 500)
    } catch (error) {
      console.error('Login error:', error)
      const msg = error?.message || 'Login failed. Please try again.'
      setErrorMsg(msg)
      showToast('error', msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='flex justify-center items-center min-h-screen w-full bg-background'>
      <Card className='flex flex-col sm:w-[450px]'>
        <CardContent className='sm:!p-12'>
          <Link href='/' className='flex justify-center mb-6'>
            <Logo />
          </Link>

          <div className='flex flex-col gap-1 mb-6 text-center'>
            <Typography variant='h4'>{`Welcome to ${themeConfig.templateName}! 👋🏻`}</Typography>
            <Typography>Please sign in to continue</Typography>
          </div>

          {/* ✅ Login Form */}
          <form noValidate autoComplete='off' onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-6'>
            {/* Email Field */}
            <Controller
              name='email'
              control={control}
              rules={{
                required: 'Email is required',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Enter a valid email address'
                }
              }}
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  id='email'
                  autoFocus
                  fullWidth
                  type='email'
                  label='Email'
                  placeholder='Enter your email'
                  {...(errors.email && { error: true, helperText: errors.email.message })}
                />
              )}
            />

            {/* Password Field */}
            <Controller
              name='password'
              control={control}
              rules={{ required: 'Password is required' }}
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  id='password'
                  fullWidth
                  label='Password'
                  placeholder='••••••••'
                  type={isPasswordShown ? 'text' : 'password'}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position='end'>
                          <IconButton
                            edge='end'
                            onClick={handleClickShowPassword}
                            onMouseDown={e => e.preventDefault()}
                          >
                            <i className={isPasswordShown ? 'tabler-eye-off' : 'tabler-eye'} />
                          </IconButton>
                        </InputAdornment>
                      )
                    }
                  }}
                  {...(errors.password && { error: true, helperText: errors.password.message })}
                />
              )}
            />

            {/* Error Message */}
            {errorMsg && (
              <div className='flex flex-col gap-2 p-4 bg-red-50 text-red-600 rounded text-sm break-all'>
                <Typography color='error' variant='subtitle2' className='font-bold'>
                  Error Details:
                </Typography>
                <div>{errorMsg}</div>
              </div>
            )}

            {/* Submit Button */}
            <Button fullWidth variant='contained' type='submit' disabled={loading}>
              {loading ? <CircularProgress size={24} color='inherit' /> : 'Login'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default LoginV1
