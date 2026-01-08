import api from '@/utils/axiosInstance'

export const deleteTransferInTM = async id => {
  const res = await api.patch(`tm-transfer_in-delete/?id=${id}`)
  return res.data
}

export const deleteTransferInTX = async id => {
  const res = await api.patch(`tx-transfer_in-delete/?id=${id}`)
  return res.data
}
