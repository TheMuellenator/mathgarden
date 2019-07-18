/*jshint esversion: 6 */

/*
Pre-Processing Steps & How to Prepare Image Data
1. Load Image
2. Convert to Grayscale with only 1 Channel
3. Convert to Black and White
4. Find Contours or Edges of Drawing
5. Find Bounding Rectangle of Drawing (Region of Interest)
6. Crop Image - remove blank space
7. Calculate scaled down dimensions (long edge = 20px)
8. Resize Image to scale down
9. Add padding to make 28x28
10. Calculate the center of mass
11. Shift Image in X and Y Direction
12. Show Processed Image on Screen
13. Scale to pixel values to numbers between 0 and 1
14. Create Tensor with Image Data
15. Make Prediction
*/

var model;

async function loadModel() {
    model = await tf.loadGraphModel("model/model.json");
//  model = await tf.loadGraphModel("https://angelabauer.github.io/TFJS/data/model.json");

}

function predictImage() {

    // 1. Load Image
    let image = cv.imread(canvas);

    // Show Dimensions & how to access rows and columns
    // console.log('Org Canvas rows: ' + image.rows + ' columns: ' + image.cols);

    /* 2. Convert color space.
    Need white object and blackground black background
    https://docs.opencv.org/3.3.1/d4/d73/tutorial_py_contours_begin.html
    https://docs.opencv.org/3.4/db/d64/tutorial_js_colorspaces.html
    cv.cvtColor (input, output, colourCode, outputChannels = 0)
    */
    cv.cvtColor(image, image, cv.COLOR_RGBA2GRAY, 0);

    /* 3. Convert to Black & White
    If pixel value is greater than a threshold value,
    it is assigned one value (e.g.,white), else it is assigned another
    value (e.g., black). Gets rid of grey values
    https://docs.opencv.org/3.3.1/d7/dd0/tutorial_js_thresholding.html
    cv.threshold (source, destination, threshold, maxval, type)
    */
    cv.threshold(image, image, 177, 255, cv.THRESH_BINARY);

    /* 4. Find Contours/Edges
    https://docs.opencv.org/3.4/d5/daa/tutorial_js_contours_begin.html
    cv.findContours (image, contours, hierarchy, mode, method, offset = new cv.Point(0, 0))
    */
    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();
    cv.findContours(image, contours, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE);
    let cnt = contours.get(0);

    // 5. Find bounding rectangle (for cropping image)
    const rect = cv.boundingRect(cnt);

    // 6. Crop Image to Region of Interest (ROI)
    image = image.roi(rect);

    console.log('Rows in cropped image: ' + image.rows);
    console.log('Column in cropped image: ' + image.cols);

    var newSize;

    // 7. Calculate Dimensions where long edge is 20px
    if (image.rows > image.cols) {
        // Tall and Narrow:
        const scaleFactor = image.rows / 20;
        const newTargetWidth = Math.round(image.cols / scaleFactor);
        newSize = new cv.Size(newTargetWidth, 20);
    } else {
        // Short and Wide
        const scaleFactor = image.cols / 20;
        const newTargetHeight = Math.round(image.rows / scaleFactor);
        newSize = new cv.Size(20, newTargetHeight);
    }
    console.log('Width: ' + newSize.width + ', Height: ' + newSize.height);

    /* 8. Resize Image
    https://docs.opencv.org/3.4/dd/d52/tutorial_js_geometric_transformations.html
    cv.resize (src, dst, dsize, fx = 0, fy = 0, interpolation = cv.INTER_LINEAR)
    */
    cv.resize(image, image, newSize, 0, 0, cv.INTER_AREA);

    /* 9. Add padding
    Long edge currently 20px. Image needs to be 28x28 so must work out padding
    Round one padding up & round one down to get 28x28 not 29x28
    */
    const TOP = Math.ceil(4 + (20 - image.rows) / 2);
    const BOTTOM = Math.floor(4 + (20 - image.rows) / 2);
    const LEFT = Math.ceil(4 + (20 - image.cols) / 2);
    const RIGHT = Math.floor(4 + (20 - image.cols) / 2);
    console.log('top: ' + TOP + ', bottom: ' + BOTTOM + ', left: ' + LEFT, ', right:' + RIGHT);

    const BLACK = new cv.Scalar(0, 0, 0, 0);
    // https://docs.opencv.org/3.4/de/d06/tutorial_js_basic_ops.html
    // cv.copyMakeBorder(src, dst, top, bottom, left, right, cv.BORDER_CONSTANT, colourValue);
    cv.copyMakeBorder(image, image, TOP, BOTTOM, LEFT, RIGHT, cv.BORDER_CONSTANT, BLACK);
    console.log('Added padding. Width: ' + image.rows + ', Height: ' + image.cols);

    /* 10. Center of Mass Calculation
    First find the contours of the cropped and scaled image.
    Then calculate Moments (M00, M10, M01) to work out the center of mass
    */
    cv.findContours(image, contours, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE);
    cnt = contours.get(0);
    const Moments = cv.moments(cnt, false);

    // might get bad segmentation and M00 is 0 -> runtime error
    // If m00 is 0, then dividing by zero. Occasionally get NAN for strange shapes!
    // https://docs.opencv.org/3.4/dc/dcf/tutorial_js_contour_features.html
    const cx = Moments.m10 / Moments.m00;
    const cy = Moments.m01 / Moments.m00;
    console.log('M00: ' + Moments.m00 + ' cx: ' + cx + ' cy: ' + cy);

    /* 11. Shifting Image to centre of mass
    Work out shift in X and Y direction.
    Then use warpAffine to shift image.
    https://docs.opencv.org/3.4/dd/d52/tutorial_js_geometric_transformations.html
     */
    newSize = new cv.Size(image.rows, image.cols);

    const Y_SHIFT = Math.round(newSize.height / 2.0 - cy);
    const X_SHIFT = Math.round(newSize.width / 2.0 - cx);
    const M = cv.matFromArray(2, 3, cv.CV_64FC1, [1, 0, X_SHIFT, 0, 1, Y_SHIFT]);

    cv.warpAffine(image, image, M, newSize, cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());

    // 12. Show processed image on screen!
    // cv.imshow('canvasOutput', image);

    /* 13. Divide by 255 to scale to between 0 and 1
    https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Pixel_manipulation_with_canvas
    Uint8ClampedArray 1-D array in RGBA order.
    */
    let imgData = image.data;
    let scaledArray = imgData.map(function (item) {
        return item / 255;
    });
    console.log('Scaled Array Length: ' + scaledArray.length);
    console.log('Scaled Array Contents: ' + scaledArray);

    /* 14. Create Tensor
    By default getting data type of int32 for some reason.
    Need to convert to float.
    console.log("Tensor data type: " + data.dtype);
    */
    let data = tf.tensor([scaledArray]);
    console.log('Shape of Tensor: ' + data.shape);

    /* 15. Prediction: Feed into Tensorflow MODEL
    Convert tensor to floating point numbers (required by MODEL).
    console.log("Cast Tensor data type: " + data.toFloat().dtype);
    https://js.tensorflow.org/api/0.6.1/#print
    https://js.tensorflow.org/api/0.6.1/#tf.Model.predict
    To get actual numbers out of tensor use .dataSync() which returns array
    */
    let result = model.predict(data.toFloat());
    // result.print(); // will print result

    // Cleanup. Free memory up again.
    image.delete();
    contours.delete();
    hierarchy.delete();
    cnt.delete();
    M.delete();


    let output =  result.dataSync()[0];
    console.log("Tensorflow model Prediction: " + output);
    return output;


}
