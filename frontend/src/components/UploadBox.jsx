import axios from 'axios'

export default function UploadBox({ setInvoices, setLoading }) {

    const upload = async (e) => {

        const file = e.target.files[0]

        if (!file) return

        const formData = new FormData()

        formData.append('file', file)

        try {

            setLoading(true)

            const response = await axios.post(
                '/api/invoices/upload',
                formData
            )

            setInvoices(response.data.invoices)

        } catch (error) {

            console.error(error)

            alert('Upload failed')

        } finally {

            setLoading(false)

        }

    }

    return (

        <div className='w-full'>

            <input
                type='file'
                accept='.pdf,image/*'
                onChange={upload}
                className='w-full border border-gray-300 p-3 rounded-xl bg-white text-gray-700 cursor-pointer'
            />

            <p className='text-sm text-gray-500 mt-2'>
                Upload PDF or invoice image
            </p>

        </div>

    )

}