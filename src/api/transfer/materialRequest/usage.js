import api from '@/utils/axiosInstance'

const getMaterialUsage = () => {
  return api.get('/material-usage/')
}

export default getMaterialUsage
