'use client'

// Third-party Imports
import styled from '@emotion/styled'

// Util Imports
import { commonLayoutClasses, verticalLayoutClasses } from '@layouts/utils/layoutClasses'

const StyledContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100dvh;

  & .${verticalLayoutClasses.header} {
    position: sticky !important;
    top: 0;
    z-index: 10;
    background: var(--mui-palette-background-paper);
    box-shadow: var(--mui-customShadows-sm);
  }

  & .${verticalLayoutClasses.headerFixed} {
    backdrop-filter: blur(10px);
    background-color: rgba(var(--mui-palette-background-paper-rgb), 0.8) !important;
  }

  &:has(.${verticalLayoutClasses.content}>.${commonLayoutClasses.contentHeightFixed}) {
    max-block-size: 100dvh;
  }
`

export default StyledContentWrapper
