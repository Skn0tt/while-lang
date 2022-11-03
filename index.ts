import { parse } from "./while-lang.generated"

const program = `x0 := x0 + 1`

const result = parse(program)
console.log(result)
