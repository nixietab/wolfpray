// Constants
const canvas = document.getElementById('dungeonCanvas');
const ctx = canvas.getContext('2d');
const tileSize = 20; // Size of each tile in pixels
const rows = Math.floor(canvas.height / tileSize);
const cols = Math.floor(canvas.width / tileSize);

// Sprite images
const playerSprite = new Image();
playerSprite.src = 'player.png';

const preySprite = new Image();
preySprite.src = 'prey.png';

// Dungeon and entities
let dungeon = [];
let player;
let prey = [];
let gameStatus = 'Generating dungeon...';

// Function to generate a random dungeon
function generateDungeon() {
    dungeon = [];
    for (let i = 0; i < rows; i++) {
        let row = [];
        for (let j = 0; j < cols; j++) {
            // Generate random dungeon cell (for simplicity, let's say 1 for wall, 0 for empty space)
            let cell = Math.random() > 0.7 ? 1 : 0; // Adjust the probability for walls
            row.push(cell);
        }
        dungeon.push(row);
    }
}

// Function to create entities (player and prey)
function createEntities() {
    // Place player in a random empty space
    let emptySpaces = [];
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            if (dungeon[i][j] === 0) {
                emptySpaces.push({ x: j, y: i });
            }
        }
    }
    const randomIndex = Math.floor(Math.random() * emptySpaces.length);
    player = { x: emptySpaces[randomIndex].x, y: emptySpaces[randomIndex].y };

    // Place prey in random empty spaces, ensuring they are not trapped
    for (let i = 0; i < 10; i++) { // Adjust the number of prey as needed
        let placed = false;
        while (!placed) {
            const randomIndex = Math.floor(Math.random() * emptySpaces.length);
            const preyPos = { x: emptySpaces[randomIndex].x, y: emptySpaces[randomIndex].y };

            // Check if prey position is reachable
            const path = findPath(player, preyPos);
            if (path.length > 1) { // Ensure there's a path to prey
                prey.push(preyPos);
                placed = true;
            }
        }
    }
}

// Function to draw entities on the canvas
function drawEntities() {
    // Draw player
    ctx.drawImage(playerSprite, player.x * tileSize, player.y * tileSize, tileSize, tileSize);

    // Draw prey
    prey.forEach(p => {
        ctx.drawImage(preySprite, p.x * tileSize, p.y * tileSize, tileSize, tileSize);
    });
}

// Function to handle player movement towards prey
function movePlayerTowardsPrey() {
    const closestPrey = findClosestPrey(player);
    if (closestPrey) {
        const path = findPath(player, closestPrey);
        if (path.length > 1) { // Ensure path exists
            const nextX = path[1].x;
            const nextY = path[1].y;
            // Move the player one tile at a time
            if (isValidMove(nextX, nextY)) {
                player.x = nextX;
                player.y = nextY;
                // Remove captured prey
                prey = prey.filter(p => !(p.x === player.x && p.y === player.y));
                // Check if all prey are eliminated
                if (prey.length === 0) {
                    restartGame();
                }
            }
        }
    }
}

// Function to check if a move is valid (within bounds and not a wall)
function isValidMove(x, y) {
    return x >= 0 && x < cols && y >= 0 && y < rows && dungeon[y][x] === 0;
}

// Function to update game state (prey movements and player movement towards prey)
function updateGame() {
    movePlayerTowardsPrey();
    movePrey();
    drawGame();
}

// Function to draw the dungeon and entities on the canvas
function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw dungeon
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            if (dungeon[i][j] === 1) {
                ctx.fillStyle = '#333'; // Dark color for walls
            } else {
                ctx.fillStyle = '#555'; // Darker color for empty space
            }
            ctx.fillRect(j * tileSize, i * tileSize, tileSize, tileSize);
        }
    }

    // Draw entities
    drawEntities();
}

// Function to handle prey movement
function movePrey() {
    prey.forEach((p, index) => {
        // Random movement for prey
        const directions = [{ dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 }];
        const randomDir = directions[Math.floor(Math.random() * directions.length)];
        
        const newX = p.x + randomDir.dx;
        const newY = p.y + randomDir.dy;
        
        // Check if new position is within bounds and is not a wall
        if (isValidMove(newX, newY)) {
            prey[index].x = newX;
            prey[index].y = newY;
        }
    });
}

// A* Pathfinding algorithm
function findPath(start, end) {
    const openList = [];
    const closedList = [];
    const path = [];

    const addToOpenList = (x, y, parent, g, h) => {
        openList.push({ x, y, parent, g, h });
    };

    const findInOpenList = (x, y) => openList.find(node => node.x === x && node.y === y);
    const findInClosedList = (x, y) => closedList.find(node => node.x === x && node.y === y);

    addToOpenList(start.x, start.y, null, 0, manhattanDistance(start, end));

    while (openList.length > 0) {
        openList.sort((a, b) => a.g + a.h - b.g - b.h);
        const currentNode = openList.shift();
        closedList.push(currentNode);

        if (currentNode.x === end.x && currentNode.y === end.y) {
            let traceNode = currentNode;
            while (traceNode.parent !== null) {
                path.unshift({ x: traceNode.x, y: traceNode.y });
                traceNode = traceNode.parent;
            }
            break;
        }

        const neighbors = getWalkableNeighbors(currentNode);
        neighbors.forEach(neighbor => {
            if (!findInClosedList(neighbor.x, neighbor.y)) {
                const g = currentNode.g + 1;
                const h = manhattanDistance(neighbor, end);
                const existingNode = findInOpenList(neighbor.x, neighbor.y);
                if (!existingNode || g + h < existingNode.g + existingNode.h) {
                    addToOpenList(neighbor.x, neighbor.y, currentNode, g, h);
                }
            }
        });
    }

    return path;
}

// Function to calculate Manhattan distance heuristic
function manhattanDistance(nodeA, nodeB) {
    return Math.abs(nodeA.x - nodeB.x) + Math.abs(nodeA.y - nodeB.y);
}

// Function to get walkable neighbors
function getWalkableNeighbors(node) {
    const neighbors = [];
    const directions = [{ dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 }];

    directions.forEach(dir => {
        const newX = node.x + dir.dx;
        const newY = node.y + dir.dy;
        if (isValidMove(newX, newY)) {
            neighbors.push({ x: newX, y: newY });
        }
    });

    return neighbors;
}

// Function to find the closest prey to a given entity
function findClosestPrey(entity) {
    let closestDistance = Infinity;
    let closestPrey = null;

    prey.forEach(p => {
        const distance = Math.abs(p.x - entity.x) + Math.abs(p.y - entity.y);
        if (distance < closestDistance) {
            closestDistance = distance;
            closestPrey = p;
        }
    });

    return closestPrey;
}

// Function to restart the game
function restartGame() {
    gameStatus = 'Restarting game...';
    setTimeout(() => {
        generateDungeon();
        createEntities();
        gameStatus = 'Generating new dungeon...';
    }, 1); // Delay for 1 second before restarting
}

// Event listener for keyboard input to move the player
document.addEventListener('keydown', function(event) {
    const keyCode = event.keyCode;
    switch(keyCode) {
        case 37: // Left arrow
            movePlayer(-1, 0);
            break;
        case 38: // Up arrow
            movePlayer(0, -1);
            break;
        case 39: // Right arrow
            movePlayer(1, 0);
            break;
        case 40: // Down arrow
            movePlayer(0, 1);
            break;
    }
});

// Function to move the player by dx, dy
function movePlayer(dx, dy) {
    const newX = player.x + dx;
    const newY = player.y + dy;
    // Move only if the new position is valid
    if (isValidMove(newX, newY)) {
        player.x = newX;
        player.y = newY;
        // Check if all prey are eliminated
        prey = prey.filter(p => !(p.x === player.x && p.y === player.y));
        if (prey.length === 0) {
            restartGame();
        }
    }
}

// Initialization
generateDungeon();
createEntities();
playerSprite.onload = drawGame; // Ensure the game is drawn after player sprite is loaded
preySprite.onload = drawGame; // Ensure the game is drawn after prey sprite is loaded

// Game loop: Update game state every 500 milliseconds (adjust as needed)
setInterval(updateGame, 1);
