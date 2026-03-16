import { examples } from "./data/examples.js";

const lessonGrid = document.querySelector("#lesson-grid");
const workspace = document.querySelector("#workspace");
const heroStats = document.querySelector("#hero-stats");

const STORAGE_KEY = "c-structure-quiz-progress-v1";

const state = {
  selectedId: window.location.hash.replace("#", "") || examples[0].id,
  sourceCache: {},
  progress: loadProgress(),
};

function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.progress));
}

function ensureProgress(id) {
  if (!state.progress[id]) {
    state.progress[id] = {
      blocks: {},
      outputAnswer: "",
      outputChecked: null,
      outputReveal: false,
      blankChoiceAnswer: null,
      blankChoiceChecked: null,
      blankTextAnswer: "",
      blankTextChecked: null,
    };
  }

  return state.progress[id];
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizeOutput(text, compareMode = "default") {
  let normalized = String(text ?? "").replaceAll("\r\n", "\n").replaceAll("\t", " ");

  if (compareMode === "addressAware") {
    normalized = normalized
      .replace(/0x[0-9a-fA-F]+/g, "<addr>")
      .replace(/\b\d{8,}\b/g, "<addr>");
  }

  return normalized
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line, index, lines) => !(line === "" && lines[index - 1] === ""))
    .join("\n")
    .trim();
}

function normalizeCodeAnswer(text) {
  return String(text ?? "")
    .trim()
    .replace(/\s+/g, "")
    .replace(/;$/, "")
    .toLowerCase();
}

function getExampleById(id) {
  return examples.find((example) => example.id === id) || examples[0];
}

function getLessonScore(example) {
  const progress = ensureProgress(example.id);
  const total = example.blocks.length + 3;
  let correct = 0;

  example.blocks.forEach((_, index) => {
    if (progress.blocks[index]?.checked && progress.blocks[index]?.correct) {
      correct += 1;
    }
  });

  if (progress.outputChecked === true) {
    correct += 1;
  }

  if (progress.blankChoiceChecked === true) {
    correct += 1;
  }

  if (progress.blankTextChecked === true) {
    correct += 1;
  }

  return { correct, total };
}

function getGlobalStats() {
  let solvedItems = 0;
  let totalItems = 0;
  let completedLessons = 0;

  examples.forEach((example) => {
    const score = getLessonScore(example);
    solvedItems += score.correct;
    totalItems += score.total;
    if (score.correct === score.total) {
      completedLessons += 1;
    }
  });

  return {
    lessonCount: examples.length,
    solvedItems,
    totalItems,
    completedLessons,
  };
}

function renderHeroStats() {
  const stats = getGlobalStats();
  const current = getExampleById(state.selectedId);
  const currentScore = getLessonScore(current);

  heroStats.innerHTML = `
    <div>
      <p class="eyebrow">Study Progress</p>
      <p class="meta-copy">객관식부터 주관식까지 풀면서 현재 진도를 바로 확인할 수 있습니다.</p>
    </div>
    <div class="stats-grid">
      <div class="stat-card">
        <span class="stat-label">예제 수</span>
        <span class="stat-value">${stats.lessonCount}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">완료한 예제</span>
        <span class="stat-value">${stats.completedLessons}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">맞힌 문항</span>
        <span class="stat-value">${stats.solvedItems}/${stats.totalItems}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">현재 예제 진도</span>
        <span class="stat-value">${currentScore.correct}/${currentScore.total}</span>
      </div>
    </div>
  `;
}

function renderLessonGrid() {
  lessonGrid.innerHTML = examples
    .map((example) => {
      const score = getLessonScore(example);
      const percent = Math.round((score.correct / score.total) * 100);
      const isActive = example.id === state.selectedId;

      return `
        <button class="lesson-button ${isActive ? "active" : ""}" data-lesson-id="${example.id}">
          <span class="lesson-code">${escapeHtml(example.file)}</span>
          <span class="lesson-title">${escapeHtml(example.title)}</span>
          <span class="lesson-theme">${escapeHtml(example.theme)}</span>
          <span class="lesson-progress">
            <span class="progress-bar"><span style="width:${percent}%"></span></span>
            ${score.correct}/${score.total}
          </span>
        </button>
      `;
    })
    .join("");
}

async function loadSource(example) {
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

function renderQuizOptions(name, options, selected) {
  return `
    <div class="quiz-options">
      ${options
        .map(
          (option, index) => `
            <label class="quiz-option">
              <input type="radio" name="${name}" value="${index}" ${selected === index ? "checked" : ""} />
              <span>${escapeHtml(option)}</span>
            </label>
          `
        )
        .join("")}
    </div>
  `;
}

function renderBlockFeedback(progress, block) {
  if (!progress?.checked) {
    return "";
  }

  const klass = progress.correct ? "correct" : "wrong";
  const text = progress.correct
    ? `정답입니다. ${block.explanation}`
    : `아직 달라요. ${block.explanation}`;

  return `<div class="feedback ${klass}">${escapeHtml(text)}</div>`;
}

function renderOutputFeedback(example, progress) {
  if (progress.outputChecked === null && !progress.outputReveal) {
    return "";
  }

  if (progress.outputChecked === true) {
    return `<div class="feedback correct">출력 예측이 맞았습니다. 실제 흐름과 결과를 잘 잡았어요.</div>`;
  }

  const resultBox = progress.outputReveal
    ? `
      <div class="result-box">
        <p class="small-note">정답 출력</p>
        <pre>${escapeHtml(example.output.expected)}</pre>
      </div>
    `
    : "";

  return `
    <div class="feedback wrong">아직 완전히 일치하지 않았습니다. ${escapeHtml(example.output.hint)}</div>
    ${resultBox}
  `;
}

function renderChoiceFeedback(example, progress) {
  if (progress.blankChoiceChecked === null) {
    return "";
  }

  const isCorrect = progress.blankChoiceChecked === true;
  return `
    <div class="feedback ${isCorrect ? "correct" : "wrong"}">
      ${escapeHtml(
        isCorrect
          ? `정답입니다. ${example.fillBlankChoice.explanation}`
          : `아직 달라요. ${example.fillBlankChoice.explanation}`
      )}
    </div>
  `;
}

function renderTextFeedback(example, progress) {
  if (progress.blankTextChecked === null) {
    return "";
  }

  const isCorrect = progress.blankTextChecked === true;
  const answers = example.fillBlankText.answers.join(", ");

  return `
    <div class="feedback ${isCorrect ? "correct" : "wrong"}">
      ${escapeHtml(
        isCorrect
          ? `정답입니다. ${example.fillBlankText.explanation}`
          : `정답 예시는 ${answers} 입니다. ${example.fillBlankText.explanation}`
      )}
    </div>
  `;
}

function renderWorkspaceShell() {
  workspace.innerHTML = `<div class="card"><p class="meta-copy">예제를 불러오는 중입니다...</p></div>`;
}

async function renderWorkspace() {
  const example = getExampleById(state.selectedId);
  const progress = ensureProgress(example.id);
  renderWorkspaceShell();
  const source = await loadSource(example);
  const choiceUnlocked = progress.blankChoiceChecked === true;

  workspace.innerHTML = `
    <div class="card">
      <section class="lesson-hero">
        <div class="pill-row">
          <span class="pill">${escapeHtml(example.file)}</span>
          <span class="pill">${escapeHtml(example.theme)}</span>
          <span class="pill">총 ${example.blocks.length + 3}문항</span>
        </div>
        <div>
          <h2>${escapeHtml(example.title)}</h2>
          <p class="meta-copy">${escapeHtml(example.intent)}</p>
        </div>
        <div class="two-col">
          <div class="info-box">
            <h3>이 코드의 목적</h3>
            <p>${escapeHtml(example.goal)}</p>
          </div>
          <div class="info-box">
            <h3>학습 포인트</h3>
            <p>${escapeHtml(example.theme)} 흐름을 블록 단위로 읽고, 결과와 빈칸으로 다시 확인합니다.</p>
          </div>
        </div>
      </section>

      <section class="code-section" style="margin-top:22px;">
        <h3>원본 코드</h3>
        <p class="small-note">배포용 사이트에는 이 폴더의 원본 C 파일을 그대로 포함했습니다.</p>
        <pre class="code-view">${escapeHtml(source)}</pre>
      </section>

      <section class="step-list">
        <article class="step-card">
          <div class="step-head">
            <div>
              <h3>1. 블록 해석 객관식</h3>
              <p class="quiz-note">보이는 블록만 근거로 판단하는 문제입니다. 숨은 맥락 추측보다 코드에 적힌 사실을 먼저 읽어 보세요.</p>
            </div>
            <span class="step-tag">객관식</span>
          </div>

          ${example.blocks
            .map((block, index) => {
              const blockProgress = progress.blocks[index] || {};
              return `
                <div class="quiz-block">
                  <h4>${escapeHtml(block.label)}</h4>
                  <pre class="snippet">${escapeHtml(block.snippet)}</pre>
                  <p class="meta-copy">${escapeHtml(block.question)}</p>
                  ${renderQuizOptions(`block-${index}`, block.options, blockProgress.selected)}
                  <div class="button-row">
                    <button class="btn btn-primary" data-action="check-block" data-block-index="${index}">채점하기</button>
                  </div>
                  ${renderBlockFeedback(blockProgress, block)}
                </div>
              `;
            })
            .join("")}
        </article>

        <article class="step-card">
          <div class="step-head">
            <div>
              <h3>2. 실행 결과 예측</h3>
              <p class="quiz-note">샘플 입력 기준으로 실제 출력이 어떻게 이어지는지 적어보세요.</p>
            </div>
            <span class="step-tag">결과값</span>
          </div>
          <div class="quiz-block">
            <h4>샘플 입력</h4>
            <pre class="sample-input">${escapeHtml(example.output.sampleInput)}</pre>
            <p class="meta-copy">${escapeHtml(example.output.hint)}</p>
            <textarea class="answer-input" id="output-answer" placeholder="예상 출력값을 여기에 입력하세요.">${escapeHtml(progress.outputAnswer)}</textarea>
            <div class="button-row">
              <button class="btn btn-primary" data-action="check-output">출력 비교</button>
              <button class="btn btn-secondary" data-action="reveal-output">정답 보기</button>
            </div>
            ${renderOutputFeedback(example, progress)}
          </div>
        </article>

        <article class="step-card">
          <div class="step-head">
            <div>
              <h3>3. 핵심 코드 빈칸</h3>
              <p class="quiz-note">원본 코드에서 학습 핵심이 되는 토큰만 비운 문제입니다. 먼저 객관식으로 잡고, 맞히면 아래 주관식을 풉니다.</p>
            </div>
            <span class="step-tag">객관식 → 주관식</span>
          </div>

          <div class="quiz-block">
            <h4>3-1. 객관식 빈칸</h4>
            <pre class="snippet">${escapeHtml(example.fillBlankChoice.snippet)}</pre>
            <p class="meta-copy">${escapeHtml(example.fillBlankChoice.prompt)}</p>
            ${renderQuizOptions("blank-choice", example.fillBlankChoice.options, progress.blankChoiceAnswer)}
            <div class="button-row">
              <button class="btn btn-primary" data-action="check-blank-choice">채점하기</button>
            </div>
            ${renderChoiceFeedback(example, progress)}
          </div>

          <div class="quiz-block ${choiceUnlocked ? "" : "locked"}">
            <h4>3-2. 주관식 빈칸</h4>
            <pre class="snippet">${escapeHtml(example.fillBlankText.snippet)}</pre>
            <p class="meta-copy">
              ${
                choiceUnlocked
                  ? escapeHtml(example.fillBlankText.prompt)
                  : "위 객관식 빈칸을 먼저 맞히면 이 칸이 열립니다."
              }
            </p>
            <input class="text-input" id="blank-text-answer" value="${escapeHtml(progress.blankTextAnswer)}" placeholder="정답을 직접 입력하세요." />
            <div class="button-row">
              <button class="btn btn-primary" data-action="check-blank-text">채점하기</button>
            </div>
            ${renderTextFeedback(example, progress)}
          </div>
        </article>

        <article class="summary-card">
          <h3>총해설</h3>
          <ul class="summary-list">
            ${example.summary.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
          </ul>
        </article>
      </section>

      <div class="footer-nav">
        <button class="btn btn-secondary" data-action="next-lesson">다음 예제 보기</button>
      </div>
    </div>
  `;
}

function updateHash() {
  if (window.location.hash !== `#${state.selectedId}`) {
    window.location.hash = state.selectedId;
  }
}

function rerender() {
  saveProgress();
  renderHeroStats();
  renderLessonGrid();
  renderWorkspace();
}

document.addEventListener("click", (event) => {
  const lessonButton = event.target.closest("[data-lesson-id]");
  if (lessonButton) {
    state.selectedId = lessonButton.dataset.lessonId;
    updateHash();
    rerender();
    return;
  }

  const actionButton = event.target.closest("[data-action]");
  if (!actionButton) {
    return;
  }

  const action = actionButton.dataset.action;
  const example = getExampleById(state.selectedId);
  const progress = ensureProgress(example.id);

  if (action === "check-block") {
    const blockIndex = Number(actionButton.dataset.blockIndex);
    const selected = document.querySelector(`input[name="block-${blockIndex}"]:checked`);

    if (!selected) {
      progress.blocks[blockIndex] = {
        selected: null,
        checked: true,
        correct: false,
      };
    } else {
      const selectedIndex = Number(selected.value);
      progress.blocks[blockIndex] = {
        selected: selectedIndex,
        checked: true,
        correct: selectedIndex === example.blocks[blockIndex].answerIndex,
      };
    }

    rerender();
    return;
  }

  if (action === "check-output") {
    const textarea = document.querySelector("#output-answer");
    progress.outputAnswer = textarea?.value ?? "";
    progress.outputReveal = false;
    progress.outputChecked =
      normalizeOutput(progress.outputAnswer, example.output.compareMode) ===
      normalizeOutput(example.output.expected, example.output.compareMode);
    rerender();
    return;
  }

  if (action === "reveal-output") {
    const textarea = document.querySelector("#output-answer");
    progress.outputAnswer = textarea?.value ?? "";
    progress.outputReveal = true;
    progress.outputChecked = false;
    rerender();
    return;
  }

  if (action === "check-blank-choice") {
    const selected = document.querySelector('input[name="blank-choice"]:checked');

    if (!selected) {
      progress.blankChoiceAnswer = null;
      progress.blankChoiceChecked = false;
    } else {
      progress.blankChoiceAnswer = Number(selected.value);
      progress.blankChoiceChecked = progress.blankChoiceAnswer === example.fillBlankChoice.answerIndex;
    }

    if (progress.blankChoiceChecked !== true) {
      progress.blankTextChecked = null;
    }

    rerender();
    return;
  }

  if (action === "check-blank-text") {
    const input = document.querySelector("#blank-text-answer");
    progress.blankTextAnswer = input?.value ?? "";

    const acceptableAnswers = example.fillBlankText.answers.map(normalizeCodeAnswer);
    progress.blankTextChecked = acceptableAnswers.includes(normalizeCodeAnswer(progress.blankTextAnswer));
    rerender();
    return;
  }

  if (action === "next-lesson") {
    const currentIndex = examples.findIndex((item) => item.id === example.id);
    const next = examples[(currentIndex + 1) % examples.length];
    state.selectedId = next.id;
    updateHash();
    rerender();
  }
});

window.addEventListener("hashchange", () => {
  const id = window.location.hash.replace("#", "");
  if (id && examples.some((example) => example.id === id)) {
    state.selectedId = id;
    rerender();
  }
});

renderHeroStats();
renderLessonGrid();
renderWorkspace();
