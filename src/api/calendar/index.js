import api from '@/utils/axiosInstance'

export const listCalendarEvents = ({ from_date, to_date, employee_id } = {}) =>
  api.get('calendar/', {
    params: { from_date, to_date, employee_id }
  })
