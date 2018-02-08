$(document).ready(function(){

    document.getElementById('txtFileUpload').addEventListener('change',upload,false);
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
    */
    function upload(evt) {
        if (!browserSupportFileUpload()) {
            alert('The File APIs are not fully supported in this browser!');
        } else {
            var data = null;
            var file = evt.target.files[0];
            var reader = new FileReader();
            reader.readAsText(file);
            reader.onload = function(event) {
                var csvData = event.target.result;
                data = $.csv.toArray(csvData);
                if (verifyConfig(data)) {
                    // Config is valid, start the word association
                    hideConfig();
                    instantiateKonva(data);
                } else {
                    alert('No data to import!');
                }
            };
            reader.onerror = function() {
                alert('Unable to read ' + file.fileName);
            };
        }
    }
    
    /**
    * Check if the configuration csv is valid.
    *
    * @param data the csv data after parsing. Should be array or object.
    *
    * @return whether or not it is valid.
    */
    function verifyConfig(data){
        return data && data.length > 0;
    }


});


function hideConfig(){
    $("#configScreen").hide();
}

/**
* Sets up the Konva stage and adds in the Text objects
*
* @param words is an array of strings for the words to be displayed.
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
        var container = document.querySelector('#container');

        var containerWidth = container.offsetWidth;
        var containerHeight = container.offsetHeight;

        stage.width(containerWidth);
        stage.height(containerHeight);
        stage.draw();
    }

    resizeStage();
    // adapt the stage on any window resize
    window.addEventListener('resize', resizeStage());

    // then create layer
    var layer = new Konva.Layer();

    // Add the konva Text objects using words array
    konvaTexts = $.map(words, function(word) {
        // create our text
        text = new Konva.Text({
            x: Math.floor((Math.random() * stage.getWidth())+1),
            y: Math.floor((Math.random() * stage.getHeight())+1),
            text: word,
            fontSize: 16
        });
        text.draggable('true');
        return text;
    });

    $.each(konvaTexts,function(idx,textObject) {
        // add the texts to the layer
        layer.add(textObject);
    });

    // add the layer to the stage
    stage.add(layer);
}
