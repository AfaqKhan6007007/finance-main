export const reports = {
  revenue: [12000, 18000, 24000, 20000, 28000, 30000],
  expenses: [8000, 10000, 15000, 12000, 14000, 16000],
  months: ["Apr", "May", "Jun", "Jul", "Aug", "Sep"],

  expenseBreakdown: [
    { name: "Salaries", value: 85000 },
    { name: "Operating", value: 55000 },
    { name: "Rent", value: 18000 },
    { name: "Utilities", value: 6500 },
  ],

  profitLoss: {
    revenue: {
      sales: 120000,
      service: 45000,
      interest: 1200,
      total: 166200
    },
    expenses: {
      salaries: 85000,
      operating: 55000,
      rent: 18000,
      utilities: 6500,
      total: 164500
    },
    netProfit: 1700
  },

  balanceSheet: {
    assets: {
      current: {
        cash: 45000,
        accountsReceivable: 32000,
        inventory: 28500,
        prepaidExpenses: 5200,
        total: 110700
      },
      fixed: {
        equipment: 75000,
        total: 75000
      },
      totalAssets: 185700
    },
    liabilities: {
      current: {
        accountsPayable: 18000,
        accruedExpenses: 8500,
        total: 26500
      },
      longTerm: {
        loans: 25000,
        total: 25000
      },
      totalLiabilities: 51500
    },
    equity: {
      ownersEquity: 87500,
      retainedEarnings: 46700,
      totalEquity: 134200
    }
  },

  cashFlow: {
    operating: [5000, 8000, -2000, 12000, 15000, 10000],
    investing: [-3000, -5000, 0, -8000, 0, -5000],
    financing: [0, 10000, -2000, 0, -3000, 0],
    months: ["Apr", "May", "Jun", "Jul", "Aug", "Sep"]
  }
};
