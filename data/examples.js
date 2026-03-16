const trimBlock = (text) => text.replace(/^\n/, "").replace(/\n\s*$/, "");

export const examples = [
  {
    id: "ex02_01",
    file: "ex02_01.c",
    source: "examples/ex02_01.c",
    title: "기본 자료형과 배열 크기 비교",
    theme: "sizeof, 기본 자료형, 배열",
    goal: "기본 자료형 하나의 크기와 같은 자료형 배열 전체의 크기를 비교한다.",
    intent:
      "자료형 자체의 메모리 크기와 배열이 차지하는 전체 메모리 크기가 어떻게 연결되는지 감각을 잡기 위한 예제다.",
    blocks: [
      {
        label: "블록 1",
        snippet: trimBlock(`
char c, c_array[100];
int i, i_array[100];
short s, s_array[100];
float f, f_array[100];
long l, l_array[100];
        `),
        question: "이 블록만 보고 확실히 말할 수 있는 내용은 무엇일까요?",
        options: [
          "각 줄마다 같은 자료형의 단일 변수와 배열이 함께 선언되어 있다.",
          "사용자에게 각 자료형 값을 입력받는 코드가 들어 있다.",
          "각 변수의 메모리 주소를 저장할 포인터가 선언되어 있다.",
          "모든 변수에 초기값이 대입되어 있다.",
        ],
        answerIndex: 0,
        explanation:
          "이 블록 자체만 보면 '같은 자료형의 변수 1개와 배열 1개를 짝으로 선언했다'는 사실까지는 확실히 읽을 수 있다.",
      },
      {
        label: "블록 2",
        snippet: trimBlock(`
printf("\\n char c 크기 = %d \\t: char c_array 크기 = %4d", sizeof(c), sizeof(c_array));
printf("\\n int i 크기 = %d \\t: int i_array 크기 = %4d", sizeof(i), sizeof(i_array));
        `),
        question: "이 출력 블록이 보여주는 관계로 가장 알맞은 것은?",
        options: [
          "배열의 전체 크기는 원소 하나의 크기 x 원소 개수로 해석할 수 있다.",
          "배열의 전체 크기는 항상 원소 하나의 크기와 같다.",
          "sizeof는 변수의 실제 값 크기를 출력한다.",
          "배열은 선언만 해도 자동으로 포인터로 변환된다.",
        ],
        answerIndex: 0,
        explanation:
          "예를 들어 char 배열 100칸이면 1바이트 x 100칸으로 100바이트가 되는 식으로 읽으면 된다.",
      },
    ],
    output: {
      sampleInput: "없음",
      compareMode: "default",
      expected: trimBlock(`
 char c 크기 = 1 	: char c_array 크기 =  100
 int i 크기 = 4 	: int i_array 크기 =  400
 short s 크기 = 2 	: short s_array 크기 =  200
 float f 크기 = 4 	: float f_array 크기 =  400
 long l 크기 = 8 	: long l_array 크기 =  800
      `),
      hint: "공백은 조금 달라도 괜찮습니다. 핵심 숫자와 줄 순서를 맞춰 보세요.",
    },
    fillBlankChoice: {
      snippet: trimBlock(`
printf("\\n char c 크기 = %d \\t: char c_array 크기 = %4d", sizeof(c), sizeof(____));
      `),
      prompt: "char 배열 전체 크기를 재는 두 번째 sizeof 대상은?",
      options: ["c", "c_array", "i", "i_array"],
      answerIndex: 1,
      explanation: "배열 전체 크기를 보고 싶을 때는 배열 이름인 c_array를 그대로 sizeof에 넣는다.",
    },
    fillBlankText: {
      snippet: trimBlock(`
printf("\\n char c 크기 = %d \\t: char c_array 크기 = %4d", sizeof(____), sizeof(c_array));
      `),
      prompt: "char 하나의 크기를 재는 첫 번째 sizeof 대상은?",
      answers: ["c"],
      explanation: "첫 번째 sizeof는 단일 변수 c의 크기를 출력하는 부분이다.",
    },
    summary: [
      "sizeof(변수)는 자료형 하나의 크기를 보여준다.",
      "sizeof(배열)은 배열 전체 메모리 크기를 보여준다.",
      "같은 자료형이라면 배열 크기는 원소 수에 비례한다.",
    ],
  },
  {
    id: "ex02_02",
    file: "ex02_02.c",
    source: "examples/ex02_02.c",
    title: "1차원 배열 초기화와 반복 출력",
    theme: "배열, 인덱스, for문",
    goal: "점수 배열과 학점 배열을 인덱스로 함께 순회한다.",
    intent:
      "서로 대응되는 두 배열을 같은 인덱스로 읽으면 관련 데이터를 한 번에 다룰 수 있다는 점을 익히기 위한 예제다.",
    blocks: [
      {
        label: "블록 1",
        snippet: trimBlock(`
int score[3] = { 91, 86, 97 };
char grade[3] = { 'A','B','A' };
        `),
        question: "이 블록만 보고 가장 분명하게 말할 수 있는 것은 무엇일까요?",
        options: [
          "점수 배열과 등급 배열이 같은 길이로 준비되어 있어 같은 인덱스로 함께 읽기 좋다.",
          "문자열 비교를 위한 문자 배열 두 개",
          "포인터 주소를 저장하기 위한 이중 배열",
          "구조체 배열을 대신하는 동적 메모리",
        ],
        answerIndex: 0,
        explanation:
          "두 배열 모두 길이가 3이고, score[i]와 grade[i]를 같은 번호로 묶어 읽는 구조라는 점을 블록만 보고도 확인할 수 있다.",
      },
      {
        label: "블록 2",
        snippet: trimBlock(`
for (i = 0; i < 3; i++) {
    printf("%3d학년 : 총점 = %d, 등급 = %c\\n", i + 1, score[i], grade[i]);
}
        `),
        question: "for문 안에서 i + 1을 쓰는 가장 직접적인 이유는?",
        options: [
          "배열 인덱스는 0부터지만, 학년 표시는 1학년부터 보여주기 위해",
          "score[i] 값을 한 칸씩 밀어서 출력하기 위해",
          "grade[i]를 숫자로 바꾸기 위해",
          "문자열 길이를 구하기 위해",
        ],
        answerIndex: 0,
        explanation:
          "배열은 0번부터 시작하지만, 사용자에게는 1학년, 2학년처럼 자연수로 보여 주고 싶기 때문이다.",
      },
    ],
    output: {
      sampleInput: "없음",
      compareMode: "default",
      expected: trimBlock(`
 *** 학년별 취득 학점 ***

 1학년 : 총점 = 91, 등급 = A
 2학년 : 총점 = 86, 등급 = B
 3학년 : 총점 = 97, 등급 = A
      `),
      hint: "제목 줄 뒤에 학년별 결과가 3줄 이어집니다.",
    },
    fillBlankChoice: {
      snippet: trimBlock(`
printf("%3d학년 : 총점 = %d, 등급 = %c\\n", i + 1, score[i], ____[i]);
      `),
      prompt: "등급을 꺼내는 배열 이름은?",
      options: ["score", "grade", "i", "Lee"],
      answerIndex: 1,
      explanation: "등급 문자 A, B, A는 grade 배열에서 꺼내므로 grade[i]가 들어간다.",
    },
    fillBlankText: {
      snippet: trimBlock(`
for (i = 0; i < ____; i++) {
      `),
      prompt: "배열 전체를 한 번씩 돌기 위한 반복 조건 값은?",
      answers: ["3"],
      explanation: "score와 grade 모두 원소가 3개이므로 0, 1, 2까지 돌면 된다.",
    },
    summary: [
      "서로 대응되는 배열은 같은 인덱스로 함께 읽을 수 있다.",
      "for문은 배열 전체를 순서대로 처리할 때 가장 자주 쓰인다.",
      "화면에 보여 줄 번호와 실제 인덱스가 다를 수 있다.",
    ],
  },
  {
    id: "ex02_03",
    file: "ex02_03.c",
    source: "examples/ex02_03.c",
    title: "입력 검증과 구구단 배열 저장",
    theme: "while, scanf, 배열",
    goal: "1~9 사이 정수를 입력받아 구구단 결과를 배열에 저장하고 출력한다.",
    intent:
      "반복 입력 검증과 반복 계산을 한 예제 안에서 함께 익히도록 만든 코드다.",
    blocks: [
      {
        label: "블록 1",
        snippet: trimBlock(`
while (1) {
    scanf("%d", &n);
    if (n < 0 || n>9)
        printf("\\n1~9의 정수를 입력하세요 : ");
    else
        break;
}
        `),
        question: "이 while 블록의 역할은 무엇인가요?",
        options: [
          "조건에 맞는 값이 들어올 때까지 입력을 계속 다시 받는다.",
          "배열의 초기값을 모두 0으로 만든다.",
          "구구단의 결과를 거꾸로 출력한다.",
          "입력된 값을 문자형으로 변환한다.",
        ],
        answerIndex: 0,
        explanation:
          "유효하지 않은 값이면 break가 실행되지 않으므로 계속 입력을 유도하는 구조다.",
      },
      {
        label: "블록 2",
        snippet: trimBlock(`
for (i = 0; i < 9; i++) {
    multiply[i] = n * (i + 1);
    printf(" %d * %d = %d \\n", n, (i + 1), multiply[i]);
}
        `),
        question: "이 for문이 동시에 수행하는 두 작업은?",
        options: [
          "계산 결과를 배열에 저장하고, 같은 결과를 바로 출력한다.",
          "입력값의 자릿수를 세고 정렬한다.",
          "배열 주소를 다른 포인터에 복사한다.",
          "문자열을 숫자로 바꾼다.",
        ],
        answerIndex: 0,
        explanation:
          "multiply[i]에 결과를 저장하고 곧바로 printf로 화면에 보여 준다.",
      },
    ],
    output: {
      sampleInput: "7",
      compareMode: "default",
      expected: trimBlock(`
1~9의 정수를 입력하세요 :
 7 * 1 = 7
 7 * 2 = 14
 7 * 3 = 21
 7 * 4 = 28
 7 * 5 = 35
 7 * 6 = 42
 7 * 7 = 49
 7 * 8 = 56
 7 * 9 = 63
      `),
      hint: "샘플 입력 7을 기준으로 7단이 1부터 9까지 출력됩니다.",
    },
    fillBlankChoice: {
      snippet: trimBlock(`
multiply[i] = n * (i + ____);
      `),
      prompt: "1단부터 시작하려면 빈칸은?",
      options: ["0", "1", "2", "9"],
      answerIndex: 1,
      explanation: "i는 0부터 시작하므로 1단을 만들기 위해 1을 더한다.",
    },
    fillBlankText: {
      snippet: trimBlock(`
scanf("%d", &____);
      `),
      prompt: "입력받은 값을 저장하는 변수 이름은?",
      answers: ["n"],
      explanation: "scanf는 변수 n의 주소를 받아 입력값을 저장한다.",
    },
    summary: [
      "while(1)과 break를 조합하면 반복 입력 검증을 만들기 쉽다.",
      "배열은 계산 결과를 나중에 다시 쓰기 위해 저장하는 용도로도 사용된다.",
      "반복문 인덱스 i와 실제 곱셈 단수 i+1을 구분해서 읽어야 한다.",
    ],
  },
  {
    id: "ex02_04",
    file: "ex02_04.c",
    source: "examples/ex02_04.c",
    title: "문자 배열을 문자 단위로 출력",
    theme: "문자열, 널 문자, 반복문",
    goal: "문자 배열에 저장된 문자열을 한 글자씩 순회하며 출력한다.",
    intent:
      "문자열도 결국 문자 배열이며, 널 문자 전까지 인덱스로 하나씩 읽을 수 있음을 보여 주는 예제다.",
    blocks: [
      {
        label: "블록 1",
        snippet: trimBlock(`
char str[20] = "Data Structure!";
        `),
        question: "이 선언에서 str에 실제로 저장되는 것은 무엇일까요?",
        options: [
          "문자들이 차례대로 들어 있는 배열과 마지막 널 문자",
          "문자열의 첫 글자만",
          "문자열이 놓인 메모리 주소만",
          "문자열 길이 숫자만",
        ],
        answerIndex: 0,
        explanation:
          "문자열 리터럴을 배열로 초기화하면 문자들과 문자열 종료 표시인 널 문자가 함께 들어간다.",
      },
      {
        label: "블록 2",
        snippet: trimBlock(`
for (i = 0; str[i]; i++) {
    printf("%c", str[i]);
}
        `),
        question: "조건식에 str[i]만 써도 반복이 멈추는 이유는?",
        options: [
          "널 문자 '\\0'는 0으로 취급되어 거짓이 되기 때문이다.",
          "배열 길이가 자동으로 계산되기 때문이다.",
          "printf가 종료 신호를 보내기 때문이다.",
          "문자 배열은 항상 20번까지만 반복되기 때문이다.",
        ],
        answerIndex: 0,
        explanation:
          "문자열 끝의 널 문자 '\\0'는 값 0이라서 조건식에서 false로 평가된다.",
      },
    ],
    output: {
      sampleInput: "없음",
      compareMode: "default",
      expected: trimBlock(`
문자 배열 str[] : Data Structure!
      `),
      hint: "제목 뒤에 문자열 전체가 한 줄로 이어집니다.",
    },
    fillBlankChoice: {
      snippet: trimBlock(`
for (i = 0; ____[i]; i++) {
      `),
      prompt: "반복 조건에서 검사하는 문자열 배열 이름은?",
      options: ["str", "i", "printf", "char"],
      answerIndex: 0,
      explanation: "문자열 끝을 확인하려면 현재 문자값인 str[i]를 검사해야 한다.",
    },
    fillBlankText: {
      snippet: trimBlock(`
for (i = 0; str[i]; ____ ) {
      `),
      prompt: "문자열을 다음 칸으로 이동시키는 증감식은?",
      answers: ["i++"],
      explanation: "매 반복마다 다음 문자로 이동하려면 i를 1 증가시켜야 한다.",
    },
    summary: [
      "문자열은 문자 배열이다.",
      "문자열의 끝은 널 문자 '\\0'로 판단한다.",
      "문자 단위 반복을 이해하면 문자열 처리의 기초가 잡힌다.",
    ],
  },
  {
    id: "ex02_05",
    file: "ex02_05.c",
    source: "examples/ex02_05.c",
    title: "문자열 입력과 길이 계산",
    theme: "문자열 입력, 반복, 길이",
    goal: "입력받은 문자열을 그대로 출력하고 길이를 직접 센다.",
    intent:
      "문자열 길이 함수를 쓰지 않고도 반복문만으로 길이를 셀 수 있다는 점을 익히는 예제다.",
    blocks: [
      {
        label: "블록 1",
        snippet: trimBlock(`
char str[50];
printf("\\n문자열을 입력하세요 : ");
gets(str);
        `),
        question: "이 블록의 핵심 기능은 무엇인가요?",
        options: [
          "사용자에게 문자열 한 줄을 입력받아 str 배열에 저장한다.",
          "문자열을 거꾸로 뒤집는다.",
          "문자열을 숫자로 변환한다.",
          "문자열의 길이를 자동으로 계산한다.",
        ],
        answerIndex: 0,
        explanation:
          "출력으로 입력을 요청하고, gets로 한 줄 문자열을 str에 저장한다.",
      },
      {
        label: "블록 2",
        snippet: trimBlock(`
for (i = 0; str[i]; i++) {
    printf("%c", str[i]);
    length += 1;
}
        `),
        question: "이 반복문이 length를 세는 원리는 무엇일까요?",
        options: [
          "문자 하나를 읽을 때마다 length를 1씩 증가시킨다.",
          "반복문이 끝난 뒤 배열 길이를 자동 대입한다.",
          "printf가 출력한 문자 수를 받아온다.",
          "널 문자를 포함해 2씩 증가시킨다.",
        ],
        answerIndex: 0,
        explanation:
          "널 문자 전까지 문자 하나당 카운트를 1씩 올리는 가장 기본적인 길이 계산 방식이다.",
      },
    ],
    output: {
      sampleInput: "hello world",
      compareMode: "default",
      expected: trimBlock(`
문자열을 입력하세요 :
입력된 문자열은
 "hello world"
입니다.

입력된 문자열의 길이 = 11
      `),
      hint: "샘플 입력은 hello world이며 공백도 길이에 포함됩니다.",
    },
    fillBlankChoice: {
      snippet: trimBlock(`
length += ____;
      `),
      prompt: "문자 하나를 셀 때 더해야 하는 값은?",
      options: ["0", "1", "2", "str[i]"],
      answerIndex: 1,
      explanation: "문자 한 개를 읽었으므로 length를 1 증가시킨다.",
    },
    fillBlankText: {
      snippet: trimBlock(`
gets(____);
      `),
      prompt: "입력 문자열이 저장되는 배열 이름은?",
      answers: ["str"],
      explanation: "사용자 입력은 str 배열에 저장된다.",
    },
    summary: [
      "문자열 길이는 문자를 하나씩 세어도 구할 수 있다.",
      "공백도 문자이므로 길이에 포함된다.",
      "이 예제의 gets는 오래된 방식이지만, 문자열 입력 흐름 자체를 배우는 데는 도움이 된다.",
    ],
  },
  {
    id: "ex02_06",
    file: "ex02_06.c",
    source: "examples/ex02_06.c",
    title: "3차원 배열 채우기",
    theme: "다차원 배열, 중첩 반복문",
    goal: "3차원 배열을 세 개의 반복문으로 순회하며 값을 채운다.",
    intent:
      "차원이 하나 늘어날 때마다 반복문도 한 겹씩 더 필요하다는 감각을 만들기 위한 예제다.",
    blocks: [
      {
        label: "블록 1",
        snippet: trimBlock(`
int array[2][3][4];
int i, j, k, value = 1;
        `),
        question: "이 선언에서 배열의 총 원소 수는 몇 개일까요?",
        options: ["9개", "12개", "24개", "48개"],
        answerIndex: 2,
        explanation: "2 x 3 x 4 = 24개의 칸이 만들어진다.",
      },
      {
        label: "블록 2",
        snippet: trimBlock(`
for (i = 0; i < 2; i++) {
    for (j = 0; j < 3; j++) {
        for (k = 0; k < 4; k++) {
            array[i][j][k] = value;
            value++;
        }
    }
}
        `),
        question: "value++가 가장 안쪽 반복문에 있는 이유는?",
        options: [
          "배열의 각 칸을 방문할 때마다 1, 2, 3... 순서대로 채우기 위해",
          "행이 바뀔 때만 숫자를 바꾸기 위해",
          "반복문 횟수를 줄이기 위해",
          "포인터 주소를 저장하기 위해",
        ],
        answerIndex: 0,
        explanation:
          "가장 안쪽이 실제 칸 하나를 처리하는 위치이므로, 거기서 값을 넣고 바로 증가시켜야 순차 값이 채워진다.",
      },
    ],
    output: {
      sampleInput: "없음",
      compareMode: "default",
      expected: trimBlock(`
array[0][0][0] = 1
array[0][0][1] = 2
array[0][0][2] = 3
array[0][0][3] = 4
array[0][1][0] = 5
array[0][1][1] = 6
array[0][1][2] = 7
array[0][1][3] = 8
array[0][2][0] = 9
array[0][2][1] = 10
array[0][2][2] = 11
array[0][2][3] = 12
array[1][0][0] = 13
array[1][0][1] = 14
array[1][0][2] = 15
array[1][0][3] = 16
array[1][1][0] = 17
array[1][1][1] = 18
array[1][1][2] = 19
array[1][1][3] = 20
array[1][2][0] = 21
array[1][2][1] = 22
array[1][2][2] = 23
array[1][2][3] = 24
      `),
      hint: "2 x 3 x 4의 모든 칸이 1부터 24까지 차례대로 채워집니다.",
    },
    fillBlankChoice: {
      snippet: trimBlock(`
int array[2][3][____];
      `),
      prompt: "세 번째 차원의 크기는?",
      options: ["2", "3", "4", "5"],
      answerIndex: 2,
      explanation: "마지막 차원은 4칸이다.",
    },
    fillBlankText: {
      snippet: trimBlock(`
array[i][j][k] = ____;
      `),
      prompt: "현재 칸에 넣는 증가형 변수 이름은?",
      answers: ["value"],
      explanation: "각 칸에는 value가 들어가고, 그 다음에 1 증가한다.",
    },
    summary: [
      "다차원 배열은 차원 수만큼 반복문이 겹치는 경우가 많다.",
      "가장 안쪽 반복문이 실제 원소 단위 처리 위치다.",
      "인덱스 순서를 잘 읽으면 다차원 배열도 규칙적으로 이해할 수 있다.",
    ],
  },
  {
    id: "ex02_07",
    file: "ex02_07.c",
    source: "examples/ex02_07.c",
    title: "학생 정보 문자열 3차원 배열",
    theme: "문자 배열, 다차원 배열, 입력",
    goal: "학생 2명의 이름, 학과, 학번을 3차원 문자 배열에 저장하고 다시 출력한다.",
    intent:
      "문자열 여러 묶음을 다차원 배열로 저장할 수 있다는 점과, 중첩 반복문으로 다시 읽어 내는 흐름을 익히기 위한 예제다.",
    blocks: [
      {
        label: "블록 1",
        snippet: trimBlock(`
char student[2][3][20];
for (i = 0; i < 2; i++) {
    gets(student[i][0]);
    gets(student[i][1]);
    gets(student[i][2]);
}
        `),
        question: "student[2][3][20]을 가장 자연스럽게 해석하면?",
        options: [
          "학생 2명 x 학생당 정보 3개 x 정보 하나의 최대 문자 20개",
          "학생 20명 x 과목 3개 x 성적 2개",
          "포인터 2개 x 문자열 20개 x 문자 3개",
          "정수 2개 x 정수 3개 x 정수 20개",
        ],
        answerIndex: 0,
        explanation:
          "첫 번째 차원은 학생 수, 두 번째 차원은 이름/학과/학번, 세 번째 차원은 각 문자열의 문자 저장공간이다.",
      },
      {
        label: "블록 2",
        snippet: trimBlock(`
for (j = 0; j < 3; j++) {
    printf("\\n\\t");
    for (k = 0; student[i][j][k] != '\\0'; k++) {
        printf("%c", student[i][j][k]);
    }
}
        `),
        question: "안쪽 두 반복문이 하는 일은 무엇인가요?",
        options: [
          "각 학생의 3개 문자열을 글자 단위로 다시 출력한다.",
          "학번을 숫자로 바꿔 정렬한다.",
          "학생 정보를 역순으로 저장한다.",
          "문자열을 모두 대문자로 변환한다.",
        ],
        answerIndex: 0,
        explanation:
          "j는 이름/학과/학번 같은 필드 이동, k는 해당 문자열 안의 문자 이동을 담당한다.",
      },
    ],
    output: {
      sampleInput: trimBlock(`
Kim
CS
2024001
Lee
Math
2024002
      `),
      compareMode: "default",
      expected: trimBlock(`
학생 1의 이름 : 학생 1의 학과 : 학생 1의 학번 :
학생 2의 이름 : 학생 2의 학과 : 학생 2의 학번 :

학생1
Kim
CS
2024001

학생2
Lee
Math
2024002
      `),
      hint: "입력 예시는 Kim / CS / 2024001 / Lee / Math / 2024002 입니다.",
    },
    fillBlankChoice: {
      snippet: trimBlock(`
char student[2][3][____];
      `),
      prompt: "각 문자열이 저장될 최대 길이 칸 수는?",
      options: ["3", "10", "20", "30"],
      answerIndex: 2,
      explanation: "세 번째 차원이 20이라 문자열 하나당 20칸을 가진다.",
    },
    fillBlankText: {
      snippet: trimBlock(`
for (j = 0; j < ____; j++) {
      `),
      prompt: "학생당 출력하는 정보 개수는 몇 개일까요?",
      answers: ["3"],
      explanation: "이름, 학과, 학번까지 총 3개를 출력한다.",
    },
    summary: [
      "다차원 문자 배열은 여러 문자열 묶음을 저장하는 데 사용할 수 있다.",
      "한 차원은 사람 수, 다른 차원은 정보 종류, 마지막 차원은 문자열 길이로 볼 수 있다.",
      "문자열 출력도 결국 널 문자 전까지 문자를 읽는 반복이다.",
    ],
  },
  {
    id: "ex02_08",
    file: "ex02_08.c",
    source: "examples/ex02_08.c",
    title: "기본 포인터 참조와 값 복사",
    theme: "포인터, 주소, 참조",
    goal: "포인터가 가리키는 대상에 따라 참조값이 어떻게 바뀌는지 확인한다.",
    intent:
      "포인터의 주소, 포인터가 가진 값, 포인터가 참조한 실제 값을 구분해서 읽도록 만든 기초 포인터 예제다.",
    blocks: [
      {
        label: "블록 1",
        snippet: trimBlock(`
int i = 10, j = 20;
int* ptr;

ptr = &i;
printf("\\n ptr의 값(ptr) = %u", ptr);
printf("\\n ptr의 참조 값(*ptr) = %d", *ptr);
        `),
        question: "ptr = &i; 직후 *ptr의 의미로 가장 알맞은 것은?",
        options: [
          "ptr이 가리키는 i의 실제 값",
          "ptr 자신의 메모리 주소",
          "j의 메모리 주소",
          "배열의 첫 번째 원소",
        ],
        answerIndex: 0,
        explanation:
          "ptr이 i의 주소를 저장했으므로 *ptr은 i를 따라가 읽은 실제 값 10을 뜻한다.",
      },
      {
        label: "블록 2",
        snippet: trimBlock(`
ptr = &j;
i = *ptr;
        `),
        question: "이 두 줄 실행 후 i 값은 어떻게 되나요?",
        options: ["10 그대로", "20으로 바뀜", "주소값으로 바뀜", "0이 됨"],
        answerIndex: 1,
        explanation:
          "ptr이 j를 가리키게 된 뒤 *ptr은 20이므로, 그 값이 i에 복사되어 i도 20이 된다.",
      },
    ],
    output: {
      sampleInput: "없음",
      compareMode: "addressAware",
      expected: trimBlock(`
i의 값 = 10
j의 값 = 20
i의 메모리 주소(&i) = 2466679912
j의 메모리 주소(&j) = 2466679916

<< ptr=&i 실행 >>
ptr의 메모리 주소(&ptr) = 2466679920
ptr의 값(ptr) = 2466679912
ptr의 참조 값(*ptr) = 10

<< ptr=&j 실행 >>
ptr의 메모리 주소(&ptr) = 2466679920
ptr의 값(ptr) = 2466679916
ptr의 참조값(*ptr) = 20

<< i=*ptr 실행 >>
i의 값 = 20
      `),
      hint: "주소 숫자는 실행마다 달라질 수 있습니다. 앱이 자동으로 주소를 비교에서 제외해 줍니다.",
    },
    fillBlankChoice: {
      snippet: trimBlock(`
ptr = &____;
      `),
      prompt: "처음 ptr이 가리키는 변수는?",
      options: ["ptr", "i", "j", "k"],
      answerIndex: 1,
      explanation: "예제는 먼저 ptr = &i; 를 실행한다.",
    },
    fillBlankText: {
      snippet: trimBlock(`
i = *____;
      `),
      prompt: "참조값을 꺼내 복사하는 포인터 이름은?",
      answers: ["ptr"],
      explanation: "ptr이 j를 가리키고 있으므로 *ptr은 20이 된다.",
    },
    summary: [
      "포인터 변수의 주소와 포인터가 저장한 주소는 다르다.",
      "*ptr은 ptr이 가리키는 대상의 실제 값이다.",
      "포인터 방향만 바꿔도 참조값이 즉시 달라진다.",
    ],
  },
  {
    id: "ex02_09",
    file: "ex02_09.c",
    source: "examples/ex02_09.c",
    title: "문자열 포인터와 부분 문자열",
    theme: "문자열 포인터, 포인터 연산",
    goal: "문자열 포인터로 부분 문자열, 역순 출력, 복사, 일부 수정까지 수행한다.",
    intent:
      "문자열을 포인터로 다루면 시작 위치 이동과 문자 단위 접근이 얼마나 자유로워지는지 익히게 하는 예제다.",
    blocks: [
      {
        label: "블록 1",
        snippet: trimBlock(`
ptr1 = string1;
printf("\\n\\n %s", ptr1 + 7);
ptr2 = &string1[7];
printf("\\n %s \\n\\n ", ptr2);
        `),
        question: "ptr1 + 7과 &string1[7]이 보여주는 핵심 개념은?",
        options: [
          "문자열 중간 위치를 시작점으로 삼아 부분 문자열을 읽을 수 있다.",
          "문자열 길이를 자동으로 7 줄인다.",
          "문자열이 숫자로 바뀐다.",
          "배열 전체가 다른 메모리로 복사된다.",
        ],
        answerIndex: 0,
        explanation:
          "문자열의 7번째 위치부터 읽기 시작하면 'come true!'처럼 뒤쪽 부분만 출력할 수 있다.",
      },
      {
        label: "블록 2",
        snippet: trimBlock(`
*ptr1 = 'P';
*(ptr1 + 1) = 'e';
*(ptr1 + 2) = 'a';
*(ptr1 + 3) = 'c';
*(ptr1 + 4) = 'e';
        `),
        question: "이 수정 블록 실행 후 string1 앞부분은 어떻게 바뀌나요?",
        options: ["Dreams", "Peace", "come", "true"],
        answerIndex: 1,
        explanation:
          "문자 하나씩 덮어써서 문자열 앞 다섯 글자가 Peace로 바뀐다.",
      },
    ],
    output: {
      sampleInput: "없음",
      compareMode: "addressAware",
      expected: trimBlock(`
string1의 주소 = 707726688 ptr1 = 707726688
string1 = Dreams come true!
ptr1 = Dreams come true!

come true!
come true!

!eurt emoc smaerD

string1 = Dreams come true!
string2 = Dreams come true!

string1 = Peaces come true!
      `),
      hint: "주소 숫자는 달라질 수 있습니다. 핵심은 문자열 출력 흐름입니다.",
    },
    fillBlankChoice: {
      snippet: trimBlock(`
ptr2 = &string1[____];
      `),
      prompt: "come true!가 시작되는 인덱스는?",
      options: ["5", "6", "7", "8"],
      answerIndex: 2,
      explanation: "string1[7]부터 'come true!'가 시작된다.",
    },
    fillBlankText: {
      snippet: trimBlock(`
*ptr1 = '____';
      `),
      prompt: "첫 글자를 Peace로 바꾸기 위해 넣는 문자는?",
      answers: ["P", "p"],
      explanation: "첫 글자를 P로 바꾸면서 Dreams가 Peaces의 시작으로 바뀐다.",
    },
    summary: [
      "문자열 포인터는 문자열 시작 위치를 옮겨 부분 문자열을 쉽게 읽게 해 준다.",
      "포인터 연산으로 문자 하나씩 접근할 수 있다.",
      "문자 배열이면 포인터를 통해 직접 내용도 수정할 수 있다.",
    ],
  },
  {
    id: "ex02_10",
    file: "ex02_10.c",
    source: "examples/ex02_10.c",
    title: "문자열 포인터 배열",
    theme: "포인터 배열, 문자열 교체",
    goal: "문자열 포인터 배열에 주소를 담고, 특정 원소를 다른 문자열로 바꾼다.",
    intent:
      "문자열 자체를 복사하지 않아도 포인터 배열 원소만 바꿔 연결 문자열을 쉽게 바꿀 수 있다는 점을 보여 준다.",
    blocks: [
      {
        label: "블록 1",
        snippet: trimBlock(`
char* ptrArray[4] = { { "Korea" },{ "Seoul" },{ "Mapo" },{ "152번지 2 / 3" } };
        `),
        question: "이 선언을 가장 자연스럽게 설명한 것은?",
        options: [
          "문자열 네 개의 시작 주소를 담는 포인터 배열",
          "문자 4개만 저장하는 문자 배열",
          "정수 네 개를 문자열로 변환하는 배열",
          "2차원 문자 배열과 완전히 같은 구조",
        ],
        answerIndex: 0,
        explanation:
          "각 칸에는 문자열 그 자체가 아니라 각 문자열의 시작 주소가 들어간다.",
      },
      {
        label: "블록 2",
        snippet: trimBlock(`
ptrArray[2] = "Jongno";
        `),
        question: "이 한 줄이 실제로 바꾸는 것은 무엇인가요?",
        options: [
          "세 번째 문자열 포인터가 새 문자열을 가리키도록 바꾼다.",
          "기존 Mapo 문자열의 문자를 직접 수정한다.",
          "배열 전체 크기를 다시 계산한다.",
          "네 번째 문자열도 함께 바꾼다.",
        ],
        answerIndex: 0,
        explanation:
          "문자열 내용을 수정하는 것이 아니라, 세 번째 포인터가 새 리터럴을 가리키게 바꾸는 것이다.",
      },
    ],
    output: {
      sampleInput: "없음",
      compareMode: "default",
      expected: trimBlock(`
Korea
Seoul
Mapo
152번지 2 / 3

Korea
Seoul
Jongno
152번지 2 / 3
      `),
      hint: "첫 번째 출력과 두 번째 출력의 차이는 세 번째 줄 하나입니다.",
    },
    fillBlankChoice: {
      snippet: trimBlock(`
ptrArray[____] = "Jongno";
      `),
      prompt: "새 문자열을 가리키도록 바뀌는 원소 인덱스는?",
      options: ["0", "1", "2", "3"],
      answerIndex: 2,
      explanation: "세 번째 원소가 바뀌므로 인덱스 2가 들어간다.",
    },
    fillBlankText: {
      snippet: trimBlock(`
printf("\\n %s", ____[i]);
      `),
      prompt: "반복문에서 문자열을 꺼내는 포인터 배열 이름은?",
      answers: ["ptrArray"],
      explanation: "출력은 ptrArray[i]를 순서대로 읽어 각 문자열을 보여 준다.",
    },
    summary: [
      "문자열 포인터 배열은 문자열 목록을 다루기에 편하다.",
      "포인터 배열 원소를 바꾸면 연결된 문자열도 쉽게 교체된다.",
      "문자열 자체 수정과 포인터가 가리키는 대상 변경은 다른 작업이다.",
    ],
  },
  {
    id: "ex02_11",
    file: "ex02_11.c",
    source: "examples/ex02_11.c",
    title: "이중 포인터 기초",
    theme: "이중 포인터, 문자열 포인터 배열",
    goal: "문자열 포인터 배열과 이중 포인터의 관계를 확인한다.",
    intent:
      "포인터를 한 번 더 참조하면 어떤 수준의 값이 나오는지 단계별로 읽는 연습을 시키는 예제다.",
    blocks: [
      {
        label: "블록 1",
        snippet: trimBlock(`
char* ptrArray[2];
char** ptrptr;

ptrArray[0] = "Korea";
ptrArray[1] = "Seoul";
ptrptr = ptrArray;
        `),
        question: "ptrptr = ptrArray;가 의미하는 바는 무엇인가요?",
        options: [
          "ptrptr가 ptrArray의 첫 번째 원소 위치를 가리키게 된다.",
          "ptrArray의 문자열 두 개가 합쳐진다.",
          "ptrptr가 곧바로 문자 K를 저장한다.",
          "ptrArray가 이중 포인터로 자동 변환된다.",
        ],
        answerIndex: 0,
        explanation:
          "ptrArray는 첫 번째 원소의 주소처럼 사용될 수 있고, 그 값은 char*를 가리키므로 char**와 연결된다.",
      },
      {
        label: "블록 2",
        snippet: trimBlock(`
printf("\\n ptrptr의 1차 참조값 ( *ptrptr) = %u", *ptrptr);
printf("\\n ptrptr의 2차 참조값 (**ptrptr) = %c", **ptrptr);
printf("\\n ptrptr의 2차 참조문자열 (**ptrptr) = %s", *ptrptr);
        `),
        question: "이 세 줄이 보여 주는 읽기 순서로 맞는 것은?",
        options: [
          "ptrptr -> 첫 번째 문자열 포인터 -> 첫 번째 문자/문자열",
          "ptrptr -> 정수 -> 문자 -> 배열 길이",
          "ptrptr -> 함수 -> 재귀 -> 출력",
          "ptrptr -> 구조체 -> 멤버 -> 포인터 배열",
        ],
        answerIndex: 0,
        explanation:
          "한 번 역참조하면 char* 수준, 두 번 역참조하면 실제 문자 수준으로 내려간다.",
      },
    ],
    output: {
      sampleInput: "없음",
      compareMode: "addressAware",
      expected: trimBlock(`
ptrArray[0]의 주소 (&ptrArray[0]) = 2224890144
ptrArray[0]의 값 (ptrArray[0]) = 1165438984
ptrArray[0]의 참조값 (*ptrArray[0]) = K
ptrArray[0]의 참조문자열 (*ptrArray[0]) = Korea

ptrArray[1]의 주소 (&ptrArray[1]) = 2224890152
ptrArray[1]의 값 (ptrArray[1]) = 1165438990
ptrArray[1]의 참조값 (*ptrArray[1]) = S
ptrArray[1]의 참조문자열(*ptrArray[1])= Seoul

ptrptr의 주소 (&ptrptr) = 2224890136
ptrptr의 값 (ptrptr) = 2224890144
ptrptr의 1차 참조값 ( *ptrptr) = 1165438984
ptrptr의 2차 참조값 (**ptrptr) = K
ptrptr의 2차 참조문자열 (**ptrptr) = Korea

*ptrArray[0] : Korea
**ptrptr : Korea

*ptrArray[1] : Seoul
**(ptrptr+1) : Seoul
      `),
      hint: "주소는 실행마다 달라져도, 문자와 문자열 결과는 항상 Korea / Seoul 흐름으로 유지됩니다.",
    },
    fillBlankChoice: {
      snippet: trimBlock(`
char** ____;
      `),
      prompt: "이중 포인터 변수 이름은?",
      options: ["ptrArray", "ptrptr", "string1", "grade"],
      answerIndex: 1,
      explanation: "예제에서 char** 타입 변수는 ptrptr이다.",
    },
    fillBlankText: {
      snippet: trimBlock(`
ptrptr = ____;
      `),
      prompt: "이중 포인터가 가리키기 시작하는 포인터 배열 이름은?",
      answers: ["ptrArray"],
      explanation: "ptrArray의 첫 원소 주소를 ptrptr이 받아 2중 참조를 시작한다.",
    },
    summary: [
      "char**는 char*를 가리키는 포인터다.",
      "한 번 역참조하면 문자열 포인터, 두 번 역참조하면 실제 문자로 내려간다.",
      "포인터 단계가 몇 번인지 차근차근 읽는 습관이 중요하다.",
    ],
  },
  {
    id: "ex02_12",
    file: "ex02_12.c",
    source: "examples/ex02_12.c",
    title: "구조체 배열 출력",
    theme: "구조체, 배열, 멤버 접근",
    goal: "직원 정보를 구조체 배열로 저장하고 반복문으로 출력한다.",
    intent:
      "서로 관련된 데이터를 하나의 구조체로 묶고, 그 구조체를 다시 배열로 다루는 패턴을 익히기 위한 예제다.",
    blocks: [
      {
        label: "블록 1",
        snippet: trimBlock(`
struct employee {
    char name[10];
    int year;
    int pay;
};
        `),
        question: "구조체 employee가 묶고 있는 데이터는 무엇인가요?",
        options: [
          "직원 한 명의 이름, 입사 연도, 연봉",
          "직원 전체의 주소 목록",
          "문자열 길이와 포인터 주소",
          "함수 호출 횟수와 반환값",
        ],
        answerIndex: 0,
        explanation:
          "관련 있는 정보 세 가지를 employee라는 한 덩어리로 정의한 것이다.",
      },
      {
        label: "블록 2",
        snippet: trimBlock(`
for (i = 0; i < 4; i++) {
    printf("\\n 이름 : %s", Lee[i].name);
    printf("\\n 입사 : %d", Lee[i].year);
    printf("\\n 연봉 : %d \\n", Lee[i].pay);
}
        `),
        question: "Lee[i].name처럼 점(.) 연산자를 쓰는 이유는?",
        options: [
          "구조체 배열의 i번째 원소 안에서 특정 멤버를 꺼내기 위해",
          "포인터를 두 번 참조하기 위해",
          "문자열 길이를 자동 계산하기 위해",
          "배열을 동적으로 할당하기 위해",
        ],
        answerIndex: 0,
        explanation:
          "Lee[i]는 구조체 한 개이고, 그 안의 멤버에 접근할 때 . 연산자를 사용한다.",
      },
    ],
    output: {
      sampleInput: "없음",
      compareMode: "default",
      expected: trimBlock(`
이름 : 이진호
입사 : 2022
연봉 : 4200

이름 : 이한영
입사 : 2023
연봉 : 3300

이름 : 이상원
입사 : 2023
연봉 : 3500

이름 : 이상범
입사 : 2024
연봉 : 2900
      `),
      hint: "직원 4명의 이름, 입사 연도, 연봉이 차례대로 출력됩니다.",
    },
    fillBlankChoice: {
      snippet: trimBlock(`
printf("\\n 연봉 : %d \\n", Lee[i].____);
      `),
      prompt: "연봉을 가리키는 구조체 멤버 이름은?",
      options: ["year", "pay", "name", "employee"],
      answerIndex: 1,
      explanation: "연봉 값은 구조체의 pay 멤버에 저장되어 있다.",
    },
    fillBlankText: {
      snippet: trimBlock(`
printf("\\n 이름 : %s", Lee[i].____);
      `),
      prompt: "이름 멤버를 가리키는 필드명은?",
      answers: ["name"],
      explanation: "구조체 employee의 문자열 이름 필드는 name이다.",
    },
    summary: [
      "구조체는 관련 있는 데이터를 하나의 단위로 묶는다.",
      "구조체 배열을 사용하면 여러 사람의 정보를 규칙적으로 저장할 수 있다.",
      "구조체 멤버 접근은 점(.) 연산자를 사용한다.",
    ],
  },
  {
    id: "ex02_13",
    file: "ex02_13.c",
    source: "examples/ex02_13.c",
    title: "구조체 포인터와 화살표 연산자",
    theme: "구조체 포인터, -> 연산자",
    goal: "구조체 포인터를 통해 멤버 값을 저장하고 출력한다.",
    intent:
      "구조체 자체 접근과 구조체 포인터 접근의 차이를 화살표 연산자로 익히도록 만든 예제다.",
    blocks: [
      {
        label: "블록 1",
        snippet: trimBlock(`
struct employee Lee;
struct employee* Sptr = &Lee;
        `),
        question: "Sptr가 가리키는 대상은 무엇인가요?",
        options: [
          "구조체 변수 Lee",
          "구조체 배열 전체",
          "문자열 이순신",
          "정수형 연봉 값",
        ],
        answerIndex: 0,
        explanation:
          "Sptr는 employee 구조체 변수 Lee의 주소를 저장하고 있다.",
      },
      {
        label: "블록 2",
        snippet: trimBlock(`
strcpy(Sptr->name, "이순신");
Sptr->year = 2023;
Sptr->pay = 5900;
        `),
        question: "화살표 연산자(->)는 언제 쓰나요?",
        options: [
          "구조체 포인터가 가리키는 구조체의 멤버에 접근할 때",
          "배열 인덱스를 줄일 때",
          "문자열을 연결할 때",
          "함수 반환형을 표시할 때",
        ],
        answerIndex: 0,
        explanation:
          "포인터로 구조체 멤버를 다룰 때는 . 대신 -> 를 사용한다.",
      },
    ],
    output: {
      sampleInput: "없음",
      compareMode: "default",
      expected: trimBlock(`
이름 : 이순신
입사 : 2023
연봉 : 5900
      `),
      hint: "화살표 연산자로 넣은 값 3개가 그대로 출력됩니다.",
    },
    fillBlankChoice: {
      snippet: trimBlock(`
struct employee* Sptr = &____;
      `),
      prompt: "포인터가 가리키는 구조체 변수 이름은?",
      options: ["Sptr", "Lee", "name", "year"],
      answerIndex: 1,
      explanation: "Sptr는 Lee의 주소를 받는다.",
    },
    fillBlankText: {
      snippet: trimBlock(`
Sptr->____ = 5900;
      `),
      prompt: "연봉 멤버 이름은?",
      answers: ["pay"],
      explanation: "연봉 필드는 pay이다.",
    },
    summary: [
      "구조체 포인터는 구조체의 주소를 저장한다.",
      "포인터로 구조체 멤버에 접근할 때는 -> 연산자를 쓴다.",
      "문자열 멤버는 strcpy로 넣고, 숫자 멤버는 직접 대입할 수 있다.",
    ],
  },
  {
    id: "ex02_14",
    file: "ex02_14.c",
    source: "examples/ex02_14.c",
    title: "재귀 팩토리얼",
    theme: "재귀 함수, 종료 조건",
    goal: "팩토리얼을 재귀 호출로 계산하고 호출 순서와 반환 과정을 출력한다.",
    intent:
      "재귀에서 가장 중요한 종료 조건과 되돌아오며 결과를 만드는 흐름을 눈으로 확인하게 하는 예제다.",
    blocks: [
      {
        label: "블록 1",
        snippet: trimBlock(`
if (n <= 1) {
    printf("\\n fact(1) 함수 호출!");
    printf("\\n fact(1) 값 1 반환!!");
    return 1;
}
        `),
        question: "이 if문이 재귀에서 맡는 역할은 무엇인가요?",
        options: [
          "재귀를 멈추게 하는 종료 조건",
          "입력값을 계속 증가시키는 반복 조건",
          "배열을 초기화하는 조건",
          "포인터 주소를 반환하는 조건",
        ],
        answerIndex: 0,
        explanation:
          "종료 조건이 없으면 fact가 끝없이 자신을 다시 호출하게 된다.",
      },
      {
        label: "블록 2",
        snippet: trimBlock(`
printf("\\n fact(%d) 함수 호출!", n);
value = (n * fact(n - 1));
printf("\\n fact(%d) 값 %ld 반환!!", n, value);
        `),
        question: "value = (n * fact(n - 1));가 보여 주는 재귀 핵심은?",
        options: [
          "현재 문제를 더 작은 문제 fact(n-1)로 나누고, 돌아오면서 결과를 합친다.",
          "문자열을 숫자로 바꾼다.",
          "포인터를 한 단계 더 참조한다.",
          "배열 전체를 한 번에 복사한다.",
        ],
        answerIndex: 0,
        explanation:
          "팩토리얼 n!은 n x (n-1)!로 쪼갤 수 있으므로 재귀 정의와 잘 맞는다.",
      },
    ],
    output: {
      sampleInput: "5",
      compareMode: "default",
      expected: trimBlock(`
정수를 입력하세요 :
fact(5) 함수 호출!
fact(4) 함수 호출!
fact(3) 함수 호출!
fact(2) 함수 호출!
fact(1) 함수 호출!
fact(1) 값 1 반환!!
fact(2) 값 2 반환!!
fact(3) 값 6 반환!!
fact(4) 값 24 반환!!
fact(5) 값 120 반환!!

5의 팩토리얼 값은 120입니다.
      `),
      hint: "샘플 입력 5 기준으로 호출은 5->4->3->2->1, 반환은 1->2->6->24->120 순서입니다.",
    },
    fillBlankChoice: {
      snippet: trimBlock(`
if (n <= ____ ) {
      `),
      prompt: "팩토리얼 종료 조건의 기준값은?",
      options: ["0", "1", "2", "n"],
      answerIndex: 1,
      explanation: "이 예제는 n이 1 이하일 때 종료한다.",
    },
    fillBlankText: {
      snippet: trimBlock(`
value = (n * fact(____));
      `),
      prompt: "더 작은 문제로 내려가기 위한 인자는?",
      answers: ["n - 1", "n-1"],
      explanation: "n!을 계산하려면 (n-1)!이 필요하다.",
    },
    summary: [
      "재귀 함수에는 반드시 종료 조건이 필요하다.",
      "팩토리얼은 n x (n-1)! 구조라 재귀 예제로 자주 쓰인다.",
      "호출 순서와 반환 순서를 구분해서 읽으면 재귀가 훨씬 쉬워진다.",
    ],
  },
  {
    id: "ex02_15",
    file: "ex02_15.c",
    source: "examples/ex02_15.c",
    title: "하노이 탑 재귀 이동",
    theme: "재귀, 분할 정복",
    goal: "원반 3개의 하노이 탑 이동 순서를 재귀로 출력한다.",
    intent:
      "큰 문제를 '위 n-1개 옮기기 -> 가장 큰 원반 옮기기 -> 다시 n-1개 옮기기'로 쪼개는 재귀 구조를 익히기 위한 예제다.",
    blocks: [
      {
        label: "블록 1",
        snippet: trimBlock(`
if (n == 1)
    printf(" %c에서 원반 %d를(을) %c로 옮김 \\n", start, n, target);
        `),
        question: "n == 1일 때 바로 출력하고 끝내는 이유는?",
        options: [
          "원반이 하나면 더 쪼갤 필요 없이 바로 옮길 수 있기 때문이다.",
          "원반이 하나면 이동이 불가능하기 때문이다.",
          "주소값을 계산하기 위해서다.",
          "문자열 길이를 세기 위해서다.",
        ],
        answerIndex: 0,
        explanation:
          "하노이 탑의 가장 작은 단위 문제는 원반 하나를 출발 기둥에서 목표 기둥으로 옮기는 것이다.",
      },
      {
        label: "블록 2",
        snippet: trimBlock(`
hanoi(n - 1, start, target, work);
printf(" %c에서 원반 %d를(을) %c로 옮김 \\n", start, n, target);
hanoi(n - 1, work, start, target);
        `),
        question: "이 세 줄이 뜻하는 이동 순서는 무엇일까요?",
        options: [
          "위의 n-1개를 보조 기둥으로, 가장 큰 원반을 목표로, 다시 n-1개를 목표로 옮긴다.",
          "가장 큰 원반을 먼저 옮기고 나머지는 무시한다.",
          "항상 시작 기둥에서만 움직인다.",
          "원반 수를 1씩 늘리며 반복한다.",
        ],
        answerIndex: 0,
        explanation:
          "하노이 탑의 핵심 재귀 구조가 그대로 적혀 있다.",
      },
    ],
    output: {
      sampleInput: "없음",
      compareMode: "default",
      expected: trimBlock(`
A에서 원반 1를(을) C로 옮김
A에서 원반 2를(을) B로 옮김
C에서 원반 1를(을) B로 옮김
A에서 원반 3를(을) C로 옮김
B에서 원반 1를(을) A로 옮김
B에서 원반 2를(을) C로 옮김
A에서 원반 1를(을) C로 옮김
      `),
      hint: "원반 3개이므로 총 7번 이동이 출력됩니다.",
    },
    fillBlankChoice: {
      snippet: trimBlock(`
hanoi(n - 1, start, target, ____);
      `),
      prompt: "첫 번째 재귀 호출에서 보조 기둥 역할로 전달되는 변수는?",
      options: ["start", "work", "target", "n"],
      answerIndex: 1,
      explanation: "첫 번째 재귀 호출은 n-1개 원반을 work 기둥으로 옮기기 위한 호출이라 마지막 인자로 work가 들어간다.",
    },
    fillBlankText: {
      snippet: trimBlock(`
if (n == ____ )
      `),
      prompt: "가장 작은 종료 조건 값은?",
      answers: ["1"],
      explanation: "원반이 1개면 바로 옮길 수 있어 재귀를 멈춘다.",
    },
    summary: [
      "하노이 탑은 대표적인 재귀 분할 정복 예제다.",
      "원반 1개 이동이 기본 문제이고, 그보다 큰 문제는 같은 패턴의 반복이다.",
      "문제 분해 순서를 이해하면 재귀 호출 순서도 읽기 쉬워진다.",
    ],
  },
];
