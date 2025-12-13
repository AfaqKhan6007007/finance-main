import DataTable from '@/components/ui/DataTable';
import { accounts } from '@/data/accounts';

interface Row{
    code: string;
    name: string;
    type: string;
    credit: number;
    debit: number;
}

export default function TrialBalance() {
  const trialBalanceData = accounts.map(account => {
    const isDebitBalance = ['Asset', 'Expense'].includes(account.type);
    return {
      name: account.name,
      code: account.code,
      type: account.type,
      debit: isDebitBalance ? account.balance : 0,
      credit: !isDebitBalance ? account.balance : 0,
      netBalance: account.balance
    };
  });

  const totalDebit = trialBalanceData.reduce((sum, item) => sum + item.debit, 0);
  const totalCredit = trialBalanceData.reduce((sum, item) => sum + item.credit, 0);
  const isBalanced = totalDebit === totalCredit;

  const columns = [
    { header: 'Account Code', accessor: 'code' },
    { header: 'Account Name', accessor: 'name' },
    {
      header: 'Type',
      accessor: 'type',
      render: (row: Record<string, unknown>) => {
        const entry = row as unknown as Row;
        return (
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            entry.type === 'Asset' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
            entry.type === 'Liability' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
            entry.type === 'Income' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
            entry.type === 'Expense' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
            'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
          }`}>
            {entry.type}
          </span>
        );
      }
    },
    {
      header: 'Debit',
      accessor: 'debit',
      render: (row: Record<string, unknown>) => {
        const entry = row as unknown as Row;
        return entry.debit > 0 ? (
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
            ${entry.debit.toLocaleString()}
          </span>
        ) : '-';
      }
    },
    {
      header: 'Credit',
      accessor: 'credit',
      render: (row: Record<string, unknown>) => {
        const entry = row as unknown as Row;
        return entry.credit > 0 ? (
          <span className="text-blue-600 dark:text-blue-400 font-semibold">
            ${entry.credit.toLocaleString()}
          </span>
        ) : '-';
      }
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Trial Balance</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Verification that total debits equal total credits</p>
      </div>

      <div className={`p-6 rounded-xl border ${
        isBalanced
          ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
          : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-medium mb-1 ${
              isBalanced
                ? 'text-emerald-700 dark:text-emerald-300'
                : 'text-red-700 dark:text-red-300'
            }`}>
              Trial Balance Status
            </p>
            <p className={`text-2xl font-bold ${
              isBalanced
                ? 'text-emerald-900 dark:text-emerald-100'
                : 'text-red-900 dark:text-red-100'
            }`}>
              {isBalanced ? 'Books are Balanced ✓' : 'Discrepancy Detected'}
            </p>
          </div>
          {isBalanced && (
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-800 flex items-center justify-center">
              <span className="text-3xl">✓</span>
            </div>
          )}
        </div>
      </div>

      <DataTable columns={columns} data={trialBalanceData} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Total Debits</h3>
          <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
            ${totalDebit.toLocaleString()}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Total Credits</h3>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            ${totalCredit.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
