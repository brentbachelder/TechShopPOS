var newTicketCustomer = -1;
var nameInputId = '';
var selectedDevice = '';
var selectedType = '';
var selectedColor = 'Black';
var selectedModelNumber = '';
var repairList = [];
var colorList = ['Black', 'White', 'Blue', 'Gray', 'Red'];

var TemporaryNewTicketDevice = {};
var TemporaryNewTicketInputs = {};
var TemporaryNewTicketRepairs = [];
var TemporaryNewTicketCheckboxes = [];
var TemporaryNewTicketCustomOpen = false;

function InitNewRepair() {
    if(newTicketCustomer == -1) newTicketCustomer = Admin.CurrentCustomerNumber;
    document.getElementById("page-title").innerHTML = "NEW REPAIR";
    document.getElementById("mobile-page-title").innerHTML = "NEW REPAIR";
    DrawNewRepair();
    DrawNewCustomerInputs();
    if(!TemporaryNewTicketCustomOpen) DrawDevices();
    RestoreTemporary();
}

function NewTicketFromCustomerPage(custNum) {
    var url = window.location.toString();
    url = url.split('#')[0];
    location.href = url + '#new-repair';
    InitNewRepair();
    SelectNewTicketCustomer(custNum);
}

function FocusCustomerInput(id) {
    var undashed = id.replaceAll('-', ' ');
    document.getElementById(id + "-container").classList.remove("error");
    document.getElementById(id + "-miniput").innerHTML = undashed;
}

function FocusOtherInput(id) {
    document.getElementById(id + "-container").classList.remove("error");
}

function CheckCustomerInput() {
    var errorCount = 0;
    var inputs = document.getElementById("input-customer-container").getElementsByTagName("input");
    var customInputs = document.getElementById("new-ticket-custom-inputs").getElementsByTagName("input");
    for(var i = 0; i < inputs.length; i++) {
        if(inputs[i].required) {
            if(inputs[i].value == "") {
                var undashed = inputs[i].id.replaceAll('-', ' ');
                document.getElementById(inputs[i].id + "-container").classList.add("error");
                document.getElementById(inputs[i].id + "-miniput").innerHTML = undashed + " Required";
                errorCount++;
            }
        }
    }
    for(var j = 0; j < customInputs.length; j++) {
        if(customInputs[j].required) {
            if(customInputs[j].value == "") {
                document.getElementById(customInputs[j].id + "-container").classList.add("error");
                errorCount++;
            }
        }
    }
    if(repairList.length < 1 && (!document.getElementById("repairs-other") || document.getElementById("repairs-other").value == '')) {
        document.getElementById("new-repair-summary").classList.add("error");
        document.getElementById("repair-information-error").classList.remove("hidden");
        errorCount++;
        if(selectedDevice =='') document.getElementById("repair-information-error").innerHTML = '* Device Required';
        else if(selectedType == '') document.getElementById("repair-information-error").innerHTML = '* Type Required';
        else document.getElementById("repair-information-error").innerHTML = '* Must Select at least 1 Repair';
    }
    console.log("Error Count: " + errorCount);
    if(errorCount == 0) CreateNewTicket();
}

function ClearNewTicketInput(id) {
    document.getElementById(id).value = '';
    setTimeout(function(){ document.getElementById(id).focus(); }, 1);
}


function SelectNewTicketCustomer(id) {
    newTicketCustomer = id;
    for(var key in Settings.Customers.Inputs) {
        inputName = Settings.Customers.Inputs[key].Display;
        if(Settings.Customers.Inputs[key].Enabled) {
            var dashed = Settings.Customers.Inputs[key].Display.replaceAll(' ', '-');
            if(document.getElementById(dashed) && Customers[id][inputName] != '' && Customers[id][inputName] != undefined) {
                document.getElementById(dashed).value = Customers[id][inputName];
                SaveToTemporaryInput(dashed);
            }
        }
    }
}

function ClearNewTicketCustomer() {
    var inputs = document.getElementById("input-customer-container").getElementsByTagName("input");
    for(var i = 0; i < inputs.length; i++) {
        inputs[i].value = '';
        SaveToTemporaryInput(inputs[i]);
    }
    newTicketCustomer = Admin.CurrentCustomerNumber;
    document.getElementById(nameInputId).focus();
}



function SelectDevice(device) {
    selectedDevice = device;
    document.getElementById("new-repair-summary").classList.remove("error");
    document.getElementById("repair-information-error").classList.add("hidden");
    SaveToTemporaryDevice('Device', device);
    DrawTypes();
}

function SelectType(type) {
    selectedType = type;
    document.getElementById("new-repair-summary").classList.remove("error");
    document.getElementById("repair-information-error").classList.add("hidden");
    SaveToTemporaryDevice('Type', type);
    DrawRepairs();
    DrawNewCheckboxes();
    DrawNewCustomInputs();
    DrawColors();
}

function SelectRepair(repair) {
    var element = document.getElementById(repair);
    document.getElementById("new-repair-summary").classList.remove("error");
    document.getElementById("repair-information-error").classList.add("hidden");
    element.classList.toggle("selected");
    if(element.classList.contains("selected")) repairList.push(repair);
    else {
        for(var i = 0; i < repairList.length; i++) { 
            if(repairList[i] == repair) repairList.splice(i, 1); 
        }
    }
    TemporaryNewTicketRepairs = repairList;
}

function SelectColor(color) {
    selectedColor = color;
    SaveToTemporaryDevice('Color', color);
    DrawColors();
}

function SubmitOtherRepair() {
    if(!document.getElementById("other-apply-button").classList.contains("disabled")) {
        selectedDevice = "9999" + document.getElementById("other-device").value;
        SaveToTemporaryDevice('Device', selectedDevice);
        selectedType = "9999" + document.getElementById("other-type").value;
        SaveToTemporaryDevice('Type', selectedType);
        selectedModelNumber = document.getElementById("other-model").value;
        SaveToTemporaryDevice('Model', selectedModelNumber);
        console.log(selectedDevice + ", " + selectedType);
        document.getElementById("new-repair-summary").classList.remove("hidden");
        document.getElementById("input-repair-other").classList.add("hidden");
        document.getElementById("new-repair-summary").classList.remove("error");
        document.getElementById("repair-information-error").classList.add("hidden");
        DrawRepairs();
        DrawNewCheckboxes();
        DrawNewCustomInputs();
        DrawColors();
    }
}

function ClearNewTicketRepair() {
    selectedDevice = '';
    SaveToTemporaryDevice('Device', '');
    selectedType = '';
    SaveToTemporaryDevice('Type', '');
    selectedModelNumber = '';
    SaveToTemporaryDevice('Model', '');
    repairList = [];
    TemporaryNewTicketRepairs = repairList;
    document.getElementById("input-repair-device").classList.remove("hidden");
    document.getElementById("input-repair-type").classList.add("hidden");
    document.getElementById("new-repair-summary").classList.remove("hidden");
    document.getElementById("input-repair-other").classList.add("hidden");
    document.getElementById("input-repair-repairs").classList.add("hidden");
    document.getElementById("new-ticket-colors").classList.add("hidden");
    if(document.getElementById("repairs-other")) {
        document.getElementById("repairs-other").value = '';
        SaveToTemporaryInput('repairs-other');
    }
    document.getElementById("new-ticket-checkboxes").classList.add("hidden");
    document.getElementById("new-ticket-custom-inputs").classList.add("hidden");
    document.getElementById("new-repair-summary").classList.remove("error");
    document.getElementById("repair-information-error").classList.add("hidden");
    DrawRepairSummary();
}


function CheckInputOther(event) {
    if(document.getElementById("other-device") && document.getElementById("other-type")) {
        if(document.getElementById("other-device").value != "" && document.getElementById("other-type").value != "") {
            document.getElementById("other-apply-button").classList.remove("disabled");
            if(event.keyCode == 13) SubmitOtherRepair();
        }
        else {
            if(!document.getElementById("other-apply-button").classList.contains("disabled")) document.getElementById("other-apply-button").classList.add("disabled");
            if(event.keyCode == 13) document.activeElement.blur();
        }
    }
}

function CheckInputRepair(event) {
    if(event.keyCode == 13) document.activeElement.blur();
}

function GetPriceListWithDevice() {
    var list = [];
    var content = '';
    for(var type in Prices[selectedDevice]) {
        for(var repair in Prices[selectedDevice][type]) {
            if(!list.includes(repair)) list.push(repair);
        }
    }
    for(var i = 0; i < list.length; i++) {
        content += `<button id="${list[i]}" class="type" onclick="SelectRepair('${list[i]}')">${list[i].substring(4)}</button>`;
    }
    return content;
}

function GetPriceListNoDevice() {
    var list = [];
    var content = '';
    for(var device in Prices) {
        for(var type in Prices[device]) {
            for(var repair in Prices[device][type]) {
                if(!list.includes(repair)) list.push(repair);
            }
        }
    }
    for(var i = 0; i < list.length; i++) {
        content += `<button id="${list[i]}" class="type" onclick="SelectRepair('${list[i]}')">${list[i].substring(4)}</button>`;
    }
    return content;
}




// Drawing Elements
function DrawNewCustomerInputs() {
    var content = '';

    for(var key in Settings.Customers.Inputs) {
        if(Settings.Customers.Inputs[key].Enabled) {
            var display = Settings.Customers.Inputs[key].Display;
            var dashed = display.replaceAll(' ', '-');
            var requiredStar = '';
            var required = '';
            if(Settings.Customers.Inputs[key].Required) {
                requiredStar = ' *';
                required = ' required';
            }
            var nameClass = '';
            var nameSearch = '';
            var nameSearchActions = '';
            if(display == "Name" || display == "Full Name") {
                nameInputId = dashed;
                nameClass = ' name';
                nameSearch = '<div id="new-ticket-search-results"></div>';
                nameSearchActions = ` onblur="CloseSearchNT()" onkeydown="SearchKeyboardActionsNT(event)" onkeyup="SaveToTemporaryInput('${dashed}'); SearchForCustomerNT(event)"`;
            }
            
            content += `
                <div class="input-shell${nameClass}">
                    <div class="input-container" id="${dashed}-container">
                        <div class="miniput">
                            <div id="${dashed}-miniput" class="miniput-description">${display}</div>
                            <input type="text" id="${dashed}" placeholder="${display}${requiredStar}"${nameSearchActions} onfocus="FocusCustomerInput(this.id)"
                                onkeyup="SaveToTemporaryInput('${dashed}')"${required}>
                        </div>
                        <div class="x-input" onmousedown="ClearNewTicketInput('${dashed}')"><div class="material-symbols-outlined">close</div></div>
                    </div>
                    ${nameSearch}
                </div>
            `;
            if(display == "Address") {
                content += `
                    <div class="input-shell">
                        <div class="input-container" style="flex-grow: 3;" id="City-container">
                            <div class="miniput">
                                <div id="City-miniput" class="miniput-description">City</div>
                                <input type="text" id="City" placeholder="City" onfocus="FocusCustomerInput(this.id)" onkeyup="SaveToTemporaryInput('City')">
                            </div>
                            <div class="x-input" onmousedown="ClearNewTicketInput('City')"><div class="material-symbols-outlined">close</div></div>
                        </div>
                        <div class="input-container" style="width: 84px;" id="State-container">
                            <div class="miniput">
                                <div id="State-miniput" class="miniput-description">ST</div>
                                <input type="text" id="State" placeholder="ST" onfocus="FocusCustomerInput(this.id)" onkeyup="SaveToTemporaryInput('State')">
                            </div>
                            <div class="x-input" onmousedown="ClearNewTicketInput('State')"><div class="material-symbols-outlined">close</div></div>
                        </div>
                        <div class="input-container" style="width: 160px;" id="Zip-container">
                            <div class="miniput">
                                <div id="Zip-miniput" class="miniput-description">Zip</div>
                                <input type="text" id="Zip" placeholder="Zip" onfocus="FocusCustomerInput(this.id)" onkeyup="SaveToTemporaryInput('Zip')">
                            </div>
                            <div class="x-input" onmousedown="ClearNewTicketInput('Zip')"><div class="material-symbols-outlined">close</div></div>
                        </div>
                    </div>
                `;
            }
        }
    }
    
    document.getElementById("input-customer-container").innerHTML = content;
}

function DrawRepairSummary() {
    var content = ``;
    if(selectedDevice != '') {
        content = `
            <div><b>DEVICE:&nbsp;&nbsp;</b>${selectedDevice.substring(4)}</div>
        `;
    }
    if(selectedType != '') {
        content += `
            <div style="margin-left: 30px;"><b>TYPE:&nbsp;&nbsp;</b>${selectedType.substring(4)}</div>
        `;
    }
    if(selectedModelNumber != '') {
        content += `<div>&nbsp;(${selectedModelNumber})</div>`;
    }
    if(selectedDevice == '' && selectedType == '') content = '<b>Select Device</b>';

    document.getElementById("new-repair-summary").innerHTML = content;
}

function DrawDevices() {
    TemporaryNewTicketCustomOpen = false;
    var content = '';
    for(var key in Prices) {
        content += `<button id="${key}" class="device" onclick="SelectDevice('${key}')">${key.substring(4)}</button>`;
    }
    content += `<button class="device" onclick="DrawOther()">Other</button>`;
    document.getElementById("input-repair-device").innerHTML = content;
}

function DrawTypes() {
    TemporaryNewTicketCustomOpen = false;
    DrawRepairSummary();
    document.getElementById("input-repair-device").classList.add("hidden");
    document.getElementById("input-repair-other").classList.add("hidden");
    document.getElementById("new-ticket-colors").classList.add("hidden");
    document.getElementById("input-repair-type").classList.remove("hidden");
    
    var content = '';
    for(var key in Prices[selectedDevice]) {
        content += `<button id="${key}" class="type" onclick="SelectType('${key}')">${key.substring(4)}</button>`;
    }
    content += `<button class="type" onclick="DrawOther(true)">Other</button>`;
    document.getElementById("input-repair-type").innerHTML = content;
}

function DrawRepairs() {
    TemporaryNewTicketCustomOpen = false;
    DrawRepairSummary();
    document.getElementById("input-repair-type").classList.add("hidden");
    document.getElementById("new-ticket-colors").classList.remove("hidden");
    document.getElementById("input-repair-repairs").classList.remove("hidden");
    
    var content = '';
    if(Prices != null && selectedDevice in Prices) {
        if(Prices[selectedDevice].hasOwnProperty(selectedType)) {
            for(var key in Prices[selectedDevice][selectedType]) {
                var dashed = key.replaceAll(' ', '-');
                content += `<button id="${dashed}" class="type" onclick="SelectRepair('${dashed}')">${key.substring(4)}</button>`;
            }
        }
        else content = GetPriceListWithDevice();
    }
    else content = GetPriceListNoDevice();
    content += `
        <div style="width: 100%; text-align: center; font-size: 14px; font-weight: 500">
            <input id="repairs-other" placeholder="Custom Repair" onkeydown="CheckInputRepair(event)" onkeyup="SaveToTemporaryInput('repairs-other')">
        </div>`;
    
    document.getElementById("input-repair-repairs").innerHTML = content;
}

function DrawColors() {
    document.getElementById("new-ticket-colors").classList.remove("hidden");
    var content = '<div style="font-size: 12px; font-weight: 700;">COLOR</div>';
    for(var i = 0; i < colorList.length; i++) {
        var selected = '';
        if(colorList[i] == selectedColor) selected = ' selected';
        content += `<button class="color-box${selected}" style="background-color: ${colorList[i]}" onclick="SelectColor('${colorList[i]}')"></button>`
    }
    document.getElementById("new-ticket-colors").innerHTML = content;
}

function DrawOther(deviceDone = false) {
    TemporaryNewTicketCustomOpen = true;
    document.getElementById("input-repair-device").classList.add("hidden");
    document.getElementById("input-repair-type").classList.add("hidden");
    document.getElementById("new-repair-summary").classList.add("hidden");
    document.getElementById("input-repair-other").classList.remove("hidden");
    var disabled = 'class="disabled"';
    if(selectedDevice != '' && selectedType != '') disabled = '';

    var content = `
        <div class="other-device-header">DEVICE</div>
        <input id="other-device" class="other-device-input" placeholder="Device" onkeydown="CheckInputOther(event)" onkeyup="SaveToTemporaryInput('other-device')" value="${selectedDevice.substring(4)}">
        <div class="other-device-header">TYPE</div>
        <input id="other-type" class="other-device-input" placeholder="Type" onkeydown="CheckInputOther(event)" onkeyup="SaveToTemporaryInput('other-type')" value="${selectedType.substring(4)}">
        <div class="other-device-header">MODEL NUMBER (optional)</div>
        <input id="other-model" class="other-device-input" placeholder="Model #" onkeydown="CheckInputOther(event)" onkeyup="SaveToTemporaryInput('other-model')" value="${selectedModelNumber}">
        <button id="other-apply-button" ${disabled} onclick="SubmitOtherRepair()">Apply</button>
    `;

    document.getElementById("input-repair-other").innerHTML = content;
    if(deviceDone) document.getElementById("other-type").focus();
    else document.getElementById("other-device").focus();
}

function DrawNewCheckboxes() {
    document.getElementById("new-ticket-checkboxes").classList.remove("hidden");
    var content = '';
    
    for(var key in Settings.Tickets.Checkboxes) {
        if(Settings.Tickets.Checkboxes[key].Enabled) {
            var dashed = Settings.Tickets.Checkboxes[key].Display.replaceAll(' ', '-');
            content += `
                <div class="checkbox-container">
                    <button id="${dashed}-checkbox" class="checkbox material-symbols-outlined" onclick="CheckboxToggle(this, true)"></button>
                    <div class="checkbox-text">${Settings.Tickets.Checkboxes[key].Display}</div>
                </div>
            `;
        }
    }
    document.getElementById("new-ticket-checkboxes").innerHTML = content;
}

function DrawNewCustomInputs() {
    document.getElementById("new-ticket-custom-inputs").classList.remove("hidden");
    var content = '';
    
    for(var key in Settings.Tickets.Inputs) {
        if(Settings.Tickets.Inputs[key].Enabled) {
            var required = ''; requiredStar = '';
            if(Settings.Tickets.Inputs[key].Required) {
                required = ' required';
                requiredStar = ' *';
            }
            var dashed = Settings.Tickets.Inputs[key].Display.replaceAll(' ', '-');
            content += `
            <div id="${Settings.Tickets.Inputs[key].Display}-container" class="other-device-input-container">
                <div class="other-device-header small">${Settings.Tickets.Inputs[key].Display}${requiredStar}</div>
                <input id="${dashed}-custom" class="other-device-input small" placeholder="${Settings.Tickets.Inputs[key].Display}" onkeyup="SaveToTemporaryInput('${dashed}-custom')"
                    onkeydown="CheckInputOther(event)" onfocus="FocusOtherInput('${Settings.Tickets.Inputs[key].Display}')"${required}>
            </div>
            `;
        }
    }
    document.getElementById("new-ticket-custom-inputs").innerHTML = content;
}

function DrawNewRepair() {
    var content = `
    
        <div class="container">    
            <div class="object large nr">
                <header class="gray">
                    <h1>Customer Information</h1>
                    <button class="icon-box" onclick="ClearNewTicketCustomer()"><div class="material-symbols-outlined">refresh</div></button>
                </header>
                <div id="input-customer-container"></div>
            </div>
            <div class="object large nr">
                <header class="gray">
                    <h1>Repair Information<div id="repair-information-error" class="hidden"></div></h1>
                    <button class="icon-box" onclick="ClearNewTicketRepair()"><div class="material-symbols-outlined">refresh</div></button>
                </header>
                <div class="device-outline">
                    <div id="new-repair-summary"><b>Select Device</b></div>
                    <div id="input-repair-device" class="input-object"></div>
                    <div id="input-repair-type" class="input-object hidden"></div>
                    <div id="input-repair-repairs" class="input-object hidden"></div>
                    <div id="input-repair-other" class="input-object hidden"></div>
                    <div id="new-ticket-colors" class="input-object hidden"></div>
                    <div id="new-ticket-checkboxes" class="input-object hidden"></div>
                    <div id="new-ticket-custom-inputs" class="input-object hidden"></div>
                </div>
            </div>
            <div style="width: 100%; text-align: center;">
                <button class="new-ticket-submit-button" onclick="CheckCustomerInput()">CREATE TICKET</button></div>
        </div>
    
    `;
    $("#frame").html(content);
}




async function CreateNewTicket() {
    var custInfo = {};
    var ticketInfo = {};
    
    /* Customer Info */
    var tempPhone = '';
    for(var key in Settings.Customers.Inputs) {
        if(Settings.Customers.Inputs[key].Enabled) {
            var dashed = Settings.Customers.Inputs[key].Display.replaceAll(' ', '-');
            if(Settings.Customers.Inputs[key].Display == "Temp Phone") tempPhone = document.getElementById(dashed).value;
            else {
                if(document.getElementById(dashed).value != '') custInfo[Settings.Customers.Inputs[key].Display] = document.getElementById(dashed).value;
            }
            if(Settings.Customers.Inputs[key].Display == "Address") {
                if(document.getElementById("City").value != '') custInfo["City"] = document.getElementById("City").value;
                if(document.getElementById("State").value != '') custInfo["State"] = document.getElementById("State").value;
                if(document.getElementById("Zip").value != '') custInfo["Zip"] = document.getElementById("Zip").value;
            }
        }
    }
    custInfo["Rating"] = 3;
    await db.ref("Customers/" + newTicketCustomer).update(custInfo);
    
    var ticketNumber = Admin.CurrentTicketNumber;
    var ticketDescription = selectedDevice.substring(4) + " " + selectedType.substring(4);
    var ticketObject = {};
    ticketObject[ticketNumber] = ticketDescription
    await db.ref("Customers/" + newTicketCustomer + "/Tickets").update(ticketObject);

    // Setting the local 'Customers' variable to match network without having to grab the whole snapshot again
    if(Customers != null && Customers.hasOwnProperty(newTicketCustomer)) {
        for(var checkKey in custInfo) {
            if(Customers[newTicketCustomer][checkKey] != custInfo[checkKey] || !Customers[newTicketCustomer].hasOwnProperty(checkKey)) 
                Customers[newTicketCustomer][checkKey] = custInfo[checkKey];
        }
        Object.assign(Customers[newTicketCustomer].Tickets, ticketObject);
    }
    else {
        if(Customers != null) Customers[newTicketCustomer] = custInfo;
        else Customers = {[newTicketCustomer] : custInfo };
        Customers[newTicketCustomer]["Tickets"] = ticketObject;
    }
    console.log(Customers[newTicketCustomer]);

    /* Repair Info */
    var balance = 0;
    var masterRepair = {};
    var counter = 0;
    for(var i = 0; i < repairList.length; i++) {
        var repairInfo = {};
        var taxPrice = 0;
        var undashed = repairList[i].replaceAll('-', ' ');
        if(Prices.hasOwnProperty(selectedDevice) && Prices[selectedDevice].hasOwnProperty(selectedType) && Prices[selectedDevice][selectedType].hasOwnProperty(undashed)) {
            var price = Prices[selectedDevice][selectedType][undashed].Price;
            if(Prices[selectedDevice][selectedType][undashed].Tax) price = price + (price * (Settings.General.SalesTax / 100));
            taxPrice = Math.round(price * 100) / 100;
            repairInfo['Price'] = Prices[selectedDevice][selectedType][undashed].Price;
            repairInfo['Tax'] = Prices[selectedDevice][selectedType][undashed].Tax;
        }
        else {
            repairInfo['Price'] = 0;
            repairInfo['Tax'] = true;
        }
        balance += taxPrice;
        repairInfo['DiscountDollar'] = 0;
        repairInfo['DiscountPercent'] = 0;
        repairInfo['Quantity'] = 1;
        repairInfo['Display'] = undashed.substring(4);
        repairInfo['Ordered'] = "Not Ordered";
        repairInfo['OrderDate'] = '';
        
        masterRepair[i] = repairInfo;
        counter++;
    }
    if(document.getElementById("repairs-other").value != '') {
        var repairInfo = { 'Price': 0, 'Tax': true, 'DiscountDollar': 0, 'DiscountPercent' : 0, 'Quantity' : 1, 'Display' : document.getElementById("repairs-other").value };
        masterRepair[counter] = repairInfo;
        counter++;
    }

    /* Ticket Info */
    ticketInfo['Color'] = selectedColor;
    ticketInfo['Customer'] = newTicketCustomer;
    ticketInfo['DateCreated'] = DateConvert();
    ticketInfo['Device'] = selectedDevice.substring(4);
    ticketInfo['ModelNmbr'] = selectedModelNumber;
    ticketInfo['Type'] = selectedType.substring(4);
    ticketInfo['NextRepairNumber'] = Object.keys(masterRepair).length;
    var note = {};
    var noteDate = DateConvert(true);
    note[noteDate] = {Content : "Ticket Created", Type : "Tech Note"};
    ticketInfo['Notes'] = note;
    var defaultStatus = '';
    for(var key in Settings.Tickets.Status) {
        if(Settings.Tickets.Status[key].Default) defaultStatus = Settings.Tickets.Status[key].Display;
    }
    ticketInfo['Status'] = defaultStatus;
    if(tempPhone != '') ticketInfo['Temp Phone'] = tempPhone;

    for(var input in Settings.Tickets.Inputs) {
        if(Settings.Tickets.Inputs[input].Enabled) {
            var dashed = Settings.Tickets.Inputs[input].Display.replaceAll(' ', '-');
            ticketInfo[Settings.Tickets.Inputs[input].Display] = document.getElementById(dashed + "-custom").value;
        }
    }
    for(var check in Settings.Tickets.Checkboxes) {
        if(Settings.Tickets.Checkboxes[check].Enabled) {
            var dashed = Settings.Tickets.Checkboxes[check].Display.replaceAll(' ', '-');
            if(document.getElementById(dashed + "-checkbox").classList.contains('selected')) {
                ticketInfo[Settings.Tickets.Checkboxes[check].Display] = true;
                if(Settings.Tickets.Checkboxes[check].Charge) {
                    var repairInfo = { 'Price': Settings.Tickets.Checkboxes[check].Price, 'Tax': Settings.Tickets.Checkboxes[check].Tax, 
                        'DiscountDollar': 0, 'DiscountPercent' : 0, 'Quantity' : 1, 'Display' : Settings.Tickets.Checkboxes[check].Display };
                    masterRepair[counter] = repairInfo;
                    var price = Settings.Tickets.Checkboxes[check].Price;
                    if(Settings.Tickets.Checkboxes[check].Tax) price = price + (price * (Settings.General.SalesTax / 100));                    
                    taxPrice = Math.round(price * 100) / 100;
                    balance += taxPrice;
                    counter++;
                }
            }
            else ticketInfo[Settings.Tickets.Checkboxes[check].Display] = false;
        }
    }
    ticketInfo['Balance'] = balance;
    ticketInfo['Repairs'] = masterRepair;
    await db.ref("Tickets/" + ticketNumber).update(ticketInfo);
    
    await db.ref("Admin/CurrentCustomerNumber").set(Admin.CurrentCustomerNumber + 1);
    await db.ref("Admin/CurrentTicketNumber").set(Admin.CurrentTicketNumber + 1);
    
    var date = DateConvert(true);
    var year = date.substring(0,4);
    var month = date.substring(4,6);
    var day = date.substring(6, 8);
    
    await db.ref("OpenTickets/" + ticketNumber).set(ticketInfo['Status']);
    var newTicketCount = 0;
    if('NewTicketCount' in Admin && year in Admin.NewTicketCount && month in Admin.NewTicketCount[year] && day in Admin.NewTicketCount[year][month]) newTicketCount = Admin.NewTicketCount[year][month][day];
    await db.ref("Admin/NewTicketCount/" + year + "/" + month ).update({[day] : newTicketCount + 1});

    var inPrices = false;
    var newDevice = selectedDevice.substring(4);
    var newType = selectedType.substring(4);
    for(var key in Prices) {
        if(key === selectedDevice) inPrices = true;
    }
    if(!inPrices) { newDevice = 'Other'; newType = selectedDevice.substring(4) + ' ' + newType; }
    var typeCount = 0;
    if('TypeCounts' in Admin && year in Admin.TypeCounts && newDevice in Admin.TypeCounts[year] && newType in Admin.TypeCounts[year][newDevice])
        typeCount = Admin.TypeCounts[year][newDevice][newType];
    db.ref("Admin/TypeCounts/" + year + "/" + newDevice).update({[newType] : typeCount + 1});

    ClearTemporary();
    window.location = "#ticket-" + ticketNumber;
}

function SaveToTemporaryInput(inputId) {
    TemporaryNewTicketInputs[inputId] = document.getElementById(inputId).value;
}

function SaveToTemporaryDevice(header, value) {
    TemporaryNewTicketDevice[header] = value;
}

function RestoreTemporary() {
    if(TemporaryNewTicketCustomOpen) {
        if(TemporaryNewTicketInputs['other-device'] != '' && TemporaryNewTicketInputs['other-device'] != undefined) selectedDevice = TemporaryNewTicketInputs['other-device'];
        if(TemporaryNewTicketInputs['other-type'] != '' && TemporaryNewTicketInputs['other-type'] != undefined) selectedType = TemporaryNewTicketInputs['other-type'];
        if(TemporaryNewTicketInputs['other-model'] != '' && TemporaryNewTicketInputs['other-model']) selectedModelNumber = TemporaryNewTicketInputs['other-model'];
        DrawOther();
    }
    else {
        if(TemporaryNewTicketDevice.Device != '' && TemporaryNewTicketDevice.Device != undefined) SelectDevice(TemporaryNewTicketDevice.Device);
        if(TemporaryNewTicketDevice.Type != '' && TemporaryNewTicketDevice.Type != undefined) {
            SelectType(TemporaryNewTicketDevice.Type);
            console.log(TemporaryNewTicketRepairs.length);
            for(var i = 0; i < TemporaryNewTicketRepairs.length; i++) document.getElementById(TemporaryNewTicketRepairs[i]).classList.add("selected");
            SelectColor(TemporaryNewTicketDevice.Color);
            for(var j = 0; j < TemporaryNewTicketCheckboxes.length; j++) document.getElementById(TemporaryNewTicketCheckboxes[j]).classList.add("selected");

        }
    }
    for(var key in TemporaryNewTicketInputs) {
        if(document.getElementById(key))document.getElementById(key).value = TemporaryNewTicketInputs[key];
    }
}

function ClearTemporary() {
    newTicketCustomer = -1;
    nameInputId = '';
    selectedDevice = '';
    selectedType = '';
    selectedColor = 'Black';
    selectedModelNumber = '';
    for (var key in TemporaryNewTicketInputs) delete TemporaryNewTicketInputs[key];
    for (var key in TemporaryNewTicketDevice) delete TemporaryNewTicketDevice[key];
    TemporaryNewTicketCustomOpen = false;
    TemporaryNewTicketRepairs = [];
    TemporaryNewTicketCheckboxes = [];
}