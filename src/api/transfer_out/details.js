import api from '@/utils/axiosInstance'

// TM details
export const getTmTransferOutDetails = async id => {
  const res = await api.get('tm-transfer_out-details', {
    params: { id }
  })
  return res.data
}

// TX details
export const getTxTransferOutDetails = async id => {
  const res = await api.get('tx-transfer_out-details', {
    params: { id }
  })
  return res.data
}
