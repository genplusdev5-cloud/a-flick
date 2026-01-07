import api from '@/utils/axiosInstance'

export const deletePurchaseReturn = async ({ id, type = 'tm' }) => {
  const url = type === 'tx' ? 'tx-purchase_return-delete' : 'tm-purchase_return-delete'
  const res = await api.patch(`${url}/?id=${id}`)
  return res.data
}
