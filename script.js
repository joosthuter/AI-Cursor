        var pitch;
        var yaw;
        var anger;
        var smile;

        var skrol = 300;

        var scrollPoint = 1;

        var ball = document.getElementById('ball');
        var gradient = document.getElementById('gradient');
        var body = document.getElementById('body');
        var pitchElement = document.getElementById('pitchElement');
        //var yawElement = document.getElementById('yawElement');

        var subscriptionKey = "59ac59db8e904d228bbaacdf3d93066c";
        var endpoint = "https://westeurope.api.cognitive.microsoft.com/";
        var uriBase = endpoint + "face/v1.0/detect";
        var webcamStream;


        var params = {
            "returnFaceId": "true",
            "returnFaceLandmarks": "false",
            "returnFaceAttributes": "headPose,smile,emotion,age"
        };




        function startWebcam() {
            var vid = document.querySelector('video');
            navigator.mediaDevices.getUserMedia({
                    video: true
                })
                .then(stream => {
                    webcamStream = stream;
                    vid.srcObject = stream;
                    return vid.play();
                })
        }

        function snapLoop() {
            takeSnap()
                .then(blob => {
                    analyseImage(blob, params, showResults);
                })
        }

        var intervalId = setInterval(snapLoop, 500);


        function takeSnap() {
            var vid = document.querySelector('video');
            var canvas = document.querySelector('canvas');
            var ctx = canvas.getContext('2d');
            canvas.width = vid.videoWidth;
            canvas.height = vid.videoHeight;
            ctx.drawImage(vid, 0, 0);
            return new Promise((res, rej) => {
                canvas.toBlob(res, 'image/jpeg');
            });
        }

        //        function stopWebcam() {
        //            var vid = document.querySelector('video');
        //            vid.srcObject.getTracks().forEach((track) => {
        //                track.stop();
        //            });
        //        }


        function analyseImage(image, params, proccessingFunction) {

            var paramString = Object.entries(params).map(([key, val]) => `${key}=${val}`).join('&');
            var urlWithParams = uriBase + "?" + paramString;

            fetch(urlWithParams, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/octet-stream",
                        "Ocp-Apim-Subscription-Key": subscriptionKey
                    },
                    processData: false,
                    body: image,
                })


                .then(response => response.json())
                .then(json => proccessingFunction(json))
                .catch(error => faceError());


        }

        function faceError() {
            pitchElement.textContent = 'I cant see your face very well';
            pitchElement.style.backgroundColor = 'rgba(252, 57, 57, 0.64)';
            ball.style.display = "none";
            body.style.overflowY = "scroll";

        }


        function showResults(json) {

            console.log(json)
            body.style.overflowY = "hidden";
            pitchElement.style.backgroundColor = 'rgba(56, 102, 255, 0.63)';

            // yawElement.style.display = "block";
            ball.style.display = "block";

            pitch = json[0]['faceAttributes'].headPose.pitch;
            yaw = json[0]['faceAttributes'].headPose.yaw;

            smile = json[0]['faceAttributes'].smile;

            var jsonString = JSON.stringify(json, null, 2);

            pitchElement.textContent = 'pitch: ' + pitch;
            //  yawElement.textContent = 'yaw: ' + yaw;



            ball.style.bottom = 400 + pitch * 17 + 'px';
            ball.style.right = 600 + yaw * 22 + 'px';

            if (pitch < -20) {

                gradient.style.opacity = '70';

            } else {
                gradient.style.opacity = '0';
            }

            if (pitch < -20 && smile > 0.5) {

                gradient.style.opacity = '0';


                pitch = 0;
                window.scroll(0, skrol);

                clearInterval(intervalId);

                setTimeout(function () {
                    intervalid = setInterval(snapLoop, 500);
                    skrol = skrol + 300;
                    console.log(skrol);
                }, 1000);
            }

            if (pitch > 20 && smile > 0.5) {

                pitch = 0;
                skrol = skrol - 300;
                window.scroll(0, skrol);

                clearInterval(intervalId);

                setTimeout(function () {
                    intervalid = setInterval(snapLoop, 500);
                    skrol = skrol - 300;
                    console.log(skrol);
                }, 1000);
            }


        }





        startWebcam();
