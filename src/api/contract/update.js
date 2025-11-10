import api from '@/utils/axiosInstance'

export const updateContract = async (id, payload) => {
  const res = await api.put(`contract-update/?id=${id}`, payload)
  return res.data
}
