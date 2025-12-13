export const payables = [
  { id: "PAY-001", vendor: "ABC Supplies", date: "2025-09-30", due: "2025-10-15", amount: 25000, status: "Pending", method: "Bank Transfer" },
  { id: "PAY-002", vendor: "Global Paints", date: "2025-09-25", due: "2025-10-05", amount: 18000, status: "Paid", method: "Cheque" },
  { id: "PAY-003", vendor: "ColorTech Ltd", date: "2025-09-28", due: "2025-10-12", amount: 34000, status: "Overdue", method: "Wire Transfer" },
  { id: "PAY-004", vendor: "Office Depot", date: "2025-09-20", due: "2025-10-20", amount: 15000, status: "Pending", method: "Bank Transfer" },
  { id: "PAY-005", vendor: "Tech Solutions", date: "2025-09-15", due: "2025-09-30", amount: 42000, status: "Paid", method: "Wire Transfer" },
  { id: "PAY-006", vendor: "BuildMart", date: "2025-09-22", due: "2025-10-08", amount: 28000, status: "Overdue", method: "Bank Transfer" },
  { id: "PAY-007", vendor: "Green Energy Co", date: "2025-09-27", due: "2025-10-18", amount: 12000, status: "Pending", method: "Cheque" },
  { id: "PAY-008", vendor: "Metro Logistics", date: "2025-09-18", due: "2025-10-02", amount: 9500, status: "Paid", method: "Bank Transfer" },
];

export const payablesStats = {
  totalPayables: 183500,
  paidInvoices: 69500,
  overdueInvoices: 62000,
  averagePaymentPeriod: 18,
};

export const payablesByVendor = [
  { vendor: "ColorTech Ltd", amount: 34000 },
  { vendor: "Tech Solutions", amount: 42000 },
  { vendor: "BuildMart", amount: 28000 },
  { vendor: "ABC Supplies", amount: 25000 },
  { vendor: "Global Paints", amount: 18000 },
  { vendor: "Office Depot", amount: 15000 },
];
