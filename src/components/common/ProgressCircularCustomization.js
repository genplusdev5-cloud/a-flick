// MUI Imports
import { styled } from '@mui/material/styles'
import CircularProgress from '@mui/material/CircularProgress'

// Styled Components
const CircularProgressDeterminate = styled(CircularProgress)(({ theme }) => ({
  color: theme.palette.action.hover // lighter background track
}))

const CircularProgressIndeterminate = styled(CircularProgress)(({ theme }) => ({
  left: 0,
  position: 'absolute',
  animationDuration: '550ms',
  color: theme.palette.primary.main, // ✅ Use theme primary color
  ...theme.applyStyles?.('dark', {
    color: theme.palette.primary.light // lighter tone for dark mode
  })
}))

// Component
const ProgressCircularCustomization = ({ size = 50, thickness = 5 }) => {
  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <CircularProgressDeterminate variant='determinate' size={size} thickness={thickness} value={100} />
      <CircularProgressIndeterminate variant='indeterminate' disableShrink size={size} thickness={thickness} />
    </div>
  )
}

export default ProgressCircularCustomization
