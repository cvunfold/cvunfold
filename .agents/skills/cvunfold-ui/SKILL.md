---
name: cvunfold-ui
description: Build or edit CVUnfold interface controls, forms, dropdowns, file uploads and dialogs so they match the existing application. Use for frontend UI changes in the CVUnfold repository.
---

# CVUnfold UI

Use application-styled controls consistent with the surrounding CVUnfold screen: typography, colors, borders, spacing, radii, icons and interaction states. Reuse existing components and styles before introducing a new variant.

- Dropdowns: use the existing custom popover/listbox patterns in `src/components/popover-select.tsx` and `src/components/schools/school-select.tsx`. Do not expose a browser-default select menu.
- File uploads: show a CVUnfold-styled button or dropzone, selected-file state, progress and errors. A hidden native file input may open the operating system file picker; do not show its default control as the product UI. Follow the existing `src/components/upload-flow.tsx` pattern.
- Prompts, confirmations and alerts: use an application-styled dialog or inline feedback. Do not use `window.prompt`, `window.confirm` or `window.alert`. Existing school dialogs provide reusable visual and interaction references.
- Other form controls must also match the application instead of displaying browser-default styling.

This is a visual and interaction requirement, not a ban on semantic HTML. Styled buttons, inputs and native `dialog` elements are allowed. Preserve labels, keyboard navigation, visible focus, Escape handling, focus restoration and accessible error messages. Verify the changed control in the browser, including its open, focus, disabled and error states when applicable.


## Shared button styles

Use `button` for the shared button structure and `button-primary` for primary actions with an accent background. Define foreground, background, border and icon colors together for default, hover, active, focus and disabled states in the shared stylesheet. Icons inherit `currentColor`. Do not recreate these states in page-specific CSS or let generic school button rules override the primary variant. Page-specific rules may set layout, width and spacing. Check text and icon contrast in the browser, especially on hover.
