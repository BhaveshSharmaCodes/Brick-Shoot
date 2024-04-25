const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let ball = {
	x: canvas.width / 2,
	y: canvas.height / 2,
	radius: 10,
	dx: 2,
	dy: -2,
	color: '#FF5733'
};

let bricks = [];

const totalBricks = 75;
let chances = 3;

function generateBricks() {
	bricks = [];
	for (let i = 0; i < 5; i++) {
		for (let j = 0; j < 15; j++) {
			let isDestructible = Math.random() < 0.8; // 80% chance of being destructible
			let brickColor = isDestructible ? 'red' : getRandomColor();
			let brick = {
				x: j * 90 + 20,
				y: i * 35 + 45,
				width: 60,
				height: 20,
				color: brickColor,
				destructible: isDestructible,
				hitCount: 0 // Track how many times this brick has been hit
			};
			bricks.push(brick);
		}
	}
}

function getRandomColor() {
	const letters = '0123456789ABCDEF';
	let color = '#';
	for (let i = 0; i < 6; i++) {
		color += letters[Math.floor(Math.random() * 16)];
	}
	return color;
}

generateBricks();

function drawBall() {
	ctx.beginPath();
	ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
	ctx.fillStyle = ball.color;
	ctx.fill();
	ctx.closePath();
}

function drawBricks() {
	bricks.forEach(brick => {
		ctx.fillStyle = brick.color;
		ctx.fillRect(brick.x, brick.y, brick.width, brick.height);

		// Draw cracks on indestructible bricks based on hit count
		if (!brick.destructible && brick.hitCount > 0) {
			ctx.fillStyle = 'black';
			for (let i = 0; i < brick.hitCount; i++) {
				ctx.fillRect(brick.x + i * 20, brick.y, 10, brick.height);
			}
		}
	});
}

function updateBallPosition() {
	ball.x += ball.dx;
	ball.y += ball.dy;

	if (ball.x - ball.radius <= 0 || ball.x + ball.radius >= canvas.width) {
		ball.dx = -ball.dx;
	}

	if (ball.y - ball.radius <= 0) {
		ball.dy = -ball.dy;
	}

	if (ball.y + ball.radius >= canvas.height) {
		if (chances > 0) {
			chances--;
			resetBall();
		} else {
			alert("Game Over! Restarting...");
			restartGame();
		}
	}
}

function resetBall() {
	ball.x = canvas.width / 2;
	ball.y = canvas.height / 2;
}

function checkCollision() {
	bricks.forEach((brick, index) => {
		if (
			ball.x + ball.radius > brick.x &&
			ball.x - ball.radius < brick.x + brick.width &&
			ball.y + ball.radius > brick.y &&
			ball.y - ball.radius < brick.y + brick.height
		) {
			const brickCenterX = brick.x + brick.width / 2;
			const brickCenterY = brick.y + brick.height / 2;

			const deltaX = Math.abs(ball.x - brickCenterX);
			const deltaY = Math.abs(ball.y - brickCenterY);

			if (deltaX > ball.radius + brick.width / 2 || deltaY > ball.radius + brick.height / 2) {
				return;
			}

			if (deltaX <= brick.width / 2 || deltaY <= brick.height / 2) {
				const colDirectionX = deltaX <= brick.width / 2;
				const colDirectionY = deltaY <= brick.height / 2;

				if (colDirectionY) {
					ball.dx = -ball.dx;
				}
				if (colDirectionX) {
					ball.dy = -ball.dy;
				}

				if (brick.destructible) {
					bricks.splice(index, 1);
				} else {
					if (brick.hitCount < 2) {
						brick.hitCount++;
					} else {
						brick.destructible = true;
						brick.hitCount = 0;
					}
				}
			} else {
				const cornerDeltaX = deltaX - brick.width / 2;
				const cornerDeltaY = deltaY - brick.height / 2;
				const cornerDistanceSquared = cornerDeltaX * cornerDeltaX + cornerDeltaY * cornerDeltaY;

				if (cornerDistanceSquared <= ball.radius * ball.radius) {
					if (brick.destructible) {
						bricks.splice(index, 1);
					}

					ball.dy = -ball.dy;
					ball.dx = -ball.dx;
				}
			}
		}
	});

	if (bricks.length === 0) {
		alert("Congratulations! You've broken all the destructible bricks!");
		restartGame();
	}
}

function restartGame() {
	generateBricks();
	chances = 3;
	resetBall();
	animate();  
	// Start animation loop again
}

function animate() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	drawBall();
	drawBricks();
	updateBallPosition();
	checkCollision();

	if (chances > 0 && bricks.length > 0) {
		requestAnimationFrame(animate);
	}
}

canvas.addEventListener('click', () => {
	ball.dy = -4;
	 // Adjust the jump force here
});

animate();