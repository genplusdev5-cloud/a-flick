'use client'

// ✅ React Imports
import { useState } from 'react'

// ✅ Next Imports
import Link from 'next/link'
import { useRouter } from 'next/navigation'

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
import { loginUser } from '@/api/auth/login'

const LoginV1 = () => {
  const router = useRouter()

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
      const res = await loginUser(data.email, data.password)

      if (res.status === 'success') {
        // ✅ Give small delay to ensure token is saved before redirect
        setTimeout(() => {
          router.push('/en/admin/dashboards')
        }, 400)
      } else {
        setErrorMsg(res.message || 'Login failed. Please try again.')
      }
    } catch (error) {
      console.error('Login error:', error)
      setErrorMsg(error.message || 'Invalid credentials or network error.')
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
            <Typography>Please sign in to continue using A-Flick.</Typography>
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
              <Typography color='error' variant='body2' className='text-center'>
                {errorMsg}
              </Typography>
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
