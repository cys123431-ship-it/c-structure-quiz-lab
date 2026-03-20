import { renderSiteNav } from "../core/shell.js";
import {
  createAppState,
  getExampleById,
  getGlobalStats,
  getProblemModeFromUrl,
  isValidExampleId,
  saveState,
} from "../core/store.js";
import {
  handleLessonChange,
  handleLessonClick,
  loadSource,
  openCodeSection,
  renderLessonLoading,
  renderLessonReady,
} from "../core/lesson.js";

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
  const currentMode = getProblemModeFromUrl() === "review" ? "오답 복습" : "일반 학습";

  return `
    <div class="page-shell feature-page problems-page">
      ${renderSiteNav("problems")}
      <section class="hero hero-page">
        <div class="hero-copy hero-copy-wide">
          <p class="eyebrow">Problems</p>
          <h1>선택한 코드로 바로 문제를 풉니다.</h1>
          <p class="hero-text">
            왼쪽에서 예제를 고르면 오른쪽에서 블록 해석, 출력, 빈칸, 복원 문제를 같은 흐름으로 바로 이어서 풉니다.
            현재 보고 있는 코드와 전체 진도를 같이 확인하면서 다음 예제로 넘어가세요.
          </p>
          <div class="button-row hero-actions">
            <a class="btn btn-primary" href="./review.html">오답노트 보기</a>
            <a class="btn btn-secondary" href="./progress.html">학습 진행도 보기</a>
          </div>
          <div class="page-summary-strip">
            <span class="summary-pill">현재 예제 ${example.file}</span>
            <span class="summary-pill">현재 모드 ${currentMode}</span>
            <span class="summary-pill">최근 진도 ${stats.solvedItems}/${stats.totalItems}</span>
          </div>
        </div>
        <div class="hero-stats">
          <div>
            <p class="eyebrow">Workspace Stats</p>
            <p class="meta-copy">문제를 푸는 동안에도 전체 진행도와 남은 오답을 계속 보면서 바로 이어서 학습할 수 있습니다.</p>
          </div>
          <div class="stats-grid">
            <div class="stat-card">
              <span class="stat-label">예제 수</span>
              <span class="stat-value">${stats.lessonCount}</span>
            </div>
            <div class="stat-card">
              <span class="stat-label">완료 예제</span>
              <span class="stat-value">${stats.completedLessons}</span>
            </div>
            <div class="stat-card">
              <span class="stat-label">맞힌 문항</span>
              <span class="stat-value">${stats.solvedItems}/${stats.totalItems}</span>
            </div>
            <div class="stat-card">
              <span class="stat-label">오답 문항</span>
              <span class="stat-value">${stats.wrongItems}</span>
            </div>
          </div>
        </div>
      </section>
      ${body}
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
