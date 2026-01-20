import api from '@/utils/axiosInstance'

export const updateProposal = async (id, payload) => {
  const res = await api.put(`/proposal-update/?id=${id}`, payload)
  return res.data
}
