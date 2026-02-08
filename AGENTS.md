# 2048 Game Project

## Overview
A browser-based implementation of the classic 2048 puzzle game with modern UI, animations, and cross-platform input support.

## File Structure
- `index.html` - Main HTML structure
- `style.css` - Styling and animations
- `game.js` - Game logic and input handling
- `AGENTS.md` - This file

## Tech Stack
- Vanilla JavaScript (no frameworks)
- CSS3 with animations and transitions
- LocalStorage for highscores

## Features
- 4x4 game grid
- Keyboard controls (arrow keys) for desktop
- Touch/swipe controls for mobile/tablet
- Smooth tile animations (spawn, merge, move)
- Hover effects on buttons
- Score tracking and local highscore persistence
- Responsive design

## Input Handling
- Desktop: Arrow keys (↑↓←→)
- Mobile: Touch swipe gestures
- Prevent default scrolling on touch

## Game Logic
- Tiles spawn with value 2 (90%) or 4 (10%)
- Tiles slide and merge in direction of input
- Game ends when no valid moves remain
- Score increases by value of merged tiles

## Styling Requirements
- Modern, clean aesthetic
- Gradient backgrounds for tiles
- Smooth transitions (CSS transforms)
- Score display with animation on update
- New game button with hover effects
- Highscore list overlay/modal
