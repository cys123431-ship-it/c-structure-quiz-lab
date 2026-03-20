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

function renderTopNav(currentLessonHref) {
  const navLinks = [
    { href: "./achievements.html", label: "성취도" },
    { href: "./progress.html", label: "학습 센터" },
    { href: "./problems.html", label: "문제 페이지" },
    { href: "./review.html", label: "오답노트" },
  ];

  return `
    <header class="landing-nav">
      <a class="landing-brand" href="./index.html">
        <span class="landing-brand-mark">DS</span>
        <span class="landing-brand-copy">
          <strong>C 자료구조 블록 퀴즈</strong>
          <span>학습 허브</span>
        </span>
      </a>

      <nav class="landing-nav-links" aria-label="메인 기능">
        ${navLinks
          .map(
            (link) => `
              <a class="landing-nav-link" href="${link.href}">
                ${link.label}
              </a>
            `
          )
          .join("")}
      </nav>

      <div class="landing-nav-actions">
        <a class="landing-nav-secondary" href="${currentLessonHref}">최근 문제</a>
        <a class="landing-nav-primary" href="./problems.html">문제 시작</a>
      </div>
    </header>
  `;
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
      ${renderTopNav(currentLessonHref)}

      <main class="landing-main">
        <section class="landing-hero">
          <div class="landing-hero-copy">
            <p class="landing-kicker">C Data Structure Study Hub</p>
            <h1 class="landing-headline">
              <span class="landing-headline-accent">학습</span> 허브
            </h1>
            <p class="landing-subcopy">
              소개, 성취도, 학습 진행도, 문제, 오답노트를 각각 분리해 두었습니다.
              필요한 화면으로 바로 들어가고, 문제 페이지에서는 코드별로 집중해서 풀이할 수 있습니다.
            </p>
          </div>

          <section class="landing-launchpad" aria-label="빠른 시작">
            <div class="landing-launchpad-frame">
              <aside class="landing-rail-card">
                <span class="landing-rail-badge">빠른 시작</span>
                <strong>어디로 들어갈지 고르면 바로 이동합니다.</strong>
                <p>기능별로 나뉜 페이지를 한 번에 훑고, 지금 필요한 화면으로 바로 들어가는 진입 패널입니다.</p>
              </aside>

              <div class="landing-launchpad-main">
                <p class="landing-launchpad-label">오늘은 어디서 시작할까요?</p>
                <div class="landing-quick-grid">
                  ${renderQuickCards(currentLesson, stats)}
                </div>
                <div class="landing-stat-strip">
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
