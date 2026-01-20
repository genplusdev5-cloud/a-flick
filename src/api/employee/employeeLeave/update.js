import api from '@/utils/axiosInstance'

export const updateEmployeeLeave = async payload => {
  const formData = new FormData()
  Object.entries(payload).forEach(([key, value]) => {
    formData.append(key, value ?? '')
  })

  const res = await api.put(`employeeleave-update/?id=${payload.id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })

  return res.data
}
