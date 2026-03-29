import { useEffect, useMemo, useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const REQUEST_TIMEOUT_MS = 20000;

const initialState = {
  name: "",
  age: 28,
  city: "Bengaluru",
  monthly_salary: 70000,
  monthly_side_income: 0,
  expected_salary_growth_rate: 8,
  fixed_expenses: 28000,
  variable_expenses: 14000,
  annual_expenses: 60000,
  emergency_savings: 80000,
  existing_investments: 120000,
  outstanding_debt: 200000,
  annual_debt_payment: 84000,
  term_insurance_cover: 0,
  health_insurance_cover: 250000,
  tax_saving_80c: 60000,
  tax_saving_80d: 8000,
  nps_investment: 0,
  retirement_age: 58,
  goals: [
    { name: "Home Down Payment", target_amount: 3000000, timeline_months: 84 },
    { name: "Retirement", target_amount: 25000000, timeline_months: 360 },
  ],
};

const demoProfile = {
  name: "Aarav Sharma",
  age: 31,
  city: "Pune",
  monthly_salary: 98000,
  monthly_side_income: 12000,
  expected_salary_growth_rate: 10,
  fixed_expenses: 32000,
  variable_expenses: 18000,
  annual_expenses: 90000,
  emergency_savings: 210000,
  existing_investments: 420000,
  outstanding_debt: 140000,
  annual_debt_payment: 72000,
  term_insurance_cover: 6000000,
  health_insurance_cover: 800000,
  tax_saving_80c: 150000,
  tax_saving_80d: 25000,
  nps_investment: 30000,
  retirement_age: 58,
  goals: [
    { name: "Home Down Payment", target_amount: 3500000, timeline_months: 72 },
    { name: "Retirement", target_amount: 30000000, timeline_months: 324 },
  ],
};

const fieldsByStep = [
  ["name", "age", "city"],
  ["monthly_salary", "monthly_side_income", "expected_salary_growth_rate"],
  ["fixed_expenses", "variable_expenses", "annual_expenses"],
  ["emergency_savings", "existing_investments", "outstanding_debt", "annual_debt_payment"],
  ["term_insurance_cover", "health_insurance_cover", "tax_saving_80c", "tax_saving_80d", "nps_investment", "retirement_age"],
];

function validateProfile(data) {
  const errors = {};
  const requiredText = ["name", "city"];
  requiredText.forEach((field) => {
    if (!String(data[field] || "").trim()) {
      errors[field] = "This field is required.";
    }
  });

  if (data.age < 18 || data.age > 70) errors.age = "Age must be between 18 and 70.";
  if (data.retirement_age <= 30 || data.retirement_age > 75) {
    errors.retirement_age = "Retirement age must be between 31 and 75.";
  }
  if (data.retirement_age <= data.age) {
    errors.retirement_age = "Retirement age must be greater than current age.";
  }

  const nonNegativeFields = [
    "monthly_salary",
    "monthly_side_income",
    "expected_salary_growth_rate",
    "fixed_expenses",
    "variable_expenses",
    "annual_expenses",
    "emergency_savings",
    "existing_investments",
    "outstanding_debt",
    "annual_debt_payment",
    "term_insurance_cover",
    "health_insurance_cover",
    "tax_saving_80c",
    "tax_saving_80d",
    "nps_investment",
  ];

  nonNegativeFields.forEach((field) => {
    const value = Number(data[field]);
    if (!Number.isFinite(value) || value < 0) {
      errors[field] = "Value must be zero or more.";
    }
  });

  const growth = Number(data.expected_salary_growth_rate);
  if (growth < 0 || growth > 100) {
    errors.expected_salary_growth_rate = "Expected salary growth must be between 0 and 100.";
  }

  (data.goals || []).forEach((goal, index) => {
    if (!String(goal.name || "").trim()) {
      errors[`goals.${index}.name`] = "Goal name is required.";
    }
    if (!Number.isFinite(Number(goal.target_amount)) || Number(goal.target_amount) < 0) {
      errors[`goals.${index}.target_amount`] = "Goal amount must be zero or more.";
    }
    if (!Number.isFinite(Number(goal.timeline_months)) || Number(goal.timeline_months) <= 0) {
      errors[`goals.${index}.timeline_months`] = "Timeline must be greater than 0 months.";
    }
  });

  return errors;
}

async function parseApiError(response, prefix) {
  let details = "";
  try {
    const body = await response.json();
    if (response.status === 422 && Array.isArray(body?.detail)) {
      details = body.detail
        .slice(0, 2)
        .map((item) => `${item.loc?.slice(1).join(".") || "field"}: ${item.msg}`)
        .join(" | ");
    } else if (typeof body?.detail === "string") {
      details = body.detail;
    }
  } catch {
    details = "";
  }

  if (response.status === 422) {
    return `${prefix} validation failed${details ? `: ${details}` : "."}`;
  }
  return `${prefix} failed with status ${response.status}${details ? `: ${details}` : "."}`;
}

async function fetchWithTimeout(url, options, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

function formatInr(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value || 0);
}

function formatLabel(value) {
  return value.replaceAll("_", " ");
}

function getScoreTone(score) {
  if (score >= 75) return "good";
  if (score >= 50) return "watch";
  return "risk";
}

function getScoreLabel(score) {
  if (score >= 75) return "Strong";
  if (score >= 50) return "Watch";
  return "Urgent";
}

function formatListItem(item) {
  if (item == null) return "";
  if (typeof item === "string") return item;
  if (typeof item === "number") return String(item);
  if (Array.isArray(item)) {
    return item.map((entry) => formatListItem(entry)).join(", ");
  }
  if (typeof item === "object") {
    return Object.entries(item)
      .map(([key, value]) => `${formatLabel(key)}: ${formatListItem(value)}`)
      .join(" | ");
  }
  return String(item);
}

function RingMeter({ value, label, size = 168, strokeWidth = 14 }) {
  const normalizedValue = Math.max(0, Math.min(100, Number(value) || 0));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (normalizedValue / 100) * circumference;

  return (
    <div className="ring-meter">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${label}: ${normalizedValue}`}>
        <circle className="ring-meter-track" cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} />
        <circle
          className={`ring-meter-fill tone-${getScoreTone(normalizedValue)}`}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>
      <div className="ring-meter-value">
        <strong>{normalizedValue}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

function StatusChip({ score }) {
  const tone = getScoreTone(score);
  return <span className={`status-chip tone-${tone}`}>{getScoreLabel(score)}</span>;
}

function RoadmapSection({ title, defaultOpen = false, children }) {
  return (
    <details className="roadmap-section" open={defaultOpen}>
      <summary>{title}</summary>
      <div className="roadmap-section-body">{children}</div>
    </details>
  );
}

function RoadmapTrend({ profile, roadmap }) {
  const points = useMemo(() => {
    const yearsToFire = Math.max(8, Math.min(20, Number(profile.retirement_age) - Number(profile.age) || 12));
    const monthlyIncome = Number(profile.monthly_salary) + Number(profile.monthly_side_income);
    const monthlyExpenses = Number(profile.fixed_expenses) + Number(profile.variable_expenses) + Number(profile.annual_expenses) / 12;
    const annualContribution = Math.max(0, (monthlyIncome - monthlyExpenses) * 12 * 0.65);

    let corpus = Math.max(0, Number(profile.existing_investments) + Number(profile.emergency_savings));
    const annualSeries = [];
    for (let year = 0; year <= yearsToFire; year += 1) {
      if (year > 0) {
        corpus = (corpus + annualContribution) * 1.1;
      }
      annualSeries.push({ year, corpus });
    }

    const sampleCount = 8;
    const sampled = [];
    for (let idx = 0; idx < sampleCount; idx += 1) {
      const seriesIndex = Math.round((idx * (annualSeries.length - 1)) / (sampleCount - 1));
      sampled.push(annualSeries[seriesIndex]);
    }
    return sampled;
  }, [profile]);

  const maxCorpus = Math.max(...points.map((item) => item.corpus), 1);
  const targetCorpus = (profile.goals || []).reduce((total, goal) => total + Number(goal.target_amount || 0), 0);
  const currentCorpus = points[0]?.corpus || 0;
  const targetLakhs = Math.round(targetCorpus / 100000);

  const polyline = points
    .map((item, idx) => {
      const x = (idx / (points.length - 1)) * 100;
      const y = 86 - (item.corpus / maxCorpus) * 68;
      return `${x},${y}`;
    })
    .join(" ");

  const modelUsed = roadmap?.model_used || "fallback";

  return (
    <div className="roadmap-curve-card">
      <div className="curve-head">
        <div>
          <p className="eyebrow">Your FIRE Roadmap</p>
          <h3>Projected Wealth Path</h3>
        </div>
        <span className="curve-badge">FIRE at age {profile.retirement_age}</span>
      </div>

      <div className="curve-canvas">
        <svg viewBox="0 0 100 90" preserveAspectRatio="none" role="img" aria-label="Projected roadmap trend line">
          <line x1="0" y1="86" x2="100" y2="86" className="curve-axis" />
          <polyline points={polyline} className="curve-line" />
          {points.map((item, idx) => {
            const x = (idx / (points.length - 1)) * 100;
            const y = 86 - (item.corpus / maxCorpus) * 68;
            return <circle key={`${item.year}-${idx}`} cx={x} cy={y} r="1.2" className="curve-dot" />;
          })}
        </svg>
      </div>

      <div className="curve-footer">
        <div className="curve-stat">
          <span>Current Balance</span>
          <strong>{formatInr(currentCorpus)}</strong>
        </div>
        <div className="curve-stat">
          <span>Target Corpus</span>
          <strong>{targetLakhs > 0 ? `${targetLakhs}L` : "Defined by goals"}</strong>
        </div>
        <div className="curve-stat">
          <span>Model</span>
          <strong>{modelUsed}</strong>
        </div>
      </div>
    </div>
  );
}

function NumberInput({ label, name, value, onChange, errorId }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type="number"
        name={name}
        value={value}
        onChange={onChange}
        aria-describedby={errorId}
      />
    </label>
  );
}

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem("finmentor-theme") || "light");
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [moneyHealth, setMoneyHealth] = useState(null);
  const [roadmap, setRoadmap] = useState(null);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("finmentor-theme", theme);
  }, [theme]);

  const progress = useMemo(() => Math.round(((step + 1) / fieldsByStep.length) * 100), [step]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    const numericFields = new Set([
      "age",
      "monthly_salary",
      "monthly_side_income",
      "expected_salary_growth_rate",
      "fixed_expenses",
      "variable_expenses",
      "annual_expenses",
      "emergency_savings",
      "existing_investments",
      "outstanding_debt",
      "annual_debt_payment",
      "term_insurance_cover",
      "health_insurance_cover",
      "tax_saving_80c",
      "tax_saving_80d",
      "nps_investment",
      "retirement_age",
    ]);

    setFormData((prev) => ({
      ...prev,
      [name]: numericFields.has(name) ? Number(value) : value,
    }));
    setValidationErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const updateGoal = (index, key, value) => {
    setFormData((prev) => {
      const nextGoals = [...prev.goals];
      nextGoals[index] = {
        ...nextGoals[index],
        [key]: key === "name" ? value : Number(value),
      };
      return { ...prev, goals: nextGoals };
    });
    setValidationErrors((prev) => {
      const fieldKey = `goals.${index}.${key}`;
      if (!prev[fieldKey]) return prev;
      const next = { ...prev };
      delete next[fieldKey];
      return next;
    });
  };

  const addGoal = () => {
    setFormData((prev) => ({
      ...prev,
      goals: [...prev.goals, { name: "", target_amount: 0, timeline_months: 12 }],
    }));
  };

  const removeGoal = (index) => {
    setFormData((prev) => ({
      ...prev,
      goals: prev.goals.filter((_, idx) => idx !== index),
    }));
  };

  const nextStep = () => setStep((prev) => Math.min(fieldsByStep.length - 1, prev + 1));
  const prevStep = () => setStep((prev) => Math.max(0, prev - 1));
  const loadDemoProfile = () => {
    setFormData(demoProfile);
    setStep(fieldsByStep.length - 1);
    setError("");
    setValidationErrors({});
  };

  const scoreBreakdown = useMemo(() => Object.entries(moneyHealth?.breakdown || {}), [moneyHealth]);
  const roadmapSummary = useMemo(() => Object.entries(roadmap?.roadmap?.summary || {}), [roadmap]);
  const goalSips = roadmap?.roadmap?.sip_plan?.goal_sips || [];
  const insuranceRecommendations = roadmap?.roadmap?.insurance_recommendations || {};
  const taxMoves = roadmap?.roadmap?.tax_moves || [];
  const emergencyFundPlan = roadmap?.roadmap?.emergency_fund_plan || {};
  const risks = roadmap?.roadmap?.risks || [];

  const runAnalysis = async () => {
    const errors = validateProfile(formData);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setError("Please fix form errors before generating results.");
      return;
    }

    setError("");
    setLoading(true);
    setMoneyHealth(null);
    setRoadmap(null);
    setValidationErrors({});

    try {
      const healthResponse = await fetchWithTimeout(`${API_BASE_URL}/api/money-health`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!healthResponse.ok) {
        throw new Error(await parseApiError(healthResponse, "Money health calculation"));
      }
      const healthData = await healthResponse.json();
      setMoneyHealth(healthData);

      const roadmapResponse = await fetchWithTimeout(`${API_BASE_URL}/api/fire-roadmap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!roadmapResponse.ok) {
        throw new Error(await parseApiError(roadmapResponse, "Roadmap generation"));
      }
      const roadmapData = await roadmapResponse.json();
      setRoadmap(roadmapData);
    } catch (requestError) {
      if (requestError?.name === "AbortError") {
        setError("Request timed out. Please try again.");
      } else {
        setError(requestError.message || "Unexpected error while generating analysis.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <header className="hero">
        <div className="hero-top">
          <div>
            <h1>FinMentor</h1>
            <p>AI-powered financial mentor for Indian savers</p>
          </div>
          <button
            type="button"
            className="secondary theme-toggle"
            onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
            aria-label="Toggle light and dark mode"
          >
            {theme === "dark" ? "Switch to Light" : "Switch to Dark"}
          </button>
        </div>
      </header>

      <section className="card">
        <div className="step-header step-header-top">
          <div>
            <h2>Onboarding Step {step + 1}/5</h2>
            <span>{progress}% complete</span>
          </div>
          <button type="button" className="secondary" onClick={loadDemoProfile}>Load Sample Profile</button>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>

        {step === 0 && (
          <div className="grid">
            <label className="field"><span>Name</span><input name="name" value={formData.name} onChange={handleChange} aria-invalid={Boolean(validationErrors.name)} /></label>
            {validationErrors.name && <p className="field-error">{validationErrors.name}</p>}
            <NumberInput label="Age" name="age" value={formData.age} onChange={handleChange} errorId={validationErrors.age ? "err-age" : undefined} />
            {validationErrors.age && <p className="field-error" id="err-age">{validationErrors.age}</p>}
            <label className="field"><span>City</span><input name="city" value={formData.city} onChange={handleChange} aria-invalid={Boolean(validationErrors.city)} /></label>
            {validationErrors.city && <p className="field-error">{validationErrors.city}</p>}
          </div>
        )}

        {step === 1 && (
          <div className="grid">
            <NumberInput label="Monthly Salary" name="monthly_salary" value={formData.monthly_salary} onChange={handleChange} />
            <NumberInput label="Monthly Side Income" name="monthly_side_income" value={formData.monthly_side_income} onChange={handleChange} />
              <NumberInput label="Expected Salary Growth (%)" name="expected_salary_growth_rate" value={formData.expected_salary_growth_rate} onChange={handleChange} errorId={validationErrors.expected_salary_growth_rate ? "err-growth" : undefined} />
              {validationErrors.expected_salary_growth_rate && <p className="field-error" id="err-growth">{validationErrors.expected_salary_growth_rate}</p>}
          </div>
        )}

        {step === 2 && (
          <div className="grid">
            <NumberInput label="Fixed Expenses / Month" name="fixed_expenses" value={formData.fixed_expenses} onChange={handleChange} />
            <NumberInput label="Variable Expenses / Month" name="variable_expenses" value={formData.variable_expenses} onChange={handleChange} />
            <NumberInput label="Annual One-time Expenses" name="annual_expenses" value={formData.annual_expenses} onChange={handleChange} />
          </div>
        )}

        {step === 3 && (
          <div className="grid">
            <NumberInput label="Emergency Savings" name="emergency_savings" value={formData.emergency_savings} onChange={handleChange} />
            <NumberInput label="Existing Investments" name="existing_investments" value={formData.existing_investments} onChange={handleChange} />
            <NumberInput label="Outstanding Debt" name="outstanding_debt" value={formData.outstanding_debt} onChange={handleChange} />
            <NumberInput label="Annual Debt Payment" name="annual_debt_payment" value={formData.annual_debt_payment} onChange={handleChange} />
          </div>
        )}

        {step === 4 && (
          <>
            <div className="grid">
              <NumberInput label="Term Insurance Cover" name="term_insurance_cover" value={formData.term_insurance_cover} onChange={handleChange} />
              <NumberInput label="Health Insurance Cover" name="health_insurance_cover" value={formData.health_insurance_cover} onChange={handleChange} />
              <NumberInput label="80C Investments" name="tax_saving_80c" value={formData.tax_saving_80c} onChange={handleChange} />
              <NumberInput label="80D Investments" name="tax_saving_80d" value={formData.tax_saving_80d} onChange={handleChange} />
              <NumberInput label="NPS Investment" name="nps_investment" value={formData.nps_investment} onChange={handleChange} />
              <NumberInput label="Retirement Age" name="retirement_age" value={formData.retirement_age} onChange={handleChange} errorId={validationErrors.retirement_age ? "err-retirement-age" : undefined} />
              {validationErrors.retirement_age && <p className="field-error" id="err-retirement-age">{validationErrors.retirement_age}</p>}
            </div>

            <div className="goal-wrap">
              <div className="goal-header">
                <h3>Life Goals</h3>
                <button type="button" onClick={addGoal}>+ Add Goal</button>
              </div>
              {formData.goals.map((goal, index) => (
                <div className="goal-row" key={`${goal.name}-${index}`}>
                  <input
                    placeholder="Goal name"
                    value={goal.name}
                    onChange={(event) => updateGoal(index, "name", event.target.value)}
                    aria-invalid={Boolean(validationErrors[`goals.${index}.name`])}
                  />
                  <input
                    type="number"
                    placeholder="Target amount"
                    value={goal.target_amount}
                    onChange={(event) => updateGoal(index, "target_amount", event.target.value)}
                    aria-invalid={Boolean(validationErrors[`goals.${index}.target_amount`])}
                  />
                  <input
                    type="number"
                    placeholder="Timeline in months"
                    value={goal.timeline_months}
                    onChange={(event) => updateGoal(index, "timeline_months", event.target.value)}
                    aria-invalid={Boolean(validationErrors[`goals.${index}.timeline_months`])}
                  />
                  <button type="button" className="danger" onClick={() => removeGoal(index)}>Remove</button>
                </div>
              ))}
              {Object.entries(validationErrors)
                .filter(([key]) => key.startsWith("goals."))
                .map(([key, message]) => (
                  <p className="field-error" key={key}>{message}</p>
                ))}
            </div>
          </>
        )}

        <div className="nav-row">
          <button type="button" disabled={step === 0} onClick={prevStep}>Back</button>
          {step < fieldsByStep.length - 1 ? (
            <button type="button" onClick={nextStep}>Next</button>
          ) : (
            <button type="button" className="primary" onClick={runAnalysis} disabled={loading}>
              {loading ? "Analyzing..." : "Generate Money Health + FIRE Plan"}
            </button>
          )}
        </div>

        {error && <p className="error" role="alert">{error}</p>}
      </section>

      {moneyHealth && (
        <section className="card result-card" aria-label="Money Health Score results" aria-live="polite">
          <div className="score-dashboard">
            <div className="score-panel">
              <p className="eyebrow">Money Health Score</p>
              <h2>{moneyHealth.grade}</h2>
              <p className="score-caption">A quick view of how resilient this financial profile looks today.</p>
              <RingMeter value={moneyHealth.total_score} label="out of 100" />
            </div>

            <div className="score-breakdown-panel">
              <div className="breakdown-heading">
                <h3>Category Health</h3>
                <p>Color-coded so judges can spot strengths and gaps immediately.</p>
              </div>
              <div className="breakdown-grid">
                {scoreBreakdown.map(([key, value]) => (
                  <div className="metric metric-score" key={key}>
                    <div className="metric-topline">
                      <span>{formatLabel(key)}</span>
                      <StatusChip score={value} />
                    </div>
                    <strong>{value}/100</strong>
                    <div className="metric-bar">
                      <div className={`metric-bar-fill tone-${getScoreTone(value)}`} style={{ width: `${value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {moneyHealth.insights?.length > 0 && (
            <>
              <h3>Key Insights</h3>
              <ul className="insight-list">
                {moneyHealth.insights.map((insight) => <li key={insight}>{insight}</li>)}
              </ul>
            </>
          )}

          <h3>Top Actions</h3>
          <ol>
            {moneyHealth.top_actions.map((action) => <li key={action}>{action}</li>)}
          </ol>
        </section>
      )}

      {roadmap && (
        <section className="card result-card" aria-label="FIRE Roadmap results" aria-live="polite">
          <RoadmapTrend profile={formData} roadmap={roadmap} />
          {roadmap.fallback_used && (
            <p className="fallback-banner" role="alert">LLM response unavailable. Showing deterministic fallback roadmap.</p>
          )}
          {roadmap.notes && <p>{roadmap.notes}</p>}

          <div className="roadmap-sections">
            <RoadmapSection title="Summary" defaultOpen>
              {roadmapSummary.length > 0 ? (
                <div className="summary-grid">
                  {roadmapSummary.map(([key, value]) => (
                    <div className="metric" key={key}>
                      <span>{formatLabel(key)}</span>
                      <strong>{typeof value === "number" ? formatInr(value) : String(value)}</strong>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-state">No summary returned for this roadmap.</p>
              )}

              {Object.keys(emergencyFundPlan).length > 0 && (
                <div className="subsection">
                  <h4>Emergency Fund Plan</h4>
                  <div className="summary-grid">
                    {Object.entries(emergencyFundPlan).map(([key, value]) => (
                      <div className="metric" key={key}>
                        <span>{formatLabel(key)}</span>
                        <strong>{typeof value === "number" ? formatInr(value) : String(value)}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </RoadmapSection>

            <RoadmapSection title="Year 1 Plan" defaultOpen>
              <ol>
                {(roadmap.roadmap?.year_1_action_plan || []).map((item, index) => <li key={`year-plan-${index}`}>{formatListItem(item)}</li>)}
              </ol>

              {risks.length > 0 && (
                <div className="subsection">
                  <h4>Risks to Watch</h4>
                  <ul className="insight-list">
                    {risks.map((risk, index) => <li key={`risk-${index}`}>{formatListItem(risk)}</li>)}
                  </ul>
                </div>
              )}
            </RoadmapSection>

            <RoadmapSection title="SIP Breakdown" defaultOpen>
              <div className="summary-grid">
                {"retirement_monthly_sip" in (roadmap.roadmap?.sip_plan || {}) && (
                  <div className="metric">
                    <span>Retirement monthly SIP</span>
                    <strong>{formatInr(roadmap.roadmap.sip_plan.retirement_monthly_sip)}</strong>
                  </div>
                )}
              </div>

              {goalSips.length > 0 && (
                <div className="goal-sip-list">
                  {goalSips.map((item) => (
                    <div className="metric goal-sip-card" key={`${item.goal}-${item.timeline_months}`}>
                      <span>{item.goal}</span>
                      <strong>{formatInr(item.suggested_monthly_sip)}</strong>
                      <p>Target: {formatInr(item.target_amount)} in {item.timeline_months} months</p>
                    </div>
                  ))}
                </div>
              )}

              {Object.keys(insuranceRecommendations).length > 0 && (
                <div className="subsection">
                  <h4>Insurance Targets</h4>
                  <div className="summary-grid">
                    {Object.entries(insuranceRecommendations).map(([key, value]) => (
                      <div className="metric" key={key}>
                        <span>{formatLabel(key)}</span>
                        <strong>{typeof value === "number" ? formatInr(value) : String(value)}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {taxMoves.length > 0 && (
                <div className="subsection">
                  <h4>Tax Moves</h4>
                  <ul className="insight-list">
                    {taxMoves.map((move, index) => <li key={`tax-${index}`}>{formatListItem(move)}</li>)}
                  </ul>
                </div>
              )}
            </RoadmapSection>
          </div>
        </section>
      )}
    </div>
  );
}
