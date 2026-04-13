'use client';

import React, { useState, useCallback, useEffect } from 'react';

// --- Types ---
interface Cell {
    row: number;
    col: number;
    isWall: boolean;
    isStart: boolean;
    isEnd: boolean;
    distance: number;
    isVisited: boolean;
    previousNode: Cell | null;
    isPath: boolean;
}

interface VisualizerState {
    grid: Cell[][];
    isRunning: boolean;
    isComplete: boolean;
    startNode: { row: number; col: number } | null;
    endNode: { row: number; col: number } | null;
    mode: 'wall' | 'start' | 'end';
    stats: {
        nodesVisited: number;
        pathLength: number;
        executionTime: number;
    };
}

// if you change these, the universe might collapse
const ROWS = 20;
const COLS = 40;
const COLS_MOBILE = 22; // phones are smol
const ANIMATION_SPEED = 15; // ms

export default function DijkstraVisualizer() {
    const [algorithm, setAlgorithm] = useState<'Dijkstra' | 'BFS' | 'DFS' | 'Bellman-Ford'>('Dijkstra');
    const [isMobile, setIsMobile] = useState(false);
    const [state, setState] = useState<VisualizerState>({
        grid: [],
        isRunning: false,
        isComplete: false,
        startNode: null,
        endNode: null,
        mode: 'wall',
        stats: { nodesVisited: 0, pathLength: 0, executionTime: 0 }
    });

    const [mouseIsPressed, setMouseIsPressed] = useState(false);
    const [isDrawingWalls, setIsDrawingWalls] = useState(false);
    const [showInfo, setShowInfo] = useState(true);

    // detect mobile — not because we judge, but because we care
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 640);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    const activeCols = isMobile ? COLS_MOBILE : COLS;

    // --- Grid init ---
    const initializeGrid = useCallback((cols = activeCols) => {
        const grid: Cell[][] = [];
        for (let row = 0; row < ROWS; row++) {
            const currentRow: Cell[] = [];
            for (let col = 0; col < cols; col++) {
                currentRow.push({
                    row, col,
                    isWall: false, isStart: false, isEnd: false,
                    distance: Infinity, isVisited: false,
                    previousNode: null, isPath: false
                });
            }
            grid.push(currentRow);
        }
        return grid;
    }, [activeCols]);

    useEffect(() => {
        setState(prev => ({ ...prev, grid: initializeGrid(), startNode: null, endNode: null }));
    }, [initializeGrid]);

    // --- Mouse Handlers ---
    const handleMouseDown = useCallback((row: number, col: number) => {
        if (state.isRunning) return;
        setMouseIsPressed(true);

        const cell = state.grid[row][col];
        if (state.mode === 'wall' && !cell.isStart && !cell.isEnd) {
            setIsDrawingWalls(!cell.isWall);
        }

        setState(prev => {
            const newGrid = prev.grid.map(r => [...r]);
            const target = newGrid[row][col];

            if (prev.mode === 'start') {
                if (prev.startNode) newGrid[prev.startNode.row][prev.startNode.col] = { ...newGrid[prev.startNode.row][prev.startNode.col], isStart: false };
                target.isStart = true;
                target.isWall = false;
                return { ...prev, grid: newGrid, startNode: { row, col }, isComplete: false };
            } else if (prev.mode === 'end') {
                if (prev.endNode) newGrid[prev.endNode.row][prev.endNode.col] = { ...newGrid[prev.endNode.row][prev.endNode.col], isEnd: false };
                target.isEnd = true;
                target.isWall = false;
                return { ...prev, grid: newGrid, endNode: { row, col }, isComplete: false };
            } else if (prev.mode === 'wall') {
                if (!target.isStart && !target.isEnd) newGrid[row][col] = { ...target, isWall: !target.isWall };
                return { ...prev, grid: newGrid, isComplete: false };
            }
            return prev;
        });
    }, [state.isRunning, state.mode, state.grid]);

    const handleMouseEnter = useCallback((row: number, col: number) => {
        if (!mouseIsPressed || state.isRunning || state.mode !== 'wall') return;
        setState(prev => {
            const newGrid = prev.grid.map(r => [...r]);
            const cell = newGrid[row][col];
            if (!cell.isStart && !cell.isEnd) newGrid[row][col] = { ...cell, isWall: isDrawingWalls };
            return { ...prev, grid: newGrid, isComplete: false };
        });
    }, [mouseIsPressed, isDrawingWalls, state.isRunning, state.mode]);

    const handleMouseUp = useCallback(() => {
        setMouseIsPressed(false);
        setIsDrawingWalls(false);
    }, []);

    // --- Touch Handlers (so people on phones don't feel left out) ---
    const getTouchCell = useCallback((touch: React.Touch): { row: number; col: number } | null => {
        const el = document.elementFromPoint(touch.clientX, touch.clientY);
        if (!el) return null;
        const r = el.getAttribute('data-row');
        const c = el.getAttribute('data-col');
        if (r === null || c === null) return null;
        return { row: parseInt(r), col: parseInt(c) };
    }, []);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        if (state.isRunning) return;
        const cell = getTouchCell(e.touches[0]);
        if (!cell) return;
        handleMouseDown(cell.row, cell.col);
    }, [state.isRunning, getTouchCell, handleMouseDown]);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        e.preventDefault(); // don't scroll while drawing walls, that's just rude
        const cell = getTouchCell(e.touches[0]);
        if (!cell) return;
        handleMouseEnter(cell.row, cell.col);
    }, [getTouchCell, handleMouseEnter]);

    const handleTouchEnd = useCallback(() => handleMouseUp(), [handleMouseUp]);

    // --- Neighbors (the algorithm's social network) ---
    const getNeighbors = useCallback((node: Cell, grid: Cell[][]) => {
        const neighbors: Cell[] = [];
        const { row, col } = node;
        const cols = grid[0].length;
        if (row > 0) neighbors.push(grid[row - 1][col]);
        if (row < ROWS - 1) neighbors.push(grid[row + 1][col]);
        if (col > 0) neighbors.push(grid[row][col - 1]);
        if (col < cols - 1) neighbors.push(grid[row][col + 1]);
        return neighbors.filter(n => !n.isWall);
    }, []);

    const getShortestPath = useCallback((endNode: Cell) => {
        const path: Cell[] = [];
        let current: Cell | null = endNode;
        while (current !== null) { path.unshift(current); current = current.previousNode; }
        return path;
    }, []);

    // --- Algorithm Runner (the star of the show) ---
    const runAlgorithm = useCallback(async () => {
        if (!state.startNode || !state.endNode) {
            alert('Please set both start and end points!');
            return;
        }

        const startTime = performance.now();

        // wipe the old run's colours before animating — otherwise re-running looks broken
        setState(prev => ({
            ...prev,
            isRunning: true,
            isComplete: false,
            stats: { nodesVisited: 0, pathLength: 0, executionTime: 0 },
            grid: prev.grid.map(row => row.map(cell => ({
                ...cell,
                isVisited: false,
                isPath: false,
                distance: Infinity,
                previousNode: null as Cell | null
            })))
        }));

        const grid: Cell[][] = state.grid.map(row => row.map(cell => ({ ...cell, distance: Infinity, isVisited: false, previousNode: null as Cell | null, isPath: false })));
        const startNode = grid[state.startNode.row][state.startNode.col];
        const endNode = grid[state.endNode.row][state.endNode.col];
        startNode.distance = 0;
        const visited: Cell[] = [];

        if (algorithm === 'Dijkstra') {
            const unvisited: Cell[] = grid.flat();
            while (unvisited.length > 0) {
                unvisited.sort((a, b) => a.distance - b.distance);
                const closest = unvisited.shift()!;
                if (closest.isWall || closest.distance === Infinity) break;
                closest.isVisited = true;
                visited.push(closest);
                if (closest === endNode) break;
                for (const n of getNeighbors(closest, grid)) {
                    const d = closest.distance + 1;
                    if (d < n.distance) { n.distance = d; n.previousNode = closest; }
                }
            }
        } else if (algorithm === 'BFS') {
            const queue = [startNode];
            startNode.isVisited = true;
            while (queue.length > 0) {
                const current = queue.shift()!;
                if (current.isWall) continue;
                visited.push(current);
                if (current === endNode) break;
                for (const n of getNeighbors(current, grid)) {
                    if (!n.isVisited) { n.isVisited = true; n.previousNode = current; queue.push(n); }
                }
            }
        } else if (algorithm === 'DFS') {
            const stack = [startNode];
            while (stack.length > 0) {
                const current = stack.pop()!;
                if (current.isWall || current.isVisited) continue;
                current.isVisited = true;
                visited.push(current);
                if (current === endNode) break;
                for (const n of getNeighbors(current, grid)) {
                    if (!n.isVisited) { n.previousNode = current; stack.push(n); }
                }
            }
        } else if (algorithm === 'Bellman-Ford') {
            const cols = grid[0].length;
            const inQueue = Array(ROWS).fill(null).map(() => Array(cols).fill(false));
            const queue = [startNode];
            inQueue[startNode.row][startNode.col] = true;
            while (queue.length > 0) {
                const current = queue.shift()!;
                inQueue[current.row][current.col] = false;
                if (current.isWall) continue;
                if (!current.isVisited) { current.isVisited = true; visited.push(current); }
                for (const n of getNeighbors(current, grid)) {
                    if (current.distance + 1 < n.distance) {
                        n.distance = current.distance + 1;
                        n.previousNode = current;
                        if (!inQueue[n.row][n.col]) { queue.push(n); inQueue[n.row][n.col] = true; }
                    }
                }
            }
        }

        // animate explored nodes
        for (let i = 0; i < visited.length; i++) {
            await new Promise(r => setTimeout(r, ANIMATION_SPEED));
            setState(prev => {
                const newGrid = prev.grid.map(row => [...row]);
                const node = visited[i];
                newGrid[node.row][node.col] = { ...newGrid[node.row][node.col], isVisited: true };
                return { ...prev, grid: newGrid };
            });
        }

        await new Promise(r => setTimeout(r, 200));

        // animate path
        const path = getShortestPath(endNode);
        if (path.length > 1) {
            for (let i = 0; i < path.length; i++) {
                await new Promise(r => setTimeout(r, ANIMATION_SPEED * 2));
                setState(prev => {
                    const newGrid = prev.grid.map(row => [...row]);
                    const node = path[i];
                    newGrid[node.row][node.col] = { ...newGrid[node.row][node.col], isPath: true };
                    return { ...prev, grid: newGrid };
                });
            }
        }

        const executionTime = Math.round(performance.now() - startTime);
        setState(prev => ({
            ...prev,
            isRunning: false,
            isComplete: true,
            stats: {
                nodesVisited: visited.length,
                pathLength: path.length > 0 ? path.length - 1 : 0,
                executionTime
            }
        }));
    }, [state.startNode, state.endNode, state.grid, getNeighbors, getShortestPath, algorithm]);

    // --- Actions ---
    const clearGrid = useCallback(() => {
        if (state.isRunning) return;
        setState(prev => ({ ...prev, grid: initializeGrid(), startNode: null, endNode: null, isComplete: false }));
    }, [state.isRunning, initializeGrid]);

    const clearPath = useCallback(() => {
        if (state.isRunning) return;
        setState(prev => ({
            ...prev,
            grid: prev.grid.map(row => row.map(cell => ({ ...cell, isVisited: false, isPath: false, distance: Infinity, previousNode: null }))),
            isComplete: false
        }));
    }, [state.isRunning]);

    const generateMaze = useCallback(() => {
        if (state.isRunning) return;
        setState(prev => ({
            ...prev,
            grid: prev.grid.map(row => row.map(cell => ({
                ...cell,
                isWall: Math.random() < 0.3 && !cell.isStart && !cell.isEnd,
                isVisited: false, isPath: false, distance: Infinity, previousNode: null
            }))),
            isComplete: false
        }));
    }, [state.isRunning]);

    const addSamplePoints = useCallback(() => {
        if (state.isRunning) return;
        setState(prev => {
            const newGrid = prev.grid.map(row => [...row]);
            const cols = newGrid[0].length;
            if (prev.startNode) newGrid[prev.startNode.row][prev.startNode.col].isStart = false;
            if (prev.endNode) newGrid[prev.endNode.row][prev.endNode.col].isEnd = false;
            const sR = Math.floor(ROWS / 4), sC = Math.floor(cols / 4);
            const eR = Math.floor((3 * ROWS) / 4), eC = Math.floor((3 * cols) / 4);
            newGrid[sR][sC].isStart = true; newGrid[sR][sC].isWall = false;
            newGrid[eR][eC].isEnd = true; newGrid[eR][eC].isWall = false;
            return { ...prev, grid: newGrid, startNode: { row: sR, col: sC }, endNode: { row: eR, col: eC }, isComplete: false };
        });
    }, [state.isRunning]);

    // --- Cell Class (color-coded chaos) ---
    const getCellClassName = useCallback((cell: Cell) => {
        let base = 'border cursor-pointer transition-all duration-200 relative rounded-sm grid-cell-touch ';
        if (cell.isStart) return base + 'bg-emerald-500 shadow-md shadow-emerald-500/30 border-emerald-600 start-end-pulse';
        if (cell.isEnd) return base + 'bg-rose-500 shadow-md shadow-rose-500/30 border-rose-600 start-end-pulse';
        if (cell.isPath) return base + 'bg-amber-400 shadow-sm shadow-amber-400/30 border-amber-500';
        if (cell.isVisited) return base + 'bg-indigo-500/50 border-indigo-400/30 visited-wave';
        if (cell.isWall) return base + 'bg-slate-600 border-slate-500';
        return base + 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 hover:border-zinc-600';
    }, []);

    // status label helper
    const statusLabel = state.isRunning ? 'EXEC'
        : state.isComplete ? (state.stats.pathLength > 0 ? 'DONE' : 'NONE')
        : !state.startNode ? 'START'
        : !state.endNode ? 'SET END'
        : 'READY';

    const statusColor = state.isRunning ? 'text-white animate-pulse'
        : state.isComplete ? (state.stats.pathLength > 0 ? 'text-emerald-400' : 'text-rose-400')
        : !state.startNode ? 'text-amber-400'
        : !state.endNode ? 'text-orange-400'
        : 'text-cyan-400';

    return (
        <div className="bg-black min-h-[calc(100vh-49px)] font-mono relative overflow-hidden">

            {/* subtle grid background — mandatory for "hacker" aesthetic */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                <div className="absolute inset-0" style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, rgba(34, 211, 238, 0.8) 1px, transparent 0)`,
                    backgroundSize: '20px 20px'
                }} />
            </div>

            <div className="relative z-10 flex flex-col h-full">

                {/* ====== CONTROL BAR ====== */}
                <div className="glass border-b border-white/[0.06] px-3 sm:px-4 py-2.5">
                    <div className="max-w-7xl mx-auto flex flex-col gap-2">

                        {/* Row 1: Title + algorithm select + stats */}
                        <div className="flex items-center justify-between gap-3 flex-wrap">

                            {/* Title block */}
                            <div className="flex items-center gap-3 min-w-0">
                                <div>
                                    <h1 className="text-lg sm:text-xl font-bold text-white tracking-wider leading-none flex items-center gap-2 flex-wrap">
                                        <span className="text-cyan-400">{algorithm.toUpperCase()}</span>
                                        <select
                                            value={algorithm}
                                            onChange={(e) => setAlgorithm(e.target.value as typeof algorithm)}
                                            disabled={state.isRunning}
                                            className="text-xs bg-zinc-800/80 text-gray-200 border border-zinc-700 rounded-md px-2 py-1 outline-none focus:border-cyan-500 font-sans font-normal disabled:opacity-50 cursor-pointer"
                                        >
                                            <option value="Dijkstra">Dijkstra</option>
                                            <option value="BFS">BFS</option>
                                            <option value="DFS">DFS</option>
                                            <option value="Bellman-Ford">Bellman-Ford</option>
                                        </select>
                                    </h1>
                                    <p className="text-[10px] text-gray-600 tracking-widest mt-0.5">PATHFINDING VISUALIZER</p>
                                </div>
                            </div>

                            {/* Stats — always visible, always judging you */}
                            <div className="flex items-center gap-3 sm:gap-5 bg-zinc-900/60 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono">
                                <div className="text-center">
                                    <div className="text-gray-500 text-[9px] tracking-wider">STATUS</div>
                                    <div className={`font-bold text-sm ${statusColor}`}>{statusLabel}</div>
                                </div>
                                <div className="w-px h-6 bg-zinc-800" />
                                <div className="text-center">
                                    <div className="text-gray-500 text-[9px] tracking-wider">NODES</div>
                                    <div className="text-zinc-300 font-bold text-sm">{state.stats.nodesVisited}</div>
                                </div>
                                <div className="w-px h-6 bg-zinc-800" />
                                <div className="text-center">
                                    <div className="text-gray-500 text-[9px] tracking-wider">PATH</div>
                                    <div className="text-amber-400 font-bold text-sm">{state.stats.pathLength}</div>
                                </div>
                                <div className="w-px h-6 bg-zinc-800" />
                                <div className="text-center">
                                    <div className="text-gray-500 text-[9px] tracking-wider">TIME</div>
                                    <div className="text-emerald-400 font-bold text-sm">{state.stats.executionTime}ms</div>
                                </div>
                            </div>
                        </div>

                        {/* Row 2: All the buttons */}
                        <div className="flex items-center gap-2 flex-wrap">

                            {/* Mode selection — pick your destiny */}
                            <div className="flex gap-1 bg-zinc-900/70 p-1 rounded-lg border border-zinc-800">
                                <button
                                    onClick={() => setState(prev => ({ ...prev, mode: 'start' }))}
                                    disabled={state.isRunning}
                                    className={`px-2.5 sm:px-3 py-1.5 text-[11px] font-semibold rounded transition-all duration-150 disabled:opacity-40 ${state.mode === 'start' ? 'bg-emerald-500 text-black shadow' : 'text-emerald-400 hover:bg-emerald-500/15'}`}
                                >
                                    START
                                </button>
                                <button
                                    onClick={() => setState(prev => ({ ...prev, mode: 'end' }))}
                                    disabled={state.isRunning}
                                    className={`px-2.5 sm:px-3 py-1.5 text-[11px] font-semibold rounded transition-all duration-150 disabled:opacity-40 ${state.mode === 'end' ? 'bg-rose-500 text-black shadow' : 'text-rose-400 hover:bg-rose-500/15'}`}
                                >
                                    TARGET
                                </button>
                                <button
                                    onClick={() => setState(prev => ({ ...prev, mode: 'wall' }))}
                                    disabled={state.isRunning}
                                    className={`px-2.5 sm:px-3 py-1.5 text-[11px] font-semibold rounded transition-all duration-150 disabled:opacity-40 ${state.mode === 'wall' ? 'bg-slate-300 text-black shadow' : 'text-slate-400 hover:bg-slate-300/15'}`}
                                >
                                    WALLS
                                </button>
                            </div>

                            {/* the big red button (except it's white-ish) */}
                            <button
                                onClick={runAlgorithm}
                                disabled={state.isRunning || !state.startNode || !state.endNode}
                                className={`px-4 sm:px-5 py-2 text-[11px] font-semibold rounded-lg border transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed ${state.isRunning
                                    ? 'bg-white text-black animate-pulse border-white'
                                    : 'text-zinc-200 border-zinc-600 hover:border-cyan-400 hover:bg-cyan-400/10 hover:text-cyan-300'
                                }`}
                            >
                                {state.isRunning
                                    ? <span className="flex items-center gap-1.5"><svg viewBox="0 0 16 16" className="w-3 h-3 animate-spin" fill="currentColor"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 2a5 5 0 010 10A5 5 0 018 3z" opacity="0.3"/><path d="M8 1a7 7 0 017 7h-2a5 5 0 00-5-5V1z"/></svg> RUNNING</span>
                                    : <span className="flex items-center gap-1.5"><svg viewBox="0 0 16 16" className="w-3 h-3" fill="currentColor"><path d="M4 2l10 6-10 6z"/></svg> RUN</span>
                                }
                            </button>

                            {/* utility buttons — the support cast */}
                            <div className="flex gap-1 bg-zinc-900/70 p-1 rounded-lg border border-zinc-800 flex-wrap">
                                <button onClick={clearPath} disabled={state.isRunning} className="px-2 sm:px-2.5 py-1.5 text-[11px] font-medium text-amber-500 hover:bg-amber-500/15 rounded transition-all disabled:opacity-40">CLEAR</button>
                                <button onClick={generateMaze} disabled={state.isRunning} className="px-2 sm:px-2.5 py-1.5 text-[11px] font-medium text-purple-400 hover:bg-purple-500/15 rounded transition-all disabled:opacity-40">MAZE</button>
                                <button onClick={addSamplePoints} disabled={state.isRunning} className="px-2 sm:px-2.5 py-1.5 text-[11px] font-medium text-cyan-400 hover:bg-cyan-500/15 rounded transition-all disabled:opacity-40">DEMO</button>
                                <button onClick={clearGrid} disabled={state.isRunning} className="px-2 sm:px-2.5 py-1.5 text-[11px] font-medium text-gray-400 hover:bg-gray-500/15 rounded transition-all disabled:opacity-40">RESET</button>
                            </div>

                            {/* info button — for people who actually read instructions */}
                            <button
                                onClick={() => setShowInfo(true)}
                                className="px-2.5 py-1.5 text-[11px] font-medium text-zinc-500 hover:text-zinc-200 border border-zinc-800 hover:border-zinc-600 rounded-lg transition-all flex items-center gap-1.5"
                            >
                                <svg viewBox="0 0 16 16" className="w-3 h-3" fill="currentColor">
                                    <circle cx="8" cy="8" r="7" opacity="0.3"/>
                                    <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 3a1 1 0 110 2 1 1 0 010-2zm-1 4h2v4H7V8z"/>
                                </svg>
                                INFO
                            </button>
                        </div>
                    </div>
                </div>

                {/* ====== GRID AREA ====== */}
                <div className="flex-1 flex items-start sm:items-center justify-center p-2 sm:p-4 overflow-auto">
                    <div className="flex flex-col items-center gap-2">

                        {/* legend — the color key no one asked for but everyone needs */}
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] sm:text-xs text-gray-500 justify-center">
                            {[
                                { color: 'bg-emerald-500', label: 'START' },
                                { color: 'bg-rose-500', label: 'TARGET' },
                                { color: 'bg-slate-500', label: 'WALL' },
                                { color: 'bg-indigo-500/60', label: 'EXPLORED' },
                                { color: 'bg-amber-400', label: 'PATH' },
                            ].map(({ color, label }) => (
                                <div key={label} className="flex items-center gap-1.5">
                                    <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm ${color}`} />
                                    <span>{label}</span>
                                </div>
                            ))}
                        </div>

                        {/* the grid itself — 800 cells of joy */}
                        <div className="relative">
                            <div
                                className="grid gap-px bg-zinc-800/60 p-1.5 sm:p-2 rounded-xl shadow-2xl border border-zinc-700/50 select-none"
                                style={{ gridTemplateColumns: `repeat(${activeCols}, 1fr)` }}
                                onMouseUp={handleMouseUp}
                                onMouseLeave={handleMouseUp}
                                onTouchStart={handleTouchStart}
                                onTouchMove={handleTouchMove}
                                onTouchEnd={handleTouchEnd}
                            >
                                {state.grid.map((row, rowIndex) =>
                                    row.map((cell, colIndex) => (
                                        <div
                                            key={`${rowIndex}-${colIndex}`}
                                            className={`${getCellClassName(cell)} ${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`}
                                            data-row={rowIndex}
                                            data-col={colIndex}
                                            onMouseDown={() => handleMouseDown(rowIndex, colIndex)}
                                            onMouseEnter={() => handleMouseEnter(rowIndex, colIndex)}
                                            onDragStart={(e) => e.preventDefault()}
                                        />
                                    ))
                                )}
                            </div>

                            {/* glow border — purely cosmetic, 100% necessary */}
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/5 via-transparent to-indigo-500/5 pointer-events-none" />
                        </div>

                        {/* status message below the grid */}
                        <div className="text-center min-h-[20px] text-[11px] sm:text-sm font-medium">
                            {state.isRunning && (
                                <span className="text-white animate-pulse">⟳ EXECUTING {algorithm.toUpperCase()}...</span>
                            )}
                            {state.isComplete && !state.isRunning && state.stats.pathLength > 0 && (
                                <span className="text-emerald-400">✓ OPTIMAL PATH FOUND — {state.stats.pathLength} steps</span>
                            )}
                            {state.isComplete && !state.isRunning && state.stats.pathLength === 0 && (
                                <span className="text-rose-400">✗ NO PATH EXISTS (rip)</span>
                            )}
                            {!state.startNode && !state.isRunning && !state.isComplete && (
                                <span className="text-amber-400">▶ SELECT START MODE AND CLICK A CELL</span>
                            )}
                            {state.startNode && !state.endNode && !state.isRunning && (
                                <span className="text-amber-400">◉ NOW SELECT TARGET MODE AND CLICK A CELL</span>
                            )}
                            {state.startNode && state.endNode && !state.isRunning && !state.isComplete && (
                                <span className="text-cyan-400">READY — CLICK RUN OR DRAW SOME WALLS FIRST</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ====== INFO MODAL ====== */}
            {showInfo && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 fade-in">
                    <div className="bg-zinc-900 border border-zinc-700/80 rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl overflow-hidden slide-down">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 sticky top-0 bg-zinc-900 z-10">
                            <h2 className="text-base font-bold text-white flex items-center gap-2">
                                <svg viewBox="0 0 16 16" className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                                    <circle cx="8" cy="8" r="6.5" />
                                    <path d="M5 6.5c0-1.7 1.3-3 3-3s3 1.3 3 3c0 1.5-1 2.5-3 3v1" />
                                    <circle cx="8" cy="12" r="0.75" fill="currentColor" />
                                </svg>
                                HOW IT WORKS
                            </h2>
                            <button
                                onClick={() => setShowInfo(false)}
                                className="text-zinc-500 hover:text-white w-7 h-7 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-colors text-sm font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-5 overflow-y-auto text-zinc-400 space-y-5 text-sm">
                            <section>
                                <h3 className="text-white font-semibold mb-2">Interactive Grid</h3>
                                <ul className="space-y-1.5 list-disc pl-4 text-xs leading-relaxed">
                                    <li><strong className="text-zinc-200">Start & Target:</strong> Select the mode button then click any cell.</li>
                                    <li><strong className="text-zinc-200">Walls:</strong> Click and drag across the grid to draw barriers.</li>
                                    <li>Cells are connected to their 4 non-diagonal neighbors. No diagonals — we're not monsters.</li>
                                </ul>
                            </section>

                            <section>
                                <h3 className="text-white font-semibold mb-2">Algorithms</h3>
                                <div className="space-y-2">
                                    {[
                                        { name: 'Dijkstra', desc: 'Radiates outwards, guarantees shortest path. The OG.' },
                                        { name: 'BFS', desc: 'Level by level. Also guarantees shortest path on unweighted grids.' },
                                        { name: 'DFS', desc: 'Goes deep before backtracking. Fast but chaotic. Does NOT guarantee shortest path.' },
                                        { name: 'Bellman-Ford', desc: 'Edge relaxation logic via SPFA. Handles negative weights (not that we have any here).' },
                                    ].map(({ name, desc }) => (
                                        <div key={name} className="bg-zinc-800/50 px-3 py-2.5 rounded-lg border border-zinc-800/80">
                                            <p className="text-zinc-200 font-medium text-xs mb-1">{name}</p>
                                            <p className="text-xs leading-relaxed">{desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
