// src/api/attendance/details.js

import api from '@/utils/axiosInstance'

export const getAttendanceDetails = async id => {
  const res = await api.get(`attendance-details/?id=${id}`)
  return res.data
}

// ADD THIS LINE — Edit page இதை expect பண்ணுது!
export const getAttendanceById = getAttendanceDetails   // alias
