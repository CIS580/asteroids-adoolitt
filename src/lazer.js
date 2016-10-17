"use strict";

const MS_PER_FRAME = 1000/8;

/**
 * @module exports the Player class
 */
module.exports = exports = Lazer;

/**
 * @constructor Player
 * Creates a new player object
 * @param {Postition} position object specifying an x and y
 */
function Lazer(position, canvas, velocity, angle) {
  this.worldWidth = canvas.width;
  this.worldHeight = canvas.height;
  this.spritesheet  = new Image();
  this.spritesheet.src = encodeURI('assets/lazer.png');
  this.position = {
    x: position.x,
    y: position.y
  };
  this.velocity = {
    x: velocity.x,
    y: velocity.y
  }
  this.angle = angle;
  this.height = 30;
  this.width = 30;
}
/**
 * @function updates the player object
 * {DOMHighResTimeStamp} time the elapsed time since the last frame
 */
Lazer.prototype.update = function(time) {

  var acceleration = {
    x: Math.sin(this.angle),
    y: Math.cos(this.angle)
  }
  this.velocity.x -= acceleration.x;
  this.velocity.y -= acceleration.y;
  // Apply velocity
  this.position.x += this.velocity.x;
  this.position.y += this.velocity.y;
}

/**
 * @function renders the player into the provided context
 * {DOMHighResTimeStamp} time the elapsed time since the last frame
 * {CanvasRenderingContext2D} ctx the context to render into
 */
Lazer.prototype.render = function(time, ctx) {
  //ctx.save();
  //ctx.translate(this.position.x, this.position.y);
  //ctx.rotate(-this.angle);
  ctx.drawImage(
        // image
        this.spritesheet,
        // source rectangle
        0, 0, this.width, this.height,
        // destination rectangle
        this.position.x, this.position.y, this.width, this.height
      );
  //ctx.restore();
  }
