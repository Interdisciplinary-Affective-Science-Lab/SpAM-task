// first we need to create a stage
var stage = new Konva.Stage({
    container: 'container',   // id of container <div>
    width: 500,
    height: 500
});

// then create layer
var layer = new Konva.Layer();

// create our text
var text = new Konva.Text({
    x: stage.getWidth() / 2,
    y: stage.getHeight() / 2,
    text: 'happiness',
});
text.draggable('true');

// add the shape to the layer
layer.add(text);

// add the layer to the stage
stage.add(layer);


function fitStageIntoParentContainer() {
    var container = document.querySelector('#container');

    var containerWidth = container.offsetWidth;
    var containerHeight = container.offsetHeight;


    stage.width(containerWidth);
    stage.height(containerHeight);
    stage.draw();
}

fitStageIntoParentContainer();
// adapt the stage on any window resize
window.addEventListener('resize', fitStageIntoParentContainer);
