---
name: contextual-translations
description: Add contextual, human-quality translations using react-i18next. Use when adding i18n support, translating new features, or ensuring translations are contextually appropriate rather than machine-generated. Supports Russian and English.
---

# Contextual Translations

Context-aware translation workflow for react-i18next with human-quality output.

## When to Use

- Adding translations for new features
- Translating user-facing text
- Ensuring contextual accuracy
- Avoiding machine-like translations
- Supporting Russian and English

## Translation Workflow

### 1. Identify Untranslated Text

Use frontend-code-review skill:

```bash
bash .agent/skills/frontend-code-review/scripts/check-translations.sh
```

### 2. Add Translation Keys

**Bad** (hardcoded):

```typescript
<h1>Welcome to Dashboard</h1>
<p>Manage your jobs here</p>
```

**Good** (with context):

```typescript
import { useTranslation } from 'react-i18next';

const { t } = useTranslation();

<h1>{t('dashboard.welcome.title')}</h1>
<p>{t('dashboard.welcome.description')}</p>
```

### 3. Add to Translation Files

Create contextual translations in both languages:

**`locales/en/common.json`**:

```json
{
  "dashboard": {
    "welcome": {
      "title": "Welcome to Dashboard",
      "description": "Manage your job listings and applications"
    }
  }
}
```

**`locales/ru/common.json`**:

```json
{
  "dashboard": {
    "welcome": {
      "title": "Добро пожаловать в панель управления",
      "description": "Управляйте вашими объявлениями о работе и заявками"
    }
  }
}
```

## Contextual Translation Guidelines

### Understand Context

Before translating, understand:

- **User persona**: Who reads this? (job seeker, employer, admin)
- **Tone**: Formal, casual, technical?
- **Action**: What user does (view, edit, delete)?
- **Location**: Where shown (button, heading, tooltip)?

### Examples

#### Buttons

**Context**: User action, imperative tone

❌ Machine: "Click to save"  
✅ Contextual EN: "Save Changes"  
✅ Contextual RU: "Сохранить изменения"

#### Error Messages

**Context**: User made mistake, helpful tone

❌ Machine: "Error occurred"  
✅ Contextual EN: "Please check your email address"  
✅ Contextual RU: "Пожалуйста, проверьте адрес электронной почты"

#### Empty States

**Context**: No data, encouraging tone

❌ Machine: "No jobs"  
✅ Contextual EN: "No job listings yet. Create your first one!"  
✅ Contextual RU: "Пока нет объявлений. Создайте первое!"

## Translation Structure

Organize by feature and context:

```json
{
  "feature": {
    "action": {
      "buttons": { ... },
      "titles": { ... },
      "messages": { ... },
      "errors": { ... }
    }
  }
}
```

Example:

```json
{
  "jobs": {
    "create": {
      "title": "Create New Job",
      "submit": "Publish Job",
      "success": "Job posted successfully!",
      "errors": {
        "titleRequired": "Job title is required",
        "salaryInvalid": "Please enter a valid salary"
      }
    }
  }
}
```

## Pluralization

Use react-i18next pluralization:

```json
{
  "jobs_one": "{{count}} job",
  "jobs_other": "{{count}} jobs",
  "jobs_ru_one": "{{count}} объявление",
  "jobs_ru_few": "{{count}} объявления",
  "jobs_ru_many": "{{count}} объявлений"
}
```

```typescript
t('jobs', { count: 5 }); // "5 jobs" / "5 объявлений"
```

## Gender & Formality

Russian requires gender/formality awareness:

```json
{
  "profile": {
    "greeting_male": "Добро пожаловать, {{name}}",
    "greeting_female": "Добро пожаловать, {{name}}",
    "greeting_formal": "Здравствуйте, {{name}}"
  }
}
```

## Testing Translations

1. Switch language in UI
2. Verify all text translated
3. Check contextual accuracy
4. Test pluralization
5. Verify formatting (dates, numbers)

## Common Mistakes

❌ **Literal translation**: "Save" → "Спасти" (to rescue)  
✅ **Contextual**: "Save" → "Сохранить" (to save data)

❌ **Missing context**: "Delete"  
✅ **With context**: "Delete Job Listing"

❌ **Inconsistent tone**: Mix of formal/informal  
✅ **Consistent tone**: All formal or all informal

## Tools

- **DeepL** (better than Google Translate for RU/EN)
- **Context notes** in JSON comments
- **Native speaker review** for final check

## File Locations

```
locales/
├── en/
│   ├── common.json
│   ├── dashboard.json
│   └── jobs.json
└── ru/
    ├── common.json
    ├── dashboard.json
    └── jobs.json
```
