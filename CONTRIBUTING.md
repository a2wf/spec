# Contributing to A2WF

Thank you for your interest in the Agent-to-Web Framework!

## How to Contribute

### Report Issues
- Use [GitHub Issues](https://github.com/a2wf/spec/issues) for bugs, suggestions, or questions
- Search existing issues before creating a new one
- Use clear, descriptive titles

### Propose Specification Changes
1. Fork the repository
2. Create a branch (`git checkout -b proposal/your-change`)
3. Make your changes to the spec
4. Submit a Pull Request with a clear description of the change and its rationale

### Add Examples
We welcome `siteai.json` examples for additional website types and industries. Place them in the `examples/` directory with a descriptive filename.

### Discussion
- Use [GitHub Discussions](https://github.com/a2wf/spec/discussions) for general questions, ideas, and feedback
- Be respectful and constructive

## What We Need Help With

- **Spec Review**: Identifying gaps, inconsistencies, or missing permission types
- **Security Review**: Finding attack vectors or enforcement weaknesses
- **Legal Review**: Validating enforcement mechanisms across jurisdictions
- **Examples**: Creating policies for additional website types and industries
- **Translations**: Making the specification accessible in more languages
- **Implementation Feedback**: Real-world experience deploying siteai.json
- **Tool Development**: Validators, generators, CMS plugins

## Design Principles

When proposing changes, please keep these principles in mind:

1. **Simplicity first** — If a website operator can't understand it, it's too complex
2. **Complementary** — A2WF must not duplicate or compete with MCP, A2A, or robots.txt
3. **Website operator's perspective** — Every feature must serve the site owner's interests
4. **Backwards compatible** — New fields must be optional; consumers must ignore unknown fields
5. **Legally defensible** — Declarations must be clear enough to reference in legal proceedings

## Code of Conduct

Be kind. Be constructive. Be respectful. We are building a standard that protects people's digital property — let's treat each other's contributions with the same respect.

## Contact

- Issues: [github.com/a2wf/spec/issues](https://github.com/a2wf/spec/issues)
- Email: hello@a2wf.org
- Website: [a2wf.org](https://a2wf.org)
