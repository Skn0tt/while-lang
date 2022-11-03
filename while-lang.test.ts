import { describe, test } from "vitest";
import { interpret, parse } from "./while-lang";

interface Case {
  program: string;
  expectedOutput?: any;
  testComputations?: { input: number[]; output: number }[];
}

const cases: Record<string, Case> = {
  "add one": {
    program: "x0 := x1 + 1",
    testComputations: [
      { input: [1], output: 2 },
      { input: [0], output: 1 },
    ],
  },
  "add one with spaces": {
    program: `
      x0 := x0 + 1
    `,
  },
  concatenation: {
    program: `
      x0 := x0 + 1 ; x0 := x0 + 1
    `,
    expectedOutput: {
      kind: "Concatenation",
      first: {
        kind: "Addition",
        left: { kind: "Variable", i: 0, _i: "0" },
        right: { kind: "Variable", i: 0, _i: "0" },
        c: { kind: "Constant", value: 1, _value: "1" },
      },
      second: {
        kind: "Addition",
        left: { kind: "Variable", i: 0, _i: "0" },
        right: { kind: "Variable", i: 0, _i: "0" },
        c: { kind: "Constant", value: 1, _value: "1" },
      },
    },
    testComputations: [
      {
        input: [1],
        output: 2,
      },
      {
        input: [2],
        output: 2,
      },
    ],
  },
  "something containing while": {
    program: `
      x0 := x0 + 1;
      WHILE x0 != 0 DO
        x0 := x0 - 1 ;
        x1 := x1 + 1
      END;
      x0 := x1 + 0
    `,
    expectedOutput: {
      kind: "Concatenation",
      first: {
        kind: "Addition",
        left: {
          kind: "Variable",
          i: 0,
          _i: "0",
        },
        right: {
          kind: "Variable",
          i: 0,
          _i: "0",
        },
        c: {
          kind: "Constant",
          value: 1,
          _value: "1",
        },
      },
      second: {
        kind: "Concatenation",
        first: {
          kind: "While",
          v: {
            kind: "Variable",
            i: 0,
            _i: "0",
          },
          body: {
            kind: "Concatenation",
            first: {
              kind: "Subtraction",
              left: {
                kind: "Variable",
                i: 0,
                _i: "0",
              },
              right: {
                kind: "Variable",
                i: 0,
                _i: "0",
              },
              c: {
                kind: "Constant",
                value: 1,
                _value: "1",
              },
            },
            second: {
              kind: "Addition",
              left: {
                kind: "Variable",

                i: 1,
                _i: "1",
              },
              right: {
                kind: "Variable",
                i: 1,
                _i: "1",
              },
              c: {
                kind: "Constant",
                value: 1,
                _value: "1",
              },
            },
          },
        },
        second: {
          kind: "Addition",
          left: {
            kind: "Variable",
            i: 0,
            _i: "0",
          },
          right: {
            kind: "Variable",
            i: 1,
            _i: "1",
          },
          c: {
            kind: "Constant",
            value: 0,
            _value: "0",
          },
        },
      },
    },
  },
  subtract: {
    program: `
      x0 := x0 + 0;
      WHILE x2 != 0 DO
        x2 := x2 - 1;
        x1 := x1 - 1
      END;
      x0 := x1 + 0
    `,
    testComputations: [
      {
        input: [4, 2],
        output: 2,
      },
    ],
  },
};

for (const [
  name,
  { program, expectedOutput, testComputations },
] of Object.entries(cases)) {
  if (name != "subtract") continue;
  describe(name, () => {
    test("parser", (t) => {
      const { errs, ast } = parse(program);
      t.expect(errs).toHaveLength(0);

      if (expectedOutput) {
        t.expect(JSON.parse(JSON.stringify(ast))).toEqual(expectedOutput);
      }
    });

    describe("computations", () => {
      testComputations?.forEach(({ input, output }, i) => {
        test(`#${i}`, (t) => {
          t.expect(interpret(parse(program).ast!, input)).toEqual(output);
        });
      });
    });
  });
}
