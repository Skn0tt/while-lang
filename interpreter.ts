import { Program, ASTKinds } from "./while-lang.generated";

class Stack<T> {
  private data: T[] = [];

  push(value: T) {
    this.data.push(value);
  }

  pop(): T | undefined {
    return this.data.pop();
  }

  isEmpty(): boolean {
    return this.data.length === 0;
  }
}

class Memory {
  private data: Record<number, number> = {};

  constructor(input: number[]) {
    input.forEach((value, index) => {
      this.data[index + 1] = value;
    });
  }

  read(address: number): number {
    return this.data[address] ?? 0;
  }
  write(address: number, value: number) {
    if (value < 0) {
      value = 0;
    }
    this.data[address] = value;
  }
}

export function interpret(program: Program, input: number[]) {
  const callstack = new Stack<Program>();
  const memory = new Memory(input);

  callstack.push(program);

  while (!callstack.isEmpty()) {
    const current = callstack.pop()!;

    switch (current.kind) {
      case ASTKinds.Addition: {
        memory.write(
          current.left.i,
          memory.read(current.right.i) + current.c.value
        );
        break;
      }
      case ASTKinds.Subtraction: {
        memory.write(
          current.left.i,
          memory.read(current.right.i) - current.c.value
        );
        break;
      }
      case ASTKinds.Concatenation: {
        callstack.push(current.second);
        callstack.push(current.first);
        break;
      }
      case ASTKinds.While: {
        if (memory.read(current.v.i) !== 0) {
          callstack.push(current);
          callstack.push(current.body);
        }
        break;
      }
      default:
        throw new Error("Unexpected AST node");
    }
  }

  return memory.read(0);
}
