# Rally Assist panel

Mode: Operate. This is a compact overlay used while watching a table-tennis court. Preserve the dark opaque surface and warm orange accent from the original extension.

- Width: 320px, constrained to viewport minus 32px. At short heights, scroll the body and keep the title visible.
- Palette: surface `#181c20`, raised controls `#242a2f`, primary text `#f4f3ef`, secondary text `#aeb8bf`, accent `#fba66b`, accent ink `#241b16`.
- Type: native system UI stack; 17px title, 13px primary controls, 11px explanatory copy. Tabular numerals for counters.
- Hierarchy: identity, primary enable action, current connection/match status, automation switches, shot/placement/player settings, then session feedback.
- Controls: native selects, labeled checkbox switches, visible keyboard focus. Orange means assist is enabled; the adjacent status explains whether it is actually waiting, paused, active, or unsupported.
- Motion: only the switch's short state transition; honor reduced motion. No pulse, glow, decorative blur, or background animation.
- Minimize: preserve assist state and move focus between launcher and panel control. F8/F9 never intercept typing or select-field input.
- Artwork: original geometric paddle SVG. Capture the running UI for documentation; label fixture screenshots explicitly.
