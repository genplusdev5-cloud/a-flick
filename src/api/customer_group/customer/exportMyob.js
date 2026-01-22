import api from '@/utils/axiosInstance'

export const exportMyob = async items => {
  const formData = new FormData()

  // items should be: "1587,1588"
  formData.append('items', items)

  const response = await api.post('/export-myob/', formData, {
    responseType: 'blob' // 🔥 FILE RESPONSE
  })

  return response
}
