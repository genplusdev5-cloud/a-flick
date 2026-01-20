import api from '@/utils/axiosInstance'

// MAIN CALENDAR EVENTS
export const listCalendarEvents = ({ from_date, to_date, employee_id } = {}) =>
  api.get('calendar/', {
    params: { from_date, to_date, employee_id }
  })

// SUB-MODULES
export * from './schedule'
export * from './lunch'
