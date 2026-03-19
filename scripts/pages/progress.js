import {
  createAppState,
  examples,
  getExampleById,
  getGlobalStats,
  getLessonHref,
  getEmptyListMessage,
  getLessonStatus,
  getVisibleExamples,
  saveState,
} from "../core/store.js";
import { escapeHtml } from "../core/utils.js";

const app = document.querySelector("#app");
const pageState = createAppState();
let layoutHelpers = null;

const FILTERS = [
  { key: "all", label: "전체" },
  { key: "selected", label: "선택한 예제" },
  { key: "wrong", label: "오답 있는 예제" },
  { key: "selected-wrong", label: "선택 오답" },
];

const PAGE_LINKS = [
  { href: "./index.html", label: "소개" },
  { href: "./achievements.html", label: "성취도" },
  { href: "./progress.html", label: "학습 진행도" },
  { href: "./problems.html", label: "문제" },
  { href: "./review.html", label: "오답노트" },
];

function loadSelectedLessonId() {
  const params = new URLSearchParams(window.location.search);
  const lessonId = params.get("lesson");

  return examples.some((example) => example.id === lessonId) ? lessonId : null;
}

function getLessonPercent(status) {
  if (status.total === 0) {
    return 0;
  }

  return Math.round((status.correct / status.total) * 100);
}

function getLessonPhase(status) {
  if (status.correct === status.total && status.total > 0) {
    return "완료";
  }

  if (status.correct > 0 || status.wrong > 0) {
    return "진행 중";
  }

  return "미시작";
}

function getPhaseKey(status) {
  if (status.correct === status.total && status.total > 0) {
    return "mastered";
  }

  if (status.correct > 0 || status.wrong > 0) {
    return "active";
  }

  return "untouched";
}

function getPhaseSummary(lessonCards) {
  return lessonCards.reduce(
    (acc, item) => {
      acc.total += 1;

      if (item.phaseKey === "mastered") {
        acc.mastered += 1;
      } else if (item.phaseKey === "active") {
        acc.active += 1;
      } else {
        acc.untouched += 1;
      }

      return acc;
    },
    { total: 0, mastered: 0, active: 0, untouched: 0 }
  );
}

function getAverageProgress(lessonCards) {
  if (lessonCards.length === 0) {
    return 0;
  }

  return Math.round(lessonCards.reduce((sum, item) => sum + item.percent, 0) / lessonCards.length);
}

function getLessonCards(filter = pageState.filter) {
  const visibleExamples = getVisibleExamples(pageState).filter((example) =>
    filter === "all"
      ? true
      : filter === "selected"
        ? pageState.selectedLessons.has(example.id)
        : filter === "wrong"
          ? getLessonStatus(pageState, example).wrong > 0
          : pageState.selectedLessons.has(example.id) && getLessonStatus(pageState, example).wrong > 0
  );

  return visibleExamples.map((example) => {
    const status = getLessonStatus(pageState, example);
    const percent = getLessonPercent(status);

    return {
      example,
      status,
      percent,
      phaseKey: getPhaseKey(status),
      phaseLabel: getLessonPhase(status),
      selected: pageState.selectedLessons.has(example.id),
      active: example.id === pageState.selectedId,
    };
  });
}

function getBucketedLessons(lessonCards) {
  return lessonCards.reduce(
    (acc, item) => {
      acc[item.phaseKey].push(item);
      return acc;
    },
    { mastered: [], active: [], untouched: [] }
  );
}

function renderLocalSiteNav() {
  return `
    <header class="site-header">
      <a class="site-brand" href="./index.html">
        <span class="site-brand-mark">DS</span>
        <span class="site-brand-copy">
          <strong>C 자료구조 블록 퀴즈</strong>
          <span>기능별 페이지 학습 허브</span>
        </span>
      </a>
      <nav class="site-nav" aria-label="주요 기능">
        ${PAGE_LINKS.map(
          (item) => `
            <a class="site-nav-link ${item.href === "./progress.html" ? "site-nav-link-active" : ""}" href="${item.href}">
              ${escapeHtml(item.label)}
            </a>
          `
        ).join("")}
      </nav>
      <a class="brand-chip" href="${getLessonHref(pageState.selectedId)}">최근 문제 ${escapeHtml(getExampleById(pageState.selectedId).file)}</a>
    </header>
  `;
}

function renderSiteNav() {
  if (layoutHelpers && typeof layoutHelpers.renderSiteNav === "function") {
    return layoutHelpers.renderSiteNav("progress");
  }

  return renderLocalSiteNav();
}

function renderHero() {
  const stats = getGlobalStats(pageState);
  const lessonCards = getLessonCards();
  const average = getAverageProgress(lessonCards);
  const currentLesson = getExampleById(pageState.selectedId);
  const currentStatus = getLessonStatus(pageState, currentLesson);

  return `
    <section class="page-hero">
      <div class="hero-panel hero-panel-copy">
        ${renderSiteNav()}
        <div>
          <p class="eyebrow">Learning Progress</p>
          <h1>진도를 한눈에 보고, 바로 문제 페이지로 넘어가요.</h1>
          <p class="hero-note">
            지금까지 푼 예제, 오답이 남은 예제, 아직 시작하지 않은 예제를 나눠서 보여 주는 전용 진도 페이지입니다.
          </p>
        </div>
        <div class="hero-actions">
          <a class="btn btn-primary" href="${getLessonHref(currentLesson.id)}">최근 문제 열기</a>
          <a class="btn btn-secondary" href="./review.html">오답노트 보기</a>
          <a class="btn btn-secondary" href="./achievements.html">성취도 보기</a>
        </div>
      </div>
      <aside class="hero-panel hero-panel-stats">
        <div>
          <p class="eyebrow">Progress Snapshot</p>
          <p class="hero-note">현재 선택 상태와 평균 진도를 함께 보여 줍니다.</p>
        </div>
        <div class="progress-summary-grid">
          <div class="stat-card">
            <span class="stat-label">예제 수</span>
            <span class="stat-value">${stats.lessonCount}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">평균 진도</span>
            <span class="stat-value">${average}%</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">완료한 예제</span>
            <span class="stat-value">${stats.completedLessons}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">선택한 예제</span>
            <span class="stat-value">${stats.selectedLessons}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">오답 문항</span>
            <span class="stat-value">${stats.wrongItems}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">현재 예제 진도</span>
            <span class="stat-value">${currentStatus.correct}/${currentStatus.total}</span>
          </div>
        </div>
        <div class="page-summary-strip">
          <span class="summary-pill">진행 중 ${getPhaseSummary(lessonCards).active}개</span>
          <span class="summary-pill">미시작 ${getPhaseSummary(lessonCards).untouched}개</span>
          <span class="summary-pill">완료 ${getPhaseSummary(lessonCards).mastered}개</span>
        </div>
      </aside>
    </section>
  `;
}

function renderFilters() {
  return `
    <section class="progress-toolbar">
      <div class="progress-toolbar-row">
        <div>
          <h2 class="section-title">보기 필터</h2>
          <p class="section-copy">전역 필터를 바꾸면 아래 카드도 함께 바뀌고, 선택 상태는 그대로 유지됩니다.</p>
        </div>
        <div class="section-badge">진도 페이지</div>
      </div>
      <div class="filter-row">
        ${FILTERS.map(
          (filter) => `
            <button
              class="chip-btn ${pageState.filter === filter.key ? "chip-btn-active" : ""}"
              data-action="set-filter"
              data-filter="${filter.key}"
            >
              ${escapeHtml(filter.label)}
            </button>
          `
        ).join("")}
      </div>
      <div class="chip-row">
        <span class="summary-pill">선택된 예제는 체크박스로 따로 모을 수 있어요.</span>
        <span class="summary-pill">카드의 버튼을 누르면 문제 페이지로 바로 이동합니다.</span>
      </div>
    </section>
  `;
}

function renderLessonCard(item) {
  const { example, status, percent, selected, active } = item;

  return `
    <article class="lesson-card ${active ? "lesson-card-active" : ""}">
      <div class="lesson-card-head">
        <div>
          <div class="lesson-card-meta">
            <span class="lesson-code">${escapeHtml(example.file)}</span>
            <span class="lesson-badge">${escapeHtml(item.phaseLabel)}</span>
          </div>
          <h3 class="lesson-card-title">${escapeHtml(example.title)}</h3>
          <p class="lesson-card-copy">${escapeHtml(example.theme)}</p>
        </div>
        <div class="status-badges">
          <span class="lesson-badge ${active ? "lesson-badge-active" : ""}">${active ? "최근 본 문제" : "목록"}</span>
          ${selected ? '<span class="lesson-badge lesson-badge-selected">선택됨</span>' : ""}
        </div>
      </div>
      <p class="lesson-card-copy">${escapeHtml(example.goal)}</p>
      <div class="lesson-card-progress">
        <div class="lesson-card-progress-row">
          <span class="section-badge">진도 ${status.correct}/${status.total}</span>
          <span class="section-badge ${status.wrong > 0 ? "is-hot" : ""}">오답 ${status.wrong}</span>
        </div>
        <div class="progress-bar" aria-hidden="true">
          <span style="width: ${percent}%"></span>
        </div>
        <div class="lesson-card-progress-row">
          <span class="progress-note">${percent}% 완료</span>
          <span class="progress-note">${selected ? "선택 목록에 포함됨" : "선택되지 않음"}</span>
        </div>
      </div>
      <div class="lesson-card-foot">
        <label class="lesson-select">
          <input
            type="checkbox"
            data-action="toggle-selection"
            data-lesson-id="${example.id}"
            ${selected ? "checked" : ""}
          />
          선택
        </label>
        <div class="card-actions">
          <a class="btn btn-secondary" href="${getLessonHref(example.id)}">문제 열기</a>
          <a class="btn btn-primary" href="${getLessonHref(example.id)}">이어 풀기</a>
        </div>
      </div>
    </article>
  `;
}

function renderLessonSections() {
  const lessonCards = getLessonCards();
  const filteredLabel = FILTERS.find((item) => item.key === pageState.filter)?.label || "전체";
  const buckets = getBucketedLessons(lessonCards);
  const visibleCount = lessonCards.length;

  if (visibleCount === 0) {
    return `
      <section class="progress-section">
        <div class="section-head">
          <div>
            <h2 class="section-title">예제 대시보드</h2>
            <p class="section-copy">현재 필터: ${escapeHtml(filteredLabel)}. 표시할 예제가 없습니다.</p>
          </div>
          <div class="section-badge">0개 표시</div>
        </div>
        <div class="bucket-empty">${escapeHtml(getEmptyListMessage(pageState.filter))}</div>
      </section>
    `;
  }

  return `
    <section class="progress-section">
      <div class="section-head">
        <div>
          <h2 class="section-title">예제 대시보드</h2>
          <p class="section-copy">현재 필터: ${escapeHtml(filteredLabel)}. 카드의 선택 상태와 진도를 함께 확인할 수 있습니다.</p>
        </div>
        <div class="section-badge">${visibleCount}개 표시</div>
      </div>

      ${renderBucket("완료", buckets.mastered, "mastered")}
      ${renderBucket("진행 중", buckets.active, "active")}
      ${renderBucket("미시작", buckets.untouched, "untouched")}
    </section>
  `;
}

function renderBucket(title, lessons, key) {
  const descriptions = {
    mastered: "모든 문항을 맞힌 예제입니다. 이어서 다른 예제로 넘어가도 좋아요.",
    active: "진행 중인 예제입니다. 오답이 남아 있거나 일부만 해결된 상태예요.",
    untouched: "아직 시작하지 않은 예제입니다. 가볍게 하나 골라 들어가 보세요.",
  };

  return `
    <div class="bucket-section">
      <div class="section-head">
        <div>
          <h3 class="section-title">${escapeHtml(title)}</h3>
          <p class="section-copy">${escapeHtml(descriptions[key])}</p>
        </div>
        <div class="section-badge">${lessons.length}개</div>
      </div>
      <div class="bucket-list">
        ${
          lessons.length === 0
            ? `<div class="bucket-empty">${escapeHtml(getEmptyMessage(key))}</div>`
            : lessons.map(renderLessonCard).join("")
        }
      </div>
    </div>
  `;
}

function getEmptyMessage(key) {
  if (pageState.filter !== "all" && pageState.filter !== "selected" && pageState.filter !== "wrong" && pageState.filter !== "selected-wrong") {
    return "현재 필터와 일치하는 예제가 없습니다.";
  }

  if (key === "mastered") {
    return "아직 완료한 예제가 없습니다. 하나씩 풀어 보면 바로 채워집니다.";
  }

  if (key === "active") {
    return "현재 진행 중인 예제가 없습니다. 새로 하나 선택해 보세요.";
  }

  return "아직 시작하지 않은 예제가 없습니다.";
}

function renderFeatureNavigator() {
  if (layoutHelpers && typeof layoutHelpers.renderFeatureNavigator === "function") {
    return layoutHelpers.renderFeatureNavigator("progress");
  }

  return `
    <section class="progress-feature">
      <div class="section-head">
        <div>
          <h2 class="section-title">다른 기능으로 이동</h2>
          <p class="section-copy">현재 진도에서 바로 다른 페이지로 이어갈 수 있습니다.</p>
        </div>
      </div>
      <div class="progress-feature-grid">
        <a class="feature-card" href="./index.html">
          <strong>소개 페이지</strong>
          <span>메인 허브로 돌아가기</span>
        </a>
        <a class="feature-card" href="./achievements.html">
          <strong>성취도 페이지</strong>
          <span>완료 현황을 크게 보기</span>
        </a>
        <a class="feature-card" href="./review.html">
          <strong>오답노트</strong>
          <span>틀린 문제만 다시 보기</span>
        </a>
        <a class="feature-card" href="${getLessonHref(pageState.selectedId)}">
          <strong>최근 문제</strong>
          <span>마지막으로 본 예제로 이동</span>
        </a>
      </div>
    </section>
  `;
}

function renderPage() {
  app.innerHTML = `
    <div class="page-shell progress-page">
      ${renderHero()}
      <main class="progress-layout">
        ${renderFilters()}
        ${renderLessonSections()}
        ${renderFeatureNavigator()}
      </main>
    </div>
  `;
}

function setSelectedLesson(id) {
  if (!examples.some((example) => example.id === id)) {
    return;
  }

  pageState.selectedId = id;
  saveState(pageState);
}

function setFilter(filter) {
  pageState.filter = filter;
  saveState(pageState);
}

function toggleSelection(id) {
  if (pageState.selectedLessons.has(id)) {
    pageState.selectedLessons.delete(id);
  } else {
    pageState.selectedLessons.add(id);
  }

  saveState(pageState);
}

document.addEventListener("change", (event) => {
  const checkbox = event.target.closest('[data-action="toggle-selection"]');

  if (!checkbox) {
    return;
  }

  const lessonId = checkbox.dataset.lessonId;
  toggleSelection(lessonId);
  renderPage();
});

document.addEventListener("click", (event) => {
  const filterButton = event.target.closest('[data-action="set-filter"]');

  if (filterButton) {
    const filter = filterButton.dataset.filter;
    if (FILTERS.some((item) => item.key === filter)) {
      setFilter(filter);
      renderPage();
    }
    return;
  }

  const lessonLink = event.target.closest('[href*="problems.html?lesson="]');

  if (lessonLink) {
    const lessonId = new URL(lessonLink.href).searchParams.get("lesson");
    if (lessonId) {
      setSelectedLesson(lessonId);
    }
  }
});

async function init() {
  const selectedLesson = loadSelectedLessonId();

  if (selectedLesson) {
    pageState.selectedId = selectedLesson;
    saveState(pageState);
  }

  try {
    layoutHelpers = await import("../core/navigation.js");
  } catch {
    layoutHelpers = await import("../core/shell.js");
  }

  renderPage();
}

init();
