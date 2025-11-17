// file: src/api/contract/dropdowns.js

import api from '@/utils/axiosInstance'

// ======================================================================
// ⭐ UNIVERSAL PAGINATION HANDLER
// ======================================================================
const fetchPaginatedData = async url => {
  let nextUrl = url
  let allResults = []

  while (nextUrl) {
    const res = await api.get(nextUrl)
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
  return await fetchPaginatedData('customer-list/?page_size=200')
}

// ======================================================================
// 2. Call Types
// ======================================================================
export const getCallTypeList = async () => {
  return await fetchPaginatedData('calltype-list/?page_size=200')
}

// ======================================================================
// 3. Industry List
// ======================================================================
export const getIndustryList = async () => {
  return await fetchPaginatedData('industry-list/?page_size=200')
}

// ======================================================================
// 4. Employees
// ======================================================================
export const getEmployees = async () => {
  return await fetchPaginatedData('employee-list/?page_size=200')
}

// ======================================================================
// 5. Billing Frequency
// ======================================================================
export const getBillingFrequencyList = async () => {
  return await fetchPaginatedData('billingfrequency-list/?page_size=200')
}

// ======================================================================
// 6. Service Frequency
// ======================================================================
export const getServiceFrequencyList = async () => {
  return await fetchPaginatedData('servicefrequency-list/?page_size=200')
}

// ======================================================================
// 7. Pest List
// ======================================================================
export const getPestList = async () => {
  return await fetchPaginatedData('pest-list/?page_size=200')
}

// ======================================================================
// 8. Chemicals List
// ======================================================================
export const getChemicalsList = async () => {
  return await fetchPaginatedData('chemicals-list/?page_size=200')
}

// ======================================================================
// ⭐ MASTER FUNCTION — FETCH EVERYTHING (Account List REMOVED)
// ======================================================================
export const getAllDropdowns = async () => {
  try {
    const [
      customers,
      callTypes,
      industries,
      employees,
      billingFreq,
      serviceFreq,
      pests,
      chemicals
    ] = await Promise.all([
      getCustomers(),
      getCallTypeList(),
      getIndustryList(),
      getEmployees(),
      getBillingFrequencyList(),
      getServiceFrequencyList(),
      getPestList(),
      getChemicalsList()
    ])

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
