export default function PackingProgress() {
  const percentage = 65;
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div
      className="rounded-2xl p-6 flex items-center justify-between"
      style={{
        background: "#fff",
        border: "1.5px solid var(--border-color)",
        boxShadow: "var(--shadow-card)"
      }}
    >
      <div>
        <h3 className="text-lg font-bold mb-1" style={{ color: "var(--text-heading)" }}>Packing Progress</h3>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Paris Trip</p>
        <div className="mt-4 flex space-x-4">
          <div>
            <p className="text-xs font-semibold uppercase" style={{ color: "var(--text-muted)" }}>Packed</p>
            <p className="text-xl font-bold" style={{ color: "#22C55E" }}>24</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase" style={{ color: "var(--text-muted)" }}>Left</p>
            <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>13</p>
          </div>
        </div>
      </div>
      
      <div className="relative w-24 h-24">
        <svg className="w-full h-full transform -rotate-90">
          {/* Track */}
          <circle
            strokeWidth="8"
            stroke="var(--border-color)"
            fill="transparent"
            r={radius}
            cx="48"
            cy="48"
          />
          {/* Progress */}
          <circle
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            stroke="url(#progressGradient)"
            fill="transparent"
            r={radius}
            cx="48"
            cy="48"
          />
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#06B6D4" />
            </linearGradient>
          </defs>
        </svg>
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-lg font-bold"
          style={{ color: "var(--text-heading)" }}
        >
          {percentage}%
        </div>
      </div>
    </div>
  );
}
