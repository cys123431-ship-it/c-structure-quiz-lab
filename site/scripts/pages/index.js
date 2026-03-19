import { createAppState, getGlobalStats, isValidExampleId } from "../core/store.js";
import { renderHeroCard, renderHeroStatsCard, renderSiteNav } from "../core/shell.js";

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

function renderLandingPage() {
  document.title = "C 자료구조 블록 퀴즈 | 학습 허브";

  const stats = getGlobalStats(appState);
  const primaryPages = [
    { href: "./achievements.html", label: "내 성취도 페이지 바로가기" },
    { href: "./progress.html", label: "학습 진행도 페이지 바로가기" },
    { href: "./problems.html", label: "문제 페이지 바로가기" },
    { href: "./review.html", label: "오답노트 바로가기" },
  ];

  app.innerHTML = `
    <div class="page-shell">
      <section class="page-hero">
        <div class="hero-panel hero-panel-copy">
          ${renderSiteNav("home")}
          ${renderHeroCard({
            eyebrow: "C Study Lab",
            title: "페이지를 나눠서 더 쉽게 공부하는 C 자료구조 허브",
            description:
              "처음 방문하면 소개와 기능 네비게이터가 보이고, 원하는 기능은 각자 독립된 페이지에서 이어서 공부할 수 있습니다. 이전에 쓰던 문제 링크는 자동으로 문제 페이지로 보내서 그대로 이어집니다.",
            actions: primaryPages
              .map(
                (page) => `
                  <a class="btn btn-secondary" href="${page.href}">
                    ${page.label}
                  </a>
                `
              )
              .join(""),
          })}
        </div>
        ${renderHeroStatsCard({
          eyebrow: "Shared Progress",
          description: "어느 페이지에서 풀어도 같은 진도와 오답 기록을 이어서 확인할 수 있습니다.",
          items: [
            { label: "예제 수", value: String(stats.lessonCount) },
            { label: "완료한 예제", value: String(stats.completedLessons) },
            { label: "정답", value: `${stats.solvedItems}/${stats.totalItems}` },
            { label: "오답", value: String(stats.wrongItems) },
            { label: "선택한 예제", value: String(stats.selectedLessons) },
          ],
        })}
      </section>

      <section class="feature-nav-panel">
        <div class="section-heading">
          <h2>기능 네비게이터</h2>
          <p>학습 흐름에 맞춰 원하는 페이지로 바로 이동하세요.</p>
        </div>
        <div class="feature-nav-grid">
          ${primaryPages
            .map(
              (page) => `
                <a class="feature-nav-card" href="${page.href}">
                  <span class="feature-nav-label">${page.label}</span>
                  <span class="feature-nav-arrow">바로가기</span>
                </a>
              `
            )
            .join("")}
        </div>
      </section>
    </div>
  `;
}

if (!redirectLegacyLessonIfNeeded()) {
  renderLandingPage();
}
