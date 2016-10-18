"use strict;"

/* Classes */
const Game = require('./game.js');
const Player = require('./player.js');
const Astroid = require('./astroid.js');
const Lazer = require('./lazer.js');
const Vector = require('./vector');
/* Global variables */
var canvas = document.getElementById('screen');
var game = new Game(canvas, update, render);
var player = new Player({x: canvas.width/2, y: canvas.height/2}, canvas);
var listOfAsterods = [];
var ListsOfLazers = []
var hasFired = false;
var lives = 3;
var score = 0;
var level = 1;
var maxAsteroids = 10;
var count = 0;
console.log(maxAsteroids);
for(var i = 0 ; i < maxAsteroids; i++)
{
  var mass = Math.floor(Math.random() * 100 + 50);
  var ang = Math.floor(Math.random() * 100 + 1);
  console.log("We made it");
  listOfAsterods.push(new Astroid({x: 100  * i, y:100 * i}, canvas, mass, ang, 64, 64,'assets/big_astroid.png'));
}

listOfAsterods.forEach(function(astroid){
  astroid.setAngularVelocity();
});

listOfAsterods.sort(function(a,b){return a.position.x - b.position.x});

var firedLazer = new Audio('assets/firedLazer.wav');
var explosion = new Audio('assets/Explosion.wav');
var asteroidCollsion = new Audio('assets/asteroidCollision.wav');
/**
 * @function masterLoop
 * Advances the game in sync with the refresh rate of the screen
 * @param {DOMHighResTimeStamp} timestamp the current time
 */
var masterLoop = function(timestamp) {
  game.loop(timestamp);
  window.requestAnimationFrame(masterLoop);
}
masterLoop(performance.now());


/**
 * @function update
 * Updates the game state, moving
 * game objects and handling interactions
 * between them.
 * @param {DOMHighResTimeStamp} elapsedTime indicates
 * the number of milliseconds passed since the last frame.
 */
function update(elapsedTime)
{
  player.update(elapsedTime);
  // TODO: Update the game objects
  listOfAsterods.sort(function(a,b){return a.position.x - b.position.x});
  console.log(player.fired);
  if(player.fired)
  {
    console.log("Should fire.")
    hasFired = true;
  }
  if(hasFired == true && player.state != "dead")
   {
     console.log("We have fired")
        ListsOfLazers.push(new Lazer(
          {
            x:player.position.x,
            y:player.position.y
          },
          canvas, player.velocity, player.angle
        ));
        firedLazer.play();
        hasFired = false;
  }
  //check for asteroid collisions
  asteroidCollission();
  if(player.state != "dead") {
    playerCollision();
  }
  lazerCollsion();
  listOfAsterods.forEach(function(asteroid){asteroid.update();});
  ListsOfLazers.forEach(function(lazer){lazer.update();});
}

function asteroidCollission ()
{
  var active = [];
  var potentiallyColliding = [];

  // For each ball in the axis list, we consider it
  // in order
  listOfAsterods.forEach(function(astroid, aindex){
    active = active.filter(function(newAstroid){
      return astroid.position.x - newAstroid.position.x  < (astroid.radius + newAstroid.raduis);
    });

    active.forEach(function(newAstroid, bindex){
      potentiallyColliding.push({a: newAstroid, b: astroid});
    });
    active.push(astroid);
});

  var collisions = [];
  potentiallyColliding.forEach(function(pair){
    var distSquared =
      Math.pow(pair.a.position.x - pair.b.position.x, 2) +
      Math.pow(pair.a.position.y - pair.b.position.y, 2);
    // (15 + 15)^2 = 900 -> sum of two balls' raidius squared
    var sumRadiusSqueared = (pair.a.radius + pair.b.raidus) * (pair.a.radius + pair.b.raidus);
    console.log(sumRadiusSqueared);
    if(distSquared < sumRadiusSqueared) {
      // Color the collision pair for visual debugging
      pair.a.color = 'red';
      pair.b.color = 'green';
      // Push the colliding pair into our collisions array
      collisions.push(pair);
    }
  });

  // TODO: Process ball collisions
  collisions.forEach(function(pair){
    var collisionNormal = {
      x: pair.a.position.x - pair.b.position.x,
      y: pair.a.position.y - pair.b.position.y
    }
    var totalRadius = pair.a.radius + pair.b.radius;
    var overlap = totalRadius + 6 - Vector.magnitude(collisionNormal);
    var collisionNormal = Vector.normalize(collisionNormal);
    pair.a.position.x += collisionNormal.x * overlap / 2;
    pair.a.position.y += collisionNormal.y * overlap / 2;
    pair.b.position.x -= collisionNormal.x * overlap / 2;
    pair.b.position.y -= collisionNormal.y * overlap / 2;

    var angle = Math.atan2(collisionNormal.y, collisionNormal.x);
    var a = Vector.rotate(pair.a.velocity, angle);
    var b = Vector.rotate(pair.b.velocity, angle);

    //V1 = U1(m1-m2)/(m1 + m2) + U2 (2m2)/m1 + m2
    //v2 = U2(m2-m1)/(m2 + m1) + U1 (2m1)/m2 + m1
    var aPrevious = a.x;
    var bPrevious = b.x;

    a.x = (aPrevious * (pair.a.mass - pair.b.mass) + 2 * pair.b.mass * bPrevious)/(pair.a.mass + pair.b.mass);
    b.x = (bPrevious * (pair.b.mass - pair.a.mass) + 2 * pair.a.mass * aPrevious)/(pair.a.mass + pair.b.mass);

    a = Vector.rotate(a, -angle);
    b = Vector.rotate(b, -angle);

    pair.a.velocity.x = a.x;
    pair.a.velocity.y = a.y;
    pair.b.velocity.x = b.x;
    pair.b.velocity.y = b.y;

    asteroidCollision.play()
  });
}

//check to see if player hit an asteroid
function playerCollision()
{
  for(var i=0; i < listOfAsterods.length; i++)
  {
    var distSquared =
    Math.pow(player.position.x - listOfAsterods[i].position.x, 2) +
    Math.pow(player.position.y - listOfAsterods[i].position.y, 2);
    if(distSquared < Math.pow(10+listOfAsterods[i].radius, 2))
    {
      player.state = "dead";
      explosion.play();
    }
  }
}

function lazerCollsion(){
  for(var i = 0; i < listOfAsterods.length; i++){
    for(var j = 0; j < ListsOfLazers.length; j++){
      var distSquared =
        Math.pow((ListsOfLazers[j].position.x) - (listOfAsterods[i].position.x + listOfAsterods[i].radius), 2) +
        Math.pow((ListsOfLazers[j].position.y) - (listOfAsterods[i].position.y + listOfAsterods[i].radius), 2);

      if(distSquared < Math.pow(listOfAsterods[i].radius, 2))
      {
        // Laser struck asteroid
        if(listOfAsterods[i].width > 5){
          var angle = Math.atan(listOfAsterods[i].velocity.y/listOfAsterods[i].velocity.x);
          var velocity1 = {x: Math.cos(angle + Math.PI/4)*1.5, y: Math.sin(angle + Math.PI/4)*1.5};
          var velocity2 = {x: Math.cos(angle - Math.PI/4)*1.5, y: Math.sin(angle - Math.PI/4)*1.5};

          var asteroid1 = new Astroid(
            {
              x:listOfAsterods[i].x,
              y:listOfAsterods[i].y
            },
            canvas, 32, 32, 'assets/broken_asteriod.png'
          );
          asteroid1.setVelocity(velocity1);
          asteroid1.mass = listOfAsterods[i].mass/2;
          listOfAsterods.push(asteroid1);

          var asteroid2 =  new Astroid(
            {
              x:listOfAsterods[i].x,
              y:listOfAsterods[i].y
            },
            canvas, 32, 32, 'assets/broken_asteriod.png'
          );
          asteroid2.setVelocity(velocity2);
          asteroid2.mass = listOfAsterods[i].mass/2;
          listOfAsterods.push(asteroid2);
        }
        console.log(listOfAsterods.length);
        if(listOfAsterods.length == 1)
        {
          listOfAsterods.splice(i,1);
          level++;
          maxAsteroids++;
          for(i=0; i < maxAsteroids; i++)
           {
              var newMass = Math.floor(Math.random() * 100 + 50);
              var newAng = Math.floor(Math.random() * 100 + 1);
             listOfAsterods.push(new Asteroid(
               {
                   x:Math.floor(Math.random() * canvas.width),
                   y:Math.floor(Math.random() * canvas.height)
              },
                 canvas,newMass, newAng, 65,65, 'assets/big_astroid.png'
            ));
        }
      }
      else
      {
        asteroids.splice(i,1);
      }
      score += 10;
      break;
      }
    }
  }
}
/**
  * @function render
  * Renders the current game state into a back buffer.
  * @param {DOMHighResTimeStamp} elapsedTime indicates
  * the number of milliseconds passed since the last frame.
  * @param {CanvasRenderingContext2D} ctx the context to render to
  */
function render(elapsedTime, ctx) {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  player.render(elapsedTime, ctx);
  listOfAsterods.forEach(function(asteroid){asteroid.render(elapsedTime, ctx);});
  if(ListsOfLazers != undefined)
  {
    ListsOfLazers.forEach(function(lazer){lazer.render(elapsedTime, ctx);});
  }

  if(player.state == "dead")
   {
    if(count == 0)
     {
      time = elapsedTime;
      count++;
      lives--;
    }
    else
    {
      time+= elapsedTime;
      if(time > 1000)
      {
        time = 0;
        count = 0;
        player.state = "idle";
      }
    }
  }
  ctx.fillStyle = "white";
  ctx.fillText("Score:" + score, canvas.width - 80, 10);
  ctx.fillText("Level:" + level, 10, 10);
  ctx.fillText("Lives:" + lives, canvas.width / 2, 10);
}
