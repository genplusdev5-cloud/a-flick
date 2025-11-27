import api from '@/utils/axiosInstance'

export const getAttendanceList = async (page = 1, pageSize = 50, search = '') => {
  const res = await api.get(
    `attendance-list/?page=${page}&page_size=${pageSize}&search=${search}`
  )
  return res.data
}
