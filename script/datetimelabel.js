class DateTimeLabel {
  // yPos is key
  constructor (canvas) {
    this.text = "-"
    this.canvas = canvas
    this.ctx = canvas.getContext("2d")
    this.ctx.font = "15px ui-monospace"

    // Measurements
    this.height = this.canvas.height
    this.xPos = this.canvas.width - 15

    // Styles
    this.ctx.fillStyle = "rgba(255, 255, 255, 0.6)"
    this.ctx.textBaseline = "bottom"
    this.ctx.textAlign = "right"
  }

  getDateString(d) {
    let yr = d.getFullYear().toString().substr(2, 2) // remove '20' from year
    let mn = this.pad2(d.getUTCMonth() + 1)
    let dy = this.pad2(d.getUTCDate())
    return yr + "" + mn + "" + dy
  }

  getTimeString (d) {
    let hr = this.pad2(d.getUTCHours())
    let mn = this.pad2(d.getUTCMinutes())
    let ss = this.pad2(d.getUTCSeconds())
    return hr + "" + mn + "" + ss
  }

  pad2 (num) {
     return (num < 10 ? '0' : '') + num
  }

  update () {
    let d = new Date()
    let dateString = this.getDateString(d)
    let timeString = this.getTimeString(d)

    this.ctx.fillText(timeString, this.xPos, this.height - 15)
    this.ctx.fillText(dateString, this.xPos, this.height - 35)
  }
}
