import api from '@/utils/axiosInstance'

export const deletePurchaseOrder = async ({ id, type = 'tm' }) => {
  if (!id) throw new Error('ID is required')

  const url = type === 'tx' ? 'tx-purchase_order-delete/' : 'tm-purchase_order-delete/'

  const res = await api.patch(
    url,
    {}, // empty body (required)
    {
      params: { id } // ?id=123
    }
  )

  return res.data
}
