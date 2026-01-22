import api from '@/utils/axiosInstance'

export const duplicatePestChemical = async payload => {
  const formData = new FormData()
  formData.append('from_pest', payload.from_pest)
  formData.append('to_pest', payload.to_pest)

  const response = await api.post('/pestchemicals-duplicate/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })

  return response.data
}
