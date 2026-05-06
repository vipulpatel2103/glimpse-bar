# Glimpse Bar - Website Generation Context & Prompt

This document contains the context and instructions for an AI coding assistant (like Claude Code or Codex) to generate a modern static website for the **Glimpse Bar** web extension.

---

## 🤖 INSTRUCTIONS FOR THE AI

You are tasked with building a modern, static landing website for a browser extension called **Glimpse Bar**. Read the project context below and generate the necessary project setup, configuration, and page code.

### 📌 Project Context
**Name:** Glimpse Bar  
**Tagline:** A floating transparent rail on every web page — manage tasks, track plans, and review GitHub PRs without switching tabs.
**Description:** A floating, draggable, transparent vertical sidebar that sits on every web page and lets users peek at their TODOs, Jira tickets, GitHub PRs, and more — without leaving the page they are on.

**Current App Status:**  
The extension is actively being built. We have successfully completed two major integrations:
1. **Todo Feature:** A local TODO list seamlessly integrated into the floating panel. Features include quick task addition, checking off completed tasks without context switching, persistent local storage, and a distraction-free UI.
2. **GitHub PRs Feature:** A GitHub pull request review queue directly in the sidebar. Users can fetch their PR queue, view CI/CD status and review requirements at a glance, and click to jump directly into a PR to merge or approve, all without constantly refreshing GitHub.

### 🎯 Website Requirements
We need a static, modern, and highly aesthetic website. The site should have a premium feel, utilizing modern design trends like subtle glassmorphism, smooth animations, and high-quality typography. 

**Tech Stack Preferences:**
- Framework: Next.js (App Router), Astro, or Vite + React
- Styling: Tailwind CSS
- Animations: Framer Motion (or simple CSS transitions)
- Icons: Lucide React (matches the extension's stack)

### 📄 Pages to Generate

1. **Main Landing Page (`/`)**
   - **Hero Section:** High-impact headline, subheadline, and a Call-to-Action button (e.g., "Add to Browser - It's Free"). Include a placeholder area for an extension screenshot/demo video.
   - **Features Section:** Showcase the completed features heavily using beautiful cards with hover micro-animations. 
     - **Todo Card:** Emphasize "Zero context switching", "Local and fast", and "Distraction-free task management".
     - **GitHub Card:** Emphasize "Stay on top of reviews", "Instant CI/CD status", and "One-click to merge/approve".
     - **Coming Soon:** Mention Jira integration.
   - **Value Proposition:** Explain the core benefit: "Never lose your context. Access your workflow without switching tabs."
   - **Footer:** Links to Privacy Policy, Contact, and social/GitHub links.

2. **Privacy Policy Page (`/privacy`)**
   - A clean, readable prose page.
   - Include standard boilerplate text for a browser extension, emphasizing that data (like Todo lists) is stored locally and securely.

3. **Contact Page (`/contact`)**
   - A sleek page with a simple contact form (Name, Email, Message) or clear support links (Email, GitHub Issues, Twitter/X).

### 🎨 Design & Aesthetic Guidelines
- **Colors:** Use a modern color palette (e.g., sleek dark mode by default with vibrant accent colors, or a clean minimalist light mode).
- **Typography:** Modern sans-serif (e.g., Inter, Outfit, or Roboto).
- **Responsiveness:** Must look perfect on both desktop and mobile. 

### 🛠️ What You Need to Output
1. The terminal commands to initialize the project and install dependencies.
2. The core layout component (header, footer, navigation).
3. The complete code for the Main Page, Privacy Policy, and Contact pages.
4. Any necessary Tailwind configurations or global CSS for the design system.
