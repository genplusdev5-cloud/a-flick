import api from '@/utils/axiosInstance'

// TM delete
export const deleteTmTransferOut = async id => {
  const res = await api.patch(`tm-transfer_out-delete/?id=${id}`)
  return res.data
}

// TX delete
export const deleteTxTransferOut = async id => {
  const res = await api.patch(`tx-transfer_out-delete/?id=${id}`)
  return res.data
}
