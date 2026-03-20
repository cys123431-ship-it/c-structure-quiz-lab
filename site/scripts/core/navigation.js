import { createAppState, getExampleById, getGlobalStats, getLessonHref, loadUiState } from "./store.js";
import { escapeHtml } from "./utils.js";

export const PAGE_LINKS = [
  { key: "home", href: "./", label: "소개" },
  { key: "achievement", href: "./achievements.html", label: "성취도" },
  { key: "progress", href: "./progress.html", label: "학습 진행도" },
  { key: "problems", href: "./problems.html", label: "문제" },
  { key: "review", href: "./review.html", label: "오답노트" },
];

function renderStatsSummary() {
  const stats = getGlobalStats(createAppState());

  return `
    <div class="page-summary-strip">
      <span class="summary-pill">예제 ${stats.lessonCount}개</span>
      <span class="summary-pill">완료 ${stats.completedLessons}개</span>
      <span class="summary-pill">정답 ${stats.solvedItems}/${stats.totalItems}</span>
      <span class="summary-pill">오답 ${stats.wrongItems}문항</span>
      <span class="summary-pill">선택 ${stats.selectedLessons}개</span>
    </div>
  `;
}

export function renderSiteNav(currentKey) {
  const currentLesson = getExampleById(loadUiState().lastViewedId);

  return `
    <header class="site-header">
      <a class="site-brand" href="./index.html">
        <span class="site-brand-mark">DS</span>
        <span class="site-brand-copy">
          <strong>C 자료구조 블록 퀴즈</strong>
          <span>학습 허브</span>
        </span>
      </a>
      <nav class="site-nav" aria-label="주요 페이지">
        ${PAGE_LINKS.map(
          (page) => `
            <a class="site-nav-link ${page.key === currentKey ? "site-nav-link-active" : ""}" href="${page.href}">
              ${page.label}
            </a>
          `
        ).join("")}
      </nav>
      <a class="brand-chip" href="${getLessonHref(currentLesson.id)}">최근 문제 ${escapeHtml(currentLesson.file)}</a>
    </header>
  `;
}

export function renderHeroBlock({ currentKey, eyebrow, title, description, actions = "" }) {
  return `
    <section class="page-hero">
      <div class="hero-panel hero-panel-copy">
        ${renderSiteNav(currentKey)}
        <p class="eyebrow">${escapeHtml(eyebrow)}</p>
        <h1>${escapeHtml(title)}</h1>
        <p class="hero-text">${escapeHtml(description)}</p>
        ${actions ? `<div class="hero-actions">${actions}</div>` : ""}
      </div>
      <aside class="hero-panel hero-panel-stats">
        <div>
          <p class="eyebrow">Shared Progress</p>
          <p class="meta-copy">어느 페이지에서 풀어도 같은 진도와 오답 기록을 이어서 확인할 수 있습니다.</p>
        </div>
        ${renderStatsSummary()}
      </aside>
    </section>
  `;
}

export function renderFeatureNavigator(currentKey) {
  return `
    <section class="feature-nav-panel">
      <div class="section-heading">
        <h2>기능 네비게이터</h2>
        <p>학습 흐름에 맞춰 원하는 페이지로 바로 이동하세요.</p>
      </div>
      <div class="feature-nav-grid">
        ${PAGE_LINKS.filter((page) => page.key !== currentKey)
          .map(
            (page) => `
              <a class="feature-nav-card" href="${page.href}">
                <span class="feature-nav-label">${page.label}</span>
                <span class="feature-nav-arrow">바로가기</span>
              </a>
            `
          )
          .join("")}
      </div>
    </section>
  `;
}
