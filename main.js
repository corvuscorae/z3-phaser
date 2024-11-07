import './style.css'
import { init } from 'z3-solver';

async function main() {
    const { Context } = await init();
    const { Solver, Int, And, Or, Distinct } = new Context("main");
    const solver = new Solver();

    const x = Int.const('x');  // x is a Z3 integer

    solver.add(And(x.le(10), x.ge(9)));  // x <= 10, x >=9

    // Run Z3 solver, find solution and sat/unsat
    console.log(await solver.check());

    // Extract value for x
    const model = solver.model();
    const xVal = model.eval(x);
    console.log(`${xVal}`);

    document.querySelector('#app').innerHTML = `
    <div>
      <p>Check the console</p>
      <p>I guess I could've just put the results here too...</p>
    </div>
  `;
}

main();