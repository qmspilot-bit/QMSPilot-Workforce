# QMSPilot Workforce

**Pilot** is QMSPilot's supervised AI Chief of Staff. This first MVP converts operational evidence into a structured executive brief containing material findings, risks, decisions, prioritized actions, owners, due dates, recommended specialist agents, and objective verification.

## What the MVP does

- Accepts pasted text or a supported document such as PDF, DOCX, PPTX, XLSX, CSV, Markdown, or text.
- Uses the OpenAI Responses API with strict structured output.
- Produces an executive summary, risk-ranked findings, action board, decision queue, and briefing rhythm.
- Persists the last analysis in the user's browser for convenience.
- Exports the analysis as JSON and provides a print-friendly view.
- Runs in an explicitly supervised mode: Pilot recommends, while a human approves decisions and external actions.
- Includes a clearly labeled demonstration response when no API key is configured.

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Add `OPENAI_API_KEY` to `.env.local` to activate live analysis. `OPENAI_MODEL` defaults to `gpt-5.6`.

## Validation

```bash
npm run typecheck
npm run build
```

## Current safety boundaries

Pilot can analyze, summarize, prioritize, and recommend. It does not send messages, publish content, change customer records, make certification decisions, spend money, or deploy code. Those capabilities require explicit human approval and will be added through controlled tools in later phases.

## Roadmap

1. **Pilot:** chief-of-staff analysis and action coordination.
2. **Atlas:** quality, requirements, audit, CAPA, and evidence intelligence.
3. **Nexus:** market, prospect, customer, and growth intelligence.
4. **Forge:** product, testing, documentation, and engineering intelligence.
5. Persistent workspaces, approvals, audit logs, scheduled briefings, and multi-company configuration.

QMSPilot is the first company to use and prove the system. The architecture is intended to evolve into a configurable AI workforce for other organizations.
