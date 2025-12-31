'use client'

import { useEffect, useRef } from 'react'
import $ from 'jquery'
import 'bootstrap-daterangepicker/daterangepicker.css'

export default function DateRangePicker({ onChange }) {
  const inputRef = useRef(null)

  useEffect(() => {
    require('bootstrap-daterangepicker')

    const $input = $(inputRef.current)

    $input.daterangepicker(
      {
        autoApply: true,
        opens: 'right',
        locale: {
          format: 'DD/MM/YYYY'
        }
      },
      (start, end) => {
        onChange?.({
          startDate: start.format('YYYY-MM-DD'),
          endDate: end.format('YYYY-MM-DD')
        })
      }
    )

    return () => {
      $input.data('daterangepicker')?.remove()
    }
  }, [onChange])

  return <input ref={inputRef} type='text' className='form-control' placeholder='Select date range' readOnly />
}
