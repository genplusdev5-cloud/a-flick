'use client'

import React, { useState } from 'react'
import {
  Grid,
  Typography,
  Button,
  Box,
  IconButton,
  Chip,
  Select,
  MenuItem,
  FormControl,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material'
import CustomTextField from '@core/components/mui/TextField'
import GlobalAutocomplete from '@/components/common/GlobalAutocomplete'
import TablePaginationComponent from '@/components/TablePaginationComponent'
import DialogCloseButton from '@components/dialogs/DialogCloseButton'

// Icons
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'

import styles from '@core/styles/table.module.css'

export const TableSection = ({
  title,
  addButton,
  searchText,
  setSearchText,
  pagination,
  setPagination,
  filteredCount,
  children
}) => (
  <Box
    sx={{
      border: '1px solid #ddd',
      borderRadius: 1,
      overflow: 'hidden',
      p: 2,
      bgcolor: 'background.paper'
    }}
  >
    <Box
      display='flex'
      justifyContent='space-between'
      alignItems='center'
      mb={3}
      sx={{
        px: 2,
        py: 1.5,
        bgcolor: '#fafafa',
        borderRadius: 1
      }}
    >
      <Typography variant='h6' sx={{ textTransform: 'uppercase', fontWeight: 'bold' }}>
        {title}
      </Typography>
      {addButton}
    </Box>

    <Box
      sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant='body2' color='text.secondary'>
          Show
        </Typography>
        <FormControl size='small' sx={{ width: 80 }}>
          <Select
            value={pagination.pageSize}
            onChange={e => setPagination(p => ({ ...p, pageSize: Number(e.target.value), pageIndex: 0 }))}
          >
            {[5, 10, 25, 50, 100].map(s => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Typography variant='body2' color='text.secondary'>
          entries
        </Typography>
      </Box>

      <Box display='flex' alignItems='center' gap={1}>
        <Typography variant='body2'>Search:</Typography>
        <CustomTextField
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          placeholder=''
          sx={{ width: 160 }}
          size='small'
        />
      </Box>
    </Box>

    <Box sx={{ maxHeight: 400, overflowX: 'auto', borderTop: '1px solid #eee' }}>{children}</Box>

    <Box sx={{ mt: 2 }}>
      <TablePaginationComponent totalCount={filteredCount} pagination={pagination} setPagination={setPagination} />
    </Box>
  </Box>
)


const Step4PestItems = ({
  formData,
  currentPestItem,
  pestItems,
  dropdowns,
  refs,
  handleCurrentPestItemAutocompleteChange,
  handleCurrentPestItemChange,
  handleAddPestItem, // Used as Save in inline form
  handleEditPestItem,
  handleDeletePestItem,
  editingItemId,
  handleKeyDown
}) => {
  const requiredFieldSx = {
    '& .MuiFormLabel-asterisk': {
      color: '#e91e63 !important',
      fontWeight: 700
    },
    '& .MuiInputLabel-root.Mui-required': {
      color: 'inherit'
    }
  }

  // Mock internal states for table to look real
  const [pestSearch, setPestSearch] = useState('')
  const [pestPagination, setPestPagination] = useState({ pageIndex: 0, pageSize: 5 })
  const filteredPests = pestItems // Simplified filtering for now
  
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} display='flex' justifyContent='space-between' alignItems='center'>
        <Typography variant='h6'>Add Pests & History</Typography>
        <Box display='flex' alignItems='center' gap={1}>
          <Typography variant='subtitle1' color='textSecondary'>
            Total Contract Value ($)
          </Typography>
          <Typography variant='h6' color='primary.main'>
            {pestItems.reduce((acc, curr) => acc + (Number(curr.total || 0)), 0)}
          </Typography>
        </Box>
      </Grid>
      
       {/* --- INLINE ADD FORM --- */}
        <Grid item xs={12}>
          <Box
            sx={{
              p: 4,
              bgcolor: '#fff',
              borderRadius: 1,
              border: '1px solid #e0e0e0',
              mb: 4
            }}
          >
            <Typography
              variant='subtitle2'
              sx={{ mb: 3, fontWeight: 'bold', color: '#8b0000', textTransform: 'uppercase' }}
            >
              {editingItemId ? 'Update Pest Item' : 'Enter Pest Details'}
            </Typography>
            <Grid container spacing={4} alignItems='flex-end'>
              <Grid item xs={12} md={2}>
                <GlobalAutocomplete
                  label='Pest'
                  options={dropdowns.pests || []}
                  value={currentPestItem.pestId}
                  onChange={v => handleCurrentPestItemAutocompleteChange('pest', v, refs.pestInputRef)}
                  inputRef={refs.pestInputRef}
                  required
                  sx={requiredFieldSx}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <GlobalAutocomplete
                  label='Billing Frequency' // Label mismatch in Proposal (Billing vs Service) but keeping Proposal label
                  options={dropdowns.billingFrequencies || []} // Using billing frequencies as requested/observed
                  value={currentPestItem.frequencyId}
                  onChange={v => handleCurrentPestItemAutocompleteChange('frequency', v, refs.frequencyInputRef)}
                  inputRef={refs.frequencyInputRef}
                  required
                  sx={requiredFieldSx}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <CustomTextField
                  fullWidth
                  label='Pest Count'
                  name='pestCount'
                  value={currentPestItem.pestCount}
                  onChange={handleCurrentPestItemChange} // Proposal used readOnly + auto calc, but we allow edit if needed or stick to auto
                  sx={{ '& .MuiInputBase-root': { bgcolor: '#f8f9fa' }, ...requiredFieldSx }}
                  inputRef={refs.currentPestCountRef}
                  required
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <CustomTextField
                  fullWidth
                  label='Pest Value'
                  name='pestValue'
                  type='number'
                  value={currentPestItem.pestValue}
                  onChange={handleCurrentPestItemChange}
                  inputRef={refs.currentPestValueRef}
                  onKeyDown={e => handleKeyDown(e, refs.currentPestValueRef)}
                  required
                  sx={requiredFieldSx}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <CustomTextField
                  fullWidth
                  label='Total'
                  name='total'
                  value={currentPestItem.total}
                  InputProps={{ readOnly: true }}
                  sx={{ '& .MuiInputBase-root': { bgcolor: '#f8f9fa' }, ...requiredFieldSx }}
                  required
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <GlobalAutocomplete
                  label='Time'
                  options={['0:05', '0:10', '0:15', '0:30', '1:00']}
                  value={currentPestItem.time}
                  onChange={v => handleCurrentPestItemAutocompleteChange('time', v, refs.timeInputRef)}
                  inputRef={refs.timeInputRef}
                  required
                  sx={requiredFieldSx}
                />
              </Grid>

              {/* Row 2 */}
              <Grid item xs={12} md={6}>
                <GlobalAutocomplete
                  label='Chemicals'
                  options={dropdowns.chemicals || []}
                  value={currentPestItem.chemicalId}
                  onChange={v => handleCurrentPestItemAutocompleteChange('chemicals', v, refs.currentChemicalsRef)}
                  inputRef={refs.currentChemicalsRef}
                  required
                  sx={requiredFieldSx}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <CustomTextField
                  fullWidth
                  label='No of Items'
                  name='noOfItems'
                  type='number'
                  value={currentPestItem.noOfItems}
                  onChange={handleCurrentPestItemChange}
                  inputRef={refs.currentNoOfItemsRef}
                  onKeyDown={e => handleKeyDown(e, refs.currentNoOfItemsRef)}
                  required
                  sx={requiredFieldSx}
                />
              </Grid>
              <Grid item xs={12} md={3} display='flex' justifyContent='flex-end'>
                <Button
                  variant='contained'
                  onClick={handleAddPestItem}
                  fullWidth
                  ref={refs.addPestButtonRef}
                  sx={{
                    bgcolor: '#00adef',
                    height: 40,
                    fontWeight: 600,
                    fontSize: '15px',
                    '&:hover': { bgcolor: '#008dc4' }
                  }}
                >
                  {editingItemId ? 'UPDATE PEST' : '+ ADD PEST'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Grid>

         {/* PEST TABLE (Full Width) */}
      <Grid item xs={12}>
        <TableSection
          title='PEST DETAILS'
          addButton={<></>}
          searchText={pestSearch}
          setSearchText={setPestSearch}
          pagination={pestPagination}
          setPagination={setPestPagination}
          filteredCount={filteredPests.length}
        >
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>Action</th>
                <th>Pest</th>
                <th>Billing Frequency</th>
                <th>Pest Value</th>
                <th>Total Value</th>
                <th>Work Time</th>
                <th>Chemicals</th>
                <th>No Of Items</th>
              </tr>
            </thead>
            <tbody>
              {filteredPests.length === 0 ? (
                <tr>
                  <td colSpan={9} align='center'>
                    No pest items added
                  </td>
                </tr>
              ) : (
                filteredPests.map((item, idx) => (
                  <tr key={item.id}>
                    <td>{idx + 1}</td>
                    <td>
                      <Box display='flex' gap={1}>
                        <IconButton
                          size='small'
                          sx={{ color: '#28c76f', border: '1px solid #28c76f', borderRadius: 1, p: '4px' }}
                          onClick={() => handleEditPestItem(item.id)}
                        >
                          <EditIcon fontSize='small' />
                        </IconButton>
                        <IconButton
                          size='small'
                          sx={{ color: '#ea5455', border: '1px solid #ea5455', borderRadius: 1, p: '4px' }}
                          onClick={() => handleDeletePestItem(item.id)}
                        >
                          <DeleteIcon fontSize='small' />
                        </IconButton>
                      </Box>
                    </td>
                    <td>{item.pest}</td>
                    <td>{item.frequency}</td>
                    <td>{item.pestValue}</td>
                    <td>{item.total}</td>
                    <td>{item.time}</td>
                    <td>
                      <Chip
                        label={item.chemicals || 'NA'}
                        size='small'
                        sx={{ bgcolor: '#28c76f', color: '#fff', borderRadius: '4px' }}
                      />
                    </td>
                    <td>{item.noOfItems}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </TableSection>
      </Grid>
    </Grid>
  )
}

export default Step4PestItems
