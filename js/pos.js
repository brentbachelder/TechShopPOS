var posRepairs = {};
var posInvoices = {};
var balance = 0;

function InitPos() {
    document.getElementById("page-title").innerHTML = "POS / QUICK SALE";
    document.getElementById("mobile-page-title").innerHTML = "POS / QUICK SALE";
    for(var key in posRepairs) delete posRepairs[key];
    for(var key in posInvoices) delete posInvoices[key];
    balance = 0;
    DrawPOS();
    DrawPOSPaymentSummary();
}

function AddToPOS() {
    var display = document.getElementById("pos-item-input").value;
    var price = parseFloat(document.getElementById("pos-item-input-price").value);
    if(isNaN(price)) price = 0;
    var quantity = document.getElementById("pos-item-input-quantity").value;

    if(display != '') {
        document.getElementById("pos-item-container").classList.remove("error");
        if(quantity == '') quantity = 1;
        var tax = false;
        if(document.getElementById("pos-tax-checkbox").classList.contains("selected")) tax = true;
        var key = Object.keys(posRepairs).length;

        posRepairs[key] = {"Display" : display, "DiscountDollar" : 0, "DiscountPercent" : 0, "Price" : price, "Quantity" : quantity, "Tax" : tax };
        document.getElementById("pos-item-input").value = '';
        document.getElementById("pos-item-input-price").value = '0.00';
        document.getElementById("pos-item-input-quantity").value = '1';
        document.getElementById("pos-tax-checkbox").classList.add('selected');
        DrawPOSRepairs();
        DrawPOSPaymentSummary();
        document.getElementById("pos-item-input").focus();
    }
    else {
        document.getElementById("pos-item-container").classList.add("error");
        document.activeElement.blur();
    }
}

function RemoveRepairPOS(key) {
    delete posRepairs[key];
    DrawPOSRepairs();
}

function UpdatePOSRepair(element, repairNum, isPrice = false) {
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
        document.getElementById("ticket-single-desc-" + repairNum).innerHTML = `${posRepairs[repairNum].Display}${quant}`;
    }
    if(element.id == "DiscountDollar") {
        if(element.value > posRepairs[repairNum].Price) element.value = posRepairs[repairNum].Price.toFixed(2);
    }
    if(element.id == "DiscountPercent") {
        if(element.value > 100) element.value = 100;
    }
    posRepairs[repairNum][element.id] = parseFloat(element.value);
    document.getElementById("ticket-single-price-" + repairNum).innerHTML = "$" + parseInt(posRepairs[repairNum].Price);
    
    DrawPOSPaymentSummary();
}

function POSAddTax(element, repairNum) {
    CheckboxToggle(element);
    if(element.classList.contains("selected")) {
        posRepairs[repairNum].Tax = true;
        document.getElementById("taxex-" + repairNum).innerHTML = '+ tax';
    }
    else {
        posRepairs[repairNum].Tax = false;
        document.getElementById("taxex-" + repairNum).innerHTML = '';
    }
    DrawPOSPaymentSummary();
}

function CheckPopupEnterPOS(event) {
    if(event.keyCode == 13) {
        if(event.target.id == "pos-item-input") document.getElementById("pos-item-input-price").focus();
        else AddToPOS();
    }
    else if(event.keyCode == 27) document.activeElement.blur();
}

function ClearPOSError() {
    document.getElementById("pos-item-container").classList.remove("error");
}

function POSAddPayment() {
    document.getElementById("popup-page").classList.remove("hidden");
    var content = `
        <div id="add-repair-payment-container" class="popup-input-container" style="width: 240px;">
            <div class="header">PAYMENT AMOUNT<div class="popup-required">&nbsp;&nbsp;&nbsp;&nbsp;invalid amount</div></div>
            <input id="add-repair-payment" type="number" placeholder="0.00" onfocus="if(this.value == '0.00') this.value = ''" onkeydown="CheckPopupEnter(event)" 
                onblur="if(this.value == '') this.value = '0.00'; popupInInput = false;" style="height: 80px; font-size: 28px; text-align: center;">
            <div style="font-size: 14px; font-weight: 500; text-align: center; width: 100%;">Amount Owed: $${balance.toFixed(2)}</div>
        </div>
        <div class="popup-switch">
            <div id="ticket-add-payment-card" class="popup-switch-single selected" tabindex="0" onclick="POSAddPaymentSwitch(this, 'Card')"><div>CARD</div>
                <div class="material-symbols-outlined">credit_card</div></div>
            <div id="ticket-add-payment-cash" class="popup-switch-single" tabindex="0" onclick="POSAddPaymentSwitch(this, 'Cash')"><div>CASH</div>
                <div class="material-symbols-outlined">payments</div></div>
            <div id="ticket-add-payment-other" class="popup-switch-single" tabindex="0" onclick="POSAddPaymentSwitch(this, 'Other')"><div>OTHER</div>
                <div class="material-symbols-outlined">shopping_bag</div></div>
        </div>
        <div style="display: flex; align-items: center; width: 240px;">
            <div style="font-size: 12px; font-weight: 700; padding-right: var(--inner-padding);">NOTE</div>
            <input id="reference-note" class="reference-input" placeholder=" ">
        </div>
        <div style="width: 100%; text-align: center; margin-top: var(--outer-padding);">
            <button id="other-apply-button" onclick="SubmitPOSAddPayment()">Apply</button>
        </div>
    `;
    paymentType = 'Card';
    document.getElementById("popup-container").innerHTML = content;
    document.getElementById("add-repair-payment").focus();
    document.getElementById("add-repair-payment").value = balance.toFixed(2);
    popupInInput = true;
}

function POSAddPaymentSwitch(element, value) {
    var switches = document.getElementById("popup-container").getElementsByClassName("popup-switch-single");
    for(var i = 0; i < switches.length; i++) switches[i].classList.remove("selected");
    element.classList.add("selected");
    paymentType = value;
}

function SubmitPOSAddPayment() {
    var amount = document.getElementById("add-repair-payment").value;
    amount = parseFloat(amount);
    amount = Math.floor(amount * 100) / 100;
    if(amount > 0 && amount <= balance) {
        var invoiceDate = DateConvert(true);
        var year = invoiceDate.substring(0,4);
        var month = invoiceDate.substring(4,6);
        var day = invoiceDate.substring(6, 8);
        invoiceDate = parseInt(invoiceDate);
        var note = document.getElementById("reference-note").value;
        var invoiceObject;
        if(note == '') invoiceObject = { Amount : amount, FullDate : invoiceDate, Type : paymentType, Refunded : false };
        else invoiceObject = { Amount : amount, FullDate : invoiceDate, Type : paymentType, Note: note, Refunded : false };
        db.ref("Invoices/" + year + "/" + month + "/" + day + "/" + Admin.CurrentInvoiceNumber).update(invoiceObject);
        posInvoices[Admin.CurrentInvoiceNumber] = invoiceObject;
        var currentDaySales = 0;
        if("PaymentTotals" in Admin && year in Admin.PaymentTotals && month in Admin.PaymentTotals[year] && day in Admin.PaymentTotals[year][month]) {
            currentDaySales = Admin.PaymentTotals[year][month][day];
        }
        db.ref("Admin/PaymentTotals/" + year + "/" + month + "/" + day).set(currentDaySales + amount);
        AddInvoiceToRecent(Admin.CurrentInvoiceNumber);
        db.ref("Admin/CurrentInvoiceNumber").set(Admin.CurrentInvoiceNumber + 1);
        ClosePopup();
        DrawPOSPaymentSummary();
        DrawPOSInvoices();
    }
    else {
        document.getElementById("add-repair-payment-container").classList.add("error");
        document.getElementById("add-repair-payment").focus();
    }
}





async function DrawPOSInvoices() {
    var content = '<div style="padding: var(--inner-padding); text-align: center;">(no invoices)</div>';

    if(Object.keys(posInvoices).length > 0) {
        content = '';
        for(var key in posInvoices) {
            var type = 'shopping_bag';
            if(posInvoices[key].Type == "Card") type = 'credit_card';
            else if(posInvoices[key].Type == "Cash") type = 'payments';
            var date = posInvoices[key].FullDate.toString();
            var datePrinted = date.substring(4,6) + "/" + date.substring(6, 8) + "/" + date.substring(2,4);
            var color = 'var(--default)';
            var refund = `<div id="refund-${key}" class="invoice-refund-text" onclick="RefundInvoice(${key},${posInvoices[key].FullDate.toString()})">Refund</div>`;
            if(posInvoices[key].Refunded && posInvoices[key].Amount >= 0) {
                refund = `<div style="font-size: 10px; text-align: right; color: darkred;">REFUNDED</div>`;
            }
            else if(posInvoices[key].Refunded && posInvoices[key].Amount < 0) {
                refund = '';
                color = 'darkred';
            }
            
            content += `
                <div style="display: flex; width: 100%; align-items:center; padding: var(--inner-padding) calc(100% / 20); gap: calc(100% / 20); color: ${color};">
                    <div style="width: 24px;" class="material-symbols-outlined">${type}</div>
                    <div style="width: 84px; text-align: center;">${datePrinted}</div>
                    <div style="width: 80px; font-weight: 700; flex-grow: 1;">$${posInvoices[key].Amount.toFixed(2)}</div>
                    ${refund}
                </div>
            `;
        }
    }

    document.getElementById("pos-invoices-container").innerHTML = content;
}

function DrawPOSPaymentSummary() {
    var subTotal = 0, tax = 0, discounts = 0, payments = 0, total = 0;
    var taxRate = Settings.General.SalesTax / 100;

    for(var key in posRepairs) {
        var currentSub = posRepairs[key].Price * parseInt(posRepairs[key].Quantity);
        subTotal += Math.round(currentSub * 100) / 100;
        var curDiscounts = posRepairs[key].DiscountDollar + (currentSub - posRepairs[key].DiscountDollar) * (posRepairs[key].DiscountPercent / 100);
        discounts += Math.round(curDiscounts * 100) / 100;
        if(posRepairs[key].Tax) tax += Math.round(((currentSub - curDiscounts) * taxRate) * 100) / 100;
    }
    if(posInvoices != null) {
        for(var key in posInvoices) payments += posInvoices[key].Amount;
    }
    total = subTotal + tax - discounts - payments;
    if(total < 0) total = 0;
    total = Math.round(total * 100) / 100;
    balance = total;
    
    if(total > 0) {
        document.getElementById("payment-summary-header").innerHTML = `<h1>PAYMENT SUMMARY</h1>
            <button class="icon-box" onclick="POSAddPayment()"><div class="material-symbols-outlined">add_card</div></button>`;
        document.getElementById("payment-summary-header").classList.remove("green");
        document.getElementById("payment-summary-header").classList.add("red");
    }
    else {
        document.getElementById("payment-summary-header").innerHTML = '<h1>PAYMENT SUMMARY</h1>';
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
    document.getElementById("pos-payment-summary-container").innerHTML = content;
}

function DrawPOSRepairs() {
    var content = '';
    if(Object.keys(posRepairs).length == 0) content = '<div class="default-none">- NO REPAIRS ADDED -</div>';
    for(var key in posRepairs) {
        var quantity = '';
        if(posRepairs[key].Quantity > 1) quantity = ` (x${posRepairs[key].Quantity})`;
        var tax = '';
        var checkSelected = '';
        if(posRepairs[key].Tax) { tax = '+ tax'; checkSelected = ' selected'; }
        content += `
            <div class="ticket-repair-single">
                <button class="ticket-repair-single-text" onclick="OpenTicketRepairDetails(this)">    
                    <div id="ticket-single-desc-${key}" style="flex-grow: 1; font-size: 16px; overflow: hidden;">${posRepairs[key].Display}${quantity}</div>
                    <div id="ticket-single-price-${key}" class="hide-me">$${Math.floor(posRepairs[key].Price) * posRepairs[key].Quantity}</div>
                    <div class="hide-me" id="taxex-${key}" style="width: 30px; font-size: 10px; text-align: center;">${tax}</div>
                    <div class="ticket-remove-text" tabindex="0" onclick="RemoveRepairPOS(${key})">Remove</div>
                </button>
                <div class="ticket-repair-single-inputs-container">
                    <div style="width: 100%; display: flex; gap: var(--inner-padding); margin-bottom: var(--inner-padding); margin-left: var(--outer-padding);">    
                        <div class="ticket-repair-single-input">
                            <div>Price</div>
                            <input type="number" id="Price" style="width: 88px;" onfocus="prevInput = this.value" onblur="UpdatePOSRepair(this, '${key}', true)" maxlength="7" 
                                onkeydown="OnEnterBlur(event)" value="${posRepairs[key].Price.toFixed(2)}">
                        </div>
                        <div class="ticket-repair-single-input">
                            <div>Qty</div>
                            <input type="number" id="Quantity" style="width: 40px;" onfocus="prevInput = this.value" onblur="UpdatePOSRepair(this, '${key}')" maxlength="1" 
                                onkeydown="OnEnterBlur(event)" value="${posRepairs[key].Quantity}">
                        </div>
                        <div class="ticket-repair-single-input">
                            <div>Tax</div>
                            <button class="checkbox material-symbols-outlined${checkSelected}" onclick="POSAddTax(this, ${key})"></button>
                        </div>
                    </div>
                    <div style="width: 100%; display: flex; margin-left: var(--outer-padding); gap: var(--outer-padding);">    
                        <div class="ticket-repair-single-input">
                            <div>Disc. $</div>
                            <input type="number" id="DiscountDollar" style="width: 88px;" onfocus="prevInput = this.value" onblur="UpdatePOSRepair(this, '${key}', true)" 
                                maxlength="7" onkeydown="OnEnterBlur(event)" value="${posRepairs[key].DiscountDollar.toFixed(2)}">
                        </div>
                        <div class="ticket-repair-single-input">
                            <div>Disc. %</div>
                            <input type="number" id="DiscountPercent" style="width: 60px;" onfocus="prevInput = this.value" onblur="UpdatePOSRepair(this, '${key}')" maxlength="4" 
                                onkeydown="OnEnterBlur(event)" value="${posRepairs[key].DiscountPercent}">
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    document.getElementById("pos-repair-container").innerHTML = content;
}

function DrawPOS() {
    var content = `
    
    <div class="container">
        <div class="object medium">
            <header class="gray">
                <h1>SALE ITEM</h1>
            </header>
            <div id="pos-sale-container" style="padding: var(--outer-padding); display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%;">
                <div id="pos-item-container" style="width: 100%; max-width: 300px;">
                    <div style="font-size: 10px; font-weight: 700; padding: 0 0 6px var(--inner-padding); width: 100%; display: flex;">
                        ITEM DESCRIPTION
                        <div class="pos-item-input-error">* CAN'T BE BLANK</div>
                    </div>
                    <input id="pos-item-input" class="pos-input" placeholder="Item Name or SKU" onkeydown="CheckPopupEnterPOS(event)" onfocus="ClearPOSError()">
                </div>
                <div style="width: 100%; max-width: 300px; padding-top: var(--inner-padding); display: flex; gap: var(--inner-padding); align-items: center;">
                    <div style="flex: 2 1 0;">
                        <div style="font-size: 10px; font-weight: 700; padding: 0 0 6px var(--inner-padding);">PRICE</div>
                        <input id="pos-item-input-price" type="number" style="text-align: center;" class="pos-input" onkeydown="CheckPopupEnterPOS(event)"
                            onfocus="if(this.value == 0) this.value = ''" onblur="if(this.value == '') this.value = '0.00'" value="0.00">
                    </div>
                    <div style="flex: 1 1 0; text-align: center;">
                        <div style="font-size: 10px; font-weight: 700; padding-bottom: 6px;">QUANTITY</div>
                        <input id="pos-item-input-quantity" type="number" style="text-align: center; border: 2px solid var(--default)" class="pos-input" placeholder="1" value="1">
                    </div>
                    <div style="flex: 1 1 0; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                        <div style="font-size: 10px; font-weight: 700; padding-bottom: 6px;">TAX</div>
                        <button id="pos-tax-checkbox" class="checkbox material-symbols-outlined selected" onclick="CheckboxToggle(this, true)"></button>
                    </div>
                </div>
                <div style="width: 100%; text-align: center; margin-top: var(--outer-padding);">
                    <button onclick="AddToPOS()">Add to Ticket</button>
                </div>
            </div>
        </div>
        <div class="object medium" id="pos-repair">
                <header class="gray">
                <h1>ITEMS</h1>
            </header>
            <div id="pos-repair-container"><div class="default-none" >- NO ITEMS ADDED -</div></div>
        </div>
        <div class="object medium">
            <header id="payment-summary-header" class="green">
                <h1>PAYMENT SUMMARY</h1>
                <button class="icon-box" onclick="POSAddPayment()"><div class="material-symbols-outlined">shopping_cart</div></button>
            </header>
            <div id="pos-payment-summary-container" style="padding: var(--inner-padding); text-align: center;"></div>
        </div>
        <div class="object medium">
            <header class="yellow">
                <h1 style="justify-content: center;">INVOICES</h1>
            </header>
            <div id="pos-invoices-container""><div class="default-none" >- NO INVOICES -</div></div>
        </div>
    </div>
    <div id="popup-page" class="hidden" onclick="ClickToClosePopup(event)">
        <div id="popup-x" class="material-symbols-outlined">close</div>
        <div id="popup-container"></div>
    </div>
    `;
    $("#frame").html(content);
    pageLoading = false;
}