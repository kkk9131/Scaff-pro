---
description: Execute task through the Autonomous Orchestration Ecosystem
---

# Orchestrated Task Execution

You MUST follow the orchestrator workflow before executing this task.

## Step 1: Read Orchestrator

Read `.claude/agents/orchestrator.md` completely to understand the orchestration logic.

## Step 2: Scan Agent Pool

Scan all existing agents:
- `.claude/agents/pool/specialized/` - Task-specific agents
- `.claude/agents/pool/integrated/` - Merged agents
- `.claude/agents/pool/elite/` - High-performing agents

For each agent found, read its definition (.md file).

## Step 3: Read Skill Sheets

Read corresponding skill sheets from `.claude/agents/manifests/` to understand:
- Agent capabilities
- Constraints
- Usage metrics
- Synergy hints

## Step 4: Calculate Coverage

Compare task requirements against available agent capabilities:
- List required skills for this task
- Calculate match percentage for each agent
- Identify potential synergies between agents

## Step 5: Decision Matrix

| Coverage Rate | Action |
|---------------|--------|
| **90%+** | Use existing agent directly |
| **60-90%** | Create integrated agent by merging sources |
| **Below 60%** | Create new specialized agent |

## Step 6: Agent Creation (if needed)

If creating new/integrated agent:
1. Use `.claude/agents/_template.md` as base
2. Save agent definition to appropriate `pool/` subdirectory
3. Create skill sheet in `manifests/`

## Step 7: Execute Task

Execute the following task using the selected/created agent:

$ARGUMENTS

## Step 8: Update Metrics

After task completion, update the agent's skill sheet in `manifests/`:
- Increment `usage_count`
- Update `success_rate`
- Set `last_used` to today's date
- Add entry to `task_history`

## Step 9: Elite Promotion Check

If agent meets criteria (usage_count >= 5 AND success_rate >= 0.8):
- Move agent from current location to `pool/elite/`
- Update skill sheet `tier: elite`

## Step 10: Report

Report:
- Agent used (name, tier, location)
- Action taken (used existing / created new / integrated)
- Coverage achieved
- Any agents created or promoted
