import React from 'react'
import { Grid, Card, CardContent, Typography, Box, Avatar } from '@mui/material'

/**
 * A reusable component to display summary metrics in cards.
 * @param {Array} data - Array of objects with properties: title, value, icon, color
 */
const SummaryCards = ({ data }) => {
  return (
    <Grid container spacing={4} sx={{ mb: 4 }}>
      {data.map((item, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Avatar
                variant='rounded'
                sx={{
                  bgcolor: `${item.color}20`, // Light background version of the color
                  color: item.color,
                  width: 48,
                  height: 48
                }}
              >
                <i className={item.icon} style={{ fontSize: '1.5rem' }} />
              </Avatar>
              <Box>
                <Typography variant='h6' sx={{ fontWeight: 600, color: 'text.primary' }}>
                  {item.value}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  {item.title}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  )
}

export default SummaryCards
