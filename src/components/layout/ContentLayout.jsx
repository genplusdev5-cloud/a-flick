'use client'

import { Box, Card, Typography, Breadcrumbs, Link } from '@mui/material'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'

/**
 * Universal Content Layout
 * ------------------------
 * Ensures every page (Tax, Company, etc.) looks consistent:
 * - Breadcrumbs
 * - Page Title + Action Buttons (Export, Add etc.)
 * - Same padding, spacing, card look
 */
const ContentLayout = ({ title, breadcrumbs = [], actions, children }) => {
  return (
    <Box>
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <Breadcrumbs
          aria-label="breadcrumb"
          separator={<NavigateNextIcon fontSize="small" />}
          sx={{ mb: 2 }}
        >
          {breadcrumbs.map((item, i) =>
            item.href ? (
              <Link key={i} underline="hover" color="inherit" href={item.href}>
                {item.label}
              </Link>
            ) : (
              <Typography key={i} color="text.primary">
                {item.label}
              </Typography>
            )
          )}
        </Breadcrumbs>
      )}

      {/* Main Card */}
      <Card sx={{ p: 2, mt: 3 }}>
        {/* Header */}
        <Box
          sx={{
            p: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid',
            borderColor: 'divider',
            mb: 2,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>{actions}</Box>
        </Box>

        {/* Page content */}
        {children}
      </Card>
    </Box>
  )
}

export default ContentLayout
