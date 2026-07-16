import { CreditCard, Wallet, Smartphone } from "lucide-react";

export default function RecentExpenses({ expenses = [] }) {
  const getPaymentIcon = (method) => {
    if (method === "Card") return <CreditCard className="w-3.5 h-3.5 mr-1" style={{ color: "var(--color-primary)" }} />;
    if (method === "UPI") return <Smartphone className="w-3.5 h-3.5 mr-1" style={{ color: "var(--color-secondary)" }} />;
    return <Wallet className="w-3.5 h-3.5 mr-1" style={{ color: "#22C55E" }} />;
  };

  return (
    <div
      className="rounded-2xl p-6 overflow-hidden"
      style={{
        background: "#fff",
        border: "1.5px solid var(--border-color)",
        boxShadow: "var(--shadow-card)"
      }}
    >
      <h3 className="text-xl font-bold mb-6" style={{ color: "var(--text-heading)" }}>Recent Expenses</h3>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr
              className="text-sm font-semibold"
              style={{ color: "var(--text-heading)", borderBottom: "2px solid var(--border-color)" }}
            >
              <th className="pb-3 pl-2">Expense / Category</th>
              <th className="pb-3">Amount</th>
              <th className="pb-3">Date</th>
              <th className="pb-3 pr-2">Method</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {expenses.length === 0 ? (
              <tr>
                <td colSpan="4" className="py-8 text-center" style={{ color: "var(--text-muted)" }}>
                  No recent expenses recorded.
                </td>
              </tr>
            ) : (
              expenses.slice(0, 5).map((expense) => (
                <tr
                  key={expense._id}
                  className="transition-colors"
                  style={{ borderBottom: "1px solid var(--border-color)" }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--bg-highlight)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <td className="py-3 pl-2 font-medium">
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "var(--text-heading)" }}>{expense.description || expense.category}</p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>{expense.category}</p>
                    </div>
                  </td>
                  <td className="py-3 font-semibold" style={{ color: "var(--text-heading)" }}>${expense.amount.toFixed(2)}</td>
                  <td className="py-3" style={{ color: "var(--text-muted)" }}>{new Date(expense.date).toLocaleDateString()}</td>
                  <td className="py-3 pr-2">
                    <span
                      className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium"
                      style={{
                        background: "var(--bg-highlight)",
                        border: "1px solid var(--border-color)",
                        color: "var(--text-primary)"
                      }}
                    >
                      {getPaymentIcon(expense.paymentMethod)}
                      {expense.paymentMethod}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
