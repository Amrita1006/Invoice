import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Upload as UploadIcon, 
  Image, 
  FileText, 
  Loader2,
  CheckCircle,
  AlertCircle,
  X,
  Camera
} from 'lucide-react';
import CameraScanner from '../components/CameraScanner';
import { uploadInvoice, saveInvoice } from '../services/api';

function Upload() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [extractedInvoices, setExtractedInvoices] = useState([]);
  const [currentInvoiceIndex, setCurrentInvoiceIndex] = useState(0);
  const [extractedData, setExtractedData] = useState(null);
  const [showCamera, setShowCamera] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleFile = (selectedFile) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(selectedFile.type)) {
      setStatus({ type: 'error', message: 'Please upload a JPG, PNG, or PDF file' });
      return;
    }
    setFile(selectedFile);
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }
    setStatus({ type: 'success', message: `Selected: ${selectedFile.name}` });
  };

  const handleUpload = async () => {

  if (!file) return;

  setUploading(true);

  setStatus({
    type: 'info',
    message: 'Uploading and extracting data...'
  });

  try {

    const result = await uploadInvoice(file);

    if (
      result.success &&
      result.invoices &&
      result.invoices.length > 0
    ) {

      const successfulInvoices = result.invoices.filter(
        inv => inv.success
      );

      if (successfulInvoices.length > 0) {

        setExtractedInvoices(successfulInvoices);

        setCurrentInvoiceIndex(0);

        setExtractedData({
          ...successfulInvoices[0].data,
          file_path: successfulInvoices[0].file_path
        });

        if (successfulInvoices.length === 1) {

          setStatus({
            type: 'success',
            message:
              'Extraction complete! Review and edit your data below.'
          });

        } else {

          setStatus({
            type: 'success',
            message: `Extracted ${successfulInvoices.length} invoices! Use arrows to navigate between them.`
          });

        }

      } else {

        setStatus({
          type: 'error',
          message:
            'No invoices could be extracted from the file.'
        });

      }

    } else {

      setStatus({
        type: 'error',
        message:
          result.detail || 'Upload failed. Please try again.'
      });

    }

  } catch (error) {

    console.error('Upload error:', error);

    setStatus({
      type: 'error',
      message: 'Upload failed. Please try again.'
    });

  } finally {

    setUploading(false);

  }
};

  const handleFieldChange = (field, value) => {
    setExtractedData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleProductChange = (index, field, value) => {
    const updatedProducts = [...extractedData.products];
    updatedProducts[index] = {
      ...updatedProducts[index],
      [field]: value
    };
    setExtractedData(prev => ({
      ...prev,
      products: updatedProducts
    }));
  };

  const addProduct = () => {
    setExtractedData(prev => ({
      ...prev,
      products: [...(prev.products || []), { item_name: '', quantity: '', amount: 0 }]
    }));
  };

  const removeProduct = (index) => {
    setExtractedData(prev => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {

  if (!extractedData) return;

  setUploading(true);

  setStatus({
    type: 'info',
    message: 'Saving invoice...'
  });

  try {

    const cleanAmount = (val) => {

      if (typeof val === 'number') return val;

      if (!val) return 0;

      return parseFloat(
        String(val).replace(/[^0-9.]/g, '')
      ) || 0;

    };

    const saveData = {

      invoice_number:
        extractedData.invoice_number || '',

      vendor_name:
        extractedData.vendor_name || '',

      invoice_date:
        extractedData.invoice_date || '',

      gst_number:
        extractedData.gst_number || '',

      phone_number:
        extractedData.phone_number || '',

      email:
        extractedData.email || '',

      total_amount:
        cleanAmount(extractedData.total_amount),

      file_path:
        extractedData.file_path,

      products:
        (extractedData.products || []).map(p => ({

          item_name:
            p.item_name || '',

          quantity:
            String(p.quantity)
              .replace(/[^0-9]/g, '') || '0',

          amount:
            cleanAmount(p.amount)

        }))

    };

    const result = await saveInvoice(saveData);

    if (result.success) {

      const remainingInvoices =
        extractedInvoices.filter(
          (_, idx) => idx !== currentInvoiceIndex
        );

      if (remainingInvoices.length > 0) {

        setExtractedInvoices(remainingInvoices);

        setCurrentInvoiceIndex(0);

        setExtractedData({
          ...remainingInvoices[0].data,
          file_path: remainingInvoices[0].file_path
        });

        setStatus({
          type: 'success',
          message:
            `Invoice saved! ${remainingInvoices.length} more to save.`
        });

      } else {

        setStatus({
          type: 'success',
          message:
            'All invoices saved successfully!'
        });

        setTimeout(() => {

          handleReset();

        }, 1500);

      }

    } else {

      setStatus({
        type: 'error',
        message:
          result.detail || 'Failed to save invoice'
      });

    }

  } catch (error) {

    console.error('Save error:', error);

    setStatus({
      type: 'error',
      message:
        'Failed to save invoice: ' + error.message
    });

  } finally {

    setUploading(false);

  }
};

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setExtractedData(null);
    setExtractedInvoices([]);
    setCurrentInvoiceIndex(0);
    setStatus({ type: '', message: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Upload Invoice</h1>
        <p className="text-gray-500 mt-1">Upload your invoice image or PDF for AI-powered extraction</p>
      </div>

      {!extractedData ? (
        <div className="space-y-6">
          <div className="flex gap-4 border-b">
            <button
              onClick={() => setShowCamera(false)}
              className={`pb-3 px-4 font-medium ${!showCamera ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
            >
              <UploadIcon size={18} className="inline mr-2" />
              Upload File
            </button>
            <button
              onClick={() => setShowCamera(true)}
              className={`pb-3 px-4 font-medium ${showCamera ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
            >
              <Camera size={18} className="inline mr-2" />
              Scan with Camera
            </button>
          </div>

          {showCamera ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <CameraScanner
                setInvoices={(invoices) => {
                  if (invoices && invoices.length > 0 && invoices[0].success) {
                    setExtractedData({
                      ...invoices[0].data,
                      file_path: invoices[0].file_path
                    });
                    setStatus({ type: 'success', message: 'Extraction complete! Review and edit your data below.' });
                  }
                }}
                setLoading={setUploading}
              />
            </div>
          ) : (
          <div
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
              dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            
            {preview ? (
              <div className="space-y-4">
                <img src={preview} alt="Preview" className="max-h-64 mx-auto rounded-lg shadow-md" />
                <button onClick={handleReset} className="text-red-500 hover:text-red-600 text-sm">
                  Remove file
                </button>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UploadIcon size={32} className="text-blue-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                  Drag & drop your invoice here
                </h3>
                <p className="text-gray-500 mb-4">or click to browse files</p>
                <div className="flex items-center justify-center gap-4 text-sm text-gray-400">
                  <span className="flex items-center gap-1"><Image size={16} /> JPG</span>
                  <span className="flex items-center gap-1"><Image size={16} /> PNG</span>
                  <span className="flex items-center gap-1"><FileText size={16} /> PDF</span>
                </div>
                <button onClick={() => fileInputRef.current?.click()} className="mt-6 btn-primary">
                  Select File
                </button>
              </>
            )}
          </div>
          )}

          {status.message && (
            <div className={`flex items-center gap-3 p-4 rounded-lg ${
              status.type === 'error' ? 'bg-red-50 text-red-700' :
              status.type === 'success' ? 'bg-green-50 text-green-700' :
              'bg-blue-50 text-blue-700'
            }`}>
              {status.type === 'error' && <AlertCircle size={20} />}
              {status.type === 'success' && <CheckCircle size={20} />}
              {status.type === 'info' && <Loader2 size={20} className="animate-spin" />}
              <span>{status.message}</span>
            </div>
          )}

          {file && (
            <div className="flex gap-4">
              <button onClick={handleUpload} disabled={uploading} className="btn-primary flex items-center gap-2">
                {uploading ? (
                  <><Loader2 size={20} className="animate-spin" /> Processing...</>
                ) : (
                  <><UploadIcon size={20} /> Upload & Extract</>
                )}
              </button>
              <button onClick={handleReset} className="btn-secondary">Cancel</button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            {extractedInvoices.length > 1 && (
              <div className="flex items-center justify-between mb-6 pb-4 border-b">
                <button
                  onClick={() => {
                    const newIndex = currentInvoiceIndex > 0 ? currentInvoiceIndex - 1 : extractedInvoices.length - 1;
                    setCurrentInvoiceIndex(newIndex);
                    setExtractedData({ ...extractedInvoices[newIndex].data, file_path: extractedInvoices[newIndex].file_path });
                  }}
                  className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Previous
                </button>
                <span className="font-medium">
                  Invoice {currentInvoiceIndex + 1} of {extractedInvoices.length}
                </span>
                <button
                  onClick={() => {
                    const newIndex = currentInvoiceIndex < extractedInvoices.length - 1 ? currentInvoiceIndex + 1 : 0;
                    setCurrentInvoiceIndex(newIndex);
                    setExtractedData({ ...extractedInvoices[newIndex].data, file_path: extractedInvoices[newIndex].file_path });
                  }}
                  className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Next
                </button>
              </div>
            )}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Extracted Data - Edit if needed</h3>
              <span className="flex items-center gap-2 text-green-600 text-sm">
                <CheckCircle size={16} /> Successfully extracted
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500 block mb-1">Invoice Number</label>
                <input
                  type="text"
                  value={extractedData.invoice_number || ''}
                  onChange={(e) => handleFieldChange('invoice_number', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="text-sm text-gray-500 block mb-1">Vendor Name</label>
                <input
                  type="text"
                  value={extractedData.vendor_name || ''}
                  onChange={(e) => handleFieldChange('vendor_name', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="text-sm text-gray-500 block mb-1">Invoice Date</label>
                <input
                  type="text"
                  value={extractedData.invoice_date || ''}
                  onChange={(e) => handleFieldChange('invoice_date', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="text-sm text-gray-500 block mb-1">GST Number</label>
                <input
                  type="text"
                  value={extractedData.gst_number || ''}
                  onChange={(e) => handleFieldChange('gst_number', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="text-sm text-gray-500 block mb-1">Phone</label>
                <input
                  type="text"
                  value={extractedData.phone_number || ''}
                  onChange={(e) => handleFieldChange('phone_number', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="text-sm text-gray-500 block mb-1">Email</label>
                <input
                  type="text"
                  value={extractedData.email || ''}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="text-sm text-gray-500 block mb-1">Total Amount</label>
                <input
                  type="number"
                  value={extractedData.total_amount || 0}
                  onChange={(e) => handleFieldChange('total_amount', parseFloat(e.target.value) || 0)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">Products</h4>
                <button
                  type="button"
                  onClick={addProduct}
                  className="text-blue-600 text-sm hover:underline"
                >
                  + Add Product
                </button>
              </div>
              {extractedData.products && extractedData.products.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-3">Item Name</th>
                        <th className="text-center p-3">Quantity</th>
                        <th className="text-right p-3">Amount</th>
                        <th className="p-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {extractedData.products.map((product, idx) => (
                        <tr key={idx} className="border-t">
                          <td className="p-2">
                            <input
                              type="text"
                              value={product.item_name || ''}
                              onChange={(e) => handleProductChange(idx, 'item_name', e.target.value)}
                              className="w-full border border-gray-300 rounded px-2 py-1"
                              placeholder="Item name"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={product.quantity || ''}
                              onChange={(e) => handleProductChange(idx, 'quantity', e.target.value)}
                              className="w-full border border-gray-300 rounded px-2 py-1 text-center"
                              placeholder="Qty"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              value={product.amount || 0}
                              onChange={(e) => handleProductChange(idx, 'amount', parseFloat(e.target.value) || 0)}
                              className="w-full border border-gray-300 rounded px-2 py-1 text-right"
                              placeholder="0.00"
                            />
                          </td>
                          <td className="p-2">
                            <button
                              onClick={() => removeProduct(idx)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No products found. Click "Add Product" to add one.</p>
              )}
            </div>
          </div>

          {status.message && (
            <div className={`flex items-center gap-3 p-4 rounded-lg ${
              status.type === 'error' ? 'bg-red-50 text-red-700' :
              status.type === 'success' ? 'bg-green-50 text-green-700' :
              'bg-blue-50 text-blue-700'
            }`}>
              {status.type === 'error' && <AlertCircle size={20} />}
              {status.type === 'success' && <CheckCircle size={20} />}
              {status.type === 'info' && <Loader2 size={20} className="animate-spin" />}
              <span>{status.message}</span>
            </div>
          )}

          <div className="flex gap-4">
            <button 
              onClick={handleSave} 
              disabled={uploading}
              className="btn-primary flex items-center gap-2"
            >
              {uploading ? (
                <><Loader2 size={20} className="animate-spin" /> Saving...</>
              ) : (
                <><CheckCircle size={20} /> Save Invoice</>
              )}
            </button>
            <button onClick={handleReset} className="btn-secondary">
              Upload Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Upload;