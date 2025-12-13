'use client'
import Card from '@/components/ui/TableCard';
import ChartCard from '@/components/ui/ChartCard';
import DataTable from '@/components/ui/DataTable';
import { reports } from '@/data/report';
import { journalEntries } from '@/data/journalEntries';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, PieLabelRenderProps } from 'recharts';
import { IJournalEntry } from '@/types/journalEntry';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

export default function Dashboard() {
  const chartData = reports.months.map((month, index) => ({
    month,
    income: reports.revenue[index],
    expense: reports.expenses[index],
  }));

  const pieData = reports.expenseBreakdown.map(item => ({
    name: item.name,
    value: item.value
  }));
  const renderPieLabel = (props: PieLabelRenderProps) => {
  const { name, percent } = props as PieLabelRenderProps & { percent: number };
  return `${name} ${((percent || 0) * 100).toFixed(0)}%`;
};

  const totalRevenue = reports.profitLoss.revenue.total;
  const totalExpenses = reports.profitLoss.expenses.total;
  const netProfit = totalRevenue - totalExpenses;
  const cashOnHand = 45000;

  const recentEntries = journalEntries.slice(0, 5);

  const columns = [
    { 
      header: 'Entry ID', 
      accessor: 'id' 
    },
    { 
      header: 'Date', 
      accessor: 'date',
      render: (row: Record<string, unknown>) => {
        const entry = row as unknown as IJournalEntry;
        return new Date(entry.date).toLocaleDateString();
      }
    },
    { 
      header: 'Account', 
      accessor: 'account' 
    },
    {
      header: 'Debit',
      accessor: 'debit', 
      render: (row: Record<string, unknown>) => {
        const entry = row as unknown as IJournalEntry;
        return entry.debit > 0 ? `$${entry.debit.toLocaleString()}` : '-';
      }
    
    },
    {
      header: 'Credit',
      accessor: 'credit', 
      render: (row: Record<string, unknown>) => {
        const entry = row as unknown as IJournalEntry;;
        return entry.credit > 0 ? `$${entry.credit.toLocaleString()}` : '-';
      }

    },
    { 
      header: 'Description', 
      accessor: 'description' 
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Overview of your financial performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card
          title="Total Revenue"
          value={`$${totalRevenue.toLocaleString()}`}
          icon="TrendingUp"
          trend="up"
          trendValue="+12.5%"
        />
        <Card
          title="Total Expenses"
          value={`$${totalExpenses.toLocaleString()}`}
          icon="TrendingDown"
          trend="down"
          trendValue="-3.2%"
        />
        <Card
          title="Net Profit"
          value={`$${netProfit.toLocaleString()}`}
          icon="DollarSign"
          trend="up"
          trendValue="+18.7%"
        />
        <Card
          title="Cash on Hand"
          value={`$${cashOnHand.toLocaleString()}`}
          icon="Wallet"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Monthly Income vs Expense">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
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
              <Bar dataKey="income" fill="#10b981" name="Income" radius={[8, 8, 0, 0]} />
              <Bar dataKey="expense" fill="#ef4444" name="Expense" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Expense Breakdown by Category">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderPieLabel}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Journal Entries</h3>
        <DataTable columns={columns} data={recentEntries} />
      </div>
    </div>
  );
}
