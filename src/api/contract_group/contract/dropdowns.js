// src/api/contract/dropdowns.js
import api from '@/utils/axiosInstance'
import { getCompanyList } from '@/api/master/company/getCompanyList'
import { getCustomerNamesForList } from '@/api/contract_group/contract/listDropdowns'

export const getAllDropdowns = async () => {
  try {
    const [contractRes, companiesRes, customersRes] = await Promise.all([
      api.get('/contract/').catch(err => {
        console.error('Contract API failed', err)
        return null
      }),
      getCompanyList().catch(err => {
        console.error('Company List API failed', err)
        return []
      }),
      getCustomerNamesForList().catch(err => {
        console.error('Customer List API failed', err)
        return []
      })
    ])

    const raw = contractRes?.data?.data?.data || contractRes?.data?.data || {}

    const unwrap = (res, fallbackList) => {
      let items = []
      // 1. Array directly
      if (Array.isArray(res)) {
        items = res
      }
      // 2. Axios Response or standard JSON structure
      else if (res?.data) {
        const d = res.data
        if (Array.isArray(d)) items = d
        else if (Array.isArray(d.data)) items = d.data
        else if (Array.isArray(d.results)) items = d.results
        else if (d.data?.results && Array.isArray(d.data.results)) items = d.data.results
        else if (d.data?.data && Array.isArray(d.data.data)) items = d.data.data
      }
      // 3. Direct results field
      else if (res?.results && Array.isArray(res.results)) {
        items = res.results
      }

      // 4. Fallback if still empty
      if (items.length === 0 && fallbackList) {
        if (Array.isArray(fallbackList)) items = fallbackList
        else if (fallbackList.name && Array.isArray(fallbackList.name)) items = fallbackList.name
        else if (fallbackList.data && Array.isArray(fallbackList.data)) items = fallbackList.data
      }

      // 5. Final Mapping - ensure label/value AND id/name for all consumers
      return items.map(item => {
        if (typeof item !== 'object') return { label: String(item), value: item, id: item, name: String(item) }
        const label = (
          item.label ||
          item.name ||
          item.frequency_code ||
          item.pest_name ||
          item.chemical_name ||
          item.company_name ||
          item.customer_name ||
          ''
        ).trim()
        const value = item.value || item.id || item
        return { label, value, id: value, name: label }
      })
    }

    const companies = unwrap(companiesRes, raw.company)
    const customers = unwrap(customersRes, raw.customer)

    return {
      companies,
      customers,
      callTypes: unwrap(null, raw.calltype),
      billingFreq: unwrap(null, raw.billing_frequency),
      serviceFreq: unwrap(null, raw.service_frequency),
      pests: unwrap(null, raw.pest),
      chemicals: unwrap(null, raw.chemicals || raw.chemical || raw.chemical_master),
      industries: unwrap(null, raw.industry),
      salesPeople: unwrap(null, raw.sales),
      supervisors: unwrap(null, raw.supervisor),
      technicians: unwrap(null, raw.technician),
      employees: []
    }
  } catch (err) {
    console.error('Dropdown API Error:', err)
    return {
      companies: [],
      customers: [],
      callTypes: [],
      billingFreq: [],
      serviceFreq: [],
      pests: [],
      chemicals: [],
      industries: [],
      salesPeople: [],
      supervisors: [],
      technicians: [],
      employees: []
    }
  }
}
