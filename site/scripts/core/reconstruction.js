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

export function createReconstructionData(example, source) {
  const tokens = buildReconstructionTokens(example, source);

  return {
    tokens,
    lite: buildMaskedCode(source, tokens.slice(0, RECONSTRUCTION_STAGE_LIMITS.lite)),
    dense: buildMaskedCode(source, tokens.slice(0, RECONSTRUCTION_STAGE_LIMITS.dense)),
  };
}
