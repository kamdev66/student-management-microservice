// ─── Zero-dependency validator (replaces Joi/Zod) ────────────────

export type ValidationResult = { valid: boolean; errors: string[]; value: Record<string, unknown> };

type FieldRule = {
  type?: 'string' | 'number' | 'boolean' | 'email' | 'date' | 'array';
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  enum?: unknown[];
  pattern?: RegExp;
  default?: unknown;
  items?: 'string' | 'number';
  trim?: boolean;
  lowercase?: boolean;
};

export type Schema = Record<string, FieldRule>;

export function validate(data: Record<string, unknown>, schema: Schema): ValidationResult {
  const errors: string[] = [];
  const value: Record<string, unknown> = {};

  for (const [field, rules] of Object.entries(schema)) {
    let raw = data[field];

    // Apply default
    if ((raw === undefined || raw === null || raw === '') && rules.default !== undefined) {
      raw = rules.default;
    }

    // Required check
    if (rules.required && (raw === undefined || raw === null || raw === '')) {
      errors.push(`${field} is required`);
      continue;
    }

    // Skip optional missing fields
    if (raw === undefined || raw === null) {
      if (rules.default !== undefined) value[field] = rules.default;
      continue;
    }

    let v: unknown = raw;

    // Type coercion + validation
    switch (rules.type) {
      case 'string': {
        if (typeof v !== 'string') { errors.push(`${field} must be a string`); continue; }
        if (rules.trim) v = (v as string).trim();
        if (rules.lowercase) v = (v as string).toLowerCase();
        const s = v as string;
        if (rules.minLength && s.length < rules.minLength)
          errors.push(`${field} must be at least ${rules.minLength} characters`);
        if (rules.maxLength && s.length > rules.maxLength)
          errors.push(`${field} cannot exceed ${rules.maxLength} characters`);
        if (rules.pattern && !rules.pattern.test(s))
          errors.push(`${field} has invalid format`);
        break;
      }
      case 'email': {
        if (typeof v !== 'string') { errors.push(`${field} must be a string`); continue; }
        v = (v as string).toLowerCase().trim();
        if (!/^\S+@\S+\.\S+$/.test(v as string))
          errors.push(`${field} must be a valid email`);
        break;
      }
      case 'number': {
        const n = typeof v === 'string' ? Number(v) : v;
        if (typeof n !== 'number' || isNaN(n)) { errors.push(`${field} must be a number`); continue; }
        v = n;
        if (rules.min !== undefined && (v as number) < rules.min)
          errors.push(`${field} must be at least ${rules.min}`);
        if (rules.max !== undefined && (v as number) > rules.max)
          errors.push(`${field} must be at most ${rules.max}`);
        break;
      }
      case 'boolean': {
        if (typeof v === 'string') v = v === 'true';
        if (typeof v !== 'boolean') { errors.push(`${field} must be a boolean`); continue; }
        break;
      }
      case 'date': {
        const d = new Date(v as string);
        if (isNaN(d.getTime())) { errors.push(`${field} must be a valid date`); continue; }
        if (d > new Date()) errors.push(`${field} cannot be in the future`);
        v = d.toISOString();
        break;
      }
      case 'array': {
        if (!Array.isArray(v)) { errors.push(`${field} must be an array`); continue; }
        break;
      }
    }

    // Enum check
    if (rules.enum && !rules.enum.includes(v)) {
      errors.push(`${field} must be one of: ${rules.enum.join(', ')}`);
      continue;
    }

    value[field] = v;
  }

  return { valid: errors.length === 0, errors, value };
}
