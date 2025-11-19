import { createSlice } from '@reduxjs/toolkit'
import { events } from '@/fake-db/apps/calendar'

const initialState = {
  events: [],
  filteredEvents: [],
  selectedEvent: null,
  selectedCalendars: ['Personal', 'Business', 'Family', 'Holiday', 'ETC']
}

const filterEventsUsingCheckbox = (events, selectedCalendars) => {
  return events.filter(event => {
    const cal = event.extendedProps?.calendar || event.extendedProps?.type
    return selectedCalendars.includes(cal)
  })
}

export const calendarSlice = createSlice({
  name: 'calendar',
  initialState,
  reducers: {
    setEvents: (state, action) => {
      state.events = action.payload
      state.filteredEvents = action.payload
    },

    filterEvents: state => {
      state.filteredEvents = state.events
    },

    addEvent: (state, action) => {
      const newEvent = {
        ...action.payload,
        id: `${parseInt(state.events[state.events.length - 1]?.id ?? '') + 1}`
      }
      state.events.push(newEvent)
    },

    updateEvent: (state, action) => {
      state.events = state.events.map(event => {
        if (action.payload._def && event.id === action.payload._def.publicId) {
          return {
            id: event.id,
            url: action.payload._def.url,
            title: action.payload._def.title,
            allDay: action.payload._def.allDay,
            end: action.payload._instance.range.end,
            start: action.payload._instance.range.start,
            extendedProps: action.payload._def.extendedProps
          }
        } else if (event.id === action.payload.id) {
          return action.payload
        } else {
          return event
        }
      })
    },

    deleteEvent: (state, action) => {
      state.events = state.events.filter(event => event.id !== action.payload)
    },

    selectedEvent: (state, action) => {
      state.selectedEvent = action.payload
    },

    filterCalendarLabel: (state, action) => {
      const idx = state.selectedCalendars.indexOf(action.payload)
      if (idx !== -1) {
        state.selectedCalendars.splice(idx, 1)
      } else {
        state.selectedCalendars.push(action.payload)
      }
      state.events = filterEventsUsingCheckbox(state.filteredEvents, state.selectedCalendars)
    },

    filterAllCalendarLabels: (state, action) => {
      state.selectedCalendars = action.payload ? ['Personal', 'Business', 'Family', 'Holiday', 'ETC'] : []
      state.events = filterEventsUsingCheckbox(state.filteredEvents, state.selectedCalendars)
    }
  }
})

export const {
  setEvents,
  filterEvents,
  addEvent,
  updateEvent,
  deleteEvent,
  selectedEvent,
  filterCalendarLabel,
  filterAllCalendarLabels
} = calendarSlice.actions

export default calendarSlice.reducer
