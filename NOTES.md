# First order filter to smooth 'jitter' of values

function firstOrderFilter(inputValue, currentValue, filterValue = 5) {
  newValue = (inputValue + (currentValue * filter)) / (filter + 1)
}
