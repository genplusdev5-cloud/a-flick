'use client'

import { useState, useRef } from 'react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
dayjs.extend(relativeTime)

// MUI
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import { styled } from '@mui/material/styles'

// Timeline
import MuiTimeline from '@mui/lab/Timeline'
import TimelineItem from '@mui/lab/TimelineItem'
import TimelineSeparator from '@mui/lab/TimelineSeparator'
import TimelineDot from '@mui/lab/TimelineDot'
import TimelineConnector from '@mui/lab/TimelineConnector'
import TimelineContent from '@mui/lab/TimelineContent'

// Date Picker
import { LocalizationProvider } from '@mui/x-date-pickers'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'

const Timeline = styled(MuiTimeline)(() => ({
  padding: 0,
  margin: 0,
  '& .MuiTimelineItem-root': {
    width: '100%',
    minHeight: '26px',
    marginBottom: '12px',
    '&:before': { display: 'none' }
  },
  '& .MuiTimelineSeparator-root': { padding: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' },
  '& .MuiTimelineDot-root': { width: 10, height: 10 },
  '& .MuiTimelineConnector-root': { width: '2px', backgroundColor: '#D1D5DB', flexGrow: 1 },
  '& .MuiTimelineContent-root': { padding: 0, display: 'flex', alignItems: 'center' }
}))

// ---------------- COMPONENT ----------------
const UserActivityTimeLine = () => {
  const [open1, setOpen1] = useState(false)
  const [open2, setOpen2] = useState(false)

  const [date1, setDate1] = useState(dayjs())
  const [date2, setDate2] = useState(dayjs().add(4, 'day'))

  const anchorRef1 = useRef(null)
  const anchorRef2 = useRef(null)

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <CardContent className='pt-1 pb-0'>
        <div className='flex items-center justify-between w-full gap-6'>
          {/* PROJECT NAME */}
          {/* <div className="flex items-center gap-2">
      <Typography variant="h6" className="font-semibold">
        Project: Time Line
      </Typography>
    </div> */}

          {/* START DATE */}
          <div className='flex items-center gap-3'>
            {/* Green Dot */}
            <span className='w-3 h-3 rounded-full bg-green-500'></span>

            {/* Start Date + Time */}
            <div className='flex items-center gap-2'>
              <Typography
                ref={anchorRef1}
                variant='body2'
                className='font-medium cursor-pointer'
                onClick={() => setOpen1(true)}
              >
                Start Date: {date1.format('DD MMM YYYY')}
              </Typography>

              {/* <Typography variant='h6' color='text.secondary'>
                {date1.format('hh:mm A')}
              </Typography> */}

              <DatePicker
                value={date1}
                onChange={newValue => setDate1(newValue)}
                open={open1}
                onClose={() => setOpen1(false)}
                format='DD MMM YYYY'
                slotProps={{
                  textField: { sx: { display: 'none' } },
                  popper: {
                    anchorEl: anchorRef1.current,
                    placement: 'bottom-start',
                    disablePortal: false,
                    sx: { zIndex: 2000 }
                  }
                }}
              />
            </div>
          </div>

          {/* END DATE */}
          <div className='flex items-center gap-3'>
            {/* Blue Dot */}
            <span className='w-3 h-3 rounded-full bg-primary'></span>

            {/* End Date + Time */}
            <div className='flex items-center gap-2'>
              <Typography
                ref={anchorRef2}
                variant='body2'
                className='font-medium cursor-pointer'
                onClick={() => setOpen2(true)}
              >
                End Date: {date2.format('DD MMM YYYY')}
              </Typography>

              {/* <Typography variant='h6' color='text.secondary'>
                {date2.format('hh:mm A')}
              </Typography> */}

              <Typography variant='caption' color='text.disabled'>
                {date2.fromNow()}
              </Typography>

              <DatePicker
                value={date2}
                onChange={newValue => setDate2(newValue)}
                open={open2}
                onClose={() => setOpen2(false)}
                format='DD MMM YYYY'
                slotProps={{
                  textField: { sx: { display: 'none' } },
                  popper: {
                    anchorEl: anchorRef2.current,
                    placement: 'bottom-start',
                    disablePortal: false,
                    sx: { zIndex: 2000 }
                  }
                }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </LocalizationProvider>
  )
}

export default UserActivityTimeLine
