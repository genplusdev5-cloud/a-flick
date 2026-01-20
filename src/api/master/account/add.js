import api from '@/utils/axiosInstance'

export const addAccount = async payload => {
  const body = {
    name: payload.name,
    item_number: payload.itemNumber,
    description: payload.description || '',
    status: payload.status === 'Active' ? 1 : 0
  }

  const { data } = await api.post('account-add/', body)
  return data
}
