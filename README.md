# camera-hud

Attempting to overlay (relatively) realistic HUD graphics to captured images

# First order filter to smooth 'jitter' of values

This doesn't handle the supplied orientation values very well (negative numbers?)


```
function firstOrderFilter(inputValue, currentValue, filterValue = 5) {
  newValue = (inputValue + (currentValue * filter)) / (filter + 1)
}
```
