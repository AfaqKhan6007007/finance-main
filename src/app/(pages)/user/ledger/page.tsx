'use client'
import { useState } from 'react';
import DataTable from '@/components/ui/DataTable';
import { ledgerData } from '@/data/ledger';

interface LedgerRow{
   date: string;
   description: string;
   debit: number;
   credit:number;
   balance: number 
}

type AccountName = keyof typeof ledgerData;

export default function Ledger() {
  const accountNames = Object.keys(ledgerData) as AccountName[];;
  const [selectedAccount, setSelectedAccount] = useState<AccountName>(accountNames[0]);

  const transactions = ledgerData[selectedAccount] || [];

  const columns = [
    { header: 'Date', accessor: 'date' },
    { header: 'Description', accessor: 'description' },
    {
      header: 'Debit',
      accessor: 'debit',
      render: (row: Record<string, unknown>) => {
        const entry = row as unknown as LedgerRow;
        return entry.debit > 0 ? (
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
            ${entry.debit.toLocaleString()}
          </span>
        ) : '-'
      }
    },
    {
      header: 'Credit',
      accessor: 'credit',
      render: (row: Record<string, unknown>) => {
        const entry = row as unknown as LedgerRow;
        return entry.credit > 0 ? (
          <span className="text-blue-600 dark:text-blue-400 font-semibold">
            ${entry.credit.toLocaleString()}
          </span>
        ) : '-'
      }
    },
    {
      header: 'Balance',
      accessor: 'balance',
      render: (row: Record<string, unknown>) => {
        const entry = row as unknown as LedgerRow;
        return `$${entry.balance.toLocaleString()}`;
      },
      cellClassName: 'font-bold text-gray-900 dark:text-white'
    },
  ];

  const finalBalance = transactions.length > 0 ? transactions[transactions.length - 1].balance : 0;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">General Ledger</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Detailed transaction history by account</p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Select Account
        </label>
        <select
          value={selectedAccount}
          onChange={(e) => setSelectedAccount(e.target.value as AccountName)}
          className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        >
          {accountNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      <DataTable columns={columns} data={transactions} />

      <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-6 border border-emerald-200 dark:border-emerald-800">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-emerald-700 dark:text-emerald-300 mb-1">Closing Balance</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400">{selectedAccount}</p>
          </div>
          <p className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">
            ${finalBalance.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
