# STYLE: Product Editorial

> A fictional, copyright-safe example showing how measured evidence becomes reusable design rules.

## 0. Source & Confidence

| Item | Evidence |
| --- | --- |
| Source URL | `https://example.com/fictional-product` |
| Viewports | 1440×900, 1024×768, 390×844 |
| Measured profile | `style-profile.sample.json` |
| Confidence | High for static visual rules; motion was not captured |

## 1. Style In One Sentence

A quiet product editorial system with strong type hierarchy, flat neutral bands, compact actions, and imagery treated as the primary proof.

## 2. Design DNA

| Dimension | Observation | Measured evidence | Transferable rule | Confidence |
| --- | --- | --- | --- | --- |
| Hierarchy | One focal message per band | 56/48/32px display steps | Keep one dominant message at every viewport | High |
| Rhythm | Immersive sections, tight transitions | 640px hero, 12px band gaps | Let section scale create rhythm | High |
| Density | Sparse story, compact utility | 44/48px navigation | Separate selling and utility density | High |
| Contrast | Flat surfaces replace shadows | White, soft gray, ink, action blue | Build depth through surface contrast | High |
| Shape | Square bands, pill actions | 0px and 999px radii | Reserve pills for commands | High |
| Imagery | Subject remains large at each size | Separate large/medium/small sources | Art-direct instead of shrinking one image | High |
| Motion | No direct evidence | No captured states | Keep motion optional and restrained | Low |

## 3. Transferability Boundary

### Retain

- Hierarchy, surface logic, responsive type steps, image scale, and compact actions.

### Reinterpret

- Map the product showcase to the new audience's strongest proof.

### Replace

- Source identity, copy, page order, icons, photography, and campaign concepts.

## 4. Color Logic

| Role | Measured value | Paired with | Usage rule |
| --- | --- | --- | --- |
| Primary foreground | `rgb(28,28,30)` | Light surfaces | Headlines and primary copy |
| Secondary foreground | `rgb(99,99,104)` | Light surfaces | Supporting copy |
| Page surface | `rgb(255,255,255)` | Primary foreground | Page shell |
| Alternate surface | `rgb(245,245,247)` | Primary foreground | Separate major ideas |
| Action | `rgb(0,102,204)` | White | Primary commands only |
| Divider | `rgb(214,214,219)` | Neutral surfaces | Utility structure |

## 5. Typography Grammar

| Role | Family | Desktop | Tablet | Mobile | Weight / line height | Rule |
| --- | --- | --- | --- | --- | --- | --- |
| Display | `system-ui` | 56px | 48px | 32px | 600 / 1.08 | Keep to two lines or fewer |
| Section title | `system-ui` | 40px | 36px | 30px | 600 / 1.12 | Name one clear idea |
| Supporting copy | `system-ui` | 21px | 19px | 17px | 400 / 1.4 | Constrain line length |
| Navigation | `system-ui` | 12px | 12px | Icon-led | 400 / 1 | Keep global choices compact |

## 6. Composition Grammar

- Use flat full-width bands for primary stories.
- Constrain navigation and utility information while allowing media to fill the band.
- Use a two-column repeated-item grid on wide screens and a single sequence on mobile.
- Keep approximately 12px between neighboring content bands.

## 7. Image Direction

| Property | Rule |
| --- | --- |
| Subject | Show the actual product or outcome clearly |
| Framing | Use wide hero compositions and closer mobile crops |
| Scale | Keep the subject dominant rather than adding decoration |
| Responsive swap | Author large, medium, and small sources |
| Avoid | Generic stock, blur, arbitrary cover crops, or source assets |

## 8. Component & Interaction Grammar

- Navigation: 44px desktop and 48px mobile.
- Actions: filled or outlined pills, 36–44px high.
- Content bands: square corners and no decorative shadow.
- Focus: visible keyboard focus with accessible contrast.

## 9. Responsive Transformations

| Condition | What stays invariant | What transforms |
| --- | --- | --- |
| Large | One focal idea and flat surfaces | 56px display, wide image composition |
| Medium | Hierarchy and action roles | 48px display, medium image crop |
| Small | Clear subject and compact actions | 32px display, one column, small image source |

## 10. Do / Don't

### Do

- Art-direct images and preserve one dominant message.
- Validate both desktop and mobile geometry.

### Don't

- Do not imitate a brand by copying its assets or page structure.
- Do not add decorative effects that contradict the measured flat system.

## 11. Transfer Prompt

Create an original website for `[subject]` and `[audience]`. Retain the measured product-editorial hierarchy, flat neutral bands, compact actions, and explicit 56/48/32px display steps. Replace all source identity, copy, assets, icons, and page architecture. Use owned imagery with separate large, medium, and small compositions. Validate responsive hierarchy, image framing, contrast, keyboard focus, and asset health.

## 12. Evidence Ledger

| Claim | Evidence |
| --- | --- |
| Display scale | `style-profile.sample.json → viewports.*.displayHeading` |
| Navigation | `style-profile.sample.json → viewports.*.navigation` |
| Shape and colors | `style-profile.sample.json → styleSignals` |
| Responsive media | `style-profile.sample.json → imagery` |
