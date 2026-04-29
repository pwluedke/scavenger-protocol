# /issue

Draft a GitHub issue for review before creation. The user will provide the issue content as part of the request.

## Authoritative content rule

Treat user-provided content as authoritative specification. Your job is to format it for GitHub, not to interpret, improve, or condense it.

Specifically:
- Preserve all numeric values exactly (timings, sizes, hit radii, scale factors, RGB hex codes, durations, frequencies, etc.)
- Preserve all named constants exactly (e.g. LAYER_COMBAT = 400, not "approximately 400" or "high")
- Preserve all acceptance criteria items as written. Do not collapse multiple specific items into one general item.
- Preserve all sub-specifications (state shapes, lifecycle steps, visual specs, file paths)
- Preserve all "Out of scope" items as written
- Preserve all risk items as written
- Preserve all tuning values as written
- Preserve all file paths and code locations exactly

If the user-provided content is long, the issue should be long. Length is not a defect. The user wrote what they wrote because they want it preserved.

## What you may do

- Format markdown for GitHub rendering (tables, headers, code blocks)
- Reorder sections to match GitHub conventional ordering: Title, Description (Context + Scope), Out of scope, Specifications, Files affected, Acceptance criteria, Risks, Branch, Recommended commit order
- Add a Labels suggestion (always default to "feature" for new functionality, "fix" for bug fixes, "docs" for documentation, "chore" for tooling/infrastructure, "refactor" for code restructuring)
- Add the Epic reference if the user provided one
- Apply consistent code block formatting (triple backticks with language tags)

## What you may NOT do

- Do not paraphrase user-provided text. If the user wrote "wreck inherits 50% of velocity at spawn," do not change it to "wrecks slow down on death" or any other phrasing.
- Do not substitute generic values for specific ones. If the user wrote "color 0x404040," do not change it to "dark gray" or "TBD."
- Do not collapse specifications. If the user provided a complete state shape interface, render it as-is.
- Do not add hedging language like "approximately," "roughly," "TBD," "to be determined during implementation" to values the user provided as concrete.
- Do not move information into "out of scope" or "post-MVP" unless the user explicitly placed it there.
- Do not omit acceptance criteria items because they "feel like implementation details." If the user wrote it as an AC item, it is an AC item.
- Do not add new content the user did not provide. If you believe a clarification is needed, ASK the user in a separate message before drafting.

## When you have questions

If anything in the user-provided content is genuinely ambiguous (e.g. the user wrote "around 4 seconds" without specifying), ask one clear question at the end of your draft. Do not make assumptions.

If you notice a contradiction in the user-provided content (e.g. one section says 4 seconds, another says 5 seconds), flag it explicitly: "Conflict noticed: section X says 4 seconds, section Y says 5 seconds. Which is correct?"

## Output

After drafting:
1. Show the draft issue content to the user
2. End with: "Ready for your approval to create this issue in GitHub. Reply with 'approved' or send revisions."
3. Wait for the user's approval or revisions before creating the issue
4. If approved without revisions, create the issue using gh CLI with the labels and epic suggestion
5. If revisions are requested, apply them and re-show the draft for re-approval. Do not create the issue until explicit approval is given.
