import { renderHeroCard, renderHeroStatsCard, renderSiteNav } from "../core/shell.js";
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

  return `
    <div class="page-shell feature-page problems-page">
      ${renderSiteNav("problems")}
      <section class="hero hero-page">
        ${renderHeroCard({
          eyebrow: "Problems Workspace",
          title: "코드를 고르고,<br />문제를 집중해서 푸는 전용 페이지",
          description:
            "왼쪽 세로 탐색기에서 코드를 고르고, 오른쪽에서 블록 해석부터 복원 문제까지 한 코드에 집중해 학습합니다.",
          actions: `
            <a class="btn btn-primary" href="./review.html">오답노트 보기</a>
            <a class="btn btn-secondary" href="./progress.html">학습 진행도 보기</a>
          `,
        })}
        ${renderHeroStatsCard({
          eyebrow: "Workspace Stats",
          description: "문제 페이지에서도 전체 진도와 오답 수를 계속 보면서 다음 코드를 이어서 학습할 수 있습니다.",
          items: [
            { label: "예제 수", value: String(stats.lessonCount) },
            { label: "완료 예제", value: String(stats.completedLessons) },
            { label: "맞힌 문항", value: `${stats.solvedItems}/${stats.totalItems}` },
            { label: "오답 문항", value: String(stats.wrongItems) },
          ],
        })}
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
