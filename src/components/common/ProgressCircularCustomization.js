// MUI Imports
import { styled } from '@mui/material/styles'
import CircularProgress from '@mui/material/CircularProgress'
import { Box, Typography } from '@mui/material'

// Styled Components
const CircularProgressDeterminate = styled(CircularProgress)(({ theme }) => ({
  color: theme.palette.action.hover
}))

const CircularProgressIndeterminate = styled(CircularProgress)(({ theme }) => ({
  left: 0,
  position: 'absolute',
  animationDuration: '550ms',
  color: theme.palette.primary.main,
  ...theme.applyStyles?.('dark', {
    color: theme.palette.primary.light
  })
}))

// ✅ Common Component
const ProgressCircularCustomization = ({
  size = 50,
  thickness = 5,
  label = 'Loading...' // 👈 NEW
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1.5
      }}
    >
      {/* Circle */}
      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
        <CircularProgressDeterminate
          variant='determinate'
          size={size}
          thickness={thickness}
          value={100}
        />
        <CircularProgressIndeterminate
          variant='indeterminate'
          disableShrink
          size={size}
          thickness={thickness}
        />
      </Box>

      {/* 👇 Text below loader */}
      {label && (
        <Typography
          variant='body2'
          fontWeight={600}
          color='primary'
          textAlign='center'
        >
          {label}
        </Typography>
      )}
    </Box>
  )
}

export default ProgressCircularCustomization
