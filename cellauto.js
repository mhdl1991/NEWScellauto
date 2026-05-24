const canvas = document.getElementById('myCanvas')
const ctx = canvas.getContext('2d')

const ruleNumFld = document.getElementById('ruleNum')
const randomRule = document.getElementById('randomRule')
const setRule = document.getElementById('setRule')



let pauseSim = false						// pause simulation
let interval = 10
let frameCount = 0							// simulation animation speed controls
let wrapAround = true

const WIDTH = 768							// canvas dimensions
const HEIGHT = 440
const TILE_WIDTH = 4						// cell size
const TILE_HEIGHT = 4

const MAP_WIDTH = WIDTH / TILE_WIDTH
const MAP_HEIGHT = HEIGHT / TILE_HEIGHT

ctx.canvas.width = WIDTH
ctx.canvas.height = HEIGHT

let rule = 65535							// default rule
let rule_as_16bits = Array(16).fill(1)		// a whole array of 1s

let isPainting = false						// Mouse painting state
let paintValue = 1   						// 1 = draw, 0 = erase


const convertNumberToBits = (n) => {
	let _arr = Array(16).fill(0).map( (_,i) => ((n >> i) & 1) ) 
	return _arr
}

const updateTable = () => {
	for (let i = 0; i < 16; i++) {
		let row_id = `rule${i}`
		document.getElementById(row_id).textContent = `${rule_as_16bits[i]}`
	}
}

const randomRuleFunc = () => {
	rule = Math.floor(Math.random() * 65536)
	ruleNumFld.value = rule
	rule_as_16bits = convertNumberToBits(rule)
	updateTable()
}

const setRuleFunc = () => {
	rule = ruleNumFld.value
	rule_as_16bits = convertNumberToBits(rule)
	updateTable()
}
	
randomRule.addEventListener('click', randomRuleFunc)
setRule.addEventListener('click', setRuleFunc)

// Speed controls
const speedSlider = document.getElementById('speedSlider')
const speedLabel = document.getElementById('speedLabel')
 
const updateSpeedLabel = (val) => {
	val = parseInt(val)
	if (val === 1) {
		speedLabel.textContent = 'Full speed'
	} else {
		speedLabel.textContent = `1 step / ${val} frames`
	}
}

speedSlider.addEventListener('input', (e) => {
	interval = parseInt(e.target.value)
	updateSpeedLabel(interval)
})

// wraparound controls
const wrapAroundBtn = document.getElementById('wrapAroundBtn')

const toggleWraparound = () => {
	wrapAround = !wrapAround
	wrapAroundBtn.innerText = wrapAround ? "Wrap enabled" : "Wrap disabled"
}
wrapAroundBtn.addEventListener('click', toggleWraparound)

			
const clamp = (num, min, max) => Math.min( Math.max(num, min), max)

const choose = (_arr) => _arr[Math.floor( Math.random() * _arr.length)]
			
let worldMap = []
			
const initializeMap = () => Array(MAP_HEIGHT).fill(0).map( ()=> Array(MAP_WIDTH).fill(0) ) 

const randomizeMap = (start_x, start_y, end_x, end_y) => {
	let y, x
	randomMap = Array(MAP_HEIGHT).fill(0).map( ()=> Array(MAP_WIDTH).fill(0) ) 
	for (y = start_y; y < end_y; y++) {
		for (x = start_x; x < end_x; x++) {
			randomMap[y][x] = choose( [0, 1] )
		}
	}
	return randomMap
}

// get neighbors in surrounding cells
// return a number from 0 to 15
const getNeighbors = (mapCheck, x, y) => {
	let north, south, east, west
	if (wrapAround) {
		y_n = ((y - 1) + MAP_HEIGHT) % MAP_HEIGHT
		x_e = ((x + 1) + MAP_WIDTH) % MAP_WIDTH
		x_w = ((x - 1) + MAP_WIDTH) % MAP_WIDTH
		y_s = ((y + 1) + MAP_HEIGHT) % MAP_HEIGHT
		
		north = mapCheck[y_n][x]
		east = mapCheck[y][x_e]
		west = mapCheck[y][x_w]
		south = mapCheck[y_s][x]
	} else {
		y_n = (y - 1)
		x_e = (x + 1)
		x_w = (x - 1)
		y_s = (y + 1)
		
		north = y_n >= 0 ? mapCheck[y_n][x] : 0
		east = x_e < MAP_WIDTH ? mapCheck[y][x_e] : 0
		west = x_w >= 0 ? mapCheck[y][x_w] : 0
		south = y_s < MAP_HEIGHT ? mapCheck[y_s][x] : 0
	}
	return clamp(north + (east * 2) + (west * 4) + (south * 8), 0, 15)
}
		
const updateMap = (oldMap) => {
	let newMap = Array(MAP_HEIGHT).fill(0).map( ()=> Array(MAP_WIDTH).fill(0) )
	
	let x, y, currentTile
	for (y = 0; y < MAP_HEIGHT; y++) {
		for (x = 0; x < MAP_WIDTH; x++) {
			newMap[y][x] = oldMap[y][x] 				// default fallback
			neighborhood = getNeighbors(oldMap, x, y)	// neighborhood as number from 0 to 15
			newMap[y][x] = rule_as_16bits[neighborhood]	// 
		}
	}
	
	return newMap
}

const draw = (worldMap) => {
	ctx.clearRect(0, 0, WIDTH, HEIGHT);
	ctx.fillStyle = "rgb(0 0 0)";
	ctx.fillRect(0, 0, WIDTH, HEIGHT);
	
	// draw each tile
	let x, y
	for (y = 0; y < MAP_HEIGHT; y++) {
		for (x = 0; x < MAP_WIDTH; x++) {
			ctx.fillStyle = (worldMap[y][x] == 1) ? "rgb(255 255 255)" : "rgb(0 0 0)"
			ctx.fillRect(x * TILE_WIDTH, y * TILE_HEIGHT, TILE_WIDTH, TILE_HEIGHT)
		} 
	}
	
}

// Mouse painting
 
const getCellFromEvent = (e) => {
	const rect = canvas.getBoundingClientRect()
	// Account for any CSS scaling between canvas logical size and displayed size
	const scaleX = WIDTH / rect.width
	const scaleY = HEIGHT / rect.height
	const cx = Math.floor((e.clientX - rect.left) * scaleX / TILE_WIDTH)
	const cy = Math.floor((e.clientY - rect.top)  * scaleY / TILE_HEIGHT)
	return {
		x: clamp(cx, 0, MAP_WIDTH - 1),
		y: clamp(cy, 0, MAP_HEIGHT - 1)
	}
}
 
const paintCell = (e) => {
	const { x, y } = getCellFromEvent(e)
	worldMap[y][x] = paintValue
	draw(worldMap)
}
 
canvas.addEventListener('mousedown', (e) => {
	e.preventDefault()
	isPainting = true
	// Left-click = draw, right-click = erase
	paintValue = (e.button === 2) ? 0 : 1
	paintCell(e)
})
 
canvas.addEventListener('mousemove', (e) => {
	if (!isPainting) return
	e.preventDefault()
	paintCell(e)
})
 
canvas.addEventListener('mouseup',    () => { isPainting = false })
canvas.addEventListener('mouseleave', () => { isPainting = false })
canvas.addEventListener('contextmenu', (e) => e.preventDefault())  // suppress right-click menu



const pauseBtn = document.getElementById('pauseBtn')
const clearBtn = document.getElementById('clearBtn')
const stepBtn = document.getElementById('stepBtn')
const randomizeGridBtn = document.getElementById('randomizeGridBtn')

const pause = () => {
	pauseSim = !pauseSim
	pauseBtn.innerText = !pauseSim ? "Pause" : "Unpause"
}

const clear = () => {worldMap = initializeMap()}

const randomGrid = () => {worldMap = randomizeMap(0, 0, MAP_WIDTH, MAP_HEIGHT)}

const step = () => {
	worldMap = updateMap(worldMap)
}


pauseBtn.addEventListener('click', pause)
clearBtn.addEventListener('click', clear)
stepBtn.addEventListener('click', step)
randomizeGridBtn.addEventListener('click', randomGrid)

const init = () => {
	updateSpeedLabel(interval)
	randomRuleFunc()
	randomGrid()
	window.requestAnimationFrame(update)
}

const update =() => {
	if (!pauseSim) { 
		if (frameCount > interval) {step(); frameCount = 0}
		frameCount++
	}

	draw(worldMap)
	
	window.requestAnimationFrame(update)
}

	
init()