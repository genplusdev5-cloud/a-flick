import api from '@/utils/axiosInstance'

// ✅ Correct plural endpoint
export const getEmployeeLeaveDetails = async id => {
  const res = await api.get(`employeeleave-details/?id=${id}`)
  return res.data
}
