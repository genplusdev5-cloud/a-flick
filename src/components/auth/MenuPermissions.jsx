'use client'

import React, { Children, cloneElement } from 'react'
import { SubMenu } from '@menu/vertical-menu'
import { usePermission } from '@/hooks/usePermission'

/**
 * PermissionItem
 * Wraps MenuItem and hides it if user doesn't have required permission.
 * Uses cloneElement to pass down props (like 'level') from SubMenu.
 */
export const PermissionItem = ({ module, action = 'view', children, ...rest }) => {
  const { canAccess } = usePermission()

  if (!canAccess(module, action)) return null

  // If children is a single React element, clone it and pass rest props (including level from parent)
  if (React.isValidElement(children)) {
    return cloneElement(children, { ...rest })
  }

  return children
}

/**
 * PermissionSubMenu
 * Wraps SubMenu and hides it if NONE of its children are permitted.
 * Can take an explicit 'modules' array or attempt to detect from PermissionItem children.
 */
export const PermissionSubMenu = ({ label, icon, modules = [], children, ...rest }) => {
  const { canAccess } = usePermission()

  // 1. Check explicit modules list if provided
  if (modules.length > 0) {
    const hasAccess = modules.some(m => canAccess(m, 'view'))
    if (!hasAccess) return null
  } else {
    // 2. Otherwise, check children to see if at least one PermissionItem is permitted
    const childList = Children.toArray(children)
    const hasPermittedChild = childList.some(child => {
      if (child.type === PermissionItem) {
        return canAccess(child.props.module, child.props.action || 'view')
      }
      // If it's a direct MenuItem or other, we assume it's always permitted or handled elsewhere
      return true 
    })

    if (!hasPermittedChild) return null
  }

  return (
    <SubMenu label={label} icon={icon} {...rest}>
      {children}
    </SubMenu>
  )
}

/**
 * PermissionGroup
 * Used for Section Headers. Hides the section if NONE of the listed modules are accessible.
 */
export const PermissionGroup = ({ modules = [], children }) => {
  const { canAccess } = usePermission()

  if (!modules || modules.length === 0) return children

  const hasOne = modules.some(m => canAccess(m, 'view'))

  if (!hasOne) return null

  return children
}
