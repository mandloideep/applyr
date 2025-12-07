# TanStack Form Setup Guide

This guide explains how to set up and use TanStack Form with a reusable, type-safe architecture.

## Architecture Overview

TanStack Form uses a 3-layer architecture:

```
1. Form Context    → Creates shared contexts for form/field state
2. Form Hook       → Combines contexts with field/form components
3. Field Components → Reusable UI components that consume field context
```

## File Structure

```
src/
├── hooks/
│   ├── form-context.ts      # Form contexts (createFormHookContexts)
│   └── use-app-form.ts      # Form hook (createFormHook)
├── components/
│   └── form/
│       ├── TextField.tsx
│       ├── TextArea.tsx
│       ├── Select.tsx
│       ├── Slider.tsx
│       ├── Switch.tsx
│       └── SubscribeButton.tsx
```

---

## Step 1: Create Form Context

Create the shared form and field contexts that all components will use.

**File: `src/hooks/form-context.ts`**

```typescript
import { createFormHookContexts } from "@tanstack/react-form";

export const { fieldContext, useFieldContext, formContext, useFormContext } =
  createFormHookContexts();
```

This creates:

- `fieldContext` / `useFieldContext` - Access individual field state
- `formContext` / `useFormContext` - Access overall form state

---

## Step 2: Create Form Hook

Create the form hook that combines contexts with your field/form components.

**File: `src/hooks/use-app-form.ts`**

```typescript
import { createFormHook } from "@tanstack/react-form";

import { TextField, TextArea, Select, Slider, Switch } from "@/components/form/field-components";
import { SubscribeButton } from "@/components/form/SubscribeButton";
import { fieldContext, formContext } from "./form-context";

export const { useAppForm } = createFormHook({
  fieldComponents: {
    TextField,
    Select,
    TextArea,
    Slider,
    Switch,
  },
  formComponents: {
    SubscribeButton,
  },
  fieldContext,
  formContext,
});
```

---

## Step 3: Create Field Components

Each field component uses `useFieldContext<T>()` to access field state.

### Error Messages Helper

**File: `src/components/form/ErrorMessages.tsx`**

```typescript
export function ErrorMessages({
  errors,
}: {
  errors: Array<string | { message: string }>
}) {
  return (
    <>
      {errors.map((error) => (
        <div
          key={typeof error === 'string' ? error : error.message}
          className="text-red-500 mt-1 font-bold"
        >
          {typeof error === 'string' ? error : error.message}
        </div>
      ))}
    </>
  )
}
```

### TextField Component

**File: `src/components/form/TextField.tsx`**

```typescript
import { useStore } from '@tanstack/react-form'
import { useFieldContext } from '@/hooks/form-context'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ErrorMessages } from './ErrorMessages'

export function TextField({
  label,
  placeholder,
}: {
  label: string
  placeholder?: string
}) {
  const field = useFieldContext<string>()
  const errors = useStore(field.store, (state) => state.meta.errors)

  return (
    <div>
      <Label htmlFor={label} className="mb-2 text-xl font-bold">
        {label}
      </Label>
      <Input
        value={field.state.value}
        placeholder={placeholder}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
      />
      {field.state.meta.isTouched && <ErrorMessages errors={errors} />}
    </div>
  )
}
```

### TextArea Component

**File: `src/components/form/TextArea.tsx`**

```typescript
import { useStore } from '@tanstack/react-form'
import { useFieldContext } from '@/hooks/form-context'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ErrorMessages } from './ErrorMessages'

export function TextArea({
  label,
  rows = 3,
}: {
  label: string
  rows?: number
}) {
  const field = useFieldContext<string>()
  const errors = useStore(field.store, (state) => state.meta.errors)

  return (
    <div>
      <Label htmlFor={label} className="mb-2 text-xl font-bold">
        {label}
      </Label>
      <Textarea
        id={label}
        value={field.state.value}
        onBlur={field.handleBlur}
        rows={rows}
        onChange={(e) => field.handleChange(e.target.value)}
      />
      {field.state.meta.isTouched && <ErrorMessages errors={errors} />}
    </div>
  )
}
```

### Select Component

**File: `src/components/form/Select.tsx`**

```typescript
import { useStore } from '@tanstack/react-form'
import { useFieldContext } from '@/hooks/form-context'
import * as ShadcnSelect from '@/components/ui/select'
import { ErrorMessages } from './ErrorMessages'

export function Select({
  label,
  values,
  placeholder,
}: {
  label: string
  values: Array<{ label: string; value: string }>
  placeholder?: string
}) {
  const field = useFieldContext<string>()
  const errors = useStore(field.store, (state) => state.meta.errors)

  return (
    <div>
      <ShadcnSelect.Select
        name={field.name}
        value={field.state.value}
        onValueChange={(value) => field.handleChange(value)}
      >
        <ShadcnSelect.SelectTrigger className="w-full">
          <ShadcnSelect.SelectValue placeholder={placeholder} />
        </ShadcnSelect.SelectTrigger>
        <ShadcnSelect.SelectContent>
          <ShadcnSelect.SelectGroup>
            <ShadcnSelect.SelectLabel>{label}</ShadcnSelect.SelectLabel>
            {values.map((value) => (
              <ShadcnSelect.SelectItem key={value.value} value={value.value}>
                {value.label}
              </ShadcnSelect.SelectItem>
            ))}
          </ShadcnSelect.SelectGroup>
        </ShadcnSelect.SelectContent>
      </ShadcnSelect.Select>
      {field.state.meta.isTouched && <ErrorMessages errors={errors} />}
    </div>
  )
}
```

### Slider Component

**File: `src/components/form/Slider.tsx`**

```typescript
import { useStore } from '@tanstack/react-form'
import { useFieldContext } from '@/hooks/form-context'
import { Slider as ShadcnSlider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { ErrorMessages } from './ErrorMessages'

export function Slider({ label }: { label: string }) {
  const field = useFieldContext<number>()
  const errors = useStore(field.store, (state) => state.meta.errors)

  return (
    <div>
      <Label htmlFor={label} className="mb-2 text-xl font-bold">
        {label}
      </Label>
      <ShadcnSlider
        id={label}
        onBlur={field.handleBlur}
        value={[field.state.value]}
        onValueChange={(value) => field.handleChange(value[0])}
      />
      {field.state.meta.isTouched && <ErrorMessages errors={errors} />}
    </div>
  )
}
```

### Switch Component

**File: `src/components/form/Switch.tsx`**

```typescript
import { useStore } from '@tanstack/react-form'
import { useFieldContext } from '@/hooks/form-context'
import { Switch as ShadcnSwitch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { ErrorMessages } from './ErrorMessages'

export function Switch({ label }: { label: string }) {
  const field = useFieldContext<boolean>()
  const errors = useStore(field.store, (state) => state.meta.errors)

  return (
    <div>
      <div className="flex items-center gap-2">
        <ShadcnSwitch
          id={label}
          onBlur={field.handleBlur}
          checked={field.state.value}
          onCheckedChange={(checked) => field.handleChange(checked)}
        />
        <Label htmlFor={label}>{label}</Label>
      </div>
      {field.state.meta.isTouched && <ErrorMessages errors={errors} />}
    </div>
  )
}
```

---

## Step 4: Create Form Components

### SubscribeButton Component

Uses `useFormContext()` to access form-level state (e.g., `isSubmitting`).

**File: `src/components/form/SubscribeButton.tsx`**

```typescript
import { useFormContext } from '@/hooks/form-context'
import { Button } from '@/components/ui/button'

export function SubscribeButton({ label }: { label: string }) {
  const form = useFormContext()
  return (
    <form.Subscribe selector={(state) => state.isSubmitting}>
      {(isSubmitting) => (
        <Button type="submit" disabled={isSubmitting}>
          {label}
        </Button>
      )}
    </form.Subscribe>
  )
}
```

---

## Usage Examples

### Example 1: Simple Form with Zod Validation

```typescript
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { useAppForm } from '@/hooks/use-app-form'

export const Route = createFileRoute('/posts/new')({
  component: NewPostForm,
})

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
})

function NewPostForm() {
  const form = useAppForm({
    defaultValues: {
      title: '',
      description: '',
    },
    validators: {
      onBlur: schema,
    },
    onSubmit: ({ value }) => {
      console.log(value)
      // Call your API here
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
      className="space-y-6"
    >
      <form.AppField name="title">
        {(field) => <field.TextField label="Title" />}
      </form.AppField>

      <form.AppField name="description">
        {(field) => <field.TextArea label="Description" />}
      </form.AppField>

      <form.AppForm>
        <form.SubscribeButton label="Submit" />
      </form.AppForm>
    </form>
  )
}
```

### Example 2: Complex Form with Nested Fields

```typescript
import { createFileRoute } from '@tanstack/react-router'
import { useAppForm } from '@/hooks/use-app-form'

export const Route = createFileRoute('/users/profile')({
  component: ProfileForm,
})

function ProfileForm() {
  const form = useAppForm({
    defaultValues: {
      fullName: '',
      email: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
      },
      phone: '',
    },
    validators: {
      onBlur: ({ value }) => {
        const errors = { fields: {} } as { fields: Record<string, string> }
        if (value.fullName.trim().length === 0) {
          errors.fields.fullName = 'Full name is required'
        }
        return errors
      },
    },
    onSubmit: ({ value }) => {
      console.log(value)
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
      className="space-y-6"
    >
      <form.AppField name="fullName">
        {(field) => <field.TextField label="Full Name" />}
      </form.AppField>

      {/* Field-level inline validator */}
      <form.AppField
        name="email"
        validators={{
          onBlur: ({ value }) => {
            if (!value || value.trim().length === 0) {
              return 'Email is required'
            }
            if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value)) {
              return 'Invalid email address'
            }
            return undefined
          },
        }}
      >
        {(field) => <field.TextField label="Email" />}
      </form.AppField>

      {/* Nested fields using dot notation */}
      <form.AppField name="address.street">
        {(field) => <field.TextField label="Street Address" />}
      </form.AppField>

      <div className="grid grid-cols-3 gap-4">
        <form.AppField name="address.city">
          {(field) => <field.TextField label="City" />}
        </form.AppField>
        <form.AppField name="address.state">
          {(field) => <field.TextField label="State" />}
        </form.AppField>
        <form.AppField name="address.zipCode">
          {(field) => <field.TextField label="Zip Code" />}
        </form.AppField>
      </div>

      <form.AppField name="address.country">
        {(field) => (
          <field.Select
            label="Country"
            values={[
              { label: 'United States', value: 'US' },
              { label: 'Canada', value: 'CA' },
              { label: 'United Kingdom', value: 'UK' },
            ]}
            placeholder="Select a country"
          />
        )}
      </form.AppField>

      <form.AppForm>
        <form.SubscribeButton label="Save Profile" />
      </form.AppForm>
    </form>
  )
}
```

---

## Validation Patterns

### Option 1: Zod Schema (Form-Level)

```typescript
const schema = z.object({
  title: z.string().min(1, "Title is required"),
  email: z.string().email("Invalid email"),
});

const form = useAppForm({
  defaultValues: { title: "", email: "" },
  validators: {
    onBlur: schema, // Validate on blur
    onChange: schema, // Or validate on change
    onSubmit: schema, // Or validate on submit
  },
  onSubmit: ({ value }) => {
    /* ... */
  },
});
```

### Option 2: Inline Validators (Field-Level)

```typescript
<form.AppField
  name="zipCode"
  validators={{
    onBlur: ({ value }) => {
      if (!value) return 'Zip code is required'
      if (!/^\d{5}(-\d{4})?$/.test(value)) return 'Invalid zip code'
      return undefined
    },
  }}
>
  {(field) => <field.TextField label="Zip Code" />}
</form.AppField>
```

### Option 3: Custom Form-Level Validator

```typescript
const form = useAppForm({
  defaultValues: { password: "", confirmPassword: "" },
  validators: {
    onBlur: ({ value }) => {
      const errors = { fields: {} } as { fields: Record<string, string> };
      if (value.password !== value.confirmPassword) {
        errors.fields.confirmPassword = "Passwords must match";
      }
      return errors;
    },
  },
  onSubmit: ({ value }) => {
    /* ... */
  },
});
```

---

## Key Patterns

| Pattern                           | Description                                      |
| --------------------------------- | ------------------------------------------------ |
| `useFieldContext<T>()`            | Access field state with type `T`                 |
| `useStore(field.store, selector)` | Subscribe to specific field state (errors, etc.) |
| `field.state.value`               | Current field value                              |
| `field.handleBlur`                | Blur handler (triggers validation)               |
| `field.handleChange(value)`       | Update field value                               |
| `field.state.meta.isTouched`      | Has field been touched?                          |
| `form.AppField`                   | Wrapper for field components                     |
| `form.AppForm`                    | Wrapper for form components                      |
| `name="address.street"`           | Nested field access via dot notation             |

---

## Async Validation

### Async Field Validation

Validate against a server or database asynchronously.

```typescript
<form.AppField
  name="username"
  validators={{
    onBlurAsync: async ({ value }) => {
      // Check if username is taken
      const response = await fetch(`/api/check-username?username=${value}`)
      const { available } = await response.json()
      if (!available) {
        return 'Username is already taken'
      }
      return undefined
    },
    onBlurAsyncDebounceMs: 500, // Debounce async validation
  }}
>
  {(field) => <field.TextField label="Username" />}
</form.AppField>
```

### Async Form-Level Validation

```typescript
const form = useAppForm({
  defaultValues: { email: "", inviteCode: "" },
  validators: {
    onBlurAsync: async ({ value }) => {
      const response = await fetch("/api/validate-invite", {
        method: "POST",
        body: JSON.stringify({ email: value.email, code: value.inviteCode }),
      });
      const result = await response.json();
      if (!result.valid) {
        return {
          fields: {
            inviteCode: "Invalid invite code for this email",
          },
        };
      }
      return undefined;
    },
    onBlurAsyncDebounceMs: 300,
  },
  onSubmit: ({ value }) => {
    /* ... */
  },
});
```

### Combined Sync + Async Validation

Sync validation runs first. Async only runs if sync passes.

```typescript
<form.AppField
  name="email"
  validators={{
    // Sync validation (runs first)
    onBlur: ({ value }) => {
      if (!value) return 'Email is required'
      if (!/^[^@]+@[^@]+\.[^@]+$/.test(value)) return 'Invalid email format'
      return undefined
    },
    // Async validation (runs only if sync passes)
    onBlurAsync: async ({ value }) => {
      const exists = await checkEmailExists(value)
      if (exists) return 'Email is already registered'
      return undefined
    },
    onBlurAsyncDebounceMs: 500,
  }}
>
  {(field) => <field.TextField label="Email" />}
</form.AppField>
```

### Force Async to Always Run

By default, async validation only runs if sync validation passes. Override with `asyncAlways`:

```typescript
validators={{
  onBlur: syncValidator,
  onBlurAsync: asyncValidator,
  asyncAlways: true, // Run async even if sync fails
}}
```

---

## Server Validation on Submit

Validate the entire form with an API and return field-specific errors.

```typescript
const form = useAppForm({
  defaultValues: {
    email: "",
    password: "",
    confirmPassword: "",
  },
  validators: {
    onSubmitAsync: async ({ value }) => {
      const response = await fetch("/api/validate-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(value),
      });

      if (!response.ok) {
        const errors = await response.json();
        // Return field-specific errors from server
        return {
          form: errors.formError, // Optional form-level error
          fields: {
            email: errors.email,
            password: errors.password,
          },
        };
      }

      return undefined;
    },
  },
  onSubmit: async ({ value }) => {
    // Only runs if validation passes
    await registerUser(value);
  },
});
```

---

## Array / Dynamic Fields

Handle lists of items that can be added, removed, or reordered.

### Basic Array Field

```typescript
function TagsForm() {
  const form = useAppForm({
    defaultValues: {
      tags: [''],
    },
    onSubmit: ({ value }) => console.log(value),
  })

  return (
    <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit() }}>
      <form.AppField name="tags" mode="array">
        {(field) => (
          <div className="space-y-2">
            {field.state.value.map((_, index) => (
              <div key={index} className="flex gap-2">
                <form.AppField name={`tags[${index}]`}>
                  {(subField) => (
                    <input
                      value={subField.state.value}
                      onChange={(e) => subField.handleChange(e.target.value)}
                      className="border p-2 rounded"
                    />
                  )}
                </form.AppField>
                <button
                  type="button"
                  onClick={() => field.removeValue(index)}
                  className="text-red-500"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => field.pushValue('')}
              className="text-blue-500"
            >
              + Add Tag
            </button>
          </div>
        )}
      </form.AppField>
    </form>
  )
}
```

### Array of Objects

```typescript
function ContactsForm() {
  const form = useAppForm({
    defaultValues: {
      contacts: [{ name: '', email: '', phone: '' }],
    },
    onSubmit: ({ value }) => console.log(value),
  })

  return (
    <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit() }}>
      <form.AppField name="contacts" mode="array">
        {(field) => (
          <div className="space-y-4">
            {field.state.value.map((_, index) => (
              <div key={index} className="border p-4 rounded space-y-2">
                <form.AppField name={`contacts[${index}].name`}>
                  {(subField) => <subField.TextField label="Name" />}
                </form.AppField>
                <form.AppField name={`contacts[${index}].email`}>
                  {(subField) => <subField.TextField label="Email" />}
                </form.AppField>
                <form.AppField name={`contacts[${index}].phone`}>
                  {(subField) => <subField.TextField label="Phone" />}
                </form.AppField>
                <button
                  type="button"
                  onClick={() => field.removeValue(index)}
                  className="text-red-500"
                >
                  Remove Contact
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => field.pushValue({ name: '', email: '', phone: '' })}
              className="text-blue-500"
            >
              + Add Contact
            </button>
          </div>
        )}
      </form.AppField>
    </form>
  )
}
```

### Array Field Methods

| Method                             | Description                         |
| ---------------------------------- | ----------------------------------- |
| `field.pushValue(value)`           | Add item to end of array            |
| `field.removeValue(index)`         | Remove item at index                |
| `field.swapValues(indexA, indexB)` | Swap two items                      |
| `field.moveValue(from, to)`        | Move item from one index to another |
| `field.insertValue(index, value)`  | Insert item at specific index       |

---

## Form State Management

### Resetting the Form

```typescript
const form = useAppForm({
  defaultValues: { name: "", email: "" },
  onSubmit: async ({ value }) => {
    await saveData(value);
    form.reset(); // Reset to default values
  },
});

// Reset with new values (also updates defaultValues)
form.reset({ name: "John", email: "john@example.com" });
```

### Setting Field Values Programmatically

```typescript
// Set a single field value
form.setFieldValue("email", "new@email.com");

// Set nested field value
form.setFieldValue("address.city", "New York");

// Set array item
form.setFieldValue("tags[0]", "updated-tag");
```

### Accessing Form State

```typescript
function FormStatus() {
  const form = useFormContext()

  return (
    <form.Subscribe
      selector={(state) => ({
        isSubmitting: state.isSubmitting,
        isDirty: state.isDirty,
        isValid: state.isValid,
        errors: state.errors,
      })}
    >
      {({ isSubmitting, isDirty, isValid, errors }) => (
        <div>
          <p>Submitting: {isSubmitting ? 'Yes' : 'No'}</p>
          <p>Dirty: {isDirty ? 'Yes' : 'No'}</p>
          <p>Valid: {isValid ? 'Yes' : 'No'}</p>
          {errors.length > 0 && <p>Errors: {errors.join(', ')}</p>}
        </div>
      )}
    </form.Subscribe>
  )
}
```

### Field Meta State

| State          | Description                                              |
| -------------- | -------------------------------------------------------- |
| `isTouched`    | Field has been blurred or changed                        |
| `isDirty`      | Field value has been changed (persists even if reverted) |
| `isPristine`   | Field value has never been changed                       |
| `isValidating` | Async validation is in progress                          |
| `errors`       | Array of validation error messages                       |

```typescript
const field = useFieldContext<string>();
const { isTouched, isDirty, isPristine, isValidating } = field.state.meta;

// Check if current value equals default
const isDefaultValue = field.state.value === field.options.defaultValue;
```

---

## Listeners (Side Effects)

React to field changes and trigger side effects.

### Reset Dependent Field

When country changes, reset the state/province field:

```typescript
<form.AppField
  name="country"
  listeners={{
    onChange: ({ value }) => {
      // Reset state field when country changes
      form.setFieldValue('state', '')
    },
  }}
>
  {(field) => (
    <field.Select
      label="Country"
      values={countries}
      placeholder="Select country"
    />
  )}
</form.AppField>

<form.AppField name="state">
  {(field) => (
    <field.Select
      label="State/Province"
      values={getStatesForCountry(form.getFieldValue('country'))}
      placeholder="Select state"
    />
  )}
</form.AppField>
```

### Auto-Calculate Field

```typescript
<form.AppField
  name="quantity"
  listeners={{
    onChange: ({ value }) => {
      const price = form.getFieldValue('unitPrice')
      form.setFieldValue('total', value * price)
    },
  }}
>
  {(field) => <field.TextField label="Quantity" />}
</form.AppField>

<form.AppField
  name="unitPrice"
  listeners={{
    onChange: ({ value }) => {
      const quantity = form.getFieldValue('quantity')
      form.setFieldValue('total', quantity * value)
    },
  }}
>
  {(field) => <field.TextField label="Unit Price" />}
</form.AppField>

<form.AppField name="total">
  {(field) => <field.TextField label="Total" disabled />}
</form.AppField>
```

### Available Listener Events

| Event      | Description                        |
| ---------- | ---------------------------------- |
| `onChange` | Triggered when field value changes |
| `onBlur`   | Triggered when field loses focus   |
| `onMount`  | Triggered when field mounts        |
| `onSubmit` | Triggered on form submit           |

---

## Complete Form Example

```typescript
import { useAppForm } from '@/hooks/use-app-form'
import { z } from 'zod'

const orderSchema = z.object({
  customerName: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  items: z.array(z.object({
    product: z.string().min(1, 'Product is required'),
    quantity: z.number().min(1, 'Quantity must be at least 1'),
  })).min(1, 'At least one item is required'),
})

function OrderForm() {
  const form = useAppForm({
    defaultValues: {
      customerName: '',
      email: '',
      items: [{ product: '', quantity: 1 }],
    },
    validators: {
      onBlur: orderSchema,
      onSubmitAsync: async ({ value }) => {
        // Server-side validation
        const response = await fetch('/api/validate-order', {
          method: 'POST',
          body: JSON.stringify(value),
        })
        if (!response.ok) {
          const errors = await response.json()
          return { fields: errors }
        }
        return undefined
      },
    },
    onSubmit: async ({ value }) => {
      await submitOrder(value)
      form.reset()
    },
  })

  return (
    <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit() }}>
      <form.AppField name="customerName">
        {(field) => <field.TextField label="Customer Name" />}
      </form.AppField>

      <form.AppField name="email">
        {(field) => <field.TextField label="Email" />}
      </form.AppField>

      <form.AppField name="items" mode="array">
        {(field) => (
          <div className="space-y-4">
            <h3>Order Items</h3>
            {field.state.value.map((_, index) => (
              <div key={index} className="flex gap-4 items-end">
                <form.AppField name={`items[${index}].product`}>
                  {(subField) => <subField.TextField label="Product" />}
                </form.AppField>
                <form.AppField name={`items[${index}].quantity`}>
                  {(subField) => <subField.TextField label="Qty" />}
                </form.AppField>
                {field.state.value.length > 1 && (
                  <button type="button" onClick={() => field.removeValue(index)}>
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => field.pushValue({ product: '', quantity: 1 })}
            >
              + Add Item
            </button>
          </div>
        )}
      </form.AppField>

      <form.AppForm>
        <form.SubscribeButton label="Place Order" />
      </form.AppForm>
    </form>
  )
}
```
