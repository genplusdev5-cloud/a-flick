'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useTheme } from '@mui/material/styles'
import FullCalendar from '@fullcalendar/react'

import interactionPlugin from '@fullcalendar/interaction'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'

import resourcePlugin from '@fullcalendar/resource'
import resourceDayGridPlugin from '@fullcalendar/resource-daygrid'
import resourceTimelinePlugin from '@fullcalendar/resource-timeline'
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid'

import { updateSchedule } from '@/api/calendar/schedule/update'
import { listCalendarEvents } from '@/api/calendar'
import { setEvents, filterEvents, selectedEvent, updateEvent } from '@/redux-store/slices/calendar'

import { getEmployeeLunchList, updateEmployeeLunch, addEmployeeLunch } from '@/api/calendar/lunch'

import { showToast } from '@/components/common/Toasts'

/* -------------------------------------------------------------
   HELPERS
------------------------------------------------------------- */

// Convert Date / date-like → 'YYYY-MM-DD'
const toApiDate = value => {
  const d = new Date(value)
  if (isNaN(d)) return null

  return d.toISOString().slice(0, 10)
}

// Convert 12:00:00+05:30 → 12:00
const cleanTime = (t = '') => {
  if (!t) return ''

  const raw = t.split('+')[0].trim() // remove timezone

  // backend expects HH:MM
  return raw.length === 8 ? raw.slice(0, 5) : raw
}

// Extract 'HH:MM' from ISO / date-time string
// '2025-11-27T13:00:00+05:30' → '13:00'
const toApiTime = value => {
  if (!value) return null

  const str = String(value)
  const parts = str.split('T')
  const timeWithZone = parts[1] || parts[0]
  const noZone = timeWithZone.split('+')[0].trim()

  // we only want HH:MM, backend will append :00
  return noZone.slice(0, 5)
}

// For matching DB row which stores 'HH:MM:00'
const toDbTime = hhmm => {
  if (!hhmm) return null
  return hhmm.length === 5 ? `${hhmm}:00` : hhmm
}

// Find existing lunch rows for an employee on a date
const findLunchRows = async (employeeId, date) => {
  try {
    const res = await getEmployeeLunchList({ employee_id: employeeId })
    const rows = res?.data?.results || res?.data?.data?.results || []

    return rows.filter(r => Number(r.employee_id) === Number(employeeId) && r.date === date)
  } catch (err) {
    console.error('findLunchRows error:', err)
    return []
  }
}

/* -------------------------------------------------------------
   MAIN CALENDAR COMPONENT
------------------------------------------------------------- */

const Calendar = ({
  calendarStore,
  calendarApi,
  setCalendarApi,
  dispatch,
  handleAddEventSidebarToggle,
  selectedEmployees = [],
  refreshSignal = 0,
  onRefresh
}) => {
  const calendarRef = useRef()
  const theme = useTheme()

  /* INIT */
  useEffect(() => {
    if (!calendarApi) {
      setCalendarApi(calendarRef.current?.getApi())
    }
  }, [calendarApi, setCalendarApi])

  /* LOAD EVENTS */
  const loadEvents = useCallback(
    async (from_date, to_date) => {
      try {
        if (!selectedEmployees.length) {
          dispatch(setEvents([]))
          calendarRef.current?.getApi()?.removeAllEvents()
          return
        }

        const employee_id = selectedEmployees.map(e => e.id).join(',')
        const res = await listCalendarEvents({ from_date, to_date, employee_id })

        const events = res.data?.data || []

        const api = calendarRef.current?.getApi()

        // NORMALIZE EVERY EVENT BEFORE ADDING
        const normalized = events.map(ev => {
          // Find technician to get their color
          const tech = selectedEmployees.find(e => String(e.id) === String(ev.resourceId))
          
          let color = ev.backgroundColor
          if (!color) {
            if (tech?.color_code && tech.color_code.startsWith('#')) {
              color = tech.color_code
            } else {
              // Fallback color logic matching SidebarLeft
              const name = tech?.name || 'Unknown'
              const colors = [
                '#e57373', '#64b5f6', '#81c784', '#ffb74d', '#ba68c8',
                '#4db6ac', '#9575cd', '#4dd0e1', '#f06292', '#7986cb'
              ]
              const index = ((name.charCodeAt(0) || 0) + name.length) % colors.length
              color = colors[index]
            }
          }

          return {
            id: ev.type === 'ticket' ? `ticket-${ev.ticket_id || ev.id}` : ev.id,
            title: ev.title,
            start: ev.start,
            end: ev.end ?? ev.start,
            backgroundColor: color,
            borderColor: color,
            editable: ev.editable ?? true,
            resourceId: ev.resourceId,
            extendedProps: {
              ...ev,
              type: ev.type,
              ticket_id: ev.ticket_id || ev.id,
              db_id: ev.lunch_id || ev.real_lunch_id || null,
              technician_id: Number(ev.resourceId)
            }
          }
        })

        api?.removeAllEvents()
        api?.addEventSource(normalized)

        dispatch(setEvents(normalized)) // Only THIS one stays
      } catch (err) {
        console.error('Failed to load events', err)
      }
    },
    [dispatch, selectedEmployees]
  )

  /* RELOAD WHEN EMPLOYEE FILTER CHANGES */
  useEffect(() => {
    const api = calendarRef.current?.getApi()
    if (!api) return

    const view = api.view
    const from = toApiDate(view.activeStart)
    const to = toApiDate(view.activeEnd)

    loadEvents(from, to)
  }, [selectedEmployees, loadEvents])

  /* RELOAD ON REFRESH SIGNAL */
  useEffect(() => {
    if (refreshSignal > 0) {
      const api = calendarRef.current?.getApi()
      if (api) {
        const from = toApiDate(api.view.activeStart)
        const to = toApiDate(api.view.activeEnd)
        loadEvents(from, to)
      }
    }
  }, [refreshSignal, loadEvents])

  /* RESOURCES COLUMN */
  const resources = selectedEmployees.map(emp => ({
    id: String(emp.id),
    title: emp.name
  }))

  /* -------------------------------------------------------------
     FULLCALENDAR OPTIONS
  ------------------------------------------------------------- */
  const calendarOptions = {
    plugins: [
      interactionPlugin,
      dayGridPlugin,
      timeGridPlugin,
      listPlugin,
      resourcePlugin,
      resourceDayGridPlugin,
      resourceTimeGridPlugin,
      resourceTimelinePlugin
    ],

    initialView: 'timeGridWeek',
    allDaySlot: false,
    resources,
    resourceAreaWidth: '200px',
    resourceAreaHeaderContent: 'Employees',
    resourceLabelContent: arg => arg.resource.title,

    headerToolbar: {
      left: 'today prev,next',
      center: 'title',
      right: 'resourceTimeGridDay,timeGridWeek,dayGridMonth'
    },

    datesSet(arg) {
      const from = arg.startStr.slice(0, 10)
      const to = arg.endStr.slice(0, 10)
      loadEvents(from, to)
    },

    eventDisplay: 'block', // Force block rendering for Month view boxes
    editable: true,
    events: calendarStore.events || [],

    /* OPEN DRAWER ON CLICK */
    eventClick({ event, jsEvent }) {
      jsEvent.preventDefault()
      dispatch(selectedEvent(event))
      handleAddEventSidebarToggle()
      if (onRefresh) onRefresh()
    },

    /* -------------------------------------------------------------
       DRAG & DROP
    ------------------------------------------------------------- */
    eventDrop: async info => {
      console.log('DROP EVENT RAW:', info.event, info.event.extendedProps)
      try {
        const { event, oldEvent } = info
        const data = event.extendedProps

        // ---------- TICKET ----------
        if (data.type === 'ticket') {
          let ticketId = null

          // 1. EXTENDED PROPS (if exists, good)
          if (data.ticket_id && Number(data.ticket_id)) {
            ticketId = Number(data.ticket_id)
          }

          // 2. FROM event.id = "ticket-73832"
          if (!ticketId && typeof event.id === 'string' && event.id.includes('-')) {
            ticketId = Number(event.id.split('-').pop())
          }

          console.log('🔥 FINAL TICKET ID =', ticketId)

          if (!ticketId) {
            console.error('❌ STILL MISSING TICKET ID', data, event)
            info.revert()
            return
          }

          // 3. GET FROM / TO EMPLOYEE
          const oldResourceId = oldEvent.getResources()[0]?.id
          const newResourceId = event.getResources()[0]?.id

          if (!oldResourceId || !newResourceId) {
            console.error('❌ MISSING RESOURCE ID', { oldResourceId, newResourceId })
            info.revert()
            return
          }

          // 4. API CALL
          await updateSchedule({
            id: ticketId,
            schedule_date: toApiDate(event.start),
            schedule_start_time: toApiTime(event.startStr),
            schedule_end_time: toApiTime(event.endStr),
            from_employee_id: Number(oldResourceId),
            to_employee_id: Number(newResourceId)
          })

          event.setExtendedProp('ticket_id', ticketId)

          showToast('success', 'Ticket updated successfully')
        }

        // ---------- LUNCH ----------
        /* ------------------ LUNCH UPDATE ------------------ */
        if (data.type === 'lunch') {
          const employeeId = Number(event.getResources()[0].id)

          const newDate = event.startStr.slice(0, 10)
          const oldDate = info.oldEvent.startStr.slice(0, 10)

          // 🔥 PREVENT LUNCH DATE CHANGE
          if (newDate !== oldDate) {
            showToast('warning', 'Lunch date cannot be changed')
            info.revert()
            return
          }

          const newStart = cleanTime(event.startStr.split('T')[1])
          const newEnd = cleanTime(event.endStr.split('T')[1])

          const lunchId = data.db_id || null // <-- IMPORTANT: use backend lunch ID

          // After update/create lunch
          if (lunchId) {
            // Update
            await updateEmployeeLunch(lunchId, {
              employee_id: employeeId,
              date: newDate,
              start_time: newStart,
              end_time: newEnd
            })

            // 🔥 CRITICAL FIX → change UI event.id = DB ID
            event.setProp('id', lunchId)
            event.setExtendedProp('db_id', lunchId)

            showToast('success', 'Lunch updated successfully')
          } else {
            // Create
            const res = await addEmployeeLunch({
              employee_id: employeeId,
              date: newDate,
              start_time: newStart,
              end_time: newEnd
            })

            const newId = res.data.id

            // 🔥 CRITICAL FIX → assign REAL DB ID
            event.setProp('id', newId)
            event.setExtendedProp('db_id', newId)

            showToast('success', 'Lunch created successfully')
          }
        }

        // 🔥 KEEP EVENT IN UI
        event.setProp('resourceId', event.getResources()[0].id)

        // 🔥 FORCE RELOAD FROM BACKEND
        const api = calendarRef.current.getApi()
        const view = api.view

        loadEvents(toApiDate(view.activeStart), toApiDate(view.activeEnd))
        if (onRefresh) onRefresh()
      } catch (err) {
        console.error('eventDrop error', err)
        showToast('error', 'Update failed')
      }
    },

    /* -------------------------------------------------------------
       RESIZE
    ------------------------------------------------------------- */
    eventResize: async info => {
      try {
        const { event, prevEvent } = info
        const data = event.extendedProps
        const base = prevEvent || event

        // ---------- TICKET ----------
        // ---------- TICKET ----------
        if (data.type === 'ticket') {
          let ticketId =
            data.ticket_id ||
            (typeof event.id === 'string' && event.id.startsWith('ticket-') ? Number(event.id.split('-')[1]) : null)

          if (!ticketId) {
            console.error('Missing ticket ID', event)
            info.revert()
            return
          }

          await updateSchedule({
            id: ticketId,
            schedule_date: toApiDate(event.start),
            schedule_start_time: toApiTime(event.startStr),
            schedule_end_time: toApiTime(event.endStr),
            from_employee_id: data.technician_id,
            to_employee_id: data.technician_id
          })

          // Only update extendedProps if needed — NEVER change event.id
          event.setExtendedProp('ticket_id', ticketId)

          // Optional: update title/color if needed
          // event.setProp('title', 'New Title') // safe
          // event.setProp('backgroundColor', '#ff9f89') // safe

          showToast('success', 'Ticket updated successfully')
        }
        // ---------- LUNCH ----------
        if (data.type === 'lunch') {
          const employeeId = Number(event.getResources()[0].id)
          const date = toApiDate(base.start)

          const rows = await findLunchRows(employeeId, date)

          const baseStartHHMM = toApiTime(base.startStr)
          const baseStartDB = toDbTime(baseStartHHMM)
          const matched = rows.find(r => r.start_time === baseStartDB)

          const lunchId = matched ? matched.id : 0

          const newStartHHMM = toApiTime(event.startStr)
          const newEndHHMM = toApiTime(event.endStr)

          await updateEmployeeLunch(lunchId, {
            employee_id: employeeId,
            date,
            start_time: newStartHHMM,
            end_time: newEndHHMM
          })

          showToast('success', 'Lunch resized successfully')
        }

        dispatch(updateEvent(event))
        dispatch(filterEvents())
        if (onRefresh) onRefresh()
      } catch (err) {
        console.error('eventResize error', err)
        showToast('error', 'Update failed')
      }
    },

    ref: calendarRef,
    direction: theme.direction
  }

  return <FullCalendar {...calendarOptions} />
}

export default Calendar
