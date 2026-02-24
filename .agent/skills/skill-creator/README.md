# Skill Creator

Node.js tooling for creating, validating, and packaging skills (based on Anthropic's skill-creator).

## Usage

### Create New Skill

```bash
node .agent/skills/skill-creator/scripts/init_skill.js <skill-name> --path .agent/skills
```

Example:

```bash
node .agent/skills/skill-creator/scripts/init_skill.js frontend-code-review --path .agent/skills
```

Creates:

```
.agent/skills/frontend-code-review/
├── SKILL.md (template with TODOs)
├── scripts/example.js
├── references/api_reference.md
└── assets/example_asset.txt
```

### Validate Skill

```bash
node .agent/skills/skill-creator/scripts/quick_validate.js .agent/skills/my-skill
```

### Package Skill

```bash
node .agent/skills/skill-creator/scripts/package_skill.js .agent/skills/my-skill
```

Creates `my-skill.skill` (zip file) for distribution.

## What Agent Will Do

When you ask the agent to create a skill, it will:

1. Run `init_skill.js` to scaffold the skill structure
2. Customize `SKILL.md` based on your requirements
3. Add scripts/references/assets as needed
4. Validate with `quick_validate.js`
5. Package with `package_skill.js` if requested

## Next Steps After Creation

1. Edit `SKILL.md` - complete TODOs, write description
2. Customize/delete example files
3. Add your scripts, references, or assets
4. Validate before use
