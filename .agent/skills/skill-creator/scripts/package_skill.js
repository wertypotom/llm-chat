#!/usr/bin/env node
/**
 * Skill Packager - Creates a distributable .skill file (Native Node.js)
 *
 * Usage: node package_skill.js <path/to/skill-folder> [output-directory]
 *
 * Example:
 *   node package_skill.js .agent/skills/my-skill
 *   node package_skill.js .agent/skills/my-skill ./dist
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { validateSkill } = require('./quick_validate');

async function packageSkill(skillPath, outputDir = null) {
  const skillDir = path.resolve(skillPath);

  // Validate skill folder exists
  if (!fs.existsSync(skillDir)) {
    console.error(`❌ Error: Skill folder not found: ${skillDir}`);
    return false;
  }

  if (!fs.statSync(skillDir).isDirectory()) {
    console.error(`❌ Error: Path is not a directory: ${skillDir}`);
    return false;
  }

  // Validate SKILL.md exists
  const skillMdPath = path.join(skillDir, 'SKILL.md');
  if (!fs.existsSync(skillMdPath)) {
    console.error(`❌ Error: SKILL.md not found in ${skillDir}`);
    return false;
  }

  // Run validation before packaging
  console.log('🔍 Validating skill...');
  const { valid, message } = validateSkill(skillDir);
  if (!valid) {
    console.error(`❌ Validation failed: ${message}`);
    console.error('   Please fix the validation errors before packaging.');
    return false;
  }
  console.log(`✅ ${message}\n`);

  // Determine output location
  const skillName = path.basename(skillDir);
  const outputPath = outputDir ? path.resolve(outputDir) : process.cwd();

  if (outputDir && !fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }

  const skillFilename = path.join(outputPath, `${skillName}.skill`);

  // Create the .skill file (zip format) using native tar + gzip
  // Note: .skill files are actually just renamed zip/tar.gz archives
  const { exec } = require('child_process');

  return new Promise((resolve) => {
    // Use native tar + gzip (available on macOS/Linux)
    const tarCommand = `cd "${path.dirname(skillDir)}" && tar -czf "${skillFilename}" "${skillName}"`;

    exec(tarCommand, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Error creating .skill file: ${error.message}`);
        resolve(false);
        return;
      }

      const stats = fs.statSync(skillFilename);
      console.log(`\n✅ Successfully packaged skill to: ${skillFilename}`);
      console.log(`   Total size: ${(stats.size / 1024).toFixed(2)} KB`);

      // List files added
      const listCommand = `tar -tzf "${skillFilename}" | head -20`;
      exec(listCommand, (err, out) => {
        if (!err) {
          out
            .trim()
            .split('\n')
            .forEach((f) => console.log(`  Added: ${f}`));
        }
        resolve(true);
      });
    });
  });
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log('Usage: node package_skill.js <path/to/skill-folder> [output-directory]');
    console.log('\nExample:');
    console.log('  node package_skill.js .agent/skills/my-skill');
    console.log('  node package_skill.js .agent/skills/my-skill ./dist');
    process.exit(1);
  }

  const skillPath = args[0];
  const outputDir = args[1] || null;

  console.log(`📦 Packaging skill: ${skillPath}`);
  if (outputDir) {
    console.log(`   Output directory: ${outputDir}`);
  }
  console.log();

  const success = await packageSkill(skillPath, outputDir);
  process.exit(success ? 0 : 1);
}

if (require.main === module) {
  main().catch((err) => {
    console.error(`❌ Error: ${err.message}`);
    process.exit(1);
  });
}

module.exports = { packageSkill };
