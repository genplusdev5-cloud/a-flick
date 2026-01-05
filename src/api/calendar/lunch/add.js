import api from '@/utils/axiosInstance'

export const addEmployeeLunch = async data => {
  const form = new FormData()
  Object.entries(data).forEach(([k, v]) => form.append(k, v))

  const res = await api.post('employeelunch-add/', form)
  return res.data
}
