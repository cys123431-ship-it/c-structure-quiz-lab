import {
  REVIEW_FILTERS,
  ensureProgress,
  examples,
  getEmptyListMessage,
  getExampleById,
  getFilterLabel,
  getGlobalStats,
  getLessonHref,
  getLessonNeighbors,
  getLessonStatus,
  getOutputStatus,
  getVisibleExamples,
} from "./store.js";
import {
  escapeHtml,
  normalizeFullCode,
  normalizeOutput,
  normalizeTokenAnswer,
} from "./utils.js";

const RECONSTRUCTION_STAGE_LIMITS = {
  lite: 3,
  dense: 6,
};

const COMMON_IDENTIFIER_TOKENS = new Set([
  "include",
  "define",
  "void",
  "int",
  "char",
  "short",
  "float",
  "long",
  "main",
  "printf",
  "scanf",
  "gets",
  "getchar",
  "putchar",
  "strcpy",
  "sizeof",
  "return",
  "if",
  "else",
  "for",
  "while",
  "break",
  "struct",
  "const",
]);

export function renderFilterButton(state, filter, label) {
  return `
    <button
      class="chip-btn ${state.filter === filter ? "chip-btn-active" : ""}"
      data-action="set-filter"
      data-filter="${filter}"
    >
      ${label}
    </button>
  `;
}

export function renderControlPanel(state) {
  const stats = getGlobalStats(state);
  const visibleCount = getVisibleExamples(state).length;

  return `
    <div class="control-panel">
      <div class="mode-group">
        <span class="mode-label">보기 모드</span>
        <div class="mode-buttons">
          ${renderFilterButton(state, "all", "전체")}
          ${renderFilterButton(state, "selected", "선택만")}
          ${renderFilterButton(state, "wrong", "오답 반복")}
          ${renderFilterButton(state, "selected-wrong", "선택 오답")}
        </div>
      </div>
      <div class="mode-group">
        <span class="mode-label">초기화</span>
        <div class="mode-buttons">
          <button class="chip-btn" data-action="reset-current">현재 예제</button>
          <button class="chip-btn" data-action="reset-selected" ${state.selectedLessons.size === 0 ? "disabled" : ""}>선택한 예제</button>
          <button class="chip-btn chip-btn-danger" data-action="reset-all">전체</button>
        </div>
      </div>
      <p class="small-note">현재 목록 ${visibleCount}개, 선택 ${stats.selectedLessons}개, 오답 ${stats.wrongItems}문항</p>
    </div>
  `;
}

export function renderProblemSelector(state) {
  const visibleExamples = getVisibleExamples(state);

  if (visibleExamples.length === 0) {
    return `
      <div class="empty-list">
        <p>${escapeHtml(getEmptyListMessage(state.filter))}</p>
      </div>
    `;
  }

  return `
    <div class="problem-nav-list">
      ${visibleExamples
        .map((example) => {
          const lessonStatus = getLessonStatus(state, example);
          const percent = Math.round((lessonStatus.correct / lessonStatus.total) * 100);
          const isSelected = state.selectedLessons.has(example.id);
          const isActive = example.id === state.selectedId;

          return `
            <article class="problem-nav-card ${isActive ? "problem-nav-card-active" : ""}">
              <button class="problem-nav-button" data-action="select-lesson" data-lesson-id="${example.id}">
                <span class="lesson-code">${escapeHtml(example.file)}</span>
                <strong class="problem-nav-title">${escapeHtml(example.title)}</strong>
                <span class="lesson-theme">${escapeHtml(example.theme)}</span>
              </button>
              <div class="lesson-badges">
                <span class="lesson-badge">진도 ${lessonStatus.correct}/${lessonStatus.total}</span>
                <span class="lesson-badge ${lessonStatus.wrong > 0 ? "lesson-badge-wrong" : ""}">오답 ${lessonStatus.wrong}</span>
              </div>
              <div class="lesson-progress">
                <span class="progress-bar"><span style="width:${percent}%"></span></span>
                ${percent}%
              </div>
              <label class="lesson-select">
                <input
                  type="checkbox"
                  data-action="toggle-lesson-selection"
                  data-lesson-id="${example.id}"
                  ${isSelected ? "checked" : ""}
                />
                선택
              </label>
            </article>
          `;
        })
        .join("")}
    </div>
  `;
}

export function renderProblemSidebar(state) {
  return `
    <section class="lesson-panel detail-tools problem-sidebar">
      <div class="section-heading">
        <h2>문제 탐색기</h2>
        <p>코드를 세로 목록에서 골라서 바로 문제를 풀 수 있습니다.</p>
      </div>
      ${renderControlPanel(state)}
      <div class="problem-nav-shell">
        ${renderProblemSelector(state)}
      </div>
    </section>
  `;
}

export async function loadSource(state, example) {
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

function isIdentifierToken(token) {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(token);
}

function isWordChar(character) {
  return !!character && /[A-Za-z0-9_]/.test(character);
}

function addUniqueToken(tokens, token, source) {
  const cleaned = String(token ?? "").trim();
  if (!cleaned || tokens.includes(cleaned)) {
    return;
  }

  if (!source.includes(cleaned)) {
    return;
  }

  tokens.push(cleaned);
}

function sanitizeCodeForIdentifierScan(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/\/\/.*$/gm, " ")
    .replace(/#.*$/gm, " ")
    .replace(/"(?:\\.|[^"\\])*"/g, " ")
    .replace(/'(?:\\.|[^'\\])*'/g, " ");
}

function extractIdentifierOccurrences(source) {
  const sanitizedSource = sanitizeCodeForIdentifierScan(source);
  const matches = sanitizedSource.matchAll(/[A-Za-z_][A-Za-z0-9_]*/g);
  const tokens = [];

  for (const match of matches) {
    const token = match[0];

    if (COMMON_IDENTIFIER_TOKENS.has(token)) {
      continue;
    }

    tokens.push(token);
  }

  return tokens;
}

function findTokenIndex(text, token) {
  if (!isIdentifierToken(token)) {
    return text.indexOf(token);
  }

  let index = text.indexOf(token);

  while (index !== -1) {
    const before = text[index - 1];
    const after = text[index + token.length];

    if (!isWordChar(before) && !isWordChar(after)) {
      return index;
    }

    index = text.indexOf(token, index + token.length);
  }

  return -1;
}

function replaceFirstOccurrence(text, token, replacement) {
  const index = findTokenIndex(text, token);

  if (index === -1) {
    return { replaced: false, text };
  }

  return {
    replaced: true,
    text: `${text.slice(0, index)}${replacement}${text.slice(index + token.length)}`,
  };
}

function buildReconstructionTokens(example, source) {
  const tokens = [];
  const correctChoiceAnswer = example.fillBlankChoice.options?.[example.fillBlankChoice.answerIndex];

  addUniqueToken(tokens, correctChoiceAnswer, source);
  example.fillBlankText.answers.forEach((answer) => addUniqueToken(tokens, answer, source));

  extractIdentifierOccurrences(source).forEach((token) => {
    if (tokens.length >= 10) {
      return;
    }

    tokens.push(token);
  });

  return tokens.slice(0, 10);
}

function buildMaskedCode(source, tokens) {
  let masked = source;
  const answers = [];

  tokens.forEach((token) => {
    const marker = `[${answers.length + 1}]____`;
    const replaced = replaceFirstOccurrence(masked, token, marker);

    if (!replaced.replaced) {
      return;
    }

    masked = replaced.text;
    answers.push(token);
  });

  return { masked, answers };
}

export function getReconstructionData(state, example, source) {
  if (state.reconstructionCache[example.id]) {
    return state.reconstructionCache[example.id];
  }

  const tokens = buildReconstructionTokens(example, source);
  const lite = buildMaskedCode(source, tokens.slice(0, RECONSTRUCTION_STAGE_LIMITS.lite));
  const dense = buildMaskedCode(source, tokens.slice(0, RECONSTRUCTION_STAGE_LIMITS.dense));

  state.reconstructionCache[example.id] = {
    tokens,
    lite,
    dense,
  };

  return state.reconstructionCache[example.id];
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

function renderReconstructionInputs(stageId, answers, values) {
  return `
    <div class="multi-inputs">
      ${answers
        .map(
          (_, index) => `
            <label class="blank-line">
              <span>${index + 1}번 빈칸</span>
              <input
                class="text-input"
                id="${stageId}-input-${index}"
                value="${escapeHtml(values[index] || "")}"
                placeholder="${index + 1}번 답을 입력하세요."
              />
            </label>
          `
        )
        .join("")}
    </div>
  `;
}

function renderReconstructionFeedback(progress, checkedKey, explanation, answers) {
  if (progress[checkedKey] === null) {
    return "";
  }

  if (progress[checkedKey] === true) {
    return `<div class="feedback correct">${escapeHtml(`정답입니다. ${explanation}`)}</div>`;
  }

  return `
    <div class="feedback wrong">
      ${escapeHtml(`아직 달라요. 정답 예시는 ${answers.map((answer, index) => `${index + 1}.${answer}`).join(" / ")} 입니다. ${explanation}`)}
    </div>
  `;
}

function renderFullCodeFeedback(progress) {
  if (progress.fullCodeChecked === null) {
    return "";
  }

  if (progress.fullCodeChecked === true) {
    return `<div class="feedback correct">전체 코드 복원이 맞았습니다. 공백과 줄바꿈을 넘어 토큰 흐름까지 잘 기억했어요.</div>`;
  }

  return `
    <div class="feedback wrong">
      공백, 줄바꿈, 주석은 무시하고 비교했습니다. 원본 코드와 비교해 빠진 토큰이나 다른 식을 다시 확인해 보세요.
    </div>
  `;
}

function renderLockedMessage(message) {
  return `<p class="meta-copy">${escapeHtml(message)}</p>`;
}

function renderLessonTopNav(state, example) {
  const { sequence, currentIndex, previous, next } = getLessonNeighbors(state, example.id);

  return `
    <div class="detail-nav">
      <a class="btn btn-secondary" href="./index.html">기능 허브</a>
      <div class="detail-status">
        <span class="pill">${currentIndex + 1} / ${sequence.length}</span>
        <span class="pill">${escapeHtml(example.file)}</span>
        <span class="pill">${escapeHtml(example.theme)}</span>
        ${state.filter !== "all" ? `<span class="pill pill-warm">${escapeHtml(getFilterLabel(state.filter))}</span>` : ""}
      </div>
      <div class="button-row">
        <a class="btn btn-secondary" href="${getLessonHref(previous.id)}">이전 코드</a>
        <a class="btn btn-primary" href="${getLessonHref(next.id)}">다음 코드</a>
      </div>
    </div>
  `;
}

function renderLessonFooterNav(state, example) {
  const { previous, next } = getLessonNeighbors(state, example.id);

  return `
    <div class="footer-nav footer-nav-split">
      <a class="btn btn-secondary" href="${getLessonHref(previous.id)}">이전 코드</a>
      <a class="btn btn-secondary" href="./progress.html">진행도</a>
      <a class="btn btn-primary" href="${getLessonHref(next.id)}">다음 코드</a>
    </div>
  `;
}

function renderStageNav(stageLinks) {
  if (stageLinks.length === 0) {
    return "";
  }

  return `
    <nav class="stage-nav" aria-label="문제 단계 빠른 이동">
      ${stageLinks
        .map(
          (stage) => `
            <a class="stage-link" href="${stage.href}">${escapeHtml(stage.label)}</a>
          `
        )
        .join("")}
    </nav>
  `;
}

function renderLessonBody(state, example, source) {
  const progress = ensureProgress(state, example.id);
  const lessonStatus = getLessonStatus(state, example);
  const reviewOnly = state.filter === "wrong" || state.filter === "selected-wrong";
  const reconstruction = getReconstructionData(state, example, source);
  const outputStatus = getOutputStatus(progress);
  const blankTextUnlocked = progress.blankChoiceChecked === true || reviewOnly;
  const liteUnlocked = progress.blankTextChecked === true || reviewOnly;
  const denseUnlocked = progress.reconstructionLiteChecked === true || reviewOnly;
  const fullCodeUnlocked = progress.reconstructionDenseChecked === true || reviewOnly;

  const visibleBlockCards = example.blocks
    .map((block, index) => ({ block, index, progress: progress.blocks[index] || {} }))
    .filter(({ progress: blockProgress }) => !reviewOnly || (blockProgress.checked && blockProgress.correct === false));

  const showOutput = !reviewOnly || outputStatus === false;
  const showBlankChoice = !reviewOnly || progress.blankChoiceChecked === false;
  const showBlankText = !reviewOnly || progress.blankTextChecked === false;
  const showReconstructionLite = !reviewOnly || progress.reconstructionLiteChecked === false;
  const showReconstructionDense = !reviewOnly || progress.reconstructionDenseChecked === false;
  const showFullCode = !reviewOnly || progress.fullCodeChecked === false;
  const visibleQuestionCount =
    visibleBlockCards.length +
    Number(showOutput) +
    Number(showBlankChoice) +
    Number(showBlankText) +
    Number(showReconstructionLite) +
    Number(showReconstructionDense) +
    Number(showFullCode);
  const stageLinks = [
    { href: "#lesson-overview", label: "개요" },
    { href: "#lesson-code", label: "원본 코드" },
  ];

  if (visibleBlockCards.length > 0) {
    stageLinks.push({ href: "#step-blocks", label: "블록 해석" });
  }

  if (showOutput) {
    stageLinks.push({ href: "#step-output", label: "출력 예측" });
  }

  if (showBlankChoice || showBlankText) {
    stageLinks.push({ href: "#step-blanks", label: "핵심 빈칸" });
  }

  if (showReconstructionLite || showReconstructionDense || showFullCode) {
    stageLinks.push({ href: "#step-reconstruction", label: "코드 복원" });
  }

  if (!reviewOnly) {
    stageLinks.push({ href: "#lesson-summary", label: "총해설" });
  }

  return `
    <section class="lesson-hero" id="lesson-overview">
      <div class="pill-row">
        <span class="pill">${escapeHtml(example.file)}</span>
        <span class="pill">${escapeHtml(example.theme)}</span>
        <span class="pill">총 ${lessonStatus.total}문항</span>
        ${reviewOnly ? '<span class="pill pill-warm">오답 반복 모드</span>' : ""}
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
          <h3>현재 상태</h3>
          <p>맞힘 ${lessonStatus.correct}/${lessonStatus.total}, 오답 ${lessonStatus.wrong}문항입니다. ${reviewOnly ? "지금은 틀린 문항만 보여 주고 있습니다." : "전체 단계를 순서대로 풀 수 있습니다."}</p>
        </div>
      </div>
    </section>

    ${renderStageNav(stageLinks)}

    <details class="code-section code-details" id="lesson-code">
      <summary class="code-summary">
        <span>원본 코드</span>
        <span class="code-summary-hint">필요할 때만 펼쳐서 확인하세요.</span>
      </summary>
      <div class="code-section-body">
        <p class="small-note">복원형 주관식에서 참고할 수 있도록 원본 C 파일을 그대로 보여 줍니다.</p>
        <pre class="code-view">${escapeHtml(source)}</pre>
      </div>
    </details>

    <section class="step-list">
      ${
        visibleQuestionCount === 0
          ? `
            <article class="step-card">
              <div class="feedback correct">이 예제에서는 현재 오답 문항이 없습니다. 다른 코드로 넘어가거나 전체 모드로 돌아가 보세요.</div>
            </article>
          `
          : ""
      }

      ${
        visibleBlockCards.length > 0
          ? `
            <article class="step-card" id="step-blocks">
              <div class="step-head">
                <div>
                  <h3>1. 블록 해석 객관식</h3>
                  <p class="quiz-note">보이는 블록만 근거로 판단하는 문제입니다. 숨은 맥락 추측보다 코드에 적힌 사실을 먼저 읽어 보세요.</p>
                </div>
                <span class="step-tag">객관식</span>
              </div>
              ${visibleBlockCards
                .map(
                  ({ block, index, progress: blockProgress }) => `
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
                  `
                )
                .join("")}
            </article>
          `
          : ""
      }

      ${
        showOutput
          ? `
            <article class="step-card" id="step-output">
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
          `
          : ""
      }

      ${
        showBlankChoice || showBlankText
          ? `
            <article class="step-card" id="step-blanks">
              <div class="step-head">
                <div>
                  <h3>3. 핵심 코드 빈칸</h3>
                  <p class="quiz-note">원본 코드에서 학습 핵심이 되는 토큰만 비운 문제입니다. 먼저 객관식으로 잡고, 맞히면 아래 주관식을 풉니다.</p>
                </div>
                <span class="step-tag">객관식 → 주관식</span>
              </div>

              ${
                showBlankChoice
                  ? `
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
                  `
                  : ""
              }

              ${
                showBlankText
                  ? `
                    <div class="quiz-block ${blankTextUnlocked ? "" : "locked"}">
                      <h4>3-2. 주관식 빈칸</h4>
                      <pre class="snippet">${escapeHtml(example.fillBlankText.snippet)}</pre>
                      ${
                        blankTextUnlocked
                          ? `<p class="meta-copy">${escapeHtml(example.fillBlankText.prompt)}</p>
                             <input class="text-input" id="blank-text-answer" value="${escapeHtml(progress.blankTextAnswer)}" placeholder="정답을 직접 입력하세요." />
                             <div class="button-row">
                               <button class="btn btn-primary" data-action="check-blank-text">채점하기</button>
                             </div>
                             ${renderTextFeedback(example, progress)}`
                          : renderLockedMessage("위 객관식 빈칸을 먼저 맞히면 이 칸이 열립니다.")
                      }
                    </div>
                  `
                  : ""
              }
            </article>
          `
          : ""
      }

      ${
        showReconstructionLite || showReconstructionDense || showFullCode
          ? `
            <article class="step-card" id="step-reconstruction">
              <div class="step-head">
                <div>
                  <h3>4. 코드 복원 주관식</h3>
                  <p class="quiz-note">전체 코드를 보면서 번호 빈칸을 채우고, 점점 더 많은 부분을 복원한 뒤 마지막에는 전체 코드를 직접 입력합니다.</p>
                </div>
                <span class="step-tag">주관식 심화</span>
              </div>

              ${
                showReconstructionLite
                  ? `
                    <div class="quiz-block ${liteUnlocked ? "" : "locked"}">
                      <h4>4-1. 핵심 번호 빈칸</h4>
                      <pre class="snippet">${escapeHtml(reconstruction.lite.masked)}</pre>
                      ${
                        liteUnlocked
                          ? `
                              <p class="meta-copy">전체 코드 안의 핵심 토큰 몇 개만 먼저 복원해 보세요.</p>
                              ${renderReconstructionInputs("reconstruction-lite", reconstruction.lite.answers, progress.reconstructionLiteAnswers)}
                              <div class="button-row">
                                <button class="btn btn-primary" data-action="check-reconstruction-lite">채점하기</button>
                              </div>
                              ${renderReconstructionFeedback(
                                progress,
                                "reconstructionLiteChecked",
                                "핵심 토큰 위치를 잘 잡았어요.",
                                reconstruction.lite.answers
                              )}
                            `
                          : renderLockedMessage("위 주관식 빈칸을 먼저 맞히면 첫 번째 복원 문제가 열립니다.")
                      }
                    </div>
                  `
                  : ""
              }

              ${
                showReconstructionDense
                  ? `
                    <div class="quiz-block ${denseUnlocked ? "" : "locked"}">
                      <h4>4-2. 빈칸 확대 복원</h4>
                      <pre class="snippet">${escapeHtml(reconstruction.dense.masked)}</pre>
                      ${
                        denseUnlocked
                          ? `
                              <p class="meta-copy">이번에는 더 많은 핵심 토큰을 직접 채워 넣어 코드 흐름을 이어 보세요.</p>
                              ${renderReconstructionInputs("reconstruction-dense", reconstruction.dense.answers, progress.reconstructionDenseAnswers)}
                              <div class="button-row">
                                <button class="btn btn-primary" data-action="check-reconstruction-dense">채점하기</button>
                              </div>
                              ${renderReconstructionFeedback(
                                progress,
                                "reconstructionDenseChecked",
                                "더 넓은 코드 흐름을 잘 복원했어요.",
                                reconstruction.dense.answers
                              )}
                            `
                          : renderLockedMessage("앞 단계의 핵심 번호 빈칸을 맞히면 더 큰 복원 문제가 열립니다.")
                      }
                    </div>
                  `
                  : ""
              }

              ${
                showFullCode
                  ? `
                    <div class="quiz-block ${fullCodeUnlocked ? "" : "locked"}">
                      <h4>4-3. 전체 코드 직접 입력</h4>
                      ${
                        fullCodeUnlocked
                          ? `
                              <p class="meta-copy">마지막 단계입니다. 공백, 줄바꿈, 주석은 자유롭게 두고 전체 코드를 직접 입력해 보세요.</p>
                              <textarea class="answer-input" id="full-code-answer" placeholder="전체 코드를 직접 입력하세요.">${escapeHtml(progress.fullCodeAnswer)}</textarea>
                              <div class="button-row">
                                <button class="btn btn-primary" data-action="check-full-code">전체 코드 비교</button>
                              </div>
                              ${renderFullCodeFeedback(progress)}
                            `
                          : renderLockedMessage("빈칸 확대 복원을 맞히면 마지막 전체 코드 입력 단계가 열립니다.")
                      }
                    </div>
                  `
                  : ""
              }
            </article>
          `
          : ""
      }

      ${
        !reviewOnly
          ? `
            <article class="summary-card" id="lesson-summary">
              <h3>총해설</h3>
              <ul class="summary-list">
                ${example.summary.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
              </ul>
            </article>
          `
          : ""
      }
    </section>

    ${renderLessonFooterNav(state, example)}
  `;
}

export function renderLessonLoading(state, example) {
  return `
    ${renderLessonTopNav(state, example)}
    <div class="detail-layout">
      ${renderProblemSidebar(state)}
      <div class="card">
        <p class="meta-copy">예제를 불러오는 중입니다...</p>
      </div>
    </div>
  `;
}

export function renderLessonReady(state, example, source) {
  return `
    ${renderLessonTopNav(state, example)}
    <div class="detail-layout">
      ${renderProblemSidebar(state)}
      <div class="card">
        ${renderLessonBody(state, example, source)}
      </div>
    </div>
  `;
}

function getInputValues(prefix, count) {
  return Array.from({ length: count }, (_, index) => {
    const input = document.querySelector(`#${prefix}-input-${index}`);
    return input?.value ?? "";
  });
}

function checkTokenArrayAnswers(userAnswers, expectedAnswers) {
  return expectedAnswers.every(
    (expectedAnswer, index) =>
      normalizeTokenAnswer(userAnswers[index]) === normalizeTokenAnswer(expectedAnswer)
  );
}

function resetLessonProgress(state, id) {
  state.progress[id] = {
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

export function openCodeSection() {
  const codeSection = document.querySelector("#lesson-code");

  if (codeSection instanceof HTMLDetailsElement) {
    codeSection.open = true;
  }
}

export function handleLessonChange(event, { state, rerender }) {
  const checkbox = event.target.closest('[data-action="toggle-lesson-selection"]');

  if (!checkbox) {
    return false;
  }

  const lessonId = checkbox.dataset.lessonId;

  if (checkbox.checked) {
    state.selectedLessons.add(lessonId);
  } else {
    state.selectedLessons.delete(lessonId);
  }

  rerender();
  return true;
}

export async function handleLessonClick(event, { state, rerender, navigateToLesson }) {
  const codeStageLink = event.target.closest('.stage-link[href="#lesson-code"]');

  if (codeStageLink) {
    openCodeSection();
  }

  const actionButton = event.target.closest("[data-action]");

  if (!actionButton) {
    return false;
  }

  const action = actionButton.dataset.action;

  if (action === "select-lesson") {
    const lessonId = actionButton.dataset.lessonId;
    if (lessonId) {
      state.selectedId = lessonId;
      navigateToLesson(lessonId);
      rerender();
    }
    return true;
  }

  if (action === "set-filter") {
    const filter = actionButton.dataset.filter;

    if (REVIEW_FILTERS.includes(filter)) {
      state.filter = filter;
      if (!getVisibleExamples(state).some((example) => example.id === state.selectedId)) {
        state.selectedId = getVisibleExamples(state)[0]?.id || examples[0].id;
        navigateToLesson(state.selectedId);
      }
      rerender();
    }

    return true;
  }

  const example = getExampleById(state.selectedId);
  const progress = ensureProgress(state, example.id);

  if (action === "reset-current") {
    if (!window.confirm(`${example.file} 진행 상황을 초기화할까요?`)) {
      return true;
    }

    resetLessonProgress(state, example.id);
    rerender();
    return true;
  }

  if (action === "reset-selected") {
    if (state.selectedLessons.size === 0) {
      return true;
    }

    if (!window.confirm(`선택한 ${state.selectedLessons.size}개 예제 진행 상황을 초기화할까요?`)) {
      return true;
    }

    state.selectedLessons.forEach((lessonId) => resetLessonProgress(state, lessonId));
    rerender();
    return true;
  }

  if (action === "reset-all") {
    if (!window.confirm("전체 예제 진행 상황을 모두 초기화할까요?")) {
      return true;
    }

    state.progress = {};
    rerender();
    return true;
  }

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
    return true;
  }

  if (action === "check-output") {
    const textarea = document.querySelector("#output-answer");
    progress.outputAnswer = textarea?.value ?? "";
    progress.outputReveal = false;
    progress.outputChecked =
      normalizeOutput(progress.outputAnswer, example.output.compareMode) ===
      normalizeOutput(example.output.expected, example.output.compareMode);
    rerender();
    return true;
  }

  if (action === "reveal-output") {
    const textarea = document.querySelector("#output-answer");
    progress.outputAnswer = textarea?.value ?? "";
    progress.outputReveal = true;
    progress.outputChecked = false;
    rerender();
    return true;
  }

  if (action === "check-blank-choice") {
    const selected = document.querySelector('input[name="blank-choice"]:checked');

    if (!selected) {
      progress.blankChoiceAnswer = null;
      progress.blankChoiceChecked = false;
    } else {
      progress.blankChoiceAnswer = Number(selected.value);
      progress.blankChoiceChecked =
        progress.blankChoiceAnswer === example.fillBlankChoice.answerIndex;
    }

    if (progress.blankChoiceChecked !== true) {
      progress.blankTextChecked = null;
      progress.reconstructionLiteChecked = null;
      progress.reconstructionDenseChecked = null;
      progress.fullCodeChecked = null;
    }

    rerender();
    return true;
  }

  if (action === "check-blank-text") {
    const input = document.querySelector("#blank-text-answer");
    progress.blankTextAnswer = input?.value ?? "";

    const acceptableAnswers = example.fillBlankText.answers.map(normalizeTokenAnswer);
    progress.blankTextChecked = acceptableAnswers.includes(normalizeTokenAnswer(progress.blankTextAnswer));

    if (progress.blankTextChecked !== true) {
      progress.reconstructionLiteChecked = null;
      progress.reconstructionDenseChecked = null;
      progress.fullCodeChecked = null;
    }

    rerender();
    return true;
  }

  if (action === "check-reconstruction-lite") {
    const source = await loadSource(state, example);
    const reconstruction = getReconstructionData(state, example, source);
    progress.reconstructionLiteAnswers = getInputValues(
      "reconstruction-lite",
      reconstruction.lite.answers.length
    );
    progress.reconstructionLiteChecked = checkTokenArrayAnswers(
      progress.reconstructionLiteAnswers,
      reconstruction.lite.answers
    );

    if (progress.reconstructionLiteChecked !== true) {
      progress.reconstructionDenseChecked = null;
      progress.fullCodeChecked = null;
    }

    rerender();
    return true;
  }

  if (action === "check-reconstruction-dense") {
    const source = await loadSource(state, example);
    const reconstruction = getReconstructionData(state, example, source);
    progress.reconstructionDenseAnswers = getInputValues(
      "reconstruction-dense",
      reconstruction.dense.answers.length
    );
    progress.reconstructionDenseChecked = checkTokenArrayAnswers(
      progress.reconstructionDenseAnswers,
      reconstruction.dense.answers
    );

    if (progress.reconstructionDenseChecked !== true) {
      progress.fullCodeChecked = null;
    }

    rerender();
    return true;
  }

  if (action === "check-full-code") {
    const source = await loadSource(state, example);
    const textarea = document.querySelector("#full-code-answer");
    progress.fullCodeAnswer = textarea?.value ?? "";
    progress.fullCodeChecked =
      normalizeFullCode(progress.fullCodeAnswer) === normalizeFullCode(source);
    rerender();
    return true;
  }

  return false;
}
