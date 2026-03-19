import { examples } from "../../data/examples.js";
import { createReconstructionData } from "./reconstruction.js";

export { examples };

export const STORAGE_KEY = "c-structure-quiz-progress-v2";
export const UI_STATE_KEY = "c-structure-quiz-ui-v2";

export const REVIEW_FILTERS = ["all", "selected", "wrong", "selected-wrong"];

function isBrowser() {
  return typeof window !== "undefined";
}

function isStateLike(value) {
  return (
    value &&
    typeof value === "object" &&
    "progress" in value &&
    "selectedLessons" in value &&
    "filter" in value
  );
}

function resolveState(value) {
  return isStateLike(value) ? value : state;
}

function resolveFilter(stateOrFilter, maybeFilter) {
  if (typeof stateOrFilter === "string") {
    return stateOrFilter;
  }

  if (isStateLike(stateOrFilter)) {
    return typeof maybeFilter === "string" ? maybeFilter : stateOrFilter.filter;
  }

  return typeof maybeFilter === "string" ? maybeFilter : state.filter;
}

export function isValidExampleId(id) {
  return examples.some((example) => example.id === id);
}

function getLessonIdFromLocation() {
  if (!isBrowser()) {
    return null;
  }

  return new URLSearchParams(window.location.search).get("lesson");
}

function createDefaultUiState() {
  return {
    filter: "all",
    selectedLessons: [],
    lastViewedId: examples[0].id,
  };
}

export function createDefaultProgress() {
  return {
    blocks: {},
    outputAnswer: "",
    outputChecked: null,
    outputReveal: false,
    blankChoiceAnswer: null,
    blankChoiceChecked: null,
    blankTextAnswer: "",
    blankTextChecked: null,
    reconstructionLiteAnswers: [],
    reconstructionLiteChecked: null,
    reconstructionDenseAnswers: [],
    reconstructionDenseChecked: null,
    fullCodeAnswer: "",
    fullCodeChecked: null,
  };
}

export function loadProgress() {
  if (!isBrowser()) {
    return {};
  }

  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

export function loadUiState() {
  if (!isBrowser()) {
    return createDefaultUiState();
  }

  try {
    const parsed = JSON.parse(localStorage.getItem(UI_STATE_KEY) || "{}");
    const filter = REVIEW_FILTERS.includes(parsed.filter) ? parsed.filter : "all";
    const selectedLessons = Array.isArray(parsed.selectedLessons)
      ? parsed.selectedLessons.filter(isValidExampleId)
      : [];
    const lastViewedId = isValidExampleId(parsed.lastViewedId) ? parsed.lastViewedId : examples[0].id;

    return {
      filter,
      selectedLessons,
      lastViewedId,
    };
  } catch {
    return createDefaultUiState();
  }
}

function getInitialSelectedId(lastViewedId) {
  const lessonId = getLessonIdFromLocation();

  if (isValidExampleId(lessonId)) {
    return lessonId;
  }

  if (isValidExampleId(lastViewedId)) {
    return lastViewedId;
  }

  return examples[0].id;
}

const persistedUiState = loadUiState();

export const state = {
  selectedId: getInitialSelectedId(persistedUiState.lastViewedId),
  sourceCache: {},
  reconstructionCache: {},
  progress: loadProgress(),
  selectedLessons: new Set(persistedUiState.selectedLessons),
  filter: persistedUiState.filter,
  renderToken: 0,
};

export function createAppState() {
  const uiState = loadUiState();

  return {
    selectedId: getInitialSelectedId(uiState.lastViewedId),
    sourceCache: {},
    reconstructionCache: {},
    progress: loadProgress(),
    selectedLessons: new Set(uiState.selectedLessons),
    filter: uiState.filter,
    renderToken: 0,
  };
}

export function saveState(targetState = state) {
  if (!isBrowser()) {
    return;
  }

  const resolvedState = resolveState(targetState);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(resolvedState.progress));
  localStorage.setItem(
    UI_STATE_KEY,
    JSON.stringify({
      filter: resolvedState.filter,
      selectedLessons: Array.from(resolvedState.selectedLessons),
      lastViewedId: resolvedState.selectedId,
    })
  );
}

export const persistState = saveState;

function ensureProgressFor(targetState, id) {
  if (!targetState.progress[id]) {
    targetState.progress[id] = createDefaultProgress();
  }

  return targetState.progress[id];
}

export function ensureProgress(stateOrId, maybeId) {
  if (isStateLike(stateOrId)) {
    return ensureProgressFor(stateOrId, maybeId);
  }

  return ensureProgressFor(state, stateOrId);
}

export function getExampleById(id) {
  return examples.find((example) => example.id === id) || examples[0];
}

export function getOutputStatus(progress) {
  if (progress.outputChecked === true) {
    return true;
  }

  if (progress.outputChecked === false || progress.outputReveal) {
    return false;
  }

  return null;
}

export function getLessonStatus(stateOrExample, maybeExample) {
  const activeState = isStateLike(stateOrExample) ? stateOrExample : state;
  const example = isStateLike(stateOrExample) ? maybeExample : stateOrExample;
  const progress = ensureProgressFor(activeState, example.id);
  const statuses = [];

  example.blocks.forEach((_, index) => {
    const blockProgress = progress.blocks[index];
    if (!blockProgress?.checked) {
      statuses.push(null);
    } else {
      statuses.push(blockProgress.correct === true);
    }
  });

  statuses.push(getOutputStatus(progress));
  statuses.push(progress.blankChoiceChecked);
  statuses.push(progress.blankTextChecked);
  statuses.push(progress.reconstructionLiteChecked);
  statuses.push(progress.reconstructionDenseChecked);
  statuses.push(progress.fullCodeChecked);

  return {
    statuses,
    total: statuses.length,
    correct: statuses.filter((status) => status === true).length,
    wrong: statuses.filter((status) => status === false).length,
  };
}

export function getProgressPercent(stateOrExample, maybeExample) {
  const lessonStatus = getLessonStatus(stateOrExample, maybeExample);
  return Math.round((lessonStatus.correct / lessonStatus.total) * 100);
}

export function getGlobalStats(targetState = state) {
  const activeState = resolveState(targetState);
  let solvedItems = 0;
  let totalItems = 0;
  let completedLessons = 0;
  let wrongItems = 0;

  examples.forEach((example) => {
    const lessonStatus = getLessonStatus(activeState, example);
    solvedItems += lessonStatus.correct;
    totalItems += lessonStatus.total;
    wrongItems += lessonStatus.wrong;

    if (lessonStatus.correct === lessonStatus.total) {
      completedLessons += 1;
    }
  });

  return {
    lessonCount: examples.length,
    solvedItems,
    totalItems,
    completedLessons,
    wrongItems,
    selectedLessons: activeState.selectedLessons.size,
  };
}

export function getVisibleExamples(stateOrFilter = state, maybeFilter) {
  const activeState = typeof stateOrFilter === "string" ? state : resolveState(stateOrFilter);
  const filter = resolveFilter(stateOrFilter, maybeFilter);

  if (filter === "all") {
    return examples;
  }

  if (filter === "selected") {
    return examples.filter((example) => activeState.selectedLessons.has(example.id));
  }

  if (filter === "wrong") {
    return examples.filter((example) => getLessonStatus(activeState, example).wrong > 0);
  }

  if (filter === "selected-wrong") {
    return examples.filter(
      (example) =>
        activeState.selectedLessons.has(example.id) && getLessonStatus(activeState, example).wrong > 0
    );
  }

  return examples;
}

export function getFilterLabel(filter = state.filter) {
  if (filter === "selected") {
    return "선택만";
  }

  if (filter === "wrong") {
    return "오답 반복";
  }

  if (filter === "selected-wrong") {
    return "선택 오답";
  }

  return "전체";
}

export function getEmptyListMessage(filter = state.filter) {
  if (filter === "selected") {
    return "선택한 예제가 없습니다. 체크박스로 예제를 먼저 선택해 주세요.";
  }

  if (filter === "wrong") {
    return "현재 오답 문항이 없습니다. 전체 모드에서 새 문제를 풀어 보세요.";
  }

  if (filter === "selected-wrong") {
    return "선택한 예제 안에 아직 오답 문항이 없습니다.";
  }

  return "표시할 예제가 없습니다.";
}

export function getProblemModeFromUrl() {
  if (!isBrowser()) {
    return "default";
  }

  const params = new URLSearchParams(window.location.search);
  return params.get("mode") === "review" ? "review" : "default";
}

export function getLessonNeighbors(arg1, arg2, arg3) {
  const isStateFirst = isStateLike(arg1);
  const currentId = isStateFirst ? arg2 : arg1;
  const stateOrFilter = isStateFirst ? arg1 : arg2 ?? state;
  const maybeFilter = isStateFirst ? arg3 : arg3;
  const activeState = typeof stateOrFilter === "string" ? state : resolveState(stateOrFilter);
  const filter = resolveFilter(stateOrFilter, maybeFilter);
  const visibleExamples = getVisibleExamples(activeState, filter);
  const sequence = visibleExamples.some((example) => example.id === currentId)
    ? visibleExamples
    : examples;
  let currentIndex = sequence.findIndex((example) => example.id === currentId);

  if (currentIndex === -1) {
    currentIndex = 0;
  }

  return {
    sequence,
    currentIndex,
    previous: sequence[(currentIndex - 1 + sequence.length) % sequence.length],
    next: sequence[(currentIndex + 1) % sequence.length],
  };
}

export function getLessonHref(id, options = {}) {
  const params = new URLSearchParams({ lesson: id });

  if (options.mode === "review") {
    params.set("mode", "review");
  }

  return `./problems.html?${params.toString()}`;
}

export function setSelectedId(id) {
  if (!isValidExampleId(id)) {
    return;
  }

  state.selectedId = id;
}

export function setFilter(filter) {
  if (!REVIEW_FILTERS.includes(filter)) {
    return;
  }

  state.filter = filter;
}

export function ensureVisibleSelection() {
  const visibleExamples = getVisibleExamples(state);

  if (visibleExamples.length === 0) {
    return null;
  }

  if (!visibleExamples.some((example) => example.id === state.selectedId)) {
    state.selectedId = visibleExamples[0].id;
  }

  return state.selectedId;
}

export function toggleLessonSelection(id, checked) {
  if (!isValidExampleId(id)) {
    return;
  }

  if (checked === undefined) {
    if (state.selectedLessons.has(id)) {
      state.selectedLessons.delete(id);
    } else {
      state.selectedLessons.add(id);
    }
    return;
  }

  if (checked) {
    state.selectedLessons.add(id);
    return;
  }

  state.selectedLessons.delete(id);
}

export function toggleSelectedLesson(id) {
  toggleLessonSelection(id);
}

export function resetLessonProgress(stateOrId, maybeId) {
  const activeState = isStateLike(stateOrId) ? stateOrId : state;
  const lessonId = isStateLike(stateOrId) ? maybeId : stateOrId;

  if (!isValidExampleId(lessonId)) {
    return;
  }

  activeState.progress[lessonId] = createDefaultProgress();
  delete activeState.reconstructionCache[lessonId];
}

export function resetSelectedProgress(targetState = state) {
  const activeState = resolveState(targetState);
  activeState.selectedLessons.forEach((id) => resetLessonProgress(activeState, id));
}

export const resetSelectedLessonsProgress = resetSelectedProgress;

export function resetAllProgress(targetState = state) {
  const activeState = resolveState(targetState);
  activeState.progress = {};
  activeState.reconstructionCache = {};
}

export async function loadSource(example) {
  if (state.sourceCache[example.id]) {
    return state.sourceCache[example.id];
  }

  try {
    const response = await fetch(example.source);
    const text = await response.text();
    state.sourceCache[example.id] = text;
  } catch {
    state.sourceCache[example.id] = "원본 코드를 불러오지 못했습니다.";
  }

  return state.sourceCache[example.id];
}

export function getReconstructionData(example, source) {
  if (!state.reconstructionCache[example.id]) {
    state.reconstructionCache[example.id] = createReconstructionData(example, source);
  }

  return state.reconstructionCache[example.id];
}
