'use client'

import Card from '@mui/material/Card'
import CalendarWrapper from '@views/apps/calendar/CalendarWrapper'
import AppFullCalendar from '@/libs/styles/AppFullCalendar'

// ✅ Import Vuexy Calendar SCSS for layout + design


const CalendarApp = () => {
  return (
    <Card>
      <AppFullCalendar className='app-calendar'>
        <CalendarWrapper />
      </AppFullCalendar>
    </Card>
  )
}

export default CalendarApp
