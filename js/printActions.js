function GetPrintPaymentStatus() {
    if(CurrentTicket.Balance == 0) return 'PAID - THANK YOU';
    else return '- NOT PAID -';
}

function GetPrintPaymentSummary() {
    if('Repairs' in CurrentTicket) {
        var subTotal = 0, discounts = 0, tax = 0, total = 0;
        var taxRate = Settings.General.SalesTax / 100;
        for(var key in CurrentTicket.Repairs) {
            var currentSub = CurrentTicket.Repairs[key].Price * parseInt(CurrentTicket.Repairs[key].Quantity);
            subTotal += Math.round(currentSub * 100) / 100;
            var curDiscounts = CurrentTicket.Repairs[key].DiscountDollar + (currentSub - CurrentTicket.Repairs[key].DiscountDollar) * (CurrentTicket.Repairs[key].DiscountPercent / 100);
            discounts += Math.round(curDiscounts * 100) / 100;
            if(CurrentTicket.Repairs[key].Tax) tax += Math.round(((currentSub - curDiscounts) * taxRate) * 100) / 100;
        }
    }
    total = subTotal + tax - discounts;
    var discountText = '';
    if(discounts > 0) discountText = `Discounts: $${discounts.toFixed(2)}<br />`;
    var content = `
        <div style="width: 100%; text-align: right; font-size: 10pt; font-weight: 500; line-height: 14pt;">
            Subtotal: $${subTotal.toFixed(2)}<br />${discountText}Tax: $${tax.toFixed(2)}<br />Total: $${total.toFixed(2)}
        </div>
    `;
    content += GetPrintSmallSpace();
    
    if(Object.keys(CurrentInvoices).length > 0) {
        var cardPayments = 0, cashPayments = 0, otherPayments = 0;
        for(var key in CurrentInvoices) {
            var type = 'shopping_bag';
            if(CurrentInvoices[key].Type == "Card") cardPayments += CurrentInvoices[key].Amount
            else if(CurrentInvoices[key].Type == "Cash") cashPayments += CurrentInvoices[key].Amount;
            else otherPayments += CurrentInvoices[key].Amount;
        }
    }
    var totalPaid = cardPayments + cashPayments + otherPayments;
    if(isNaN(totalPaid) || totalPaid == undefined) totalPaid = 0;
    var cardText = '';
    if(cardPayments > 0) cardText = `Card Payment: $${cardPayments.toFixed(2)}<br />`;
    var cashText = '';
    if(cashPayments > 0) cashText = `Cash Payment: $${cashPayments.toFixed(2)}<br />`;
    var otherText = '';
    if(otherPayments > 0) otherText = `Other Payment: $${otherPayments.toFixed(2)}<br />`;
    content += `
        <div style="width: 100%; text-align: right; font-size: 10pt; font-weight: 500; line-height: 14pt;">
            ${cardText}${cashText}${otherText}<b>Total Payment: $${totalPaid}</b>
        </div>
    `;

    return content;
}

function GetPrintRepairs() {
    var content = '<div class="print-repair-container"><div class="print-repair-desc">Description</div><div class="print-repair-qty">Qty</div><div class="print-repair-price">Price</div></div>';
    content += '<hr style="width: 100%;">';
    if('Repairs' in CurrentTicket) {
        for(var key in CurrentTicket.Repairs) {
            content += `
                <div class="print-repair-container">
                    <div class="print-repair-desc">${CurrentTicket.Type} ${CurrentTicket.Repairs[key].Display}</div>
                    <div class="print-repair-qty">${CurrentTicket.Repairs[key].Quantity}</div>
                    <div class="print-repair-price">$${CurrentTicket.Repairs[key].Price.toFixed(2)}</div>
                </div>
            `;
        }
    }
    return content;
}

function GetPrintTicketInfo() {
    var content = '';
    for(var key in Settings.Tickets.Inputs) {
        if(Settings.Tickets.Inputs[key].Enabled) {
            var display = Settings.Tickets.Inputs[key].Display;
            content += `${display}: `;
            if(display in CurrentTicket) content += `${CurrentTicket[display]}<br />`;
        }
    }
    for(var key in Settings.Tickets.Checkboxes) {
        if(Settings.Tickets.Checkboxes[key].Enabled) {
            var display = Settings.Tickets.Checkboxes[key].Display;
            content += `${display}: `;
            if(display in CurrentTicket && CurrentTicket[display] == true) content += 'yes<br />';
            else content += 'no<br />';
        }
    }
    return content;
}

function GetPrintCustomerInfo() {
    var content = '';
    if('Temp Phone' in CurrentTicket && CurrentTicket['Temp Phone'] != '') content = CurrentTicket['Temp Phone'] + ' (temp)<br />' + content;
    for(var key in Settings.Customers.Inputs) {
        if(Settings.Customers.Inputs[key].Enabled && Settings.Customers.Inputs[key].Display != "Name") {
            if(CurrentCustomer[Settings.Customers.Inputs[key].Display] != '' && CurrentCustomer[Settings.Customers.Inputs[key].Display] != undefined) {
                if(Settings.Customers.Inputs[key].Display == "Phone") content = CurrentCustomer.Phone + '<br />' + content;
                else content += `${CurrentCustomer[Settings.Customers.Inputs[key].Display]}<br />`;
            }
        }
    }

    return content;
}

function GetPrintStoreInfo() {
    return `${Settings.General.BusinessPhone}<br />${Settings.General.BusinessAddress}<br />
        ${Settings.General.BusinessCity}, ${Settings.General.BusinessState} ${Settings.General.BusinessZip}`;
}

function GetPrintDate() {
    return "Thu 10-06-22 11:09 AM";
}

function GetPrintBigSpace() {
    return '<div style="height: 34px;"></div>';
}

function GetPrintSmallSpace() {
    return '<div style="height: 16px;"></div>';
}

function OptionsToText(options, content) {
    var size = 0, bold = 'font-weight: 500;', italic = '', textAlign = '';
    if(options.charAt(0) == '1') size = 8;
    else if(options.charAt(0) == '2') size = 10;
    else if(options.charAt(0) == '4') size = 16;
    else if(options.charAt(0) == '5') size = 36;
    else size = 12;

    if(options.charAt(1) == '1') textAlign = 'text-align: left;';
    else if(options.charAt(2) == '1') textAlign = 'text-align: right;';
    else textAlign = 'text-align: center;';
    
    if(options.charAt(3) == '1') bold = 'font-weight: 700;';
    if(options.charAt(4) == '1') italic = ' font-style: italic;';
    
    return `<div style='${textAlign} font-size: ${size.toString()}pt; line-height: ${(size + 4).toString()}pt; ${bold}${italic}'>${content}</div>`;
}

function PrintTicket(ticketNum, ticketType) {
    var customerContent = '';
    if(ticketType == "Receipt") {
        customerContent += '<div style="text-align: center; font-size: 14pt; line-height: 18pt; font-weight: 500;">RECEIPT</div>';
        customerContent += GetPrintSmallSpace();
    }
    for(var key in Settings.Printing[ticketType]) {
        var value = Settings.Printing[ticketType][key];
        var display = value.split('-')[0];
        var options = value.split('-')[1];
        var inner = '';

        if(display == 'BigSpace') customerContent += GetPrintBigSpace();
        else if(display == 'SmallSpace') customerContent += GetPrintSmallSpace();
        else if(display == 'Repairs') customerContent += GetPrintRepairs();
        else if(display == 'PaymentSummary') customerContent += GetPrintPaymentSummary();
        else {
            if(display == 'TicketNumber') inner = '#' + ticketNum;
            else if(display == 'StoreName') inner = Settings.General.BusinessName;
            else if(display == 'StoreInfo') inner = GetPrintStoreInfo();
            else if(display == 'Date') inner = GetPrintDate();
            else if(display == 'CustomerName') inner = CurrentCustomer.Name;
            else if(display == 'CustomerInfo' && ticketType != "Receipt") inner = GetPrintCustomerInfo();
            else if(display == 'CustomerInfo' && ticketType == "Receipt") inner = CurrentCustomer.Phone;
            else if(display == 'RepairSummary') inner = "Repair Summary";
            else if(display == 'DeviceType') inner = CurrentTicket.Device + " " + CurrentTicket.Type + " - " + CurrentTicket.Color;
            else if(display == 'RepairDescription') inner = GetRepairDescription(CurrentTicket, true);
            else if(display == 'TicketInfo') inner = GetPrintTicketInfo();
            else if(display == 'Disclaimer') inner = Settings.General.WarrantyDisclaimer;
            else if(display =='PaymentStatus') inner = GetPrintPaymentStatus();
            customerContent += OptionsToText(options, inner);
        }
    }
    customerContent += GetPrintBigSpace();
    customerContent += '<hr>';

    var content = `
        <div class="receipt-printer">
            ${customerContent}
        </div>
    `;
    SendToPrinter(content);    
}

function PrintReceipt(ticketNum) {
    console.log("Printing receipt for ticket #" + ticketNum);
}

function PrintPDF() {
    document.getElementById("pdf-dropdown-container").classList.remove("open");
    console.log("Printing PDF");
}

function EmailPDF() {
    document.getElementById("pdf-dropdown-container").classList.remove("open");
    console.log("Emailing PDF");
}

function DownloadPDF() {
    document.getElementById("pdf-dropdown-container").classList.remove("open");
    console.log("Downloading PDF");
}

function SendToPrinter(contents) {
    var header = '<html><head><title>${document.title}</title><link rel="stylesheet" media="print" href="css/print.css" /></head><body>';
    var footer = '</body></html>'
    var frame1 = document.createElement('iframe');

    frame1.name = "frame1";
    frame1.style.position = "absolute";
    frame1.style.top = "-1000000px";
    document.body.appendChild(frame1);
    var frameDoc = frame1.contentWindow ? frame1.contentWindow : frame1.contentDocument.document ? frame1.contentDocument.document : frame1.contentDocument;
    
    frameDoc.document.open();
    frameDoc.document.write(header);
    frameDoc.document.write(contents);
    frameDoc.document.write(footer);
    frameDoc.document.close();
    
    setTimeout(function () {
        window.frames["frame1"].focus();
        window.frames["frame1"].print();
        document.body.removeChild(frame1);
    }, 500);
    return false;
}