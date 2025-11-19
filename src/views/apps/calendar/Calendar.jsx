// React Imports
import { useEffect, useRef } from 'react'

// API
import { listCalendarEvents } from '@/api/calendar'

// MUI Imports
import { useTheme } from '@mui/material/styles'
import 'bootstrap-icons/font/bootstrap-icons.css'
import FullCalendar from '@fullcalendar/react'
import listPlugin from '@fullcalendar/list'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'

// Slice Imports
import { filterEvents, selectedEvent, updateEvent, setEvents } from '@/redux-store/slices/calendar'

// Blank event template
const blankEvent = {
  title: '',
  start: '',
  end: '',
  allDay: false,
  url: '',
  extendedProps: {
    calendar: '',
    guests: [],
    description: ''
  }
}

const Calendar = props => {
  const {
    calendarStore,
    calendarApi,
    setCalendarApi,
    calendarsColor,
    dispatch,
    handleAddEventSidebarToggle,
    handleLeftSidebarToggle,
    selectedEmployee // <-- RECEIVED HERE
  } = props

  // Refs
  const calendarRef = useRef()

  // Hooks
  const theme = useTheme()

  // INITIALIZE fullcalendar api
  useEffect(() => {
    if (calendarApi === null) {
      setCalendarApi(calendarRef.current?.getApi())
    }
  }, [])

  // 🔥 CALL API WHEN EMPLOYEE CHANGES
useEffect(() => {
  if (selectedEmployee) {
    loadEvents()
  }
}, [selectedEmployee])


  const loadEvents = async () => {
    try {
      const from_date = '2025-12-12'
      const to_date = '2026-01-12'

      // ✔ Backend expects num_series
      const employee_id = selectedEmployee?.num_series || ''

      console.log('API CALL:', { from_date, to_date, employee_id })

      const response = await listCalendarEvents({
        from_date,
        to_date,
        employee_id
      })

      const events = response.data?.data || []
      dispatch(setEvents(events))
    } catch (error) {
      console.error('❌ Failed to fetch calendar events:', error)
    }
  }

  // Calendar Options
  const calendarOptions = {
    events: calendarStore.events,
    plugins: [interactionPlugin, dayGridPlugin, timeGridPlugin, listPlugin],
    initialView: 'dayGridMonth',

    headerToolbar: {
      start: 'sidebarToggle, prev, next, title',
      end: 'dayGridMonth,timeGridWeek,timeGridDay,listMonth'
    },

    views: {
      week: {
        titleFormat: { year: 'numeric', month: 'short', day: 'numeric' }
      }
    },

    editable: true,
    eventResizableFromStart: true,
    dragScroll: true,
    dayMaxEvents: 2,
    navLinks: true,

    eventClassNames({ event: calendarEvent }) {
      const colorName = calendarsColor[calendarEvent._def.extendedProps.calendar]
      return [`event-bg-${colorName}`]
    },

    eventClick({ event: clickedEvent, jsEvent }) {
      jsEvent.preventDefault()
      dispatch(selectedEvent(clickedEvent))
      handleAddEventSidebarToggle()

      if (clickedEvent.url) {
        window.open(clickedEvent.url, '_blank')
      }
    },

    customButtons: {
      sidebarToggle: {
        icon: 'tabler tabler-menu-2',
        click() {
          handleLeftSidebarToggle()
        }
      }
    },

    dateClick(info) {
      const ev = { ...blankEvent }
      ev.start = info.date
      ev.end = info.date
      ev.allDay = true
      dispatch(selectedEvent(ev))
      handleAddEventSidebarToggle()
    },

    eventDrop({ event: droppedEvent }) {
      dispatch(updateEvent(droppedEvent))
      dispatch(filterEvents())
    },

    eventResize({ event: resizedEvent }) {
      dispatch(updateEvent(resizedEvent))
      dispatch(filterEvents())
    },

    ref: calendarRef,
    direction: theme.direction
  }

  return <FullCalendar {...calendarOptions} />
}

export default Calendar
