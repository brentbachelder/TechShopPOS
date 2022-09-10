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
    element.classList.toggle("selected");
    var selectedBoxes = document.getElementById("part-order-container").getElementsByClassName("checkbox");
    var counter = 0;

    for(var i = 0; i < selectedBoxes.length; i++) {
        if(selectedBoxes[i].classList.contains("selected")) counter++;
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

function EditTrackingNumber(key) {

}

function CopyTrackingNumber() {
    
}









function DrawIndividualParts() {
    var content = `
        <div id="part-order-header" class="part-order-single-container" style="font-size: 10px; font-weight: 700;">
            <div style="width: 40px;"></div>
            <div class="part-date">ORDER DATE</div>
            <div class="part-ticket">GO TO<br />TICKET</div>
            <div style="display: flex; flex: 1 0 0; min-width: 0; flex-wrap: wrap;">
                <div class="part-description" style="padding-left: var(--inner-padding)">DESCRIPTION</div>
                <div class="part-tracking-container">TRACKING #</div>
            </div>
        </div>
    `;
    for(var key in Parts) {
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

        content += `
            <div class="part-order-single-container">
                <div class="checkbox material-symbols-outlined" onclick="OpenTicketCheckbox(this)"></div>
                <div class="part-date">${month + '/' + day + '/' + year}</div>
                <a href="#ticket-${Parts[key].Ticket}" class="part-ticket material-symbols-outlined">exit_to_app</a>
                <div style="display: flex; flex: 1 0 0; min-width: 0; flex-wrap: wrap;">
                    <div class="part-description">${Parts[key].Description}</div>
                    <div class="part-tracking-container">
                        <div class="part-tracking-index">Tracking:&nbsp;&nbsp;</div>
                        ${tracking}
                    </div>
                </div>
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
                    <button id="part-delete-button" class="icon-box hidden"><div class="material-symbols-outlined">delete</div></button>
                    <button id="part-done-button" class="icon-box hidden"><div class="material-symbols-outlined">done</div></button>
                    <button class="icon-box"><div class="material-symbols-outlined">add</div></button>
                </header>
                <div id="part-order-container" style="padding: 0 var(--inner-padding) var(--inner-padding) var(--inner-padding)"></div>
            </div>
        </div>
    `;
    $("#frame").html(content);
}