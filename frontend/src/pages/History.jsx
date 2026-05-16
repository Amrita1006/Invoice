import { useState, useEffect } from 'react';
import { 
  Search, 
  Download, 
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Loader2
} from 'lucide-react';
import { getInvoiceHistory, deleteInvoice, downloadExcel, previewExcel } from '../services/api';

function History() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadInvoices();
  }, [search, page]);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const response = await getInvoiceHistory(search, page, 10);
      if (response.success) {
        setInvoices(response.invoices);
        setTotal(response.total);
        setTotalPages(Math.ceil(response.total / 10));
      }
    } catch (error) {
      console.error('Failed to load invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    loadInvoices();
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this invoice?')) {
      try {
        await deleteInvoice(id);
        loadInvoices();
      } catch (error) {
        console.error('Delete error:', error);
        alert('Failed to delete invoice');
      }
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Invoice History</h1>
          <p className="text-gray-500 mt-1">View and manage all your processed invoices</p>
        </div>
        <div className="text-sm text-gray-500">
          {total} invoice{total !== 1 ? 's' : ''} total
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by invoice number, vendor, or GST..."
              className="input-field pl-12"
            />
          </div>
          <button type="submit" className="btn-primary">
            Search
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="mx-auto animate-spin text-blue-600 mb-4" size={32} />
            <p className="text-gray-500">Loading invoices...</p>
          </div>
        ) : invoices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left p-4 font-semibold text-gray-600">Invoice #</th>
                  <th className="text-left p-4 font-semibold text-gray-600">Vendor</th>
                  <th className="text-left p-4 font-semibold text-gray-600">Date</th>
                  <th className="text-right p-4 font-semibold text-gray-600">Amount</th>
                  <th className="text-left p-4 font-semibold text-gray-600">GST</th>
                  <th className="text-center p-4 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FileText size={20} className="text-blue-600" />
                        </div>
                        <span className="font-medium text-gray-800">
                          {invoice.invoice_number || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-gray-800">{invoice.vendor_name || 'Unknown'}</p>
                        <p className="text-sm text-gray-500">{invoice.email || '-'}</p>
                      </div>
                    </td>
                    <td className="p-4 text-gray-600">
                      {formatDate(invoice.created_at)}
                    </td>
                    <td className="p-4 text-right font-semibold text-gray-800">
                      {formatCurrency(invoice.total_amount)}
                    </td>
                    <td className="p-4 text-gray-600">
                      {invoice.gst_number || '-'}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => window.open(previewExcel(invoice.id), '_blank')}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Preview Excel"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => downloadExcel(invoice.id)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Download Excel"
                        >
                          <Download size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(invoice.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <FileText size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No invoices found</p>
            {search && (
              <p className="text-sm text-gray-400 mt-2">
                Try adjusting your search terms
              </p>
            )}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default History;