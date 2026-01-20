// src/api/schedule/index.js
import api from '@/utils/axiosInstance'

// Generate + Save schedule (same endpoint does both)
export const generateScheduleApi = payload => {
  return api.post('schedule/', payload).then(res => res.data)
}

// Get existing tickets + contract details
export const getTicketBackendDataApi = params => {
  return api.get('ticket/', { params }).then(res => res.data)
}

// Adjust single day
export const adjustScheduleDayApi = payload => {
  return api.post('schedule-day/', payload).then(res => res.data)
}

// Save final tickets
export const saveTicketsApi = payload => {
  return api.post('ticket-add/', payload).then(res => res.data)
}
