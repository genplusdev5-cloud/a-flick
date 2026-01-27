/**
 * Converts a JavaScript Object to FormData.
 * Handles nested objects, arrays, and Files correctly.
 *
 * @param {Object} obj - The object to convert
 * @param {FormData} [form] - Existing FormData instance (optional)
 * @param {String} [namespace] - Key prefix for nested objects (internal use)
 * @returns {FormData}
 */
export const objectToFormData = (obj, form, namespace) => {
  const fd = form || new FormData()
  let formKey

  for (const property in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, property)) {
      if (namespace) {
        formKey = namespace + '[' + property + ']'
      } else {
        formKey = property
      }

      const value = obj[property]

      // If value is a File -> append directly
      if (value instanceof File) {
        fd.append(formKey, value)
      }
      // If value is Array -> append each item (handle nested objects in arrays)
      else if (Array.isArray(value)) {
        value.forEach((element, index) => {
          const nestedKey = `${formKey}[${index}]`
          if (element instanceof File) {
            fd.append(nestedKey, element)
          } else if (typeof element === 'object' && element !== null && !(element instanceof Date)) {
            objectToFormData(element, fd, nestedKey)
          } else if (element instanceof Date) {
            fd.append(nestedKey, element.toISOString())
          } else if (element !== null && element !== undefined) {
            fd.append(nestedKey, element)
          }
        })
      }
      // If value is Date -> toISOString
      else if (value instanceof Date) {
        fd.append(formKey, value.toISOString())
      }
      // If value is Object (and not null/File) -> Recursion
      else if (typeof value === 'object' && value !== null) {
        objectToFormData(value, fd, formKey)
      }
      // Primitive values (string, number, boolean, null)
      else {
        // Only append if not null/undefined to keep it clean (optional preference)
        if (value !== null && value !== undefined) {
          fd.append(formKey, value)
        }
      }
    }
  }

  return fd
}
