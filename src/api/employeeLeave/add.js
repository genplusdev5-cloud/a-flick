import api from '@/utils/axiosInstance'

export const addEmployeeLeave = async payload => {
  const formData = new FormData()
  Object.entries(payload).forEach(([key, value]) => {
    formData.append(key, value ?? '')
  })

  const res = await api.post('employeeleave-add/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })

  return res.data
}
