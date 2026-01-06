'use client'

import Pagination from '@mui/material/Pagination'
import Typography from '@mui/material/Typography'

const TablePaginationComponent = ({ table, totalCount = 0, pagination, setPagination }) => {
  // Defensive checks to prevent crashing if props are missing
  const pageIndex = pagination?.pageIndex ?? 0
  const pageSize = pagination?.pageSize ?? 25
  const totalPages = Math.ceil(totalCount / (pageSize || 1))

  return (
    <div className='flex justify-between items-center flex-wrap pli-6 border-bs bs-auto plb-[12.5px] gap-2'>
      <Typography color='text.disabled'>
        {`Showing ${totalCount === 0 ? 0 : pageIndex * pageSize + 1} to ${Math.min(
          (pageIndex + 1) * pageSize,
          totalCount
        )} of ${totalCount} entries`}
      </Typography>

      <Pagination
        shape='rounded'
        color='primary'
        variant='tonal'
        count={totalPages || 1}
        page={pageIndex + 1}
        onChange={(_, newPage) => {
          setPagination(prev => ({ ...prev, pageIndex: newPage - 1 }))
        }}
        showFirstButton
        showLastButton
      />
    </div>
  )
}

export default TablePaginationComponent
