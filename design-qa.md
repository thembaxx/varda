# Design QA

Source visual truth: the NOLi community-board and mobile references attached to this conversation. These were used as art direction, not a request for a pixel-identical clone.

Implementation evidence: `/workspace/shared/varda/desktop-first-pass.png` (session artifact), 1440 × 1000 CSS and image pixels, device scale factor 1, light theme, home view, signed out.

The captured home uses the reference forest-green/sage/yellow/coral palette, editorial serif headings, Phosphor icons, local community photography, and distinct shared-space actions. The first viewport has no horizontal overflow or page errors. The display heading fits two lines.

Fonts and typography: self-hosted Fraunces and Outfit, with JetBrains Mono for numbers. Desktop hierarchy was inspected.
Spacing and layout: desktop hero and action grid were inspected; mobile and lower-page comparisons remain unverified.
Colours and tokens: reference-inspired light palette was inspected; dark-theme and automated contrast checks remain unverified.
Images: the generated Cape Town community-room image was inspected in the desktop hero; supporting imagery is locally compressed WebP.
Copy: community-first navigation and everyday language replace technical landing-page copy. Conversation starters are labelled, and saved payment intents are explicitly unpaid.

Remaining blockers: mobile/dark-theme captures, focused interaction comparisons, and automated accessibility checks were not completed because the user explicitly requested skipping checks and merging. No complete visual-QA pass is claimed.

final result: blocked
