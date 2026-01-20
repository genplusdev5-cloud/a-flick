'use client'
import Card from '@mui/material/Card'
import AppCalendar from '@/views/apps/calendar/AppCalendar'
import AppFullCalendar from '@/libs/styles/AppFullCalendar'
import { useState } from 'react'
import PermissionGuard from '@/components/auth/PermissionGuard'

const CalendarAppContent = () => {
  const [selectedEmployee, setSelectedEmployee] = useState(null)

  return (
    <Card>
      <AppFullCalendar className='app-calendar'>
        <AppCalendar selectedEmployee={selectedEmployee} setSelectedEmployee={setSelectedEmployee} />
      </AppFullCalendar>
    </Card>
  )
}

export default function CalendarApp() {
  return (
    <PermissionGuard permission="Calendar">
      <CalendarAppContent />
    </PermissionGuard>
  )
}
