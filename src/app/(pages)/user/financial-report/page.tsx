'use client'
import { useState } from 'react';
import { Download, FileText } from 'lucide-react';
import ChartCard from '@/components/ui/ChartCard';
import { reports } from '@/data/report';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function FinancialReports() {
  const [activeTab, setActiveTab] = useState('profitLoss');

  const tabs = [
    { id: 'profitLoss', label: 'Profit & Loss' },
    { id: 'balanceSheet', label: 'Balance Sheet' },
    { id: 'cashFlow', label: 'Cash Flow' },
  ];

  const cashFlowData = reports.cashFlow.months.map((month, index) => ({
    month,
    operating: reports.cashFlow.operating[index],
    investing: reports.cashFlow.investing[index],
    financing: reports.cashFlow.financing[index],
  }));

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Financial Reports</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Comprehensive financial statements and analysis</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
            <FileText className="w-4 h-4" />
            Export Excel
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors duration-200">
            <Download className="w-4 h-4" />
            Download PDF
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="flex border-b border-gray-200 dark:border-gray-800">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors duration-200 ${
                activeTab === tab.id
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-b-2 border-emerald-600'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'profitLoss' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Income Statement</h3>
                <div className="space-y-4">
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4 border border-emerald-200 dark:border-emerald-800">
                    <h4 className="font-semibold text-emerald-900 dark:text-emerald-100 mb-3">Revenue</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-emerald-700 dark:text-emerald-300">Sales Revenue</span>
                        <span className="font-semibold text-emerald-900 dark:text-emerald-100">${reports.profitLoss.revenue.sales.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-emerald-700 dark:text-emerald-300">Service Revenue</span>
                        <span className="font-semibold text-emerald-900 dark:text-emerald-100">${reports.profitLoss.revenue.service.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-emerald-700 dark:text-emerald-300">Interest Income</span>
                        <span className="font-semibold text-emerald-900 dark:text-emerald-100">${reports.profitLoss.revenue.interest.toLocaleString()}</span>
                      </div>
                      <div className="pt-2 border-t border-emerald-300 dark:border-emerald-700 flex justify-between font-bold">
                        <span className="text-emerald-900 dark:text-emerald-100">Total Revenue</span>
                        <span className="text-emerald-900 dark:text-emerald-100">${reports.profitLoss.revenue.total.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
                    <h4 className="font-semibold text-red-900 dark:text-red-100 mb-3">Expenses</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-red-700 dark:text-red-300">Salaries Expense</span>
                        <span className="font-semibold text-red-900 dark:text-red-100">${reports.profitLoss.expenses.salaries.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-red-700 dark:text-red-300">Operating Expenses</span>
                        <span className="font-semibold text-red-900 dark:text-red-100">${reports.profitLoss.expenses.operating.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-red-700 dark:text-red-300">Rent Expense</span>
                        <span className="font-semibold text-red-900 dark:text-red-100">${reports.profitLoss.expenses.rent.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-red-700 dark:text-red-300">Utilities Expense</span>
                        <span className="font-semibold text-red-900 dark:text-red-100">${reports.profitLoss.expenses.utilities.toLocaleString()}</span>
                      </div>
                      <div className="pt-2 border-t border-red-300 dark:border-red-700 flex justify-between font-bold">
                        <span className="text-red-900 dark:text-red-100">Total Expenses</span>
                        <span className="text-red-900 dark:text-red-100">${reports.profitLoss.expenses.total.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className={`rounded-lg p-4 border ${
                    reports.profitLoss.netProfit > 0
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700'
                      : 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700'
                  }`}>
                    <div className="flex justify-between items-center">
                      <span className={`text-lg font-bold ${
                        reports.profitLoss.netProfit > 0
                          ? 'text-emerald-900 dark:text-emerald-100'
                          : 'text-red-900 dark:text-red-100'
                      }`}>
                        Net {reports.profitLoss.netProfit > 0 ? 'Profit' : 'Loss'}
                      </span>
                      <span className={`text-2xl font-bold ${
                        reports.profitLoss.netProfit > 0
                          ? 'text-emerald-900 dark:text-emerald-100'
                          : 'text-red-900 dark:text-red-100'
                      }`}>
                        ${Math.abs(reports.profitLoss.netProfit).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'balanceSheet' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Assets</h3>
                  <div className="space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                      <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">Current Assets</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-blue-700 dark:text-blue-300">Cash</span>
                          <span className="font-semibold text-blue-900 dark:text-blue-100">${reports.balanceSheet.assets.current.cash.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-700 dark:text-blue-300">Accounts Receivable</span>
                          <span className="font-semibold text-blue-900 dark:text-blue-100">${reports.balanceSheet.assets.current.accountsReceivable.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-700 dark:text-blue-300">Inventory</span>
                          <span className="font-semibold text-blue-900 dark:text-blue-100">${reports.balanceSheet.assets.current.inventory.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-700 dark:text-blue-300">Prepaid Expenses</span>
                          <span className="font-semibold text-blue-900 dark:text-blue-100">${reports.balanceSheet.assets.current.prepaidExpenses.toLocaleString()}</span>
                        </div>
                        <div className="pt-2 border-t border-blue-300 dark:border-blue-700 flex justify-between font-bold">
                          <span className="text-blue-900 dark:text-blue-100">Total Current Assets</span>
                          <span className="text-blue-900 dark:text-blue-100">${reports.balanceSheet.assets.current.total.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                      <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">Fixed Assets</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-blue-700 dark:text-blue-300">Equipment</span>
                          <span className="font-semibold text-blue-900 dark:text-blue-100">${reports.balanceSheet.assets.fixed.equipment.toLocaleString()}</span>
                        </div>
                        <div className="pt-2 border-t border-blue-300 dark:border-blue-700 flex justify-between font-bold">
                          <span className="text-blue-900 dark:text-blue-100">Total Fixed Assets</span>
                          <span className="text-blue-900 dark:text-blue-100">${reports.balanceSheet.assets.fixed.total.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-4 border border-blue-300 dark:border-blue-700">
                      <div className="flex justify-between font-bold text-lg">
                        <span className="text-blue-900 dark:text-blue-100">Total Assets</span>
                        <span className="text-blue-900 dark:text-blue-100">${reports.balanceSheet.assets.totalAssets.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Liabilities & Equity</h3>
                  <div className="space-y-4">
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
                      <h4 className="font-semibold text-red-900 dark:text-red-100 mb-3">Current Liabilities</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-red-700 dark:text-red-300">Accounts Payable</span>
                          <span className="font-semibold text-red-900 dark:text-red-100">${reports.balanceSheet.liabilities.current.accountsPayable.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-red-700 dark:text-red-300">Accrued Expenses</span>
                          <span className="font-semibold text-red-900 dark:text-red-100">${reports.balanceSheet.liabilities.current.accruedExpenses.toLocaleString()}</span>
                        </div>
                        <div className="pt-2 border-t border-red-300 dark:border-red-700 flex justify-between font-bold">
                          <span className="text-red-900 dark:text-red-100">Total Current Liabilities</span>
                          <span className="text-red-900 dark:text-red-100">${reports.balanceSheet.liabilities.current.total.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
                      <h4 className="font-semibold text-red-900 dark:text-red-100 mb-3">Long-term Liabilities</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-red-700 dark:text-red-300">Loans</span>
                          <span className="font-semibold text-red-900 dark:text-red-100">${reports.balanceSheet.liabilities.longTerm.loans.toLocaleString()}</span>
                        </div>
                        <div className="pt-2 border-t border-red-300 dark:border-red-700 flex justify-between font-bold">
                          <span className="text-red-900 dark:text-red-100">Total Long-term Liabilities</span>
                          <span className="text-red-900 dark:text-red-100">${reports.balanceSheet.liabilities.longTerm.total.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                      <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-3">Equity</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-purple-700 dark:text-purple-300">Owner&apos;s Equity</span>
                          <span className="font-semibold text-purple-900 dark:text-purple-100">${reports.balanceSheet.equity.ownersEquity.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-purple-700 dark:text-purple-300">Retained Earnings</span>
                          <span className="font-semibold text-purple-900 dark:text-purple-100">${reports.balanceSheet.equity.retainedEarnings.toLocaleString()}</span>
                        </div>
                        <div className="pt-2 border-t border-purple-300 dark:border-purple-700 flex justify-between font-bold">
                          <span className="text-purple-900 dark:text-purple-100">Total Equity</span>
                          <span className="text-purple-900 dark:text-purple-100">${reports.balanceSheet.equity.totalEquity.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 border border-gray-300 dark:border-gray-700">
                      <div className="flex justify-between font-bold text-lg">
                        <span className="text-gray-900 dark:text-gray-100">Total Liabilities & Equity</span>
                        <span className="text-gray-900 dark:text-gray-100">
                          ${(reports.balanceSheet.liabilities.totalLiabilities + reports.balanceSheet.equity.totalEquity).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'cashFlow' && (
            <div className="space-y-6">
              <ChartCard title="Cash Flow Statement">
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={cashFlowData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                    <XAxis dataKey="month" className="text-gray-600 dark:text-gray-400" />
                    <YAxis className="text-gray-600 dark:text-gray-400" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="operating" stroke="#10b981" strokeWidth={2} name="Operating Activities" />
                    <Line type="monotone" dataKey="investing" stroke="#3b82f6" strokeWidth={2} name="Investing Activities" />
                    <Line type="monotone" dataKey="financing" stroke="#f59e0b" strokeWidth={2} name="Financing Activities" />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4 border border-emerald-200 dark:border-emerald-800">
                  <h4 className="text-sm font-medium text-emerald-700 dark:text-emerald-300 mb-2">Operating Activities</h4>
                  <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                    ${reports.cashFlow.operating.reduce((a, b) => a + b, 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                  <h4 className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">Investing Activities</h4>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    ${reports.cashFlow.investing.reduce((a, b) => a + b, 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
                  <h4 className="text-sm font-medium text-orange-700 dark:text-orange-300 mb-2">Financing Activities</h4>
                  <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                    ${reports.cashFlow.financing.reduce((a, b) => a + b, 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
