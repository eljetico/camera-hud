# First order filter to smooth 'jitter' of values

```
function firstOrderFilter(inputValue, currentValue, filterValue = 5) {
  newValue = (inputValue + (currentValue * filter)) / (filter + 1)
}
```

# Actual horizon calc: where horizontal line bisects vertical when device tilted

```
function get_length(angle, length) {
  var rad = radians(angle);
  return length * (Math.sin(rad)) / Math.sin(radians(90));
}
```
