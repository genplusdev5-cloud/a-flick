import api from '@/utils/axiosInstance'

export const getServiceFrequencyDetails = async id => {
  const { data } = await api.get(`servicefrequency-details/?id=${id}`)
  return data
}
