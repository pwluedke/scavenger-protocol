# /project:plan
Show me your implementation plan for $ARGUMENTS. Do not write any code yet.
Follow these constraints:
- Tests use Page Object Model -- no raw selectors in test files
- External APIs are mocked with page.route() -- never hit live APIs in tests
- Scope stays focused -- one feature per plan
- Flag any architectural decisions that need human review before implementing

After presenting the plan, end your response with a next-step prompt in a visually distinctive separator block. Include the issue number and a creative reference to what's being built. Example:

```
=-=-=-=-=-=-=
Issue #N is planned. Run `/implement N` and let's bring it to life.
=-=-=-=-=-=-=
```
