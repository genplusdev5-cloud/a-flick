import { useState, useEffect } from 'react'
import { usePermission } from '@/hooks/usePermission'
import { PERMISSION_ALIASES } from '@/constants/permissionAliases'
import { Card, CardContent, Typography, Table, TableHead, TableRow, TableCell, TableBody, Chip } from '@mui/material'

const DebugPermissions = () => {
    const { permissions } = usePermission()
    const [analysis, setAnalysis] = useState([])

    useEffect(() => {
        if (!permissions.length) return

        const analyzed = permissions.map(p => {
            const rawName = p.module_name?.trim()
            const alias = PERMISSION_ALIASES[rawName]
            const mappedKey = alias || rawName
            // Check if this mapped key is used in our App (e.g. check against a list of known frontend keys if possible, or just show the mapping)

            return {
                rawName,
                isAliased: !!alias,
                mappedKey,
                access: {
                    view: Number(p.is_read) === 1,
                    create: Number(p.is_create) === 1,
                    update: Number(p.is_update) === 1,
                    delete: Number(p.is_delete) === 1,
                }
            }
        })
        setAnalysis(analyzed)
    }, [permissions])

    if (!permissions || permissions.length === 0) {
        return (
            <Card sx={{ mt: 4, bgcolor: '#fff4f4' }}>
                <CardContent>
                    <Typography color="error" variant="h6">No Permissions Found for this User</Typography>
                    <Typography variant="body2">Please check if the user has a Role ID assigned.</Typography>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card sx={{ mt: 4, mb: 4, border: '1px dashed #ccc' }}>
            <CardContent>
                <Typography variant='h6' gutterBottom>
                    🛠️ Permission Debugger (Raw Data from Database)
                </Typography>
                <Typography variant='caption' sx={{ display: 'block', mb: 2 }}>
                    This table shows exactly what the database is returning vs what the frontend is looking for.
                </Typography>

                <div className="overflow-x-auto">
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell><strong>Raw DB Name</strong></TableCell>
                                <TableCell><strong>Mapped Frontend Key</strong></TableCell>
                                <TableCell><strong>Status</strong></TableCell>
                                <TableCell><strong>View</strong></TableCell>
                                <TableCell><strong>Active</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {analysis.map((row, i) => (
                                <TableRow key={i}>
                                    <TableCell>{row.rawName}</TableCell>
                                    <TableCell sx={{ color: 'primary.main', fontWeight: 600 }}>{row.mappedKey}</TableCell>
                                    <TableCell>
                                        {row.isAliased ? (
                                            <Chip label="Matched Alias" color="success" size="small" variant="outlined" />
                                        ) : (
                                            <Chip label="Using Raw Name" color="warning" size="small" variant="outlined" />
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {row.access.view ? '✅' : '❌'}
                                    </TableCell>
                                    <TableCell>
                                        {row.access.view ? '✅' : '❌'}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}

export default DebugPermissions
