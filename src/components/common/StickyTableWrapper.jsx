'use client'

import React from 'react'
import classnames from 'classnames'
import styles from '@core/styles/table.module.css'

/**
 * StickyTableWrapper
 * A reusable wrapper for tables that provides:
 * 1. Horizontal scrolling for many columns
 * 2. Vertical scrolling if more than 10 rows
 * 3. Sticky header support (when used with styles.table)
 * 
 * @param {React.ReactNode} children - The <table> element
 * @param {number} rowCount - Current number of rows to determine vertical scroll
 */
const StickyTableWrapper = ({ children, rowCount = 0 }) => {
  return (
    <div
      className={classnames(styles.table_wrapper, {
        [styles.table_scroll_10]: rowCount >= 10
      })}
    >
      {children}
    </div>
  )
}

export default StickyTableWrapper
