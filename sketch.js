let player;
let img; 
let img2;
let pressedKeys = {};
let platforms = [];
let redPlatforms = [];
let cameraY = 0;
let mic;
let gameOver = false;
let showInstructions = false;
let bgImg;



function preload() {
  img = loadImage("SquidIdle1.png");
  myFont = loadFont('Minecraft.ttf')
  bgImg = loadImage("Doodle Background.png"); // ← replace later
}

function setup() {
  let zero2 = createCanvas(windowWidth, windowHeight);
  imageMode(CENTER);

  player = new Player(width / 2, height, img);
  platforms.push(new GreenPlatform(player.x, player.y + 40));


  // Additional starting platforms
  for (let i = 0; i < 8; i++) {
    let px = random(100, width - 200);
    let py = height - i * 150;
    platforms.push(new GreenPlatform(px, py));
  }

  zero2.mousePressed(userStartAudio);
  mic = new p5.AudioIn();
  mic.start();
  textAlign(CENTER);
  textFont(myFont)
  fill(125);
  textSize(32);
}

function draw() {
  background(220);
  if (bgImg) {
    image(bgImg, width / 2, height / 2, width, height);
  }

  if(keyIsPressed === false){
    text("Press '?' for instructions", width/2, height/2);
  }

  if (showInstructions) {
  drawInstructions();
  return; 
}

  if (gameOver) {
    GO();
    return;
  }

  micLevel = mic.getLevel();

  push();
  translate(0, -cameraY);

  spawnPlatforms();

  // Draw green platforms
  for (let p of platforms) p.draw();

  // Update/draw moving red platforms
  for (let rp of redPlatforms) {
    rp.update();
    rp.draw();
  }

  player.update();
  player.draw();

  pop();

  if (player.y - cameraY > height + 100){
    gameOver = true;
  }
}

function keyPressed() {
  pressedKeys[keyCode] = true;
}

function keyReleased() {
  delete pressedKeys[keyCode];
}

class Player {
  constructor(x, y, img) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.img = img;
    this.facing = 1;
    this.speed = 10;
    this.jumpPower = -20;
    this.gravity = 0.5;
  }

  update() {
    this.handleMovementKeys();
    this.applyGravity();
    this.checkPlatformCollision(platforms);
    this.checkPlatformCollision(redPlatforms); // ← treat red the same
    this.constrainToScreen();

    // Camera follow
    if (this.y - cameraY < height * 0.4) {
      cameraY = this.y - height * 0.4;
    }
  }

  handleMovementKeys() {
    let mvmt = 0;

    if (keyIsDown(65)) { // A
      mvmt -= 1;
      this.facing = -1;
    }
    if (keyIsDown(68)) { // D
      mvmt += 1;
      this.facing = 1;
    }

    this.vx = mvmt * this.speed;
    this.x += this.vx;
  }

  applyGravity() {
    this.y += this.vy;
    this.vy += this.gravity;
  }

  constrainToScreen() {
    this.x = constrain(this.x, 50, width - 50);
  }

  checkPlatformCollision(list) {
  for (let p of list) {

   
    let left = p.x - p.w / 2;
    let right = p.x + p.w / 2;
    let top = p.y - p.h / 2;
    let bottom = p.y + p.h / 2;

    let withinX = this.x > left && this.x < right;
    let playerBottom = this.y + 50;

    // Player must be falling downward
    let hitting = playerBottom >= top && playerBottom <= top + 20;

    if (withinX && hitting && this.vy > 0) {


      this.y = top - 50;
      this.vy = 0;

      let micLevel = mic.getLevel();
      if (micLevel >= p.requiredVolume) {
        let jumpBoost = map(micLevel, 0, 0.3, -20, -60);
        jumpBoost = constrain(jumpBoost, -20, -60);
        this.vy = jumpBoost;

        deletePlatformsBelow(p.y);
      }

      break;
    }
  }
}


  draw() {
    push();
    translate(this.x, this.y);
    scale(this.facing, 1);
    image(this.img, 0, 0, 100, 100);
    pop();
  }
}

class GreenPlatform {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.w = 120;
    this.h = 20;

    this.requiredVolume = random(0.01, 0.30);
  }

  draw() {
    rectMode(CENTER);
    fill(0, 255, 0);
    rect(this.x, this.y, this.w, this.h, 5);
    fill(0, 200, 125);
    rect(this.x, this.y, this.w - 10, this.h - 10, 5);

    fill(255, 0, 0);
    let barWidth = map(this.requiredVolume, 0, 0.30, 0, this.w);
    rect(this.x, this.y - 8, barWidth, 5);
  }
}

class RedPlatform {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.w = 120;
    this.h = 20;

    this.requiredVolume = random(0.01, 0.30);
    this.speed = random(1, 3) * (random() < 0.5 ? -1 : 1);
  }

  update() {
    this.x += this.speed;

    // bounce at edges
    if (this.x <= 0 || this.x + this.w >= width) {
      this.speed *= -1;
    }
  }

  draw() {
    rectMode(CENTER)
    fill(255, 0, 0);
    rect(this.x, this.y, this.w, this.h, 5);
    fill(200, 125, 0);
    rect(this.x, this.y, this.w - 10, this.h - 10, 5);

    fill(0);
    let barWidth = map(this.requiredVolume, 0, 0.30, 0, this.w);
    rect(this.x, this.y - 8, barWidth, 5);
  }
}

function spawnPlatforms() {
  if (platforms.length === 0) return;

  let highest = min(...platforms.map(p => p.y));

  while (highest > cameraY - height) {
    let newY = highest - random(120, 160);
    let newX = random(70, width - 200);

    platforms.push(new GreenPlatform(newX, newY));

    // Sometimes add a moving red one
    if (random() < 0.25) {
      let rx = random(80, width - 80);
      redPlatforms.push(new RedPlatform(rx, newY - 60));
    }

    highest = newY;
  }
}

function deletePlatformsBelow(yLevel) {
  platforms = platforms.filter(p => p.y <= yLevel);
  redPlatforms = redPlatforms.filter(rp => rp.y <= yLevel);
}

function GO() {
  background(200);
  textAlign(CENTER);
  fill(0);
  textSize(60);
  text("You Dead", width / 2, height / 2 - 40);
  textSize(20);
  text("press f to pay respects", width / 2, height / 2 + 20);
}

function restartGame() {
  gameOver = false;
  cameraY = 0;

  player.x = width / 2;
  player.y = height;
  player.vx = 0;
  player.vy = 0;

  platforms = [];
  redPlatforms = [];

  platforms.push(new GreenPlatform(player.x - 60, player.y + 40));

  for (let i = 0; i < 8; i++) {
    let px = random(100, width - 200);
    let py = height - i * 150;
    platforms.push(new GreenPlatform(px, py));
  }
}

function keyPressed() {
  if (gameOver && keyIsDown(70)) {
    restartGame();
    return;
  }
  if (key === "?" || key == "/") {
    showInstructions = !showInstructions;
    return;
  }

  pressedKeys[keyCode] = true;
}

function drawInstructions() {
  push();
  fill(0, 100, 200);
  rect(50, 50, width - 100, height - 100, 20);

  fill(255);
  textAlign(CENTER);
  textSize(32);
  text("HOW TO PLAY", width / 2, 120);

  textSize(20);
  text(
    "Move left to right with A and D\n" +
    "Jump by making noise into the microphone\n" +
    "Land on green or red platforms\n" +
    "Meet the required volume to jump\n" +
    "If you don't you are stuck on the platform\n" +
    "Don’t fall off the screen!",
    width / 2,
    200
  );

  textSize(18);
  text("Press ? to close", width / 2, height - 150);

  pop();
}
