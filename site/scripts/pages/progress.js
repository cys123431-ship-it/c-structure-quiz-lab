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

  return ranked.slice(0, 5);
}

function renderSiteNav() {
  if (layoutHelpers && typeof layoutHelpers.renderSiteNav === "function") {
    return layoutHelpers.renderSiteNav("progress");
  }

  return "";
}

function renderHero(allRecords, filteredRecords) {
  const stats = getGlobalStats(pageState);
  const phaseSummary = getPhaseSummary(allRecords);
  const currentLesson = getExampleById(pageState.selectedId);
  const currentStatus = getLessonStatus(pageState, currentLesson);
  const currentPercent = getLessonPercent(currentStatus);
  const activeFilter = FILTERS.find((item) => item.key === pageState.filter)?.label || "전체";

  return `
    <section class="page-hero">
      <div class="hero-panel hero-panel-copy">
        <p class="eyebrow">Learning Dashboard</p>
        <h1>학습 진행도</h1>
        <p class="hero-note">
          기존 성취도와 학습 진행도를 한 화면으로 합쳐, 지금 상태를 한눈에 보고 바로 다음 행동을 고를 수 있게 정리했습니다.
        </p>
        <div class="hero-actions">
          <a class="btn btn-primary" href="${getLessonHref(currentLesson.id)}">최근 문제 열기</a>
          <a class="btn btn-secondary" href="./problems.html">문제 페이지 보기</a>
          <a class="btn btn-secondary" href="./review.html">오답노트 보기</a>
        </div>
        <div class="page-summary-strip">
          <span class="summary-pill">현재 예제 ${escapeHtml(currentLesson.file)}</span>
          <span class="summary-pill">현재 필터 ${escapeHtml(activeFilter)}</span>
          <span class="summary-pill">현재 진도 ${currentPercent}%</span>
          <span class="summary-pill">표시 중 ${filteredRecords.length}개</span>
        </div>
      </div>
      <aside class="hero-panel hero-panel-stats">
        <div>
          <p class="eyebrow">Snapshot</p>
          <p class="hero-note">전체 진행률, 현재 선택 상태, 복습 필요 항목을 같은 보드 안에서 바로 확인합니다.</p>
        </div>
        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-label">전체 완료율</span>
            <span class="stat-value">${getCompletionRate(stats)}%</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">평균 진도</span>
            <span class="stat-value">${getAverageProgress(allRecords)}%</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">진행 중 예제</span>
            <span class="stat-value">${phaseSummary.active}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">남은 오답</span>
            <span class="stat-value">${stats.wrongItems}</span>
          </div>
        </div>
      </aside>
    </section>
  `;
}

function renderFilters(filteredCount) {
  return `
    <section class="progress-toolbar dashboard-panel dashboard-toolbar">
      <div class="section-head">
        <div>
          <h2 class="section-title">보기 필터</h2>
          <p class="section-copy">필터를 바꾸면 아래 테이블과 우선 확인 목록이 함께 바뀝니다.</p>
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
      <div class="dashboard-toolbar-note">
        <span class="summary-pill">선택 체크는 문제 페이지와 같은 목록으로 공유됩니다.</span>
        <span class="summary-pill">오답 있는 예제만 따로 모아 복습 흐름을 바로 만들 수 있습니다.</span>
      </div>
    </section>
  `;
}

function renderKpiTile(label, value, detail, tone = "") {
  return `
    <article class="dashboard-kpi-tile ${tone}">
      <span class="dashboard-kpi-label">${escapeHtml(label)}</span>
      <strong class="dashboard-kpi-value">${escapeHtml(value)}</strong>
      <span class="dashboard-kpi-detail">${escapeHtml(detail)}</span>
    </article>
  `;
}

function renderOverviewPanel(allRecords) {
  const stats = getGlobalStats(pageState);
  const phaseSummary = getPhaseSummary(allRecords);

  return `
    <section class="dashboard-panel">
      <div class="section-head">
        <div>
          <h2 class="section-title">핵심 요약</h2>
          <p class="section-copy">대시보드 상단에서 전체 현황을 숫자로 먼저 확인합니다.</p>
        </div>
      </div>
      <div class="dashboard-kpi-grid">
        ${renderKpiTile("전체 예제", String(stats.lessonCount), "이번 학습 보드에 포함된 총 예제 수")}
        ${renderKpiTile("완료한 예제", String(phaseSummary.mastered), "모든 문항을 마친 예제", "is-primary")}
        ${renderKpiTile("진행 중 예제", String(phaseSummary.active), "계속 이어서 풀 예제")}
        ${renderKpiTile("미시작 예제", String(phaseSummary.untouched), "아직 손대지 않은 예제")}
        ${renderKpiTile("선택한 예제", String(stats.selectedLessons), "집중 관리 중인 예제", "is-soft")}
        ${renderKpiTile("남은 오답", String(stats.wrongItems), "복습이 필요한 문항 수", stats.wrongItems > 0 ? "is-alert" : "")}
      </div>
    </section>
  `;
}

function renderGauge(label, value, description, tone) {
  const safeValue = Math.max(0, Math.min(100, value));

  return `
    <article class="dashboard-gauge dashboard-gauge-${tone}" style="--gauge-value:${safeValue};">
      <div class="dashboard-gauge-ring">
        <div class="dashboard-gauge-core">
          <strong>${safeValue}%</strong>
          <span>${escapeHtml(label)}</span>
        </div>
      </div>
      <div class="dashboard-gauge-copy">
        <h3>${escapeHtml(label)}</h3>
        <p>${escapeHtml(description)}</p>
      </div>
    </article>
  `;
}

function renderProgressBars(allRecords) {
  return allRecords
    .map((record) => {
      const minHeight = record.percent > 0 ? Math.max(record.percent, 12) : 8;
      const shortCode = record.example.file.match(/(\d{2})\.c$/)?.[1] ?? record.example.file;

      return `
        <a class="dashboard-bar ${record.active ? "dashboard-bar-active" : ""}" href="${getLessonHref(record.example.id)}">
          <span class="dashboard-bar-track">
            <span
              class="dashboard-bar-fill dashboard-bar-fill-${record.phaseKey}"
              style="height:${minHeight}%"
            ></span>
          </span>
          <span class="dashboard-bar-label">${escapeHtml(shortCode)}</span>
        </a>
      `;
    })
    .join("");
}

function renderAnalysisGrid(allRecords) {
  const stats = getGlobalStats(pageState);
  const wrongLessonCount = allRecords.filter((record) => record.status.wrong > 0).length;

  return `
    <section class="dashboard-grid dashboard-grid-primary">
      <article class="dashboard-panel">
        <div class="section-head">
          <div>
            <h2 class="section-title">예제별 진도 흐름</h2>
            <p class="section-copy">각 예제의 현재 진도를 막대 높이로 비교해 한눈에 상태를 확인합니다.</p>
          </div>
        </div>
        <div class="dashboard-bars">
          ${renderProgressBars(allRecords)}
        </div>
        <div class="dashboard-bars-legend">
          <span class="dashboard-legend-item">
            <span class="dashboard-legend-dot is-mastered"></span>
            완료
          </span>
          <span class="dashboard-legend-item">
            <span class="dashboard-legend-dot is-active"></span>
            진행 중
          </span>
          <span class="dashboard-legend-item">
            <span class="dashboard-legend-dot is-untouched"></span>
            미시작
          </span>
        </div>
      </article>

      <article class="dashboard-panel">
        <div class="section-head">
          <div>
            <h2 class="section-title">핵심 비율</h2>
            <p class="section-copy">완료율, 정리도, 선택 집중도를 원형 게이지로 요약합니다.</p>
          </div>
        </div>
        <div class="dashboard-gauge-grid">
          ${renderGauge("전체 완료율", getCompletionRate(stats), "전체 문항 기준으로 얼마나 완료했는지 보여 줍니다.", "primary")}
          ${renderGauge("정답 정리도", getAttemptSuccessRate(stats), "이미 시도한 문항 중 정답으로 정리한 비율입니다.", "secondary")}
          ${renderGauge("선택 집중도", getSelectionRate(stats), `${stats.selectedLessons}개 예제를 따로 추려 관리 중입니다.`, wrongLessonCount > 0 ? "warm" : "primary")}
        </div>
      </article>
    </section>
  `;
}

function renderPhaseRow(label, count, total, tone) {
  const percent = total ? Math.round((count / total) * 100) : 0;
  const width = count > 0 ? Math.max(percent, 6) : 0;

  return `
    <div class="dashboard-phase-row">
      <div class="dashboard-phase-head">
        <span>${escapeHtml(label)}</span>
        <strong>${count}개 · ${percent}%</strong>
      </div>
      <span class="dashboard-phase-bar">
        <span class="dashboard-phase-fill dashboard-phase-fill-${tone}" style="width:${width}%"></span>
      </span>
    </div>
  `;
}

function renderLedgerPanel(allRecords) {
  const stats = getGlobalStats(pageState);
  const summary = getPhaseSummary(allRecords);

  return `
    <article class="dashboard-panel">
      <div class="section-head">
        <div>
          <h2 class="section-title">상태 분포</h2>
          <p class="section-copy">성취도와 진행 상태를 한 화면에서 함께 정리한 통합 보드입니다.</p>
        </div>
      </div>
      <div class="dashboard-phase-list">
        ${renderPhaseRow("완료", summary.mastered, stats.lessonCount, "mastered")}
        ${renderPhaseRow("진행 중", summary.active, stats.lessonCount, "active")}
        ${renderPhaseRow("미시작", summary.untouched, stats.lessonCount, "untouched")}
      </div>
      <div class="dashboard-ledger">
        <div class="dashboard-ledger-row">
          <span>맞힌 문항</span>
          <strong>${stats.solvedItems}/${stats.totalItems}</strong>
        </div>
        <div class="dashboard-ledger-row">
          <span>남은 오답</span>
          <strong>${stats.wrongItems}문항</strong>
        </div>
        <div class="dashboard-ledger-row">
          <span>선택한 예제</span>
          <strong>${stats.selectedLessons}개</strong>
        </div>
        <div class="dashboard-ledger-row">
          <span>평균 진도</span>
          <strong>${getAverageProgress(allRecords)}%</strong>
        </div>
      </div>
    </article>
  `;
}

function renderFocusPanel(allRecords, filteredRecords) {
  const sourceRecords = filteredRecords.length > 0 ? filteredRecords : allRecords;
  const focusLessons = getFocusLessons(sourceRecords);
  const currentLesson = getExampleById(pageState.selectedId);
  const currentRecord = allRecords.find((record) => record.example.id === currentLesson.id) ?? sourceRecords[0];

  return `
    <article class="dashboard-panel">
      <div class="section-head">
        <div>
          <h2 class="section-title">우선 확인</h2>
          <p class="section-copy">현재 예제와 바로 손봐야 할 예제를 나란히 확인합니다.</p>
        </div>
      </div>
      <div class="dashboard-focus-stack">
        <div class="dashboard-focus-current">
          <div class="dashboard-table-lesson-head">
            <span class="lesson-code">${escapeHtml(currentRecord.example.file)}</span>
            <span class="lesson-badge">${escapeHtml(currentRecord.phaseLabel)}</span>
          </div>
          <strong>${escapeHtml(currentRecord.example.title)}</strong>
          <p class="dashboard-table-lesson-copy">${escapeHtml(currentRecord.example.theme)}</p>
          <div class="dashboard-focus-meta">
            <span class="summary-pill">진도 ${currentRecord.status.correct}/${currentRecord.status.total}</span>
            <span class="summary-pill">오답 ${currentRecord.status.wrong}</span>
            <span class="summary-pill">${currentRecord.percent}% 완료</span>
          </div>
        </div>

        <div class="dashboard-focus-list">
          ${focusLessons
            .map(
              (record) => `
                <a class="dashboard-focus-item" href="${getLessonHref(record.example.id)}">
                  <div class="dashboard-focus-item-head">
                    <span class="lesson-code">${escapeHtml(record.example.file)}</span>
                    ${record.status.wrong > 0 ? `<span class="lesson-badge lesson-badge-wrong">오답 ${record.status.wrong}</span>` : `<span class="lesson-badge">${escapeHtml(record.phaseLabel)}</span>`}
                  </div>
                  <strong>${escapeHtml(record.example.title)}</strong>
                  <span class="dashboard-table-lesson-copy">${escapeHtml(record.percent)}% 완료</span>
                </a>
              `
            )
            .join("")}
        </div>

        <div class="dashboard-link-list">
          <a class="dashboard-link-row" href="./review.html">
            <span>오답노트로 이동</span>
            <strong>복습</strong>
          </a>
          <a class="dashboard-link-row" href="./problems.html">
            <span>전체 문제 목록 보기</span>
            <strong>문제</strong>
          </a>
          <a class="dashboard-link-row" href="./index.html">
            <span>학습 허브로 돌아가기</span>
            <strong>허브</strong>
          </a>
        </div>
      </div>
    </article>
  `;
}

function renderSecondaryGrid(allRecords, filteredRecords) {
  return `
    <section class="dashboard-grid dashboard-grid-secondary">
      ${renderLedgerPanel(allRecords)}
      ${renderFocusPanel(allRecords, filteredRecords)}
    </section>
  `;
}

function renderLessonRow(record) {
  return `
    <div class="dashboard-table-row ${record.active ? "is-active" : ""}">
      <label class="dashboard-table-check">
        <input
          type="checkbox"
          data-action="toggle-selection"
          data-lesson-id="${record.example.id}"
          ${record.selected ? "checked" : ""}
        />
        선택
      </label>

      <div class="dashboard-table-lesson">
        <div class="dashboard-table-lesson-head">
          <span class="lesson-code">${escapeHtml(record.example.file)}</span>
          <span class="lesson-badge">${escapeHtml(record.phaseLabel)}</span>
          ${record.active ? '<span class="lesson-badge lesson-badge-active">최근</span>' : ""}
          ${record.status.wrong > 0 ? `<span class="lesson-badge lesson-badge-wrong">오답 ${record.status.wrong}</span>` : ""}
        </div>
        <strong>${escapeHtml(record.example.title)}</strong>
        <span class="dashboard-table-lesson-copy">${escapeHtml(record.example.theme)}</span>
      </div>

      <div class="dashboard-table-progress">
        <span class="progress-bar"><span style="width:${record.percent}%"></span></span>
        <div class="dashboard-table-progress-meta">
          <span>진도 ${record.status.correct}/${record.status.total}</span>
          <strong>${record.percent}%</strong>
        </div>
      </div>

      <div class="dashboard-table-count">${record.status.wrong}문항</div>

      <div class="dashboard-table-action">
        <a class="btn btn-secondary btn-inline" href="${getLessonHref(record.example.id)}">문제 열기</a>
      </div>
    </div>
  `;
}

function renderLessonTable(filteredRecords) {
  const activeFilter = FILTERS.find((item) => item.key === pageState.filter)?.label || "전체";

  return `
    <section class="dashboard-panel">
      <div class="section-head">
        <div>
          <h2 class="section-title">예제 테이블</h2>
          <p class="section-copy">현재 필터: ${escapeHtml(activeFilter)}. 카드 대신 표 형식으로 전체 상태를 빠르게 비교합니다.</p>
        </div>
        <div class="section-badge">${filteredRecords.length}개</div>
      </div>
      ${
        filteredRecords.length > 0
          ? `
            <div class="dashboard-table">
              <div class="dashboard-table-head">
                <span>선택</span>
                <span>예제</span>
                <span>진도</span>
                <span>오답</span>
                <span>이동</span>
              </div>
              ${filteredRecords.map(renderLessonRow).join("")}
            </div>
          `
          : `
            <div class="dashboard-empty">
              현재 필터와 일치하는 예제가 없습니다. 다른 필터를 선택하면 바로 목록이 갱신됩니다.
            </div>
          `
      }
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
      ${renderHero(allRecords, filteredRecords)}
      <main class="progress-layout dashboard-layout">
        ${renderFilters(filteredRecords.length)}
        ${renderOverviewPanel(allRecords)}
        ${renderAnalysisGrid(allRecords)}
        ${renderSecondaryGrid(allRecords, filteredRecords)}
        ${renderLessonTable(filteredRecords)}
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
