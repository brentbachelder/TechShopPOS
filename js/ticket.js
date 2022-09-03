var CurrentTicket;
var CurrentCustomer;
var CurrentInvoices = {};
var ticketNumber;
var prevInput;
var popupInInput = false;

function InitTicket(num) {
    document.getElementById("page-title").innerHTML = "TICKET INFORMATION";
    document.getElementById("mobile-page-title").innerHTML = "TICKET INFORMATION";
    GetTicketInfo(num);
}

async function GetTicketInfo(num) {
    ticketNumber = num;
    await db.ref("Tickets/" + ticketNumber).once('value').then(snap => {
        CurrentTicket = snap.val();
    });
    await db.ref("Customers/" + CurrentTicket.Customer).once('value').then(snap => {
        CurrentCustomer = snap.val();
    });
    if('Invoices' in CurrentTicket) {
        for(var key in CurrentTicket.Invoices) {
            var invoiceDate = CurrentTicket.Invoices[key].toString();
            var year = invoiceDate.substring(0,4);
            var month = invoiceDate.substring(4,6);
            var day = invoiceDate.substring(6, 8);
            await db.ref("Invoices/" + year + "/" + month + "/" + day + "/" + key).once('value').then(snap => {
                CurrentInvoices[key] = snap.val();
            });
        }
    }
    DrawFunctions();          
}

function DrawFunctions() {
    DrawTicket();
    DrawTicketDetails();
    DrawCustomerDetails();
    DrawTicketNotes();
    DrawTicketRepairs();
    DrawTicketPaymentSummary();
    DrawTicketInvoices();
}

function TicketCheckboxToggle(element) {
    var id = element.id.replace('-checkbox', '');
    var undashed = id.replaceAll('-', ' ');
    element.classList.toggle("selected");
    if(element.classList.contains("selected")) db.ref("Tickets/" + ticketNumber + "/" + undashed).set(true);
    else db.ref("Tickets/" + ticketNumber + "/" + undashed).set(false);
}

function OpenTicketRepairDetails(element) {
    var opened = document.getElementsByClassName("ticket-repair-single");
    for(var i = 0; i < opened.length; i++) { if(opened[i] != element.parentElement) opened[i].classList.remove("open"); }
    element.parentElement.classList.toggle("open");
}

function TicketAddTax(element, repairNum) {
    CheckboxToggle(element);
    if(element.classList.contains("selected")) {
        db.ref("Tickets/" + ticketNumber + "/Repairs/" + repairNum + "/Tax").set(true);
        CurrentTicket.Repairs[repairNum].Tax = true;
        document.getElementById("taxex-" + repairNum).innerHTML = '+ tax';
    }
    else {
        db.ref("Tickets/" + ticketNumber + "/Repairs/" + repairNum + "/Tax").set(false);
        CurrentTicket.Repairs[repairNum].Tax = false;
        document.getElementById("taxex-" + repairNum).innerHTML = '';
    }
    DrawTicketPaymentSummary();
}

function AddToPartOrder(repairNum) {
    var date = DateConvert();
    var partObject = {};
    partObject["Description"] = CurrentTicket.Device + " " + CurrentTicket.Type + " " + CurrentTicket.Repairs[repairNum].Display;
    partObject["RepairNumber"] = repairNum;
    partObject["Status"] = "Not Ordered";
    partObject["Ticket"] = parseInt(ticketNumber);
    partObject["Tracking"] = '';
    db.ref("Parts/" + date).update(partObject);
    document.getElementById("part-order-" + repairNum).classList.add("ordered");
    document.getElementById("part-order-" + repairNum).innerHTML = "Part Ordered";
}

function RemoveRepair(repairNum) {
    db.ref("Tickets/" + ticketNumber + "/Repairs/" + repairNum).remove();
    delete CurrentTicket.Repairs[repairNum];
    DrawTicketRepairs();
    DrawTicketPaymentSummary();
}

function UpdateRepair(element, repairNum, isPrice = false) {
    if(element.value == '') element.value = prevInput;
    if(isPrice) {
        var fixed = parseFloat(element.value);
        fixed = fixed.toFixed(2);
        element.value = fixed;
    }
    else {
        var integer = parseInt(element.value);
        element.value = integer;
    }
    if(element.id == "Quantity") {
        var quant = '';
        if(element.value < 1) element.value = 1;
        else if (element.value > 1) quant = ` (x${element.value})`;
        document.getElementById("ticket-single-desc-" + repairNum).innerHTML = `${CurrentTicket.Repairs[repairNum].Display}${quant}`;
    }
    if(element.id == "DiscountDollar") {
        if(element.value > CurrentTicket.Repairs[repairNum].Price) element.value = CurrentTicket.Repairs[repairNum].Price.toFixed(2);
    }
    CurrentTicket.Repairs[repairNum][element.id] = parseFloat(element.value);
    db.ref("Tickets/" + ticketNumber + "/Repairs/" + repairNum + "/" + element.id).set(parseFloat(element.value));
    document.getElementById("ticket-single-price-" + repairNum).innerHTML = "$" + parseInt(CurrentTicket.Repairs[repairNum].Price);
    
    DrawTicketPaymentSummary();
}


/* Popup Pages */
function ClickToClosePopup(event) {
    if(event.target.id == "popup-page"  || event.target.id == "popup-x")  ClosePopup();
}

function ClosePopup() {
    if(!popupInInput) {
        document.getElementById("popup-container").innerHTML = '';
        document.getElementById("popup-page").classList.add("hidden");
    }
    else popupInInput = false;
}

function TicketAddRepair() {
    document.getElementById("popup-page").classList.remove("hidden");
    var content = `
        <div class="popup-header">NEW REPAIR</div>
        <div class="input-shell">
            <div class="input-container" id="repair-desc-container">
                <div class="miniput">
                    <div id="repair-desc-miniput" class="miniput-description">Repair Description</div>
                    <input type="text" id="repair-desc" placeholder="Repair Description *" onfocus="FocusPopupInput('repair-desc', 'Repair Description')" required>
                </div>
                <div class="x-input" onmousedown="ClearNewTicketInput('repair-desc')"><div class="material-symbols-outlined">close</div></div>
            </div>
        </div>
        <div class="input-shell" style="max-width: 50%;">
            <div class="input-container" id="repair-price-container">
                <div class="miniput">
                    <div id="repair-price-miniput" class="miniput-description">Price</div>
                    <input type="text" id="repair-price" placeholder="Price" onfocus="FocusPopupInput('repair-price', 'Price')">
                </div>
                <div class="x-input" onmousedown="ClearNewTicketInput('repair-price')"><div class="material-symbols-outlined">close</div></div>
            </div>
        </div>
    `;
    document.getElementById("popup-container").innerHTML = content;
    document.getElementById("repair-desc").focus();
    popupInInput = true;
}

function FocusPopupInput(id, miniText) {
    document.getElementById(id + "-container").classList.remove("error");
    document.getElementById(id + "-miniput").innerHTML = miniText;
    popupInInput = true;
}

function ClearPopupInput(id) {
    document.getElementById(id).value = '';
    setTimeout(function(){ document.getElementById(id).focus(); }, 1);
    popupInInput = true;
}


async function DrawTicketInvoices() {
    var content = '<div style="padding: var(--inner-padding); text-align: center;">(NO INVOICES)</div>';

    if(Object.keys(CurrentInvoices).length > 0) {
        content = '';
        for(var key in CurrentInvoices) {
            var type = 'shopping_bag';
            if(CurrentInvoices[key].Type == "Card") type = 'credit_card';
            else if(CurrentInvoices[key].Type == "Cash") type = 'payments';
            var date = CurrentInvoices[key].FullDate.toString();
            var datePrinted = date.substring(4,6) + "/" + date.substring(6, 8) + "/" + date.substring(2,4);
            var color = 'var(--default)';
            var refund = `<div id="refund-${key}" class="invoice-refund-text" onclick="RefundInvoice(${key})">Refund</div>`;
            if(CurrentInvoices[key].RefundAmount > 0) {
                refund = `<div style="font-size: 10px; text-align: right;">REFUNDED</div>`;
                color = 'darkred';
            }
            
            content += `
                <div style="display: flex; width: 100%; align-items:center; padding: var(--inner-padding) calc(100% / 20); gap: calc(100% / 20); color: ${color};">
                    <div style="width: 24px;" class="material-symbols-outlined">${type}</div>
                    <div style="width: 84px; text-align: center;">${datePrinted}</div>
                    <div style="width: 80px; font-weight: 700; flex-grow: 1;">$${CurrentInvoices[key].Amount.toFixed(2)}</div>
                    ${refund}
                </div>
            `;
        }
    }

    document.getElementById("ticket-invoices-container").innerHTML = content;
}

function DrawTicketPaymentSummary() {
    var subTotal = 0, tax = 0, discounts = 0, payments = 0, total=  0;
    var taxRate = Settings.General.SalesTax / 100;

    for(var key in CurrentTicket.Repairs) {
        currentSub = (parseFloat(CurrentTicket.Repairs[key].Price) * parseInt(CurrentTicket.Repairs[key].Quantity));
        subTotal += currentSub;
        discounts += CurrentTicket.Repairs[key].DiscountDollar + (currentSub - CurrentTicket.Repairs[key].DiscountDollar) * (CurrentTicket.Repairs[key].DiscountPercent / 100);
        if(CurrentTicket.Repairs[key].Tax) tax += (subTotal - discounts) * taxRate;
    }
    if(Object.keys(CurrentInvoices).length > 0) {
        for(var key in CurrentInvoices) {
            payments += CurrentInvoices[key].Amount - CurrentInvoices[key].RefundAmount;
        }
    }
    total = subTotal + tax - discounts - payments;
    if(total < 0) total = 0;
    
    if(total > 0) {
        document.getElementById("payment-summary-header").classList.remove("green");
        document.getElementById("payment-summary-header").classList.add("red");
    }
    else {
        document.getElementById("payment-summary-header").classList.remove("red");
        document.getElementById("payment-summary-header").classList.add("green");
    }

    var content = `
        <div style="font-size: 14px; font-weight: 700;">AMOUNT DUE</div>
        <div style="font-size: 24px; font-weight: 700;">$${total.toFixed(2)}</div>
        <div style="margin-top: var(--inner-padding); border-bottom: 1px solid var(--default);"></div>
        <div style="display: flex; width: 100%; padding-top: var(--inner-padding);">
            <div style="width: 50%; text-align: right; font-weight: 700;">Sub-Total:</div>
            <div style="width: 50%; text-align: left; padding-left: 14px;">$${subTotal.toFixed(2)}</div>
        </div>
        <div style="display: flex; width: 100%; padding-top: calc(var(--inner-padding) / 2);">
            <div style="width: 50%; text-align: right; font-weight: 700;">Discount:</div>
            <div style="width: 50%; text-align: left; padding-left: 14px;">$${discounts.toFixed(2)}</div>
        </div>
        <div style="display: flex; width: 100%; padding-top: calc(var(--inner-padding) / 2);">
            <div style="width: 50%; text-align: right; font-weight: 700;">Tax:</div>
            <div style="width: 50%; text-align: left; padding-left: 14px;">$${tax.toFixed(2)}</div>
        </div>
        <div style="display: flex; width: 100%; padding-top: calc(var(--inner-padding) / 2);">
            <div style="width: 50%; text-align: right; font-weight: 700;">Payments:</div>
            <div style="width: 50%; text-align: left; padding-left: 14px;">$${payments.toFixed(2)}</div>
        </div>
    `;
    document.getElementById("payment-summary-container").innerHTML = content;
}

function DrawTicketRepairs() {
    var content = '';
    for(var key in CurrentTicket.Repairs) {
        var quantity = '';
        if(CurrentTicket.Repairs[key].Quantity > 1) quantity = ` (x${CurrentTicket.Repairs[key].Quantity})`;
        var tax = '';
        var checkSelected = '';
        if(CurrentTicket.Repairs[key].Tax) { tax = '+ tax'; checkSelected = ' selected'; }
        var partOrder = `<div id="part-order-${key}" class="ticket-part-text" tabindex="0" onclick="AddToPartOrder(${key}), event.stopPropagation()">Add to Part Order</div>`;
        for(var part in Parts) {
            if(Parts[part].Ticket == ticketNumber && Parts[part].RepairNumber == key) partOrder = `<div id="part-order-${key}" class="ticket-part-text ordered">Part Ordered</div>`;
        }
        content += `
            <div class="ticket-repair-single">
                <button class="ticket-repair-single-text" onclick="OpenTicketRepairDetails(this)">    
                    <div id="ticket-single-desc-${key}" style="flex-grow: 1; font-size: 16px; overflow: hidden;">${CurrentTicket.Repairs[key].Display}${quantity}</div>
                    <div id="ticket-single-price-${key}" class="hide-me">$${Math.floor(CurrentTicket.Repairs[key].Price) * CurrentTicket.Repairs[key].Quantity}</div>
                    <div class="hide-me" id="taxex-${key}" style="width: 30px; font-size: 10px; text-align: center;">${tax}</div>
                    ${partOrder}
                    <div class="ticket-remove-text" tabindex="0" onclick="RemoveRepair(${key})">Remove</div>
                </button>
                <div class="ticket-repair-single-inputs-container">
                    <div style="width: 100%; display: flex; gap: var(--inner-padding); margin-bottom: var(--inner-padding); margin-left: var(--outer-padding);">    
                        <div class="ticket-repair-single-input">
                            <div>Price</div>
                            <input type="number" id="Price" style="width: 88px;" onfocus="prevInput = this.value" onblur="UpdateRepair(this, '${key}', true)" maxlength="7" 
                                onkeydown="OnEnterBlur(event)" value="${CurrentTicket.Repairs[key].Price.toFixed(2)}">
                        </div>
                        <div class="ticket-repair-single-input">
                            <div>Qty</div>
                            <input type="number" id="Quantity" style="width: 40px;" onfocus="prevInput = this.value" onblur="UpdateRepair(this, '${key}')" maxlength="1" 
                                onkeydown="OnEnterBlur(event)" value="${CurrentTicket.Repairs[key].Quantity}">
                        </div>
                        <div class="ticket-repair-single-input">
                            <div>Tax</div>
                            <button class="checkbox material-symbols-outlined${checkSelected}" onclick="TicketAddTax(this, ${key})"></button>
                        </div>
                    </div>
                    <div style="width: 100%; display: flex; margin-left: var(--outer-padding); gap: var(--outer-padding);">    
                        <div class="ticket-repair-single-input">
                            <div>Disc. $</div>
                            <input type="number" id="DiscountDollar" style="width: 88px;" onfocus="prevInput = this.value" onblur="UpdateRepair(this, '${key}', true)" 
                                maxlength="7" onkeydown="OnEnterBlur(event)" value="${CurrentTicket.Repairs[key].DiscountDollar.toFixed(2)}">
                        </div>
                        <div class="ticket-repair-single-input">
                            <div>Disc. %</div>
                            <input type="number" id="DiscountPercent" style="width: 60px;" onfocus="prevInput = this.value" onblur="UpdateRepair(this, '${key}')" maxlength="4" 
                                onkeydown="OnEnterBlur(event)" value="${CurrentTicket.Repairs[key].DiscountPercent}">
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    document.getElementById("ticket-repair-container").innerHTML = content;
}

function DrawTicketNotes() {
    var content = '';
    for(var key in CurrentTicket.Notes) {
        var ampm = 'am';
        var hour = key.substring(8,10);
        if(hour > 12) { ampm = 'pm'; hour -= 12; }
        if(hour == 12) ampm = 'pm';
        var date = key.substring(4,6) + "/" + key.substring(6,8) + "/" + key.substring(0,4) + " @ " + hour + ":" + key.substring(10,12) + " " + ampm;
        content += `
            <div class="ticket-note-container">
                <div class="ticket-note-header">
                    <div>${CurrentTicket.Notes[key].Type}</div>
                    <div>${date}</div>
                </div>
                <div class="ticket-note-content">${CurrentTicket.Notes[key].Content}</div>
            </div>
        `;
    }
    document.getElementById("ticket-notes").innerHTML = content;
}

function DrawCustomerDetails() {
    var content = '';
    for(var key in Settings.Customers.Inputs) {
        if(Settings.Customers.Inputs[key].Enabled && Settings.Customers.Inputs[key].Display != 'Name' && Settings.Customers.Inputs[key].Display != 'Full Name') {
            var display = Settings.Customers.Inputs[key].Display;
            var output = '(none)';
            if(CurrentCustomer[display] != '' && CurrentCustomer[display] != undefined) output = CurrentCustomer[display];
            content += `
                <div class="ticket-customer-description-single-container">
                    <div class="material-symbols-outlined">${Settings.Customers.Inputs[key].Icon}</div>
                    <div class="ticket-customer-description-single">${output}</div>
                </div>
            `;
        }
    }
    document.getElementById("ticket-customer-description").innerHTML = content;
}

function DrawTicketDetails() {
    var content = '';
    for(var key in Settings.Tickets.Inputs) {
        if(Settings.Tickets.Inputs[key].Enabled) {
            var inputName = Settings.Tickets.Inputs[key].Display;
            var inputResult = '(none)';
            if(CurrentTicket[inputName] != '' && CurrentTicket[inputName] != undefined) inputResult = CurrentTicket[inputName];
            content += `<div class="ticket-input-single"><b>${inputName.toUpperCase()} : </b>${inputResult}</div>`;
        }
    }
    document.getElementById("ticket-inputs-inputs").innerHTML = content;
    
    content = '';
    for(var key in Settings.Tickets.Checkboxes) {
        if(Settings.Tickets.Checkboxes[key].Enabled) {
            var selected = '';
            if(CurrentTicket[Settings.Tickets.Checkboxes[key].Display]) selected = ' selected';
            var dashed = Settings.Tickets.Checkboxes[key].Display.replaceAll(' ', '-');
            content += `
                <div class="checkbox-container ticket-input-single">
                    <button id="${dashed}-checkbox" class="checkbox material-symbols-outlined${selected}" onclick="TicketCheckboxToggle(this)"></button>
                    <div class="checkbox-text">${Settings.Tickets.Checkboxes[key].Display}</div>
                </div>
            `;
        }
    }
    document.getElementById("ticket-inputs-checkboxes").innerHTML = content;
    
    content = '';
    var status = StatusDropdown(ticketNumber, CurrentTicket.Status);
    content = `
        <div style="font-size: 14px; margin: 0 0 8px -50px;"><b>TICKET STATUS</b></div>
        ${status}
    `;
    document.getElementById("ticket-status").innerHTML = content;
}

function DrawTicket() {
    var model = '';
    if(CurrentTicket.ModelNmbr != '' && CurrentTicket.ModelNmbr != undefined) model = `(${CurrentTicket.ModelNmbr})`;
    var content = `
    
    <div class="container">
        <div class="object large">
            <header class="gray">
                <h1 class="larger">#${ticketNumber} - ${CurrentTicket.Device} ${CurrentTicket.Type}${model}</h1>
                <button class="icon-box" onclick="ClearNewTicketCustomer()"><div class="material-symbols-outlined">refresh</div></button>
            </header>
            <div class="ticket-details-container">
                <div id="ticket-inputs">
                    <div id="ticket-inputs-inputs" class="ticket-input-container"></div>
                    <div id="ticket-inputs-checkboxes" class="ticket-input-container" style="margin-top: var(--inner-padding);"></div>
                </div>
                <div id="ticket-status"></div>
            </div>
        </div>
        <div id="ticket-left-column">
            <div class="object large">
                <header class="gray">
                    <div style="width: 24px; height: 24px; border-radius: 12px; margin-left: var(--inner-padding); 
                        background-color: ${customerRatingColor[CurrentCustomer.Rating]};"></div>
                    <h1><b>${CurrentCustomer.Name}</b></h1>
                    <a class="icon-box" href="#customer-${CurrentTicket.Customer}"><div class="material-symbols-outlined">edit_square</div></a>
                </header>
                <div id="ticket-customer-description" style="padding: var(--inner-padding);"></div>
            </div>
            <div class="object large">
                <header class="gray">
                    <h1>NOTES</h1>
                    <button class="icon-box" onclick="ClearNewTicketCustomer()"><div class="material-symbols-outlined">add</div></button>
                </header>
                <div id="ticket-notes"></div>
            </div>
        </div>
        <div id="ticket-right-column">
            <div class="object large">
                 <header class="gray">
                    <h1>REPAIRS</h1>
                    <button class="icon-box" onclick="TicketAddRepair()"><div class="material-symbols-outlined">add</div></button>
                </header>
                <div id="ticket-repair-container"></div>
            </div>
            <div style="display: flex; width: 100%; flex-wrap: wrap; gap: var(--outer-padding);">
                <div class="object medium">
                    <header id="payment-summary-header" class="green">
                        <h1>PAYMENT SUMMARY</h1>
                        <button class="icon-box" onclick="ClearNewTicketCustomer()"><div class="material-symbols-outlined">shopping_cart</div></button>
                    </header>
                    <div id="payment-summary-container" style="padding: var(--inner-padding); text-align: center;"></div>
                </div>
                <div class="object medium">
                    <header class="yellow">
                        <h1 style="justify-content: center;">INVOICES</h1>
                    </header>
                    <div id="ticket-invoices-container""></div>
                </div>
            </div>
        </div>
        
    </div>
    <div id="popup-page" class="hidden" onclick="ClickToClosePopup(event)">
        <div id="popup-x" class="material-symbols-outlined">close</div>
        <div id="popup-container"></div>
    </div>
    `;
    $("#frame").html(content);
}