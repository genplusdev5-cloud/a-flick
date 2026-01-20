import api from '@/utils/axiosInstance'

export const getInvoiceSummary = async (filters = {}) => {
  const formData = new FormData()

  Object.keys(filters).forEach(key => {
    if (filters[key] !== null && filters[key] !== '' && filters[key] !== undefined) {
      formData.append(key, filters[key])
    }
  })

  return api.post('invoice-summary/', formData) // 👈 MUST BE POST
}
