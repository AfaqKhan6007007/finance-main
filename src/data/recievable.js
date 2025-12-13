export const receivables = [
  { id: "REC-001", customer: "Greenline Stores", date: "2025-09-28", due: "2025-10-20", amount: 40000, status: "Pending", method: "Credit Card" },
  { id: "REC-002", customer: "Alpha Traders", date: "2025-09-10", due: "2025-09-30", amount: 22000, status: "Paid", method: "Wire Transfer" },
  { id: "REC-003", customer: "BlueSky Co", date: "2025-09-25", due: "2025-10-10", amount: 18000, status: "Overdue", method: "Bank Transfer" },
  { id: "REC-004", customer: "Sunrise Ltd", date: "2025-09-29", due: "2025-10-22", amount: 35000, status: "Pending", method: "Bank Transfer" },
  { id: "REC-005", customer: "Metro Mart", date: "2025-09-12", due: "2025-10-05", amount: 28000, status: "Paid", method: "Credit Card" },
  { id: "REC-006", customer: "TechHub Inc", date: "2025-09-20", due: "2025-10-08", amount: 15000, status: "Overdue", method: "Wire Transfer" },
  { id: "REC-007", customer: "Global Ventures", date: "2025-09-26", due: "2025-10-18", amount: 45000, status: "Pending", method: "Bank Transfer" },
  { id: "REC-008", customer: "Prime Retailers", date: "2025-09-08", due: "2025-09-28", amount: 19000, status: "Paid", method: "Cheque" },
];

export const receivablesStats = {
  totalReceivables: 222000,
  paidInvoices: 69000,
  overdueInvoices: 33000,
  collectionRate: 78,
};

export const receivablesByMonth = [
  { month: "Apr", amount: 42000 },
  { month: "May", amount: 38000 },
  { month: "Jun", amount: 55000 },
  { month: "Jul", amount: 48000 },
  { month: "Aug", amount: 62000 },
  { month: "Sep", amount: 69000 },
];
