import api from '@/utils/axiosInstance'

// 🔥 Automatically include company + branch for all requests
const params = {
  page_size: 200,
  company: typeof window !== 'undefined' ? localStorage.getItem('company') : '',
  branch: typeof window !== 'undefined' ? localStorage.getItem('branch') : ''
}

// ======================================================================
// ⭐ UNIVERSAL PAGINATION HANDLER (With company/branch params)
// ======================================================================
const fetchPaginatedData = async url => {
  let nextUrl = url
  let allResults = []

  while (nextUrl) {
    const res = await api.get(nextUrl, { params })
    const data = res.data?.data || res.data

    allResults = [...allResults, ...(data.results || [])]

    nextUrl = data.next || null
  }

  return allResults
}

// ======================================================================
// 1. Customers
// ======================================================================
export const getCustomers = async () => {
  return await fetchPaginatedData('customer-list/')
}

// ======================================================================
// 2. Call Types
// ======================================================================
export const getCallTypeList = async () => {
  return await fetchPaginatedData('calltype-list/')
}

// ======================================================================
// 3. Industry List
// ======================================================================
export const getIndustryList = async () => {
  return await fetchPaginatedData('industry-list/')
}

// ======================================================================
// 4. Employees
// ======================================================================
export const getEmployees = async () => {
  return await fetchPaginatedData('employee-list/')
}

// ======================================================================
// 5. Billing Frequency
// ======================================================================
export const getBillingFrequencyList = async () => {
  return await fetchPaginatedData('billingfrequency-list/')
}

// ======================================================================
// 6. Service Frequency
// ======================================================================
export const getServiceFrequencyList = async () => {
  return await fetchPaginatedData('servicefrequency-list/')
}

// ======================================================================
// 7. Pest List
// ======================================================================
export const getPestList = async () => {
  return await fetchPaginatedData('pest-list/')
}

// ======================================================================
// 8. Chemicals List
// ======================================================================
export const getChemicalsList = async () => {
  return await fetchPaginatedData('chemicals-list/')
}

// ======================================================================
// ⭐ MASTER FUNCTION — FETCH EVERYTHING
// ======================================================================
export const getAllDropdowns = async () => {
  try {
    const [customers, callTypes, industries, employees, billingFreq, serviceFreq, pests, chemicals] = await Promise.all(
      [
        getCustomers(),
        getCallTypeList(),
        getIndustryList(),
        getEmployees(),
        getBillingFrequencyList(),
        getServiceFrequencyList(),
        getPestList(),
        getChemicalsList()
      ]
    )

    return {
      customers,
      callTypes,
      industries,
      employees,
      billingFreq,
      serviceFreq,
      pests,
      chemicals
    }
  } catch (err) {
    console.error('❌ getAllDropdowns Error:', err)
    throw err
  }
}
