function GrayscaleFilter () {
  this.filter = function (imageData) {
    for (var i = 0; i < imageData.data.length; i+=4) {
      var luma = Math.floor(imageData.data[i] * 0.3 +
        imageData.data[i+1] * 0.59 +
        imageData.data[i+2] * 0.11);
      imageData.data[i] = imageData.data[i+1] = imageData.data[i+2] = luma;
      imageData.data[i+3] = 255;
    }

    return imageData;
  }
}
