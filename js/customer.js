var customerNumber;
var rememberedInput = '';

function InitCustomer(customerNum) {
    customerNumber = customerNum;
    document.getElementById("page-title").innerHTML = "CUSTOMER INFORMATION";
    document.getElementById("mobile-page-title").innerHTML = "CUSTOMER INFORMATION";
    GetCustomerInfo(customerNum);
}

async function GetCustomerInfo() {
    await db.ref("Customers/" + customerNumber).once('value').then(snap => {
        CurrentCustomer = snap.val();
    });

    if(CurrentCustomer != null && 'Invoices' in CurrentCustomer) {
        for(var key in CurrentCustomer.Invoices) {
            var invoiceDate = CurrentCustomer.Invoices[key].toString();
            var year = invoiceDate.substring(0,4);
            var month = invoiceDate.substring(4,6);
            var day = invoiceDate.substring(6, 8);
            await db.ref("Invoices/" + year + "/" + month + "/" + day + "/" + key).once('value').then(snap => {
                CurrentInvoices[key] = snap.val();
            });
        }
    }
    else {
        for (var key in CurrentInvoices) delete CurrentInvoices[key];
    }
    DrawCustomerFunctions();
}

function DrawCustomerFunctions() {
    DrawCustomer();
    DrawCustomerInfo();
    DrawCustomerRating();
    DrawCustomerSalesSummary();
    DrawCustomerInvoices();
    DrawCustomerTickets()
}

function AdjustCustomerRating() {
    var rating = document.getElementById("customer-rating-slider").value;
    document.getElementById("customer-rating-slider").classList.remove("one");
    document.getElementById("customer-rating-slider").classList.remove("two");
    document.getElementById("customer-rating-slider").classList.remove("four");
    document.getElementById("customer-rating-slider").classList.remove("five");
    var textRating = GetRatingNumberInText(rating);
    if(textRating != "") document.getElementById("customer-rating-slider").classList.add(textRating);

    //document.getElementById("customer-rating-circle").style.backgroundColor = customerRatingColor[rating];
    CurrentCustomer.Rating = rating;
    db.ref("Customers/" + customerNumber + "/Rating").set(rating);
}

function GetRatingNumberInText(rating) {
    if(rating == 1) return "one";
    else if(rating == 2) return "two";
    else if(rating == 4) return "four";
    else if(rating == 5) return "five";
    else return "";
}

function UpdateCustomerNote() {
    var note = document.getElementById("customer-note").value;
    CurrentCustomer["Note"] = note;
    if(note != '') db.ref("Customers/" + customerNumber + "/Note").set(note);
    else db.ref("Customers/" + customerNumber + "/Note").remove();
}

function RememberCustomerInput(id) {
    rememberedInput = document.getElementById(id).value;
}

function UpdateCustomerInput(id, required = false) {
    var undashed = id.replaceAll('-', ' ');
    if(required && document.getElementById(id).value == '') document.getElementById(id).value = rememberedInput;
    var text = document.getElementById(id).value;
    CurrentCustomer[undashed] = text;
    if(text != '') db.ref("Customers/" + customerNumber + "/" + undashed).set(text);
    else db.ref("Customers/" + customerNumber  + "/" + undashed).remove();
}





function DrawCustomerTickets() {
    var content = '<div style="padding: var(--inner-padding); text-align: center;">(no tickets)</div>';

    if('Tickets' in CurrentCustomer && Object.keys(CurrentCustomer.Tickets).length > 0) {
        content = '';
        var sorted = GetDescending(CurrentCustomer.Tickets);
        for(var outer in sorted) {
            for(var key in sorted[outer]) {
                content += `<a href="#ticket-${key}" class="customer-ticket-container">
                    <div class="customer-ticket-link">#${key}</div>
                    <div style="flex-grow: 1">${CurrentCustomer.Tickets[key]}</div>
                </a>`;
            }
        }
    }

    document.getElementById("customer-tickets-container").innerHTML = content;
}

function DrawCustomerInvoices() {
    var content = '<div style="padding: var(--inner-padding); text-align: center;">(no invoices)</div>';

    if(Object.keys(CurrentInvoices).length > 0) {
        content = '';
        var sorted = GetDescending(CurrentInvoices);
        for(var outer in sorted) {
            for(var key in sorted[outer]) {
                var type = 'shopping_bag';
                if(CurrentInvoices[key].Type == "Card") type = 'credit_card';
                else if(CurrentInvoices[key].Type == "Cash") type = 'payments';
                var date = CurrentInvoices[key].FullDate.toString();
                var datePrinted = date.substring(4,6) + "/" + date.substring(6, 8) + "/" + date.substring(2,4);
                var note = '';
                if("Note" in CurrentInvoices[key] && CurrentInvoices[key].Note != '') note = `&nbsp;&nbsp(${CurrentInvoices[key].Note})`;
                var ticket = `<div class="customer-invoice-link"></div>`;
                if('Ticket' in CurrentInvoices[key]) ticket = `<a href="#ticket-${CurrentInvoices[key].Ticket}" class="customer-invoice-link">#${CurrentInvoices[key].Ticket}</a>`;
                
                content += `
                    <div style="display: flex; width: 100%; align-items:center; padding: var(--inner-padding) calc(100% / 20); gap: calc(100% / 20); color: var(--default);">
                        <div onclick="PrintTicket(${CurrentInvoices[key].Ticket}, 'Invoice', ${key})" class="material-symbols-outlined print-invoice" tabindex="0">print</div>
                        <div style="width: 24px;" class="material-symbols-outlined">${type}</div>
                        <div style="width: 84px; text-align: center;">${datePrinted}</div>
                        <div style="width: 80px; flex-grow: 1;"><b>$${CurrentInvoices[key].Amount.toFixed(2)}</b>${note}</div>
                        ${ticket}
                    </div>
                `;
            }
        }
    }

    document.getElementById("customer-invoices-container").innerHTML = content;
}

function DrawCustomerSalesSummary() {
    var tickets = 0;
    if('Tickets' in CurrentCustomer) tickets = Object.keys(CurrentCustomer.Tickets).length;
    var sales = 0;
    if(CurrentInvoices != null) {
        for(var key in CurrentInvoices) sales += CurrentInvoices[key].Amount;
    }

    var content = `
        <div style="display: flex; width: 100%;">
            <div style="flex-grow: 1;">
                <div style="font-size: 14px; font-weight: 700;">TOTAL SALES</div>
                <div style="font-size: 24px; font-weight: 700;">$${sales.toFixed(2)}</div>
            </div>
            <div style="flex-grow: 1;">
                <div style="font-size: 14px; font-weight: 700;"># OF TICKETS</div>
                <div style="font-size: 24px; font-weight: 700;">${tickets}</div>
            </div>
        </div>
    `;

    document.getElementById("customer-sales-summary-container").innerHTML = content;
}

function DrawCustomerRating() {
    var note = '';
    var ratingText = GetRatingNumberInText(CurrentCustomer.Rating);
    if('Note' in CurrentCustomer) note = CurrentCustomer.Note;
    var content = `
        <div class="slider-container">
            <div style="width: 100%; display: flex; justify-content: space-between; align-items: center; padding: 8px;">
                <div class="slider-label">1</div>
                <div class="slider-label">2</div>
                <div class="slider-label">3</div>
                <div class="slider-label">4</div>
                <div class="slider-label">5</div>
            </diV>
            <div style="width: 100%; height: 24px; display: flex; justify-content: space-between; align-items: center; padding: 0 8px;">
                <div class="slider-notch"></div>
                <div class="slider-notch"></div>
                <div class="slider-notch"></div>
                <div class="slider-notch"></div>
                <div class="slider-notch"></div>
            </div>    
            <input type="range" id="customer-rating-slider" min="1" max="5" value="${CurrentCustomer.Rating}" class="slider ${ratingText}" step="1" list="ratingsettings" 
                oninput="AdjustCustomerRating()">
        </div>
        <div style="width: 100%; padding: 4%;">
            <div style="text-size: 12px; font-weight: 500; padding: calc(var(--inner-padding) / 2);">Customer Note:</div>
            <textarea id="customer-note" class="rating-note" placeholder="Customer Note" onblur="UpdateCustomerNote()">${note}</textarea>
        </div>
    `;

    document.getElementById("customer-rating-container").innerHTML = content;
}

function DrawCustomerInfo() {
    var content = '';

    for(var key in Settings.Customers.Inputs) {
        if(Settings.Customers.Inputs[key].Enabled) {
            var display = Settings.Customers.Inputs[key].Display;
            var dashed = display.replaceAll(' ', '-');
            var requiredStar = '';
            var focus =' onblur="UpdateCustomerInput(this.id)"';
            if(Settings.Customers.Inputs[key].Required) {
                focus = ' onfocus="RememberCustomerInput(this.id)" onblur="UpdateCustomerInput(this.id, true)"';
                requiredStar = ' *';
            }
            
            if(display != "Temp Phone" && display != "Address") {
                var result = '';
                if(CurrentCustomer[display] != undefined) result = CurrentCustomer[display];
                content += `
                <div style="display: flex; width: 100%; flex-wrap: wrap; padding: 0 5%; margin-bottom: calc(var(--inner-padding) / 2);">                   
                    <div style="display: flex; flex-direction: column; gap: 8px; width: 100%;">
                        <div style="font-size: 12px; font-weight: 700; width: 175px; padding-left: calc(var(--inner-padding) / 2);">${display}${requiredStar}</div>
                        <input id="${dashed}" class="customer-details-input" placeholder=" " onkeydown="OnEnterBlur(event)" value="${result}"${focus}>
                    </div>
                </div>
                `;
            }
            else if(display == "Address") {
                var address = '', city = '', state = '', zip = '';
                if(CurrentCustomer["Address"] != undefined) address = CurrentCustomer["Address"];
                if(CurrentCustomer["City"] != undefined) city = CurrentCustomer["City"];
                if(CurrentCustomer["State"] != undefined) state = CurrentCustomer["State"];
                if(CurrentCustomer["Zip"] != undefined) zip = CurrentCustomer["Zip"];
                content += `
                <div style="display: flex; width: 100%; flex-wrap: wrap; padding: 0 5%; margin-bottom: calc(var(--inner-padding) / 2);">                   
                    <div style="display: flex; flex-direction: column; gap: 8px; width: 100%;">
                        <div style="font-size: 12px; font-weight: 700; width: 175px; padding-left: calc(var(--inner-padding) / 2);">${display}${requiredStar}</div>
                        <input id="Address" class="customer-details-input" placeholder=" " onkeydown="OnEnterBlur(event)" value="${address}"${focus}>
                    </div>
                </div>
                <div style="display: flex; width: 100%; flex-wrap: wrap; gap: var(--inner-padding); padding: 0 5%; margin-bottom: calc(var(--inner-padding) / 2);">                   
                    <div style="display: flex; flex-direction: column; gap: 8px; flex: 1 0 0;">
                        <div style="font-size: 12px; font-weight: 700; width: 175px; padding-left: calc(var(--inner-padding) / 2);">City</div>
                        <input id="City" class="customer-details-input" placeholder=" " onkeydown="OnEnterBlur(event)" value="${city}" onblur="UpdateCustomerInput(this.id)">
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 8px; width: 84px;">
                        <div style="font-size: 12px; font-weight: 700; width: 175px; padding-left: calc(var(--inner-padding) / 2);">ST</div>
                        <input id="State" class="customer-details-input" placeholder=" " onkeydown="OnEnterBlur(event)" value="${state}" onblur="UpdateCustomerInput(this.id)">
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 8px; width: 160px;">
                        <div style="font-size: 12px; font-weight: 700; width: 175px; padding-left: calc(var(--inner-padding) / 2);">Zip</div>
                        <input id="Zip" class="customer-details-input" placeholder=" " onkeydown="OnEnterBlur(event)" value="${zip}" onblur="UpdateCustomerInput(this.id)">
                    </div>
                </div>
                `;
            }
        }
    }

    document.getElementById("customer-info-container").innerHTML = content;
}

function DrawCustomer() {
    var content = `
    
    <div class="container">
        <div id="ticket-left-column">
            <div class="object large">
                <header class="gray">
                    <h1>DETAILS</h1>
                    <button class="icon-box" onclick=""><div class="material-symbols-outlined">add</div></button>
                </header>
                <div id="customer-info-container" style="padding: var(--inner-padding); display: flex; flex-direction: column; gap: calc(var(--inner-padding) / 2);"></div>
            </div>
            <div class="object large">
                <header class="gray">
                    <!--<div id="customer-rating-circle" style="width: 24px; height: 24px; border-radius: 12px; margin-left: var(--inner-padding); 
                        background-color: ${customerRatingColor[CurrentCustomer.Rating]};"></div>-->
                    <h1>RATING</h1>
                    <button class="icon-box" onclick=""><div class="material-symbols-outlined">add</div></button>
                </header>
                <div id="customer-rating-container" style="padding: var(--inner-padding);"></div>
            </div>
            
        </div>
        <div id="ticket-right-column">
            <div style="display: flex; width: 100%; flex-wrap: wrap; gap: var(--outer-padding);">
                <div class="object medium">
                    <header class="green">
                        <h1 style="justify-content: center;">SALES SUMMARY</h1>
                    </header>
                    <div id="customer-sales-summary-container" style="padding: var(--inner-padding); text-align: center;"></div>
                </div>
                <div class="object large">
                    <header class="gray">
                        <h1>TICKETS</h1>
                        <button class="icon-box" onclick="NewTicketFromCustomerPage(${customerNumber})"><div class="material-symbols-outlined">add</div></button>
                    </header>
                    <div id="customer-tickets-container"></div>
                </div>
                <div class="object medium">
                    <header class="yellow">
                        <h1 style="justify-content: center;">INVOICES</h1>
                    </header>
                    <div id="customer-invoices-container""></div>
                </div>
            </div>    
        </div>
        
    </div>
    
    `;
    document.getElementById("frame").innerHTML = content;
    pageLoading = false;
}