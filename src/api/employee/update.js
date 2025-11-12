import api from '@/utils/axiosInstance'

export const updateEmployee = async payload => {
  const id = payload.get('id')       // get id from FormData

  const response = await api.put(`employee-update/?id=${id}`, payload)
  return response.data
}

