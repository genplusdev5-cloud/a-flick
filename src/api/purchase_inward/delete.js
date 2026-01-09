import api from '@/utils/axiosInstance'

export const deletePurchaseInward = async ({ id, type = 'tm' }) => {
  const url = type === 'tx' ? 'tx-purchase_inward-delete' : 'tm-purchase_inward-delete'

  // ❌ remove "/" before ?
  const res = await api.patch(`${url}/?id=${id}`)
  return res.data
}
