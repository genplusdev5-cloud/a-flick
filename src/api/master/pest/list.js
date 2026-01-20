import api from '@/utils/axiosInstance'

export const getPestList = async (params = {}) => {
  return await api.get('pest-list/', { params })
}
