# C 자료구조 블록 퀴즈

자료구조 C 예제(`ex02_01.c` ~ `ex02_15.c`)를 스마트폰에서도 풀기 쉽게 만든 정적 웹앱입니다.

앱 특징:

- 소개 허브 페이지와 기능별 전용 페이지 분리
- `성취도 / 학습 진행도 / 문제 / 오답노트`를 각각 별도 페이지로 제공
- 문제 페이지 왼쪽 세로 코드 선택 네비게이터
- 문제 페이지 상단/하단 `이전 코드 / 다음 코드` 이동
- 예제별 블록 해석 객관식
- 샘플 입력 기준 출력 예측
- 핵심 코드 빈칸 객관식
- 핵심 코드 빈칸 주관식
- 원본 코드와 총해설 제공

## 로컬에서 보기

루트 폴더에서 아래 명령을 실행한 뒤 브라우저로 엽니다.

```bash
python3 -m http.server 4173 --directory site
```

그 다음 `http://127.0.0.1:4173` 로 접속합니다.

개별 기능 페이지 예시:

- 소개 허브: `http://127.0.0.1:4173/`
- 성취도: `http://127.0.0.1:4173/achievements.html`
- 학습 진행도: `http://127.0.0.1:4173/progress.html`
- 문제 페이지: `http://127.0.0.1:4173/problems.html?lesson=ex02_02`
- 오답노트: `http://127.0.0.1:4173/review.html`

예전 링크인 `/?lesson=ex02_02` 형태로 접속해도 자동으로 문제 페이지로 이동합니다.

## 파일 구조

- `site/index.html`: 소개 허브 페이지
- `site/achievements.html`: 성취도 페이지
- `site/progress.html`: 학습 진행도 페이지
- `site/problems.html`: 문제 전용 페이지
- `site/review.html`: 오답노트 페이지
- `site/styles.css`: 공통 스타일
- `site/scripts/core/`: 공통 상태, 네비게이션, 유틸
- `site/scripts/pages/`: 페이지별 진입 스크립트
- `site/data/examples.js`: 15개 예제의 문제/해설 데이터
- `site/examples/`: 배포용 원본 C 파일 복사본

## 배포

정적 사이트는 `gh-pages` 브랜치에 `site/` 내용을 올리는 방식으로 배포할 수 있습니다.

배포 순서:

1. GitHub에 새 저장소 생성
2. 현재 폴더를 `main` 브랜치로 푸시
3. `site/` 폴더 내용을 `gh-pages` 브랜치로 푸시
4. 저장소의 GitHub Pages 소스를 `gh-pages` 브랜치 루트로 설정
