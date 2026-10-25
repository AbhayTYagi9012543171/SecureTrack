export default function RiskScore({ score = 0, label = 'Risk score' }) {
  const value = Number.isFinite(Number(score)) ? Math.max(0, Math.min(100, Number(score))) : 0;
  const tone = value >= 75 ? 'critical' : value >= 50 ? 'high' : value >= 25 ? 'medium' : 'low';
  return <div className={`st-risk-score st-risk-score--${tone}`} aria-label={`${label}: ${value} out of 100`}>
    <div className="st-risk-score__top"><span>{label}</span><strong>{value}<small>/100</small></strong></div>
    <div className="st-risk-score__track" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow={value}><span style={{ width: `${value}%` }} /></div>
  </div>;
}
