import api from '@/utils/axiosInstance'

export const getOpeningStock = params => {
  return api.get('opening-stock/', { params })
}

export const exportOpeningStockTemplate = () => {
  return api.get('opening-stock/', { responseType: 'blob' })
}

export const importOpeningStock = formData => {
  return api.post('opening-stock/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}
