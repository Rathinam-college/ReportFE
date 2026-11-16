/**
 * Safe Mathematical Formula Engine for Category Management.
 * Evaluates formulas using safe Shunting-Yard tokenization and AST-like evaluation.
 * Guaranteed safe: NEVER uses eval(), new Function(), or arbitrary code execution.
 * Includes cycle detection, zero-division protection, and category ID reference mapping.
 */

/**
 * Normalizes formula string:
 * - Converts symbols (×, x, ÷, :, −, –) to standard operators (*, /, -)
 * - Auto-wraps bare category names into [Category Name]
 * - Maps category names to unique category IDs -> id_expression: ([CAT_ID:1] + [CAT_ID:2]) * 0.18
 */
export function normalizeExpression(expr, availableCategories = []) {
  if (!expr || typeof expr !== 'string' || !expr.trim()) {
    return {
      normalizedExpr: '',
      idExpr: '',
      categoryIds: [],
      categoryNames: []
    };
  }

  let res = expr.trim();
  res = res.replace(/×/g, '*');
  res = res.replace(/[÷:]/g, '/');
  res = res.replace(/[−–]/g, '-');
  res = res.replace(/,/g, '');

  // Replace standalone 'x' or 'X' surrounded by whitespace or numbers with '*'
  res = res.replace(/(\s|\d|\)|\])[xX](\s|\d|\(|\[)/g, '$1*$2');

  // Sort available categories by name length descending so longer category names match first
  const sortedCats = [...availableCategories].sort((a, b) => (b.name?.length || 0) - (a.name?.length || 0));

  // 1. Auto-wrap bare category names not enclosed in brackets
  sortedCats.forEach(cat => {
    const cName = (cat.name || '').trim();
    if (!cName) return;
    const escaped = cName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const bareRegex = new RegExp(`(?<!\\[)${escaped}(?!\\])`, 'gi');
    res = res.replace(bareRegex, `[${cName}]`);

    const cCode = (cat.code || '').trim();
    if (cCode) {
      const escapedCode = cCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const codeRegex = new RegExp(`(?<!\\[)${escapedCode}(?!\\])`, 'gi');
      res = res.replace(codeRegex, `[${cName}]`);
    }
  });

  // 2. Extract referenced category names and map to IDs
  const categoryIds = [];
  const categoryNames = [];
  let idExpr = res;

  const catByName = new Map();
  const catById = new Map();
  availableCategories.forEach(c => {
    if (c.name) catByName.set(c.name.trim().toLowerCase(), c);
    if (c.id !== undefined && c.id !== null) catById.set(Number(c.id), c);
  });

  // Find all [ ... ] tokens
  const bracketMatches = res.match(/\[(.*?)\]/g) || [];
  bracketMatches.forEach(tWithBrackets => {
    const content = tWithBrackets.slice(1, -1).trim();
    const idMatch = content.match(/^CAT_ID:(\d+)$/i);

    if (idMatch) {
      const cid = Number(idMatch[1]);
      if (catById.has(cid)) {
        if (!categoryIds.includes(cid)) {
          categoryIds.push(cid);
          categoryNames.push(catById.get(cid).name);
        }
      }
      return;
    }

    const matchedCat = catByName.get(content.toLowerCase());
    if (matchedCat) {
      const cid = Number(matchedCat.id);
      const cName = matchedCat.name;
      if (!isNaN(cid) && !categoryIds.includes(cid)) {
        categoryIds.push(cid);
        categoryNames.push(cName);
      }
      // Replace with [CAT_ID:id] in idExpr
      idExpr = idExpr.split(tWithBrackets).join(`[CAT_ID:${cid}]`);
    }
  });

  return {
    normalizedExpr: res,
    idExpr,
    categoryIds,
    categoryNames
  };
}

/**
 * Tokenizes formula expression safely.
 * Returns array of { type, value }
 */
export function tokenize(expression) {
  const tokens = [];
  let i = 0;
  const length = expression.length;

  while (i < length) {
    const ch = expression[i];

    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    // Category bracket [Category Name] or [CAT_ID:123]
    if (ch === '[') {
      const closeIdx = expression.indexOf(']', i);
      if (closeIdx === -1) {
        throw new Error("Missing closing bracket ']' in formula");
      }
      const content = expression.slice(i + 1, closeIdx).trim();
      const idMatch = content.match(/^CAT_ID:(\d+)$/i);
      if (idMatch) {
        tokens.push({ type: 'CATEGORY_ID', value: Number(idMatch[1]) });
      } else {
        tokens.push({ type: 'CATEGORY_NAME', value: content });
      }
      i = closeIdx + 1;
      continue;
    }

    // Numbers & Decimals
    if (/\d/.test(ch) || (ch === '.' && i + 1 < length && /\d/.test(expression[i + 1]))) {
      let numStr = ch;
      i++;
      let hasDot = (ch === '.');
      while (i < length && (/\d/.test(expression[i]) || (expression[i] === '.' && !hasDot))) {
        if (expression[i] === '.') hasDot = true;
        numStr += expression[i];
        i++;
      }
      // Check trailing %
      if (i < length && expression[i] === '%') {
        const val = parseFloat(numStr) / 100.0;
        tokens.push({ type: 'NUMBER', value: val });
        i++;
      } else {
        tokens.push({ type: 'NUMBER', value: parseFloat(numStr) });
      }
      continue;
    }

    // Parentheses
    if (ch === '(') {
      tokens.push({ type: 'LPAREN', value: '(' });
      i++;
      continue;
    }
    if (ch === ')') {
      tokens.push({ type: 'RPAREN', value: ')' });
      i++;
      continue;
    }

    // Operators (+, -, *, /, %)
    if (['+', '-', '*', '/', '%'].includes(ch)) {
      // Unary minus detection
      if (ch === '-') {
        const prevIsOp = tokens.length === 0 || ['OP', 'LPAREN'].includes(tokens[tokens.length - 1].type);
        if (prevIsOp) {
          tokens.push({ type: 'OP', value: 'UNARY_MINUS' });
          i++;
          continue;
        }
      }
      tokens.push({ type: 'OP', value: ch });
      i++;
      continue;
    }

    throw new Error(`Unexpected character '${ch}' in formula expression`);
  }

  return tokens;
}

/**
 * Converts token list to Reverse Polish Notation (RPN) using Shunting-Yard.
 */
export function toRPN(tokens) {
  const precedence = {
    UNARY_MINUS: 3,
    '*': 2,
    '/': 2,
    '%': 2,
    '+': 1,
    '-': 1
  };
  const rightAssociative = new Set(['UNARY_MINUS']);

  const outputQueue = [];
  const operatorStack = [];

  for (const token of tokens) {
    if (['NUMBER', 'CATEGORY_ID', 'CATEGORY_NAME'].includes(token.type)) {
      outputQueue.push(token);
    } else if (token.type === 'OP') {
      while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1].type === 'OP') {
        const topOp = operatorStack[operatorStack.length - 1].value;
        const pCurr = precedence[token.value] || 0;
        const pTop = precedence[topOp] || 0;
        if ((!rightAssociative.has(token.value) && pCurr <= pTop) || (rightAssociative.has(token.value) && pCurr < pTop)) {
          outputQueue.push(operatorStack.pop());
        } else {
          break;
        }
      }
      operatorStack.push(token);
    } else if (token.type === 'LPAREN') {
      operatorStack.push(token);
    } else if (token.type === 'RPAREN') {
      let foundLparen = false;
      while (operatorStack.length > 0) {
        const op = operatorStack.pop();
        if (op.type === 'LPAREN') {
          foundLparen = true;
          break;
        }
        outputQueue.push(op);
      }
      if (!foundLparen) {
        throw new Error("Mismatched parentheses: extra closing ')'");
      }
    }
  }

  while (operatorStack.length > 0) {
    const op = operatorStack.pop();
    if (['LPAREN', 'RPAREN'].includes(op.type)) {
      throw new Error("Mismatched parentheses: unclosed '(' in formula");
    }
    outputQueue.push(op);
  }

  return outputQueue;
}

/**
 * Evaluates an RPN token list with given category values map.
 */
export function evaluateRPN(rpnTokens, categoryValues = {}) {
  const stack = [];

  for (const token of rpnTokens) {
    if (token.type === 'NUMBER') {
      stack.push(Number(token.value));
    } else if (token.type === 'CATEGORY_ID') {
      const cid = token.value;
      const amt = categoryValues[cid] !== undefined ? categoryValues[cid] : categoryValues[String(cid)];
      stack.push(Number(amt || 0));
    } else if (token.type === 'CATEGORY_NAME') {
      const nameLower = String(token.value).trim().toLowerCase();
      const amt = categoryValues[nameLower] !== undefined ? categoryValues[nameLower] : categoryValues[token.value];
      stack.push(Number(amt || 0));
    } else if (token.type === 'OP') {
      if (token.value === 'UNARY_MINUS') {
        if (stack.length === 0) throw new Error("Syntax error: invalid unary minus");
        const a = stack.pop();
        stack.push(-a);
      } else {
        if (stack.length < 2) throw new Error(`Syntax error: missing operands for '${token.value}'`);
        const b = stack.pop();
        const a = stack.pop();
        switch (token.value) {
          case '+': stack.push(a + b); break;
          case '-': stack.push(a - b); break;
          case '*': stack.push(a * b); break;
          case '/':
            stack.push(b === 0 ? 0 : a / b);
            break;
          case '%':
            stack.push(b === 0 ? 0 : (a / b) * 100);
            break;
          default:
            stack.push(a + b);
        }
      }
    }
  }

  if (stack.length === 0) return 0;
  if (stack.length > 1) throw new Error("Syntax error: too many values without operators");

  const res = stack.pop();
  return isNaN(res) || !isFinite(res) ? 0 : Math.round(res * 100) / 100;
}

/**
 * Evaluates a formula expression or formula_definition object.
 */
export function evaluateFormula(expressionOrDef, categoryValues = {}) {
  if (!expressionOrDef) return 0;

  let expr = '';
  if (typeof expressionOrDef === 'object') {
    expr = expressionOrDef.id_expression || expressionOrDef.expression || '';
  } else if (typeof expressionOrDef === 'string') {
    expr = expressionOrDef;
  }

  if (!expr.trim()) return 0;

  try {
    const tokens = tokenize(expr);
    const rpn = toRPN(tokens);
    return evaluateRPN(rpn, categoryValues);
  } catch (err) {
    return 0;
  }
}

/**
 * Cycle Detection using Depth-First Search on directed dependency graph.
 */
export function detectCircularDependencies(allCategories = [], newCatId = null, newDependencyIds = []) {
  const graph = new Map();

  allCategories.forEach(cat => {
    if (!cat || cat.id === undefined) return;
    const cid = Number(cat.id);
    const cType = cat.category_type || 'DIRECT';
    const fDef = cat.formula_definition || {};
    const deps = new Set();
    if (cType === 'FORMULA' && fDef && Array.isArray(fDef.category_ids)) {
      fDef.category_ids.forEach(id => deps.add(Number(id)));
    }
    graph.set(cid, deps);
  });

  const targetId = newCatId !== null && newCatId !== undefined ? Number(newCatId) : -999;
  graph.set(targetId, new Set(newDependencyIds.map(Number)));

  // Self-reference check
  if (graph.get(targetId).has(targetId)) {
    return {
      hasCycle: true,
      message: "Formula cannot reference the category itself"
    };
  }

  const visited = new Set();
  const recStack = new Set();
  const cyclePath = [];

  function dfs(node, path) {
    visited.add(node);
    recStack.add(node);
    path.push(node);

    const neighbors = graph.get(node) || new Set();
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor, path)) return true;
      } else if (recStack.has(neighbor)) {
        const startIdx = path.indexOf(neighbor);
        cyclePath.push(...path.slice(startIdx), neighbor);
        return true;
      }
    }

    path.pop();
    recStack.remove ? recStack.remove(node) : recStack.delete(node);
    return false;
  }

  const catNameMap = new Map();
  allCategories.forEach(c => {
    if (c.id !== undefined) catNameMap.set(Number(c.id), c.name);
  });
  catNameMap.set(targetId, "New Category");

  for (const node of graph.keys()) {
    if (!visited.has(node)) {
      if (dfs(node, [])) {
        const cycleNames = cyclePath.map(id => catNameMap.get(id) || `Category #${id}`);
        return {
          hasCycle: true,
          message: `Circular Dependency: ${cycleNames.join(' → ')}`
        };
      }
    }
  }

  return { hasCycle: false, message: null };
}

/**
 * Complete Validation & Diagnostics for Formula Builder UI.
 */
export function validateFormula(expression, availableCategories = [], currentCategoryId = null, customSampleValues = {}) {
  if (!expression || !expression.trim()) {
    return {
      isValid: false,
      status: 'empty',
      message: 'Formula expression cannot be empty',
      normalizedExpr: '',
      idExpr: '',
      referencedCategories: [],
      previewSummary: '',
      sampleResult: 0
    };
  }

  const { normalizedExpr, idExpr, categoryIds, categoryNames } = normalizeExpression(expression, availableCategories);

  // 1. Check bracket balance
  const openBrackets = (normalizedExpr.match(/\[/g) || []).length;
  const closeBrackets = (normalizedExpr.match(/\]/g) || []).length;
  if (openBrackets !== closeBrackets) {
    return {
      isValid: false,
      status: 'invalid',
      message: openBrackets > closeBrackets ? "Missing closing bracket ']'" : "Extra closing bracket ']'",
      normalizedExpr,
      idExpr,
      referencedCategories: [],
      previewSummary: normalizedExpr,
      sampleResult: 0
    };
  }

  // 2. Check parentheses balance
  const openParen = (normalizedExpr.match(/\(/g) || []).length;
  const closeParen = (normalizedExpr.match(/\)/g) || []).length;
  if (openParen !== closeParen) {
    return {
      isValid: false,
      status: 'invalid',
      message: openParen > closeParen ? "Missing closing parenthesis ')'" : "Extra closing parenthesis ')'",
      normalizedExpr,
      idExpr,
      referencedCategories: [],
      previewSummary: normalizedExpr,
      sampleResult: 0
    };
  }

  // 3. Check for trailing operators
  const trimmed = normalizedExpr.trim();
  if (/[+\-*/%]$/.test(trimmed)) {
    return {
      isValid: false,
      status: 'invalid',
      message: `Formula cannot end with operator '${trimmed.slice(-1)}'`,
      normalizedExpr,
      idExpr,
      referencedCategories: [],
      previewSummary: normalizedExpr,
      sampleResult: 0
    };
  }

  // 4. Check for invalid consecutive operators
  const noSpaces = trimmed.replace(/\s+/g, '');
  const consecMatch = noSpaces.match(/[+\-*/]{2,}/);
  if (consecMatch && !/^[*/]-$/.test(consecMatch[0])) {
    return {
      isValid: false,
      status: 'invalid',
      message: `Invalid consecutive operators '${consecMatch[0]}'`,
      normalizedExpr,
      idExpr,
      referencedCategories: [],
      previewSummary: normalizedExpr,
      sampleResult: 0
    };
  }

  // 5. Verify all referenced category tokens exist
  const bracketMatches = normalizedExpr.match(/\[(.*?)\]/g) || [];
  const referencedCategories = [];
  const missingCategories = [];

  bracketMatches.forEach(tWithBrackets => {
    const cName = tWithBrackets.slice(1, -1).trim();
    const found = availableCategories.find(c => 
      c.name?.toLowerCase() === cName.toLowerCase() ||
      String(c.id) === cName.replace(/^CAT_ID:/i, '')
    );
    if (found) {
      if (!referencedCategories.some(rc => rc.id === found.id)) {
        referencedCategories.push(found);
      }
    } else {
      if (!missingCategories.includes(cName)) {
        missingCategories.push(cName);
      }
    }
  });

  if (missingCategories.length > 0) {
    return {
      isValid: false,
      status: 'missing_category',
      message: `Missing category: '${missingCategories.join(', ')}'`,
      normalizedExpr,
      idExpr,
      referencedCategories,
      previewSummary: normalizedExpr,
      sampleResult: 0
    };
  }

  if (referencedCategories.length === 0 && !/\d/.test(normalizedExpr)) {
    return {
      isValid: false,
      status: 'invalid',
      message: 'Formula must contain at least one category or number',
      normalizedExpr,
      idExpr,
      referencedCategories,
      previewSummary: normalizedExpr,
      sampleResult: 0
    };
  }

  // 6. Circular dependency check
  const cycleCheck = detectCircularDependencies(availableCategories, currentCategoryId, categoryIds);
  if (cycleCheck.hasCycle) {
    return {
      isValid: false,
      status: 'circular_dependency',
      message: cycleCheck.message,
      normalizedExpr,
      idExpr,
      referencedCategories,
      previewSummary: normalizedExpr,
      sampleResult: 0
    };
  }

  // 7. Test evaluation with sample values
  // Build preview summary: Food Material + Food Labour (without brackets)
  let previewSummary = normalizedExpr
    .replace(/\[/g, '')
    .replace(/\]/g, '')
    .replace(/\*/g, '×')
    .replace(/\//g, '÷');

  const testValues = {};
  referencedCategories.forEach((cat, idx) => {
    // Priority: customSampleValues -> cat.avg -> default fallback (100000, 50000, 25000...)
    const customVal = customSampleValues[cat.id] ?? customSampleValues[cat.name];
    if (customVal !== undefined && !isNaN(customVal)) {
      testValues[cat.id] = Number(customVal);
    } else if (cat.avg && cat.avg > 0) {
      testValues[cat.id] = Number(cat.avg);
    } else {
      testValues[cat.id] = idx === 0 ? 100000 : idx === 1 ? 50000 : 25000;
    }
  });

  try {
    const tokens = tokenize(idExpr);
    const rpn = toRPN(tokens);
    const sampleResult = evaluateRPN(rpn, testValues);

    return {
      isValid: true,
      status: 'valid',
      message: 'Valid Formula',
      normalizedExpr,
      idExpr,
      referencedCategories,
      previewSummary,
      sampleResult,
      sampleValues: testValues
    };
  } catch (err) {
    return {
      isValid: false,
      status: 'invalid',
      message: err.message || 'Syntax error in formula',
      normalizedExpr,
      idExpr,
      referencedCategories,
      previewSummary,
      sampleResult: 0
    };
  }
}
