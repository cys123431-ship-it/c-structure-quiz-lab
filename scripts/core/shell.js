import { escapeHtml } from "./utils.js";
export { renderSiteNav } from "./navigation.js";

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
