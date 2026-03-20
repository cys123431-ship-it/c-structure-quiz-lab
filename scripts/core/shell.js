import { escapeHtml } from "./utils.js";

const NAV_ITEMS = [
  { id: "home", href: "./index.html", label: "소개" },
  { id: "achievements", href: "./achievements.html", label: "성취도" },
  { id: "progress", href: "./progress.html", label: "학습 진행도" },
  { id: "problems", href: "./problems.html", label: "문제" },
  { id: "review", href: "./review.html", label: "오답노트" },
];

export function renderSiteNav(activeId) {
  return `
    <header class="site-header">
      <a class="site-brand" href="./index.html">
        <span class="site-brand-mark">DS</span>
        <span class="site-brand-copy">
          <strong>C 자료구조 블록 퀴즈</strong>
          <span>학습 허브</span>
        </span>
      </a>
      <nav class="site-nav" aria-label="주요 기능">
        ${NAV_ITEMS.map(
          (item) => `
            <a class="site-nav-link ${item.id === activeId ? "site-nav-link-active" : ""}" href="${item.href}">
              ${escapeHtml(item.label)}
            </a>
          `
        ).join("")}
      </nav>
    </header>
  `;
}

export function renderHeroCard({ eyebrow, title, description, actions = "" }) {
  return `
    <div class="hero-copy hero-copy-wide">
      <p class="eyebrow">${escapeHtml(eyebrow)}</p>
      <h1>${title}</h1>
      <p class="hero-text">${escapeHtml(description)}</p>
      ${actions ? `<div class="button-row hero-actions">${actions}</div>` : ""}
    </div>
  `;
}

export function renderStatCards(items) {
  return `
    <div class="stats-grid">
      ${items
        .map(
          (item) => `
            <div class="stat-card">
              <span class="stat-label">${escapeHtml(item.label)}</span>
              <span class="stat-value">${escapeHtml(item.value)}</span>
            </div>
          `
        )
        .join("")}
    </div>
  `;
}

export function renderHeroStatsCard({ eyebrow, description, items }) {
  return `
    <div class="hero-stats">
      <div>
        <p class="eyebrow">${escapeHtml(eyebrow)}</p>
        <p class="meta-copy">${escapeHtml(description)}</p>
      </div>
      ${renderStatCards(items)}
    </div>
  `;
}

export function renderEmptyState(title, description) {
  return `
    <div class="empty-state">
      <h2>${escapeHtml(title)}</h2>
      <p>${escapeHtml(description)}</p>
    </div>
  `;
}
