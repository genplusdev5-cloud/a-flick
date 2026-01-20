// src/api/attendance/dropdowns.js
import api from '@/utils/axiosInstance'

export const getAttendanceDropdowns = async () => {
  const response = await api.get('/attendance/') // THIS IS YOUR REAL ENDPOINT
  return response.data
}
