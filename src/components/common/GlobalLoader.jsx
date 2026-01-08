'use client'

import { useSelector } from 'react-redux'
import { Box } from '@mui/material'
import ProgressCircularCustomization from '@/components/common/ProgressCircularCustomization'

const GlobalLoader = () => {
  const loadingCount = useSelector(state => state.loadingReducer.loadingCount)

  if (loadingCount === 0) return null

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999, // Highest possible z-index
        transition: 'all 0.3s ease-in-out'
      }}
    >
      <ProgressCircularCustomization size={60} thickness={5} label="Processing..." />
    </Box>
  )
}

export default GlobalLoader
