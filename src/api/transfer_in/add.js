import api from '@/utils/axiosInstance'

export const addTransferIn = async data => {
  const res = await api.post('transfer_in-add/', data)
  return res.data
}
