'use client'

import dynamic from 'next/dynamic'
import ClassicEditor from '@ckeditor/ckeditor5-build-classic'

// ✅ Only CKEditor wrapper must be dynamic
const CKEditor = dynamic(() => import('@ckeditor/ckeditor5-react').then(mod => mod.CKEditor), { ssr: false })

// Custom Adapter for Base64 Image Upload
function uploadAdapter(loader) {
  return {
    upload: () =>
      new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          resolve({ default: reader.result })
        }
        reader.onerror = error => {
          reject(error)
        }
        loader.file.then(file => {
          reader.readAsDataURL(file)
        })
      })
  }
}

function uploadPlugin(editor) {
  editor.plugins.get('FileRepository').createUploadAdapter = loader => {
    return uploadAdapter(loader)
  }
}

const CKEditorField = ({ value, onChange }) => {
  return (
    <CKEditor
      editor={ClassicEditor}
      data={value || ''}
      config={{
        licenseKey: 'GPL', // ✅ FIX license error
        extraPlugins: [uploadPlugin],
        toolbar: [
          'undo',
          'redo',
          '|',
          'heading',
          '|',
          'bold',
          'italic',
          'link',
          'uploadImage',
          'insertTable',
          'blockQuote',
          'mediaEmbed',
          '|',
          'bulletedList',
          'numberedList',
          'outdent',
          'indent'
        ]
      }}
      onChange={(event, editor) => {
        onChange(editor.getData())
      }}
    />
  )
}

export default CKEditorField
