//import './style.css'
import { init } from 'z3-solver';

const { Context } = await init();
const ctx = new Context("main");
const { Solver, Int, Bool, And, Or, Not, Implies } = ctx;
const solver = new Solver();

// Create Boolean variables
//const A = Bool.const('A');
//const B = Bool.const('B');
//const C = Bool.const('C');

// Add constraints
//solver.add(Or(A, B));                  // A or B must be true
//solver.add(Implies(A, C));             // If A is true, C must also be true
//solver.add(Not(And(B, C)));            // B and C cannot both be true

const [left, right] = [5, 10];
const [top, bottom] = [15, 25];

const [x, y] = [Int.const("x"), Int.const("y")];

solver.add( 
  And(
    x.ge(left), x.le(right),   // x is in this range
  ),
  And(
    y.ge(top), y.le(bottom),   // y is in this range
  ) 
);

let inside_fence_check = solver.check();
console.log(await inside_fence_check);

const inside_fence_model = solver.model();

let x_val = inside_fence_model.eval(x);
let y_val = inside_fence_model.eval(y);

console.log(` > (x, y): (${x_val}, ${y_val})`);

// Iterate to find multiple solutions
export async function getSolutions(solutions){
  while (await solver.check() === 'sat') {
    const model = solver.model();
    const solution = {
      x: model.eval(x).toString(),
      y: model.eval(y).toString(),
    };

    solutions.push(solution);

    // Add constraint to exclude the current solution
    solver.add(Or(
      x.neq(model.eval(x)),
      y.neq(model.eval(y)),
    ));
  }

  return solutions;
}