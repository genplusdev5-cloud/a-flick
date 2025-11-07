import api from '@/utils/axiosInstance'

export const getServiceFrequencyList = async () => {
  const { data } = await api.get('servicefrequency-list/')
  return data
}
