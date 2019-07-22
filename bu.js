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
    width: window.innerWidth - 1,
    height: window.innerHeight - 4,
    showAngleIndicator: false
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
    group: 1,
    mask: 1
  },
  render: {
    strokeStyle: 'black',
    fillStyle: 'lightgrey'
  }
});
player.collisionFilter.group = -1;

// params
var platformHeight = 40;
var platformGap = 250;
var keyMap = {};

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

//this sensor check if the player is on the ground to enable jumping
var playerSensor = Bodies.rectangle(0, 0, playerRadius, 5, {
  isSensor: true,
  render: {
    visible: false
  }
  //isStatic: true,
});
playerSensor.collisionFilter.group = -1;

var x = Bodies.circle(500, 750, 100, { isStatic: true });

// add all of the bodies to the world
World.add(engine.world, [ground, playerSensor]);

var platforms = [];
for (let i = 1; i < 4; i++) {
  platforms.push(
    Bodies.rectangle(
      getRandomInt(0, 500),
      window.innerHeight - i * platformGap,
      getRandomInt(100, 1750),
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

World.add(engine.world, [
  Bodies.rectangle(1200, 0, platformHeight, 250000, {
    isStatic: true
  }),
  Bodies.rectangle(-800, 0, platformHeight, 250000, {
    isStatic: true
  })
]);
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
    platforms.map(p => (p.collisionFilter.category = 2));
  } else {
    platforms.map(p => (p.collisionFilter.category = 1));
  }
}

let prevG = -1;
function generatePlatforms() {
  const x = Math.floor((player.position.y - window.innerHeight) / platformGap);
  if (x != prevG && x < prevG) {
    prevG = x;
    platforms.push(
      Bodies.rectangle(
        getRandomInt(0, 500),
        window.innerHeight + (x - 2) * platformGap,
        getRandomInt(100, 1750),
        platformHeight,
        {
          isStatic: true,
          collisionFilter: {
            category: 1
          }
        }
      )
    );

    World.add(engine.world, platforms);
  }
}

let prevR = -1;
function removeBelowPlatforms() {
  const x = Math.floor((player.position.y - window.innerHeight) / platformGap);
  if (x <= -5 && x != prevR) {
    prevR = x;
  }
}

Events.on(engine, 'beforeTick', function(event) {
  game.cycle++;

  generatePlatforms();
  removeBelowPlatforms();

  //jump
  if (keyMap[32] && player.ground && player.jumpCD < game.cycle) {
    player.jumpCD = game.cycle + 30; //adds a cooldown to jump
    player.force = {
      x: 0,
      y: -0.1
    };
  }

  //spin left and right
  const spin = 0.1;
  const limit = 0.3;
  if (keyMap[65] && player.angularVelocity > -limit) {
    player.torque = -spin;
    if (player.velocity.y < -0.5) player.force = { x: -0.003, y: 0 };
  } else {
    if (keyMap[68] && player.angularVelocity < limit) {
      player.torque = spin;
      if (player.velocity.y < -0.5) player.force = { x: 0.003, y: 0 };
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
