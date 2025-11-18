'use client'

// MUI Imports
import Card from '@mui/material/Card'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'
import MuiLinearProgress from '@mui/material/LinearProgress'
import { styled } from '@mui/material/styles'
import Box from '@mui/material/Box'

// Custom Components Imports
import CustomAvatar from '@core/components/mui/Avatar'

const LinearProgress = styled(MuiLinearProgress)(() => ({
  '& .MuiLinearProgress-bar': {
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0
  }
}))

const SalesOverview = () => {
  return (
    <CardContent>
      <div className='flex items-start justify-between gap-3 mb-4'>
        <div className='flex items-center gap-x-[6px]'>
          <CustomAvatar skin='light' color='primary' variant='rounded' size={24}>
            <i className='tabler-shopping-cart text-lg' />
          </CustomAvatar>
          <Typography variant='h5'>Assets Progress Chart</Typography>
        </div>
        <Typography variant='h5'>3/3</Typography>
      </div>

      <div className='flex flex-col gap-1'>
        <div className='flex items-center justify-between'>
          <Typography className='font-medium' color='text.primary'>
            Asset - 100%
          </Typography>
          <a
            href='/assets'
            className='flex items-center text-primary font-medium text-sm gap-1 no-underline hover:underline'
          >
            View all assets
            <i className='tabler-arrow-right text-base' />
          </a>
        </div>
        <LinearProgress variant='determinate' value={100} />
      </div>
    </CardContent>
  )
}

export default SalesOverview
