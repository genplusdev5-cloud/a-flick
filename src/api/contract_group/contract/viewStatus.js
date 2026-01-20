import api from '@/utils/axiosInstance'

// GET Contract View Status
export const getContractView = async (params = {}) => {
  const res = await api.get('contract-view/', { params })
  return res.data   // returns { message, status, count, data }
}
