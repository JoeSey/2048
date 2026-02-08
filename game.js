/**
 * 2048 Game Logic
 * Handles game state, input, animations, and highscores
 */

(function() {
    'use strict';

    // Game constants
    const GRID_SIZE = 4;
    const CELL_SIZE = 100; // percentage-based handled in CSS
    const ANIMATION_SPEED = 150; // ms

    // Game state
    let grid = [];
    let score = 0;
    let bestScore = 0;
    let hasWon = false;
    let isAnimating = false;

    // DOM elements
    const tileContainer = document.getElementById('tile-container');
    const scoreElement = document.getElementById('score');
    const bestScoreElement = document.getElementById('best-score');
    const gameMessage = document.getElementById('game-message');
    const gameMessageText = gameMessage.querySelector('.game-message-text');
    const newGameBtn = document.getElementById('new-game-btn');
    const tryAgainBtn = document.getElementById('try-again-btn');
    const highscoreBtn = document.getElementById('highscore-btn');
    const highscoreModal = document.getElementById('highscore-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const highscoreList = document.getElementById('highscore-list');
    const aboutLink = document.getElementById('about-link');
    const aboutModal = document.getElementById('about-modal');
    const aboutCloseBtn = document.getElementById('about-close-btn');

    // Touch handling
    let touchStartX = 0;
    let touchStartY = 0;
    const MIN_SWIPE_DISTANCE = 30;

    /**
     * Initialize the game
     */
    function init() {
        loadBestScore();
        setupInput();
        startNewGame();
    }

    /**
     * Start a new game
     */
    function startNewGame() {
        grid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0));
        score = 0;
        hasWon = false;
        isAnimating = false;
        
        updateScore();
        clearTiles();
        hideGameMessage();
        
        // Spawn two initial tiles
        spawnTile();
        spawnTile();
        renderGrid();
    }

    /**
     * Clear all tiles from the DOM
     */
    function clearTiles() {
        tileContainer.innerHTML = '';
    }

    /**
     * Spawn a new tile at a random empty cell
     */
    function spawnTile() {
        const emptyCells = [];
        
        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE; col++) {
                if (grid[row][col] === 0) {
                    emptyCells.push({ row, col });
                }
            }
        }
        
        if (emptyCells.length > 0) {
            const { row, col } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            grid[row][col] = Math.random() < 0.9 ? 2 : 4;
            
            // Create tile element with animation
            createTileElement(row, col, grid[row][col], true);
        }
    }

    /**
     * Create a tile DOM element
     */
    function createTileElement(row, col, value, isNew = false) {
        const tile = document.createElement('div');
        tile.className = `tile tile-${value} ${isNew ? 'tile-new' : ''}`;
        tile.textContent = value;
        const gap = getGridGap();
        tile.style.left = `calc(${col * 25}% + ${(col * gap) / 4}px)`;
        tile.style.top = `calc(${row * 25}% + ${(row * gap) / 4}px)`;
        tile.id = `tile-${row}-${col}`;
        
        tileContainer.appendChild(tile);
        return tile;
    }

    function getGridGap() {
        const val = getComputedStyle(document.documentElement).getPropertyValue('--grid-gap');
        const n = parseFloat(val);
        return isNaN(n) ? 15 : n;
    }

    /**
     * Render the entire grid
     */
    function renderGrid() {
        clearTiles();
        
        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE; col++) {
                if (grid[row][col] !== 0) {
                    createTileElement(row, col, grid[row][col]);
                }
            }
        }
    }

    /**
     * Move tiles in a direction
     */
    function move(direction) {
        if (isAnimating) return false;
        
        const previousGrid = grid.map(row => [...row]);
        let moved = false;
        let mergedTiles = [];
        
        // Define vectors for each direction
        const vectors = {
            'up': { x: 0, y: -1 },
            'down': { x: 0, y: 1 },
            'left': { x: -1, y: 0 },
            'right': { x: 1, y: 0 }
        };
        
        const vector = vectors[direction];
        
        // Determine traversal order based on direction
        const traversals = buildTraversals(vector);
        
        // Track merges
        let merged = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false));
        
        // Move tiles
        traversals.y.forEach(y => {
            traversals.x.forEach(x => {
                const cell = { x, y };
                const tile = grid[cell.y][cell.x];
                
                if (tile !== 0) {
                    const positions = findFarthestPosition(cell, vector);
                    const next = positions.next;
                    
                    // Check for merge
                    if (next && withinBounds(next) && grid[next.y][next.x] === tile && !merged[next.y][next.x]) {
                        // Merge tiles
                        const mergedValue = tile * 2;
                        grid[next.y][next.x] = mergedValue;
                        grid[cell.y][cell.x] = 0;
                        merged[next.y][next.x] = true;
                        
                        score += mergedValue;
                        mergedTiles.push({ row: next.y, col: next.x, value: mergedValue });
                        
                        moved = true;
                    } else {
                        // Move tile to farthest position
                        if (positions.farthest.x !== cell.x || positions.farthest.y !== cell.y) {
                            grid[positions.farthest.y][positions.farthest.x] = tile;
                            grid[cell.y][cell.x] = 0;
                            moved = true;
                        }
                    }
                }
            });
        });
        
        if (moved) {
            isAnimating = true;
            updateScore();
            renderGrid();
            
            // Add merge animation
            mergedTiles.forEach(({ row, col, value }) => {
                setTimeout(() => {
                    const tile = document.querySelector(`#tile-${row}-${col}`);
                    if (tile) {
                        tile.classList.add('merging');
                        tile.textContent = value;
                        tile.className = `tile tile-${value} merging`;
                    }
                }, ANIMATION_SPEED);
            });
            
            setTimeout(() => {
                spawnTile();
                isAnimating = false;
                
                if (!hasWon && hasReached2048()) {
                    hasWon = true;
                    showGameMessage('You Win!', true);
                } else if (!movesAvailable()) {
                    showGameMessage('Game Over!', false);
                    saveHighScore();
                }
            }, ANIMATION_SPEED + 50);
        }
        
        return moved;
    }

    /**
     * Build traversal arrays for moving in a direction
     */
    function buildTraversals(vector) {
        const traversals = { x: [], y: [] };
        
        for (let pos = 0; pos < GRID_SIZE; pos++) {
            traversals.x.push(pos);
            traversals.y.push(pos);
        }
        
        // Always traverse from the farthest cell in the moving direction
        // Right/Down need reverse so we start from the far edge
        if (vector.x === 1) traversals.x.reverse();
        if (vector.y === 1) traversals.y.reverse();
        
        return traversals;
    }

    /**
     * Find the farthest position a tile can move to
     */
    function findFarthestPosition(cell, vector) {
        let previous;
        
        do {
            previous = cell;
            cell = { x: previous.x + vector.x, y: previous.y + vector.y };
        } while (
            cell.x >= 0 && cell.x < GRID_SIZE &&
            cell.y >= 0 && cell.y < GRID_SIZE &&
            grid[cell.y][cell.x] === 0
        );
        
        return {
            farthest: previous,
            next: cell
        };
    }

    /**
     * Check if a cell is within grid bounds
     */
    function withinBounds(cell) {
        return (
            cell.x >= 0 && cell.x < GRID_SIZE &&
            cell.y >= 0 && cell.y < GRID_SIZE
        );
    }

    /**
     * Check if moves are available
     */
    function movesAvailable() {
        // Check for empty cells
        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE; col++) {
                if (grid[row][col] === 0) {
                    return true;
                }
            }
        }
        
        // Check for possible merges
        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE; col++) {
                const value = grid[row][col];
                
                if (
                    (row < GRID_SIZE - 1 && grid[row + 1][col] === value) ||
                    (col < GRID_SIZE - 1 && grid[row][col + 1] === value)
                ) {
                    return true;
                }
            }
        }
        
        return false;
    }

    /**
     * Check if 2048 has been reached
     */
    function hasReached2048() {
        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE; col++) {
                if (grid[row][col] >= 2048) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Update score display
     */
    function updateScore() {
        scoreElement.textContent = score;
        
        // Add animation
        scoreElement.classList.add('score-update');
        setTimeout(() => {
            scoreElement.classList.remove('score-update');
        }, 300);
        
        if (score > bestScore) {
            bestScore = score;
            bestScoreElement.textContent = bestScore;
            localStorage.setItem('2048-best-score', bestScore);
        }
    }

    /**
     * Load best score from localStorage
     */
    function loadBestScore() {
        const saved = localStorage.getItem('2048-best-score');
        if (saved) {
            bestScore = parseInt(saved, 10);
            bestScoreElement.textContent = bestScore;
        }
    }

    /**
     * Save high score to localStorage
     */
    function saveHighScore() {
        let highscores = JSON.parse(localStorage.getItem('2048-highscores') || '[]');
        
        highscores.push({
            score: score,
            date: new Date().toLocaleDateString()
        });
        
        // Sort by score descending and keep top 10
        highscores.sort((a, b) => b.score - a.score);
        highscores = highscores.slice(0, 10);
        
        localStorage.setItem('2048-highscores', JSON.stringify(highscores));
    }

    /**
     * Show highscores modal
     */
    function showHighscores() {
        const highscores = JSON.parse(localStorage.getItem('2048-highscores') || '[]');
        
        highscoreList.innerHTML = '';
        
        if (highscores.length === 0) {
            highscoreList.innerHTML = '<li style="justify-content: center; background: #f5f5f5;">No highscores yet!</li>';
        } else {
            highscores.forEach((entry, index) => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <span class="rank">#${index + 1}</span>
                    <span class="score">${entry.score} points</span>
                `;
                highscoreList.appendChild(li);
            });
        }
        
        highscoreModal.classList.add('visible');
    }

    /**
     * Hide highscores modal
     */
    function hideHighscores() {
        highscoreModal.classList.remove('visible');
    }

    /**
     * Show About modal
     */
    function showAbout() {
        if (aboutModal) aboutModal.classList.add('visible');
    }

    /**
     * Hide About modal
     */
    function hideAbout() {
        if (aboutModal) aboutModal.classList.remove('visible');
    }

    /**
     * Show game over/win message
     */
    function showGameMessage(message, isWin) {
        gameMessageText.textContent = message;
        gameMessage.classList.remove('game-won', 'game-over');
        gameMessage.classList.add(isWin ? 'game-won' : 'game-over', 'visible');
    }

    /**
     * Hide game message
     */
    function hideGameMessage() {
        gameMessage.classList.remove('visible');
    }

    /**
     * Setup input handlers
     */
    function setupInput() {
        // Keyboard controls
        document.addEventListener('keydown', handleKeyDown);
        
        // Touch controls
        const gameContainer = document.getElementById('game-container');
        gameContainer.addEventListener('touchstart', handleTouchStart, { passive: false });
        gameContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
        gameContainer.addEventListener('touchend', handleTouchEnd, { passive: false });
        
        // Button controls
        newGameBtn.addEventListener('click', startNewGame);
        tryAgainBtn.addEventListener('click', startNewGame);
        highscoreBtn.addEventListener('click', showHighscores);
        closeModalBtn.addEventListener('click', hideHighscores);
        if (aboutLink) {
            aboutLink.addEventListener('click', (e) => { e.preventDefault(); showAbout(); });
        }
        if (aboutCloseBtn) {
            aboutCloseBtn.addEventListener('click', hideAbout);
        }
        
        // Close modal on outside click
        highscoreModal.addEventListener('click', (e) => {
            if (e.target === highscoreModal) {
                hideHighscores();
            }
        });
        if (aboutModal) {
            aboutModal.addEventListener('click', (e) => {
                if (e.target === aboutModal) {
                    hideAbout();
                }
            });
        }
        
        // Keyboard escape to close modal(s)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                hideHighscores();
                hideAbout();
            }
        });
    }

    /**
     * Handle keyboard input
     */
    function handleKeyDown(e) {
        const keyMap = {
            'ArrowUp': 'up',
            'ArrowDown': 'down',
            'ArrowLeft': 'left',
            'ArrowRight': 'right'
        };
        
        if (keyMap[e.key]) {
            e.preventDefault();
            move(keyMap[e.key]);
        }
    }

    /**
     * Handle touch start
     */
    function handleTouchStart(e) {
        if (e.touches.length > 1) return;
        
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }

    /**
     * Handle touch move
     */
    function handleTouchMove(e) {
        e.preventDefault();
    }

    /**
     * Handle touch end
     */
    function handleTouchEnd(e) {
        if (!touchStartX || !touchStartY) return;
        
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        
        if (Math.abs(deltaX) < MIN_SWIPE_DISTANCE && Math.abs(deltaY) < MIN_SWIPE_DISTANCE) {
            return;
        }
        
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Horizontal swipe
            move(deltaX > 0 ? 'right' : 'left');
        } else {
            // Vertical swipe
            move(deltaY > 0 ? 'down' : 'up');
        }
        
        touchStartX = 0;
        touchStartY = 0;
    }

    // Initialize the game when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
