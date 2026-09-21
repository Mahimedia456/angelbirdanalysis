# AngelBird AI Satisfaction Context Combination Fix

Backend-only patch.

Problem fixed:
The UI could display Customer Feedback, Internal Note, and External Team Note, while the generated AI Summary/Recommended Action still over-weighted the customer comment.

New behavior:
- Uses every available text source.
- Explicitly reconciles contradictions between customer and team notes.
- Does not treat a missing note as evidence.
- Summary must represent all available context.
- Recommended Action must account for current internal/external handling.
- Evidence must contain at least one item from each available text source.
- Evidence capacity increased from 5 to 8 items.

Ticket 5673 expected interpretation:
Customer says there was no response, while the internal note says the invitation was forwarded to sales/marketing and marked solved. The analysis should identify a customer-visible communication/closure gap, not simply conclude that no internal action happened.

Install:
Merge into D:\angelbird-analytics

Verify:
```powershell
cd D:\angelbird-analytics
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
.\VERIFY-AI-SATISFACTION-CONTEXT-FIX.ps1
```

Restart backend:
```powershell
cd D:\angelbird-analytics\backend
npm run dev
```

Production:
Redeploy the backend/Vercel API after merging. Web and mobile both use the same AI endpoint, so no UI patch is required for this fix.
