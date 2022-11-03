import { test } from "vitest"
import { parse } from "./while-lang.generated"



test("while-lang parser", (t) => {
  t.expect(parse("x0 := x0 + 1").errs).toHaveLength(0)
  t.expect(parse(`
    x0 := x0 + 1
  `).errs).toHaveLength(0)
  t.expect(parse(`
    x0 := x0 + 1
    WHILE x0 != 0 DO
      x0 := x0 - 1
      x1 := x1 + 1
    END
    x0 := x1 + 0
  `).errs).toHaveLength(0)
})