// src/api/attendance/details.js

import api from '@/utils/axiosInstance'

export const getAttendanceDetails = async id => {
  const res = await api.get(`attendance-details/?id=${id}`)
  return res.data
}
export const getAttendanceById = getAttendanceDetails   // alias
