import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'

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
  DialogActions,
  FormControlLabel,
  Checkbox,
  RadioGroup,
  Radio
} from '@mui/material'
import CustomTextField from '@core/components/mui/TextField'
import GlobalAutocomplete from '@/components/common/GlobalAutocomplete'
import TablePaginationComponent from '@/components/TablePaginationComponent'
import DialogCloseButton from '@components/dialogs/DialogCloseButton'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'

// Icons
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'

import styles from '@core/styles/table.module.css'

export const DebouncedInput = ({ value: initialValue, onChange, debounce = 500, ...props }) => {
  const [value, setValue] = useState(initialValue)
  useEffect(() => setValue(initialValue), [initialValue])
  useEffect(() => {
    const t = setTimeout(() => onChange(value), debounce)
    return () => clearTimeout(t)
  }, [value])
  return <CustomTextField {...props} value={value} onChange={e => setValue(e.target.value)} />
}

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
        <DebouncedInput
          value={searchText}
          onChange={v => setSearchText(String(v))}
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
  id, // ✅ Add id
  currentPestItem,
  handleCurrentPestItemChange,
  handleCurrentPestItemAutocompleteChange,
  dropdowns,
  handleSavePestItem,
  pestItems,
  handleEditPestItem,
  handleDeletePestItem,
  editingItemId,
  handleKeyDown,
  refs,
  // Props for shared state
  pestSearch,
  setPestSearch,
  pestPagination,
  setPestPagination,
  pestDialogOpen,
  setPestDialogOpen,
  handleCurrentPestItemDateChange, // ✅ New prop
  timeOptions // ✅ New prop
}) => {
  // --- Filtering Logic (Pests) ---
  const filteredPests = useMemo(() => {
    if (!Array.isArray(pestItems)) return []
    if (!pestSearch) return pestItems
    const lower = pestSearch.toLowerCase()
    return pestItems.filter(i => Object.values(i).some(v => String(v).toLowerCase().includes(lower)))
  }, [pestItems, pestSearch])

  const PaginatedPests = useMemo(() => {
    const start = pestPagination.pageIndex * pestPagination.pageSize
    return filteredPests.slice(start, start + pestPagination.pageSize)
  }, [filteredPests, pestPagination])

  const requiredFieldSx = {
    '& .MuiFormLabel-asterisk': {
      color: '#e91e63 !important',
      fontWeight: 700
    },
    '& .MuiInputLabel-root.Mui-required': {
      color: 'inherit'
    }
  }

  // Helpers
  const onSavePest = () => {
    handleSavePestItem()
    setPestDialogOpen(false)
  }

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} display='flex' justifyContent='space-between' alignItems='center'>
        <Typography variant='h6'>Add Pests & History</Typography>
      </Grid>

      {/* --- INLINE ADD FORM (ONLY FOR ADD MODE) --- */}
      {!id && (
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
              {/* Row 1: Dates */}
              <Grid item xs={12} md={4}>
                <AppReactDatepicker
                  selected={currentPestItem.startDate}
                  onChange={date => handleCurrentPestItemDateChange('startDate', date)}
                  dateFormat='dd/MM/yyyy'
                  customInput={
                    <CustomTextField
                      fullWidth
                      label='Start Date'
                      placeholder='dd/mm/yyyy'
                      required
                      sx={requiredFieldSx}
                    />
                  }
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <AppReactDatepicker
                  selected={currentPestItem.endDate}
                  onChange={date => handleCurrentPestItemDateChange('endDate', date)}
                  dateFormat='dd/MM/yyyy'
                  customInput={
                    <CustomTextField
                      fullWidth
                      label='End Date'
                      placeholder='dd/mm/yyyy'
                      required
                      sx={requiredFieldSx}
                    />
                  }
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <AppReactDatepicker
                  selected={currentPestItem.reminderDate}
                  onChange={date => handleCurrentPestItemDateChange('reminderDate', date)}
                  dateFormat='dd/MM/yyyy'
                  customInput={
                    <CustomTextField
                      fullWidth
                      label='Reminder Date'
                      placeholder='dd/mm/yyyy'
                      required
                      sx={requiredFieldSx}
                    />
                  }
                />
              </Grid>
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
                  label='Billing Frequency'
                  options={dropdowns.frequencies || []}
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
                  value={currentPestItem.pestCount || ''}
                  InputProps={{ readOnly: true }}
                  sx={{ '& .MuiInputBase-root': { bgcolor: '#f0f0f0' }, ...requiredFieldSx }}
                  required
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <CustomTextField
                  fullWidth
                  label='Pest Value'
                  name='pestValue'
                  type='number'
                  value={currentPestItem.pestValue || ''}
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
                  value={currentPestItem.total || ''}
                  InputProps={{ readOnly: true }}
                  sx={{ '& .MuiInputBase-root': { bgcolor: '#f0f0f0' }, ...requiredFieldSx }}
                  required
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <GlobalAutocomplete
                  label='Time'
                  options={timeOptions}
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
                  onChange={v => handleCurrentPestItemAutocompleteChange('chemical', v, refs.currentChemicalsRef)}
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
                  onClick={handleSavePestItem}
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
      )}
...
      {/* PEST TABLE (Full Width) */}
      <Grid item xs={12}>
        <TableSection
          title='PEST DETAILS'
          addButton={
            id && ( // Only show in UPDATE mode
              <Button
                variant='contained'
                size='small'
                startIcon={<EditIcon sx={{ fontSize: 16 }} />}
                onClick={() => setPestDialogOpen(true)}
              >
                Add New Pest
              </Button>
            )
          }
          searchText={pestSearch}
          setSearchText={setPestSearch}
          pagination={pestPagination}
          setPagination={setPestPagination}
          filteredCount={filteredPests.length}
        >
          <table className={styles.table}>
            <thead>
              <tr>
                <th>S.No</th>
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
              {paginatedPests.length === 0 ? (
                <tr>
                  <td colSpan={9} align='center'>
                    No pest items added
                  </td>
                </tr>
              ) : (
                paginatedPests.map((item, idx) => (
                  <tr key={item.id}>
                    <td>{idx + 1 + pestPagination.pageIndex * pestPagination.pageSize}</td>
                    <td>
                      <Box display='flex' gap={1}>
                        <IconButton
                          size='small'
                          sx={{ color: '#28c76f', border: '1px solid #28c76f', borderRadius: 1, p: '4px' }}
                          onClick={() => {
                            handleEditPestItem(item)
                            if (id) setPestDialogOpen(true) // Open dialog in UPDATE mode
                          }}
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
                    <td>{item.totalValue}</td>
                    <td>{item.workTime}</td>
                    <td>
                      <Chip
                        label={item.chemical || item.chemicals || 'NA'}
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
