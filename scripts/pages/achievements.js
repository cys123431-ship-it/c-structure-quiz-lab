import {
  createAppState,
  examples,
  getGlobalStats,
  getLessonHref,
  getLessonStatus,
  getExampleById,
} from "../core/store.js";
import { escapeHtml } from "../core/utils.js";

const app = document.querySelector("#app");
const appState = createAppState();
const navHelpers = await import("../core/navigation.js").catch(() => null);

function renderSiteNav(currentKey) {
  if (navHelpers?.renderSiteNav) {
    return navHelpers.renderSiteNav(currentKey);
  }

  const items = [
    { id: "home", href: "./index.html", label: "소개" },
    { id: "achievement", href: "./achievements.html", label: "성취도" },
    { id: "progress", href: "./progress.html", label: "학습 진행도" },
    { id: "problems", href: "./problems.html", label: "문제" },
    { id: "review", href: "./review.html", label: "오답노트" },
  ];

  const currentLesson = getExampleById(appState.selectedId);

  return `
    <header class="topbar">
      <a class="topbar-brand" href="./index.html">
        <span class="topbar-brand-mark">DS</span>
        <span class="topbar-brand-copy">
          <strong>C 자료구조 블록 퀴즈</strong>
          <span>학습 허브</span>
        </span>
      </a>
      <nav class="topbar-nav" aria-label="주요 기능">
        ${items
          .map(
            (item) => `
              <a class="topbar-link ${item.id === currentKey ? "topbar-link-active" : ""}" href="${item.href}">
                ${escapeHtml(item.label)}
              </a>
            `
          )
          .join("")}
      </nav>

      <div class="topbar-actions">
        <a class="topbar-action topbar-action-secondary" href="${getLessonHref(currentLesson.id)}">최근 문제</a>
        <a class="topbar-action topbar-action-primary" href="./problems.html">문제 시작</a>
      </div>
    </header>
  `;
}

function renderFeatureNavigator(currentKey) {
  if (navHelpers?.renderFeatureNavigator) {
    return navHelpers.renderFeatureNavigator(currentKey);
  }

  const features = [
    { key: "home", href: "./index.html", label: "소개" },
    { key: "progress", href: "./progress.html", label: "학습 진행도" },
    { key: "problems", href: "./problems.html", label: "문제" },
    { key: "review", href: "./review.html", label: "오답노트" },
  ];

  return `
    <section class="feature-nav-panel">
      <div class="section-heading">
        <h2>기능 네비게이터</h2>
        <p>학습 흐름에 맞춰 원하는 페이지로 바로 이동하세요.</p>
      </div>
      <div class="feature-nav-grid">
        ${features
          .filter((feature) => feature.key !== currentKey)
          .map(
            (feature) => `
              <a class="feature-nav-card" href="${feature.href}">
                <span class="feature-nav-label">${escapeHtml(feature.label)}</span>
                <span class="feature-nav-arrow">바로가기</span>
              </a>
            `
          )
          .join("")}
      </div>
    </section>
  `;
}

function getProgressPercent(status) {
  if (!status.total) {
    return 0;
  }

  return Math.round((status.correct / status.total) * 100);
}

function buildLessonBuckets() {
  const mastered = [];
  const inProgress = [];
  const notStarted = [];

  examples.forEach((example) => {
    const status = getLessonStatus(appState, example);
    const percent = getProgressPercent(status);
    const entry = { example, status, percent };

    if (status.correct === status.total) {
      mastered.push(entry);
      return;
    }

    if (status.correct > 0 || status.wrong > 0) {
      inProgress.push(entry);
      return;
    }

    notStarted.push(entry);
  });

  return { mastered, inProgress, notStarted };
}

function renderStatCards(stats, buckets) {
  const completionRate = stats.totalItems
    ? Math.round((stats.solvedItems / stats.totalItems) * 100)
    : 0;

  return `
    <div class="stats-grid">
      <div class="stat-card">
        <span class="stat-label">전체 예제</span>
        <span class="stat-value">${stats.lessonCount}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">완료한 예제</span>
        <span class="stat-value">${buckets.mastered.length}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">진행중 예제</span>
        <span class="stat-value">${buckets.inProgress.length}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">미시작 예제</span>
        <span class="stat-value">${buckets.notStarted.length}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">문항 정답률</span>
        <span class="stat-value">${completionRate}%</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">오답 문항</span>
        <span class="stat-value">${stats.wrongItems}</span>
      </div>
    </div>
  `;
}

function renderLessonCard(entry, bucketLabel) {
  const { example, status, percent } = entry;
  const isSelected = appState.selectedLessons.has(example.id);
  const cardClass = status.correct === status.total ? "lesson-card-active" : "";
  const progressLabel = `${status.correct}/${status.total}`;
  const helperText =
    status.correct === status.total
      ? "모든 문항을 정리했습니다. 복습용으로 다시 확인해도 좋아요."
      : status.wrong > 0
        ? `오답 ${status.wrong}문항이 남아 있습니다.`
        : "아직 시작하지 않았습니다.";

  return `
    <article class="lesson-card achievement-card ${cardClass}">
      <div class="lesson-card-head">
        <span class="lesson-code">${escapeHtml(example.file)}</span>
        <a class="btn btn-secondary btn-inline" href="${getLessonHref(example.id)}">문제 페이지</a>
      </div>
      <div class="achievement-card-meta">
        <h3 class="lesson-card-title">${escapeHtml(example.title)}</h3>
        <p class="lesson-theme">${escapeHtml(example.theme)}</p>
        <p class="achievement-card-note">${escapeHtml(example.goal)}</p>
      </div>
      <div class="lesson-badges">
        <span class="lesson-badge">${escapeHtml(bucketLabel)}</span>
        <span class="lesson-badge">진도 ${progressLabel}</span>
        ${isSelected ? '<span class="lesson-badge">선택됨</span>' : ""}
        ${status.wrong > 0 ? `<span class="lesson-badge lesson-badge-wrong">오답 ${status.wrong}</span>` : ""}
      </div>
      <div class="lesson-progress">
        <span class="progress-bar"><span style="width:${percent}%"></span></span>
        ${percent}%
      </div>
      <p class="achievement-card-note">${escapeHtml(helperText)}</p>
    </article>
  `;
}

function renderGroup(id, title, description, items, bucketLabel) {
  return `
    <section class="summary-card achievement-group" id="${id}">
      <div class="achievement-group-head">
        <div class="section-heading">
          <h2>${escapeHtml(title)}</h2>
          <p>${escapeHtml(description)}</p>
        </div>
        <span class="achievement-group-count">${items.length}개</span>
      </div>
      ${
        items.length > 0
          ? `<div class="achievement-group-grid">${items
              .map((entry) => renderLessonCard(entry, bucketLabel))
              .join("")}</div>`
          : `<div class="empty-list"><p>${escapeHtml("해당 상태의 예제가 아직 없습니다.")}</p></div>`
      }
    </section>
  `;
}

function renderPage() {
  const stats = getGlobalStats(appState);
  const buckets = buildLessonBuckets();
  const currentLesson = getExampleById(appState.selectedId);

  document.title = "C 자료구조 블록 퀴즈 | 성취도";

  app.innerHTML = `
    <div class="page-shell feature-page achievement-page">
      ${renderSiteNav("achievement")}

      <header class="hero-copy hero-copy-wide">
        <p class="eyebrow">Achievement Dashboard</p>
        <h1>배운 내용을 성취 기준으로 정리하고<br />다음 학습 대상을 바로 고르는 페이지</h1>
        <p class="hero-text">
          완료한 예제, 아직 진행중인 예제, 아직 시작하지 않은 예제를 한 흐름 안에서 확인할 수 있게
          구성했습니다. 지금 어디까지 왔는지 먼저 파악하고, 이어서 풀 문제나 다시 볼 문제를 바로 고를 수 있습니다.
        </p>
        <div class="button-row hero-actions">
          <a class="btn btn-primary" href="${getLessonHref(currentLesson.id)}">최근 본 문제 계속하기</a>
          <a class="btn btn-secondary" href="./problems.html">문제 페이지로 이동</a>
          <a class="btn btn-secondary" href="./review.html">오답노트 보기</a>
        </div>
      </header>

      <section class="summary-card achievement-group">
        <div class="achievement-group-head">
          <div class="section-heading">
            <h2>현재 성취 요약</h2>
            <p>${escapeHtml(currentLesson.file)} 기준으로 최근 학습을 이어 갈 수 있고, 전체 성취는 아래 숫자로 빠르게 확인할 수 있습니다.</p>
          </div>
        </div>
        ${renderStatCards(stats, buckets)}
      </section>

      ${renderFeatureNavigator("achievement")}

      <main class="achievement-layout">
        <section class="summary-card achievement-group">
          <div class="achievement-group-head">
            <div class="section-heading">
              <h2>성취 하이라이트</h2>
              <p>완료, 진행중, 미시작 상태를 숫자로 요약해 보여 줍니다.</p>
            </div>
          </div>
          <div class="achievement-group-grid">
            <div class="stat-card">
              <span class="stat-label">완료율</span>
              <span class="stat-value">${stats.lessonCount ? Math.round((buckets.mastered.length / stats.lessonCount) * 100) : 0}%</span>
            </div>
            <div class="stat-card">
              <span class="stat-label">정답 문항</span>
              <span class="stat-value">${stats.solvedItems}</span>
            </div>
            <div class="stat-card">
              <span class="stat-label">오답 문항</span>
              <span class="stat-value">${stats.wrongItems}</span>
            </div>
            <div class="stat-card">
              <span class="stat-label">선택한 예제</span>
              <span class="stat-value">${stats.selectedLessons}</span>
            </div>
          </div>
        </section>

        ${renderGroup("mastered", "마스터드", "모든 문항을 끝낸 예제들입니다. 복습용으로 문제 페이지를 다시 열어볼 수 있습니다.", buckets.mastered, "완료")}
        ${renderGroup("progress", "진행중", "일부는 풀었지만 아직 마무리하지 못한 예제들입니다. 이어서 풀기 좋은 목록입니다.", buckets.inProgress, "진행중")}
        ${renderGroup("not-started", "미시작", "아직 손대지 않은 예제들입니다. 처음 시작할 문제를 고르기 좋습니다.", buckets.notStarted, "미시작")}
      </main>
    </div>
  `;
}

renderPage();
