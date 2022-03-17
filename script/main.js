var artificialHorizon = (function() {
  var constraints = { video: { facingMode: "environment" }, audio: false };

  var cameraView, cameraOutput, cameraSensor, cameraTrigger;
  var canvas, context, canvasStatic, contextStatic, hud;
  var strokeStyle = "rgba(255, 255, 255, 0.6)";
  var lineWidth = 1;

  var aspectRatio = 0, diameter = 0, radius = 0;
  var horizon = 0, pitch = 0, roll = 0, _rawPitch = 0, _rawRoll = 0;
  var aX = 0, aY = 0, aZ = 0;

  var pitchConstant = 0; // calculated from canvas height

  var limitHorizonScale = true;
  var drawEnclosingCircle = false;
  var drawBoundingBox = true;

  var frameWidth = 10;

  function cameraStart() {
    navigator.mediaDevices
        .getUserMedia(constraints)
        .then(function(stream) {
          cameraView.srcObject = stream;
          // const track = stream.getVideoTracks()[0];
          // imageCapture = new ImageCapture(track);
        })
    .catch(function(error) {
        console.error("Oops. Something is broken.", error);
    });
  }

  function calculatePitch(_roll) {
    var result = -Math.atan2(aZ, aX * Math.sin(_roll) + aY * Math.cos(_roll));
    return result;
  }

  function draw(timestamp) {
    roll = Math.atan2(aX, aY);
    pitch = calculatePitch(roll);

    repaint();

    window.requestAnimationFrame(draw);
  }

  function drawCanvas(canvas, img) {
    canvas.width = getComputedStyle(canvas).width.split('px')[0];
    canvas.height = getComputedStyle(canvas).height.split('px')[0];
    let ratio  = Math.min(canvas.width / img.width, canvas.height / img.height);
    let x = (canvas.width - img.width * ratio) / 2;
    let y = (canvas.height - img.height * ratio) / 2;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    canvas.getContext('2d').drawImage(img, 0, 0, img.width, img.height,
      x, y, img.width * ratio, img.height * ratio);
  }

  function drawDate(canvas) {
    var ctx = canvas.getContext('2d');
    var str = getDateString();
    ctx.font = "15px ui-monospace";
    ctx.fillStyle = strokeStyle;
    ctx.textBaseline = "bottom";
    ctx.textAlign = "right";
    var text = ctx.measureText(str);
    var width = text.width;
    var x = canvas.width - 15;
    var y = canvas.height - 15;
    ctx.fillText(str, x, y);
  }

  function drawTime(canvas) {
    var ctx = canvas.getContext('2d');
    var str = getTimeString();
    ctx.font = "15px ui-monospace";
    ctx.fillStyle = strokeStyle;
    ctx.textBaseline = "bottom";
    ctx.textAlign = "right";
    var text = ctx.measureText(str);
    var width = text.width;
    var x = canvas.width - 15;
    var y = canvas.height - 35;
    ctx.fillText(str, x, y);
  }

  function repaint() {
    context.save(); // Preserve our drawing

    context.clearRect(0, 0, canvas.width, canvas.height); // remove previous render

    context.translate(radius, radius);
    context.rotate(roll);

    // draw containing circle
    context.beginPath();
    context.arc(0, 0, radius - 4, 0, 2 * Math.PI, false);

    if (drawEnclosingCircle) {
      context.lineWidth = 1;
      context.stroke();
    }

    context.clip();

    var scaleWidth = canvas.width / 2;
    var xScaleWidth = scaleWidth * 1.5;

    // draw 'tape' container and clip content
    context.beginPath();
    context.rect( -xScaleWidth / 2, -diameter, xScaleWidth, 2 * diameter); // width of line
    context.clip();

    // draw scale
    // drawScaleBars(scaleWidth);

    drawFlatHorizonLine();

    context.restore();
  }

  function drawScaleBars(scaleWidth) {
    drawScale(48, scaleWidth * 1.0);
    // drawScale(42, scaleWidth * 0.1);
    drawScale(36, scaleWidth * 0.8);
    // drawScale(30, scaleWidth * 0.1);
    drawScale(24, scaleWidth * 0.6);
    // drawScale(18, scaleWidth * 0.1);
    drawScale(12, scaleWidth * 0.4);
    // drawScale(6, scaleWidth * 0.1);
  }

  function toGrayscale(canvas) {
    var ctx = canvas.getContext("2d");
    var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    for (var i = 0; i < imageData.data.length; i+=4) {
      var luma = Math.floor(imageData.data[i] * 0.3 +
        imageData.data[i+1] * 0.59 +
        imageData.data[i+2] * 0.11);
        imageData.data[i] = imageData.data[i+1] = imageData.data[i+2] = luma;
        imageData.data[i+3] = 255;
    }

    return imageData;
  }

  // Static HUD is always full screen
  function drawStaticHud() {
    drawCrosshair();
  }

  function drawCrosshair() {
    var cX = canvasStatic.width / 2;
    var cY = canvasStatic.height / 2;

    contextStatic.save();
    contextStatic.beginPath();

    contextStatic.moveTo(cX - 40, cY); // left h
    contextStatic.lineTo(cX - 5, cY);

    contextStatic.moveTo(cX + 5, cY); // right h
    contextStatic.lineTo(cX + 40, cY);

    contextStatic.stroke();

    // drawBoundingBoxLines(contextStatic);
    contextStatic.restore();
  }

  function drawBoundingBoxLines(ctx) {
    if (!drawBoundingBox) {
      return true;
    }

    var cY = canvasStatic.height / 2;
    var length = canvasStatic.height / 2;
    var col = (canvasStatic.width / 6);

    // Left box
    ctx.beginPath();
    ctx.moveTo(col, cY - (length / 2));
    ctx.lineTo(col, cY + (length / 2));

    // Left box top 'ear'
    ctx.moveTo(col - 10, cY - (length / 2));
    ctx.lineTo(col, cY - (length / 2));

    // Left box lower 'ear'
    ctx.moveTo(col - 10, cY + (length / 2));
    ctx.lineTo(col, cY + (length / 2));

    // Right box
    ctx.moveTo(col * 5, cY - (length / 2));
    ctx.lineTo(col * 5, cY + (length / 2));

    // Right box top 'ear'
    ctx.moveTo(col * 5, cY - (length / 2));
    ctx.lineTo((col * 5) + 10, cY - (length / 2));

    // Right box lower 'ear'
    ctx.moveTo(col * 5, cY + (length / 2));
    ctx.lineTo((col * 5) + 10, cY + (length / 2));

    ctx.stroke();
  }

  function drawFlatHorizonLine() {
    var yPos = getHorizon(pitch); // pitch already in radians

    var txt = (_rawPitch > 90) ? 'DWN' : 'UP';
    if (_rawPitch == 90) { txt = "><" };

    context.save();
    context.beginPath();
    context.moveTo(-diameter, yPos);
    context.lineTo(2 * diameter, yPos);
    context.stroke();

    drawHorizonConnector(yPos);

    context.restore();
  }

  function drawHorizonConnector(yPos) {
    context.beginPath();
    context.moveTo(0, yPos);
    context.lineTo(0, 0);
    context.stroke();
  }

  function drawScale(offset, scaleWidth) {
    // scaleWidth = limitHorizonScale ? radius / 1.5 : scaleWidth;

    context.save();
    // context.setLineDash([10, 10])
    context.beginPath();
    context.rect(-scaleWidth / 2, -diameter, scaleWidth, 2 * diameter); // width of line
    context.clip();

    // Lower scale line
    h = getHorizon(pitch + offset * Math.PI / 180);
    context.beginPath();
    context.moveTo(-diameter, h);
    context.lineTo(2 * diameter, h);
    context.stroke();

    // Upper scale line
    h = getHorizon(pitch - offset * Math.PI / 180);
    context.beginPath();
    context.moveTo(-diameter, h);
    context.lineTo(2 * diameter, h);
    context.stroke();

    // context.setLineDash([]);
    context.restore();
  }

  function radians(degs) {
    return degs * Math.PI / 180;
  }

  function updateAccelerations(evt) {
    if (!evt || !evt.accelerationIncludingGravity) {
      return;
    }

    var accelData = evt.accelerationIncludingGravity;

    var _aX = accelData.x;
    var _aY = accelData.y;
    var _aZ = accelData.z;

    if (aspectRatio > 1 && _rawRoll > 0) {
      aX = _aY;
      aY = -_aX;
    } else if (aspectRatio > 1 && _rawRoll <= 0) {
      aX = -_aY;
      aY = _aX;
    } else {
      aX = _aX;
      aY = _aY;
    }

    aZ = _aZ;
  }

  function updateOrientations(evt) {
    if (!evt || evt.gamma == null) {
      return;
    }

    _rawRoll = evt.gamma;
    _rawPitch = evt.beta;
  }

  function getDateString() {
    var d = new Date();
    var yr = d.getFullYear().toString().substr(2, 2); // remove '20' from year
    var mn = pad2(d.getUTCMonth() + 1);
    var dy = pad2(d.getUTCDate());
    return yr + "" + mn + "" + dy;
  }

  function getTimeString() {
    var d = new Date();
    var hr = pad2(d.getUTCHours());
    var mn = pad2(d.getUTCMinutes());
    var ss = pad2(d.getUTCSeconds());
    return hr + "" + mn + "" + ss;
  }

  function getHorizon(radians) {
    return Math.sin(radians) * radius;
  }

  function pad2(number) {
     return (number < 10 ? '0' : '') + number;
  }

  function run() {
    hud.onclick = function() {
      if (window.DeviceOrientationEvent) {
        DeviceOrientationEvent.requestPermission()
        .then(response => {
          if (response == "granted") {
            window.addEventListener('devicemotion', updateAccelerations, true);
            window.addEventListener('deviceorientation', updateOrientations, true);
            hud.textContent = "ACTIVE";
          }
        });
      } else {
        alert("No Events");
        hud.textContent = "DENIED";
      }
    };

    cameraTrigger.onclick = function() {
      // ORIGINAL PHOTO
      cameraSensor.width = cameraView.videoWidth + (frameWidth * 2);
      cameraSensor.height = cameraView.videoHeight + (frameWidth * 2);
      var cameraSensorContext = cameraSensor.getContext("2d");

      // draw frame
      cameraSensorContext.strokeStyle = "black";
      cameraSensorContext.lineWidth = frameWidth;
      cameraSensorContext.strokeRect(0, 0, cameraSensor.width, cameraSensor.height);

      // add image
      cameraSensorContext.save();
      // cameraSensorContext.filter = "grayscale(100%) contrast(20%)";
      cameraSensorContext.drawImage(cameraView, frameWidth, frameWidth);
      cameraSensorContext.restore();

      // HORIZON AND SCALE
      // Need to scale the canvas to camera-size and center it in the
      // image canvas
      var hFactor = cameraView.videoWidth / canvas.width; // will be square
      var vFactor = cameraView.videoHeight / canvas.height;

      context.save();
      context.scale(hFactor, hFactor);

      var nX = ((cameraView.videoWidth - canvas.width) / 2) + frameWidth;
      var nY = ((cameraView.videoHeight - canvas.height) / 2) + frameWidth;

      cameraSensorContext.drawImage(canvas, nX, nY);
      context.restore();

      // STATIC HUD
      hFactor = cameraView.videoWidth / canvasStatic.width;
      vFactor = cameraView.videoHeight / canvasStatic.height;

      contextStatic.save();

      contextStatic.scale(hFactor, vFactor);
      nX = ((cameraView.videoWidth - canvasStatic.width) / 2) + frameWidth;
      nY = ((cameraView.videoHeight - canvasStatic.height) / 2) + frameWidth;

      cameraSensorContext.drawImage(canvasStatic, nX, nY);
      drawTime(cameraSensor); // we don't want these in UI
      drawDate(cameraSensor);

      // Finally, grayscale the image
      var grayImageData = toGrayscale(cameraSensor);
      cameraSensorContext.clearRect(0, 0, nX, nY);
      cameraSensorContext.putImageData(grayImageData, 0, 0);

      contextStatic.restore();

      cameraOutput.src = cameraSensor.toDataURL("image/jpeg");
      cameraOutput.classList.add("taken");
    };

    draw();
  }

  return {
    initAndRun: function() {
      cameraView = document.querySelector("#camera--view"),
      cameraOutput = document.querySelector("#camera--output"),
      cameraSensor = document.querySelector("#camera--sensor"),
      cameraTrigger = document.querySelector("#camera--trigger");

      cameraStart();

      hud = document.getElementById("hud");

      canvas = document.getElementById("horizon");
      context = canvas.getContext("2d");
      context.strokeStyle = strokeStyle;
      context.lineWidth = lineWidth;

      canvasStatic = document.getElementById("hudStatic");
      canvasStatic.height = document.body.clientHeight;
      canvasStatic.width = document.body.clientWidth;
      contextStatic = canvasStatic.getContext("2d");
      contextStatic.strokeStyle = strokeStyle;
      contextStatic.lineWidth = lineWidth;

      // calculate pitchConstant based on canvasStatic height
      pitchConstant = (canvasStatic.height / 2) * Math.sin(radians(90)); // use degrees here

      aspectRatio = document.body.clientWidth / document.body.clientHeight;
      diameter = canvas.height;
      radius = diameter / 2;

      drawStaticHud();

      run();
    }

  };

})();

window.addEventListener("load", function() {
  artificialHorizon.initAndRun();
}, false);
