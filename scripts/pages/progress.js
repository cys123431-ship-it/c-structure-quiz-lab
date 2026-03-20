import {
  createAppState,
  examples,
  getExampleById,
  getGlobalStats,
  getLessonHref,
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

function getPhaseSummary(records) {
  return records.reduce(
    (acc, record) => {
      acc.total += 1;
      acc[record.phaseKey] += 1;
      return acc;
    },
    { total: 0, mastered: 0, active: 0, untouched: 0 }
  );
}

function getAverageProgress(records) {
  if (records.length === 0) {
    return 0;
  }

  return Math.round(records.reduce((sum, record) => sum + record.percent, 0) / records.length);
}

function getCompletionRate(stats) {
  return stats.totalItems ? Math.round((stats.solvedItems / stats.totalItems) * 100) : 0;
}

function getAttemptSuccessRate(stats) {
  const attempted = stats.solvedItems + stats.wrongItems;
  return attempted ? Math.round((stats.solvedItems / attempted) * 100) : 0;
}

function getSelectionRate(stats) {
  return stats.lessonCount ? Math.round((stats.selectedLessons / stats.lessonCount) * 100) : 0;
}

function buildLessonRecord(example) {
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
}

function getAllLessonRecords() {
  return examples.map(buildLessonRecord);
}

function getFilteredLessonRecords(allRecords, filter = pageState.filter) {
  const visibleIds = new Set(getVisibleExamples(pageState, filter).map((example) => example.id));
  return allRecords.filter((record) => visibleIds.has(record.example.id));
}

function getAttentionScore(record) {
  return record.status.wrong * 100 + (record.selected ? 18 : 0) + (record.active ? 12 : 0) + (100 - record.percent);
}

function getFocusLessons(records) {
  const ranked = [...records].sort((left, right) => {
    const scoreDiff = getAttentionScore(right) - getAttentionScore(left);

    if (scoreDiff !== 0) {
      return scoreDiff;
    }

    if (right.status.wrong !== left.status.wrong) {
      return right.status.wrong - left.status.wrong;
    }

    return left.percent - right.percent;
  });

  return ranked.slice(0, 6);
}

function renderSiteNav() {
  if (layoutHelpers && typeof layoutHelpers.renderSiteNav === "function") {
    return layoutHelpers.renderSiteNav("progress");
  }

  return "";
}

function renderHeadlineBoard(allRecords, filteredRecords) {
  const stats = getGlobalStats(pageState);
  const currentLesson = getExampleById(pageState.selectedId);
  const currentStatus = getLessonStatus(pageState, currentLesson);
  const activeFilter = FILTERS.find((item) => item.key === pageState.filter)?.label || "전체";

  return `
    <section class="progress-command-board">
      <div class="progress-command-main">
        <p class="eyebrow">Learning Dashboard</p>
        <div class="progress-command-head">
          <h1>학습 진행도</h1>
          <div class="progress-command-actions">
            <a class="btn btn-primary" href="${getLessonHref(currentLesson.id)}">최근 문제</a>
            <a class="btn btn-secondary" href="./problems.html">문제</a>
            <a class="btn btn-secondary" href="./review.html">오답노트</a>
          </div>
        </div>
        <p class="progress-command-copy">
          진도, 오답, 집중할 예제를 한 화면에서 바로 보고 다음 행동으로 이어질 수 있게 정리한 학습 보드입니다.
        </p>
        <div class="progress-command-meta">
          <span class="summary-pill">현재 예제 ${escapeHtml(currentLesson.file)}</span>
          <span class="summary-pill">현재 필터 ${escapeHtml(activeFilter)}</span>
          <span class="summary-pill">현재 진도 ${getLessonPercent(currentStatus)}%</span>
          <span class="summary-pill">표시 중 ${filteredRecords.length}개</span>
          <span class="summary-pill">남은 오답 ${stats.wrongItems}문항</span>
        </div>
      </div>

      <div class="progress-command-summary">
        <div class="progress-summary-row">
          <span>전체 완료율</span>
          <strong>${getCompletionRate(stats)}%</strong>
          <small>정답 ${stats.solvedItems}/${stats.totalItems}</small>
        </div>
        <div class="progress-summary-row">
          <span>평균 진도</span>
          <strong>${getAverageProgress(allRecords)}%</strong>
          <small>예제 전체 평균</small>
        </div>
        <div class="progress-summary-row">
          <span>선택 집중도</span>
          <strong>${getSelectionRate(stats)}%</strong>
          <small>선택 ${stats.selectedLessons}개</small>
        </div>
        <div class="progress-summary-row">
          <span>진행 중 예제</span>
          <strong>${getPhaseSummary(allRecords).active}</strong>
          <small>바로 이어서 풀 대상</small>
        </div>
      </div>
    </section>
  `;
}

function renderFilterStrip(filteredCount) {
  return `
    <section class="progress-filter-strip">
      <div class="progress-filter-head">
        <div>
          <h2>보기 필터</h2>
          <p>필터를 바꾸면 아래 보드와 표가 함께 바뀝니다.</p>
        </div>
        <div class="section-badge">${filteredCount}개 표시</div>
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
      <div class="progress-filter-note">
        <span>선택 체크는 문제 페이지와 공유됩니다.</span>
        <span>오답 필터로 복습 대상을 바로 추릴 수 있습니다.</span>
      </div>
    </section>
  `;
}

function renderOverviewMetric(label, value, detail, tone = "") {
  return `
    <div class="progress-metric-row ${tone}">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      <small>${escapeHtml(detail)}</small>
    </div>
  `;
}

function renderProgressBars(allRecords) {
  return allRecords
    .map((record) => {
      const minHeight = record.percent > 0 ? Math.max(record.percent, 12) : 8;
      const shortCode = record.example.file.match(/(\d{2})\.c$/)?.[1] ?? record.example.file;

      return `
        <a class="progress-mini-bar ${record.active ? "is-active" : ""}" href="${getLessonHref(record.example.id)}">
          <span class="progress-mini-track">
            <span
              class="progress-mini-fill progress-mini-fill-${record.phaseKey}"
              style="height:${minHeight}%"
            ></span>
          </span>
          <span class="progress-mini-label">${escapeHtml(shortCode)}</span>
        </a>
      `;
    })
    .join("");
}

function renderPhaseMeter(label, count, total, tone) {
  const percent = total ? Math.round((count / total) * 100) : 0;

  return `
    <div class="progress-phase-meter">
      <div class="progress-phase-head">
        <span>${escapeHtml(label)}</span>
        <strong>${count}개 · ${percent}%</strong>
      </div>
      <span class="progress-phase-track">
        <span class="progress-phase-fill progress-phase-fill-${tone}" style="width:${count > 0 ? Math.max(percent, 6) : 0}%"></span>
      </span>
    </div>
  `;
}

function renderInsightBoard(allRecords) {
  const stats = getGlobalStats(pageState);
  const phaseSummary = getPhaseSummary(allRecords);

  return `
    <section class="progress-board">
      <div class="progress-board-head">
        <div>
          <h2>한눈에 보기</h2>
          <p>작은 카드 대신 하나의 보드에서 분포, 흐름, 핵심 수치를 같이 읽을 수 있게 정리했습니다.</p>
        </div>
      </div>
      <div class="progress-board-grid">
        <div class="progress-board-chart">
          <div class="progress-board-section-head">
            <h3>예제별 진도 흐름</h3>
            <p>코드별 진도를 세로 막대로 압축해 비교합니다.</p>
          </div>
          <div class="progress-mini-bars">
            ${renderProgressBars(allRecords)}
          </div>
          <div class="progress-mini-legend">
            <span><i class="is-mastered"></i>완료</span>
            <span><i class="is-active"></i>진행 중</span>
            <span><i class="is-untouched"></i>미시작</span>
          </div>
        </div>

        <div class="progress-board-aside">
          <div class="progress-board-section-head">
            <h3>상태 분포</h3>
            <p>완료, 진행 중, 미시작 비중과 복습 지표를 같은 열에서 봅니다.</p>
          </div>
          <div class="progress-phase-stack">
            ${renderPhaseMeter("완료", phaseSummary.mastered, stats.lessonCount, "mastered")}
            ${renderPhaseMeter("진행 중", phaseSummary.active, stats.lessonCount, "active")}
            ${renderPhaseMeter("미시작", phaseSummary.untouched, stats.lessonCount, "untouched")}
          </div>
          <div class="progress-metric-stack">
            ${renderOverviewMetric("정답 정리도", `${getAttemptSuccessRate(stats)}%`, "시도한 문항 대비 정답 정리율")}
            ${renderOverviewMetric("선택한 예제", `${stats.selectedLessons}개`, "집중 관리 중인 예제")}
            ${renderOverviewMetric("남은 오답", `${stats.wrongItems}문항`, "복습 필요 항목", stats.wrongItems > 0 ? "is-alert" : "")}
            ${renderOverviewMetric("평균 진도", `${getAverageProgress(allRecords)}%`, "전체 예제 평균")}
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderPriorityRow(record) {
  return `
    <a class="progress-priority-row" href="${getLessonHref(record.example.id)}">
      <div class="progress-priority-top">
        <span class="lesson-code">${escapeHtml(record.example.file)}</span>
        ${record.status.wrong > 0 ? `<span class="lesson-badge lesson-badge-wrong">오답 ${record.status.wrong}</span>` : `<span class="lesson-badge">${escapeHtml(record.phaseLabel)}</span>`}
      </div>
      <strong>${escapeHtml(record.example.title)}</strong>
      <span>${escapeHtml(record.percent)}% 완료</span>
    </a>
  `;
}

function renderLessonRow(record) {
  return `
    <div class="progress-table-row ${record.active ? "is-active" : ""}">
      <label class="progress-table-check">
        <input
          type="checkbox"
          data-action="toggle-selection"
          data-lesson-id="${record.example.id}"
          ${record.selected ? "checked" : ""}
        />
        선택
      </label>

      <div class="progress-table-lesson">
        <div class="progress-table-lesson-top">
          <span class="lesson-code">${escapeHtml(record.example.file)}</span>
          <span class="lesson-badge">${escapeHtml(record.phaseLabel)}</span>
          ${record.active ? '<span class="lesson-badge lesson-badge-active">최근</span>' : ""}
          ${record.status.wrong > 0 ? `<span class="lesson-badge lesson-badge-wrong">오답 ${record.status.wrong}</span>` : ""}
        </div>
        <strong>${escapeHtml(record.example.title)}</strong>
        <span>${escapeHtml(record.example.theme)}</span>
      </div>

      <div class="progress-table-progress">
        <span class="progress-bar"><span style="width:${record.percent}%"></span></span>
        <div class="progress-table-progress-meta">
          <span>진도 ${record.status.correct}/${record.status.total}</span>
          <strong>${record.percent}%</strong>
        </div>
      </div>

      <div class="progress-table-count">${record.status.wrong}문항</div>

      <div class="progress-table-action">
        <a class="btn btn-secondary btn-inline" href="${getLessonHref(record.example.id)}">문제 열기</a>
      </div>
    </div>
  `;
}

function renderWorkspaceBoard(allRecords, filteredRecords) {
  const currentLesson = getExampleById(pageState.selectedId);
  const currentRecord = allRecords.find((record) => record.example.id === currentLesson.id) ?? allRecords[0];
  const focusLessons = getFocusLessons(filteredRecords.length > 0 ? filteredRecords : allRecords);
  const activeFilter = FILTERS.find((item) => item.key === pageState.filter)?.label || "전체";

  return `
    <section class="progress-board">
      <div class="progress-board-head">
        <div>
          <h2>학습 작업대</h2>
          <p>왼쪽에는 지금 볼 예제를, 오른쪽에는 전체 목록을 표 형식으로 압축해 두었습니다.</p>
        </div>
        <div class="section-badge">${escapeHtml(activeFilter)}</div>
      </div>

      <div class="progress-workspace">
        <aside class="progress-priority-rail">
          <div class="progress-board-section-head">
            <h3>현재 예제</h3>
            <p>지금 이어서 볼 대상</p>
          </div>
          <div class="progress-current-focus">
            <div class="progress-priority-top">
              <span class="lesson-code">${escapeHtml(currentRecord.example.file)}</span>
              <span class="lesson-badge">${escapeHtml(currentRecord.phaseLabel)}</span>
            </div>
            <strong>${escapeHtml(currentRecord.example.title)}</strong>
            <span>${escapeHtml(currentRecord.example.goal)}</span>
            <div class="progress-current-meta">
              <span class="summary-pill">진도 ${currentRecord.status.correct}/${currentRecord.status.total}</span>
              <span class="summary-pill">오답 ${currentRecord.status.wrong}</span>
              <span class="summary-pill">${currentRecord.percent}% 완료</span>
            </div>
          </div>

          <div class="progress-board-section-head">
            <h3>우선 확인</h3>
            <p>오답과 남은 진도를 기준으로 먼저 볼 예제를 정렬했습니다.</p>
          </div>
          <div class="progress-priority-list">
            ${focusLessons.map(renderPriorityRow).join("")}
          </div>

          <div class="progress-link-list">
            <a class="progress-link-row" href="./review.html">
              <span>오답노트</span>
              <strong>복습 이동</strong>
            </a>
            <a class="progress-link-row" href="./problems.html">
              <span>문제 페이지</span>
              <strong>전체 풀이</strong>
            </a>
          </div>
        </aside>

        <div class="progress-table-shell">
          ${
            filteredRecords.length > 0
              ? `
                <div class="progress-table-head">
                  <span>선택</span>
                  <span>예제</span>
                  <span>진도</span>
                  <span>오답</span>
                  <span>이동</span>
                </div>
                <div class="progress-table">
                  ${filteredRecords.map(renderLessonRow).join("")}
                </div>
              `
              : `
                <div class="progress-empty">
                  현재 필터와 일치하는 예제가 없습니다. 다른 필터를 선택하면 바로 목록이 갱신됩니다.
                </div>
              `
          }
        </div>
      </div>
    </section>
  `;
}

function renderPage() {
  const allRecords = getAllLessonRecords();
  const filteredRecords = getFilteredLessonRecords(allRecords);

  document.title = "학습 진행도 | C 자료구조 블록 퀴즈";

  app.innerHTML = `
    <div class="page-shell feature-page progress-page">
      ${renderSiteNav()}
      <main class="progress-dashboard">
        ${renderHeadlineBoard(allRecords, filteredRecords)}
        ${renderFilterStrip(filteredRecords.length)}
        ${renderInsightBoard(allRecords)}
        ${renderWorkspaceBoard(allRecords, filteredRecords)}
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

  toggleSelection(checkbox.dataset.lessonId);
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
    layoutHelpers = await import("../core/navigation.js?v=20260320b");
  } catch {
    layoutHelpers = await import("../core/shell.js?v=20260320b");
  }

  renderPage();
}

init();
