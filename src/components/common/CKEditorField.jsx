'use client'

import dynamic from 'next/dynamic'
import ClassicEditor from '@ckeditor/ckeditor5-build-classic'

// ✅ Only CKEditor wrapper must be dynamic
const CKEditor = dynamic(() => import('@ckeditor/ckeditor5-react').then(mod => mod.CKEditor), { ssr: false })

const CKEditorField = ({ value, onChange }) => {
  return (
    <CKEditor
      editor={ClassicEditor}
      data={value || ''}
      config={{
        licenseKey: 'GPL' // ✅ FIX license error
      }}
      onChange={(event, editor) => {
        onChange(editor.getData())
      }}
    />
  )
}

export default CKEditorField
