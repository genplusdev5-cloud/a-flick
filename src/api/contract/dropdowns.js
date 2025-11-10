import api from '@/utils/axiosInstance'

// 1. Customers
export const getCustomers = async () => {
  const res = await api.get('customer-list/')
  return res.data?.data?.results || []
}

// 2. Account Items
export const getAccountList = async () => {
  const res = await api.get('account-list/')
  return res.data?.data?.results || []
}

// 3. Call Types
export const getCallTypeList = async () => {
  const res = await api.get('calltype-list/')
  return res.data?.data?.results || []
}

// 4. Industry List
export const getIndustryList = async () => {
  const res = await api.get('industry-list/')
  return res.data?.data?.results || []
}

// 5. Employees
export const getEmployees = async () => {
  const res = await api.get('employee-list/')
  return res.data?.data?.results || []
}

// 6. Billing Frequency
export const getBillingFrequencyList = async () => {
  const res = await api.get('billingfrequency-list/')
  return res.data?.data?.results || []
}

// 7. Service Frequency
export const getServiceFrequencyList = async () => {
  const res = await api.get('servicefrequency-list/')
  return res.data?.data?.results || []
}

// 8. Pest list
export const getPestList = async () => {
  const res = await api.get('pest-list/')
  return res.data?.data?.results || []
}
