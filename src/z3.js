//import './style.css'
import { init } from 'z3-solver';

//console.log(` > (x, y): (${x_val}, ${y_val})`);
  const { Context } = await init();
  const ctx = new Context("main");
  const { Solver, Int, Bool, And, Or, Not, Implies } = ctx;
  const solver = new Solver();

// Iterate to find multiple solutions
export async function getSolutions(solutions, area, map_size, constraint){
  const [left, right] = [area.left, area.right];
  const [top, bottom] = [area.top, area.bottom];
  const [width, height] = [map_size.width, map_size.height] 

  const [x, y] = [Int.const("x"), Int.const("y")];

  switch(constraint){
    case "on":
      solver.add( 
        Or(
          x.eq(left),     // x is on the left fence
          y.eq(top)       // y is on top fence
        ),
        And(
          x.ge(left), x.le(right),   // x is in this range
          y.ge(top), y.le(bottom),   // y is in this range
        )
      );
      break;
    case "inside":
      solver.add( 
        And(
          x.gt(left), x.lt(right),   // x is in this range
          y.gt(top), y.lt(bottom),   // y is in this range
        ) 
      );
      break;

    case "outside":
      solver.add( 
        And(  // x and y are within map bounds
          x.ge(0), y.ge(0),  
          x.le(width), y.le(height)
        ),                                
        Or(
          And(x.lt(right), Or(y.gt(bottom), y.lt(top))),  // x is in fence range, y is out of fence range
          And(y.lt(bottom), Or(x.gt(right), x.lt(left))), // vice-versa
          Or( // x and y are both out of fence range
            And(x.gt(right), y.gt(bottom)), 
            And(x.lt(left), y.lt(top)),
          )
        )
      );
      break;
    default:
      // error
      break;
  }
  let check = await solver.check();
  //console.log(check);

  const model = solver.model();

  let x_val = model.eval(x);
  let y_val = model.eval(y);

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

  solver.reset();
  return solutions;
}