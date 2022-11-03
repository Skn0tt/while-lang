import { parse as generatedParse } from "./while-lang.generated"

export function parse(program: string) {
  return generatedParse(program.trim())
}