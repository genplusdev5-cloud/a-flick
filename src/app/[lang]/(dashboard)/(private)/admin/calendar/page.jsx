'use client'
import Card from '@mui/material/Card'
import AppCalendar from '@/views/apps/calendar/AppCalendar'
import AppFullCalendar from '@/libs/styles/AppFullCalendar'
import { useState } from 'react'

const CalendarApp = () => {
  const [selectedEmployee, setSelectedEmployee] = useState(null)

  return (
    <Card>
      <AppFullCalendar className='app-calendar'>
        <AppCalendar selectedEmployee={selectedEmployee} setSelectedEmployee={setSelectedEmployee} />
      </AppFullCalendar>
    </Card>
  )
}

export default CalendarApp
