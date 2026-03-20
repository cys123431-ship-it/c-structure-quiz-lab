import { renderSiteNav } from "../core/navigation.js";
import { createAppState, getExampleById, getGlobalStats, isValidExampleId } from "../core/store.js";

const app = document.querySelector("#app");
const appState = createAppState();

function buildRedirectUrl(lessonId) {
  const params = new URLSearchParams(window.location.search);
  params.set("lesson", lessonId);
  return `./problems.html?${params.toString()}`;
}

function getLegacyLessonId() {
  const params = new URLSearchParams(window.location.search);
  const lessonId = params.get("lesson");
  const hashId = window.location.hash.replace("#", "");

  if (isValidExampleId(lessonId)) {
    return lessonId;
  }

  if (isValidExampleId(hashId)) {
    return hashId;
  }

  return null;
}

function redirectLegacyLessonIfNeeded() {
  const lessonId = getLegacyLessonId();

  if (!lessonId) {
    return false;
  }

  window.location.replace(buildRedirectUrl(lessonId));
  return true;
}

function renderQuickCards(currentLesson, stats) {
  const cards = [
    {
      href: "./achievements.html",
      eyebrow: "성과 확인",
      title: "내 성취도 페이지",
      detail: `완료 ${stats.completedLessons}개 / 오답 ${stats.wrongItems}문항`,
    },
    {
      href: "./progress.html",
      eyebrow: "진도 관리",
      title: "학습 진행도 페이지",
      detail: `선택 ${stats.selectedLessons}개 / 전체 ${stats.lessonCount}개`,
    },
    {
      href: currentLesson ? `./problems.html?lesson=${currentLesson.id}` : "./problems.html",
      eyebrow: "바로 풀이",
      title: "문제 페이지",
      detail: currentLesson ? `최근 코드 ${currentLesson.file}` : "원하는 코드 선택 후 시작",
    },
    {
      href: "./review.html",
      eyebrow: "복습 집중",
      title: "오답노트",
      detail: stats.wrongItems > 0 ? `${stats.wrongItems}문항 다시 보기` : "현재 오답 0문항",
    },
  ];

  return cards
    .map(
      (card) => `
        <a class="landing-quick-card" href="${card.href}">
          <span class="landing-quick-eyebrow">${card.eyebrow}</span>
          <strong>${card.title}</strong>
          <span>${card.detail}</span>
        </a>
      `
    )
    .join("");
}

function renderLandingPage() {
  const stats = getGlobalStats(appState);
  const currentLesson = getExampleById(appState.selectedId);
  const currentLessonHref = `./problems.html?lesson=${currentLesson.id}`;
  const highlightStats = [
    { label: "예제 수", value: String(stats.lessonCount) },
    { label: "완료한 예제", value: String(stats.completedLessons) },
    { label: "정답 문항", value: `${stats.solvedItems}/${stats.totalItems}` },
    { label: "오답 문항", value: String(stats.wrongItems) },
  ];

  document.title = "C 자료구조 블록 퀴즈 | 학습 허브";

  app.innerHTML = `
    <div class="page-shell landing-page">
      ${renderSiteNav("home")}

      <main class="landing-main">
        <section class="landing-hero">
          <div class="landing-hero-copy">
            <p class="landing-kicker">C Data Structure Study Hub</p>
            <h1 class="landing-headline">
              <span class="landing-headline-accent">학습</span> 허브
            </h1>
            <p class="landing-subcopy">
              지금 필요한 화면을 먼저 고르고, 문제 풀이와 복습은 각 페이지에서 더 깊게 이어 갈 수 있도록
              학습 흐름을 분리했습니다. 허브에서는 전체 구조를 빠르게 잡고, 이어서 풀 코드와 복습 대상까지
              바로 결정할 수 있습니다.
            </p>
          </div>

          <div class="landing-stat-strip" aria-label="학습 현황 요약">
            ${highlightStats
              .map(
                (item) => `
                  <div class="landing-stat-chip">
                    <span>${item.label}</span>
                    <strong>${item.value}</strong>
                  </div>
                `
              )
              .join("")}
          </div>

          <section class="landing-launchpad" aria-label="빠른 시작">
            <div class="landing-launchpad-frame">
              <aside class="landing-rail-card">
                <span class="landing-rail-badge">학습 흐름</span>
                <strong>허브에서 방향을 정하고, 아래에서 바로 원하는 페이지로 진입하세요.</strong>
                <p>상태를 확인하고 싶으면 성취도와 진행도로, 바로 문제를 풀고 싶으면 문제 페이지와 오답노트로
                곧바로 이어질 수 있게 정리했습니다.</p>
              </aside>

              <div class="landing-launchpad-main">
                <p class="landing-launchpad-label">오늘은 어디서 시작할까요?</p>
                <div class="landing-quick-grid">
                  ${renderQuickCards(currentLesson, stats)}
                </div>
              </div>
            </div>

            <a class="landing-launch-button" href="${currentLessonHref}">
              최근 코드 ${currentLesson.file} 이어서 풀기
            </a>
          </section>
        </section>

        <section class="landing-secondary-grid">
          <article class="landing-info-card">
            <span class="landing-info-kicker">학습 흐름</span>
            <h2>한 페이지에 몰아넣지 않고, 역할별로 나눴습니다.</h2>
            <p>
              처음에는 허브에서 전체 구조를 보고, 이후에는 성취도나 진행도 페이지를 거쳐
              문제 페이지 또는 오답노트로 진입하는 흐름을 기본으로 둡니다.
            </p>
          </article>

          <article class="landing-info-card">
            <span class="landing-info-kicker">현재 포인트</span>
            <h2>${currentLesson.file}부터 바로 재개할 수 있습니다.</h2>
            <p>
              마지막으로 본 코드는 ${currentLesson.title}입니다. 이어서 풀거나, 문제 페이지에서
              다른 코드를 세로 탐색기로 골라 시작할 수 있습니다.
            </p>
          </article>

          <article class="landing-info-card landing-info-card-strong">
            <span class="landing-info-kicker">추천 시작점</span>
            <h2>처음이면 문제 페이지, 복습이면 오답노트가 가장 빠릅니다.</h2>
            <div class="landing-info-actions">
              <a class="landing-inline-link" href="./problems.html">문제 페이지 열기</a>
              <a class="landing-inline-link" href="./review.html">오답노트 열기</a>
            </div>
          </article>
        </section>
      </main>
    </div>
  `;
}

if (!redirectLegacyLessonIfNeeded()) {
  renderLandingPage();
}
