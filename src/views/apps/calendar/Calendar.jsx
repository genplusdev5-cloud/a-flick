'use client'

import { useEffect, useRef } from 'react'
import { listCalendarEvents } from '@/api/calendar'
import { useTheme } from '@mui/material/styles'
import FullCalendar from '@fullcalendar/react'
import listPlugin from '@fullcalendar/list'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'

import { filterEvents, selectedEvent, updateEvent, setEvents } from '@/redux-store/slices/calendar'

import resourcePlugin from '@fullcalendar/resource'
import resourceDayGridPlugin from '@fullcalendar/resource-daygrid'
import resourceTimelinePlugin from '@fullcalendar/resource-timeline'
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid'

const Calendar = props => {
  const {
    calendarStore,
    calendarApi,
    setCalendarApi,
    calendarsColor,
    dispatch,
    handleAddEventSidebarToggle,
    handleLeftSidebarToggle,
    selectedEmployees = []
  } = props

  const calendarRef = useRef()
  const theme = useTheme()

  useEffect(() => {
    if (!calendarApi) {
      setCalendarApi(calendarRef.current?.getApi())
    }
  }, [])

  useEffect(() => {
    if (Array.isArray(selectedEmployees) && selectedEmployees.length > 0) {
      loadEvents()
    } else {
      dispatch(setEvents([]))
      const api = calendarRef.current?.getApi?.()
      api?.removeAllEvents?.()
      api?.refetchEvents?.()
    }
  }, [selectedEmployees])

  const loadEvents = async () => {
    try {
      const from_date = '2025-11-01'
      const to_date = '2026-01-12'

      const employee_id = selectedEmployees.map(e => e.id).join(',')

      const res = await listCalendarEvents({
        from_date,
        to_date,
        employee_id
      })

      let events = res.data?.data || []

      events = events.map(ev => ({
        ...ev,
        start: ev.start?.includes('T') ? ev.start : ev.start + 'T00:00:00',
        end: ev.end?.includes('T') ? ev.end : ev.end + 'T00:00:00'
      }))

      dispatch(setEvents(events))

      const api = calendarRef.current?.getApi()
      if (api) {
        api.removeAllEvents()
        api.addEventSource(events)
      }
    } catch (err) {
      console.error('Failed to load calendar events', err)
    }
  }

  // -----------------------------
  // RESOURCES (EMPLOYEES LIST)
  // -----------------------------
  const resources = selectedEmployees.map(emp => ({
    id: String(emp.id),
    title: emp.name
  }))

  // -----------------------------
  // FULLCALENDAR OPTIONS
  // -----------------------------
  const calendarOptions = {
    events: calendarStore.events ? [...calendarStore.events] : [],

    plugins: [
      interactionPlugin,
      dayGridPlugin,
      timeGridPlugin,
      listPlugin,
      resourcePlugin,
      resourceDayGridPlugin,
      resourceTimeGridPlugin,
      resourceTimelinePlugin // ← THIS WAS MISSING!
    ],

    // -----------------------------
    // MAIN FIX → SHOW EMPLOYEES ON LEFT
    // -----------------------------
    resources: resources,
    resourceAreaWidth: '200px',
    resourceAreaHeaderContent: 'Employees',
    resourceLabelContent: arg => arg.resource.title,

    headerToolbar: {
      left: 'today prev,next',
      center: 'title',
      right: 'resourceTimeGridDay,resourceTimelineThreeDay,timeGridWeek,dayGridMonth'
    },

    views: {
      resourceTimeGridDay: {
        type: 'resourceTimeGrid',
        buttonText: 'Day'
      },
      resourceTimelineThreeDay: {
        type: 'resourceTimeline',
        duration: { days: 3 },
        buttonText: '3 Days'
      }
    },

    editable: true,

    eventDidMount(info) {
      const bg = info.event.extendedProps?.backgroundColor || info.event.backgroundColor
      const border = info.event.extendedProps?.borderColor || info.event.borderColor
      if (bg) info.el.style.backgroundColor = bg
      if (border) info.el.style.border = `1px solid ${border}`
      info.el.style.borderRadius = '6px'
      info.el.style.padding = '2px 6px'
    },

    eventClassNames({ event }) {
      const calendarType = event._def.extendedProps?.calendar || event._def.extendedProps?.type
      const colorName = calendarsColor[calendarType] || 'info'
      return [`event-bg-${colorName}`]
    },

    eventClick({ event: clickedEvent, jsEvent }) {
      jsEvent?.preventDefault?.()
      dispatch(selectedEvent(clickedEvent))
      handleAddEventSidebarToggle()
    },

    customButtons: {
      sidebarToggle: {
        icon: 'tabler tabler-menu-2',
        click() {
          handleLeftSidebarToggle()
        }
      }
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
