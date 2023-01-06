var CurrentTicket;
var CurrentCustomer;
var CurrentInvoices = {};
var ticketNumber;
var prevInput;
var popupInInput = false;
var paymentType;

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
    else {
        for (var key in CurrentInvoices) delete CurrentInvoices[key];
    }
    DrawTicketFunctions();          
}

function DrawTicketFunctions() {
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
    var date = DateConvert(true);
    var partObject = {};
    partObject["Description"] = CurrentTicket.Device + " " + CurrentTicket.Type + " " + CurrentTicket.Repairs[repairNum].Display;
    partObject["RepairNumber"] = repairNum;
    partObject["Ticket"] = parseInt(ticketNumber);
    partObject["Tracking"] = '';
    db.ref("Parts/" + date).update(partObject);
    db.ref("Tickets/" + ticketNumber + "/Repairs/" + repairNum + "/Ordered").set("Ordered");
    db.ref("Tickets/" + ticketNumber + "/Repairs/" + repairNum + "/OrderDate").set(DateConvert());
    document.getElementById("part-order-" + repairNum).classList.add("ordered");
    document.getElementById("part-order-" + repairNum).innerHTML = "Part Ordered";
    MessageCenter(`Added ${partObject["Description"]} to Parts List`, 4);
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
    if(element.id == "DiscountPercent") {
        if(element.value > 100) element.value = 100;
    }
    CurrentTicket.Repairs[repairNum][element.id] = parseFloat(element.value);
    db.ref("Tickets/" + ticketNumber + "/Repairs/" + repairNum + "/" + element.id).set(parseFloat(element.value));
    document.getElementById("ticket-single-price-" + repairNum).innerHTML = "$" + parseInt(CurrentTicket.Repairs[repairNum].Price);
    
    DrawTicketPaymentSummary();
}

function RefundInvoice(invoiceNumber) {
    if(confirm("Refund this invoice?") == true) {
        var amount = CurrentInvoices[invoiceNumber].Amount * -1;
        var invoiceDate = DateConvert(true);
        var year = invoiceDate.substring(0,4);
        var month = invoiceDate.substring(4,6);
        var day = invoiceDate.substring(6, 8);
        invoiceDate = parseInt(invoiceDate);
        var invoiceObject;
        invoiceObject = { Amount : amount, FullDate : invoiceDate, Ticket : parseInt(ticketNumber), Type : CurrentInvoices[invoiceNumber].Type, Customer: CurrentTicket.Customer, Refunded : true };
        db.ref("Invoices/" + year + "/" + month + "/" + day + "/" + Admin.CurrentInvoiceNumber).update(invoiceObject);
        db.ref("Customers/" + CurrentTicket.Customer + "/Invoices").update({[Admin.CurrentInvoiceNumber] : invoiceDate});
        CurrentInvoices[Admin.CurrentInvoiceNumber] = invoiceObject;
        CurrentInvoices[invoiceNumber].Refunded = true;
        
        var refundYear = CurrentInvoices[invoiceNumber].FullDate.toString().substring(0,4);
        var refundMonth = CurrentInvoices[invoiceNumber].FullDate.toString().substring(4,6);
        var refundDay = CurrentInvoices[invoiceNumber].FullDate.toString().substring(6,8);
        db.ref("Invoices/" + refundYear + "/" + refundMonth + "/" + refundDay + "/" + invoiceNumber + "/Refunded").set(true);
        var currentDaySales = 0;
        if("PaymentTotals" in Admin && year in Admin.PaymentTotals && month in Admin.PaymentTotals[year] && day in Admin.PaymentTotals[year][month]) {
            currentDaySales = Admin.PaymentTotals[year][month][day];
        }
        db.ref("Admin/PaymentTotals/" + year + "/" + month + "/" + day).set(currentDaySales + amount);
        db.ref("Tickets/" + ticketNumber + "/Invoices/" + Admin.CurrentInvoiceNumber).set(invoiceDate);
        if(CurrentTicket.hasOwnProperty('Invoices')) CurrentTicket.Invoices[Admin.CurrentInvoiceNumber] = invoiceDate;
        else CurrentTicket['Invoices'] = { [Admin.CurrentInvoiceNumber] : invoiceDate };
        AddInvoiceToRecent(Admin.CurrentInvoiceNumber);
        db.ref("Admin/CurrentInvoiceNumber").set(Admin.CurrentInvoiceNumber + 1);
        DrawTicketInvoices();
        DrawTicketPaymentSummary();
    }
}


/* Popup Pages */
function ClickToClosePopup(event) {
    if(event.target.id == "popup-page"  || event.target.id == "popup-x") {
        if(event.target.id == "popup-x") popupInInput = false;
        ClosePopup();
    }
}

function ClosePopup() {
    if(!popupInInput) {
        document.getElementById("popup-container").innerHTML = '';
        document.getElementById("popup-page").classList.add("hidden");
    }
    else popupInInput = false;
}

function CheckPopupEnter(event) {
    if(event.keyCode == 13) {
        if(event.target.id == "add-repair-desc") document.getElementById("add-repair-price").focus();
        else if(event.target.id == "add-repair-price") SubmitTicketAddRepair();
        else if(event.target.id == "add-repair-payment") {
            popupInInput = false;
            SubmitTicketAddPayment();
        }
        else if(event.target.id == "tracking-number") SubmitTrackingNumber();
    }
    else {
        if(document.getElementById(event.target.id + '-container')) document.getElementById(event.target.id + '-container').classList.remove("error");
    }
}

function TicketAddRepair() {
    document.getElementById("popup-page").classList.remove("hidden");
    var content = `
        <div class="popup-header">NEW REPAIR</div>
        <div id="add-repair-desc-container" class="popup-input-container">
            <div class="header">REPAIR DESCRIPTION<div class="popup-required">&nbsp;&nbsp;&nbsp;&nbsp;- Can't be Blank</div></div>
            <input id="add-repair-desc" placeholder="Repair Description *" onkeydown="CheckPopupEnter(event)">
        </div>
        <div class="popup-input-container small">
            <div class="header">PRICE</div>
            <input id="add-repair-price" type="number" class="small" placeholder="0.00" onfocus="this.value = ''" onkeydown="CheckPopupEnter(event)" value="0.00"
                onblur="if(this.value == '') this.value = '0.00'">
        </div>
        <div class="popup-input-container box-container">
            <div class="header">TAX</div>
            <button id="add-repair-tax" class="checkbox material-symbols-outlined selected" onclick="CheckboxToggle(this)"></button>
        </div>
        <div style="width: 100%; text-align: center;">
            <button id="other-apply-button" onclick="SubmitTicketAddRepair()">Apply</button>
        </div>
    `;
    document.getElementById("popup-container").innerHTML = content;
    document.getElementById("add-repair-desc").focus();
    popupInInput = true;
}

function SubmitTicketAddRepair() {
    if(document.getElementById("add-repair-desc").value == '') {
        document.getElementById("add-repair-desc-container").classList.add("error");
        document.getElementById("add-repair-desc").focus();
    }
    else {
        var hasTax = false;
        if(document.getElementById("add-repair-tax").classList.contains("selected")) hasTax = true;
        var repairObject = { DiscountDollar : 0, DiscountPercent : 0, Display : document.getElementById("add-repair-desc").value, 
            Price : parseFloat(document.getElementById("add-repair-price").value), Quantity : 1, Tax : hasTax };
        db.ref("Tickets/" + ticketNumber + "/Repairs/" + CurrentTicket.NextRepairNumber).update(repairObject);
        db.ref("Tickets/" + ticketNumber + "/NextRepairNumber").set(CurrentTicket.NextRepairNumber + 1);
        if('Repairs' in CurrentTicket) CurrentTicket.Repairs[CurrentTicket.NextRepairNumber] = repairObject;
        else CurrentTicket['Repairs'] = {[CurrentTicket.NextRepairNumber]: repairObject};
        CurrentTicket.NextRepairNumber++;
        popupInInput = false;
        ClosePopup();
        DrawTicketRepairs();
        DrawTicketPaymentSummary();
    }
}

function TicketAddPayment() {
    document.getElementById("popup-page").classList.remove("hidden");
    var content = `
        <div id="add-repair-payment-container" class="popup-input-container" style="width: 240px;">
            <div class="header">PAYMENT AMOUNT<div class="popup-required">&nbsp;&nbsp;&nbsp;&nbsp;invalid amount</div></div>
            <input id="add-repair-payment" type="number" placeholder="0.00" onfocus="if(this.value == '0.00') this.value = ''" onkeydown="CheckPopupEnter(event)" 
                onblur="if(this.value == '') this.value = '0.00'; popupInInput = false;" style="height: 80px; font-size: 28px; text-align: center;">
            <div style="font-size: 14px; font-weight: 500; text-align: center; width: 100%;">Amount Owed: $${CurrentTicket.Balance.toFixed(2)}</div>
        </div>
        <div class="popup-switch">
            <div id="ticket-add-payment-card" class="popup-switch-single selected" tabindex="0" onclick="TicketAddPaymentSwitch(this, 'Card')"><div>CARD</div>
                <div class="material-symbols-outlined">credit_card</div></div>
            <div id="ticket-add-payment-cash" class="popup-switch-single" tabindex="0" onclick="TicketAddPaymentSwitch(this, 'Cash')"><div>CASH</div>
                <div class="material-symbols-outlined">payments</div></div>
            <div id="ticket-add-payment-other" class="popup-switch-single" tabindex="0" onclick="TicketAddPaymentSwitch(this, 'Other')"><div>OTHER</div>
                <div class="material-symbols-outlined">shopping_bag</div></div>
        </div>
        <div style="display: flex; align-items: center; width: 240px;">
            <div style="font-size: 12px; font-weight: 700; padding-right: var(--inner-padding);">NOTE</div>
            <input id="reference-note" class="reference-input" placeholder=" ">
        </div>
        <div class="checkbox-container" style="font-size:14px; font-weight: 700; margin-top: var(--outer-padding);">COMPLETE TICKET
            <button id="complete-ticket" class="checkbox material-symbols-outlined selected" style="margin-left: var(--inner-padding)" onclick="CheckboxToggle(this)"></button>
        </div>
        <div style="width: 100%; text-align: center; margin-top: var(--inner-padding);">
            <button id="other-apply-button" onclick="SubmitTicketAddPayment()">Apply</button>
        </div>
    `;
    paymentType = 'Card';
    document.getElementById("popup-container").innerHTML = content;
    document.getElementById("add-repair-payment").focus();
    document.getElementById("add-repair-payment").value = CurrentTicket.Balance.toFixed(2);
    popupInInput = true;
}

function TicketAddPaymentSwitch(element, value) {
    var switches = document.getElementById("popup-container").getElementsByClassName("popup-switch-single");
    for(var i = 0; i < switches.length; i++) switches[i].classList.remove("selected");
    element.classList.add("selected");
    paymentType = value;
}

function SubmitTicketAddPayment() {
    var amount = document.getElementById("add-repair-payment").value;
    amount = parseFloat(amount);
    //amount = Math.floor(amount * 100) / 100;
    if(amount > 0 && amount <= CurrentTicket.Balance) {
        var invoiceDate = DateConvert(true);
        var year = invoiceDate.substring(0,4);
        var month = invoiceDate.substring(4,6);
        var day = invoiceDate.substring(6, 8);
        invoiceDate = parseInt(invoiceDate);
        var note = document.getElementById("reference-note").value;
        var invoiceObject;
        if(note == '') invoiceObject = { Amount : amount, FullDate : invoiceDate, Ticket : parseInt(ticketNumber), Type : paymentType, Customer: CurrentTicket.Customer, Refunded : false };
        else invoiceObject = { Amount : amount, FullDate : invoiceDate, Ticket : parseInt(ticketNumber), Type : paymentType, Note: note, Customer: CurrentTicket.Customer, Refunded : false };
        db.ref("Invoices/" + year + "/" + month + "/" + day + "/" + Admin.CurrentInvoiceNumber).update(invoiceObject);
        db.ref("Customers/" + CurrentTicket.Customer + "/Invoices").update({[Admin.CurrentInvoiceNumber] : invoiceDate});
        CurrentInvoices[Admin.CurrentInvoiceNumber] = invoiceObject;
        var currentDaySales = 0;
        if("PaymentTotals" in Admin && year in Admin.PaymentTotals && month in Admin.PaymentTotals[year] && day in Admin.PaymentTotals[year][month]) {
            currentDaySales = Admin.PaymentTotals[year][month][day];
        }
        db.ref("Admin/PaymentTotals/" + year + "/" + month + "/" + day).set(currentDaySales + amount);
        db.ref("Tickets/" + ticketNumber + "/Invoices/" + Admin.CurrentInvoiceNumber).set(invoiceDate);
        if(CurrentTicket.hasOwnProperty('Invoices')) CurrentTicket.Invoices[Admin.CurrentInvoiceNumber] = invoiceDate;
        else CurrentTicket['Invoices'] = { [Admin.CurrentInvoiceNumber] : invoiceDate };
        AddInvoiceToRecent(Admin.CurrentInvoiceNumber);
        db.ref("Admin/CurrentInvoiceNumber").set(Admin.CurrentInvoiceNumber + 1);
        if(document.getElementById("complete-ticket").classList.contains("selected")) {
            console.log("Got here");
            ApplyStatusChange(ticketNumber, 'Completed', CurrentTicket.Customer);
            document.getElementById(ticketNumber + "-dropdown").value = 'Completed';
        }
        ClosePopup();
        DrawTicketPaymentSummary();
        DrawTicketInvoices();
    }
    else {
        document.getElementById("add-repair-payment-container").classList.add("error");
        document.getElementById("add-repair-payment").focus();
    }
}

function TicketAddNote() {
    document.getElementById("popup-page").classList.remove("hidden");
    var content = `
        <div class="popup-header">NEW NOTE</div>
        <div class="popup-switch-note">
            <div id="tech-note" class="popup-switch-note-single selected" onclick="ChangeNoteType('tech-note')">Tech Note</div>
            <div id="invoice-note" class="popup-switch-note-single" onclick="ChangeNoteType('invoice-note')">Invoice Note</div>
        </div>
        <textarea id="add-note-contents" onfocus="ClearNoteError()"></textarea>
        <div style="width: 100%; text-align: center;">
            <button id="other-apply-button" onclick="AddTicketNote()">Apply</button>
        </div>
    `;
    document.getElementById("popup-container").innerHTML = content;
    document.getElementById("add-note-contents").focus();
    popupInInput = true;
}

function ChangeNoteType(id) {
    var singleNotes = document.getElementsByClassName("popup-switch-note-single");
    for(var i = 0; i < singleNotes.length; i++) singleNotes[i].classList.remove("selected");
    document.getElementById(id).classList.add("selected");
    popupInInput = false;
}

function AddTicketNote() {
    if(document.getElementById("add-note-contents").value == "") {
        document.getElementById("add-note-contents").placeholder = "* Can't be Blank.";
        document.getElementById("add-note-contents").classList.add("error");
    }
    else {
        var date = DateConvert(true);
        var type = "Tech Note";
        if(document.getElementById("invoice-note").classList.contains("selected")) type = "Invoice Note";
        var value = document.getElementById("add-note-contents").value;
        value = value.replace(/\n\r?/g, '<br />');
        CurrentTicket.Notes[date] = {Content : value, Type : type};
        db.ref("Tickets/" + ticketNumber + "/Notes/" + date).update({Content : value, Type : type});
        popupInInput = false;
        ClosePopup();
        DrawTicketNotes();
    }
}

function ClearNoteError() {
    document.getElementById("add-note-contents").classList.remove("error");
    document.getElementById("add-note-contents").placeholder = "";
}

function TicketEdit() {
    document.getElementById("popup-page").classList.remove("hidden");
    var content = `
        <div class="popup-header">EDIT TICKET</div>
        <div id="ticket-edit-device-container" class="popup-input-container">
            <div class="header">DEVICE<div class="popup-required">&nbsp;&nbsp;&nbsp;&nbsp;- Can't be Blank</div></div>
            <input id="ticket-edit-device" placeholder="Device *" value="${CurrentTicket.Device}" onkeydown="CheckPopupEnter(event)">
        </div>
        <div id="ticket-edit-type-container" class="popup-input-container">
            <div class="header">TYPE<div class="popup-required">&nbsp;&nbsp;&nbsp;&nbsp;- Can't be Blank</div></div>
            <input id="ticket-edit-type" placeholder="Device Type *" value="${CurrentTicket.Type}" onkeydown="CheckPopupEnter(event)">
        </div>`;
    for(var key in Settings.Tickets.Inputs) {
        var display = Settings.Tickets.Inputs[key].Display;
        if(Settings.Tickets.Inputs[key].Enabled) {
            content += `
            <div class="popup-input-container small">
                <div class="header">${display}</div>
                <input id="ticket-edit-inputs-${key}" class="small" placeholder="${display}" onkeydown="CheckPopupEnter(event)" value="${CurrentTicket[display]}">
            </div>
            `;
        }
    }    
    content += ` 
        <div style="width: 100%; text-align: center;">
            <button id="other-apply-button" onclick="SubmitEditTicket()">Apply</button>
        </div>
        <div style="text-align: center;"><div id="edit-ticket-delete" tabindex="0" onclick="DeleteTicket()">DELETE TICKET</div></div>
    `;
    document.getElementById("popup-container").innerHTML = content;
    document.getElementById("ticket-edit-device").focus();
    popupInInput = true;
}

function SubmitEditTicket() {
    if(document.getElementById("ticket-edit-device").value == "") document.getElementById("ticket-edit-device-container").classList.add("error");
    if(document.getElementById("ticket-edit-type").value == "") document.getElementById("ticket-edit-type-container").classList.add("error");
    if(document.getElementById("ticket-edit-device").value != "" && document.getElementById("ticket-edit-type").value != "") {
        db.ref("Tickets/" + ticketNumber + "/Device").set(document.getElementById("ticket-edit-device").value);
        db.ref("Tickets/" + ticketNumber + "/Type").set(document.getElementById("ticket-edit-type").value);
        CurrentTicket.Device = document.getElementById("ticket-edit-device").value;
        CurrentTicket.Type = document.getElementById("ticket-edit-type").value;
        for(var key in Settings.Tickets.Inputs) {
            var display = Settings.Tickets.Inputs[key].Display;
            if(Settings.Tickets.Inputs[key].Enabled) {
                db.ref("Tickets/" + ticketNumber + "/" + display).set(document.getElementById("ticket-edit-inputs-" + key).value);
                CurrentTicket[display] = document.getElementById("ticket-edit-inputs-" + key).value
            }
        }
        popupInInput = false;
        ClosePopup();
        
        var model = '';
        if(CurrentTicket.ModelNmbr != '' && CurrentTicket.ModelNmbr != undefined) model = `(${CurrentTicket.ModelNmbr})`;
        document.getElementById("ticket-details-header").innerHTML = `#${ticketNumber} - ${CurrentTicket.Device} ${CurrentTicket.Type}${model}`;
        DrawTicketDetails();
    }
}

async function DeleteTicket() {
    if(confirm("Delete this ticket?") == true) {
        // Remove ticket, remove from invoices, remove from customer, remove from open tickets, remove from recently closed tickets
        if('Invoices' in CurrentTicket) {
            for(var key in CurrentTicket.Invoices) {
                var year = CurrentTicket.Invoices[key].toString().substring(0,4);
                var month = CurrentTicket.Invoices[key].toString().substring(4,6);
                var day = CurrentTicket.Invoices[key].toString().substring(6, 8);
                await db.ref("Invoices/" + year + "/" + month + "/" + day + "/" + key + "/Ticket").remove();
            }
        }
        if(ticketNumber in OpenTickets) await db.ref("OpenTickets/" + ticketNumber).remove();
        if('RecentlyCompletedTickets' in Admin) {
            for(var key in Admin.RecentlyCompletedTickets) {
                if(Admin.RecentlyCompletedTickets[key] == parseInt(ticketNumber.toString() + CurrentTicket.Customer.toString())) 
                    await db.ref("Admin/RecentlyCompletedTickets/" + key).remove();
            }
        }
        await db.ref("Customers/" + CurrentTicket.Customer + "/Tickets/" + ticketNumber).remove();
        await db.ref("Tickets/" + ticketNumber).remove();
        var url = window.location.toString();
        url = url.split('#')[0];
        location.href = url + `#open-tickets`;
    }
}


/* Draw Page Information */

async function DrawTicketInvoices() {
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
                var color = 'var(--default)';
                var refund = `<div id="refund-${key}" class="invoice-refund-text" onclick="RefundInvoice(${key},${CurrentInvoices[key].FullDate.toString()})">Refund</div>`;
                if(CurrentInvoices[key].Refunded && CurrentInvoices[key].Amount >= 0) {
                    refund = `<div style="font-size: 10px; text-align: right; color: darkred;">REFUNDED</div>`;
                }
                else if(CurrentInvoices[key].Refunded && CurrentInvoices[key].Amount < 0) {
                    refund = '';
                    color = 'darkred';
                }
                
                content += `
                    <div style="display: flex; width: 100%; align-items:center; padding: var(--inner-padding) calc(100% / 20); gap: calc(100% / 20); color: ${color};">
                        <div onclick="PrintTicket(${ticketNumber}, 'Invoice', ${key})" class="material-symbols-outlined print-invoice" tabindex="0">print</div>
                        <div style="width: 24px;" class="material-symbols-outlined">${type}</div>
                        <div style="width: 84px; text-align: center;">${datePrinted}</div>
                        <div style="width: 80px; font-weight: 700; flex-grow: 1;">$${CurrentInvoices[key].Amount.toFixed(2)}</div>
                        ${refund}
                    </div>
                `;
            }
        }
    }

    document.getElementById("ticket-invoices-container").innerHTML = content;
}

function DrawTicketPaymentSummary() {
    var subTotal = 0, tax = 0, discounts = 0, payments = 0, total = 0;
    var taxRate = Settings.General.SalesTax / 100;

    for(var key in CurrentTicket.Repairs) {
        var currentSub = CurrentTicket.Repairs[key].Price * parseInt(CurrentTicket.Repairs[key].Quantity);
        subTotal += Math.round(currentSub * 100) / 100;
        var curDiscounts = CurrentTicket.Repairs[key].DiscountDollar + (currentSub - CurrentTicket.Repairs[key].DiscountDollar) * (CurrentTicket.Repairs[key].DiscountPercent / 100);
        discounts += Math.round(curDiscounts * 100) / 100;
        if(CurrentTicket.Repairs[key].Tax) tax += Math.round(((currentSub - curDiscounts) * taxRate) * 100) / 100;
    }
    if(CurrentInvoices != null) {
        for(var key in CurrentInvoices) payments += CurrentInvoices[key].Amount;
    }
    total = subTotal + tax - discounts - payments;
    if(total < 0) total = 0;
    total = Math.round(total * 100) / 100;
    db.ref("Tickets/" + ticketNumber + "/Balance").set(total);
    CurrentTicket.Balance = total;
    
    if(total > 0) {
        document.getElementById("payment-summary-header").innerHTML = `<h1>PAYMENT SUMMARY</h1>
            <button class="icon-box" onclick="TicketAddPayment()"><div class="material-symbols-outlined">add_card</div></button>`;
        document.getElementById("payment-summary-header").classList.remove("green");
        document.getElementById("payment-summary-header").classList.add("red");
    }
    else {
        document.getElementById("payment-summary-header").innerHTML = `<h1>PAYMENT SUMMARY</h1>
            <button class="icon-box" onclick="PrintTicket(${ticketNumber}, 'Receipt')"><div class="material-symbols-outlined">print</div></button>`;
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
        var partOrder = `<div id="part-order-${key}" class="ticket-part-text" tabindex="0" onclick="AddToPartOrder(${key}), event.stopPropagation()">Add to Parts</div>`;
        if(CurrentTicket.Repairs[key].Ordered == "Ordered") partOrder = `<div id="part-order-${key}" class="ticket-part-text ordered">Part Ordered</div>`;
        else if(CurrentTicket.Repairs[key].Ordered == "Received") partOrder = `<div id="part-order-${key}" class="ticket-part-text ordered">Part Received</div>`;
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
        var invoiceNote = "";
        if(CurrentTicket.Notes[key].Type == "Invoice Note") invoiceNote = " invoice";
        content += `
            <div class="ticket-note-container${invoiceNote}">
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
    var status = StatusDropdown(ticketNumber, CurrentTicket.Status, CurrentTicket.Customer);
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
                <h1 class="larger" style="align-items: flex-start;" id="ticket-details-header">#${ticketNumber} - ${CurrentTicket.Device} ${CurrentTicket.Type}${model}</h1>
                <button class="icon-box" onclick="PrintTicket(${ticketNumber}, 'CustomerTicket')"><div class="material-symbols-outlined" style="font-size: 28px;">print</div></button>
                <button class="icon-box" onclick="TicketEdit()"><div class="material-symbols-outlined" style="font-size: 28px;">edit_note</div></button>
                <div id="pdf-dropdown-container">
                    <button class="icon-box open-pdf" onclick="document.getElementById('pdf-dropdown-container').classList.toggle('open')">
                        <div class="material-symbols-outlined" style="font-size: 28px; margin-right: 0;">picture_as_pdf</div>
                        <div id="pdf-down-arrow" class="material-symbols-outlined" style="margin-right: 0;"></div>
                    </button>
                    <div id="pdf-dropdown">
                        <div class="pdf-dropdown-item" tabindex="0" onclick="PrintPDF()">PRINT INVOICE</div>
                        <div class="pdf-dropdown-item" tabindex="0" onclick="EmailPDF()">EMAIL INVOICE</div>
                        <div class="pdf-dropdown-item" tabindex="0" onclick="DownloadPDF()">DOWNLOAD INVOICE</div>
                    </div>
                </div>
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
                    <button class="icon-box" onclick="TicketAddNote()"><div class="material-symbols-outlined">add</div></button>
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
                        <button class="icon-box" onclick="TicketAddPayment()"><div class="material-symbols-outlined">shopping_cart</div></button>
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
    document.getElementById("frame").innerHTML = content;
    pageLoading = false;
}