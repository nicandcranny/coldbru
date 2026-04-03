import get from 'lodash/get';
import { mockDataFunctions } from '@usebruno/common';
import { PROMPT_VARIABLE_TEXT_PATTERN } from '@usebruno/common/utils';

const VARIABLE_PATTERN = /\{\{([\w$.-]*)$/;

const MOCK_DATA_HINTS = Object.keys(mockDataFunctions).map((key) => `$${key}`);

const generateProgressiveHints = (fullHint) => {
  const parts = fullHint.split('.');
  const progressiveHints = [];

  for (let i = 1; i <= parts.length; i++) {
    progressiveHints.push(parts.slice(0, i).join('.'));
  }

  return progressiveHints;
};

const shouldSkipVariableKey = (key) => {
  return key === 'pathParams' || key === 'maskedEnvVariables' || key === 'process';
};

const transformVariablesToHints = (allVariables = {}) => {
  const hints = [];

  Object.keys(allVariables).forEach((key) => {
    if (!shouldSkipVariableKey(key)) {
      hints.push(key);
    }
  });

  if (allVariables.process && allVariables.process.env) {
    Object.keys(allVariables.process.env).forEach((key) => {
      hints.push(`process.env.${key}`);
    });
  }

  return hints;
};

const buildVariableHints = (allVariables = {}) => {
  const suggestionSet = new Set();

  MOCK_DATA_HINTS.forEach((hint) => {
    generateProgressiveHints(hint).forEach((entry) => suggestionSet.add(entry));
  });

  transformVariablesToHints(allVariables).forEach((hint) => {
    generateProgressiveHints(hint).forEach((entry) => suggestionSet.add(entry));
  });

  return Array.from(suggestionSet).sort();
};

const extractNextSegmentSuggestions = (filteredHints, currentInput) => {
  const prefixMatches = new Set();
  const substringMatches = new Set();
  const lowerInput = currentInput.toLowerCase();

  filteredHints.forEach((hint) => {
    const lowerHint = hint.toLowerCase();

    if (lowerHint.startsWith(lowerInput)) {
      if (lowerHint === lowerInput) {
        prefixMatches.add(hint.substring(hint.lastIndexOf('.') + 1));
        return;
      }

      const inputLength = currentInput.length;

      if (currentInput.endsWith('.')) {
        const afterDot = hint.substring(inputLength);
        const nextDot = afterDot.indexOf('.');
        const segment = nextDot === -1 ? afterDot : afterDot.substring(0, nextDot);
        prefixMatches.add(segment);
      } else {
        const lastDotInInput = currentInput.lastIndexOf('.');
        const currentSegmentStart = lastDotInInput + 1;
        const nextDotAfterInput = hint.indexOf('.', currentSegmentStart);
        const segment = nextDotAfterInput === -1
          ? hint.substring(currentSegmentStart)
          : hint.substring(currentSegmentStart, nextDotAfterInput);
        prefixMatches.add(segment);
      }
    } else if (lowerHint.includes(lowerInput)) {
      substringMatches.add(hint);
    }
  });

  return [...Array.from(prefixMatches).sort(), ...Array.from(substringMatches).sort()];
};

export const getVariableSuggestions = ({ value = '', cursorPosition = 0, variableHints = [] }) => {
  const currentString = value.slice(0, cursorPosition);
  const variableMatch = currentString.match(VARIABLE_PATTERN);

  if (!variableMatch) {
    return null;
  }

  const word = variableMatch[1] || '';
  const tokenStart = currentString.lastIndexOf('{{') + 2;
  const filteredHints = variableHints.filter((hint) => hint.toLowerCase().includes(word.toLowerCase()));
  const suggestions = extractNextSegmentSuggestions(filteredHints, word).slice(0, 50);

  if (!suggestions.length) {
    return null;
  }

  if (word.endsWith('.')) {
    return {
      suggestions,
      replaceFrom: cursorPosition,
      replaceTo: cursorPosition
    };
  }

  const lastDotIndex = word.lastIndexOf('.');

  return {
    suggestions,
    replaceFrom: lastDotIndex === -1 ? tokenStart : tokenStart + lastDotIndex + 1,
    replaceTo: cursorPosition
  };
};

export const applyVariableSuggestion = ({ value = '', replaceFrom = 0, replaceTo = 0, suggestion = '' }) => {
  return `${value.slice(0, replaceFrom)}${suggestion}${value.slice(replaceTo)}`;
};

const VARIABLE_TOKEN_PATTERN = /\{\{([^{}]+)\}\}/g;

const pathFoundInVariables = (path, obj) => {
  return get(obj, path) !== undefined;
};

export const tokenizeHighlightedValue = ({ value = '', allVariables = {} }) => {
  if (!value) {
    return [];
  }

  const tokens = [];
  let lastIndex = 0;
  const { pathParams = {}, ...variables } = allVariables || {};
  let match;

  while ((match = VARIABLE_TOKEN_PATTERN.exec(value)) !== null) {
    const [fullMatch, variableName] = match;
    const startIndex = match.index;

    if (startIndex > lastIndex) {
      tokens.push({
        text: value.slice(lastIndex, startIndex),
        type: 'text'
      });
    }

    let type = 'invalid';
    if (PROMPT_VARIABLE_TEXT_PATTERN.test(variableName)) {
      type = 'prompt';
    } else {
      const isMockVariable = variableName.startsWith('$') && Object.prototype.hasOwnProperty.call(mockDataFunctions, variableName.substring(1));
      const found = isMockVariable || pathFoundInVariables(variableName, variables) || pathFoundInVariables(variableName, pathParams);
      type = found ? 'valid' : 'invalid';
    }

    tokens.push({
      text: fullMatch,
      type
    });

    lastIndex = startIndex + fullMatch.length;
  }

  if (lastIndex < value.length) {
    tokens.push({
      text: value.slice(lastIndex),
      type: 'text'
    });
  }

  return tokens;
};

export { buildVariableHints };
