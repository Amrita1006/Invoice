import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Save, 
  Plus, 
  Trash2, 
  ArrowLeft,
  Loader2,
  CheckCircle
} from 'lucide-react';
import { saveInvoice } from '../services/api';

function Review() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  
  const [formData, setFormData] = useState({
    invoice_number: '',
    vendor_name: '',
    invoice_date: '',
    gst_number: '',
    phone_number: '',
    email: '',
    total_amount: 0,
    file_path: '',
    products: []
  });

  useEffect(() => {
    const stored = sessionStorage.getItem('extractedInvoice');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setFormData({
          invoice_number: data.invoice_number || '',
          vendor_name: data.vendor_name || '',
          invoice_date: data.invoice_date || '',
          gst_number: data.gst_number || '',
          phone_number: data.phone_number || '',
          email: data.email || '',
          total_amount: data.total_amount || 0,
          file_path: data.file_path || '',
          products: data.products || []
        });
      } catch (e) {
        console.error('Failed to parse stored data', e);
      }
    }
  }, []);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleProductChange = (index, field, value) => {
    const newProducts = [...formData.products];
    newProducts[index] = { ...newProducts[index], [field]: value };
    setFormData(prev => ({ ...prev, products: newProducts }));
  };

  const addProduct = () => {
    setFormData(prev => ({
      ...prev,
      products: [...prev.products, { item_name: '', quantity: '', amount: 0 }]
    }));
  };

  const removeProduct = (index) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index)
    }));
  };

  const calculateTotal = () => {
    return formData.products.reduce((sum, p) => {
      const amount = parseFloat(p.amount) || 0;
      return sum + amount;
    }, 0);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const invoiceData = {
        ...formData,
        total_amount: formData.total_amount || calculateTotal()
      };
      
      const result = await saveInvoice(invoiceData);
      
      if (result.success) {
        sessionStorage.removeItem('extractedInvoice');
        setSaved(true);
        setTimeout(() => {
          navigate('/history');
        }, 2000);
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save invoice. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (saved) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Invoice Saved Successfully!</h2>
        <p className="text-gray-500">Redirecting to history page...</p>
      </div>
    );
  }

  if (!formData.file_path && !formData.invoice_number) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 mb-4">No invoice data to review</p>
        <button onClick={() => navigate('/upload')} className="btn-primary">
          Upload Invoice
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <button 
        onClick={() => navigate('/upload')} 
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
      >
        <ArrowLeft size={20} />
        Back to Upload
      </button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Review Invoice</h1>
        <p className="text-gray-500 mt-1">Verify and edit the extracted data before saving</p>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-lg mb-6">Invoice Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Invoice Number
              </label>
              <input
                type="text"
                value={formData.invoice_number}
                onChange={(e) => handleChange('invoice_number', e.target.value)}
                className="input-field"
                placeholder="INV-2024-001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vendor Name
              </label>
              <input
                type="text"
                value={formData.vendor_name}
                onChange={(e) => handleChange('vendor_name', e.target.value)}
                className="input-field"
                placeholder="ABC Company"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Invoice Date
              </label>
              <input
                type="text"
                value={formData.invoice_date}
                onChange={(e) => handleChange('invoice_date', e.target.value)}
                className="input-field"
                placeholder="2024-01-15"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GST Number
              </label>
              <input
                type="text"
                value={formData.gst_number}
                onChange={(e) => handleChange('gst_number', e.target.value)}
                className="input-field"
                placeholder="27AABCU9603R1ZM"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="text"
                value={formData.phone_number}
                onChange={(e) => handleChange('phone_number', e.target.value)}
                className="input-field"
                placeholder="+91-9876543210"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="input-field"
                placeholder="contact@company.com"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-lg">Products</h3>
            <button
              onClick={addProduct}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              <Plus size={16} />
              Add Product
            </button>
          </div>

          {formData.products.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No products added yet
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-4 font-medium">Item Name</th>
                    <th className="text-center p-4 font-medium w-32">Quantity</th>
                    <th className="text-right p-4 font-medium w-40">Amount (₹)</th>
                    <th className="p-4 w-16"></th>
                  </tr>
                </thead>
                <tbody>
                  {formData.products.map((product, index) => (
                    <tr key={index} className="border-t">
                      <td className="p-3">
                        <input
                          type="text"
                          value={product.item_name}
                          onChange={(e) => handleProductChange(index, 'item_name', e.target.value)}
                          className="input-field"
                          placeholder="Product name"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="text"
                          value={product.quantity}
                          onChange={(e) => handleProductChange(index, 'quantity', e.target.value)}
                          className="input-field text-center"
                          placeholder="1"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          value={product.amount}
                          onChange={(e) => handleProductChange(index, 'amount', parseFloat(e.target.value) || 0)}
                          className="input-field text-right"
                          placeholder="0.00"
                        />
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => removeProduct(index)}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-6 pt-6 border-t flex justify-between items-center">
            <div className="text-gray-600">Calculated Total:</div>
            <div className="text-2xl font-bold text-gray-800">
              ₹ {calculateTotal().toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-lg mb-4">Total Amount</h3>
          <input
            type="number"
            value={formData.total_amount}
            onChange={(e) => handleChange('total_amount', parseFloat(e.target.value) || 0)}
            className="input-field text-2xl font-bold"
            placeholder="0.00"
          />
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn-primary flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={20} />
                Save Invoice
              </>
            )}
          </button>
          <button onClick={() => navigate('/upload')} className="btn-secondary">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default Review;