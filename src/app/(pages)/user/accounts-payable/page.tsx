'use client'
import { useState } from 'react';
import Card from '@/components/ui/TableCard';
import ChartCard from '@/components/ui/ChartCard';
import DataTable from '@/components/ui/DataTable';
import { payables, payablesStats, payablesByVendor } from '@/data/payable';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';



interface PayableRow{
    id: string;
    vendor: string;
    date:  string;
    due:  string;
    amount: number,
    status: string,
    method: string 
}

export default function AccountsPayable() {
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredPayables = filterStatus === 'all'
    ? payables
    : payables.filter(item => item.status.toLowerCase() === filterStatus);

  const columns = [
    { header: 'Invoice No', accessor: 'id', cellClassName: 'font-medium' },
    { header: 'Vendor', accessor: 'vendor' },
    { header: 'Date', accessor: 'date' },
    { header: 'Due Date', accessor: 'due' },
    {
      header: 'Amount',
      accessor: 'amount',
      render: (row: Record<string, unknown>) => {
        const entry = row as unknown as PayableRow;
        return `$${entry.amount.toLocaleString()}`;
      },
      className: 'text-right',
      cellClassName: 'font-semibold'
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row: Record<string, unknown>) => {
        const entry = row as unknown as PayableRow;
        return (
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              entry.status === 'Paid'
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                : entry.status === 'Pending'
                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            }`}
          >
            {entry.status}
          </span>
        );
      }
    },
    { header: 'Payment Method', accessor: 'method' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Accounts Payable</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Manage supplier invoices and payments</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card
          title="Total Payables"
          value={`$${payablesStats.totalPayables.toLocaleString()}`}
          icon="FileText"
        />
        <Card
          title="Paid Invoices"
          value={`$${payablesStats.paidInvoices.toLocaleString()}`}
          icon="CheckCircle"
          trend="up"
          trendValue="+5.2%"
        />
        <Card
          title="Overdue Invoices"
          value={`$${payablesStats.overdueInvoices.toLocaleString()}`}
          icon="AlertCircle"
        />
        <Card
          title="Avg Payment Period"
          value={`${payablesStats.averagePaymentPeriod} days`}
          icon="Clock"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 mb-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Filter by Status:
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="all">All Invoices</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>
          <DataTable columns={columns} data={filteredPayables} />
        </div>

        <div>
          <ChartCard title="Payables by Vendor">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={payablesByVendor} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                <XAxis type="number" className="text-gray-600 dark:text-gray-400" />
                <YAxis dataKey="vendor" type="category" width={100} className="text-xs text-gray-600 dark:text-gray-400" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="amount" fill="#10b981" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4 border border-emerald-200 dark:border-emerald-800">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Paid</span>
            <span className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
              {payables.filter(p => p.status === 'Paid').length}
            </span>
          </div>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Pending</span>
            <span className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
              {payables.filter(p => p.status === 'Pending').length}
            </span>
          </div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-red-700 dark:text-red-300">Overdue</span>
            <span className="text-2xl font-bold text-red-900 dark:text-red-100">
              {payables.filter(p => p.status === 'Overdue').length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
