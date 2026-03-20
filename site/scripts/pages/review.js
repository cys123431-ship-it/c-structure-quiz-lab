import {
  examples,
  createAppState,
  getGlobalStats,
  getLessonStatus,
  loadProgress,
  loadUiState,
} from "../core/store.js";
import { escapeHtml } from "../core/utils.js";

const app = document.querySelector("#app");
const state = createAppState();

const navigationModule = await import("../core/navigation.js?v=20260320b").catch(() => null);
const shellModule = navigationModule ? null : await import("../core/shell.js?v=20260320b");
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

function getCompletionRate(globalStats) {
  return globalStats.totalItems ? Math.round((globalStats.solvedItems / globalStats.totalItems) * 100) : 0;
}

function getWrongRate(globalStats) {
  return globalStats.totalItems ? Math.round((globalStats.wrongItems / globalStats.totalItems) * 100) : 0;
}

function getAverageWrongProgress(wrongLessons) {
  if (wrongLessons.length === 0) {
    return 0;
  }

  return Math.round(
    wrongLessons.reduce((sum, lesson) => sum + lesson.percent, 0) / wrongLessons.length
  );
}

function getTopWrongLesson(wrongLessons) {
  return wrongLessons[0] || null;
}

function renderCommandBoard(globalStats, wrongLessons) {
  const topLesson = getTopWrongLesson(wrongLessons);

  return `
    <section class="progress-command-board">
      <div class="progress-command-main">
        <p class="eyebrow">Wrong Answer Notebook</p>
        <div class="progress-command-head">
          <h1>오답노트</h1>
          <div class="progress-command-actions">
            <a class="btn btn-primary" href="./problems.html">문제</a>
            <a class="btn btn-secondary" href="./progress.html">학습 진행도</a>
            <a class="btn btn-secondary" href="./index.html">소개</a>
          </div>
        </div>
        <p class="progress-command-copy">
          복습이 필요한 예제만 모아 우선순위, 남은 오답, 재진입 링크를 한 화면에서 바로 볼 수 있게 정리한 복습 보드입니다.
        </p>
        <div class="progress-command-meta">
          <span class="summary-pill">복습 대상 ${wrongLessons.length}개</span>
          <span class="summary-pill">남은 오답 ${globalStats.wrongItems}문항</span>
          <span class="summary-pill">맞힌 문항 ${globalStats.solvedItems}/${globalStats.totalItems}</span>
          <span class="summary-pill">선택 예제 ${state.selectedLessons.size}개</span>
          <span class="summary-pill">${topLesson ? `최우선 ${escapeHtml(topLesson.example.file)}` : "현재 복습 완료"}</span>
        </div>
      </div>

      <div class="progress-command-summary">
        <div class="progress-summary-row">
          <span>복습 대상 예제</span>
          <strong>${wrongLessons.length}</strong>
          <small>오답이 남은 코드 수</small>
        </div>
        <div class="progress-summary-row">
          <span>남은 오답</span>
          <strong>${globalStats.wrongItems}</strong>
          <small>전체 예제 기준</small>
        </div>
        <div class="progress-summary-row">
          <span>전체 완료율</span>
          <strong>${getCompletionRate(globalStats)}%</strong>
          <small>정답 ${globalStats.solvedItems}/${globalStats.totalItems}</small>
        </div>
        <div class="progress-summary-row">
          <span>완료 예제</span>
          <strong>${globalStats.completedLessons}</strong>
          <small>전체 ${globalStats.lessonCount}개 중</small>
        </div>
      </div>
    </section>
  `;
}

function renderInsightRow({ example, lessonStatus, percent }) {
  return `
    <a class="review-insight-row" href="${getReviewHref(example.id)}">
      <div class="review-insight-top">
        <span class="lesson-code">${escapeHtml(example.file)}</span>
        <span class="lesson-badge lesson-badge-wrong">오답 ${lessonStatus.wrong}</span>
      </div>
      <strong>${escapeHtml(example.title)}</strong>
      <div class="review-insight-meta">
        <span class="progress-bar"><span style="width:${percent}%"></span></span>
        <span>${percent}% 완료</span>
      </div>
    </a>
  `;
}

function renderMetricRow(label, value, detail, tone = "") {
  return `
    <div class="progress-metric-row ${tone}">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      <small>${escapeHtml(detail)}</small>
    </div>
  `;
}

function renderInsightBoard(globalStats, wrongLessons) {
  const topLesson = getTopWrongLesson(wrongLessons);

  return `
    <section class="progress-board">
      <div class="progress-board-head">
        <div>
          <h2>한눈에 보기</h2>
          <p>복습 우선순위와 복습 지표를 작은 카드 대신 한 보드에서 같이 읽을 수 있게 정리했습니다.</p>
        </div>
      </div>
      <div class="progress-board-grid">
        <div class="progress-board-chart">
          <div class="progress-board-section-head">
            <h3>우선 복습 예제</h3>
            <p>오답 수가 많은 순서대로 먼저 다시 볼 대상을 압축해 보여 줍니다.</p>
          </div>
          ${
            wrongLessons.length > 0
              ? `<div class="review-insight-list">${wrongLessons.slice(0, 5).map(renderInsightRow).join("")}</div>`
              : `<div class="progress-empty">현재 남아 있는 오답이 없습니다. 문제 페이지에서 새 예제를 풀거나, 이미 풀었던 코드를 다시 확인해 보세요.</div>`
          }
        </div>

        <div class="progress-board-aside">
          <div class="progress-board-section-head">
            <h3>복습 지표</h3>
            <p>오답 비중과 복습 대상 평균 진도를 같은 열에서 확인할 수 있습니다.</p>
          </div>
          <div class="progress-metric-stack">
            ${renderMetricRow("오답 비중", `${getWrongRate(globalStats)}%`, "전체 문항 중 남아 있는 오답")}
            ${renderMetricRow("복습 대상 평균 진도", `${getAverageWrongProgress(wrongLessons)}%`, "오답이 남은 예제 평균")}
            ${renderMetricRow("완료 예제", `${globalStats.completedLessons}개`, "전체 예제 중 완료 상태")}
            ${renderMetricRow("최우선 복습", topLesson ? topLesson.example.file : "없음", topLesson ? `${topLesson.lessonStatus.wrong}문항 남음` : "현재는 남은 오답 없음")}
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderPriorityRow({ example, lessonStatus, percent }) {
  return `
    <a class="progress-priority-row" href="${getReviewHref(example.id)}">
      <div class="progress-priority-top">
        <span class="lesson-code">${escapeHtml(example.file)}</span>
        <span class="lesson-badge lesson-badge-wrong">오답 ${lessonStatus.wrong}</span>
      </div>
      <strong>${escapeHtml(example.title)}</strong>
      <span>${percent}% 완료</span>
    </a>
  `;
}

function renderReviewTableRow({ example, lessonStatus, percent }) {
  return `
    <div class="review-table-row">
      <div class="review-table-lesson">
        <div class="progress-table-lesson-top">
          <span class="lesson-code">${escapeHtml(example.file)}</span>
          <span class="lesson-badge lesson-badge-wrong">오답 ${lessonStatus.wrong}</span>
        </div>
        <strong>${escapeHtml(example.title)}</strong>
        <span>${escapeHtml(example.theme)}</span>
      </div>

      <div class="review-table-progress">
        <span class="progress-bar"><span style="width:${percent}%"></span></span>
        <div class="review-table-progress-meta">
          <span>진도 ${lessonStatus.correct}/${lessonStatus.total}</span>
          <strong>${percent}%</strong>
        </div>
      </div>

      <div class="review-table-count">${lessonStatus.wrong}문항</div>

      <div class="review-table-action">
        <a class="btn btn-secondary btn-inline" href="${getReviewHref(example.id)}">다시 풀기</a>
      </div>
    </div>
  `;
}

function renderWorkspaceBoard(globalStats, wrongLessons) {
  const topLesson = getTopWrongLesson(wrongLessons);

  if (wrongLessons.length === 0) {
    return `
      <section class="progress-board">
        <div class="progress-board-head">
          <div>
            <h2>복습 작업대</h2>
            <p>현재 남아 있는 오답이 없어서 복습 목록 대신 다음 행동으로 바로 이어질 수 있게 정리했습니다.</p>
          </div>
          <div class="section-badge">0개 대상</div>
        </div>
        <div class="progress-empty">
          현재 남아 있는 오답이 없습니다. 전체 완료율은 ${getCompletionRate(globalStats)}%이고,
          남은 오답은 ${globalStats.wrongItems}문항입니다.
        </div>
        <div class="progress-link-list review-empty-links">
          <a class="progress-link-row" href="./problems.html">
            <span>문제 페이지</span>
            <strong>새 문제 풀기</strong>
          </a>
          <a class="progress-link-row" href="./progress.html">
            <span>학습 진행도</span>
            <strong>전체 진도 확인</strong>
          </a>
          <a class="progress-link-row" href="./index.html">
            <span>소개 페이지</span>
            <strong>허브 이동</strong>
          </a>
        </div>
      </section>
    `;
  }

  return `
    <section class="progress-board">
      <div class="progress-board-head">
        <div>
          <h2>복습 작업대</h2>
          <p>왼쪽은 우선 복습 예제, 오른쪽은 다시 들어갈 전체 복습 목록을 표로 압축했습니다.</p>
        </div>
        <div class="section-badge">${wrongLessons.length}개 대상</div>
      </div>

      <div class="progress-workspace">
        <aside class="progress-priority-rail">
          <div class="progress-board-section-head">
            <h3>현재 최우선</h3>
            <p>가장 먼저 다시 볼 필요가 큰 예제를 앞에 두었습니다.</p>
          </div>
          ${
            topLesson
              ? `
                <div class="progress-current-focus">
                  <div class="progress-priority-top">
                    <span class="lesson-code">${escapeHtml(topLesson.example.file)}</span>
                    <span class="lesson-badge lesson-badge-wrong">오답 ${topLesson.lessonStatus.wrong}</span>
                  </div>
                  <strong>${escapeHtml(topLesson.example.title)}</strong>
                  <span>${escapeHtml(topLesson.example.goal)}</span>
                  <div class="progress-current-meta">
                    <span class="summary-pill">진도 ${topLesson.lessonStatus.correct}/${topLesson.lessonStatus.total}</span>
                    <span class="summary-pill">${topLesson.percent}% 완료</span>
                    <span class="summary-pill">선택 ${state.selectedLessons.has(topLesson.example.id) ? "예" : "아니오"}</span>
                  </div>
                </div>
              `
              : `<div class="progress-empty">현재 남아 있는 오답이 없습니다. 새로운 문제를 풀거나 이미 푼 코드를 다시 확인해 보세요.</div>`
          }

          <div class="progress-board-section-head">
            <h3>우선 순서</h3>
            <p>오답 수와 남은 진도를 기준으로 바로 다시 풀 대상을 정리했습니다.</p>
          </div>
          <div class="progress-priority-list">
            ${wrongLessons.length > 0 ? wrongLessons.slice(0, 6).map(renderPriorityRow).join("") : ""}
          </div>

          <div class="progress-link-list">
            <a class="progress-link-row" href="./problems.html">
              <span>문제 페이지</span>
              <strong>복습 시작</strong>
            </a>
            <a class="progress-link-row" href="./progress.html">
              <span>학습 진행도</span>
              <strong>전체 진도 확인</strong>
            </a>
            <a class="progress-link-row" href="./index.html">
              <span>소개 페이지</span>
              <strong>허브 이동</strong>
            </a>
          </div>
        </aside>

        <div class="review-table-shell">
          <div class="review-table-head">
            <span>예제</span>
            <span>진도</span>
            <span>오답</span>
            <span>이동</span>
          </div>
          <div class="review-table">
            ${wrongLessons.map(renderReviewTableRow).join("")}
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderPage() {
  const globalStats = getGlobalStats(state);
  const wrongLessons = getWrongLessons();

  document.title = "오답노트 | C 자료구조 블록 퀴즈";

  app.innerHTML = `
    <div class="page-shell feature-page review-page">
      ${renderSiteNav("review")}
      <main class="review-dashboard">
        ${renderCommandBoard(globalStats, wrongLessons)}
        ${renderInsightBoard(globalStats, wrongLessons)}
        ${renderWorkspaceBoard(globalStats, wrongLessons)}
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
