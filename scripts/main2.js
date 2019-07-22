// module aliases
var Engine = Matter.Engine,
  Render = Matter.Render,
  World = Matter.World,
  Bodies = Matter.Bodies,
  Events = Matter.Events,
  Body = Matter.Body,
  Runner = Matter.Runner,
  Composite = Matter.Composite;

var runner = Runner.create();
// create an engine
var engine = Engine.create();

// create a renderer
var render = Render.create({
  element: document.body,
  engine: engine,
  options: {
    wireframes: false,
    width: window.innerWidth,
    height: window.innerHeight - 4
  }
});

//add the player
const playerRadius = 25;
var player = Bodies.circle(200, 700, playerRadius, {
  density: 0.001,
  friction: 0.7,
  frictionStatic: 0,
  frictionAir: 0,
  restitution: 0,
  ground: false,
  jumpCD: 0,
  collisionFilter: {
    category: 1,
    group: -1,
    mask: 1
  },
  render: {
    fillStyle: 'white'
  }
});

// params
var platformHeight = 40;
var platformGap = 250;
var keyMap = {};
let minPlatformWidth = 1500;
let maxPlatformWidth = 1750;

//game objects values
var game = {
  cycle: 0,
  width: 1200,
  height: 800
};

// create box and a ground
var x = 80;
var y = 0;
var ground = Bodies.rectangle(200, window.innerHeight, 2000, 60, {
  isStatic: true
});

//this sensor checks if the player is on the ground to enable jumping
var playerSensor = Bodies.rectangle(0, 0, playerRadius, 5, {
  isSensor: true,
  render: {
    visible: false
  },
  collisionFilter: {
    group: -1
  }
});

// add world and sensor to the world
World.add(engine.world, [ground, playerSensor]);

var platforms = Composite.create();
for (let i = 1; i < 4; i++) {
  Composite.add(
    platforms,
    Bodies.rectangle(
      getRandomInt(0, 500),
      window.innerHeight - i * platformGap,
      getRandomInt(minPlatformWidth, maxPlatformWidth),
      platformHeight,
      {
        isStatic: true,
        collisionFilter: {
          category: 1
        }
      }
    )
  );
}

const leftWall = Bodies.rectangle(-1800, 0, 2000, 3000, {
  isStatic: true
});

const rightWall = Bodies.rectangle(2200, 0, 2000, 3000, {
  isStatic: true
});

World.add(engine.world, [leftWall, rightWall]);
World.add(engine.world, platforms);
World.add(engine.world, player);

// run the engine
// Engine.run(engine);
// Alt:
Runner.run(runner, engine);

// run the renderer
Render.run(render);

function playerGroundCheck(event, ground) {
  // runs on collisions events
  var pairs = event.pairs;
  for (var i = 0, j = pairs.length; i != j; ++i) {
    var pair = pairs[i];
    if (pair.bodyA === playerSensor) {
      player.ground = ground;
    } else if (pair.bodyB === playerSensor) {
      player.ground = ground;
    }
  }
}

function playerJumpThroughPlatformCheck() {
  if (player.velocity.y < -3) {
    Composite.allBodies(platforms).map(p => (p.collisionFilter.category = 2));
  } else {
    Composite.allBodies(platforms).map(p => (p.collisionFilter.category = 1));
  }
}

// generation props
let prevG = -1;
let level = 10;
let newPlatform;
let color = null;
let friction = 0.3;
let restitution = 0.3;
let minX = -150;
let maxX = 500;

function generatePlatforms() {
  const y = Math.floor((player.position.y - window.innerHeight) / platformGap);

  if (y != prevG && y < prevG) {
    if (-y + 4 === level) {
      level += 10;
      color = getRandomColor();
      friction = getRandomArbitrary(0.1, 1);
      restitution = getRandomArbitrary(0.1, 0.5);
      minPlatformWidth /= 1.1;
      maxPlatformWidth /= 1.2;
      if (minX < 300) {
        minX -= 10;
        maxX += 10;
      }
    }

    newPlatform = Bodies.rectangle(
      getRandomInt(minX, maxX),
      window.innerHeight + (y - 2) * platformGap,
      getRandomInt(minPlatformWidth, maxPlatformWidth),
      platformHeight,
      {
        isStatic: true,
        collisionFilter: {
          category: 1
        },
        render: {
          fillStyle: color
        }
      }
    );

    newPlatform.friction = friction;
    newPlatform.restitution = restitution;
    prevG = y;
    Composite.add(platforms, newPlatform);

    console.log('Score: ', -y);
  }
}

let prevR = -1;
function removeBelowPlatforms() {
  const y = Math.floor((player.position.y - window.innerHeight) / platformGap);
  if (y <= -5 && y != prevR) {
    prevR = y;
    const lastPlatform = Composite.allBodies(platforms)[0];
    if (lastPlatform) Composite.remove(platforms, lastPlatform);
  }
}

function checkGameOver() {
  if (player.velocity.y > 21) {
    Body.set(player, 'isStatic', true);
    player.velocity.y = 0;
    World.clear(engine.world, false);
    console.log('Game Over');
  }
}

function wallsFollow() {
  Body.setPosition(leftWall, { x: leftWall.position.x, y: player.position.y });
  Body.setPosition(rightWall, {
    x: rightWall.position.x,
    y: player.position.y
  });
}

function wallCollision(e) {
  var pairs = e.pairs;
  for (var i = 0, j = pairs.length; i != j; ++i) {
    var pair = pairs[i];
    if (pair.bodyA === leftWall || pair.bodyB === leftWall) {
      Body.setVelocity(player, { x: 10, y: -15 });
      player.force = { x: -player.force.x, y: -20 };
    } else if (pair.bodyA === rightWall || pair.bodyB === rightWall) {
      Body.setVelocity(player, { x: -10, y: -15 });
      player.force = { x: -player.force.x, y: -20 };
    }
  }
}

Events.on(engine, 'beforeTick', function(event) {
  game.cycle++;

  generatePlatforms();
  removeBelowPlatforms();
  checkGameOver();
  wallsFollow();

  //jump
  if (keyMap[32] && player.ground && player.jumpCD < game.cycle) {
    player.jumpCD = game.cycle + 30; //adds a cooldown to jump
    player.force = {
      x: 0,
      y: -0.09
    };
  }

  //spin left and right
  const spin = 0.1;
  const limit = 0.3;
  if (keyMap[65] && player.angularVelocity > -limit) {
    player.torque = -spin;
    if (player.velocity.y < -0.5) {
      // controls in air
      player.force = { x: -0.004, y: 0 };
    }
  } else {
    if (keyMap[68] && player.angularVelocity < limit) {
      player.torque = spin;
      if (player.velocity.y < -0.5) {
        // controls in air
        player.force = { x: 0.004, y: 0 };
      }
    }
  }

  Render.lookAt(render, player, {
    x: window.innerWidth,
    y: window.innerHeight
  });

  playerJumpThroughPlatformCheck();
});

Events.on(engine, 'afterTick', function(event) {
  //set sensor velocity to zero so it collides properly
  Body.setVelocity(playerSensor, {
    x: 0,
    y: 0
  });
  //move sensor to below the player
  Body.setPosition(playerSensor, {
    x: player.position.x,
    y: player.position.y + playerRadius
  });
});

//at the start of a colision for player
Events.on(engine, 'collisionStart', function(event) {
  playerGroundCheck(event, true);
  wallCollision(event);
});

//ongoing checks for collisions for player
Events.on(engine, 'collisionActive', function(event) {
  playerGroundCheck(event, true);
});

//at the end of a colision for player set ground to false
Events.on(engine, 'collisionEnd', function(event) {
  playerGroundCheck(event, false);
});

window.addEventListener('keydown', function(e) {
  keyMap[e.keyCode] = true;
});

window.addEventListener('keyup', function(e) {
  keyMap[e.keyCode] = false;
});

// helpers
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
}

function getRandomColor() {
  let letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}
