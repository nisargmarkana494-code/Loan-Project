import React, { useState } from "react";

/* ==========================================================================
   LEDGER — Loan Default Risk Desk (React version)
   Single-file React app. Page navigation is handled with local state
   (no react-router available in this environment) — swap `page` state
   for real routes (react-router / Next.js) in your own project if needed.
   ========================================================================== */

const NAV_ITEMS = [
  { key: "home", label: "Home" },
  { key: "insights", label: "Data Insights" },
  { key: "model", label: "Model Info" },
  { key: "disclaimer", label: "Disclaimer" },
];

const DUMMY_PROFILES = [
  { age: 34, income: 62000, loanAmount: 18000, loanTerm: "36", creditScore: 668, dti: 27, employment: 5, homeOwnership: "mortgage", purpose: "debt_consolidation" },
  { age: 26, income: 38000, loanAmount: 22000, loanTerm: "48", creditScore: 589, dti: 41, employment: 1, homeOwnership: "rent", purpose: "medical" },
  { age: 45, income: 95000, loanAmount: 15000, loanTerm: "24", creditScore: 742, dti: 18, employment: 14, homeOwnership: "own", purpose: "home_improvement" },
  { age: 52, income: 71000, loanAmount: 40000, loanTerm: "60", creditScore: 611, dti: 38, employment: 9, homeOwnership: "mortgage", purpose: "small_business" },
];

const DEFAULT_FORM = DUMMY_PROFILES[0];

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

// Local mock scoring — replace with a fetch() to your trained model's API.
function runAssessment(data) {
  const creditRisk = clamp((750 - data.creditScore) / 450, 0, 1);
  const dtiRisk = clamp(data.dti / 55, 0, 1);
  const ltiRisk = clamp(data.loanAmount / Math.max(data.income, 1) / 0.9, 0, 1);
  const empStability = clamp(1 - data.employment / 12, 0, 1);
  const weighted = creditRisk * 0.4 + dtiRisk * 0.28 + ltiRisk * 0.22 + empStability * 0.1;
  const probability = clamp(weighted, 0.02, 0.97);
  return { probability, creditRisk, dtiRisk, ltiRisk, empStability };
}

/* ---------------- Shared chrome ---------------- */

function GlobalStyle() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');

      :root{
        --ink:#12181A; --ink-2:#1B2426; --ink-3:#212C2E;
        --paper:#ECE7DA; --paper-dim:#C9C2AE; --paper-dimmer:#8F8A79;
        --brass:#B08A3E; --brass-bright:#D9AE5C;
        --forest:#2F5C4B; --forest-bright:#3F7D63;
        --red-flag:#A8452F; --line: rgba(236,231,218,0.14);
      }
      .ledger-root{ background:var(--ink); color:var(--paper); font-family:'Inter',sans-serif; min-height:100vh; }
      .ledger-root *{ box-sizing:border-box; }
      .mono{ font-family:'JetBrains Mono',monospace; }
      .serif{ font-family:'Fraunces',serif; }

      .topbar{ display:flex; align-items:center; justify-content:space-between; padding:20px 48px;
        border-bottom:1px solid var(--line); position:sticky; top:0; background:rgba(18,24,26,0.92);
        backdrop-filter:blur(6px); z-index:50; }
      .brand{ display:flex; align-items:center; gap:12px; font-family:'Fraunces',serif; font-size:19px; }
      .brand-mark{ width:30px; height:30px; border:1.5px solid var(--brass-bright); border-radius:50%;
        display:flex; align-items:center; justify-content:center; font-family:'JetBrains Mono',monospace;
        font-size:12px; color:var(--brass-bright); flex-shrink:0; cursor:pointer; }
      .brand-name small{ display:block; font-size:10px; letter-spacing:0.14em; color:var(--paper-dim);
        text-transform:uppercase; margin-top:2px; }
      .navlinks{ display:flex; align-items:center; gap:26px; font-size:13px; }
      .navlinks button.navlink{ background:none; border:none; cursor:pointer; color:var(--paper-dim);
        padding:6px 0; border-bottom:1px solid transparent; font-family:'Inter',sans-serif; font-size:13px;
        transition:color .15s ease,border-color .15s ease; }
      .navlinks button.navlink:hover, .navlinks button.navlink.active{ color:var(--paper); border-bottom-color:var(--brass-bright); }
      .nav-cta{ background:var(--brass-bright); color:var(--ink); padding:9px 18px; border-radius:2px;
        font-weight:600; border:none; cursor:pointer; font-family:'Inter',sans-serif; font-size:13px; }
      .nav-cta:hover{ background:#EAC377; }

      .wrap{ max-width:1180px; margin:0 auto; padding:0 48px; }
      @media (max-width:640px){ .wrap{ padding:0 22px; } .topbar,.ftr{ padding-left:22px; padding-right:22px; } .navlinks{ display:none; } }

      .eyebrow{ font-family:'JetBrains Mono',monospace; font-size:11.5px; letter-spacing:0.16em;
        text-transform:uppercase; color:var(--brass-bright); display:flex; align-items:center; gap:10px; }
      .eyebrow::before{ content:""; width:22px; height:1px; background:var(--brass-bright); }

      .ledger-section{ border-bottom:1px solid var(--line); }
      .ledger-section.no-line{ border-bottom:none; }

      .btn{ display:inline-flex; align-items:center; gap:8px; font-weight:600; font-size:14.5px;
        padding:14px 28px; border-radius:2px; cursor:pointer; border:none; transition:transform .12s ease,background .15s ease; }
      .btn:hover{ transform:translateY(-1px); }
      .btn-primary{ background:var(--brass-bright); color:var(--ink); }
      .btn-primary:hover{ background:#EAC377; }
      .btn-ghost{ background:none; color:var(--paper); border:1px solid var(--line); }
      .btn-ghost:hover{ border-color:var(--paper-dim); }

      .ftr{ padding:26px 48px; border-top:1px solid var(--line); font-family:'JetBrains Mono',monospace;
        font-size:11px; color:var(--paper-dim); display:flex; justify-content:space-between; flex-wrap:wrap; gap:10px; }

      .stat-card, .panel{ border:1px solid var(--line); border-radius:4px; padding:20px 22px; }
      .stat-label{ font-family:'JetBrains Mono',monospace; font-size:11px; color:var(--paper-dim);
        text-transform:uppercase; letter-spacing:0.06em; }
      .stat-value{ font-family:'Fraunces',serif; font-size:30px; margin-top:8px; }
      .stat-value small{ font-family:'JetBrains Mono',monospace; font-size:13px; color:var(--paper-dim); margin-left:4px; }

      .bar-track{ width:100%; height:6px; background:var(--line); border-radius:3px; overflow:hidden; }
      .bar-fill{ height:100%; background:var(--brass-bright); border-radius:3px; transition:width .5s ease; }
      .bar-fill.green{ background:var(--forest-bright); }
      .bar-fill.red{ background:var(--red-flag); }

      /* ---- Home ---- */
      .hero{ padding:90px 0 70px; display:grid; grid-template-columns:1.1fr 0.9fr; gap:50px; align-items:center; }
      @media (max-width:900px){ .hero{ grid-template-columns:1fr; padding-top:56px; } }
      .hero h1{ font-family:'Fraunces',serif; font-weight:500; font-size:clamp(36px,4.8vw,60px); line-height:1.04; margin:20px 0 18px; }
      .hero p{ color:var(--paper-dim); font-size:16px; line-height:1.65; max-width:520px; }
      .hero-actions{ display:flex; gap:16px; margin-top:32px; flex-wrap:wrap; }
      .hero-panel{ border:1px solid var(--line); border-radius:6px; padding:28px; background:var(--ink-2); }
      .hero-panel .file-tag{ font-family:'JetBrains Mono',monospace; font-size:11px; letter-spacing:0.08em;
        text-transform:uppercase; color:var(--brass-bright); border-bottom:1px dashed var(--line); padding-bottom:14px; margin-bottom:16px; }
      .hp-row{ display:flex; justify-content:space-between; padding:9px 0; font-size:13.5px; border-bottom:1px solid var(--line); }
      .hp-row .k{ color:var(--paper-dim); }
      .hp-row .v{ font-family:'JetBrains Mono',monospace; }
      .verdict-line{ margin-top:18px; display:flex; align-items:center; justify-content:space-between; }
      .badge{ font-family:'Fraunces',serif; font-weight:600; font-size:13px; letter-spacing:0.06em;
        text-transform:uppercase; padding:6px 14px; border:2px solid var(--forest-bright); color:var(--forest-bright); border-radius:3px; }

      .section-pad{ padding:64px 0; }
      .section-head{ margin-bottom:40px; max-width:640px; }
      .section-head h2{ font-family:'Fraunces',serif; font-weight:500; font-size:clamp(24px,3vw,34px); margin:16px 0 10px; }
      .section-head p{ color:var(--paper-dim); font-size:14.5px; line-height:1.6; }

      .grid-3{ display:grid; grid-template-columns:repeat(3,1fr); gap:18px; }
      .grid-2{ display:grid; grid-template-columns:1fr 1fr; gap:16px; }
      @media (max-width:860px){ .grid-3,.grid-2{ grid-template-columns:1fr; } }

      .feature{ border:1px solid var(--line); border-radius:4px; padding:26px 24px; }
      .feature .num{ font-family:'JetBrains Mono',monospace; font-size:12px; color:var(--brass-bright); letter-spacing:0.08em; }
      .feature h3{ font-family:'Fraunces',serif; font-weight:500; font-size:19px; margin:14px 0 8px; }
      .feature p{ font-size:13.5px; color:var(--paper-dim); line-height:1.6; margin:0; }

      .steps{ display:grid; grid-template-columns:repeat(4,1fr); border:1px solid var(--line); border-radius:4px; overflow:hidden; }
      @media (max-width:860px){ .steps{ grid-template-columns:1fr; } }
      .step{ padding:24px 22px; border-right:1px solid var(--line); }
      .step:last-child{ border-right:none; }
      @media (max-width:860px){ .step{ border-right:none; border-bottom:1px solid var(--line); } }
      .step .tag{ font-family:'JetBrains Mono',monospace; font-size:11px; color:var(--paper-dim); }
      .step h4{ font-family:'Fraunces',serif; font-weight:500; font-size:16.5px; margin:10px 0 6px; }
      .step p{ font-size:13px; color:var(--paper-dim); margin:0; line-height:1.55; }

      .cta-band{ padding:60px 0; display:flex; align-items:center; justify-content:space-between; gap:24px; flex-wrap:wrap; }
      .cta-band h2{ font-family:'Fraunces',serif; font-weight:500; font-size:clamp(22px,3vw,30px); margin:0; max-width:460px; }

      /* ---- Predict page ---- */
      .page-head{ padding:48px 0 8px; }
      .page-head h1{ font-family:'Fraunces',serif; font-weight:500; font-size:clamp(28px,3.6vw,42px); margin:16px 0 10px; }
      .page-head p{ color:var(--paper-dim); font-size:14.5px; max-width:600px; line-height:1.6; }

      .predict-layout{ display:grid; grid-template-columns:1.15fr 0.85fr; }
      @media (max-width:960px){ .predict-layout{ grid-template-columns:1fr; } }
      .ledger-form{ padding:36px 44px 60px 0; border-right:1px solid var(--line); }
      .verdict-col{ padding:36px 0 60px 44px; }
      @media (max-width:960px){
        .ledger-form{ border-right:none; border-bottom:1px solid var(--line); padding:36px 0 40px; }
        .verdict-col{ padding:40px 0 60px; }
      }
      .ledger-head{ display:flex; justify-content:space-between; align-items:baseline; flex-wrap:wrap; gap:12px;
        margin-bottom:24px; padding-bottom:16px; border-bottom:1px dashed var(--line); }
      .ledger-head h2{ font-family:'Fraunces',serif; font-weight:500; font-size:21px; margin:0; }
      .fill-dummy{ background:none; border:1px solid var(--brass); color:var(--brass-bright);
        font-family:'JetBrains Mono',monospace; font-size:11px; letter-spacing:0.06em; text-transform:uppercase;
        padding:8px 12px; cursor:pointer; border-radius:2px; }
      .fill-dummy:hover{ background:var(--brass); color:var(--ink); }

      .field-row{ display:grid; grid-template-columns:30px 1fr 1fr; gap:16px; align-items:end; padding:15px 0; border-bottom:1px solid var(--line); }
      .field-row.single{ grid-template-columns:30px 1fr; }
      @media (max-width:640px){ .field-row{ grid-template-columns:1fr; } .field-idx{ display:none; } }
      .field-idx{ font-family:'JetBrains Mono',monospace; font-size:12px; color:var(--paper-dim); padding-bottom:10px; }
      .field{ display:flex; flex-direction:column; gap:7px; }
      .field label{ font-size:11px; letter-spacing:0.06em; text-transform:uppercase; color:var(--paper-dim); font-family:'JetBrains Mono',monospace; }
      .field input, .field select{ background:transparent; border:none; border-bottom:1px solid var(--paper-dim); color:var(--paper);
        font-family:'JetBrains Mono',monospace; font-size:15px; padding:6px 2px; outline:none; width:100%; }
      .field input:focus, .field select:focus{ border-bottom-color:var(--brass-bright); }
      .field select option{ background:var(--ink-2); color:var(--paper); }

      .submit-row{ margin-top:28px; display:flex; align-items:center; gap:18px; flex-wrap:wrap; }
      .submit-note{ font-size:12px; color:var(--paper-dim); font-family:'JetBrains Mono',monospace; }

      .verdict-head{ font-family:'JetBrains Mono',monospace; font-size:11.5px; letter-spacing:0.16em; text-transform:uppercase;
        color:var(--paper-dim); padding-bottom:16px; border-bottom:1px dashed var(--line); margin-bottom:28px; }
      .dial-wrap{ display:flex; flex-direction:column; align-items:center; padding:6px 0 8px; }
      .dial-value{ font-family:'Fraunces',serif; font-size:15px; color:var(--paper-dim); margin-top:-46px; }
      .dial-pct{ font-family:'JetBrains Mono',monospace; font-weight:700; font-size:38px; color:var(--paper); margin-top:6px; }
      .dial-pct span{ font-size:16px; color:var(--paper-dim); font-weight:400; }

      .stamp-zone{ display:flex; justify-content:center; margin:26px 0 6px; }
      .stamp{ font-family:'Fraunces',serif; font-weight:600; font-size:22px; letter-spacing:0.08em; text-transform:uppercase;
        padding:10px 26px; border:3px solid currentColor; border-radius:4px; transform:rotate(-4deg);
        opacity:0; transition:opacity .35s ease; }
      .stamp.show{ opacity:1; }
      .stamp.approve{ color:var(--forest-bright); }
      .stamp.review{ color:var(--brass-bright); }
      .stamp.decline{ color:var(--red-flag); }

      .breakdown{ margin-top:18px; display:flex; flex-direction:column; border-top:1px solid var(--line); }
      .breakdown-row{ display:flex; justify-content:space-between; align-items:center; padding:13px 2px;
        border-bottom:1px solid var(--line); font-size:13px; gap:16px; }
      .breakdown-row .label{ color:var(--paper-dim); flex-shrink:0; }
      .breakdown-row .val{ font-family:'JetBrains Mono',monospace; font-size:13px; }
      .breakdown-row .bar-track{ width:100px; height:5px; }

      .note-block{ margin-top:26px; padding-top:22px; font-size:12px; line-height:1.6; color:var(--paper-dim); border-top:1px dashed var(--line); }
      .note-block b{ color:var(--paper); }

      /* ---- Insights / Model ---- */
      .subhead{ font-family:'Fraunces',serif; font-weight:500; font-size:20px; margin:0 0 18px; }
      .dist-row{ display:grid; grid-template-columns:150px 1fr 50px; align-items:center; gap:14px; padding:11px 0; }
      .dist-row .lbl{ font-size:13px; color:var(--paper-dim); }
      .dist-row .pct{ font-family:'JetBrains Mono',monospace; font-size:12.5px; text-align:right; }

      .range-table{ width:100%; border-collapse:collapse; font-size:13.5px; }
      .range-table th{ text-align:left; font-family:'JetBrains Mono',monospace; font-size:11px; letter-spacing:0.06em;
        text-transform:uppercase; color:var(--paper-dim); padding:10px 12px; border-bottom:1px solid var(--line); }
      .range-table td{ padding:12px 12px; border-bottom:1px solid var(--line); }
      .range-table tr:last-child td{ border-bottom:none; }

      .kv-row{ display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid var(--line); font-size:13.5px; }
      .kv-row:last-child{ border-bottom:none; }
      .kv-row .k{ color:var(--paper-dim); }
      .kv-row .v{ font-family:'JetBrains Mono',monospace; }

      .metric-row{ padding:10px 0; border-bottom:1px solid var(--line); }
      .metric-row:last-child{ border-bottom:none; }
      .metric-top{ display:flex; justify-content:space-between; font-size:13.5px; margin-bottom:8px; }
      .metric-top .v{ font-family:'JetBrains Mono',monospace; font-weight:700; }

      .feature-row{ display:grid; grid-template-columns:150px 1fr 50px; align-items:center; gap:14px; padding:11px 0; }
      .feature-row .lbl{ font-family:'JetBrains Mono',monospace; font-size:13px; }
      .feature-row .pct{ font-family:'JetBrains Mono',monospace; font-size:12.5px; text-align:right; }

      .panel h3{ font-family:'JetBrains Mono',monospace; font-size:11px; letter-spacing:0.08em; text-transform:uppercase; color:var(--paper-dim); margin:0 0 18px; }

      /* ---- Disclaimer ---- */
      .content{ max-width:720px; padding:20px 0 70px; }
      .content h2{ font-family:'Fraunces',serif; font-weight:500; font-size:19px; margin:34px 0 12px; }
      .content p, .content li{ font-size:14.5px; color:var(--paper-dim); line-height:1.7; }
      .content ul{ padding-left:20px; }
      .flag{ border-left:3px solid var(--brass-bright); padding:16px 20px; background:var(--ink-2); margin:28px 0;
        font-size:13.5px; color:var(--paper); line-height:1.6; }
    `}</style>
  );
}

function Nav({ page, setPage }) {
  return (
    <div className="topbar">
      <div className="brand" onClick={() => setPage("home")} style={{ cursor: "pointer" }}>
        <div className="brand-mark">£D</div>
        <div className="brand-name">
          LEDGER
          <small>Loan Default Risk Desk</small>
        </div>
      </div>
      <nav className="navlinks">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.key}
            className={`navlink ${page === item.key ? "active" : ""}`}
            onClick={() => setPage(item.key)}
          >
            {item.label}
          </button>
        ))}
        <button className="nav-cta" onClick={() => setPage("predict")}>
          Predict Now ↗
        </button>
      </nav>
    </div>
  );
}

function Footer() {
  return (
    <div className="ftr">
      <span>Ledger · Loan Default Risk Desk — Prototype UI</span>
      <span>Not a lending decision — for demonstration only</span>
    </div>
  );
}

/* ---------------- Home ---------------- */

function HomePage({ setPage }) {
  return (
    <>
      <div className="wrap hero">
        <div>
          <div className="eyebrow">Early Warning System</div>
          <h1>
            Know a loan's
            <br />
            default risk before
            <br />
            you sign it off.
          </h1>
          <p>
            Ledger reads an applicant's income, credit history and existing debt, then returns a
            default-risk score in seconds — built for the same underwriting checks your desk runs
            manually every day.
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary" onClick={() => setPage("predict")}>
              Start assessment ↗
            </button>
            <button className="btn btn-ghost" onClick={() => setPage("model")}>
              Learn more
            </button>
          </div>
        </div>

        <div className="hero-panel">
          <div className="file-tag">Applicant file · demo</div>
          <div className="hp-row"><span className="k">Loan amount</span><span className="v">$18,000</span></div>
          <div className="hp-row"><span className="k">Credit score</span><span className="v">668</span></div>
          <div className="hp-row"><span className="k">Debt-to-income</span><span className="v">27%</span></div>
          <div className="hp-row"><span className="k">Employment length</span><span className="v">5 yrs</span></div>
          <div className="verdict-line">
            <span className="mono" style={{ fontSize: 12, color: "var(--paper-dim)" }}>
              Estimated default probability
            </span>
            <span className="badge">18% · Approved</span>
          </div>
        </div>
      </div>

      <section className="ledger-section">
        <div className="wrap section-pad">
          <div className="section-head">
            <div className="eyebrow">Why Ledger</div>
            <h2>One score, built from four signals underwriters already trust.</h2>
            <p>No black box. Every prediction is decomposed into the same factors a credit officer would check by hand.</p>
          </div>
          <div className="grid-3">
            <div className="feature">
              <div className="num">01</div>
              <h3>Instant results</h3>
              <p>Gradient-boosted classification returns a risk score in under a second — no queue, no manual pull of the credit file.</p>
            </div>
            <div className="feature">
              <div className="num">02</div>
              <h3>Confidence scores</h3>
              <p>Every prediction ships with a probability, not just a yes/no, so borderline files get flagged for review instead of a flat decline.</p>
            </div>
            <div className="feature">
              <div className="num">03</div>
              <h3>Secure &amp; private</h3>
              <p>Applicant data is processed for scoring only — nothing is retained beyond the session in this demo build.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="ledger-section">
        <div className="wrap section-pad">
          <div className="section-head">
            <div className="eyebrow">How it works</div>
            <h2>From application to verdict in four steps.</h2>
          </div>
          <div className="steps">
            <div className="step"><div className="tag">STEP 01</div><h4>Enter the file</h4><p>Income, loan amount, credit score, employment length and purpose.</p></div>
            <div className="step"><div className="tag">STEP 02</div><h4>Model scores it</h4><p>A trained classifier weighs each factor against historical defaults.</p></div>
            <div className="step"><div className="tag">STEP 03</div><h4>Read the breakdown</h4><p>See exactly which signal — credit, DTI, loan size — is driving the risk.</p></div>
            <div className="step"><div className="tag">STEP 04</div><h4>Decide</h4><p>Approve, send to manual review, or decline — the desk keeps the final call.</p></div>
          </div>
        </div>
      </section>

      <section className="ledger-section no-line">
        <div className="wrap cta-band">
          <h2>Ready to run an assessment?</h2>
          <button className="btn btn-primary" onClick={() => setPage("predict")}>
            Open the applicant form ↗
          </button>
        </div>
      </section>
    </>
  );
}

/* ---------------- Predict ---------------- */

function Dial({ pct }) {
  const circumference = 314;
  const offset = circumference - circumference * (pct / 100);
  const stroke = pct < 30 ? "var(--forest-bright)" : pct < 60 ? "var(--brass-bright)" : "var(--red-flag)";
  const rotation = -90 + (pct / 100) * 180;

  return (
    <svg width="240" height="140" viewBox="0 0 240 140">
      <path d="M 20 130 A 100 100 0 0 1 220 130" fill="none" stroke="var(--line)" strokeWidth="14" strokeLinecap="round" />
      <path
        d="M 20 130 A 100 100 0 0 1 220 130"
        fill="none"
        stroke={stroke}
        strokeWidth="14"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset .6s ease, stroke .3s ease" }}
      />
      <g
        style={{ transformOrigin: "120px 130px", transition: "transform .6s cubic-bezier(.2,.8,.2,1)" }}
        transform={`rotate(${rotation})`}
      >
        <line x1="120" y1="130" x2="120" y2="46" stroke="var(--paper)" strokeWidth="2.5" />
        <circle cx="120" cy="130" r="6" fill="var(--paper)" />
      </g>
    </svg>
  );
}

function PredictPage() {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [result, setResult] = useState(null);

  const update = (key) => (e) => {
    const val = e.target.type === "number" ? Number(e.target.value) : e.target.value;
    setForm((f) => ({ ...f, [key]: val }));
  };

  const loadSample = () => {
    const p = DUMMY_PROFILES[Math.floor(Math.random() * DUMMY_PROFILES.length)];
    setForm(p);
  };

  const submit = (e) => {
    e.preventDefault();
    setResult(runAssessment(form));
  };

  const pct = result ? Math.round(result.probability * 100) : 0;
  const stampText = !result ? "Pending" : pct < 30 ? "Approved" : pct < 60 ? "Needs review" : "Declined";
  const stampClass = !result ? "" : pct < 30 ? "approve" : pct < 60 ? "review" : "decline";

  return (
    <>
      <div className="wrap page-head">
        <div className="eyebrow">Gradient Classifier</div>
        <h1>Loan Default Prediction Form</h1>
        <p>Enter an applicant's details to assess default risk, or load a sample file to see the desk in action.</p>
      </div>

      <div className="wrap">
        <div className="predict-layout">
          <div className="ledger-form">
            <div className="ledger-head">
              <h2>Applicant File</h2>
              <button type="button" className="fill-dummy" onClick={loadSample}>
                Load sample applicant
              </button>
            </div>

            <form onSubmit={submit}>
              <div className="field-row">
                <div className="field-idx">01</div>
                <div className="field">
                  <label>Applicant age (years)</label>
                  <input type="number" value={form.age} min="18" max="90" onChange={update("age")} />
                </div>
                <div className="field">
                  <label>Annual income ($)</label>
                  <input type="number" value={form.income} min="0" step="1000" onChange={update("income")} />
                </div>
              </div>

              <div className="field-row">
                <div className="field-idx">02</div>
                <div className="field">
                  <label>Loan amount requested ($)</label>
                  <input type="number" value={form.loanAmount} min="0" step="500" onChange={update("loanAmount")} />
                </div>
                <div className="field">
                  <label>Loan term (months)</label>
                  <select value={form.loanTerm} onChange={update("loanTerm")}>
                    <option value="12">12</option>
                    <option value="24">24</option>
                    <option value="36">36</option>
                    <option value="48">48</option>
                    <option value="60">60</option>
                  </select>
                </div>
              </div>

              <div className="field-row">
                <div className="field-idx">03</div>
                <div className="field">
                  <label>Credit score (300–850)</label>
                  <input type="number" value={form.creditScore} min="300" max="850" onChange={update("creditScore")} />
                </div>
                <div className="field">
                  <label>Debt-to-income ratio (%)</label>
                  <input type="number" value={form.dti} min="0" max="100" step="0.1" onChange={update("dti")} />
                </div>
              </div>

              <div className="field-row">
                <div className="field-idx">04</div>
                <div className="field">
                  <label>Employment length (years)</label>
                  <input type="number" value={form.employment} min="0" max="50" onChange={update("employment")} />
                </div>
                <div className="field">
                  <label>Home ownership</label>
                  <select value={form.homeOwnership} onChange={update("homeOwnership")}>
                    <option value="own">Own</option>
                    <option value="mortgage">Mortgage</option>
                    <option value="rent">Rent</option>
                  </select>
                </div>
              </div>

              <div className="field-row single">
                <div className="field-idx">05</div>
                <div className="field">
                  <label>Loan purpose</label>
                  <select value={form.purpose} onChange={update("purpose")}>
                    <option value="debt_consolidation">Debt consolidation</option>
                    <option value="home_improvement">Home improvement</option>
                    <option value="auto">Auto purchase</option>
                    <option value="medical">Medical expense</option>
                    <option value="small_business">Small business</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="submit-row">
                <button type="submit" className="btn btn-primary">Run risk assessment</button>
                <span className="submit-note">— no data leaves this page, scoring runs locally</span>
              </div>
            </form>
          </div>

          <div className="verdict-col">
            <div className="verdict-head">Risk Assessment Result</div>

            <div className="dial-wrap">
              <Dial pct={pct} />
              <div className="dial-value">Estimated probability of default</div>
              <div className="dial-pct">{result ? pct : "—"} <span>%</span></div>
            </div>

            <div className="stamp-zone">
              <div className={`stamp ${result ? "show" : ""} ${stampClass}`}>{stampText}</div>
            </div>

            <div className="breakdown">
              <BreakdownRow label="Credit score signal" value={result?.creditRisk} />
              <BreakdownRow label="Debt-to-income signal" value={result?.dtiRisk} />
              <BreakdownRow label="Loan-to-income signal" value={result?.ltiRisk} />
              <BreakdownRow label="Employment stability" value={result?.empStability} />
            </div>

            <div className="note-block">
              <b>Wiring note:</b> this front end is UI-only. Replace <code>runAssessment()</code> with a{" "}
              <code>fetch()</code> call to your Flask <code>/predict</code> endpoint and feed the JSON response
              from your trained model into the same state to go live.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function BreakdownRow({ label, value }) {
  const pct = value != null ? Math.round(value * 100) : null;
  return (
    <div className="breakdown-row">
      <span className="label">{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div className="bar-track">
          <div className="bar-fill" style={{ width: `${pct ?? 0}%` }} />
        </div>
        <span className="val">{pct != null ? `${pct}%` : "—"}</span>
      </div>
    </div>
  );
}

/* ---------------- Data Insights ---------------- */

function InsightsPage() {
  const purposeDist = [
    ["Debt consolidation", 34],
    ["Auto purchase", 21],
    ["Home improvement", 18],
    ["Medical expense", 12],
    ["Small business", 9],
    ["Other", 6],
  ];
  const ranges = [
    ["Applicant age", "19", "38", "74", "Right-skewed, most applicants 25–45"],
    ["Annual income", "$9,200", "$54,800", "$310,000", "Log-transformed before training"],
    ["Loan amount", "$1,000", "$16,500", "$75,000", "Capped at 90th percentile"],
    ["Credit score", "320", "671", "849", "Roughly normal distribution"],
    ["Debt-to-income", "0%", "24%", "68%", "Above 45% strongly correlates with default"],
    ["Employment length", "0 yrs", "4 yrs", "38 yrs", "Zero-inflated for recent hires"],
  ];

  return (
    <>
      <div className="wrap page-head">
        <div className="eyebrow">Dataset Source</div>
        <h1>Data Insights</h1>
        <p>The model is trained on a cleaned loan-application dataset of 42,317 records, drawn from historical banking approvals and outcomes.</p>
      </div>

      <section className="ledger-section">
        <div className="wrap section-pad grid-3">
          <div className="stat-card"><div className="stat-label">Raw records</div><div className="stat-value">45,000</div></div>
          <div className="stat-card"><div className="stat-label">Rows removed</div><div className="stat-value">5.96% <small>duplicates / nulls</small></div></div>
          <div className="stat-card"><div className="stat-label">Final records</div><div className="stat-value">42,317 <small>used for training</small></div></div>
        </div>
      </section>

      <section className="ledger-section">
        <div className="wrap section-pad grid-2">
          <div>
            <div className="subhead">Loan purpose distribution</div>
            {purposeDist.map(([label, pct]) => (
              <div className="dist-row" key={label}>
                <span className="lbl">{label}</span>
                <div className="bar-track"><div className="bar-fill" style={{ width: `${pct}%` }} /></div>
                <span className="pct">{pct}%</span>
              </div>
            ))}
          </div>
          <div>
            <div className="subhead">Outcome balance (training set)</div>
            <div className="dist-row">
              <span className="lbl">Repaid in full</span>
              <div className="bar-track"><div className="bar-fill green" style={{ width: "78%" }} /></div>
              <span className="pct">78%</span>
            </div>
            <div className="dist-row">
              <span className="lbl">Defaulted</span>
              <div className="bar-track"><div className="bar-fill red" style={{ width: "22%" }} /></div>
              <span className="pct">22%</span>
            </div>
            <div className="note-block" style={{ marginTop: 20 }}>
              <b>Class imbalance handling:</b> the minority "defaulted" class was up-weighted during training rather than duplicated, to avoid overfitting on repeated rows.
            </div>
          </div>
        </div>
      </section>

      <section className="ledger-section no-line">
        <div className="wrap section-pad">
          <div className="subhead">Feature ranges observed in the dataset</div>
          <table className="range-table">
            <thead>
              <tr><th>Feature</th><th>Min</th><th>Median</th><th>Max</th><th>Notes</th></tr>
            </thead>
            <tbody>
              {ranges.map((row) => (
                <tr key={row[0]}>{row.map((cell, i) => <td key={i}>{cell}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

/* ---------------- Model Info ---------------- */

function ModelPage() {
  const featureImportance = [
    ["credit_score", 71.2],
    ["debt_to_income", 52.4],
    ["loan_to_income", 38.9],
    ["employment_length", 24.1],
    ["loan_amount", 19.6],
    ["annual_income", 14.3],
  ];

  return (
    <>
      <div className="wrap page-head" style={{ textAlign: "center" }}>
        <h1 className="serif">GradientBoostingClassifier</h1>
        <p style={{ margin: "0 auto" }}>This model includes the following hyperparameters and evaluation metrics. Trained using scikit-learn.</p>
      </div>

      <section className="ledger-section">
        <div className="wrap section-pad grid-3">
          <div className="panel">
            <h3>Model</h3>
            <div className="kv-row"><span className="k">Algorithm</span><span className="v">GradientBoostingClassifier</span></div>
            <div className="kv-row"><span className="k">Library</span><span className="v">scikit-learn</span></div>
            <div className="kv-row"><span className="k">Trained at</span><span className="v">3 Jan 2026, 11:20 am</span></div>
            <div className="kv-row"><span className="k">Feature count</span><span className="v">11</span></div>
          </div>

          <div className="panel">
            <h3>Hyperparameters</h3>
            <div className="kv-row"><span className="k">Estimators</span><span className="v">300</span></div>
            <div className="kv-row"><span className="k">Learning rate</span><span className="v">0.05</span></div>
            <div className="kv-row"><span className="k">Max depth</span><span className="v">4</span></div>
            <div className="kv-row"><span className="k">Min samples / leaf</span><span className="v">3</span></div>
          </div>

          <div className="panel">
            <h3>Performance</h3>
            {[["Accuracy", 81.4], ["F1 score", 76.9], ["ROC AUC", 85.3]].map(([label, val]) => (
              <div className="metric-row" key={label}>
                <div className="metric-top"><span className="k">{label}</span><span className="v">{val}%</span></div>
                <div className="bar-track"><div className="bar-fill" style={{ width: `${val}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="ledger-section no-line">
        <div className="wrap section-pad">
          <div className="panel">
            <h3>Top feature importance — features contributing most to predictions</h3>
            {featureImportance.map(([label, pct]) => (
              <div className="feature-row" key={label}>
                <span className="lbl">{label}</span>
                <div className="bar-track"><div className="bar-fill" style={{ width: `${pct}%` }} /></div>
                <span className="pct">{pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

/* ---------------- Disclaimer ---------------- */

function DisclaimerPage() {
  return (
    <>
      <div className="wrap page-head">
        <div className="eyebrow">Please Read</div>
        <h1>Disclaimer</h1>
      </div>
      <div className="wrap content">
        <div className="flag">
          Ledger is an academic / portfolio prototype. It does not connect to a real credit bureau, does not process
          real applicant data, and its predictions must never be used to approve, decline, or price an actual loan.
        </div>

        <h2>Not a lending decision</h2>
        <p>The risk score shown on the Predict page comes from a demonstration model trained on a public dataset for coursework purposes. It has not been validated for use in a real lending, underwriting, or credit-decisioning process.</p>

        <h2>No real personal data</h2>
        <p>Do not enter real names, national ID numbers, account numbers, or other personally identifying information into this form. All fields are designed for illustrative or sample values only.</p>

        <h2>Model limitations</h2>
        <ul>
          <li>Trained on a single historical dataset that may not reflect current lending conditions.</li>
          <li>Not audited for fairness or bias across demographic groups.</li>
          <li>Accuracy and confidence figures shown on the Model Info page are reported from the training run, not from live monitoring.</li>
        </ul>

        <h2>Academic context</h2>
        <p>This project was built as part of a Machine Learning / Deep Learning coursework SOP, covering data preprocessing, model training and evaluation, and deployment of a prediction interface.</p>
      </div>
    </>
  );
}

/* ---------------- App ---------------- */

export default function LedgerApp() {
  const [page, setPage] = useState("home");

  const pages = {
    home: <HomePage setPage={setPage} />,
    predict: <PredictPage />,
    insights: <InsightsPage />,
    model: <ModelPage />,
    disclaimer: <DisclaimerPage />,
  };

  return (
    <div className="ledger-root">
      <GlobalStyle />
      <Nav page={page} setPage={setPage} />
      {pages[page]}
      <Footer />
    </div>
  );
}
