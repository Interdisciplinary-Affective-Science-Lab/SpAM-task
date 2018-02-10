$(document).ready(function(){

    $('#txtFileUpload').change(function(evt){
        processCSV(evt, function(data){
                if (verifyConfig(data)) {
                    // Config is valid, start the word association
                    startAssociation();
                    shuffleLocations(data);
                    instantiateKonva(data);
                } else {
                    alert('No data to import!');
                }
        });
    });

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

});

// Hide the config screen (csv upload etc.)
// And show the konva canvas
function startAssociation(){
    $("#configScreen").hide();
    $("#associationScreen").show();
}

// Hide the association screen, show the done screen
function showDoneScreen(){
    $("#associationScreen").hide();
    $("#doneScreen").show();
}

// shuffle the xy coordinates among the words
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


    // Resize the stage with the webpage.
    function resizeStage() {
        var container = $(window);

        var containerWidth = container.width();
        var containerHeight = container.height();

        stage.width(containerWidth);
        stage.height(containerHeight);
        stage.draw();
    }

    resizeStage();
    // adapt the stage on any window resize
    $(window).resize(resizeStage);

    // then create layer
    var layer = new Konva.Layer();

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
        text.transformsEnabled("position");
        return text;
    });

    $.each(konvaTexts,function(idx,textObject) {
        // add the texts to the layer
        layer.add(textObject);
    });

    // add the layer to the stage
    stage.add(layer);


    // Listen to the Finish button
    $("#doneButton").click(function(evt){
        console.log("finish");

        showDoneScreen();
        // Add white background so that black text will show up.
        var backg = new Konva.Rect({
            width: stage.width(),
            height: stage.height(),
            x: 0,
            y: 0,
            fill: 'white'
        })
        layer.add(backg);
        backg.moveToBottom();
        layer.draw();

        // let them download the data.
        $("#screencap").attr("href",stage.toDataURL());
        $("#pairwise").attr("href",
    });
}
