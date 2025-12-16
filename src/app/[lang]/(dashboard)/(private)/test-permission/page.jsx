'use client'

import { useState, useEffect } from 'react'
import PermissionGuard from '@/components/auth/PermissionGuard'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'

const TestPermissionPage = () => {
   const [currentUser, setCurrentUser] = useState(null)
   const [testPermission, setTestPermission] = useState('admin') // Default to testing 'admin' role
   const [showGuard, setShowGuard] = useState(false)

   useEffect(() => {
     try {
       const user = JSON.parse(localStorage.getItem('user_info'))
       setCurrentUser(user)
     } catch (e) {
       console.error(e)
     }
   }, [])

   return (
     <div className="p-6">
       <Typography variant="h3" className="mb-6">Permission Guard Test</Typography>
       
       <Card className="mb-6">
         <CardContent>
           <Typography variant="h5" className="mb-4">Current User Status</Typography>
           <pre className="bg-gray-100 p-4 rounded">
             {JSON.stringify(currentUser, null, 2)}
           </pre>
         </CardContent>
       </Card>

       <Card className="mb-6">
         <CardContent>
            <Typography variant="h5" className="mb-4">Test Configuration</Typography>
            <div className="flex gap-4 items-center mb-4">
              <input 
                type="text" 
                value={testPermission} 
                onChange={(e) => setTestPermission(e.target.value)}
                className="border p-2 rounded"
                placeholder="Enter required permission/role"
              />
              <Button variant="contained" onClick={() => setShowGuard(true)}>
                Try Accessing Guarded Component
              </Button>
              <Button variant="outlined" onClick={() => setShowGuard(false)}>
                Reset
              </Button>
            </div>
         </CardContent>
       </Card>

       {showGuard && (
         <PermissionGuard permission={testPermission}>
            <Card className="bg-green-50 border-green-200 border">
              <CardContent>
                <Typography variant="h4" color="success.main">
                  🎉 ACCESS GRANTED!
                </Typography>
                <Typography>
                  You have the required permission: <strong>{testPermission}</strong>
                </Typography>
              </CardContent>
            </Card>
         </PermissionGuard>
       )}
     </div>
   )
}

export default TestPermissionPage
