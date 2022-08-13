var newTicketCustomer;
var nameInputId = '';
var selectedDevice = '';
var selectedType = '';
var selectedModelNumber = '';
var repairList = [];

function InitNewRepair() {
    newTicketCustomer = Admin.CurrentCustomerNumber;
    DrawNewRepair();
    DrawNewCustomerInputs();
    DrawDevices();
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
}

function ClearNewTicketInput(id) {
    document.getElementById(id).value = '';
    setTimeout(function(){ document.getElementById(id).focus(); }, 1);
}


function SelectNewTicketCustomer(id) {
    for(var key in Settings.Customers.Inputs) {
        inputName = Settings.Customers.Inputs[key].Display;
        if(Settings.Customers.Inputs[key].Enabled) {
            var dashed = Settings.Customers.Inputs[key].Display.replaceAll(' ', '-');
            if(document.getElementById(dashed) && Customers[id][inputName] != '' && Customers[id][inputName] != undefined) {
                document.getElementById(dashed).value = Customers[id][inputName];
            }
        }
    }
}

function ClearNewTicketCustomer() {
    var inputs = document.getElementById("input-customer-container").getElementsByTagName("input");
    for(var i = 0; i < inputs.length; i++) inputs[i].value = '';
    newTicketCustomer = Admin.CurrentCustomerNumber;
    document.getElementById(nameInputId).focus();
}



function SelectDevice(device) {
    selectedDevice = device;
    document.getElementById("new-repair-summary").classList.remove("error");
    document.getElementById("repair-information-error").classList.add("hidden");
    DrawTypes();
}

function SelectType(type) {
    selectedType = type;
    document.getElementById("new-repair-summary").classList.remove("error");
    document.getElementById("repair-information-error").classList.add("hidden");
    DrawRepairs();
    DrawNewCheckboxes();
    DrawNewCustomInputs();
}

function SelectRepair(repair) {
    document.getElementById("new-repair-summary").classList.remove("error");
    document.getElementById("repair-information-error").classList.add("hidden");
    document.getElementById(repair).classList.toggle("selected");
    if(document.getElementById(repair).classList.contains("selected")) repairList.push(repair);
    else {
        for( var i = 0; i < repairList.length; i++){ 
            if(repairList[i] == repair) repairList.splice(i, 1); 
        }
    }
    console.log(repairList);
}

function SubmitOtherRepair() {
    if(!document.getElementById("other-apply-button").classList.contains("disabled")) {
        if(selectedDevice == '') selectedDevice = "9999" + document.getElementById("other-device").value;
        if(selectedType == '') selectedType = "9999" + document.getElementById("other-type").value;
        selectedModelNumber = document.getElementById("other-model").value;
        document.getElementById("new-repair-summary").classList.remove("hidden");
        document.getElementById("input-repair-other").classList.add("hidden");
        document.getElementById("new-repair-summary").classList.remove("error");
        document.getElementById("repair-information-error").classList.add("hidden");
        DrawRepairs();
        DrawNewCheckboxes();
        DrawNewCustomInputs();
    }
}

function ClearNewTicketRepair() {
    selectedDevice = '';
    selectedType = '';
    repairList = [];
    document.getElementById("input-repair-device").classList.remove("hidden");
    document.getElementById("input-repair-type").classList.add("hidden");
    document.getElementById("new-repair-summary").classList.remove("hidden");
    document.getElementById("input-repair-other").classList.add("hidden");
    document.getElementById("input-repair-repairs").classList.add("hidden");
    if(document.getElementById("repairs-other")) document.getElementById("repairs-other").value = '';
    document.getElementById("new-ticket-checkboxes").classList.add("hidden");
    document.getElementById("new-ticket-custom-inputs").classList.add("hidden");
    document.getElementById("new-repair-summary").classList.remove("error");
    document.getElementById("repair-information-error").classList.add("hidden");
    DrawRepairSummary();
}


function CheckInputOther(event) {
    if(document.getElementById("other-device").value != "" && document.getElementById("other-type").value != "") {
        document.getElementById("other-apply-button").classList.remove("disabled");
        if(event.keyCode == 13) SubmitOtherRepair();
    }
    else {
        if(!document.getElementById("other-apply-button").classList.contains("disabled")) document.getElementById("other-apply-button").classList.add("disabled");
        if(event.keyCode == 13) document.activeElement.blur();
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
            var nameSearch = ''
            var nameSearchActions = ''
            if(display == "Name" || display == "Full Name") {
                nameInputId = dashed;
                nameSearch = '<div id="new-ticket-search-results"></div>';
                nameSearchActions = ' onblur="CloseSearchNT()" onkeydown="SearchKeyboardActionsNT(event)" onkeyup="SearchForCustomerNT(event)"'
            }
            
            content += `
                <div class="input-shell" style="">
                    <div class="input-container" id="${dashed}-container">
                        <div class="miniput">
                            <div id="${dashed}-miniput" class="miniput-description">${display}</div>
                            <input type="text" id="${dashed}" placeholder="${display}${requiredStar}"${nameSearchActions} onfocus="FocusCustomerInput(this.id)"${required}>
                        </div>
                        <div class="x-input" onmousedown="ClearNewTicketInput('${dashed}')"><div class="material-symbols-outlined">close</div></div>
                    </div>
                    ${nameSearch}
                </div>
            `;
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
    var content = '';
    for(var key in Prices) {
        content += `<button id="${key}" class="device" onclick="SelectDevice('${key}')">${key.substring(4)}</button>`;
    }
    content += `<button class="device" onclick="DrawOther()">Other</button>`;
    document.getElementById("input-repair-device").innerHTML = content;
}

function DrawTypes() {
    DrawRepairSummary();
    document.getElementById("input-repair-device").classList.add("hidden");
    document.getElementById("input-repair-other").classList.add("hidden");
    document.getElementById("input-repair-type").classList.remove("hidden");
    
    var content = '';
    for(var key in Prices[selectedDevice]) {
        content += `<button id="${key}" class="type" onclick="SelectType('${key}')">${key.substring(4)}</button>`;
    }
    content += `<button class="type" onclick="DrawOther(true)">Other</button>`;
    document.getElementById("input-repair-type").innerHTML = content;
}

function DrawRepairs() {
    DrawRepairSummary();
    document.getElementById("input-repair-type").classList.add("hidden");
    document.getElementById("input-repair-repairs").classList.remove("hidden");
    
    var content = '';
    if(Prices.hasOwnProperty(selectedDevice)) {
        if(Prices[selectedDevice].hasOwnProperty(selectedType)) {
            for(var key in Prices[selectedDevice][selectedType]) {
                content += `<button id="${key}" class="type" onclick="SelectRepair('${key}')">${key.substring(4)}</button>`;
            }
        }
        else content = GetPriceListWithDevice();
    }
    else content = GetPriceListNoDevice();
    content += `
        <div style="width: 100%; text-align: center; font-size: 14px; font-weight: 500">
            <input id="repairs-other" placeholder="Custom Repair" onkeydown="CheckInputRepair(event)">
        </div>`;
    
    document.getElementById("input-repair-repairs").innerHTML = content;
}

function DrawOther(deviceDone = false) {
    document.getElementById("input-repair-device").classList.add("hidden");
    document.getElementById("input-repair-type").classList.add("hidden");
    document.getElementById("new-repair-summary").classList.add("hidden");
    document.getElementById("input-repair-other").classList.remove("hidden");

    var content = `
        <div class="other-device-header">DEVICE</div>
        <input id="other-device" class="other-device-input" placeholder="Device" onkeydown="CheckInputOther(event)" value="${selectedDevice.substring(4)}">
        <div class="other-device-header">TYPE</div>
        <input id="other-type" class="other-device-input" placeholder="Type" onkeydown="CheckInputOther(event)" value="${selectedType.substring(4)}">
        <div class="other-device-header">MODEL NUMBER (optional)</div>
        <input id="other-model" class="other-device-input" placeholder="Model #" onkeydown="CheckInputOther(event)" value="${selectedModelNumber}">
        <button id="other-apply-button" class="disabled" onclick="SubmitOtherRepair()">Apply</button>
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
            content += `
                <div class="checkbox-container">
                    <button class="checkbox material-symbols-outlined" onclick="CheckboxToggle(this)"></button>
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
            content += `
            <div id="${Settings.Tickets.Inputs[key].Display}-container" class="other-device-input-container">
                <div class="other-device-header small">${Settings.Tickets.Inputs[key].Display}${requiredStar}</div>
                <input id="${Settings.Tickets.Inputs[key].Display}" class="other-device-input small" placeholder="${Settings.Tickets.Inputs[key].Display}" 
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
                    <div class="icon-box" onclick="ClearNewTicketCustomer()"><div class="material-symbols-outlined">refresh</div></div>
                </header>
                <div id="input-customer-container"></div>
            </div>
            <div class="object large nr">
                <header class="gray">
                    <h1>Repair Information<div id="repair-information-error" class="hidden"></div></h1>
                    <div class="icon-box" onclick="ClearNewTicketRepair()"><div class="material-symbols-outlined">refresh</div></div>
                </header>
                <div class="device-outline">
                    <div id="new-repair-summary"><b>Select Device</b></div>
                    <div id="input-repair-device" class="input-object"></div>
                    <div id="input-repair-type" class="input-object hidden"></div>
                    <div id="input-repair-repairs" class="input-object hidden"></div>
                    <div id="input-repair-other" class="input-object hidden"></div>
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