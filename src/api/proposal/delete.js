import api from '@/utils/axiosInstance'

export const deleteProposal = async id => {
  const res = await api.patch(`/proposal-delete/?id=${id}`)
  return res.data
}
