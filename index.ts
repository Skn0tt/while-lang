import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { interpret, parse, Memory } from "./while-lang";

// based on "formula" preset from https://microsoft.github.io/monaco-editor/monarch.html
const syntaxHighlighting: monaco.languages.IMonarchLanguage = {
  keywords: ["WHILE", "DO", "END"],

  operators: [":=", "+", "-"],

  // operators
  symbols: /([\.]{2})|([=><!:\|\+\-\*\/%,;]+)/,

  // escape sequences
  escapes:
    /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,

  tokenizer: {
    root: [
      { include: "@whitespace" },

      [
        /[a-zA-Z_][\w_]*('*)/,
        {
          cases: {
            "@keywords": "keyword",
            "@default": "identifier",
          },
        },
      ],

      // delimiters
      [/[\{\}\(\)\[\]]/, "@brackets"],
      [/`/, { token: "delimiter.quote", next: "@quotation", bracket: "@open" }],
      [/\./, "delimiter"],

      // numbers
      [/[\-\+]?\d+\/[\-\+]?\d*[1-9]/, "string"],
      [/[\-\+]?\d+(\.\d+)?/, "string"],
      [
        /@symbols/,
        { cases: { "@operators": "keyword", "@default": "symbols" } },
      ],

      // strings
      [/"([^"\\]|\\.)*$/, "string.invalid"], // non-teminated string
      [/"/, "string", "@string"],
    ],

    unquote: [{ include: "@root" }, [/\$/, "predefined.identifier", "@pop"]],

    quotation: [
      [/[^`\$]/, "metatag"],
      [/`/, { token: "delimiter.quote", bracket: "@close", next: "@pop" }],
      [/\$/, "predefined.identifier", "@unquote"],
    ],

    whitespace: [
      [/[ \t\r\n]+/, "white"],
      [/\/\*/, "comment", "@comment"],
      [/\/\/.*$/, "comment"],
    ],

    comment: [
      [/[^\/*]+/, "comment"],
      [/\/\*/, "comment", "@push"], // nested comments
      [/\/\*/, "comment.invalid"],
      ["\\*/", "comment", "@pop"],
      [/[\/*]/, "comment"],
    ],

    string: [
      [/[^"]+/, "string"],
      // [/@escapes/, 'string.escape'],
      // [/\\./,      'string.escape.invalid'],
      [/"/, "string", "@pop"],
    ],
  },
};

monaco.languages.register({
  id: "WHILE",
});
monaco.languages.setMonarchTokensProvider("WHILE", syntaxHighlighting);

self.MonacoEnvironment = {
  getWorkerUrl: function (moduleId, label) {
    if (label === "typescript" || label === "javascript") {
      return "./ts.worker.js";
    }
    return "./editor.worker.js";
  },
};

const defaultProgram = `
x0 := x0 + 1;
WHILE x0 != 0 DO
  x1 := x1 + 1;
END
`.trim();

const editor = monaco.editor.create(document.getElementById("editor")!, {
  value: defaultProgram,
  language: "WHILE",
});

const parsingErrorsEl = document.getElementById(
  "parsing-errors"
) as HTMLSpanElement;

editor.getModel()?.onDidChangeContent(() => {
  const code = editor.getModel()?.getValue() ?? "";
  const { errs } = parse(code);
  parsingErrorsEl.innerText = errs.map((e) => e.toString()).join("\n");
});

const inputsEl = document.getElementById("inputs") as HTMLInputElement;
const memoryEl = document.getElementById("memory") as HTMLParagraphElement;

function getInputs(): number[] {
  return inputsEl.value.split(",").map((x) => parseInt(x));
}

const waitForStep = (memory: Memory) => {
  memoryEl.innerText = memory.toString();
  return new Promise<void>((resolve) => {
    document.getElementById("step")!.onclick = () => resolve();
  });
};

async function execute(debug: boolean) {
  const code = editor.getModel()?.getValue() ?? "";
  const { ast, errs } = parse(code);
  if (errs.length > 0 || !ast) {
    window.alert("There are syntax errors in your program");
    return;
  }

  const result = await interpret(ast, getInputs(), debug ? waitForStep : undefined);
  memoryEl.innerText = "Result: " + result;
}

document.getElementById("run")!.onclick = () => {
  execute(false);
};

document.getElementById("debug")!.onclick = () => {
  execute(true);
};
