# Reader 

Reader is a tool designed for people who don't have the ability to use a computer mouse in a normal way. It uses [Microsoft Azures Face API](https://azure.microsoft.com/en-us/services/cognitive-services/face/) to recognize the face of the user. This returns the pitch, roll & yaw of the users head. In javaScript these values are translated into a ball that follows the movement of the user, with this ball the user can scroll through the page. 

## How do I build this?

There are a few parts that you need for this to work:

* Acces to the Microsoft Azure API's
* Acces to the users webcam
* A little javaScript magic

### Step 1: Get acces to the Face API

To get the Face API to work you need to get a valid key for Microsoft Azure, after that Microsoft has entire [documentation](https://docs.microsoft.com/en-us/azure/cognitive-services/face/quickstarts/csharp) that guides you to set up an application that is connected to the API. 

### Step 2: Get data from the API

The API returns JSON. But it gives way more data than we really need, luckily we can decide which data we want the API to return:

```
string requestParameters = "returnFaceId=true&returnFaceLandmarks=false" +
                "&returnFaceAttributes=age,gender,headPose,smile,facialHair,glasses," +
                "emotion,hair,makeup,occlusion,accessories,blur,exposure,noise";
```

You can see that after `&returnFaceAttributes=` a lot of different data is being requested to the API, but for our program to work we only need `headPose` & `smile`, but ofcourse you can always add extra functionalities to your applictaion with all the other data. So what this will eventually look like is:

```
string requestParameters = "returnFaceId=true&returnFaceLandmarks=false" +
                "&returnFaceAttributes=headPose,smile"
```

But how do we get this data to work together with the rest of our javaScript? For this we need to dissect the JSON. If we ask the JSON to return us `headPose` this is what we see when we `console.log(json)`:

```
[0:
"faceAttributes:" {
    "headPose:" {
        pitch: -13.8
        roll: -1.6
        yaw: -8.5
        }
]
```

Say we want to get `pitch` from this JSON response, we have to dig our way inside the JSON by using the following syntax: `json[0]['faceAttributes'].headPose.pitch`.

If we want to use the pitch in our javaScript all we need to do is make a `var` with this information: `var pitch = json[0]['faceAttributes'].headPose.pitch`.

### Step 3: How to send webcam data to the API

The prototype that Microsoft offers only works with URL's from servers, but there is a way to send a snapshot from the webcam to the API. To start we need to create a `<video>` and a `<canvas>` element in our html file. Let's make a function that starts the webcam and puts that data into our `<video>` element:

```
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

startWebcam();
```

Now our webcam is streaming straight to our browser. Let's make a snapshot of this stream and put that inside our canvas:

```
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
```

Great! Now we can make snapshots from our webcam, but we actually want to stream video to the API. Unfortunatly that isn't possible right now, but there is a way around it: what if we automaticly send a picture to the API every 0.5 seconds?

```
function snapLoop() {
            takeSnap()
                .then(blob => {
                    analyseImage(blob, params, showResults);
                })
        }
        
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
        }
        
var intervalId = setInterval(snapLoop, 500);
```

Now we give the API an image every 0.5 seconds and we get JSON back from the API. Now we can actually do something with the data we recieve. We can get the pitch and yaw from our users face and turn it into a ball:

```
function showResults(json) {

            var pitch = json[0]['faceAttributes'].headPose.pitch;
            var yaw = json[0]['faceAttributes'].headPose.yaw;


            ball.style.bottom = 400 + pitch * 17 + 'px';
            ball.style.right = 600 + yaw * 22 + 'px';

        }
```

We now have created a ball that moves across the screen according to the users face. This can be a usefull tool for our user so he knows where the computer thinks his face is.

Now all there is left is to make an if statement that let's the user scroll through the page:

first make a variable that decides how much the program should scroll:
```
var scrollDistance = 300;
```

The following code is to be put in the `showResults()` function:

```
if (pitch < -20) {
                window.scroll(0, scrollDistance);
                scrollDistance = scrollDistance + 300;
            }
```

Now if the user looks down enough, the program will scroll the browserwindow down `300px` and will add another `300` to `scrollDistance` so when the next scroll comes around it scrolls another extra `300px`.
