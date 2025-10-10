'use client'

// React Imports
import { useState } from 'react'

// Next Imports
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Checkbox from '@mui/material/Checkbox'
import Button from '@mui/material/Button'
import FormControlLabel from '@mui/material/FormControlLabel'
import Divider from '@mui/material/Divider'
import CircularProgress from '@mui/material/CircularProgress'

// Third-party Imports
import { signIn } from 'next-auth/react'
import { Controller, useForm } from 'react-hook-form'
import { valibotResolver } from '@hookform/resolvers/valibot'
import { email, object, minLength, string, pipe, nonEmpty } from 'valibot'

// Component Imports
import Logo from '@components/layout/shared/Logo'
import CustomTextField from '@core/components/mui/TextField'

// Config Imports
import themeConfig from '@configs/themeConfig'

// Util Imports
import { getLocalizedUrl } from '@/utils/i18n'

// Styled Component Imports
import AuthIllustrationWrapper from './AuthIllustrationWrapper'

// ✅ Validation schema
const schema = object({
  email: pipe(string(), minLength(1, 'This field is required'), email('Email is invalid')),
  password: pipe(string(), nonEmpty('This field is required'), minLength(5, 'Password must be at least 5 characters'))
})

const LoginV1 = () => {
  // States
  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)

  // Hooks
  const { lang: locale } = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()

  // React Hook Form
  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: valibotResolver(schema),
    defaultValues: { email: '', password: '' }
  })

  const handleClickShowPassword = () => setIsPasswordShown(show => !show)

  // ✅ Login submit handler
  // const onSubmit = async data => {
  //   setLoading(true)
  //   setErrorMsg(null)

  //   const res = await signIn('credentials', {
  //     email: data.email,
  //     password: data.password,
  //     redirect: false
  //   })

  //   setLoading(false)

  //   if (res && res.ok && res.error === null) {
  //     const redirectURL = searchParams.get('redirectTo') ?? '/'
  //     router.replace(getLocalizedUrl(redirectURL, locale))
  //   } else {
  //     if (res?.error) {
  //       try {
  //         const parsed = JSON.parse(res.error)
  //         setErrorMsg(parsed.message[0] || 'Invalid credentials')
  //       } catch {
  //         setErrorMsg('Invalid credentials')
  //       }
  //     }
  //   }
  // }



const onSubmit = data => {
  setLoading(true)
  setErrorMsg(null)

  setTimeout(() => {
    setLoading(false)
    // ✅ Set a temporary login flag
    localStorage.setItem('fake-auth', 'true')
    // Redirect to CRM dashboard
    router.replace(getLocalizedUrl('/dashboards/crm', locale))
  }, 500)
}


  return (
   <div className="flex justify-center items-center min-h-screen w-full bg-background">
      <Card className='flex flex-col sm:is-[450px]'>
        <CardContent className='sm:!p-12'>
          <Link href={getLocalizedUrl('/', locale)} className='flex justify-center mbe-6'>
            <Logo />
          </Link>
          <div className='flex flex-col gap-1 mbe-6'>
            <Typography variant='h4'>{`Welcome to ${themeConfig.templateName}! 👋🏻`}</Typography>
            <Typography>Please sign in to continue using A-Flick.</Typography>
          </div>

          {/* ✅ Form with working login */}
          <form noValidate autoComplete='off' onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-6'>
            <Controller
              name='email'
              control={control}
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

            <Controller
              name='password'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  fullWidth
                  label='Password'
                  placeholder='···········'
                  type={isPasswordShown ? 'text' : 'password'}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position='end'>
                          <IconButton edge='end' onClick={handleClickShowPassword} onMouseDown={e => e.preventDefault()}>
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

            {/* Error message */}
            {errorMsg && (
              <Typography color="error" variant="body2">
                {errorMsg}
              </Typography>
            )}

            {/* <div className='flex justify-between items-center gap-x-3 gap-y-1 flex-wrap'>
              <FormControlLabel control={<Checkbox />} label='Remember me' />
              <Typography
                className='text-end'
                color='primary.main'
                component={Link}
                href={getLocalizedUrl('/pages/auth/forgot-password-v1', locale)}
              >
                Forgot password?
              </Typography>
            </div> */}

            {/* ✅ Button with loading spinner */}
            <Button fullWidth variant='contained' type='submit' disabled={loading}>
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Login'}
            </Button>

            {/* <div className='flex justify-center items-center flex-wrap gap-2'>
              <Typography>New on our platform?</Typography>
              <Typography component={Link} href={getLocalizedUrl('/pages/auth/register-v1', locale)} color='primary.main'>
                Create an account
              </Typography>
            </div> */}

            {/* <Divider className='gap-2 text-textPrimary'>or</Divider> */}

            {/* <div className='flex justify-center items-center gap-1.5'>
              <IconButton className='text-facebook' size='small'><i className='tabler-brand-facebook-filled' /></IconButton>
              <IconButton className='text-twitter' size='small'><i className='tabler-brand-twitter-filled' /></IconButton>
              <IconButton className='text-textPrimary' size='small'><i className='tabler-brand-github-filled' /></IconButton>
              <IconButton className='text-error' size='small'><i className='tabler-brand-google-filled' /></IconButton>
            </div> */}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default LoginV1
