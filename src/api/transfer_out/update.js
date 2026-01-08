import api from '@/utils/axiosInstance'

export const updateTransferOut = async (id, payload) => {
  const res = await api.put(`transfer_out-update/?id=${id}`, payload)
  return res.data
}
