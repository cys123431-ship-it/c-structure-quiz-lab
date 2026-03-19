import { examples, ensureProgress, getGlobalStats, getLessonStatus, getOutputStatus, state } from "./store.js";

export function getProgressPercent(example) {
  const lessonStatus = getLessonStatus(example);
  return Math.round((lessonStatus.correct / lessonStatus.total) * 100);
}

export function getWrongStepLabels(example) {
  const progress = ensureProgress(example.id);
  const labels = [];

  example.blocks.forEach((block, index) => {
    const blockProgress = progress.blocks[index];
    if (blockProgress?.checked && blockProgress.correct === false) {
      labels.push(`${block.label} 해석`);
    }
  });

  if (getOutputStatus(progress) === false) {
    labels.push("실행 결과 예측");
  }

  if (progress.blankChoiceChecked === false) {
    labels.push("핵심 코드 빈칸 객관식");
  }

  if (progress.blankTextChecked === false) {
    labels.push("핵심 코드 빈칸 주관식");
  }

  if (progress.reconstructionLiteChecked === false) {
    labels.push("핵심 번호 빈칸");
  }

  if (progress.reconstructionDenseChecked === false) {
    labels.push("빈칸 확대 복원");
  }

  if (progress.fullCodeChecked === false) {
    labels.push("전체 코드 직접 입력");
  }

  return labels;
}

export function getCompletedExamples() {
  return examples.filter((example) => {
    const lessonStatus = getLessonStatus(example);
    return lessonStatus.correct === lessonStatus.total;
  });
}

export function getInProgressExamples() {
  return examples.filter((example) => {
    const lessonStatus = getLessonStatus(example);
    return lessonStatus.correct > 0 && lessonStatus.correct < lessonStatus.total;
  });
}

export function getWrongExamples() {
  return examples.filter((example) => getLessonStatus(example).wrong > 0);
}

export function getSelectedExamples() {
  return examples.filter((example) => state.selectedLessons.has(example.id));
}

export function getAchievementBadges() {
  const stats = getGlobalStats();
  const completedExamples = getCompletedExamples();
  const badges = [];

  if (completedExamples.length > 0) {
    badges.push({
      title: "완주 시작",
      description: `${completedExamples.length}개 예제를 끝까지 풀었습니다.`,
      tone: "accent",
    });
  }

  if (stats.wrongItems === 0 && stats.solvedItems > 0) {
    badges.push({
      title: "오답 정리 완료",
      description: "현재 기록된 오답 문항이 없습니다.",
      tone: "success",
    });
  }

  if (stats.selectedLessons >= 3) {
    badges.push({
      title: "집중 코스 구성",
      description: `${stats.selectedLessons}개 예제를 따로 골라 복습 흐름을 만들었습니다.`,
      tone: "warm",
    });
  }

  if (stats.solvedItems >= Math.ceil(stats.totalItems * 0.6)) {
    badges.push({
      title: "학습 페이스 안정화",
      description: `전체 문항의 ${Math.round((stats.solvedItems / stats.totalItems) * 100)}%를 맞혔습니다.`,
      tone: "accent",
    });
  }

  if (badges.length === 0) {
    badges.push({
      title: "첫 기록 만들기",
      description: "문제를 풀면 이 페이지에서 성취 배지를 모아볼 수 있습니다.",
      tone: "default",
    });
  }

  return badges;
}
