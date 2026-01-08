import api from '@/utils/axiosInstance'

export const updateTransferIn = async (id, data) => {
  const res = await api.put(`transfer_in-update/?id=${id}`, data)
  return res.data
}
