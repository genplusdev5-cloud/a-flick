/**
 * URL-safe Base64 Encoding/Decoding Utilities
 * Used to encode sensitive IDs (numeric or UUID) in URLs for security
 * 
 * Features:
 * - Supports both numeric IDs and UUID strings
 * - URL-safe encoding (no +, /, = characters)
 * - Proper validation and error handling
 * - Redirects to 404 on decode failures
 */

/**
 * Encode an ID (number or UUID string) to URL-safe Base64
 * @param {number|string} id - The ID to encode (can be numeric or UUID)
 * @returns {string} URL-safe Base64 encoded string
 * 
 * @example
 * encodeId(12345) // Returns: "MTIzNDU"
 * encodeId("17141470-9038-450e-9eee-7489d2940b23") // Returns: "MTcxNDE0NzAtOTAzOC00NTBlLTllZWUtNzQ4OWQyOTQwYjIz"
 */
export const encodeId = (id) => {
  if (!id && id !== 0) return ''
  
  try {
    // Convert to string (handles both numbers and UUIDs)
    const idString = String(id).trim()
    
    if (!idString) return ''
    
    // Encode to Base64
    const base64 = btoa(idString)
    
    // Make URL-safe: replace +, /, and remove =
    const urlSafe = base64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
    
    return urlSafe
  } catch (error) {
    console.error('❌ Error encoding ID:', error)
    return ''
  }
}

/**
 * Decode a URL-safe Base64 string back to the original ID
 * @param {string} encodedId - The Base64 encoded ID
 * @returns {string|null} Decoded ID (as string) or null if invalid
 * 
 * @example
 * decodeId("MTIzNDU") // Returns: "12345"
 * decodeId("MTcxNDE0NzAtOTAzOC00NTBlLTllZWUtNzQ4OWQyOTQwYjIz") // Returns: "17141470-9038-450e-9eee-7489d2940b23"
 */
export const decodeId = (encodedId) => {
  if (!encodedId || typeof encodedId !== 'string') return null
  
  try {
    // Restore standard Base64 format
    let base64 = encodedId
      .replace(/-/g, '+')
      .replace(/_/g, '/')
    
    // Add padding if needed (Base64 requires length to be multiple of 4)
    while (base64.length % 4) {
      base64 += '='
    }
    
    // Decode from Base64
    const decoded = atob(base64)
    
    // Return the decoded string (works for both numbers and UUIDs)
    if (!decoded || decoded.trim() === '') {
      console.error('❌ Decoded value is empty')
      return null
    }
    
    return decoded.trim()
  } catch (error) {
    console.error('❌ Error decoding ID:', error)
    return null
  }
}

/**
 * Validate if a string is a valid encoded ID
 * @param {string} encodedId - The encoded ID to validate
 * @returns {boolean} True if valid, false otherwise
 * 
 * @example
 * isValidEncodedId("MTIzNDU") // Returns: true
 * isValidEncodedId("invalid!!!") // Returns: false
 */
export const isValidEncodedId = (encodedId) => {
  const decoded = decodeId(encodedId)
  return decoded !== null && decoded.length > 0
}

/**
 * Check if a decoded ID is a valid UUID format
 * @param {string} id - The ID to check
 * @returns {boolean} True if valid UUID format
 * 
 * @example
 * isUUID("17141470-9038-450e-9eee-7489d2940b23") // Returns: true
 * isUUID("12345") // Returns: false
 */
export const isUUID = (id) => {
  if (!id || typeof id !== 'string') return false
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

/**
 * Check if a decoded ID is a valid numeric ID
 * @param {string} id - The ID to check
 * @returns {boolean} True if valid numeric ID
 * 
 * @example
 * isNumericId("12345") // Returns: true
 * isNumericId("17141470-9038-450e-9eee-7489d2940b23") // Returns: false
 */
export const isNumericId = (id) => {
  if (!id) return false
  
  const num = parseInt(id, 10)
  return !isNaN(num) && num > 0 && String(num) === String(id).trim()
}
