#!/usr/bin/env node
/**
 * Skill Initializer - Creates a new skill from template (Node.js version)
 *
 * Usage: node init_skill.js <skill-name> --path <path>
 *
 * Examples:
 *   node init_skill.js my-new-skill --path .agent/skills
 *   node init_skill.js my-api-helper --path .agent/skills
 */

const fs = require('fs');
const path = require('path');

const SKILL_TEMPLATE = (skillName, skillTitle) => `---
name: ${skillName}
description: [TODO: Complete and informative explanation of what the skill does and when to use it. Include WHEN to use this skill - specific scenarios, file types, or tasks that trigger it.]
---

# ${skillTitle}

## Overview
[TODO: 1-2 sentences explaining what this skill enables]

## Structuring This Skill
[TODO: Choose the structure that best fits this skill's purpose. Common patterns:

**1. Workflow-Based** (best for sequential processes)
- Works well when there are clear step-by-step procedures
- Example: DOCX skill with "Workflow Decision Tree" → "Reading" → "Creating" → "Editing"
- Structure: ## Overview → ## Workflow Decision Tree → ## Step 1 → ## Step 2...

**2. Task-Based** (best for tool collections)
- Works well when the skill offers different operations/capabilities
- Example: PDF skill with "Quick Start" → "Merge PDFs" → "Split PDFs" → "Extract Text"
- Structure: ## Overview → ## Quick Start → ## Task Category 1 → ## Task Category 2...

**3. Reference/Guidelines** (best for standards or specifications)
- Works well for brand guidelines, coding standards, or requirements
- Example: Brand styling with "Brand Guidelines" → "Colors" → "Typography" → "Features"
- Structure: ## Overview → ## Guidelines → ## Specifications → ## Usage...

**4. Capabilities-Based** (best for integrated systems)
- Works well when the skill provides multiple interrelated features
- Example: Product Management with "Core Capabilities" → numbered capability list
- Structure: ## Overview → ## Core Capabilities → ### 1. Feature → ### 2. Feature...

Patterns can be mixed and matched as needed. Most skills combine patterns (e.g., start with task-based, add workflow for complex operations).

Delete this entire "Structuring This Skill" section when done - it's just guidance.]

## [TODO: Replace with the first main section based on chosen structure]
[TODO: Add content here. See examples in existing skills:
- Code samples for technical skills
- Decision trees for complex workflows
- Concrete examples with realistic user requests
- References to scripts/templates/references as needed]

## Resources
This skill includes example resource directories that demonstrate how to organize different types of bundled resources:

### scripts/
Executable code (Node.js/Bash/etc.) that can be run directly to perform specific operations.

**Examples from other skills:**
- Automation scripts, data processing utilities
- Helper scripts for repetitive tasks

**Appropriate for:** Node.js scripts, shell scripts, or any executable code that performs automation, data processing, or specific operations.
**Note:** Scripts may be executed without loading into context, but can still be read by Claude for patching or environment adjustments.

### references/
Documentation and reference material intended to be loaded into context to inform Claude's process and thinking.

**Examples from other skills:**
- Product management: communication.md, context_building.md - detailed workflow guides
- API reference documentation and query examples
- Schema documentation, company policies

**Appropriate for:** In-depth documentation, API references, database schemas, comprehensive guides, or any detailed information that Claude should reference while working.

### assets/
Files not intended to be loaded into context, but rather used within the output Claude produces.

**Examples from other skills:**
- Brand styling: PowerPoint template files (.pptx), logo files
- Frontend builder: HTML/React boilerplate project directories
- Typography: Font files (.ttf, .woff2)

**Appropriate for:** Templates, boilerplate code, document templates, images, icons, fonts, or any files meant to be copied or used in the final output.

---

**Any unneeded directories can be deleted.** Not every skill requires all three types of resources.
`;

const EXAMPLE_SCRIPT = (skillName) => `#!/usr/bin/env node
/**
 * Example helper script for ${skillName}
 * 
 * This is a placeholder script that can be executed directly.
 * Replace with actual implementation or delete if not needed.
 */

function main() {
  console.log('This is an example script for ${skillName}');
  // TODO: Add actual script logic here
  // This could be data processing, file conversion, API calls, etc.
}

if (require.main === module) {
  main();
}

module.exports = { main };
`;

const EXAMPLE_REFERENCE = (skillTitle) => `# Reference Documentation for ${skillTitle}

This is a placeholder for detailed reference documentation.
Replace with actual reference content or delete if not needed.

Example real reference docs from other skills:
- Comprehensive workflow guides
- API references and query examples

## When Reference Docs Are Useful
Reference docs are ideal for:
- Comprehensive API documentation
- Detailed workflow guides
- Complex multi-step processes
- Information too lengthy for main SKILL.md
- Content that's only needed for specific use cases

## Structure Suggestions
### API Reference Example
- Overview
- Authentication
- Endpoints with examples
- Error codes
- Rate limits

### Workflow Guide Example
- Prerequisites
- Step-by-step instructions
- Common patterns
- Troubleshooting
- Best practices
`;

const EXAMPLE_ASSET = `# Example Asset File

This placeholder represents where asset files would be stored.
Replace with actual asset files (templates, images, fonts, etc.) or delete if not needed.

Asset files are NOT intended to be loaded into context, but rather used within the output Claude produces.

## Common Asset Types
- Templates: .docx, boilerplate directories
- Images: .png, .jpg, .svg, .gif
- Fonts: .ttf, .otf, .woff, .woff2
- Boilerplate code: Project directories, starter files
- Icons: .ico, .svg
- Data files: .csv, .json, .xml, .yaml

Note: This is a text placeholder. Actual assets can be any file type.
`;

function titleCase(skillName) {
  return skillName
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function initSkill(skillName, basePath) {
  const skillDir = path.resolve(basePath, skillName);

  // Check if directory already exists
  if (fs.existsSync(skillDir)) {
    console.error(`❌ Error: Skill directory already exists: ${skillDir}`);
    return false;
  }

  try {
    // Create skill directory
    fs.mkdirSync(skillDir, { recursive: true });
    console.log(`✅ Created skill directory: ${skillDir}`);

    // Create SKILL.md
    const skillTitle = titleCase(skillName);
    const skillContent = SKILL_TEMPLATE(skillName, skillTitle);
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), skillContent);
    console.log('✅ Created SKILL.md');

    // Create scripts/ directory with example script
    const scriptsDir = path.join(skillDir, 'scripts');
    fs.mkdirSync(scriptsDir);
    const exampleScript = path.join(scriptsDir, 'example.js');
    fs.writeFileSync(exampleScript, EXAMPLE_SCRIPT(skillName));
    fs.chmodSync(exampleScript, 0o755);
    console.log('✅ Created scripts/example.js');

    // Create references/ directory with example reference doc
    const referencesDir = path.join(skillDir, 'references');
    fs.mkdirSync(referencesDir);
    fs.writeFileSync(path.join(referencesDir, 'api_reference.md'), EXAMPLE_REFERENCE(skillTitle));
    console.log('✅ Created references/api_reference.md');

    // Create assets/ directory with example asset
    const assetsDir = path.join(skillDir, 'assets');
    fs.mkdirSync(assetsDir);
    fs.writeFileSync(path.join(assetsDir, 'example_asset.txt'), EXAMPLE_ASSET);
    console.log('✅ Created assets/example_asset.txt');

    console.log(`\n✅ Skill '${skillName}' initialized successfully at ${skillDir}`);
    console.log('\nNext steps:');
    console.log('1. Edit SKILL.md to complete the TODO items and update the description');
    console.log('2. Customize or delete the example files in scripts/, references/, and assets/');
    console.log('3. Run the validator when ready to check the skill structure');

    return true;
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return false;
  }
}

function main() {
  const args = process.argv.slice(2);

  if (args.length < 3 || args[1] !== '--path') {
    console.log('Usage: node init_skill.js <skill-name> --path <path>');
    console.log('\nSkill name requirements:');
    console.log(' - Hyphen-case identifier (e.g., "data-analyzer")');
    console.log(' - Lowercase letters, digits, and hyphens only');
    console.log(' - Max 40 characters');
    console.log('\nExamples:');
    console.log('  node init_skill.js my-new-skill --path .agent/skills');
    console.log('  node init_skill.js my-api-helper --path .agent/skills');
    process.exit(1);
  }

  const skillName = args[0];
  const basePath = args[2];

  console.log(`🚀 Initializing skill: ${skillName}`);
  console.log(`   Location: ${basePath}\n`);

  const success = initSkill(skillName, basePath);
  process.exit(success ? 0 : 1);
}

if (require.main === module) {
  main();
}

module.exports = { initSkill };
