# Ledger — Loan Default Risk Desk (React)

A React + Vite prototype for a loan default prediction interface. Includes
Home, Predict, Data Insights, Model Info, and Disclaimer pages, navigated
via local component state.

## Run it

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173).

## Build for production

```bash
npm run build
npm run preview
```

## Where things live

- `src/LedgerApp.jsx` — the entire app: all pages, the form, the mock
  scoring logic, and the injected theme styles.
- `src/main.jsx` — mounts `<LedgerApp />` into `index.html`.

## Going live with a real model

The Predict page scores applicants locally in the browser via
`runAssessment()` inside `LedgerApp.jsx`. To connect a real trained model,
replace that function with a `fetch()` call to your backend, e.g.:

```js
async function runAssessment(data) {
  const res = await fetch('/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return res.json() // expects { probability, creditRisk, dtiRisk, ltiRisk, empStability }
}
```

and update the `submit` handler in the `PredictPage` component to `await`
it before calling `setResult(...)`.
