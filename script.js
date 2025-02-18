const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let width = canvas.width = window.innerWidth;
let height = canvas.height = window.innerHeight;

// Game State
let gameRunning = false;
let speedMultiplier = 1;
const BASE_SPEED = 7;
let particles = [];
let powerUps = [];
let bricks = [];
let lives = 3;

// Keyboard Controls
const keys = {
    ArrowLeft: false,
    ArrowRight: false
};

// Event Listeners for Keyboard
window.addEventListener('keydown', (e) => {
    if (e.key in keys) keys[e.key] = true;
});
window.addEventListener('keyup', (e) => {
    if (e.key in keys) keys[e.key] = false;
});

// Cosmic Skateboard
const skateboard = {
    x: width/2 - 50,
    y: height - 50,
    width: 120,
    height: 20,
    color: '#00ffff',
    shadow: '0 0 20px #00ffff'
};

// Energy Ball
const ball = {
    x: width/2,
    y: height/2,
    radius: 12,
    dx: BASE_SPEED,
    dy: -BASE_SPEED,
    color: '#ff00ff',
    trail: []
};

// Power-Up Types
const PowerUpTypes = {
    EXTRA_LIFE: { 
        color: '#00ff00', 
        effect: () => { lives++; gsap.to("#lives", {textContent: lives, duration: 0.5}) },
        icon: '❤️'
    },
    SUPER_SPEED: { 
        color: '#ff0000', 
        effect: () => speedMultiplier *= 1.3,
        icon: '⚡'
    },
    MEGA_PADDLE: { 
        color: '#0000ff', 
        effect: () => {
            gsap.to(skateboard, {width: 180, duration: 0.3});
            setTimeout(() => gsap.to(skateboard, {width: 120, duration: 0.5}), 5000);
        },
        icon: '🛹'
    }
};

// Initialize Game
function init() {
    generateBricks();
    document.querySelector('.modal').style.display = 'flex';
    document.querySelector('.start-btn').onclick = () => {
        document.querySelector('.modal').style.display = 'none';
        gameRunning = true;
        animate();
    };
}

// Brick Generation (Responsive Layout)
function generateBricks() {
    bricks = [];
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD'];
    const rows = 5; // Number of brick rows
    const cols = Math.floor(width / 100); // Number of bricks per row (responsive)
    const brickWidth = (width - 40) / cols; // Brick width (responsive)
    const brickHeight = 25; // Brick height

    for(let i = 0; i < rows; i++) {
        for(let j = 0; j < cols; j++) {
            const isSpecial = Math.random() < 0.15;
            bricks.push({
                x: j * brickWidth + 20,
                y: i * 35 + 60,
                width: brickWidth - 10, // Add spacing between bricks
                height: brickHeight,
                color: isSpecial ? getRainbowColor(j/cols) : colors[i%colors.length],
                health: isSpecial ? 3 : 1,
                score: isSpecial ? 50 : 20
            });
        }
    }
}

// Animation Loop
function animate() {
    if(!gameRunning) return;

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, width, height);

    updateSkateboard();
    updateBall();
    updateParticles();
    updatePowerUps();
    drawBricks();
    drawBall();
    checkCollisions();

    requestAnimationFrame(animate);
}

// Draw Ball (Fixed: Added this function)
function drawBall() {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = ball.color;
    ctx.fill();
    ctx.closePath();
}

// Skateboard Logic
function updateSkateboard() {
    if(keys.ArrowLeft && skateboard.x > 0) skateboard.x -= 12;
    if(keys.ArrowRight && skateboard.x < width - skateboard.width) skateboard.x += 12;
    
    // Draw with 3D effect
    ctx.fillStyle = skateboard.color;
    ctx.shadowColor = skateboard.color;
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.roundRect(skateboard.x, skateboard.y, skateboard.width, skateboard.height, 10);
    ctx.fill();
    ctx.shadowBlur = 0;
}

// Ball Logic
function updateBall() {
    ball.x += ball.dx * speedMultiplier;
    ball.y += ball.dy * speedMultiplier;

    // Wall collisions
    if(ball.x < ball.radius || ball.x > width - ball.radius) ball.dx *= -1;
    if(ball.y < ball.radius) ball.dy *= -1;

    // Skateboard collision
    if(ball.y > skateboard.y - ball.radius && 
       ball.x > skateboard.x && 
       ball.x < skateboard.x + skateboard.width) {
        const hitPos = (ball.x - skateboard.x) / skateboard.width;
        ball.dy = -Math.abs(ball.dy);
        ball.dx = 10 * (hitPos - 0.5);
        createImpactParticles(ball.x, ball.y);
        gsap.to(skateboard, {color: '#ff00ff', duration: 0.2, onComplete: () => {
            skateboard.color = '#00ffff';
        }});
    }

    // Bottom boundary
    if(ball.y > height + ball.radius) handleLifeLost();
}

// Particle Effects
function createImpactParticles(x, y) {
    for(let i = 0; i < 20; i++) {
        particles.push({
            x, y,
            dx: (Math.random() - 0.5) * 10,
            dy: (Math.random() - 0.5) * 10,
            size: Math.random() * 4 + 2,
            life: 1,
            color: `hsl(${Math.random() * 360}, 100%, 50%)`
        });
    }
}

// Update Particles (Fixed: Added this function)
function updateParticles() {
    particles.forEach((p, i) => {
        p.x += p.dx;
        p.y += p.dy;
        p.life -= 0.03;

        // Draw particles
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();

        // Remove dead particles
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    });
}

// Update Power-Ups (Fixed: Added this function)
function updatePowerUps() {
    powerUps.forEach((pu, i) => {
        pu.y += 2; // Move power-up downward

        // Draw power-up
        ctx.beginPath();
        ctx.arc(pu.x, pu.y, pu.size, 0, Math.PI * 2);
        ctx.fillStyle = pu.color;
        ctx.fill();

        // Check collision with skateboard
        if (pu.y + pu.size > skateboard.y &&
            pu.x > skateboard.x &&
            pu.x < skateboard.x + skateboard.width) {
            pu.effect(); // Apply power-up effect
            powerUps.splice(i, 1); // Remove power-up
        }

        // Remove power-up if it goes off-screen
        if (pu.y > height + pu.size) {
            powerUps.splice(i, 1);
        }
    });
}

// Draw Bricks (Fixed: Added this function)
function drawBricks() {
    bricks.forEach(brick => {
        ctx.fillStyle = brick.color;
        ctx.fillRect(brick.x, brick.y, brick.width, brick.height);

        // Draw cracks on indestructible bricks
        if (brick.health > 1) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            for (let i = 0; i < brick.health - 1; i++) {
                ctx.fillRect(
                    brick.x + i * 10,
                    brick.y,
                    5,
                    brick.height
                );
            }
        }
    });
}

// Collision Detection (Fixed: Added this function)
function collisionDetected(brick) {
    return (
        ball.x + ball.radius > brick.x &&
        ball.x - ball.radius < brick.x + brick.width &&
        ball.y + ball.radius > brick.y &&
        ball.y - ball.radius < brick.y + brick.height
    );
}

// Handle Life Lost (Fixed: Added this function)
function handleLifeLost() {
    lives--;
    gsap.to("#lives", {textContent: lives, duration: 0.5});

    if (lives <= 0) {
        alert("Game Over! Restarting...");
        restartGame();
    } else {
        resetBall();
    }
}

// Handle Victory (Fixed: Added this function)
function handleVictory() {
    alert("Congratulations! You've broken all the bricks!");
    restartGame();
}

// Reset Ball (Fixed: Added this function)
function resetBall() {
    ball.x = width / 2;
    ball.y = height / 2;
    ball.dx = BASE_SPEED * speedMultiplier;
    ball.dy = -BASE_SPEED * speedMultiplier;
}

// Restart Game (Fixed: Added this function)
function restartGame() {
    generateBricks();
    lives = 3;
    speedMultiplier = 1;
    resetBall();
    animate();
}

// Brick Collisions
function checkCollisions() {
    bricks.forEach((brick, i) => {
        if(!collisionDetected(brick)) return;

        brick.health--;
        ball.dy *= -1;
        createImpactParticles(brick.x + brick.width/2, brick.y + brick.height/2);

        if(brick.health <= 0) {
            if(Math.random() < 0.2) spawnPowerUp(brick);
            bricks.splice(i, 1);
        }

        if(bricks.length === 0) handleVictory();
    });
}

// Mobile Controls
let touchStartX = 0;
canvas.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
    skateboard.startX = skateboard.x;
    e.preventDefault();
});

canvas.addEventListener('touchmove', e => {
    const delta = (e.touches[0].clientX - touchStartX) * 1.5;
    skateboard.x = Math.max(0, Math.min(width - skateboard.width, skateboard.startX + delta));
    e.preventDefault();
});

// Helpers
function getRainbowColor(t) {
    return `hsl(${t * 360}, 70%, 60%)`;
}

function spawnPowerUp(brick) {
    const type = Object.values(PowerUpTypes)[Math.floor(Math.random() * 3)];
    powerUps.push({
        ...type,
        x: brick.x + brick.width/2,
        y: brick.y + brick.height/2,
        size: 20
    });
    
    gsap.to(powerUps, {
        y: "+=100",
        duration: 2,
        ease: "power1.inOut",
        yoyo: true,
        repeat: -1
    });
}

// Handle Window Resize (Responsive Layout)
window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    generateBricks(); // Regenerate bricks on resize
    resetBall();
});

init();
