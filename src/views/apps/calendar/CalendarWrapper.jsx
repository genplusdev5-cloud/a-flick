'use client'

import { useCallback, useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import Card from '@mui/material/Card'
import AppFullCalendar from '@/libs/styles/AppFullCalendar'
import AppCalendar from './AppCalendar'
import { listCalendarEvents } from '@/api/calendar'
import { setEvents } from '@/redux-store/slices/calendar'

const CalendarWrapper = ({ selectedEmployee }) => {
  const dispatch = useDispatch()
  const [calendarApi, setCalendarApi] = useState(null)

  // Map backend event → FullCalendar event (with extendedProps)
  const mapEvent = ev => {
    const isTicket = ev.type === 'ticket'

    // Backend ALWAYS gives numeric ticket_id or id
    const realTicketId = ev.ticket_id || ev.id

    return {
      id: isTicket ? `ticket-${realTicketId}` : ev.id, // 🔥 STRING ID FOR TICKET
      title: ev.title,
      start: ev.start,
      end: ev.end ?? ev.start,
      backgroundColor: ev.backgroundColor,
      borderColor: ev.borderColor,
      editable: ev.editable ?? true,
      resourceId: ev.resourceId,

      extendedProps: {
        type: ev.type,

        // Ticket real DB ID
        ticket_id: realTicketId, // 🔥 NUMERIC

        // Lunch
        db_id: ev.lunch_id || ev.real_lunch_id || null,

        technician_id: Number(ev.resourceId),

        ...ev
      }
    }
  }

  const fetchEvents = useCallback(
    async (from_date, to_date) => {
      try {
        const resp = await listCalendarEvents({
          from_date,
          to_date,
          employee_id: selectedEmployee?.id ?? null
        })

        const raw = resp?.data?.data || []
        const mapped = raw.map(mapEvent)

        dispatch(setEvents(mapped))
      } catch (err) {
        console.error('Calendar fetch error:', err)
      }
    },
    [dispatch, selectedEmployee]
  )

  useEffect(() => {
    if (!calendarApi) return

    const view = calendarApi.view
    const fromDate = view.activeStart.toISOString().slice(0, 10)
    const toDate = view.activeEnd.toISOString().slice(0, 10)

    fetchEvents(fromDate, toDate)

    const handle = arg => {
      const from = arg.view.activeStart.toISOString().slice(0, 10)
      const to = arg.view.activeEnd.toISOString().slice(0, 10)
      fetchEvents(from, to)
    }

    calendarApi.on('datesSet', handle)
    return () => calendarApi.off('datesSet', handle)
  }, [calendarApi, selectedEmployee, fetchEvents])

  return (
    <Card>
      <AppFullCalendar className='app-calendar'>
        <AppCalendar calendarApi={calendarApi} setCalendarApi={setCalendarApi} />
      </AppFullCalendar>
    </Card>
  )
}

export default CalendarWrapper
