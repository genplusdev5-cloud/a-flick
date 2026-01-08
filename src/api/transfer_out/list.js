import api from '@/utils/axiosInstance'

export const getTransferOutList = async params => {
  const res = await api.get('transfer_out-list/', { params })
  return res.data
}
