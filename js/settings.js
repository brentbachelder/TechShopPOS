var subpage = '';

function InitSettings(page) {
    subpage = page;
    document.getElementById("page-title").innerHTML = "SETTINGS - " + subpage.toUpperCase();
    document.getElementById("mobile-page-title").innerHTML = "SETTINGS - " + subpage.toUpperCase();
    if(subpage == "tickets") {
        DrawSettingsTickets();
        DrawSettingsTicketsStatus();
        SettingsTicketsAddEventListeners();
    }
    else {
        document.getElementById("frame").innerHTML = `<div>${subpage}</div>`;
        pageLoading = false;
    }
}

function SettingsTicketsAddEventListeners() {
    document.getElementById("fileUpload").addEventListener('dragenter', (event) => {document.getElementById("fileUpload").style.backgroundColor = "var(--hover)";});
    document.getElementById("fileUpload").addEventListener('dragleave', (event) => {document.getElementById("fileUpload").style.backgroundColor = "transparent";});

    const dragIndexes = document.querySelectorAll(".drag-index");
    dragIndexes.forEach(element => {
        element.addEventListener("dragstart", () => {
            element.parentNode.classList.add("dragging");
            element.parentNode.draggable = true;
        });
        element.addEventListener("dragend", () => {
            element.parentNode.classList.remove("dragging");
            element.parentNode.draggable = false;
        });
    });

    var container = document.getElementById("settings-tickets-status-container");
    container.addEventListener("dragover", event => {
        event.preventDefault();
        const closestElement = FindClosestDragElement(container, event.clientY);
        const draggable = document.querySelector(".dragging");
        if(closestElement == null) container.appendChild(draggable);
        else container.insertBefore(draggable, closestElement);
    });
}

function UploadProcess() {
    //Reference the FileUpload element.
    var fileUpload = document.getElementById("fileUpload");

    //Validate whether File is valid Excel file.
    var regex = /^([a-zA-Z0-9\s_\\.\-:])+(.xls|.xlsx)$/;
    if (regex.test(fileUpload.value.toLowerCase())) {
        if (typeof (FileReader) != "undefined") {
            var reader = new FileReader();

            //For Browsers other than IE.
            if (reader.readAsBinaryString) {
                reader.onload = function (e) {
                    GetPricesFromExcel(e.target.result);
                };
                reader.readAsBinaryString(fileUpload.files[0]);
            } 
            else {
                //For IE Browser.
                reader.onload = function (e) {
                    var data = "";
                    var bytes = new Uint8Array(e.target.result);
                    for (var i = 0; i < bytes.byteLength; i++) {
                        data += String.fromCharCode(bytes[i]);
                    }
                    GetPricesFromExcel(data);
                };
                reader.readAsArrayBuffer(fileUpload.files[0]);
            }
        } 
        else alert("This browser does not support HTML5.");
    } 
    else alert("Please choose a valid Excel file.");
}

async function GetPricesFromExcel(data) {
    document.getElementById("upload-container").style.display = "none";
    document.getElementById("processing-upload").style.display = "flex";
    
    //Read the Excel File data in binary
    var workbook = XLSX.read(data, {
        type: 'binary'
    });

    //Get the names of the worksheets.
    var devices = [];
    var sheet = [];
    for(var i = 0; i < workbook.SheetNames.length; i++) {
        var result = workbook.SheetNames[i];
        result.replace(/[^a-z0-9]/gi, '');
        devices.push((1000 + i).toString() + result);
        sheet.push(workbook.SheetNames[i]);
    }

    //Create the repair object.
    var finalRepair = {};
    
    // Put the excel file into finalRepair
    for(var s = 0; s < workbook.SheetNames.length; s++) {
        var excelRows = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheet[s]]);
        var yCount = 0;
        var typeObject = {};
        for(var y in excelRows) {
            var xCount = 0;
            var currentType = '';
            var repairObject = {};
            for(var x in excelRows[y]) {
                if(xCount == 0) {
                    currentType = excelRows[y][x];
                    currentType = currentType.replace(/[^a-zA-Z0-9 -]/g, '');
                }
                else {
                    var result = excelRows[y][x].toString();
                    result = result.replace(/[^0-9.]/g, '');
                    result = parseFloat(result);
                    var xFix = x.replace(/[^a-zA-Z0-9 -]/g, '');
                    if(!isNaN(result) && result != '' && result != undefined && result >= 0) repairObject[(1000 + xCount).toString() + xFix] = result;
                }
                xCount++;
            }
            typeObject[(1000 + yCount).toString() + currentType] = repairObject;
            yCount++;
        }
        finalRepair[devices[s]] = typeObject;
    }
    console.log(finalRepair);
    await db.ref("Prices").set(finalRepair);
    document.getElementById("processing-upload").style.display = "none";
    document.getElementById("processing-complete").style.display = "flex";
};

function FindClosestDragElement(container, y) {
    const draggableElements = [...container.querySelectorAll(".draggable:not(.dragging)")];
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const mouseDifference = y - box.top - box.height / 2;
        if(mouseDifference < 0 && mouseDifference > closest.mouseDifference) return { mouseDifference: mouseDifference, element: child };
        else return closest;
    }, { mouseDifference: Number.NEGATIVE_INFINITY }).element;
}

function SettingsSetDefault(parentElement, selectedElement) {
    var elements = document.getElementById(parentElement).querySelectorAll(".set-default");
    for(var i = 0; i < elements.length; i++) {
        elements[i].classList.remove("selected");
    }
    selectedElement.classList.add("selected");
}

function SettingsTicketsStatusSave() {
    var finalResult = {};
    var counter = 0;
    var parentElements = document.getElementById('settings-tickets-status-container').getElementsByClassName("settings-line");
    for(var i = 0; i < parentElements.length; i++) {
        var inputValue = parentElements[i].getElementsByTagName("input")[0].value;
        var defaultElement = parentElements[i].getElementsByClassName("set-default");
        var isDefault = false;
        if(defaultElement[0].classList.contains("selected")) isDefault = true;
        if(inputValue.replace(" ", "") != "") {
            finalResult[counter] = { Default : isDefault, Display : inputValue };
            counter++;
        }
        else {
            if(isDefault) finalResult[0].Default = true;
        }
    }
    finalResult[99] = { Default : false, Display : 'Completed' };
    db.ref("Settings/Tickets/Status").set(finalResult);
    console.log(finalResult);
    DrawSettingsTicketsStatus();
    SettingsTicketsAddEventListeners();
}




function DrawSettingsTicketsStatus() {
    content = '';
    for(var key in Settings.Tickets.Status) {
        var disabled = "";
        if(Settings.Tickets.Status[key].Display == "Ready for Pickup") disabled = " disabled";
        var selected = "";
        if(Settings.Tickets.Status[key].Display != "Completed") {
            if(Settings.Tickets.Status[key].Default) selected = " selected";
            content += `
                <div class="settings-line draggable">
                    <div class="drag-index material-symbols-outlined" draggable="true">menu</div>
                    <div class="input-flex"><input value="${Settings.Tickets.Status[key].Display}"${disabled}></div>
                    <button class="set-default material-symbols-outlined${selected}" onclick="SettingsSetDefault('settings-tickets-status-container', this)"></button>
                </div>
            `;
        }
    }
    document.getElementById("settings-tickets-status-container").innerHTML = content;
}

function DrawSettingsTickets() {
    var content = `
    <div class="container">
        <div class="object medium">
            <header class="green">
                <h1>TICKET OPTIONS</h1>
            </header>
            <div class="settings-info-container">
                General settings for all tickets.<br /><br />** SOME SETTINGS CANNOT BE SET ON MOBILE **
            </diV>
            <div id="settings-tickets-options-container" style="padding: var(--inner-padding) var(--outer-padding);">
                <div>This is a test</div>
            </div>
        </div>
        <div class="object medium">
            <header class="green">
                <h1>UPLOAD PRICE LIST</h1>
            </header>
            <div class="settings-info-container">
                Upload an Excel Spreadsheet to quickly update all the prices in the database. For more information check out our 
                <a href="docs/spreadsheet.html" target="_blank">Price Spreadsheet FAQ</a> which includes a sample spreadsheet that you can use as an outline.
            </diV>
            <div id="settings-tickets-upload-container" style="padding: var(--inner-padding) var(--outer-padding); text-align: center;">
                <label id="upload-container" for="file-upload">
                    <div id="upload-title">Drop Spreadsheet Here or</div>
                    <input type="file" id="fileUpload">
                    <input type="button" id="upload" value="Upload" onclick="UploadProcess()" style="padding: var(--inner-padding)">
                </label>
                <div id="processing-upload" style="height: 105px; display: none; flex-direction: column; justify-content: space-evenly; align-items: center;">
                    <div>Processing</div>
                    <div class="loader-line"></div>
                </div>
                <div id="processing-complete" style="height: 105px; display: none; justify-content: center; align-items: center;"><b>PRICES UPDATED</b></div>
            </div>
        </div>
        <div class="object medium">
            <header class="green">
                <h1>STATUS LIST</h1>
            </header>
            <div class="settings-info-container">
                Ticket status options. Drag to change order displayed.<br />(Clear description box and SAVE to remove)
            </div>
            <div>
                <div class="settings-header">
                    <div class="default">ORDER</div>
                    <div class="description">DESCRIPTION</div>
                    <div class="default">DEFAULT</div>
                </div>
                <div id="settings-tickets-status-container" class="settings-container"></div>
                <div class="settings-save-container">
                    <button class="settings-save-button" onclick="SettingsTicketsStatusSave();">SAVE<div class="material-symbols-outlined">done</div></button>
                </div>
            </div>
        </div>
    </div>
    `;

    document.getElementById("frame").innerHTML = content;
    pageLoading = false;
}