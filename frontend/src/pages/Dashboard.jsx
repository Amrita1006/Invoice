import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  DollarSign, 
  TrendingUp, 
  Clock,
  ArrowRight,
  Plus
} from 'lucide-react';
import { getDashboardStats } from '../services/api';

function StatCard({ icon: Icon, title, value, trend, color }) {
  return (
    <div className="card-stat animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-500 text-sm mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
          {trend && (
            <p className="text-green-600 text-sm mt-2 flex items-center gap-1">
              <TrendingUp size={14} />
              {trend}
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  const [stats, setStats] = useState({
    total_invoices: 0,
    total_amount: 0,
    latest_invoices: [],
    monthly_stats: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await getDashboardStats();
      if (response.success) {
        setStats(response.stats);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500 mt-1">Overview of your invoice management</p>
        </div>
        <Link to="/upload" className="btn-primary flex items-center gap-2">
          <Plus size={20} />
          Upload Invoice
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          icon={FileText}
          title="Total Invoices"
          value={stats.total_invoices}
          color="bg-blue-600"
        />
        <StatCard
          icon={DollarSign}
          title="Total Amount"
          value={formatCurrency(stats.total_amount)}
          color="bg-green-600"
        />
        <StatCard
          icon={Clock}
          title="This Month"
          value={stats.monthly_stats.reduce((sum, m) => sum + m.count, 0)}
          color="bg-purple-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-lg">Latest Invoices</h3>
            <Link to="/history" className="text-blue-600 text-sm flex items-center gap-1 hover:underline">
              View All <ArrowRight size={16} />
            </Link>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded-lg"></div>
                ))}
              </div>
            ) : stats.latest_invoices.length > 0 ? (
              <div className="space-y-4">
                {stats.latest_invoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div>
                      <p className="font-medium text-gray-800">{invoice.invoice_number || 'N/A'}</p>
                      <p className="text-sm text-gray-500">{invoice.vendor_name || 'Unknown Vendor'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-800">{formatCurrency(invoice.total_amount)}</p>
                      <p className="text-xs text-gray-400">{formatDate(invoice.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No invoices yet</p>
                <Link to="/upload" className="text-blue-600 text-sm hover:underline mt-2 inline-block">
                  Upload your first invoice
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h3 className="font-semibold text-lg">Monthly Statistics</h3>
          </div>
          <div className="p-6">
            {stats.monthly_stats.length > 0 ? (
              <div className="space-y-4">
                {stats.monthly_stats.map((month) => (
                  <div key={month.month} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{month.month}</span>
                      <span className="font-medium">{month.count} invoices</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-600 rounded-full transition-all duration-500"
                        style={{ 
                          width: `${Math.min(100, (month.count / Math.max(...stats.monthly_stats.map(m => m.count))) * 100)}%` 
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-400">{formatCurrency(month.amount)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <TrendingUp size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold mb-2">Ready to process invoices?</h3>
            <p className="text-blue-100">Upload your invoices and let AI extract the data automatically</p>
          </div>
          <Link to="/upload" className="bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center gap-2">
            Upload Now <ArrowRight size={20} />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;