var selectedTrackingNumber = 0;
var selectedCheckboxes = [];

function InitPartOrders() {
    document.getElementById("page-title").innerHTML = "PARTS";
    document.getElementById("mobile-page-title").innerHTML = "PARTS";
    DrawPartOrders();
    DrawIndividualParts();
}

function GetTrackingPage(trackingNum) {
    var returnAddress=`https://parcelsapp.com/en/tracking/${trackingNum}`;
    var usps = new RegExp("^[0-9]{4}[0-9]{4}[0-9]{4}[0-9]{4}[0-9]{4}[0-9]{2}");
    var ups = new RegExp("^1Z[A-Z0-9]{16}");
    var fedex = new RegExp("[0-9]{12}|100\d{31}|\d{15}|\d{18}|96\d{20}|96\d{32}");
    if(usps.test(trackingNum)) returnAddress = `https://tools.usps.com/go/TrackConfirmAction?qtc_tLabels1=${trackingNum}`;
    else if(ups.test(trackingNum)) returnAddress = `https://wwwapps.ups.com/WebTracking/track?track=yes&trackNums=${trackingNum}&requester=ST/trackdetails`;
    else if(fedex.test(trackingNum)) returnAddress = `https://www.fedex.com/fedextrack/?tracknumbers=${trackingNum}`;

    return returnAddress;
}

function OpenTicketCheckbox(element) {
    selectedCheckboxes = [];
    element.classList.toggle("selected");
    var selectedBoxes = document.getElementById("part-order-container").getElementsByClassName("checkbox");
    var counter = 0;

    for(var i = 0; i < selectedBoxes.length; i++) {
        if(selectedBoxes[i].classList.contains("selected")) {
            counter++;
            selectedCheckboxes.push(selectedBoxes[i].id);
        }
    }

    if(counter > 0) {
        document.getElementById("part-delete-button").classList.remove("hidden");
        document.getElementById("part-done-button").classList.remove("hidden");
    }
    else {
        document.getElementById("part-delete-button").classList.add("hidden");
        document.getElementById("part-done-button").classList.add("hidden");
    }
}

function CopyTrackingNumber(trackingNumber) {
    navigator.clipboard.writeText(trackingNumber);
    MessageCenter("Copied to Clipboard", 2);
}

function EditTrackingNumber(key) {
    selectedTrackingNumber = key;
    var val = "";
    if(Parts[key].Tracking != "" && Parts[key].Tracking != undefined) val = Parts[key].Tracking;
    document.getElementById("popup-page").classList.remove("hidden");
    var content = `
        <div class="popup-header">TRACKING NUMBER</div>
        <div id="tracking-number-container" class="popup-input-container">
            <input id="tracking-number" placeholder="Tracking Number" onkeydown="CheckPopupEnter(event)">
        </div>
        <div style="width: 100%; text-align: center;">
            <button id="other-apply-button" onclick="SubmitTrackingNumber()">Apply</button>
        </div>
    `;
    document.getElementById("popup-container").innerHTML = content;
    document.getElementById("tracking-number").focus();
    document.getElementById("tracking-number").value = val;
    popupInInput = true;
}

function SubmitTrackingNumber() {
    Parts[selectedTrackingNumber].Tracking = document.getElementById("tracking-number").value;
    db.ref("Parts/" + selectedTrackingNumber + "/Tracking").set(document.getElementById("tracking-number").value);
    popupInInput = false;
    ClosePopup();
    DrawIndividualParts();
}

function DeletePartOrders() {
    for(var i = 0; i < selectedCheckboxes.length; i++) {
        var repairNum = Parts[selectedCheckboxes[i]].RepairNumber;
        var ticketNum = Parts[selectedCheckboxes[i]].Ticket;

        if(ticketNum != '' && repairNum != '') {
            db.ref("Tickets/" + ticketNum + "/Repairs/" + repairNum + "/Ordered").set("Not Ordered");
            db.ref("Tickets/" + ticketNum + "/Repairs/" + repairNum + "/OrderDate").set('');
        }
        delete Parts[selectedCheckboxes[i]];
        db.ref("Parts/" + selectedCheckboxes[i]).remove();
    }
    DrawIndividualParts();
    document.getElementById("part-delete-button").classList.add("hidden");
    document.getElementById("part-done-button").classList.add("hidden");
}

function CompletePartOrders() {
    for(var i = 0; i < selectedCheckboxes.length; i++) {
        var repairNum = Parts[selectedCheckboxes[i]].RepairNumber;
        var ticketNum = Parts[selectedCheckboxes[i]].Ticket;

        if(ticketNum != '' && repairNum != '') db.ref("Tickets/" + ticketNum + "/Repairs/" + repairNum + "/Ordered").set("Received");

        delete Parts[selectedCheckboxes[i]];
        db.ref("Parts/" + selectedCheckboxes[i]).remove();
    }
    DrawIndividualParts();
    document.getElementById("part-delete-button").classList.add("hidden");
    document.getElementById("part-done-button").classList.add("hidden");
}

function NewPartOrder() {
    var dropdown = GetTicketDropDown();

    document.getElementById("popup-page").classList.remove("hidden");
    var content = `
        <div class="popup-header">NEW PART ORDER</div>
        <div id="new-part-desc-container" class="popup-input-container">
            <div class="header">DESCRIPTION<div class="popup-required">&nbsp;&nbsp;&nbsp;&nbsp;- Can't be Blank</div></div>
            <input id="new-part-desc" placeholder="Part" onkeydown="CheckPopupEnter(event)">
        </div>
        <div id="new-part-container" class="popup-input-container small">
            <div class="header">TICKET (optional)</div>
            ${dropdown}
        </div>
        <div style="width: 100%; text-align: center; margin-top: var(--inner-padding);">
            <button id="other-apply-button" onclick="SubmitNewPartOrder()">Apply</button>
        </div>
    `;
    document.getElementById("popup-container").innerHTML = content;
    document.getElementById("new-part-desc").focus();
    popupInInput = true;
}

function GetTicketDropDown() {
    var content = `<div class="selectdiv" style="margin:0"><label><select id="new-part-dropdown"><option value="" disabled selected>Ticket Number</option>`;
    for(var key in OpenTickets) {
        content += `<option value="${key}">#${key}</option>`;
    }
    content += '</select></label></div>';
    return content;
}

function SubmitNewPartOrder() {
    if(document.getElementById("new-part-desc").value == '') {
        document.getElementById("new-part-desc-container").classList.add("error");
        document.getElementById("new-part-desc").focus();
    }
    else {
        var date = DateConvert(true);
        var ticket = '';
        if(document.getElementById("new-part-dropdown").value != '') ticket = parseInt(document.getElementById("new-part-dropdown").value);
        var partObject = {Description : document.getElementById("new-part-desc").value, RepairNumber : '', 
            Ticket : ticket, Tracking : ''};
        if(Parts != null) Parts[date] = partObject;
        else Parts = {[date] : partObject};
        db.ref("Parts/" + date).update(partObject);
    
        popupInInput = false;
        ClosePopup();
        DrawIndividualParts();
    }
}

async function DrawIndividualParts() {
    
    var content = `
        <div id="part-order-header" class="part-order-single-container" style="font-size: 10px; font-weight: 700;">
            <div style="width: 40px;"></div>
            <div class="part-date"><b>ORDER DATE</b></div>
            <div style="display: flex; flex: 1 0 0; min-width: 0; flex-wrap: wrap;">
                <div class="part-description" style="padding-left: var(--inner-padding)">DESCRIPTION</div>
                <div class="part-tracking-container">TRACKING #</div>
            </div>
            <div style="width: 36px;"></div>
        </div>
    `;
    for(var key in Parts) {
        var name = '(POS Order)';
        if('Ticket' in Parts[key] && Parts[key].Ticket != '') {
            await db.ref("Tickets/" + Parts[key].Ticket).child('Customer').once('value').then(snap => { 
                var cust = snap.val();
                if(cust in Customers) name = Customers[cust].Name;
            });
        }
        else console.log("No ticket");
        
        var year = key.substring(0,4);
        var month = key.substring(4,6);
        var day = key.substring(6, 8);

        var tracking = `<div class="part-tracking-edit empty" onclick="EditTrackingNumber(${key})" tabindex="0">ADD TRACKING #</div>`;
        if(Parts[key].Tracking != "") {
            var trackingHref = GetTrackingPage(Parts[key].Tracking);
            tracking = `
                <a href="${trackingHref}" target="_blank" class="part-tracking">${Parts[key].Tracking}</a>
                <div class="part-tracking-edit" onclick="CopyTrackingNumber('${Parts[key].Tracking}')" tabindex="0">COPY</div>
                <div class="part-tracking-edit" onclick="EditTrackingNumber(${key})" tabindex="0">EDIT</div>
            `;
        }
        var ticket = `<div class="part-description"><div class="part-owner">${name}</div><div>${Parts[key].Description}</div></div>`;
        if(Parts[key].Ticket != '') ticket = `<a href="#ticket-${Parts[key].Ticket}" class="part-description">
            <div style="font-size: 12px; font-weight: 700;">${name}</div><div style="font-size: 14; font-weight: 500;">${Parts[key].Description}</div></a>`;
        content += `
            <div class="part-order-single-container">
                <div id="${key}" class="checkbox material-symbols-outlined" onclick="OpenTicketCheckbox(this)"></div>
                <div class="part-date">${month + '/' + day + '/' + year}</div>
                <div style="display: flex; flex: 1 0 0; min-width: 0; flex-wrap: wrap;">
                    ${ticket}
                    <div class="part-tracking-container">
                        <div class="part-tracking-index">Tracking:&nbsp;&nbsp;</div>
                        ${tracking}
                    </div>
                </div>
                <div class="part-tracking-icon material-symbols-outlined" onclick="EditTrackingNumber(${key})" tabindex="0">local_shipping</div>
            </div>
        `;
    }
    document.getElementById("part-order-container").innerHTML = content;
}

function DrawPartOrders() {
    var content = `
        <div class="container">
            <div class="object large">
                <header class="gray">
                    <h1>ORDER LIST </h1>
                    <button id="part-delete-button" class="icon-box hidden" onclick="DeletePartOrders()"><div class="material-symbols-outlined">delete</div></button>
                    <button id="part-done-button" class="icon-box hidden" onclick="CompletePartOrders()"><div class="material-symbols-outlined">done</div></button>
                    <button class="icon-box" onclick="NewPartOrder()"><div class="material-symbols-outlined">add</div></button>
                </header>
                <div id="part-order-container" style="padding: 0 var(--inner-padding) var(--inner-padding) var(--inner-padding)">
                    <div id="part-order-header" class="part-order-single-container" style="font-size: 10px; font-weight: 700;">
                        <div style="width: 40px;"></div>
                        <div class="part-date">ORDER DATE</div>
                        <div class="part-ticket">GO TO<br />TICKET</div>
                        <div style="display: flex; flex: 1 0 0; min-width: 0; flex-wrap: wrap;">
                            <div class="part-description" style="padding-left: var(--inner-padding)">DESCRIPTION</div>
                            <div class="part-tracking-container">TRACKING #</div>
                        </div>
                    </div>
                    <div class="default-none">- NO PART ORDERS -</div>
                </div>
            </div>
        </div>
        <div id="popup-page" class="hidden" onclick="ClickToClosePopup(event)">
            <div id="popup-x" class="material-symbols-outlined">close</div>
            <div id="popup-container"></div>
        </div>
    `;
    document.getElementById("frame").innerHTML = content;
    pageLoading = false;
}