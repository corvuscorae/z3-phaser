//import './style.css'
import { init } from 'z3-solver';

const { Context } = await init();
const { Solver, Int, And, Or, Distinct } = new Context("main");
const solver = new Solver();

const x = Int.const('x');  // x is a Z3 integer

solver.add(And(x.le(10), x.ge(9)));  // x <= 10, x >=9

// Run Z3 solver, find solution and sat/unsat
let check = await solver.check();

// Extract value for x
const model = solver.model();
const xVal = model.eval(x);

//document.querySelector('#app').innerHTML = `
//  <div>
//    <p>${check}</p>
//    <p>${xVal}</p>
//  </div>
//`