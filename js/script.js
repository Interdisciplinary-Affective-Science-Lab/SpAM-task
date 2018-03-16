var uploadedConfig = false;

$('#configUpload').change(function(evt){
    $('#config-name').text(this.files[0].name);
    processCSV(evt, onConfigReceive);
    uploadedConfig = true;
});

$('#instructionUpload').change(function(e){
    $('#instruction-name').text(this.files[0].name);
    processCSV(e, onInstructionReceive);
});

var participantId;

$('#startButton').click(function(e){
    startInstructions();
    participantId = $('#participantId').val();

    if(!uploadedConfig){
        $.ajax({
            url: "csv/gridwords.csv",
            type: 'get',
            success: function(csvData){
                data = $.csv.toObjects(csvData);
                onConfigReceive(data);
            }
        });
    }
});

$('#nextButton').click(function(e){
    var container = $('#instructionsContainer');
    var active = container.find('.activeInstruction');
    active.removeClass('activeInstruction');
    if(active.next().length>0){
        active.next().addClass('activeInstruction');
    } else {
        startAssociation();
    }
});

$('#prevButton').click(function(e){
    var container = $('#instructionsContainer');
    var active = container.find('.activeInstruction');
    if(active.prev().length>0){
        active.removeClass('activeInstruction');
        active.prev().addClass('activeInstruction');
    } else {
        backToConfig();
    }
});

/**
 * Handle receiving the CSV data. 
 *
 * @param data the CSV data, as a javascript object.
 *
 */
function onConfigReceive(data) {
    if (verifyConfig(data)) {
        // Config is valid, start the word association
        shuffleLocations(data);
        instantiateKonva(data);
    } else {
        alert('No data to import!');
    }
}


/**
 * Handle receiving the instuction data. 
 *
 * @param data the CSV data, as a javascript object.
 *
 */
function onInstructionReceive(data) {
    if (verifyConfig(data)) {
        setupInstructions(data);
    } else {
        alert('No data to import!');
    }
}

/**
 * Method that checks that the browser supports the HTML5 File API
 *
 * @return Whether or not the browser supports File API
 */
function browserSupportFileUpload() {
    var isCompatible = false;
    if (window.File && window.FileReader && window.FileList && window.Blob) {
        isCompatible = true;
    }
    return isCompatible;
}

/**
 * Method that reads and processes the selected file
 *
 * @param evt the upload Event from addEventListener
 * @param callback a function(object) to be called once CSV is loaded.
 *
 * @return the processed data as an object
 */
function processCSV(evt, callback) {
    if (!browserSupportFileUpload()) {
        alert('The File APIs are not fully supported in this browser!');
    } else {
        var data = null;
        var file = evt.target.files[0];
        var reader = new FileReader();
        reader.readAsText(file);
        reader.onload = function(event) {
            var csvData = event.target.result;
            var data = $.csv.toObjects(csvData);
            // Send the data back to the callback
            callback(data);
        };
        reader.onerror = function() {
            alert('Unable to read ' + file.fileName);
        };
    }
}

/**
 * Check if the configuration data is valid.
 *
 * @param data the data object after parsing. Should be array or object.
 *
 * @return whether or not it is valid.
 */
function verifyConfig(data){
    return data && data.length > 0;
}

// Hide the config screen (csv upload etc.)
// And show the instructions
function startInstructions(){
    $("#configScreen").hide();
    $("#instructionScreen").show();
}

// Hide the instructions screen 
// And go back to config screen
function backToConfig(){
    $("#configScreen").show();
    $("#instructionScreen").hide();
}

// Hide the instructions
// And show the konva canvas
function startAssociation(){
    $("#instructionScreen").hide();
    $("#associationScreen").show();
}

// Hide the association screen, show the done screen
function showDoneScreen(){
    $("#associationScreen").hide();
    $("#doneScreen").show();
}

/**
 * shuffle the xy coordinates among the words
 *
 * @param words Array of {WORD,X,Y} objects
 *
 * @return Array with (X,Y) coordinates shuffled amongst the words
 */
function shuffleLocations(words){
    for (var i = words.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tempx = words[i].X;
        var tempy = words[i].Y;
        words[i].X = words[j].X;
        words[i].Y = words[j].Y;
        words[j].X = tempx;
        words[j].Y = tempy;
    }

}


/**
 * Set up the instructions screen. Putting in the instruction texts.
 *
 * @param instructions the text objects
 */
function setupInstructions(instructions){
    var container = $('#instructionsContainer');
    container.empty();
    $(instructions).each(function(idx, text){
        var s = $('<p>'+text.TEXT+'</p>');
        container.append(s);
    });
    container.children().first().addClass("activeInstruction");
}

/**
 * Sets up the Konva stage and adds in the Text objects
 *
 * @param words is an array of {WORD,X,Y} objects to be displayed.
 */
function instantiateKonva(words){
    // first we need to create a stage
    var stage = new Konva.Stage({
        container: 'container',   // id of container <div>
        width: 500,
        height: 500
    });

    // then create layer for texts
    var layer = new Konva.Layer();
    stage.add(layer);

    // Keep track of Text objects for data collection
    var texts = [];

    // Add white background so that black text will show up.
    var backg = new Konva.Rect({
        width: stage.width(),
        height: stage.height(),
        x: 0,
        y: 0,
        fill: 'white'
    });
    layer.add(backg);


    // Resize the stage with the webpage.
    function resizeStage() {
        var container = $(window);

        var containerWidth = container.width();
        var containerHeight = container.height();

        stage.width(containerWidth);
        stage.height(containerHeight);

        backg.width(containerWidth);
        backg.height(containerHeight);

        stage.draw();
    }

    resizeStage();
    // adapt the stage on any window resize
    $(window).resize(resizeStage);



    // Create a group to batch drag text objects
    var dragGroup = new Konva.Group({
        draggable: true
    });
    // We use the background to detect clicking to ungroup, as well as dragging for rectangular select.

    // First we make a rectangle for the selection
    var selectRect = new Konva.Rect({
        x: 0, y: 0, width: 0, height: 0, fill: 'grey', opacity: 0.4, stroke: 'black', strokeWidth: 1});
    selectRect.listening(false); // ensure mousemove propagates through rect.
    layer.add(selectRect);
    var posStart;
    var posNow;
    var drawing = false;

    // start drawing the rectangle on mouse down.
    backg.on('mousedown', function(e){ 
        drawing = true;
        posStart = {x: e.evt.layerX, y: e.evt.layerY};
        posNow = {x: e.evt.layerX, y: e.evt.layerY}; 
        // set the selection rectangle
        setRectCorners(selectRect, posNow, posStart);
        selectRect.visible(true);
        selectRect.moveToTop();
        layer.draw();
        // disable text listening so mousemove propagates down to backg
        $.each(texts, function(idx, t){
            t.listening(false);
        });
    });

    // update the rubber rect on mouse move - note use of 'mode' var to avoid drawing after mouse released.
    backg.on('mousemove', function(e){ 
        if (drawing){
            var x = e.evt.layerX;
            var y = e.evt.layerY;
            posNow = {x: x, y: y};
            // Update the selection rectangle.
            setRectCorners(selectRect, posNow, posStart);
            layer.draw();
        }
    });

    backg.on('mouseup', function(e){ 
        selectRect.visible(false);
        ungroupAll();
        // Check for intersection to select texts
        $.each(texts, function(idx, t){
            if(hitCheck(t,selectRect)){
                t.fire('group');
            } 
            // reenable text listening.
            t.listening(true);
        });
        drawing = false;
        layer.draw();
    });


    layer.add(dragGroup);

    // Add the konva Text objects using words array
    konvaTexts = $.map(words, function(word) {
        // create our text
        var text = new Konva.Text({
            x: word.X/100*stage.width(),
            y: word.Y/100*stage.height(),
            text: word.WORD,
            fontSize: 16,
            draggable: true
        });
        texts.push(text);
        text.transformsEnabled("position");
        text.on('click', function(){
            text.fire('group');
        });
        text.on('group', function() {
            // Only group if not already in group
            if(text.getParent() == dragGroup){
                return;
            }
            dragGroup.add(text);
            text.x(text.x()-dragGroup.x());
            text.y(text.y()-dragGroup.y());
            text.fill('green');
            text.draggable(false);
            dragGroup.draw();
            layer.draw();
        });
        text.on('ungroup', function() {
            // Only ungroup if actually in group
            if(text.getParent() != dragGroup){
                return;
            }
            layer.add(text);
            text.fill('black');
            text.draggable(true);
            text.x(text.x()+dragGroup.x());
            text.y(text.y()+dragGroup.y());
        });
        return text;
    });

    $.each(konvaTexts,function(idx,textObject) {
        // add the texts to the layer
        layer.add(textObject);
    });

    // add the layer to the stage
    stage.add(layer);


    function ungroupAll() {
        // Remove all children from drag group/ add them to layer.
        while(dragGroup.hasChildren()){
            dragGroup.getChildren()[0].fire('ungroup');
        }
        dragGroup.x(0);
        dragGroup.y(0);
        layer.draw();
    }
    // Listen to the Finish button
    $("#doneButton").click(function(evt){
        ungroupAll();

        showDoneScreen();

        pairwiseCSV = calculatePairwise(texts);
        // let them download the data.
        var scap = $("#screencap");
        scap.attr("href",stage.toDataURL());
        scap.attr("download",participantId+"_screencap.png");
        var pairs = $("#pairwise");
        pairs.attr("href","data:text/plain;charset=utf-8,"+encodeURIComponent(pairwiseCSV));
        pairs.attr("download",participantId+"_pairwise.csv");
    });
}

/**
 * Check if two shapes intersect.
 *
 * @param shape1 a Konva shape (node).
 * @param shape2 a Konva shape (node).
 *
 * @return whether or not the two shapes intersect.
 */
function hitCheck(shape1, shape2){
    var s1 = shape1.getClientRect(); // use this to get bounding rect for shapes other than rectangles.
    var s2 = shape2.getClientRect();

    // corners of shape 1
    var X = s1.x;
    var Y  = s1.y;
    var A = s1.x + s1.width;
    var B = s1.y + s1.height;

    // corners of shape 2
    var X1 = s2.x;
    var A1 = s2.x + s2.width;
    var Y1 = s2.y;
    var B1 = s2.y + s2.height;

    // Simple overlapping rect collision test
    if (A<X1 || A1<X || B<Y1 || B1<Y){
        return false;
    }
    else{
        return true;
    }
}

/**
 * sets a rectangle object from two specified corners.
 * the x,y are the top left
 *
 * @param rectangle the konva rectangle object to update.
 * @param r1 corner 1 as a {x,y} object.
 * @param r2 corner 2 as a {x,y} object.
 *
 * @return the modified konva rectangle object.
 */
function setRectCorners(rectangle, r1, r2){
    var x = Math.min(r1.x,r2.x);
    var y = Math.min(r1.y,r2.y);
    var w = Math.abs(r1.x-r2.x);
    var h = Math.abs(r1.y-r2.y);
    rectangle.x(x);
    rectangle.y(y);
    rectangle.width(w);
    rectangle.height(h);
    return rectangle;
}

/**
 * Gets the center X of a konva object.
 *
 * @param node a Konva Node.
 *
 * @return the absolute center X of the node.
 */
function centerX(node){
    return node.x()+node.width()/2;
}

/**
 * Gets the center Y of a konva object.
 *
 * @param node a Konva Node.
 *
 * @return the absolute center Y of the node.
 */
function centerY(node){
    return node.y()+node.height()/2;
}


/**
 * The absolute pythagorean distance between the centers of nodes.
 *
 * @param n1 Konva node
 * @param n2 second Konva node
 *
 * @return the absolute pythagorean distance.
 */
function dist(n1,n2){
    return Math.sqrt(
        ((centerX(n1)-centerX(n2))*(centerX(n1)-centerX(n2)))
            +((centerY(n1)-centerY(n2))*(centerY(n1)-centerY(n2))));
}

/**
 * Get the Pixels per Inch of the display.
 *
 * @return the PPI.
 */
function getDocumentPPI() {
    var elem = document.createElement('div');
    elem.style.width = '1in';
    document.body.appendChild(elem);
    var ppi = elem.offsetWidth;
    document.body.removeChild(elem);
    return ppi;
}

/**
 * Calculate the pairwise distance between all texts.
 *
 * @param texts an array of Konva Text objects
 *
 * @return the pairwise distances and words for all pairs, as a CSV string.
 */
function calculatePairwise(texts) {
    var data = "WORD1, WORD2, DIST, SCREENWIDTH, SCREENHEIGHT, PIXELS/INCH";
    var width = $(document).width();
    var height = $(document).height();
    var ppi = getDocumentPPI();
    for(i = 0; i < texts.length-1; i++) {
        for (k = i+1; k < texts.length; k++) {
            var obj1 = texts[i];
            var obj2 = texts[k];
            data += '\n' + obj1.text()
                + ',' + obj2.text()
                + ',' + dist(obj1,obj2);
            if(k==1){
                data += ',' + width
                    + ',' + height
                    + ',' + ppi;
            }
        }
    }
    return data;
}
