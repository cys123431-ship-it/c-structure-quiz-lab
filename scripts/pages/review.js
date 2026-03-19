import { examples, createAppState, getGlobalStats, getLessonStatus, loadProgress, loadUiState } from "../core/store.js";
import { escapeHtml } from "../core/utils.js";

const app = document.querySelector("#app");
const state = createAppState();

const navigationModule = await import("../core/navigation.js").catch(() => null);
const shellModule = navigationModule ? null : await import("../core/shell.js");
const renderSiteNav = navigationModule?.renderSiteNav ?? shellModule.renderSiteNav;

function getReviewHref(lessonId) {
  const params = new URLSearchParams({
    lesson: lessonId,
    mode: "review",
  });

  return `./problems.html?${params.toString()}`;
}

function refreshStateFromStorage() {
  state.progress = loadProgress();

  const uiState = loadUiState();
  state.filter = uiState.filter;
  state.selectedLessons = new Set(uiState.selectedLessons);
  state.selectedId = uiState.lastViewedId;
}

function getWrongLessons() {
  return examples
    .map((example) => {
      const lessonStatus = getLessonStatus(state, example);

      return {
        example,
        lessonStatus,
        percent: lessonStatus.total === 0 ? 0 : Math.round((lessonStatus.correct / lessonStatus.total) * 100),
      };
    })
    .filter(({ lessonStatus }) => lessonStatus.wrong > 0)
    .sort((left, right) => {
      if (right.lessonStatus.wrong !== left.lessonStatus.wrong) {
        return right.lessonStatus.wrong - left.lessonStatus.wrong;
      }

      return left.percent - right.percent;
    });
}

function renderSummaryCards(globalStats, wrongLessons) {
  return `
    <div class="stats-grid">
      <div class="stat-card">
        <span class="stat-label">오답이 남은 예제</span>
        <span class="stat-value">${wrongLessons.length}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">남은 오답 문항</span>
        <span class="stat-value">${globalStats.wrongItems}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">맞힌 문항</span>
        <span class="stat-value">${globalStats.solvedItems}/${globalStats.totalItems}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">완료한 예제</span>
        <span class="stat-value">${globalStats.completedLessons}</span>
      </div>
    </div>
  `;
}

function renderWrongLessonCard({ example, lessonStatus, percent }) {
  return `
    <article class="lesson-card">
      <div class="lesson-card-head">
        <span class="lesson-code">${escapeHtml(example.file)}</span>
        <span class="lesson-badge lesson-badge-wrong">오답 ${lessonStatus.wrong}</span>
      </div>
      <div>
        <h3 class="lesson-card-title">${escapeHtml(example.title)}</h3>
        <p class="lesson-theme">${escapeHtml(example.theme)}</p>
      </div>
      <p class="small-note">${escapeHtml(example.goal)}</p>
      <div class="lesson-badges">
        <span class="lesson-badge">진도 ${lessonStatus.correct}/${lessonStatus.total}</span>
        <span class="lesson-badge">${percent}% 완료</span>
      </div>
      <div class="lesson-progress">
        <span class="progress-bar"><span style="width:${percent}%"></span></span>
        ${percent}%
      </div>
      <div class="button-row">
        <a class="btn btn-primary" href="${getReviewHref(example.id)}">오답 다시 풀기</a>
      </div>
    </article>
  `;
}

function renderEmptyState() {
  return `
    <section class="lesson-panel">
      <div class="empty-state">
        <h2>지금은 남아 있는 오답이 없어요.</h2>
        <p>정말 잘하고 있어요. 문제 페이지로 돌아가서 새로운 예제를 풀거나, 이미 푼 예제를 다시 살펴볼 수 있습니다.</p>
      </div>
      <div class="button-row" style="margin-top:16px;">
        <a class="btn btn-primary" href="./problems.html">문제 페이지로 이동</a>
        <a class="btn btn-secondary" href="./">소개 페이지로 이동</a>
      </div>
    </section>
  `;
}

function renderReviewList(wrongLessons) {
  return `
    <section class="lesson-panel">
      <div class="section-heading">
        <h2>오답이 남은 예제</h2>
        <p>아래 예제는 아직 틀린 문항이 남아 있는 항목입니다. 각 카드의 버튼으로 바로 review 모드로 재개할 수 있습니다.</p>
      </div>
      <div class="lesson-grid lesson-grid-home">
        ${wrongLessons.map(renderWrongLessonCard).join("")}
      </div>
    </section>
  `;
}

function renderPage() {
  const globalStats = getGlobalStats(state);
  const wrongLessons = getWrongLessons();

  document.title = "오답노트 | C 자료구조 블록 퀴즈";

  app.innerHTML = `
    <div class="page-shell">
      ${renderSiteNav("review")}
      <header class="hero">
        <div class="hero-copy">
          <p class="eyebrow">Wrong Answer Notebook</p>
          <h1>틀린 문제만 모아<br />바로 다시 풀 수 있는 오답노트</h1>
          <p class="hero-text">
            오답이 남은 예제만 골라서 보여 주기 때문에, 다시 공부할 대상을 빠르게 찾을 수 있습니다.
            각 카드에서 바로 문제 페이지로 이동해 review 모드로 이어서 풀어 보세요.
          </p>
        </div>
        <div class="hero-stats">
          <div>
            <p class="eyebrow">Current Review</p>
            <p class="meta-copy">남은 오답 문항과 진도를 한눈에 보고, 바로 다음 복습으로 넘어갈 수 있습니다.</p>
          </div>
          ${renderSummaryCards(globalStats, wrongLessons)}
        </div>
      </header>

      <main class="home-layout">
        ${
          wrongLessons.length > 0
            ? renderReviewList(wrongLessons)
            : renderEmptyState()
        }
      </main>
    </div>
  `;
}

function rerender() {
  refreshStateFromStorage();
  renderPage();
}

window.addEventListener("storage", (event) => {
  if (event.key === null || event.key === undefined) {
    return;
  }

  if (event.key === "c-structure-quiz-progress-v2" || event.key === "c-structure-quiz-ui-v2") {
    rerender();
  }
});

rerender();
