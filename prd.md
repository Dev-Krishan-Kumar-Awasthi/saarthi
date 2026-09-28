# MASTER PROMPT — BUILD SAARTHI

## Runtime Reliability, Monitoring & Auditability Layer for Autonomous AI Systems

You are an expert hackathon product engineer, senior full-stack architect, AI safety engineer, UI/UX designer, backend engineer, and demo engineer.

I am participating in a hackathon.

Build a **functional, polished, judge-ready prototype** for the following problem statement:

---

# PROBLEM STATEMENT

## PS2 — Reliability, Monitoring & Auditability for Autonomous AI Systems

As AI systems become more capable of planning and executing multi-step tasks, simply producing a correct answer is no longer enough.

An autonomous system may:

* make a sequence of decisions
* use external tools
* react to changing information
* delegate work
* encounter unreliable information
* make unsafe decisions
* fail at one stage of a workflow
* retry incorrectly
* require human intervention

There is a need for a system that can observe, evaluate, and improve the reliability of autonomous AI workflows.

## Challenge

Build a solution that helps monitor and evaluate an autonomous AI system while it performs a multi-step task.

The system should identify:

1. Whether the system is progressing toward its objective.
2. Where failures or unexpected behavior occur.
3. Whether decisions are consistent with available information.
4. When the system should retry, change course, or stop.
5. When human intervention is required.
6. How the system's behavior can be reviewed after execution.

## Expected Outcome

The prototype must demonstrate:

* Monitoring an autonomous workflow.
* Detecting failures, anomalies, or unreliable behavior.
* Tracking important decisions and actions.
* Identifying situations requiring intervention.
* Providing an understandable execution record.
* Supporting evaluation and improvement of agent behavior.

## Constraints

The system must prioritize trustworthy autonomous operation.

Autonomous actions must remain within defined boundaries.

Important actions and decisions must be traceable.

The system must handle uncertainty and failure.

---

# PRODUCT NAME

Build the product as:

# SAARTHI

### Tagline

**The Governance Layer for Autonomous AI**

Secondary tagline:

**Observe. Verify. Decide. Audit.**

---

# CORE PRODUCT IDEA

SAARTHI is NOT another chatbot.

SAARTHI is NOT simply an AI agent.

SAARTHI is a **runtime governance and reliability layer placed between an autonomous AI agent and consequential actions.**

Core principle:

> An AI agent may propose an action, but consequential actions should pass through an independent governance layer before execution.

Conceptual architecture:

AI AGENT
↓
PROPOSED ACTION
↓
SAARTHI
├── Observe
├── Verify
├── Policy Check
├── Risk Assessment
├── Decision Gate
└── Audit
↓
ALLOW / RETRY / HUMAN REVIEW / BLOCK
↓
ACTION

The prototype must visually communicate this concept immediately.

---

# IMPORTANT PROTOTYPE STRATEGY

I need a working prototype quickly.

Do NOT spend most of the time building unnecessary infrastructure.

Prioritize:

1. Excellent UI/UX
2. Functional end-to-end demo
3. Real interaction
4. Real state transitions
5. Clear autonomous workflow visualization
6. Governance decisions
7. Failure/anomaly detection
8. Human intervention
9. Audit trail
10. Judge-friendly storytelling

The prototype must feel like a real product, not a static landing page.

---

# DEVELOPMENT RULE

Break the work into independent tasks and execute them sequentially.

Do NOT attempt to create everything randomly in one pass.

Use this development sequence:

TASK 1 — Architecture
TASK 2 — Project setup
TASK 3 — Core data model
TASK 4 — Autonomous workflow simulator
TASK 5 — Governance engine
TASK 6 — Monitoring engine
TASK 7 — Risk engine
TASK 8 — Decision gate
TASK 9 — Audit system
TASK 10 — Backend API
TASK 11 — Frontend dashboard
TASK 12 — Workflow visualization
TASK 13 — Scenario simulator
TASK 14 — Human intervention UI
TASK 15 — Audit explorer
TASK 16 — Reliability analytics
TASK 17 — Demo polish
TASK 18 — Testing
TASK 19 — Final verification

After each task, verify that the previous task works before continuing.

If a feature is too large for the available time, implement a clean MVP version rather than leaving the application broken.

---

# TECHNOLOGY

Use a simple, reliable stack.

Preferred:

Frontend:

* React
* Vite
* Tailwind CSS
* Lucide React
* Recharts if useful

Backend:

* Python
* FastAPI

Data:

* In-memory state or lightweight local JSON/SQLite

Do NOT introduce unnecessary infrastructure.

Avoid:

* Kubernetes
* microservices
* complex cloud infrastructure
* unnecessary authentication
* complicated databases
* unnecessary AI model integrations

The objective is a **functional hackathon prototype**, not a production SaaS.

---

# PRODUCT EXPERIENCE

The user should be able to open SAARTHI and immediately understand:

> "An autonomous AI agent is performing a task, and SAARTHI is watching every important step and deciding whether the agent should continue."

The main dashboard should resemble a modern AI operations / security control center.

Design direction:

* Premium dark interface
* Deep navy / charcoal background
* White text
* Blue/cyan accent
* Green = safe/allowed
* Yellow/orange = warning/retry/review
* Red = blocked/critical
* Subtle borders
* Soft shadows
* Glass-like cards where appropriate
* High information density
* Clean typography
* Professional enterprise AI dashboard
* No excessive gradients
* No childish illustrations
* No generic SaaS template appearance

---

# APPLICATION STRUCTURE

Create these major screens:

1. Overview
2. Live Workflow
3. Scenarios
4. Governance
5. Audit Trail
6. Reliability
7. Human Review

Sidebar:

SAARTHI logo

* Overview
* Live Monitor
* Scenarios
* Governance
* Audit Trail
* Reliability
* Human Review

Bottom sidebar:

● Runtime Active

Backend:
CONNECTED

---

# SCREEN 1 — OVERVIEW DASHBOARD

Create a powerful command-center dashboard.

Header:

SAARTHI
Runtime Governance

Status:

● SYSTEM MONITORING ACTIVE

Top metrics:

### Active Workflows

Example:
03

### Actions Evaluated

Example:
47

### Allowed

Example:
31

### Blocked

Example:
08

### Human Review

Example:
04

### Reliability Score

Example:
92%

Do not make these numbers meaningless decorations.

They should update when scenarios are executed.

---

# MAIN OVERVIEW SECTION

Create a large card:

## Autonomous Workflow Health

Show:

Reliability Score

92%

Progress toward objective

78%

Risk Level

MEDIUM

Current State

EXECUTING

Then show a small trend graph.

---

# LIVE EXECUTION TIMELINE

Display:

Agent started task

↓
Plan generated

↓
Customer account checked

↓
Order verified

↓
Refund amount calculated

↓
Policy evaluated

↓
Risk assessed

↓
Governance decision

↓
Action

Each node should have:

* timestamp
* status
* duration
* small icon

Clicking a node opens its details.

---

# GOVERNANCE PIPELINE

Create a visually impressive horizontal pipeline:

AGENT
↓
ACTION PROPOSAL
↓
OBSERVATION
↓
VERIFICATION
↓
POLICY
↓
RISK
↓
DECISION GATE
↓
AUDIT
↓
ACTION / REVIEW / BLOCK

Each stage should visually change:

Grey = pending
Blue = processing
Green = passed
Yellow = warning
Red = failed

Animate the pipeline when a workflow runs.

---

# IMPORTANT UI FEATURE

Add:

## "RUN AUTONOMOUS TASK"

Large primary button.

When clicked:

Do NOT simply show a fake loading animation.

Actually execute a simulated multi-step autonomous workflow.

The workflow must generate events.

Example:

Step 1:
Agent receives objective.

Step 2:
Agent plans.

Step 3:
Agent retrieves customer data.

Step 4:
Agent checks order.

Step 5:
Agent proposes refund.

Step 6:
SAARTHI verifies evidence.

Step 7:
SAARTHI evaluates policy.

Step 8:
SAARTHI calculates risk.

Step 9:
Decision Gate decides.

Step 10:
Action is allowed, retried, sent to human review, or blocked.

Step 11:
Audit event is created.

The UI must show each step in real time.

---

# AUTONOMOUS TASK DEMO

Use a realistic but safe business workflow.

Scenario:

## CUSTOMER REFUND AGENT

Objective:

> "Process a customer refund request while respecting company refund policy."

Agent receives:

Customer:
Rahul Sharma

Order:
ORD-48291

Requested refund:
₹8,500

Available account balance:
₹10,000

Refund policy:
Maximum autonomous refund:
₹5,000

Evidence:

Order exists:
YES

Customer verified:
YES

Refund amount:
₹8,500

Policy threshold:
₹5,000

Now the autonomous agent proposes:

ACTION:
Issue ₹8,500 refund.

SAARTHI intercepts the proposal.

---

# GOVERNANCE BEHAVIOR

SAARTHI should evaluate:

## 1. Evidence Verification

Compare:

Agent claim
vs
Trusted data

Show:

✓ Customer verified
✓ Order verified
⚠ Refund exceeds autonomous limit

---

# 2. POLICY CHECK

Policy:

MAX_AUTONOMOUS_REFUND = ₹5,000

Requested:

₹8,500

Result:

POLICY VIOLATION

Severity:

HIGH

---

# 3. RISK ENGINE

Calculate a simple transparent risk score.

Use factors:

* Financial Impact
* Policy Severity
* Evidence Confidence
* Reversibility
* Anomaly Level

Show individual factors.

Example:

Financial Impact: 68
Policy Severity: 90
Evidence Confidence: 85
Reversibility: 60
Anomaly Level: 82

Overall Risk:

84 / 100

Risk:

HIGH

Make the calculation deterministic and explainable.

Do NOT claim that this is a scientifically validated risk model.

It is a prototype governance score.

---

# 4. DECISION GATE

Based on the scenario:

Risk HIGH
+
Policy violation
+
Amount exceeds autonomous boundary

Decision:

## HUMAN_REVIEW

Do not automatically execute the refund.

Show:

### Action Paused

Reason:

"Requested refund exceeds the autonomous authorization boundary."

Then show:

[ REVIEW ACTION ]

---

# HUMAN REVIEW

When clicked:

Open a detailed review panel.

Show:

Customer
Order
Requested Action
Evidence
Policy
Risk
Agent Reasoning Summary
Governance Findings
Audit ID

Buttons:

[ APPROVE ]
[ REJECT ]
[ MODIFY ]

For prototype purposes, these actions can update the workflow state.

Example:

Approve:

Action status:
HUMAN APPROVED

Reject:

Action status:
HUMAN REJECTED

Modify:

Allow amount to be changed to ₹5,000.

After human decision:

Create another audit event.

---

# IMPORTANT

The system should clearly distinguish:

AGENT DECISION

from

GOVERNANCE DECISION

from

HUMAN DECISION

Example:

Agent:
PROPOSED ₹8,500 REFUND

SAARTHI:
REQUIRES HUMAN REVIEW

Human:
APPROVED ₹5,000

This distinction is extremely important.

---

# SCENARIO SYSTEM

Create multiple predefined scenarios.

At minimum:

## Scenario 1 — SAFE ACTION

Title:

Verified Refund

Agent proposes:

₹2,000 refund

Policy:

Allowed

Risk:

Low

Decision:

ALLOW

---

## Scenario 2 — POLICY VIOLATION

Title:

Over-Limit Refund

Agent proposes:

₹8,500 refund

Policy limit:

₹5,000

Decision:

HUMAN_REVIEW

---

## Scenario 3 — HALLUCINATED INFORMATION

Title:

Incorrect Account Claim

Agent claims:

Balance = ₹15,000

Trusted data:

Balance = ₹10,000

Decision:

BLOCK

Reason:

Evidence mismatch.

---

## Scenario 4 — MISSING EVIDENCE

Title:

Unsupported Action

Agent proposes refund.

But supporting order verification is missing.

Decision:

RETRY or HUMAN_REVIEW

depending on governance logic.

---

## Scenario 5 — SUSPICIOUS / REPLAYED ACTION

Title:

Repeated Action

Agent submits the same sensitive action multiple times.

Detect:

Repeated action ID / duplicate request.

Decision:

BLOCK

or

HUMAN_REVIEW

---

# SCENARIO PAGE

Create a beautiful scenario selection interface.

Cards:

SAFE ACTION
POLICY VIOLATION
HALLUCINATION
MISSING EVIDENCE
REPLAY ATTACK

Each card displays:

* description
* risk
* expected governance response
* Run Scenario button

When user runs one:

Show the complete pipeline.

---

# LIVE MONITOR PAGE

This page should feel like a runtime observability system.

Top:

LIVE AUTONOMOUS WORKFLOW

Status:

● EXECUTING

Current objective:

"Process customer refund request"

Show:

## Current Agent Step

"Evaluating refund amount"

Then:

Agent Activity Feed

10:41:02
Agent initialized

10:41:04
Customer retrieved

10:41:05
Order verified

10:41:07
Refund proposed

10:41:07
SAARTHI interception triggered

10:41:08
Evidence verification complete

10:41:08
Policy violation detected

10:41:09
Risk score calculated

10:41:09
Human review required

These should be generated dynamically.

---

# ANOMALY DETECTION

Create an:

## ANOMALIES

panel.

Example:

⚠ POLICY VIOLATION
Refund exceeds autonomous threshold.

⚠ EVIDENCE MISMATCH
Agent claim differs from trusted state.

⚠ REPEATED ACTION
Same action submitted twice.

Clicking an anomaly should open details.

---

# PROGRESS MONITORING

The system must show whether the agent is progressing toward its objective.

Create:

## OBJECTIVE PROGRESS

Task:

Process refund request

Progress:

78%

Completed:

4 / 6 steps

Current:

Governance Review

Blocked:

0

Warnings:

1

Use a progress bar.

Also show:

Expected next step

"Human decision"

---

# GOVERNANCE PAGE

Create a detailed governance console.

Sections:

### Policy Engine

Policy:
refund.autonomous_limit

Limit:
₹5,000

Observed:
₹8,500

Result:
VIOLATION

### Verification Engine

Fields checked:

customer_id ✓
order_id ✓
refund_amount ⚠

### Risk Engine

Risk:
84 / 100

Level:
HIGH

### Decision Gate

Final:

HUMAN_REVIEW

Reason:

Action exceeds defined autonomy boundary.

---

# DECISION MATRIX

Create a small table:

| Condition                         | Result       |
| --------------------------------- | ------------ |
| Verified + Low Risk + Policy Pass | ALLOW        |
| Temporary Failure                 | RETRY        |
| Missing Evidence                  | HUMAN_REVIEW |
| High Risk                         | HUMAN_REVIEW |
| Critical Policy Violation         | BLOCK        |
| Evidence Contradiction            | BLOCK        |

Make the implementation follow this logic consistently.

---

# AUDIT TRAIL PAGE

This is one of the most important pages.

Title:

## Immutable Audit Trail

Subtitle:

Every important action and governance decision is recorded.

Show timeline:

EVENT 001
Agent started

EVENT 002
Customer verified

EVENT 003
Refund proposed

EVENT 004
Policy violation detected

EVENT 005
Risk calculated

EVENT 006
Human review requested

EVENT 007
Human decision

Each event shows:

Event ID
Timestamp
Actor
Action
Decision
Risk
Integrity Status

Example:

EVENT-0006

Actor:
SAARTHI

Action:
Governance Decision

Decision:
HUMAN_REVIEW

Integrity:
✓ VERIFIED

---

# AUDIT INTEGRITY

Create a panel:

## AUDIT CHAIN STATUS

✓ Chain integrity verified

Show:

Genesis
↓
Event 001
↓
Event 002
↓
Event 003
↓
Event 004
↓
Event 005

Use hash-chain terminology carefully.

If implementing cryptographic hashing:

previous_hash
+
event_data
→
current_hash

Do NOT call it blockchain.

Use:

"TAMPER-EVIDENT AUDIT CHAIN"

Explain visually:

Changing an earlier event causes later hash verification to fail.

For a prototype, implement this locally with SHA-256/HMAC if practical.

---

# AUDIT EVENT DETAIL

Click an event.

Open modal/panel:

Event ID

Timestamp

Actor

Event Type

Action

Input

Evidence

Policy Result

Risk

Decision

Previous Hash

Current Hash

Integrity

---

# RELIABILITY PAGE

Create:

## Agent Reliability

Metrics:

Overall Reliability
92%

Successful Runs
31

Retries
6

Human Reviews
4

Blocked Actions
8

Evidence Mismatches
3

Policy Violations
5

Create charts:

1. Decisions over time
2. Risk distribution
3. Failure categories
4. Workflow success rate

Use Recharts if available.

Charts must update from application state where practical.

---

# FAILURE ANALYSIS

Create:

## Failure Breakdown

Evidence mismatch
██████ 3

Policy violation
████████ 5

Missing evidence
██ 2

Repeated action
█ 1

Show:

Most common failure:

Policy violation

Recommended improvement:

"Strengthen pre-action policy validation for high-value actions."

This is an example of how SAARTHI supports improvement of agent behavior.

---

# HUMAN REVIEW PAGE

Create a queue:

## HUMAN REVIEW QUEUE

Cards containing:

Review ID

Action

Risk

Reason

Created

Status

Example:

REV-0031

Refund ₹8,500

HIGH RISK

Policy threshold exceeded

2 minutes ago

[ REVIEW ]

When clicked, open full decision context.

---

# NOTIFICATION SYSTEM

Add a notification/bell icon.

Generate notifications for:

* High-risk action
* Policy violation
* Evidence mismatch
* Human review required
* Workflow blocked
* Audit integrity issue

Unread count should update dynamically.

---

# GLOBAL SEARCH

Add a search field.

Allow searching:

* Event ID
* Scenario
* Customer
* Action
* Decision

For prototype, client-side search is sufficient.

---

# WORKFLOW DETAIL MODAL

Every workflow should be inspectable.

Clicking a workflow opens:

Objective

Agent

Current Step

Started At

Duration

Progress

Actions

Risk

Decisions

Anomalies

Audit Events

---

# REAL-TIME SIMULATION

The autonomous workflow must execute step-by-step.

Do not immediately display all results.

Use controlled delays such as:

500–1000 ms per stage.

Example:

0s:
Initialize

1s:
Plan

2s:
Retrieve evidence

3s:
Verify

4s:
Policy evaluation

5s:
Risk assessment

6s:
Decision

7s:
Audit

This creates a convincing live demonstration.

Include:

Pause

Resume

Stop

buttons if practical.

---

# STOP / RETRY BEHAVIOR

Demonstrate autonomous failure handling.

If a temporary error occurs:

Status:

RETRYING

Attempt:
2 / 3

Then:

Retry successful.

If retry limit is exceeded:

Status:

HUMAN_REVIEW

Do not create infinite retries.

---

# BOUNDARY ENFORCEMENT

Create a visible card:

## AUTONOMY BOUNDARY

The system must show:

Maximum autonomous refund:
₹5,000

Maximum retry attempts:
3

High-risk threshold:
70

Human approval required:
Above threshold

This makes the safety boundary visible to judges.

---

# AGENT vs SAARTHI

Create a clear comparison card:

## AGENT

Plans
Reasons
Uses tools
Proposes actions

## SAARTHI

Observes
Verifies
Checks policy
Calculates risk
Controls decision
Audits

This should communicate that SAARTHI is not competing with the agent.

It governs the agent.

---

# IMPORTANT CONCEPTUAL DISTINCTION

Display somewhere:

### Agent says:

"I believe this action is safe."

### SAARTHI asks:

"Is there sufficient evidence, does it satisfy policy, what is the risk, and should the action be allowed?"

This is a key product message.

---

# SYSTEM STATUS

Global header should show:

SAARTHI Runtime

● OPERATIONAL

Agent:
CONNECTED

Governance:
ACTIVE

Audit:
INTEGRITY VERIFIED

---

# BACKEND

Create clean FastAPI endpoints.

Suggested endpoints:

GET /health

POST /api/workflows/start

GET /api/workflows

GET /api/workflows/{id}

POST /api/scenarios/{scenario}/run

POST /api/governance/evaluate

GET /api/audit

GET /api/audit/{id}

GET /api/audit/verify

GET /api/metrics

POST /api/human-review/{id}/approve

POST /api/human-review/{id}/reject

POST /api/human-review/{id}/modify

Only implement endpoints actually needed.

Keep the backend simple.

---

# DATA MODEL

Create appropriate objects.

Example:

Workflow

{
id,
objective,
status,
progress,
currentStep,
startedAt,
completedAt,
riskScore,
decision
}

AgentAction

{
id,
workflowId,
agent,
actionType,
description,
evidence,
timestamp
}

GovernanceResult

{
verification,
policy,
risk,
decision,
reason
}

AuditEvent

{
id,
timestamp,
actor,
eventType,
payload,
previousHash,
currentHash
}

HumanReview

{
id,
workflowId,
reason,
risk,
status,
decision
}

---

# IMPORTANT ARCHITECTURAL RULE

Keep these responsibilities separate:

Agent:

PROPOSES

Verification:

CHECKS EVIDENCE

Policy:

CHECKS RULES

Risk:

CALCULATES RISK

Decision Gate:

DECIDES GOVERNANCE OUTCOME

Audit:

RECORDS WHAT HAPPENED

Human:

OVERRIDES/APPROVES WHEN REQUIRED

Do not merge everything into one function.

---

# GOVERNANCE DECISION STATES

Support:

ALLOW

RETRY

HUMAN_REVIEW

BLOCK

Every decision must have:

Decision
Reason
Evidence
Risk
Policy result

---

# DECISION LOGIC

Implement deterministic logic.

Example:

IF evidence contradiction:
BLOCK

ELSE IF critical policy violation:
BLOCK

ELSE IF evidence missing:
HUMAN_REVIEW

ELSE IF risk >= 70:
HUMAN_REVIEW

ELSE IF temporary failure:
RETRY

ELSE:
ALLOW

Keep thresholds configurable.

Do not hardcode them throughout the codebase.

---

# EXPLAINABILITY

Every governance decision should answer:

1. What did the agent propose?
2. What evidence was available?
3. What did SAARTHI verify?
4. Which policy was triggered?
5. What was the risk?
6. Why was the final decision made?
7. What happened afterward?

Create a:

## WHY THIS DECISION?

panel.

Example:

Decision:
HUMAN_REVIEW

Why?

• Refund amount exceeds autonomous limit.
• Evidence is valid.
• Policy allows only ₹5,000 autonomous refund.
• Financial impact is significant.
• Human authorization is required.

---

# IMPORTANT: NO FAKE AI CLAIMS

Do NOT claim:

* "advanced AGI"
* "100% safe"
* "guaranteed secure"
* "fully autonomous safety"
* "perfect AI governance"

Do NOT pretend that a deterministic simulator is a real production AI model.

Instead use honest terminology:

"Autonomous workflow simulator"

"Prototype governance engine"

"Policy-based risk evaluation"

"Runtime monitoring"

"Tamper-evident audit trail"

---

# UI DETAILS

Use responsive layout.

Desktop-first because this is a hackathon presentation.

Target resolution:

1440 × 900

Sidebar:

250px

Main content:

remaining width

Use cards with consistent spacing.

Use typography hierarchy.

Avoid huge empty spaces.

Use icons from Lucide.

Use tooltips where useful.

Add hover states.

Add loading states.

Add empty states.

Add error states.

Add success states.

---

# MICRO-INTERACTIONS

Include:

* pipeline animations
* status transitions
* progress bars
* toast notifications
* modal transitions
* hover states
* active sidebar state
* pulsing runtime status
* animated risk gauge
* timeline reveal
* button loading states

Keep animations subtle and professional.

---

# LANDING / INITIAL EXPERIENCE

When application opens:

Show Overview dashboard.

Do not force the user through authentication.

Provide immediately visible button:

▶ RUN DEMO WORKFLOW

Below it:

"Simulate an autonomous refund agent and watch SAARTHI govern every consequential decision."

---

# DEMO MODE

Add a top-right:

DEMO MODE

When enabled, use deterministic scenarios.

This ensures the hackathon demonstration never fails because of external APIs.

---

# DEMO RESET

Add:

RESET DEMO

It should:

* clear workflow state
* clear notifications
* reset metrics
* reset audit events
* reset review queue

Then allow the demo to run again.

---

# SEED DATA

Preload realistic examples.

At least:

5 workflows

10+ audit events

Several governance decisions

At least:

* 1 ALLOW
* 1 RETRY
* 1 HUMAN_REVIEW
* 1 BLOCK

This makes the dashboard look meaningful on first load.

---

# IMPORTANT JUDGE STORY

The UI should allow me to demonstrate this story:

### STEP 1

"I start an autonomous refund workflow."

### STEP 2

"The agent independently proposes a refund."

### STEP 3

"SAARTHI intercepts the consequential action."

### STEP 4

"It verifies the agent's evidence against trusted state."

### STEP 5

"It checks the action against policy."

### STEP 6

"It calculates an explainable risk score."

### STEP 7

"The decision gate determines whether the agent can continue."

### STEP 8

"Because the refund exceeds the autonomous boundary, SAARTHI pauses the action and requests human review."

### STEP 9

"The human can approve, reject, or modify the action."

### STEP 10

"Every important decision is recorded in the audit trail."

### STEP 11

"After execution, the reliability dashboard shows what happened and where the agent failed."

This entire story must be demonstrable through the UI.

---

# DEMO SCENARIO

The default demo should produce:

Agent:

"Refund ₹8,500"

SAARTHI:

Evidence:
VALID

Policy:
VIOLATION

Risk:
84 HIGH

Decision:

HUMAN_REVIEW

Then human modifies:

₹5,000

SAARTHI:

Policy:
PASS

Risk:
42 MEDIUM

Decision:

ALLOW

Then:

Audit event created.

Final workflow:

COMPLETED

This is the main "wow" moment.

---

# SECOND WOW MOMENT

Run:

HALLUCINATED CLAIM

Agent:

"Customer balance = ₹15,000"

Trusted state:

₹10,000

SAARTHI:

EVIDENCE MISMATCH

Decision:

BLOCK

Show visually:

AGENT CLAIM
₹15,000

VS

TRUSTED STATE
₹10,000

Difference:

₹5,000

Then:

ACTION BLOCKED

This demonstrates why simply trusting an autonomous agent is insufficient.

---

# THIRD WOW MOMENT

Run:

REPLAYED ACTION

The same sensitive action is submitted twice.

SAARTHI detects duplicate/replayed action.

Show:

First request:
ALLOWED / REVIEWED

Second request:
BLOCKED

Reason:

"Duplicate action detected."

---

# RESPONSIVENESS

Desktop:
Full dashboard.

Tablet:
Collapsible sidebar.

Mobile:
Stack cards.

Desktop is highest priority.

---

# CODE QUALITY

Use:

* clear component structure
* reusable components
* meaningful variable names
* centralized constants
* modular governance logic
* no duplicated business logic
* error handling
* comments for important governance logic
* clean API layer

Avoid giant App.jsx if possible.

---

# PROJECT STRUCTURE

Prefer:

src/
components/
pages/
services/
hooks/
data/
utils/
types/
styles/

backend/
app/
routes/
services/
models/
audit/
data/

Keep the structure understandable.

---

# ERROR HANDLING

If backend unavailable:

Frontend must not crash.

Show:

⚠ GOVERNANCE BACKEND OFFLINE

with:

Retry connection

Demo mode can still operate locally if possible.

---

# SECURITY DEMONSTRATION

Include a small Security / Integrity section.

Show:

Policy enforcement
Evidence verification
Action boundary
Audit integrity
Human approval
Replay detection

Do not claim production-grade security unless implemented.

---

# ACCESSIBILITY

Use:

* semantic buttons
* readable contrast
* keyboard-friendly controls
* aria-labels where appropriate
* clear status text

---

# PERFORMANCE

Do not over-engineer.

The prototype should start quickly.

Avoid unnecessary dependencies.

Avoid unnecessary API calls.

---

# FINAL DEMO CHECKLIST

Before finishing, verify:

[ ] App starts successfully.

[ ] Dashboard loads.

[ ] Sidebar navigation works.

[ ] Demo workflow works.

[ ] Workflow animates step-by-step.

[ ] Governance pipeline updates.

[ ] Verification works.

[ ] Policy evaluation works.

[ ] Risk score appears.

[ ] Decision gate works.

[ ] ALLOW works.

[ ] RETRY works.

[ ] HUMAN_REVIEW works.

[ ] BLOCK works.

[ ] Human approval works.

[ ] Human rejection works.

[ ] Human modification works.

[ ] Audit events are generated.

[ ] Audit timeline works.

[ ] Audit integrity status works.

[ ] Reliability metrics update.

[ ] Scenario page works.

[ ] Hallucination scenario works.

[ ] Policy violation scenario works.

[ ] Replay scenario works.

[ ] Notifications work.

[ ] Reset works.

[ ] Backend errors do not crash UI.

[ ] No fake buttons.

[ ] No dead navigation.

[ ] No console errors.

[ ] No broken imports.

[ ] No placeholder lorem ipsum.

---

# PRIORITY ORDER

If time becomes limited, prioritize exactly in this order:

P0 — MUST HAVE

1. Dashboard
2. Run Demo
3. Autonomous workflow simulation
4. Governance pipeline
5. Verification
6. Policy
7. Risk
8. Decision Gate
9. Human Review
10. Audit Trail

P1 — IMPORTANT

11. Scenario selector
12. Reliability analytics
13. Notifications
14. Failure/anomaly panel
15. Workflow detail

P2 — POLISH

16. Animations
17. Charts
18. Search
19. Tooltips
20. Additional responsive optimization

Do not sacrifice P0 functionality for P2 visual polish.

---

# CRITICAL IMPLEMENTATION RULE

If you cannot implement a complex feature reliably within the prototype:

Implement the smallest functional version that demonstrates the concept.

For example:

Instead of building a real distributed autonomous agent platform:

build a deterministic autonomous workflow simulator.

Instead of building production authentication:

use demo mode.

Instead of building a distributed event streaming system:

use local event state.

Instead of building a complex ML risk model:

use a transparent deterministic risk engine.

The judge should see the architecture and working behavior clearly.

---

# DO NOT BUILD

Do NOT waste time building:

* login/signup
* payment system
* user profiles
* social features
* chat system
* unnecessary AI chatbot
* unnecessary LLM integrations
* complex admin panel
* Kubernetes
* cloud deployment infrastructure
* unnecessary database complexity

---

# FINAL PRODUCT FEEL

When a judge opens the application, it should feel like:

"An AI reliability control center."

Not:

"A student CRUD application."

The product should communicate:

AUTONOMOUS AI
+
OBSERVABILITY
+
VERIFICATION
+
POLICY
+
RISK
+
HUMAN OVERSIGHT
+
AUDITABILITY

---

# FINAL ARCHITECTURE

Use this architecture:

```
                AUTONOMOUS AI AGENT
                         │
                         │ Proposed Action
                         ▼
              ┌─────────────────────┐
              │      SAARTHI        │
              │ Runtime Governance  │
              └──────────┬──────────┘
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
    OBSERVATION     VERIFICATION      POLICY
          │              │              │
          └──────────────┼──────────────┘
                         ▼
                    RISK ENGINE
                         │
                         ▼
                   DECISION GATE
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
        ALLOW          RETRY        HUMAN REVIEW
          │              │              │
          └──────────────┼──────────────┘
                         ▼
                       AUDIT
                         │
                         ▼
                  ACTION / STOP
```

---

# FINAL OUTPUT REQUIRED FROM YOU

After implementation, provide me with:

1. What you built
2. Project structure
3. Technologies used
4. How to run it
5. Demo workflow
6. Main scenario explanations
7. Governance logic
8. Risk calculation
9. Audit mechanism
10. Important files
11. Known limitations
12. What is actually implemented
13. What is simulated
14. What should be explained to judges
15. Any remaining bugs

Most importantly:

DO NOT CLAIM SOMETHING IS IMPLEMENTED IF IT IS NOT.

If something is simulated, explicitly call it:

"SIMULATED FOR PROTOTYPE"

If something is deterministic, say:

"DETERMINISTIC PROTOTYPE LOGIC"

If something is future architecture, say:

"FUTURE ENHANCEMENT"

---

# EXECUTION INSTRUCTION

Start immediately.

First inspect the existing project/repository.

If a project already exists:

DO NOT destroy working code.

Reuse existing components where appropriate.

If no suitable project exists:

create the project from scratch.

Then execute the tasks sequentially:

1. Architecture
2. Setup
3. Data model
4. Workflow simulator
5. Governance
6. Monitoring
7. Risk
8. Decision Gate
9. Audit
10. Backend
11. Frontend
12. Integration
13. Scenarios
14. Human Review
15. Reliability
16. Polish
17. Testing
18. Final verification

After every major task, verify that the application still runs.

Do not stop at generating code.

Actually connect the pieces.

Actually run/build the application.

Fix errors.

Test the primary demo.

Ensure the final result is presentation-ready.

Use your strongest reasoning, product design, engineering judgment, and visualization ability.

The goal is not maximum code.

The goal is a **working, understandable, visually impressive, technically defensible prototype of SAARTHI that directly addresses PS2.**

Start building now.
