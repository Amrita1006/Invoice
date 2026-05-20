import Webcam from 'react-webcam'
import { useRef, useState } from 'react'
import { uploadInvoice } from '../services/api'

export default function CameraScanner({ setInvoices, setLoading }) {

    const webcamRef = useRef(null)
    const [showCamera, setShowCamera] = useState(false)

    const openCamera = () => {
        setShowCamera(true)
    }

    const closeCamera = () => {
        setShowCamera(false)
    }

    const capture = async () => {
        if (!webcamRef.current) return

        try {

            setLoading(true)

            const imageSrc = webcamRef.current.getScreenshot()

            const blob = await fetch(imageSrc)
                .then(res => res.blob())

            const formData = new FormData()

            formData.append(
                'file',
                blob,
                'scan.jpg'
            )

            const response = await uploadInvoice(blob)

            setInvoices(response.invoices)
            setShowCamera(false)

        } catch (error) {

            console.error(error)

            alert('Scan failed')

        } finally {

            setLoading(false)

        }
    }

    return (
        <div className='w-full'>
            {!showCamera ? (
                <div className='text-center py-8'>
                    <p className='text-gray-500 mb-4'>
                        Click the button below to open camera and scan an invoice
                    </p>
                    <button
                        onClick={openCamera}
                        className='bg-blue-500 text-white py-3 px-8 rounded-xl text-lg font-semibold'
                    >
                        Scan Invoice
                    </button>
                </div>
            ) : (
                <div>
                    <Webcam
                        ref={webcamRef}
                        screenshotFormat='image/jpeg'
                        videoConstraints={{
                            facingMode: 'environment'
                        }}
                        className='w-full rounded-xl'
                    />

                    <div className='flex gap-4 mt-4'>
                        <button
                            onClick={capture}
                            className='flex-1 bg-green-500 text-white py-3 rounded-xl text-lg font-semibold'
                        >
                            Capture & Scan
                        </button>
                        <button
                            onClick={closeCamera}
                            className='flex-1 bg-gray-500 text-white py-3 rounded-xl text-lg font-semibold'
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}