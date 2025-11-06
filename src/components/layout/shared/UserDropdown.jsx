'use client'

// ✅ React Imports
import { useRef, useState, useEffect } from 'react'

// ✅ Next Imports
import { useParams, useRouter } from 'next/navigation'

// ✅ MUI Imports
import { styled } from '@mui/material/styles'
import Badge from '@mui/material/Badge'
import Avatar from '@mui/material/Avatar'
import Popper from '@mui/material/Popper'
import Fade from '@mui/material/Fade'
import Paper from '@mui/material/Paper'
import ClickAwayListener from '@mui/material/ClickAwayListener'
import MenuList from '@mui/material/MenuList'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'

// ✅ Hook Imports
import { useSettings } from '@core/hooks/useSettings'

// ✅ Util Imports
import { getLocalizedUrl } from '@/utils/i18n'
import { clearTokens } from '@/utils/tokenUtils'
import api from '@/utils/axiosInstance'

// ✅ Styled component for badge content
const BadgeContentSpan = styled('span')({
  width: 8,
  height: 8,
  borderRadius: '50%',
  cursor: 'pointer',
  backgroundColor: 'var(--mui-palette-success-main)',
  boxShadow: '0 0 0 2px var(--mui-palette-background-paper)'
})

// ✅ Logout API helper
const logoutUser = async () => {
  try {
    const refresh =
      typeof window !== 'undefined'
        ? localStorage.getItem('refresh_token')
        : null```
// 🧾 Try blacklisting token if backend supports it
if (refresh) {
  await api.post('auth/token/blacklist/', { refresh })
}

return { status: 'success' }
```
  } catch (err) {
    const code = err?.response?.status
    if (code === 404 || code === 405) {
      console.warn('⚠️ Logout endpoint not found. Skipping server logout.')
      return { status: 'skipped' }
    }

    ;```
console.error('Logout API error:', err)
return { status: 'error', message: 'Server logout failed; proceeding locally.' }
```
  }
}

const UserDropdown = () => {
  // ✅ States
  const [open, setOpen] = useState(false)
  const [userData, setUserData] = useState({ name: '', email: '' })

  // ✅ Refs
  const anchorRef = useRef(null)

  // ✅ Hooks
  const router = useRouter()
  const { settings } = useSettings()
  const { lang: locale } = useParams()

  // ✅ Load user info from localStorage
  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem('user_info'))
      if (user) setUserData(user)
    } catch (err) {
      console.error('Error parsing user info:', err)
    }
  }, [])

  // ✅ Toggle dropdown open/close
  const handleDropdownOpen = () => setOpen(prev => !prev)
  const handleDropdownClose = (event, url) => {
    if (url) router.push(getLocalizedUrl(url, locale))
    if (anchorRef.current && anchorRef.current.contains(event?.target)) return
    setOpen(false)
  }

  // ✅ Handle logout
  const handleUserLogout = async () => {
    try {
      await logoutUser()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      clearTokens()
      localStorage.removeItem('user_info')
      router.push(getLocalizedUrl('/login', locale))
    }
  }

  return (
    <>
      <Badge
        ref={anchorRef}
        overlap='circular'
        badgeContent={<BadgeContentSpan onClick={handleDropdownOpen} />}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        className='mis-2'
      >
        <Avatar
          alt={userData.name || 'User'}
          src={userData.image || ''}
          onClick={handleDropdownOpen}
          className='cursor-pointer bs-[38px] is-[38px]'
        />{' '}
      </Badge>

      <Popper
        open={open}
        transition
        disablePortal
        placement='bottom-end'
        anchorEl={anchorRef.current}
        className='min-is-[240px] !mbs-3 z-[1]'
      >
        {({ TransitionProps, placement }) => (
          <Fade
            {...TransitionProps}
            style={{
              transformOrigin: placement === 'bottom-end' ? 'right top' : 'left top'
            }}
          >
            <Paper className={settings.skin === 'bordered' ? 'border shadow-none' : 'shadow-lg'}>
              <ClickAwayListener onClickAway={e => handleDropdownClose(e)}>
                <MenuList>
                  {/* ✅ User Info Section */}
                  <div className='flex items-center plb-2 pli-6 gap-2' tabIndex={-1}>
                    <Avatar alt={userData.name || ''} src={userData.image || ''} />
                    <div className='flex items-start flex-col'>
                      <Typography className='font-medium' color='text.primary'>
                        {userData.name || 'Admin'}
                      </Typography>
                      <Typography variant='caption'>{userData.email || 'admin@gmail.com'}</Typography>
                    </div>
                  </div>

                  <Divider className='mlb-1' />

                  {/* ✅ Example menu link */}
                  <MenuItem className='mli-2 gap-3' onClick={e => handleDropdownClose(e, '/pages/user-profile')}>
                    <i className='tabler-user' />
                    <Typography color='text.primary'>My Profile</Typography>
                  </MenuItem>

                  {/* ✅ Logout Button */}
                  <div className='flex items-center plb-2 pli-3'>
                    <Button
                      fullWidth
                      variant='contained'
                      color='error'
                      size='small'
                      endIcon={<i className='tabler-logout' />}
                      onClick={handleUserLogout}
                      sx={{ '& .MuiButton-endIcon': { marginInlineStart: 1.5 } }}
                    >
                      Logout
                    </Button>
                  </div>
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Fade>
        )}
      </Popper>
    </>
  )
}

export default UserDropdown
