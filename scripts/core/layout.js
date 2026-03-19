import { escapeHtml } from "./format.js";
import { getLessonHref } from "./store.js";

const SITE_LINKS = [
  { id: "home", href: "./index.html", label: "소개" },
  { id: "achievements", href: "./achievements.html", label: "내 성취도" },
  { id: "progress", href: "./progress.html", label: "학습 진행도" },
  { id: "problems", href: "./problems.html", label: "문제 페이지" },
  { id: "review", href: "./review.html", label: "오답노트" },
];

export function renderSiteNav(activePage) {
  return `
    <nav class="site-nav" aria-label="주요 기능">
      ${SITE_LINKS.map(
        (item) => `
          <a class="site-link ${item.id === activePage ? "site-link-active" : ""}" href="${item.href}">
            ${item.label}
          </a>
        `
      ).join("")}
    </nav>
  `;
}

export function renderHeader({ activePage, eyebrow, title, description, sideContent = "" }) {
  return `
    <header class="page-hero">
      <div class="page-hero-copy">
        <p class="eyebrow">${escapeHtml(eyebrow)}</p>
        <h1>${title}</h1>
        <p class="hero-text">${escapeHtml(description)}</p>
        ${renderSiteNav(activePage)}
      </div>
      <div class="page-hero-side">
        ${sideContent}
      </div>
    </header>
  `;
}

export function renderStatsGrid(items) {
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

export function renderFeatureGrid(items) {
  return `
    <div class="feature-grid">
      ${items
        .map(
          (item) => `
            <article class="feature-card">
              <div>
                <p class="eyebrow">${escapeHtml(item.eyebrow)}</p>
                <h2>${escapeHtml(item.title)}</h2>
                <p class="meta-copy">${escapeHtml(item.description)}</p>
              </div>
              ${
                item.points?.length
                  ? `<ul class="summary-list">${item.points
                      .map((point) => `<li>${escapeHtml(point)}</li>`)
                      .join("")}</ul>`
                  : ""
              }
              <a class="btn ${item.primary ? "btn-primary" : "btn-secondary"}" href="${item.href}">${escapeHtml(
                item.label
              )}</a>
            </article>
          `
        )
        .join("")}
    </div>
  `;
}

export function renderFilterButton(filter, label, activeFilter) {
  return `
    <button
      class="chip-btn ${activeFilter === filter ? "chip-btn-active" : ""}"
      data-action="set-filter"
      data-filter="${filter}"
    >
      ${label}
    </button>
  `;
}

export function renderControlPanel({
  activeFilter,
  visibleCount,
  selectedCount,
  wrongCount,
  showResetCurrent = true,
  showResetSelected = true,
}) {
  return `
    <div class="control-panel">
      <div class="mode-group">
        <span class="mode-label">보기 모드</span>
        <div class="mode-buttons">
          ${renderFilterButton("all", "전체", activeFilter)}
          ${renderFilterButton("selected", "선택만", activeFilter)}
          ${renderFilterButton("wrong", "오답 반복", activeFilter)}
          ${renderFilterButton("selected-wrong", "선택 오답", activeFilter)}
        </div>
      </div>
      <div class="mode-group">
        <span class="mode-label">진도 초기화</span>
        <div class="mode-buttons">
          ${showResetCurrent ? '<button class="chip-btn" data-action="reset-current">현재 코드</button>' : ""}
          ${
            showResetSelected
              ? `<button class="chip-btn" data-action="reset-selected" ${selectedCount === 0 ? "disabled" : ""}>선택한 코드</button>`
              : ""
          }
          <button class="chip-btn chip-btn-danger" data-action="reset-all">전체</button>
        </div>
      </div>
      <p class="small-note">현재 목록 ${visibleCount}개, 선택 ${selectedCount}개, 오답 ${wrongCount}문항</p>
    </div>
  `;
}

export function renderLessonCard(example, { lessonStatus, percent, isSelected, hrefLabel = "문제 페이지" }) {
  return `
    <article class="lesson-card">
      <div class="lesson-card-head">
        <span class="lesson-code">${escapeHtml(example.file)}</span>
        <a class="btn btn-secondary btn-inline" href="${getLessonHref(example.id)}">${escapeHtml(hrefLabel)}</a>
      </div>
      <div>
        <h3 class="lesson-card-title">${escapeHtml(example.title)}</h3>
        <p class="lesson-theme">${escapeHtml(example.theme)}</p>
      </div>
      <p class="small-note">${escapeHtml(example.goal)}</p>
      <div class="lesson-badges">
        <span class="lesson-badge">진도 ${lessonStatus.correct}/${lessonStatus.total}</span>
        <span class="lesson-badge ${lessonStatus.wrong > 0 ? "lesson-badge-wrong" : ""}">
          오답 ${lessonStatus.wrong}
        </span>
      </div>
      <div class="lesson-progress">
        <span class="progress-bar"><span style="width:${percent}%"></span></span>
        ${percent}%
      </div>
      <label class="lesson-select">
        <input
          type="checkbox"
          data-action="toggle-lesson-selection"
          data-lesson-id="${example.id}"
          ${isSelected ? "checked" : ""}
        />
        선택
      </label>
    </article>
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
