#!/usr/bin/env node
/**
 * Quick validation script for skills (Node.js version)
 *
 * Usage: node quick_validate.js <skill-directory>
 */

const fs = require('fs');
const path = require('path');

const ALLOWED_PROPERTIES = new Set(['name', 'description', 'license', 'allowed-tools', 'metadata']);

function parseYamlFrontmatter(content) {
  if (!content.startsWith('---')) {
    return { error: 'No YAML frontmatter found' };
  }

  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) {
    return { error: 'Invalid frontmatter format' };
  }

  const frontmatterText = match[1];
  const frontmatter = {};

  // Simple YAML parser for basic key-value pairs
  const lines = frontmatterText.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) continue;

    const key = trimmed.substring(0, colonIndex).trim();
    let value = trimmed.substring(colonIndex + 1).trim();

    // Remove quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    frontmatter[key] = value;
  }

  return { frontmatter };
}

function validateSkill(skillPath) {
  const skillDir = path.resolve(skillPath);

  // Check SKILL.md exists
  const skillMdPath = path.join(skillDir, 'SKILL.md');
  if (!fs.existsSync(skillMdPath)) {
    return { valid: false, message: 'SKILL.md not found' };
  }

  // Read and validate frontmatter
  const content = fs.readFileSync(skillMdPath, 'utf8');
  const { frontmatter, error } = parseYamlFrontmatter(content);

  if (error) {
    return { valid: false, message: error };
  }

  // Check for unexpected properties
  const unexpectedKeys = Object.keys(frontmatter).filter((key) => !ALLOWED_PROPERTIES.has(key));
  if (unexpectedKeys.length > 0) {
    return {
      valid: false,
      message:
        `Unexpected key(s) in SKILL.md frontmatter: ${unexpectedKeys.join(', ')}. ` +
        `Allowed properties are: ${Array.from(ALLOWED_PROPERTIES).join(', ')}`,
    };
  }

  // Check required fields
  if (!frontmatter.name) {
    return { valid: false, message: "Missing 'name' in frontmatter" };
  }
  if (!frontmatter.description) {
    return { valid: false, message: "Missing 'description' in frontmatter" };
  }

  // Validate name
  const name = frontmatter.name.trim();
  if (!/^[a-z0-9-]+$/.test(name)) {
    return {
      valid: false,
      message: `Name '${name}' should be hyphen-case (lowercase letters, digits, and hyphens only)`,
    };
  }
  if (name.startsWith('-') || name.endsWith('-') || name.includes('--')) {
    return {
      valid: false,
      message: `Name '${name}' cannot start/end with hyphen or contain consecutive hyphens`,
    };
  }
  if (name.length > 64) {
    return {
      valid: false,
      message: `Name is too long (${name.length} characters). Maximum is 64 characters.`,
    };
  }

  // Validate description
  const description = frontmatter.description.trim();
  if (description.includes('<') || description.includes('>')) {
    return {
      valid: false,
      message: 'Description cannot contain angle brackets (< or >)',
    };
  }
  if (description.length > 1024) {
    return {
      valid: false,
      message: `Description is too long (${description.length} characters). Maximum is 1024 characters.`,
    };
  }

  return { valid: true, message: 'Skill is valid!' };
}

function main() {
  const args = process.argv.slice(2);

  if (args.length !== 1) {
    console.log('Usage: node quick_validate.js <skill-directory>');
    process.exit(1);
  }

  const { valid, message } = validateSkill(args[0]);
  console.log(message);
  process.exit(valid ? 0 : 1);
}

if (require.main === module) {
  main();
}

module.exports = { validateSkill };
