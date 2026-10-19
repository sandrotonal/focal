# Focal Documentation Index

This directory centralizes all architectural specifications, design guidelines, testing protocols, code reviews, and project roadmaps for the Focal application.

---

### Directory Map

```
docs/
├── README.md                          # Documentation index and architecture map
├── architecture/
│   ├── GUNCELLEMELER.md               # Detailed changelog, lifecycle reconciliation & UX reports
│   ├── apple-hig-research.md          # Apple Human Interface Guidelines design research
│   └── mcp-optimization-guide.md      # Model Context Protocol workflow and memory optimization
├── guides/
│   ├── product-quality-guide.md       # Full product quality standards and UX principles
│   └── test-architecture-rules.md     # Multi-gate production testing and verification system
├── reviews/
│   ├── senior-review-01.md            # Senior full-stack architectural audit and priority breakdown
│   └── senior-review-02.md            # Follow-up verification audit and bug triage notes
└── roadmap/
    └── architecture-roadmap.md        # Technical debt reduction and refactoring roadmap
```

---

### Document Overview

#### Architecture
- [GUNCELLEMELER.md](architecture/GUNCELLEMELER.md): Comprehensive report detailing cold-start hydration, background synchronization, Pomodoro state machines, modern SVG controls, acoustic soundscapes, and error boundary recovery.
- [apple-hig-research.md](architecture/apple-hig-research.md): Deep dive into Apple Human Interface Guidelines, Dieter Rams physical minimalism, typography hierarchy, and tonal dark mode elevation.
- [mcp-optimization-guide.md](architecture/mcp-optimization-guide.md): Architectural best practices for automated subagent workflows, memory retrieval, and tooling limits.

#### Guides
- [product-quality-guide.md](guides/product-quality-guide.md): Core product philosophy, user needs analysis, sensory feedback considerations, and release criteria.
- [test-architecture-rules.md](guides/test-architecture-rules.md): Verification gates covering static typecheck, ESLint, unit tests, E2E browser interactions, and store submission checklists.

#### Reviews & Audits
- [senior-review-01.md](reviews/senior-review-01.md): Initial deep-dive technical audit identifying critical Store compliance items (EAS, notifications, permissions, background audio).
- [senior-review-02.md](reviews/senior-review-02.md): Verification follow-up resolving timezone UTC drifts, onboarding interface parity, and production error recovery.

#### Roadmap
- [architecture-roadmap.md](roadmap/architecture-roadmap.md): Priority checklist covering performance benchmarks, component decomposition, and long-session stress tests.
