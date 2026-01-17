import { useState, useRef, useEffect, forwardRef } from 'react'
import { format, subDays, startOfMonth, endOfMonth, subMonths, isValid, isSameDay } from 'date-fns'
import {
  Box,
  Typography,
  Menu,
  MenuItem,
  Popover,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemButton
} from '@mui/material'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'
import CustomTextField from '@core/components/mui/TextField'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'

const formatDate = date => (isValid(date) ? format(date, 'dd/MM/yyyy') : '')

const PresetDateRangePicker = ({ start, end, onSelectRange, label = '', disabled = false }) => {
  // Anchor Ref for generic positioning
  const anchorRef = useRef(null)
  const today = new Date()

  // State for Presets Popover

  const [popoverOpen, setPopoverOpen] = useState(false)

  // Track if we should show the calendar (only for Custom Range)
  const [showCalendar, setShowCalendar] = useState(false)

  const [localStart, setLocalStart] = useState(start)
  const [localEnd, setLocalEnd] = useState(end)

  // ✅ AFTER state is defined
  const isCustomRangeValid = Boolean(localStart && localEnd)

  // Sync internal state with props when opening
  useEffect(() => {
    if (popoverOpen) {
      setLocalStart(start)
      setLocalEnd(end)

      // Determine if calendar should be shown initially
      const preset = getActivePreset(start, end)
      setShowCalendar(preset === 'Custom Range')
    }
  }, [popoverOpen])

  // Open Popover
  const handleOpenPopover = () => {
    if (!disabled) {
      setPopoverOpen(true)
    }
  }

  const handleClosePopover = () => {
    setPopoverOpen(false)
  }

  // Handle Preset Selection
  const handlePreset = preset => {
    const now = new Date()
    let s = now
    let e = now

    if (preset === 'Custom Range') {
      setShowCalendar(true)
      return
    }

    // Preset Logic
    switch (preset) {
      case 'Today':
        s = now
        e = now
        break
      case 'Yesterday':
        s = subDays(now, 1)
        e = subDays(now, 1)
        break
      case 'Last 7 Days':
        s = subDays(now, 6)
        e = now
        break
      case 'Last 30 Days':
        s = subDays(now, 29)
        e = now
        break
      case 'This Month':
        s = startOfMonth(now)
        e = endOfMonth(now)
        break
      case 'Last Month':
        s = startOfMonth(subMonths(now, 1))
        e = endOfMonth(subMonths(now, 1))
        break
      default:
        break
    }

    if (onSelectRange) {
      onSelectRange({ start: s, end: e })
    }
    handleClosePopover()
  }

  // Custom Range Apply
  const handleApplyCustom = () => {
    if (onSelectRange) {
      onSelectRange({ start: localStart, end: localEnd })
    }
    handleClosePopover()
  }

  // Detect Active Preset
  const getActivePreset = (s_in, e_in) => {
    const s = s_in || start
    const e = e_in || end
    if (!s || !e) return ''
    const now = new Date()

    if (isSameDay(s, now) && isSameDay(e, now)) return 'Today'

    const yest = subDays(now, 1)
    if (isSameDay(s, yest) && isSameDay(e, yest)) return 'Yesterday'

    if (isSameDay(s, subDays(now, 6)) && isSameDay(e, now)) return 'Last 7 Days'

    if (isSameDay(s, subDays(now, 29)) && isSameDay(e, now)) return 'Last 30 Days'

    if (isSameDay(s, startOfMonth(now)) && isSameDay(e, endOfMonth(now))) return 'This Month'

    const lastMonthStart = startOfMonth(subMonths(now, 1))
    const lastMonthEnd = endOfMonth(subMonths(now, 1))
    if (isSameDay(s, lastMonthStart) && isSameDay(e, lastMonthEnd)) return 'Last Month'

    return 'Custom Range'
  }

  const activePreset = getActivePreset()
  const displayStart = start || today
  const displayEnd = end || today

  const displayValue = `${formatDate(displayStart)} - ${formatDate(displayEnd)}`

  return (
    <>
      <Box ref={anchorRef} onClick={handleOpenPopover} sx={{ width: '100%' }}>
        <CustomTextField
          fullWidth
          label={label}
          value={displayValue}
          InputProps={{
            readOnly: true
          }}
          disabled={disabled}
          placeholder='Select Date Range'
          sx={{
            cursor: disabled ? 'not-allowed' : 'pointer',
            '& .MuiInputBase-root': {
              cursor: disabled ? 'not-allowed' : 'pointer'
            },
            '& .MuiInputBase-input': {
              cursor: disabled ? 'not-allowed' : 'pointer'
            }
          }}
        />
      </Box>

      {/* Unified Popover: Sidebar + Conditional Calendar */}
      <Popover
        open={popoverOpen}
        anchorEl={anchorRef.current}
        onClose={handleClosePopover}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left'
        }}
        PaperProps={{
          sx: {
            display: 'flex',
            flexDirection: 'column',
            width: 'auto',
            mt: 1,
            boxShadow: theme => theme.shadows[3]
          }
        }}
      >
        <Box sx={{ display: 'flex' }}>
          {/* Sidebar Presets - Using MenuItem with specific styling from image */}
          <Box sx={{ width: 170, borderRight: showCalendar ? '1px solid rgba(0, 0, 0, 0.12)' : 'none', py: 2 }}>
            {['Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days', 'This Month', 'Last Month'].map(preset => (
              <MenuItem
                key={preset}
                onClick={() => handlePreset(preset)}
                selected={activePreset === preset && !showCalendar}
                sx={{
                  mx: 1.5,
                  my: 0.5,
                  borderRadius: '5px',
                  py: 1.8,
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  color: 'text.secondary',

                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: '#fff',
                    fontWeight: 600
                  },

                  '&:hover': {
                    bgcolor: 'rgba(165, 42, 42, 0.12)'
                  }
                }}
              >
                {preset}
              </MenuItem>
            ))}
            <Divider sx={{ my: 1, mx: 2 }} />
            <MenuItem
              onClick={() => handlePreset('Custom Range')}
              selected={showCalendar}
              sx={theme => ({
                mx: 1.5,
                my: 0.5,
                borderRadius: '5px',
                py: 1.8,
                fontSize: '0.9rem',
                fontWeight: 600,

                // Normal text color
                color: theme.palette.primary.main,

                // 🔥 FORCE override MUI selected blue
                '&.Mui-selected': {
                  backgroundColor: `${theme.palette.primary.main} !important`,
                  color: `${theme.palette.primary.contrastText} !important`
                },

                // Hover
                '&:hover': {
                  backgroundColor: theme.palette.primary.main + '14'
                }
              })}
            >
              Custom Range
            </MenuItem>
          </Box>

          {/* Calendar Area (Visible only when 'Custom Range' is clicked) */}
          {showCalendar && (
            <Box sx={{ p: 2, borderLeft: '1px solid rgba(0, 0, 0, 0.12)' }}>
              <Box sx={{ mb: 1, display: 'flex', gap: 2, justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant='caption' color='text.secondary'>
                  {localStart ? format(localStart, 'dd/MM/yyyy') : ''} -{' '}
                  {localEnd ? format(localEnd, 'dd/MM/yyyy') : ''}
                </Typography>
              </Box>
              <AppReactDatepicker
                selected={localStart}
                startDate={localStart}
                endDate={localEnd}
                selectsRange
                onChange={dates => {
                  const [start, end] = dates
                  setLocalStart(start)
                  setLocalEnd(end)
                }}
                inline
                monthsShown={2}
              />
            </Box>
          )}
        </Box>

        {/* Actions Footer - Only for Custom Range selection */}
        {showCalendar && (
          <>
            <Divider />
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button onClick={handleClosePopover} size='small' color='secondary' variant='outlined'>
                Cancel
              </Button>
              <Button onClick={handleApplyCustom} size='small' variant='contained' disabled={!isCustomRangeValid}>
                Apply
              </Button>
            </Box>
          </>
        )}
      </Popover>
    </>
  )
}

export default PresetDateRangePicker
