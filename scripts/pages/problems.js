import { renderSiteNav } from "../core/shell.js?v=20260320b";
import {
  createAppState,
  getExampleById,
  getGlobalStats,
  getLessonStatus,
  getProblemModeFromUrl,
  isValidExampleId,
  saveState,
} from "../core/store.js";
import {
  handleLessonChange,
  handleLessonClick,
  getLessonProblemFlow,
  loadSource,
  openCodeSection,
  renderLessonLoading,
  renderLessonReady,
} from "../core/lesson.js?v=20260321a";

const app = document.querySelector("#app");
const state = createAppState();
const initialMode = getProblemModeFromUrl();

if (initialMode === "review") {
  state.filter = "wrong";
}

function getInitialLessonId() {
  const params = new URLSearchParams(window.location.search);
  const lessonId = params.get("lesson");

  if (isValidExampleId(lessonId)) {
    return lessonId;
  }

  return state.selectedId;
}

function updateLessonQuery(id) {
  const url = new URL(window.location.href);
  url.searchParams.set("lesson", id);
  window.history.replaceState({}, "", url);
}

state.selectedId = getInitialLessonId();
updateLessonQuery(state.selectedId);

function renderPageShell(body) {
  const stats = getGlobalStats(state);
  const example = getExampleById(state.selectedId);
  const lessonStatus = getLessonStatus(state, example);
  const flow = getLessonProblemFlow(state, example);
  const currentMode = getProblemModeFromUrl() === "review" ? "오답 복습" : "일반 학습";
  const overallPercent = stats.totalItems ? Math.round((stats.solvedItems / stats.totalItems) * 100) : 0;
  const lessonPercent = lessonStatus.total
    ? Math.round((lessonStatus.correct / lessonStatus.total) * 100)
    : 0;
  const currentQuestionLabel =
    flow.items.length > 0 ? `${flow.currentIndex + 1}/${flow.items.length}` : "완료";

  return `
    <div class="page-shell feature-page problems-page">
      ${renderSiteNav("problems")}
      <main class="problem-dashboard">
        <section class="progress-command-board problem-command-board">
          <div class="progress-command-main">
            <p class="eyebrow">Problems</p>
            <div class="progress-command-head">
              <h1>문제</h1>
              <div class="progress-command-actions">
                <a class="btn btn-primary" href="./review.html">오답노트</a>
                <a class="btn btn-secondary" href="./progress.html">학습 진행도</a>
              </div>
            </div>
            <p class="progress-command-copy">
              왼쪽에서 코드를 고르고, 오른쪽에서는 현재 문항 하나에만 집중해 이전과 다음으로 넘기며 푸는 문제 작업대입니다.
            </p>
            <div class="progress-command-meta">
              <span class="summary-pill">현재 예제 ${example.file}</span>
              <span class="summary-pill">현재 모드 ${currentMode}</span>
              <span class="summary-pill">현재 문제 ${currentQuestionLabel}</span>
              <span class="summary-pill">현재 코드 진도 ${lessonStatus.correct}/${lessonStatus.total}</span>
              <span class="summary-pill">현재 코드 오답 ${lessonStatus.wrong}문항</span>
            </div>
          </div>
          <div class="progress-command-summary">
            <div class="progress-summary-row">
              <span>전체 완료율</span>
              <strong>${overallPercent}%</strong>
              <small>정답 ${stats.solvedItems}/${stats.totalItems}</small>
            </div>
            <div class="progress-summary-row">
              <span>현재 코드 완료율</span>
              <strong>${lessonPercent}%</strong>
              <small>${lessonStatus.correct}/${lessonStatus.total}</small>
            </div>
            <div class="progress-summary-row">
              <span>보이는 문제</span>
              <strong>${flow.items.length}</strong>
              <small>현재 코드 기준</small>
            </div>
            <div class="progress-summary-row">
              <span>남은 오답</span>
              <strong>${stats.wrongItems}</strong>
              <small>전체 예제 기준</small>
            </div>
          </div>
        </section>
        ${body}
      </main>
    </div>
  `;
}

async function renderLessonPage() {
  const example = getExampleById(state.selectedId);
  const requestToken = ++state.renderToken;
  document.title = `${example.file} | 문제 페이지`;
  app.innerHTML = renderPageShell(renderLessonLoading(state, example));

  const source = await loadSource(state, example);

  if (requestToken !== state.renderToken || state.selectedId !== example.id) {
    return;
  }

  app.innerHTML = renderPageShell(renderLessonReady(state, example, source));
}

function rerender() {
  saveState(state);
  renderLessonPage();
}

document.addEventListener("change", (event) => {
  handleLessonChange(event, { state, rerender });
});

document.addEventListener("click", async (event) => {
  await handleLessonClick(event, {
    state,
    rerender,
    navigateToLesson: updateLessonQuery,
  });
});

window.addEventListener("hashchange", () => {
  if (window.location.hash === "#lesson-code") {
    openCodeSection();
  }
});

renderLessonPage();
